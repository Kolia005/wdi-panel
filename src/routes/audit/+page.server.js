import { db } from '$lib/server/db.js';

const PAGE_SIZE = 40;

export async function load({ url }) {
	const database = await db();
	const audit = database.collection('audit');
	const pageNum = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
	const action = (url.searchParams.get('action') || '').trim();

	const filter = action ? { action } : {};
	const total = await audit.countDocuments(filter);
	const rows = await audit
		.find(filter)
		.sort({ at: -1 })
		.skip((pageNum - 1) * PAGE_SIZE)
		.limit(PAGE_SIZE)
		.toArray();

	const actionTypes = await audit.distinct('action');

	return {
		action,
		actionTypes: actionTypes.sort(),
		page: pageNum,
		total,
		totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
		entries: rows.map((r) => ({
			action: r.action,
			details: r.details || {},
			at: r.at
		}))
	};
}
