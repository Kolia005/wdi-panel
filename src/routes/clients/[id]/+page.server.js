import { error, fail, redirect } from '@sveltejs/kit';
import { collections, ObjectId } from '$lib/server/db.js';
import { resolveRobloxUsers } from '$lib/server/roblox.js';
import { grantLicense, revokeLicensePair, unlinkClient, editClient } from '$lib/server/actions.js';

export const actions = {
	grant: async ({ request, params }) => {
		const fd = await request.formData();
		const res = await grantLicense(params.id, fd.get('productId'));
		return res.ok ? res : fail(400, res);
	},
	revoke: async ({ request, params }) => {
		const fd = await request.formData();
		const res = await revokeLicensePair(params.id, fd.get('productId'));
		return res.ok ? res : fail(400, res);
	},
	edit: async ({ request, params }) => {
		const fd = await request.formData();
		const res = await editClient(params.id, fd.get('roblox'), fd.get('discord'));
		return res.ok ? res : fail(400, res);
	},
	unlink: async ({ params }) => {
		const res = await unlinkClient(params.id);
		if (!res.ok) return fail(400, res);
		throw redirect(303, '/clients');
	}
};

export async function load({ params }) {
	const { clients, whitelists } = await collections();

	let _id;
	try {
		_id = new ObjectId(params.id);
	} catch {
		throw error(404, 'Invalid client id');
	}

	const client = await clients.findOne({ _id });
	if (!client) throw error(404, 'Client not found');

	const licenses = await whitelists
		.aggregate([
			{ $match: { client: _id } },
			{ $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product' } },
			{ $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
			{ $sort: { created: -1 } },
			{
				$project: {
					created: 1,
					productId: '$product._id',
					productName: { $ifNull: ['$product.name', '(deleted product)'] }
				}
			}
		])
		.toArray();

	const names = await resolveRobloxUsers([client.roblox]);

	// products this client does NOT already own (for the grant dropdown)
	const { products } = await collections();
	const ownedIds = new Set(licenses.map((l) => String(l.productId)));
	const allProducts = await products.find({}, { projection: { name: 1 } }).sort({ name: 1 }).toArray();
	const grantable = allProducts
		.filter((p) => !ownedIds.has(String(p._id)))
		.map((p) => ({ id: String(p._id), name: p.name }));

	return {
		grantable,
		client: {
			id: String(client._id),
			roblox: client.roblox,
			robloxName: names[String(client.roblox)]?.name || client.roblox,
			robloxDisplay: names[String(client.roblox)]?.displayName || '',
			discord: client.discord,
			created: client.created
		},
		licenses: licenses.map((l) => ({
			id: String(l._id),
			productId: l.productId ? String(l.productId) : null,
			productName: l.productName,
			created: l.created
		}))
	};
}
