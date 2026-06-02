import { collections } from '$lib/server/db.js';
import { createProduct } from '$lib/server/actions.js';
import { fail } from '@sveltejs/kit';

export const actions = {
	create: async ({ request }) => {
		const fd = await request.formData();
		const res = await createProduct({
			name: fd.get('name'),
			description: fd.get('description'),
			fileurl: fd.get('fileurl')
		});
		return res.ok ? res : fail(400, res);
	}
};

export async function load({ url }) {
	const { products, whitelists } = await collections();
	const q = (url.searchParams.get('q') || '').trim();

	const filter = q ? { name: { $regex: q, $options: 'i' } } : {};
	const rows = await products.find(filter).sort({ created: -1 }).toArray();

	const counts = await whitelists
		.aggregate([{ $group: { _id: '$product', n: { $sum: 1 } } }])
		.toArray();
	const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));

	return {
		q,
		products: rows.map((p) => ({
			id: String(p._id),
			name: p.name,
			description: p.description || '',
			hasFile: !!(p.file && p.file.contents),
			fileurl: p.fileurl || '',
			created: p.created,
			owners: countMap[String(p._id)] || 0
		}))
	};
}
