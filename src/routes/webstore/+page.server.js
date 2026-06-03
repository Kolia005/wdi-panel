import { collections, db, ObjectId } from '$lib/server/db.js';
import { audit } from '$lib/server/audit.js';
import { fail } from '@sveltejs/kit';

export async function load() {
	const database = await db();
	const { products } = await collections();

	const purchases = await database.collection('webpurchases').find({}).sort({ at: -1 }).limit(100).toArray();
	const mappings = await database.collection('productmappings').find({}).sort({ wixName: 1 }).toArray();
	const productList = await products.find({}, { projection: { name: 1 } }).sort({ name: 1 }).toArray();

	const heldCount = await database.collection('webpurchases').countDocuments({ status: 'held' });
	const grantedCount = await database.collection('webpurchases').countDocuments({ status: 'granted' });

	return {
		heldCount,
		grantedCount,
		purchases: purchases.map((p) => ({
			id: String(p._id),
			wixOrderId: p.wixOrderId,
			wixProductId: p.wixProductId || '',
			wixProduct: p.wixProduct,
			robloxInput: p.robloxInput,
			robloxName: p.robloxName,
			productName: p.productName,
			status: p.status,
			reason: p.reason,
			email: p.email,
			at: p.at
		})),
		mappings: mappings.map((m) => ({ id: String(m._id), wixProductId: m.wixProductId || '', wixName: m.wixName, productName: m.productName, productId: String(m.productId) })),
		products: productList.map((p) => ({ id: String(p._id), name: p.name }))
	};
}

export const actions = {
	// create/update a wix->WDI product mapping.
	// Prefer Wix product ID (unique even when names collide); name is a label/fallback.
	saveMapping: async ({ request }) => {
		const fd = await request.formData();
		const wixProductId = String(fd.get('wixProductId') || '').trim();
		const wixName = String(fd.get('wixName') || '').trim();
		const productId = String(fd.get('productId') || '');
		if (!productId) return fail(400, { ok: false, message: 'Pick a WDI product.' });
		if (!wixProductId && !wixName) return fail(400, { ok: false, message: 'Enter a Wix product ID (recommended) or name.' });
		const database = await db();
		const { products } = await collections();
		const product = await products.findOne({ _id: new ObjectId(productId) });
		if (!product) return fail(400, { ok: false, message: 'Product not found.' });

		// Key on wixProductId when given (handles duplicate names); else fall back to name.
		const filter = wixProductId ? { wixProductId } : { wixName, wixProductId: { $exists: false } };
		await database.collection('productmappings').updateOne(
			filter,
			{ $set: { wixProductId: wixProductId || undefined, wixName, productId: product._id, productName: product.name, at: new Date() } },
			{ upsert: true }
		);
		await audit('webstore.mapping', { wixProductId, wixName, product: product.name });
		return { ok: true, message: `Mapped ${wixProductId ? `ID ${wixProductId}` : `"${wixName}"`} → ${product.name}.` };
	},

	deleteMapping: async ({ request }) => {
		const fd = await request.formData();
		const database = await db();
		await database.collection('productmappings').deleteOne({ _id: new ObjectId(fd.get('id')) });
		return { ok: true, message: 'Mapping removed.' };
	},

	// manually resolve a held purchase: grant to a (corrected) roblox id + product
	resolveHeld: async ({ request }) => {
		const fd = await request.formData();
		const purchaseId = fd.get('purchaseId');
		const robloxId = String(fd.get('robloxId') || '').trim();
		const productId = String(fd.get('productId') || '');
		if (!robloxId || !productId) return fail(400, { ok: false, message: 'Roblox ID and product required.' });

		const database = await db();
		const { products, clients, whitelists } = await collections();
		const product = await products.findOne({ _id: new ObjectId(productId) });
		if (!product) return fail(400, { ok: false, message: 'Product not found.' });

		let client = await clients.findOne({ roblox: robloxId });
		if (!client) {
			const r = await clients.insertOne({ roblox: robloxId, source: 'wix', created: new Date() });
			client = { _id: r.insertedId };
		}
		const exists = await whitelists.findOne({ client: client._id, product: product._id });
		if (!exists) await whitelists.insertOne({ client: client._id, product: product._id, created: new Date() });

		await database.collection('webpurchases').updateOne(
			{ _id: new ObjectId(purchaseId) },
			{ $set: { status: 'granted', reason: 'manually_resolved', robloxId, productId: product._id, productName: product.name } }
		);
		await audit('webstore.resolve_held', { purchaseId: String(purchaseId), roblox: robloxId, product: product.name });
		return { ok: true, message: `Resolved: granted ${product.name} to Roblox ${robloxId}.` };
	}
};
