import { db } from './db.js';

/**
 * Append an entry to the audit log. Never throws (logging must not break actions).
 * @param {string} action  e.g. "license.grant", "client.unlink", "product.delete"
 * @param {object} details arbitrary context (ids, names)
 */
export async function audit(action, details = {}) {
	try {
		const database = await db();
		await database.collection('audit').insertOne({
			action,
			details,
			at: new Date(),
			source: 'panel'
		});
	} catch (e) {
		console.error('audit log failed:', e.message);
	}
}
