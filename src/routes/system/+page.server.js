import { collections, db } from '$lib/server/db.js';
import { promisify } from 'node:util';
import { exec as execCb } from 'node:child_process';
const exec = promisify(execCb);

async function sh(cmd) {
	try {
		const { stdout } = await exec(cmd, { timeout: 8000, env: { ...process.env, PM2_HOME: '/root/.pm2' } });
		return stdout.trim();
	} catch (e) {
		return null;
	}
}

export async function load() {
	const { clients, products, whitelists, verifications } = await collections();
	const database = await db();

	const [clientCount, productCount, licenseCount, verifCount] = await Promise.all([
		clients.countDocuments({}),
		products.countDocuments({}),
		whitelists.countDocuments({}),
		verifications.countDocuments({})
	]);

	// pm2 process list (names + status + uptime + restarts + mem)
	let pm2 = [];
	const pm2Raw = await sh('/opt/node20/bin/node /opt/node20/bin/npx --no-install pm2 jlist 2>/dev/null || pm2 jlist');
	if (pm2Raw) {
		try {
			pm2 = JSON.parse(pm2Raw).map((p) => ({
				name: p.name,
				status: p.pm2_env?.status,
				restarts: p.pm2_env?.restart_time,
				uptimeMs: p.pm2_env?.pm_uptime ? Date.now() - p.pm2_env.pm_uptime : 0,
				mem: p.monit?.memory ? Math.round(p.monit.memory / 1024 / 1024) : 0,
				cpu: p.monit?.cpu ?? 0
			}));
		} catch {}
	}

	// system stats
	const uptime = await sh("uptime -p");
	const disk = await sh("df -h / | tail -1 | awk '{print $3\" / \"$2\" (\"$5\")\"}'");
	const mem = await sh("free -m | awk '/Mem:/ {print $3\" / \"$2\" MB\"}'");

	// db storage size
	let dbSize = null;
	try {
		const stats = await database.stats();
		dbSize = Math.round((stats.dataSize || 0) / 1024) + ' KB data, ' + Math.round((stats.storageSize || 0) / 1024) + ' KB storage';
	} catch {}

	// is the public API healthy?
	const apiHealth = await sh("curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://127.0.0.1:3000/ || echo down");

	return {
		counts: { clientCount, productCount, licenseCount, verifCount },
		pm2,
		system: { uptime, disk, mem, dbSize, apiHealth }
	};
}

export const actions = {
	restartBot: async () => {
		await sh('/opt/node20/bin/node /opt/node20/bin/npx --no-install pm2 restart wdi 2>/dev/null || pm2 restart wdi');
		const { db: getDb } = await import('$lib/server/db.js');
		const database = await getDb();
		await database.collection('audit').insertOne({ action: 'system.restart_bot', details: {}, at: new Date(), source: 'panel' });
		return { ok: true, message: 'Bot (wdi) restart triggered.' };
	}
};
