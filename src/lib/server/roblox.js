import axios from 'axios';

// In-memory cache so we don't hammer the Roblox API for the same id repeatedly.
const cache = new Map(); // id -> { name, displayName, at }
const TTL = 1000 * 60 * 30; // 30 min

/**
 * Resolve a batch of Roblox user ids to { id: {name, displayName} }.
 * Uses the current users.roblox.com batch endpoint (api.roblox.com is dead).
 */
export async function resolveRobloxUsers(ids) {
	const result = {};
	const need = [];
	const now = Date.now();

	for (const raw of ids) {
		const id = String(raw);
		const hit = cache.get(id);
		if (hit && now - hit.at < TTL) {
			result[id] = { name: hit.name, displayName: hit.displayName };
		} else if (/^\d+$/.test(id)) {
			need.push(Number(id));
		} else {
			result[id] = { name: id, displayName: id }; // non-numeric (test data) — pass through
		}
	}

	if (need.length) {
		try {
			const { data } = await axios.post(
				'https://users.roblox.com/v1/users',
				{ userIds: need, excludeBannedUsers: false },
				{ timeout: 10000 }
			);
			for (const u of data.data || []) {
				const entry = { name: u.name, displayName: u.displayName, at: now };
				cache.set(String(u.id), entry);
				result[String(u.id)] = { name: u.name, displayName: u.displayName };
			}
		} catch (e) {
			// On failure, fall back to showing the raw id so the UI never breaks.
			for (const id of need) {
				if (!result[String(id)]) result[String(id)] = { name: String(id), displayName: String(id) };
			}
		}
	}

	return result;
}
