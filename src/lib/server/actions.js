import { collections, ObjectId } from './db.js';
import { audit } from './audit.js';

/**
 * Shared write operations, reused across pages. Each returns {ok, message}.
 * These mirror the (now-fixed) Discord bot logic but for the panel.
 */

export async function grantLicense(clientId, productId) {
	const { clients, products, whitelists } = await collections();
	const client = await clients.findOne({ _id: new ObjectId(clientId) });
	if (!client) return { ok: false, message: 'Client not found.' };
	const product = await products.findOne({ _id: new ObjectId(productId) });
	if (!product) return { ok: false, message: 'Product not found.' };

	const existing = await whitelists.findOne({ client: client._id, product: product._id });
	if (existing) return { ok: false, message: `${client.roblox} already owns ${product.name}.` };

	await whitelists.insertOne({ client: client._id, product: product._id, created: new Date() });
	await audit('license.grant', { client: client.roblox, discord: client.discord, product: product.name });
	return { ok: true, message: `Granted ${product.name} to ${client.roblox}.` };
}

export async function revokeLicense(whitelistId) {
	const { whitelists, clients, products } = await collections();
	const wl = await whitelists.findOne({ _id: new ObjectId(whitelistId) });
	if (!wl) return { ok: false, message: 'License not found.' };
	const client = await clients.findOne({ _id: wl.client });
	const product = await products.findOne({ _id: wl.product });
	await whitelists.deleteOne({ _id: wl._id });
	await audit('license.revoke', { client: client?.roblox, product: product?.name });
	return { ok: true, message: `Revoked ${product?.name || 'product'} from ${client?.roblox || 'client'}.` };
}

export async function revokeLicensePair(clientId, productId) {
	const { whitelists, clients, products } = await collections();
	const wl = await whitelists.findOne({ client: new ObjectId(clientId), product: new ObjectId(productId) });
	if (!wl) return { ok: false, message: 'License not found.' };
	return revokeLicense(String(wl._id));
}

export async function forceLink(robloxId, discordId) {
	const { clients } = await collections();
	robloxId = String(robloxId).trim();
	discordId = String(discordId).trim();
	if (!robloxId || !discordId) return { ok: false, message: 'Both Roblox ID and Discord ID are required.' };

	const byDiscord = await clients.findOne({ discord: discordId });
	if (byDiscord) return { ok: false, message: 'That Discord user is already linked. Unlink first to relink.' };
	const byRoblox = await clients.findOne({ roblox: robloxId });
	if (byRoblox) return { ok: false, message: 'That Roblox ID is already linked to another Discord user.' };

	await clients.insertOne({ roblox: robloxId, discord: discordId, created: new Date() });
	await audit('client.forcelink', { roblox: robloxId, discord: discordId });
	return { ok: true, message: `Linked Roblox ${robloxId} to Discord ${discordId}.` };
}

export async function unlinkClient(clientId) {
	const { clients, whitelists } = await collections();
	const client = await clients.findOne({ _id: new ObjectId(clientId) });
	if (!client) return { ok: false, message: 'Client not found.' };
	const licenseCount = await whitelists.countDocuments({ client: client._id });
	await whitelists.deleteMany({ client: client._id });
	await clients.deleteOne({ _id: client._id });
	await audit('client.unlink', { roblox: client.roblox, discord: client.discord, licensesRemoved: licenseCount });
	return { ok: true, message: `Unlinked ${client.roblox} and removed ${licenseCount} license(s).` };
}

export async function editClient(clientId, robloxId, discordId) {
	const { clients } = await collections();
	robloxId = String(robloxId).trim();
	discordId = String(discordId).trim();
	const client = await clients.findOne({ _id: new ObjectId(clientId) });
	if (!client) return { ok: false, message: 'Client not found.' };

	// guard uniqueness
	const robloxClash = await clients.findOne({ roblox: robloxId, _id: { $ne: client._id } });
	if (robloxClash) return { ok: false, message: 'Another client already uses that Roblox ID.' };

	await clients.updateOne({ _id: client._id }, { $set: { roblox: robloxId, discord: discordId } });
	await audit('client.edit', { from: { roblox: client.roblox, discord: client.discord }, to: { roblox: robloxId, discord: discordId } });
	return { ok: true, message: 'Client updated.' };
}

export async function createProduct({ name, description, fileurl }) {
	const { products } = await collections();
	name = String(name || '').trim();
	if (!name) return { ok: false, message: 'Product name is required.' };
	const clash = await products.findOne({ name });
	if (clash) return { ok: false, message: 'A product with that name already exists.' };
	const doc = { name, description: String(description || '').trim(), fileurl: String(fileurl || '').trim(), created: new Date() };
	const r = await products.insertOne(doc);
	await audit('product.create', { name });
	return { ok: true, message: `Created product "${name}".`, id: String(r.insertedId) };
}

export async function editProduct(productId, { name, description, fileurl }) {
	const { products } = await collections();
	const product = await products.findOne({ _id: new ObjectId(productId) });
	if (!product) return { ok: false, message: 'Product not found.' };
	name = String(name || '').trim();
	if (!name) return { ok: false, message: 'Product name is required.' };
	const clash = await products.findOne({ name, _id: { $ne: product._id } });
	if (clash) return { ok: false, message: 'Another product already uses that name.' };
	await products.updateOne(
		{ _id: product._id },
		{ $set: { name, description: String(description || '').trim(), fileurl: String(fileurl || '').trim() } }
	);
	await audit('product.edit', { id: productId, name });
	return { ok: true, message: 'Product updated.' };
}

export async function deleteProduct(productId) {
	const { products, whitelists } = await collections();
	const product = await products.findOne({ _id: new ObjectId(productId) });
	if (!product) return { ok: false, message: 'Product not found.' };
	const owners = await whitelists.countDocuments({ product: product._id });
	await whitelists.deleteMany({ product: product._id });
	await products.deleteOne({ _id: product._id });
	await audit('product.delete', { name: product.name, licensesRemoved: owners });
	return { ok: true, message: `Deleted "${product.name}" and ${owners} associated license(s).` };
}

export async function bulkGrantByRoblox(robloxIds, productId) {
	const { clients, products, whitelists } = await collections();
	const product = await products.findOne({ _id: new ObjectId(productId) });
	if (!product) return { ok: false, message: 'Product not found.' };

	let granted = 0, alreadyHad = 0, notFound = 0;
	for (const rawId of robloxIds) {
		const roblox = String(rawId).trim();
		if (!roblox) continue;
		const client = await clients.findOne({ roblox });
		if (!client) { notFound++; continue; }
		const exists = await whitelists.findOne({ client: client._id, product: product._id });
		if (exists) { alreadyHad++; continue; }
		await whitelists.insertOne({ client: client._id, product: product._id, created: new Date() });
		granted++;
	}
	await audit('license.bulkgrant', { product: product.name, granted, alreadyHad, notFound });
	return { ok: true, message: `Bulk grant of "${product.name}": ${granted} granted, ${alreadyHad} already had it, ${notFound} not found.` };
}
