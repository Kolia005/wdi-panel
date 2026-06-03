import axios from 'axios';

// Resolve Roblox place IDs -> { name, creator, creatorType, universeId, url }.
// Cached in-memory (place metadata rarely changes). Best-effort: failures return a stub
// so the UI still shows the raw id with a generic Roblox link.
const cache = new Map(); // placeId -> { data, at }
const TTL = 1000 * 60 * 60 * 6; // 6h

function stub(placeId) {
	return {
		placeId: String(placeId),
		name: null,
		creator: null,
		creatorType: null,
		universeId: null,
		url: `https://www.roblox.com/games/${placeId}`
	};
}

async function resolveOne(placeId) {
	const id = String(placeId);
	if (!/^\d+$/.test(id)) return stub(id);

	const hit = cache.get(id);
	if (hit && Date.now() - hit.at < TTL) return hit.data;

	try {
		// place -> universe
		const uniRes = await axios.get(`https://apis.roblox.com/universes/v1/places/${id}/universe`, { timeout: 8000 });
		const universeId = uniRes.data?.universeId;
		if (!universeId) {
			const s = stub(id);
			cache.set(id, { data: s, at: Date.now() });
			return s;
		}
		// universe -> game details
		const gameRes = await axios.get(`https://games.roblox.com/v1/games?universeIds=${universeId}`, { timeout: 8000 });
		const g = gameRes.data?.data?.[0];
		const data = {
			placeId: id,
			name: g?.name || null,
			creator: g?.creator?.name || null,
			creatorType: g?.creator?.type || null,
			creatorId: g?.creator?.id || null,
			universeId,
			url: `https://www.roblox.com/games/${id}`
		};
		cache.set(id, { data, at: Date.now() });
		return data;
	} catch (e) {
		const s = stub(id);
		// cache stubs briefly so a flaky lookup doesn't hammer the API every load
		cache.set(id, { data: s, at: Date.now() - TTL + 1000 * 60 * 10 });
		return s;
	}
}

/**
 * Resolve many place IDs. Returns { [placeId]: {name, creator, url, ...} }.
 * Concurrency-limited to be gentle on the Roblox API.
 */
export async function resolveGames(placeIds) {
	const unique = [...new Set(placeIds.map(String).filter((p) => p && p !== '0'))];
	const out = {};
	const BATCH = 5;
	for (let i = 0; i < unique.length; i += BATCH) {
		const chunk = unique.slice(i, i + BATCH);
		const results = await Promise.all(chunk.map(resolveOne));
		for (const r of results) out[r.placeId] = r;
	}
	return out;
}
