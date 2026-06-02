import { collections } from '$lib/server/db.js';

export async function load() {
	const { clients, products, whitelists } = await collections();

	const now = new Date();
	const dayAgo = new Date(now.getTime() - 24 * 3600 * 1000);
	const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

	const [
		clientCount,
		productCount,
		licenseCount,
		clientsThisWeek,
		licensesThisWeek,
		topProducts,
		recentLicenses
	] = await Promise.all([
		clients.countDocuments({}),
		products.countDocuments({}),
		whitelists.countDocuments({}),
		clients.countDocuments({ created: { $gte: weekAgo } }),
		whitelists.countDocuments({ created: { $gte: weekAgo } }),
		whitelists
			.aggregate([
				{ $group: { _id: '$product', count: { $sum: 1 } } },
				{ $sort: { count: -1 } },
				{ $limit: 8 },
				{
					$lookup: {
						from: 'products',
						localField: '_id',
						foreignField: '_id',
						as: 'product'
					}
				},
				{ $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
				{ $project: { count: 1, name: { $ifNull: ['$product.name', '(deleted product)'] } } }
			])
			.toArray(),
		whitelists
			.aggregate([
				{ $sort: { created: -1 } },
				{ $limit: 10 },
				{ $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product' } },
				{ $lookup: { from: 'clients', localField: 'client', foreignField: '_id', as: 'client' } },
				{ $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
				{ $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
				{
					$project: {
						created: 1,
						productName: { $ifNull: ['$product.name', '(deleted)'] },
						clientRoblox: { $ifNull: ['$client.roblox', '(deleted)'] },
						clientDiscord: { $ifNull: ['$client.discord', '?'] }
					}
				}
			])
			.toArray()
	]);

	// 14-day license growth series
	const growth = await whitelists
		.aggregate([
			{ $match: { created: { $gte: new Date(now.getTime() - 14 * 24 * 3600 * 1000) } } },
			{
				$group: {
					_id: { $dateToString: { format: '%Y-%m-%d', date: '$created' } },
					count: { $sum: 1 }
				}
			},
			{ $sort: { _id: 1 } }
		])
		.toArray();

	return {
		kpis: { clientCount, productCount, licenseCount, clientsThisWeek, licensesThisWeek },
		topProducts: topProducts.map((p) => ({ name: p.name, count: p.count })),
		recentLicenses: recentLicenses.map((r) => ({
			created: r.created,
			productName: r.productName,
			clientRoblox: r.clientRoblox,
			clientDiscord: r.clientDiscord
		})),
		growth
	};
}
