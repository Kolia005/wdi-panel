import { collections } from '$lib/server/db.js';
import { resolveGames } from '$lib/server/robloxGame.js';

export async function load() {
	const { verifications } = await collections();

	const total = await verifications.countDocuments({});
	if (total === 0) {
		return { empty: true };
	}

	const now = new Date();
	const dayAgo = new Date(now.getTime() - 24 * 3600 * 1000);
	const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
	const monthAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

	const [last24h, denied24h, volumeByDay, topProductsByChecks] = await Promise.all([
		verifications.countDocuments({ at: { $gte: dayAgo } }),
		verifications.countDocuments({ at: { $gte: dayAgo }, owns: false }),
		verifications
			.aggregate([
				{ $match: { at: { $gte: new Date(now.getTime() - 14 * 24 * 3600 * 1000) } } },
				{ $group: { _id: { d: { $dateToString: { format: '%Y-%m-%d', date: '$at' } }, owns: '$owns' }, n: { $sum: 1 } } },
				{ $sort: { '_id.d': 1 } }
			])
			.toArray(),
		verifications
			.aggregate([
				{ $match: { at: { $gte: weekAgo } } },
				{ $group: { _id: '$product', checks: { $sum: 1 }, denied: { $sum: { $cond: ['$owns', 0, 1] } } } },
				{ $sort: { checks: -1 } },
				{ $limit: 10 }
			])
			.toArray()
	]);

	// DETAILED PIRACY: per (product, place) where DENIED in last 30d — these are the suspect games.
	const suspects = await verifications
		.aggregate([
			{ $match: { owns: false, placeId: { $nin: ['', '0', null] }, at: { $gte: monthAgo } } },
			{
				$group: {
					_id: { product: '$product', place: '$placeId' },
					hits: { $sum: 1 },
					lastSeen: { $max: '$at' },
					placeOwner: { $last: '$placeOwner' }
				}
			},
			{ $sort: { hits: -1 } },
			{ $limit: 60 } // cap resolution work
		])
		.toArray();

	// Also: which places ARE licensed (to avoid false-flagging a place that also has legit checks)
	const licensedPlaces = new Set(
		(
			await verifications
				.aggregate([
					{ $match: { owns: true, placeId: { $nin: ['', '0', null] } } },
					{ $group: { _id: '$placeId' } }
				])
				.toArray()
		).map((r) => r._id)
	);

	// Resolve game names for all suspect places
	const games = await resolveGames(suspects.map((s) => s._id.place));

	// Build per-product piracy with named suspect games
	const byProduct = {};
	for (const s of suspects) {
		const prod = s._id.product || '(unknown)';
		const place = s._id.place;
		if (!byProduct[prod]) byProduct[prod] = { product: prod, suspects: [], totalDenied: 0 };
		byProduct[prod].suspects.push({
			placeId: place,
			hits: s.hits,
			lastSeen: s.lastSeen,
			alsoLicensed: licensedPlaces.has(place), // true = probably a real customer not yet linked
			game: games[place] || { placeId: place, name: null, creator: null, url: `https://www.roblox.com/games/${place}` }
		});
		byProduct[prod].totalDenied += s.hits;
	}

	const piracy = Object.values(byProduct)
		.map((p) => ({
			...p,
			unlicensedPlaces: p.suspects.filter((s) => !s.alsoLicensed).length
		}))
		.sort((a, b) => b.unlicensedPlaces - a.unlicensedPlaces);

	// volume series
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
		piracy,
		volume: Object.values(days),
		topProducts: topProductsByChecks.map((t) => ({ product: t._id || '(unknown)', checks: t.checks, denied: t.denied }))
	};
}
