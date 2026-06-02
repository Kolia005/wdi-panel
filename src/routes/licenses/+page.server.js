import { collections, ObjectId } from '$lib/server/db.js';
import { resolveRobloxUsers } from '$lib/server/roblox.js';
import { grantLicense, revokeLicense, bulkGrantByRoblox } from '$lib/server/actions.js';
import { fail } from '@sveltejs/kit';

const PAGE_SIZE = 30;

export const actions = {
	grant: async ({ request }) => {
		const fd = await request.formData();
		const res = await grantLicense(fd.get('clientId'), fd.get('productId'));
		return res.ok ? res : fail(400, res);
	},
	revoke: async ({ request }) => {
		const fd = await request.formData();
		const res = await revokeLicense(fd.get('whitelistId'));
		return res.ok ? res : fail(400, res);
	},
	bulkGrant: async ({ request }) => {
		const fd = await request.formData();
		const ids = String(fd.get('robloxIds') || '').split(/[\s,]+/).filter(Boolean);
		if (!ids.length) return fail(400, { ok: false, message: 'No Roblox IDs provided.' });
		const res = await bulkGrantByRoblox(ids, fd.get('productId'));
		return res.ok ? res : fail(400, res);
	}
};

export async function load({ url }) {
	const { whitelists, products } = await collections();
	const productFilter = (url.searchParams.get('product') || '').trim();
	const pageNum = Math.max(1, parseInt(url.searchParams.get('page') || '1'));

	const match = {};
	if (productFilter) {
		try {
			match.product = new ObjectId(productFilter);
		} catch {
			// ignore bad id
		}
	}

	const total = await whitelists.countDocuments(match);

	const rows = await whitelists
		.aggregate([
			{ $match: match },
			{ $sort: { created: -1 } },
			{ $skip: (pageNum - 1) * PAGE_SIZE },
			{ $limit: PAGE_SIZE },
			{ $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product' } },
			{ $lookup: { from: 'clients', localField: 'client', foreignField: '_id', as: 'client' } },
			{ $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
			{ $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
			{
				$project: {
					created: 1,
					productId: '$product._id',
					productName: { $ifNull: ['$product.name', '(deleted)'] },
					clientId: '$client._id',
					roblox: { $ifNull: ['$client.roblox', '(deleted)'] },
					discord: { $ifNull: ['$client.discord', '?'] }
				}
			}
		])
		.toArray();

	const allProducts = await products.find({}, { projection: { name: 1 } }).sort({ name: 1 }).toArray();
	const names = await resolveRobloxUsers(rows.map((r) => r.roblox));

	return {
		productFilter,
		page: pageNum,
		total,
		totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
		productList: allProducts.map((p) => ({ id: String(p._id), name: p.name })),
		licenses: rows.map((r) => ({
			id: String(r._id),
			productId: r.productId ? String(r.productId) : null,
			productName: r.productName,
			clientId: r.clientId ? String(r.clientId) : null,
			roblox: r.roblox,
			robloxName: names[String(r.roblox)]?.name || r.roblox,
			discord: r.discord,
			created: r.created
		}))
	};
}
