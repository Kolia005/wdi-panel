import { collections, db } from '$lib/server/db.js';
import { broadcastPreview, sendBroadcast, syncMembership } from '$lib/server/bot.js';
import { audit } from '$lib/server/audit.js';
import { fail } from '@sveltejs/kit';

export async function load() {
	const { products } = await collections();
	const database = await db();

	const productList = await products.find({}, { projection: { name: 1 } }).sort({ name: 1 }).toArray();

	// recent broadcast history
	let history = [];
	try {
		history = await database
			.collection('broadcasts')
			.find({}, { projection: { results: 0 } }) // omit big results array in list
			.sort({ at: -1 })
			.limit(15)
			.toArray();
	} catch {}

	// overall membership snapshot
	const { clients } = await collections();
	const [inServer, total] = await Promise.all([
		clients.countDocuments({ inServer: true }),
		clients.countDocuments({})
	]);

	return {
		products: productList.map((p) => ({ id: String(p._id), name: p.name })),
		history: history.map((h) => ({
			product: h.product,
			message: h.message,
			total: h.total,
			sent: h.sent,
			failed: h.failed,
			notInServer: h.notInServer,
			at: h.at
		})),
		membership: { inServer, total }
	};
}

export const actions = {
	preview: async ({ request }) => {
		const fd = await request.formData();
		try {
			const r = await broadcastPreview(fd.get('productId'));
			return { ...r, _preview: true };
		} catch (e) {
			return fail(500, { ok: false, message: 'Could not reach the bot: ' + e.message });
		}
	},

	test: async ({ request }) => {
		const fd = await request.formData();
		const productId = fd.get('productId');
		const message = fd.get('message');
		const testDiscordId = fd.get('testDiscordId');
		if (!message) return fail(400, { ok: false, message: 'Message is required.' });
		if (!testDiscordId) return fail(400, { ok: false, message: 'Test Discord ID is required.' });
		try {
			const r = await sendBroadcast(productId, message, testDiscordId);
			await audit('broadcast.test', { product: r.product, testDiscordId, result: r });
			return r.ok
				? { ...r, _test: true, message: `Test sent: ${r.sent} sent, ${r.failed} failed, ${r.notInServer} not reachable.` }
				: fail(400, { ok: false, message: r.error || 'Test failed.' });
		} catch (e) {
			return fail(500, { ok: false, message: 'Could not reach the bot: ' + e.message });
		}
	},

	send: async ({ request }) => {
		const fd = await request.formData();
		const productId = fd.get('productId');
		const message = fd.get('message');
		if (!productId || !message) return fail(400, { ok: false, message: 'Product and message are required.' });
		try {
			const r = await sendBroadcast(productId, message);
			await audit('broadcast.send', { productId, total: r.total, sent: r.sent, failed: r.failed, notInServer: r.notInServer });
			return r.ok
				? { ...r, _sent: true, message: `Broadcast complete — ${r.sent} delivered, ${r.notInServer} left server, ${r.failed} failed (of ${r.total}).` }
				: fail(400, { ok: false, message: r.error || 'Broadcast failed.' });
		} catch (e) {
			return fail(500, { ok: false, message: 'Could not reach the bot: ' + e.message });
		}
	},

	resync: async () => {
		try {
			const r = await syncMembership();
			return { ...r, _resync: true, message: r.ok ? `Membership synced: ${r.inServer} in server, ${r.notInServer} left.` : (r.error || 'Sync failed') };
		} catch (e) {
			return fail(500, { ok: false, message: 'Could not reach the bot: ' + e.message });
		}
	}
};
