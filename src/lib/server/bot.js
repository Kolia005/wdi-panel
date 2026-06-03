import axios from 'axios';
import { readFileSync } from 'node:fs';

// The panel calls the bot's localhost-only internal endpoints, authenticated with the shared secret.
const BOT_BASE = 'http://127.0.0.1:3000/internal';

function secret() {
	// secret lives in the panel env; fall back to the on-disk file the bot also reads
	try {
		return (process.env.INTERNAL_SECRET || readFileSync('/root/.wdi_internal_secret', 'utf8')).trim();
	} catch {
		return process.env.INTERNAL_SECRET || '';
	}
}

function headers() {
	return { 'x-internal-secret': secret(), 'content-type': 'application/json' };
}

export async function broadcastPreview(productId) {
	const { data } = await axios.get(`${BOT_BASE}/broadcast-preview`, {
		params: { productId },
		headers: headers(),
		timeout: 10000
	});
	return data;
}

export async function sendBroadcast(productId, message, testDiscordId) {
	const body = { productId, message };
	if (testDiscordId) body.testDiscordId = testDiscordId;
	const { data } = await axios.post(`${BOT_BASE}/broadcast`, body, {
		headers: headers(),
		timeout: 5 * 60 * 1000 // broadcasts can take a while (throttled)
	});
	return data;
}

export async function syncMembership() {
	const { data } = await axios.post(`${BOT_BASE}/sync-membership`, {}, { headers: headers(), timeout: 60000 });
	return data;
}
