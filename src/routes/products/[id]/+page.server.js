import { error, fail, redirect } from '@sveltejs/kit';
import { collections, ObjectId } from '$lib/server/db.js';
import { resolveRobloxUsers } from '$lib/server/roblox.js';
import { editProduct, deleteProduct } from '$lib/server/actions.js';

export const actions = {
	edit: async ({ request, params }) => {
		const fd = await request.formData();
		const res = await editProduct(params.id, {
			name: fd.get('name'),
			description: fd.get('description'),
			fileurl: fd.get('fileurl')
		});
		return res.ok ? res : fail(400, res);
	},
	delete: async ({ params }) => {
		const res = await deleteProduct(params.id);
		if (!res.ok) return fail(400, res);
		throw redirect(303, '/products');
	}
};

export async function load({ params }) {
	const { products, whitelists } = await collections();

	let _id;
	try {
		_id = new ObjectId(params.id);
	} catch {
		throw error(404, 'Invalid product id');
	}

	const product = await products.findOne({ _id });
	if (!product) throw error(404, 'Product not found');

	const owners = await whitelists
		.aggregate([
			{ $match: { product: _id } },
			{ $lookup: { from: 'clients', localField: 'client', foreignField: '_id', as: 'client' } },
			{ $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
			{ $sort: { created: -1 } },
			{
				$project: {
					created: 1,
					clientId: '$client._id',
					roblox: { $ifNull: ['$client.roblox', '(deleted)'] },
					discord: { $ifNull: ['$client.discord', '?'] },
					inServer: '$client.inServer'
				}
			}
		])
		.toArray();

	const names = await resolveRobloxUsers(owners.map((o) => o.roblox));

	return {
		product: {
			id: String(product._id),
			name: product.name,
			description: product.description || '',
			fileurl: product.fileurl || '',
			fileFormat: product.file?.format || '',
			hasFile: !!(product.file && product.file.contents),
			created: product.created
		},
		owners: owners.map((o) => ({
			clientId: o.clientId ? String(o.clientId) : null,
			roblox: o.roblox,
			robloxName: names[String(o.roblox)]?.name || o.roblox,
			discord: o.discord,
			created: o.created,
			inServer: o.inServer
		}))
	};
}
