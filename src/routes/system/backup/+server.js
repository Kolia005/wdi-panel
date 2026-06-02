import { collections } from '$lib/server/db.js';

export async function GET() {
	const { clients, products, whitelists } = await collections();
	const [c, p, w] = await Promise.all([
		clients.find({}).toArray(),
		products.find({}).toArray(),
		whitelists.find({}).toArray()
	]);

	const dump = {
		exportedAt: new Date().toISOString(),
		counts: { clients: c.length, products: p.length, whitelists: w.length },
		clients: c,
		products: p,
		whitelists: w
	};

	const stamp = new Date().toISOString().slice(0, 10);
	return new Response(JSON.stringify(dump, null, 2), {
		headers: {
			'content-type': 'application/json',
			'content-disposition': `attachment; filename="wdi-backup-${stamp}.json"`
		}
	});
}
