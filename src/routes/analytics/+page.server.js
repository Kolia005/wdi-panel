import { collections } from '$lib/server/db.js';

export async function load() {
	const { verifications, products } = await collections();

	const total = await verifications.countDocuments({});
	if (total === 0) {
		return { empty: true };
	}

	const now = new Date();
	const dayAgo = new Date(now.getTime() - 24 * 3600 * 1000);
	const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

	const [
		last24h,
		denied24h,
		piracy,
		volumeByDay,
		recentDenied,
		topProductsByChecks
	] = await Promise.all([
		verifications.countDocuments({ at: { $gte: dayAgo } }),
		verifications.countDocuments({ at: { $gte: dayAgo }, owns: false }),

		// PIRACY SIGNAL: per product, count DISTINCT placeIds that got DENIED (last 30d).
		// Many distinct unlicensed places = likely pirated copies running.
		verifications
			.aggregate([
				{ $match: { owns: false, placeId: { $nin: ['', '0', null] }, at: { $gte: new Date(now.getTime() - 30 * 24 * 3600 * 1000) } } },
				{ $group: { _id: { product: '$product', place: '$placeId' }, hits: { $sum: 1 } } },
				{ $group: { _id: '$_id.product', unlicensedPlaces: { $sum: 1 }, deniedChecks: { $sum: '$hits' } } },
				{ $sort: { unlicensedPlaces: -1 } },
				{ $limit: 15 }
			])
			.toArray(),

		// Verification volume per day (last 14d), split allow/deny
		verifications
			.aggregate([
				{ $match: { at: { $gte: new Date(now.getTime() - 14 * 24 * 3600 * 1000) } } },
				{
					$group: {
						_id: { d: { $dateToString: { format: '%Y-%m-%d', date: '$at' } }, owns: '$owns' },
						n: { $sum: 1 }
					}
				},
				{ $sort: { '_id.d': 1 } }
			])
			.toArray(),

		// recent denied checks (live piracy feed)
		verifications
			.find({ owns: false })
			.sort({ at: -1 })
			.limit(15)
			.toArray(),

		// busiest products by total checks (last 7d)
		verifications
			.aggregate([
				{ $match: { at: { $gte: weekAgo } } },
				{ $group: { _id: '$product', checks: { $sum: 1 }, denied: { $sum: { $cond: ['$owns', 0, 1] } } } },
				{ $sort: { checks: -1 } },
				{ $limit: 10 }
			])
			.toArray()
	]);

	// licensed-place counts per product (to contrast against unlicensed)
	const licensedPlaces = await verifications
		.aggregate([
			{ $match: { owns: true, placeId: { $nin: ['', '0', null] } } },
			{ $group: { _id: { product: '$product', place: '$placeId' } } },
			{ $group: { _id: '$_id.product', n: { $sum: 1 } } }
		])
		.toArray();
	const licMap = Object.fromEntries(licensedPlaces.map((l) => [l._id, l.n]));

	// merge volume by day into a clean series
	const days = {};
	for (const row of volumeByDay) {
		const d = row._id.d;
		if (!days[d]) days[d] = { day: d, allow: 0, deny: 0 };
		if (row._id.owns) days[d].allow += row.n;
		else days[d].deny += row.n;
	}

	return {
		empty: false,
		kpis: { total, last24h, denied24h },
		piracy: piracy.map((p) => ({
			product: p._id || '(unknown)',
			unlicensedPlaces: p.unlicensedPlaces,
			deniedChecks: p.deniedChecks,
			licensedPlaces: licMap[p._id] || 0
		})),
		volume: Object.values(days),
		recentDenied: recentDenied.map((r) => ({
			at: r.at,
			product: r.product,
			clientRoblox: r.clientRoblox,
			placeId: r.placeId,
			reason: r.reason
		})),
		topProducts: topProductsByChecks.map((t) => ({ product: t._id || '(unknown)', checks: t.checks, denied: t.denied }))
	};
}
