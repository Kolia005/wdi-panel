import { collections } from '$lib/server/db.js';
import { resolveRobloxUsers } from '$lib/server/roblox.js';

export async function load({ url }) {
	const q = (url.searchParams.get('q') || '').trim();
	if (!q) return { q: '', clients: [], products: [] };

	const { clients, products } = await collections();

	const clientRows = await clients
		.find({ $or: [{ roblox: { $regex: q, $options: 'i' } }, { discord: { $regex: q, $options: 'i' } }] })
		.limit(20)
		.toArray();

	const productRows = await products
		.find({ name: { $regex: q, $options: 'i' } })
		.limit(20)
		.toArray();

	const names = await resolveRobloxUsers(clientRows.map((c) => c.roblox));

	return {
		q,
		clients: clientRows.map((c) => ({
			id: String(c._id),
			roblox: c.roblox,
			robloxName: names[String(c.roblox)]?.name || c.roblox,
			discord: c.discord
		})),
		products: productRows.map((p) => ({ id: String(p._id), name: p.name, description: p.description || '' }))
	};
}
