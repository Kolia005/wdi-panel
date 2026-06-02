import { collections } from '$lib/server/db.js';
import { resolveRobloxUsers } from '$lib/server/roblox.js';
import { forceLink } from '$lib/server/actions.js';
import { fail } from '@sveltejs/kit';

const PAGE_SIZE = 25;

export const actions = {
	forcelink: async ({ request }) => {
		const fd = await request.formData();
		const res = await forceLink(fd.get('roblox'), fd.get('discord'));
		return res.ok ? res : fail(400, res);
	}
};

export async function load({ url }) {
	const { clients, whitelists } = await collections();
	const q = (url.searchParams.get('q') || '').trim();
	const pageNum = Math.max(1, parseInt(url.searchParams.get('page') || '1'));

	const showLink = url.searchParams.get('link') === '1';
	const filter = q
		? { $or: [{ roblox: { $regex: q, $options: 'i' } }, { discord: { $regex: q, $options: 'i' } }] }
		: {};

	const total = await clients.countDocuments(filter);
	const rows = await clients
		.find(filter)
		.sort({ created: -1 })
		.skip((pageNum - 1) * PAGE_SIZE)
		.limit(PAGE_SIZE)
		.toArray();

	// license counts per client (for the visible page)
	const ids = rows.map((r) => r._id);
	const counts = await whitelists
		.aggregate([{ $match: { client: { $in: ids } } }, { $group: { _id: '$client', n: { $sum: 1 } } }])
		.toArray();
	const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));

	// resolve roblox usernames for the page
	const names = await resolveRobloxUsers(rows.map((r) => r.roblox));

	return {
		q,
		showLink,
		page: pageNum,
		pageSize: PAGE_SIZE,
		total,
		totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
		clients: rows.map((r) => ({
			id: String(r._id),
			roblox: r.roblox,
			robloxName: names[String(r.roblox)]?.name || r.roblox,
			discord: r.discord,
			created: r.created,
			licenses: countMap[String(r._id)] || 0
		}))
	};
}
