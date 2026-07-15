import { collections, ObjectId } from '$lib/server/db.js';
import { getKills, addKill, removeKill, getEnforcement, setEnforcement } from '$lib/server/bot.js';
import { audit } from '$lib/server/audit.js';
import { fail } from '@sveltejs/kit';

export async function load() {
	const { products, securityAlerts } = await collections();
	const productList = await products.find({}, { projection: { name: 1 } }).sort({ name: 1 }).toArray();
	const alertDocs = await securityAlerts.find({}).sort({ active: -1, updated: -1 }).limit(100).toArray();

	let kills = [];
	let enforcement = {};
	try { const k = await getKills(); kills = k.kills || []; } catch {}
	try { const e = await getEnforcement(); enforcement = e.enforcement || {}; } catch {}

	return {
		products: productList.map((p) => p.name),
		kills: kills.map((k) => ({ scope: k.scope, value: k.value, reason: k.reason || '', created: k.created })),
		enforcement,
		alerts: alertDocs.map((a) => ({
			id: String(a._id),
			type: a.type,
			severity: a.severity || 'warning',
			title: a.title,
			message: a.message,
			robloxId: a.robloxId || '',
			universeId: a.universeId || '',
			placeId: a.placeId || '',
			active: Boolean(a.active),
			acknowledgedAt: a.acknowledgedAt || null,
			created: a.created,
			updated: a.updated,
			resolvedAt: a.resolvedAt || null
		})),
		alertCounts: {
			active: alertDocs.filter((a) => a.active).length,
			unacknowledged: alertDocs.filter((a) => a.active && !a.acknowledgedAt).length
		}
	};
}

export const actions = {
	ackAlert: async ({ request }) => {
		const fd = await request.formData();
		const id = String(fd.get('id') || '');
		if (!ObjectId.isValid(id)) return fail(400, { ok: false, message: 'Invalid alert ID.' });
		const { securityAlerts } = await collections();
		const result = await securityAlerts.updateOne(
			{ _id: new ObjectId(id) },
			{ $set: { acknowledgedAt: new Date(), acknowledgedBy: 'panel', updated: new Date() } }
		);
		if (!result.matchedCount) return fail(404, { ok: false, message: 'Alert not found.' });
		await audit('security.alert.acknowledge', { alertId: id });
		return { ok: true, message: 'Security alert acknowledged.' };
	},

	setEnforce: async ({ request }) => {
		const fd = await request.formData();
		const pack = fd.get('pack');
		const mode = fd.get('mode');
		if (!pack || !['full', 'entitlement', 'off'].includes(mode)) return fail(400, { ok: false, message: 'Pack and mode required.' });
		try {
			await setEnforcement(pack, mode);
			await audit('security.enforce', { pack, mode });
			return { ok: true, message: `Enforcement for "${pack}" set to ${mode}.` };
		} catch (e) {
			return fail(500, { ok: false, message: 'Could not reach the bot: ' + e.message });
		}
	},

	kill: async ({ request }) => {
		const fd = await request.formData();
		const scope = fd.get('scope') || 'universe';
		const value = String(fd.get('value') || '').trim();
		const reason = fd.get('reason') || '';
		if (!value) return fail(400, { ok: false, message: 'A target ID is required.' });
		try {
			await addKill(scope, value, reason, 'panel');
			await audit('security.kill', { scope, value, reason });
			return { ok: true, message: `Killed ${scope} ${value}.` };
		} catch (e) {
			return fail(500, { ok: false, message: 'Could not reach the bot: ' + e.message });
		}
	},

	unkill: async ({ request }) => {
		const fd = await request.formData();
		const scope = fd.get('scope');
		const value = fd.get('value');
		try {
			await removeKill(scope, value);
			await audit('security.unkill', { scope, value });
			return { ok: true, message: `Lifted kill on ${scope} ${value}.` };
		} catch (e) {
			return fail(500, { ok: false, message: 'Could not reach the bot: ' + e.message });
		}
	}
};
