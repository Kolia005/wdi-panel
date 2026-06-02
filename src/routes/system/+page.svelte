<script>
	let { data, form } = $props();
	function fmtUptime(ms) {
		const s = Math.floor(ms / 1000);
		const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
		return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
	}
</script>

<h1 class="page-title">System</h1>

{#if form?.message}<div class="toast {form.ok ? 'ok' : 'err'}">{form.message}</div>{/if}

<div class="kpi-grid">
	<div class="kpi"><div class="label">Public API</div><div class="value" style="color:{data.system.apiHealth === '200' ? 'var(--green)' : 'var(--red)'};">{data.system.apiHealth === '200' ? '● Up' : '● ' + data.system.apiHealth}</div></div>
	<div class="kpi"><div class="label">Clients</div><div class="value">{data.counts.clientCount}</div></div>
	<div class="kpi"><div class="label">Licenses</div><div class="value">{data.counts.licenseCount}</div></div>
	<div class="kpi"><div class="label">Verifications logged</div><div class="value">{data.counts.verifCount.toLocaleString()}</div></div>
</div>

<div class="card">
	<h2>Processes (PM2)</h2>
	<table>
		<thead><tr><th>Name</th><th>Status</th><th>Uptime</th><th>Restarts</th><th>Memory</th><th>CPU</th></tr></thead>
		<tbody>
			{#each data.pm2 as p}
				<tr>
					<td><strong>{p.name}</strong></td>
					<td><span class="badge {p.status === 'online' ? 'green' : 'red'}">{p.status}</span></td>
					<td class="muted">{fmtUptime(p.uptimeMs)}</td>
					<td class="muted">{p.restarts}</td>
					<td class="muted">{p.mem} MB</td>
					<td class="muted">{p.cpu}%</td>
				</tr>
			{/each}
			{#if data.pm2.length === 0}<tr><td colspan="6" class="muted" style="text-align:center; padding:16px;">Could not read PM2 status.</td></tr>{/if}
		</tbody>
	</table>
	<form method="POST" action="?/restartBot" style="margin-top:14px;" onsubmit={(e) => { if (!confirm('Restart the wdi bot/API? Brief downtime (~5s).')) e.preventDefault(); }}>
		<button class="btn danger" type="submit">Restart bot (wdi)</button>
	</form>
</div>

<div class="card">
	<h2>Server</h2>
	<table>
		<tbody>
			<tr><td class="muted" style="width:160px;">Uptime</td><td>{data.system.uptime || '—'}</td></tr>
			<tr><td class="muted">Memory</td><td>{data.system.mem || '—'}</td></tr>
			<tr><td class="muted">Disk</td><td>{data.system.disk || '—'}</td></tr>
			<tr><td class="muted">Database size</td><td>{data.system.dbSize || '—'}</td></tr>
		</tbody>
	</table>
</div>

<div class="card">
	<h2>Database backup</h2>
	<p class="muted">Download a full JSON snapshot of your database (products, clients, whitelists).</p>
	<a class="btn primary" href="/system/backup" download>⬇ Download backup (.json)</a>
</div>
