<script>
	let { data } = $props();
	function fmtDate(d) { return d ? new Date(d).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '—'; }
	function piracyLevel(p) {
		if (p.unlicensedPlaces >= 10) return 'red';
		if (p.unlicensedPlaces >= 3) return 'yellow';
		return 'green';
	}
	const maxVol = data.empty ? 1 : Math.max(1, ...data.volume.map((v) => v.allow + v.deny));
</script>

<h1 class="page-title">Analytics <span class="muted" style="font-size:15px;">piracy & usage</span></h1>

{#if data.empty}
	<div class="card">
		<h2>No verification data yet</h2>
		<p class="muted">Verification logging is now live on the API. As your Roblox games check licenses, data will appear here within minutes — piracy detection, usage trends, and denied-check tracking.</p>
	</div>
{:else}
	<div class="kpi-grid">
		<div class="kpi"><div class="label">Total checks logged</div><div class="value">{data.kpis.total.toLocaleString()}</div></div>
		<div class="kpi"><div class="label">Checks (last 24h)</div><div class="value">{data.kpis.last24h.toLocaleString()}</div></div>
		<div class="kpi"><div class="label">Denied (last 24h)</div><div class="value" style="color:var(--red);">{data.kpis.denied24h.toLocaleString()}</div></div>
	</div>

	<div class="card">
		<h2>🏴‍☠️ Piracy signal — products run in unlicensed games (30d)</h2>
		<p class="muted" style="font-size:13px; margin-top:-6px;">Distinct game places that tried to verify a product but don't own a license. High counts = likely pirated copies in the wild.</p>
		<table>
			<thead><tr><th>Product</th><th>Unlicensed places</th><th>Denied checks</th><th>Licensed places</th><th>Signal</th></tr></thead>
			<tbody>
				{#each data.piracy as p}
					<tr>
						<td><strong>{p.product}</strong></td>
						<td><span class="badge {piracyLevel(p)}">{p.unlicensedPlaces}</span></td>
						<td class="muted">{p.deniedChecks.toLocaleString()}</td>
						<td class="muted">{p.licensedPlaces}</td>
						<td>
							{#if p.unlicensedPlaces >= 10}<span class="badge red">🔴 High</span>
							{:else if p.unlicensedPlaces >= 3}<span class="badge yellow">🟡 Watch</span>
							{:else}<span class="badge green">🟢 Low</span>{/if}
						</td>
					</tr>
				{/each}
				{#if data.piracy.length === 0}<tr><td colspan="5" class="muted" style="text-align:center; padding:20px;">No unlicensed-place activity detected. 🎉</td></tr>{/if}
			</tbody>
		</table>
	</div>

	<div class="card">
		<h2>Verification volume — last 14 days</h2>
		<div style="display:flex; align-items:flex-end; gap:6px; height:150px;">
			{#each data.volume as v}
				<div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:4px;" title={`${v.day}: ${v.allow} allowed, ${v.deny} denied`}>
					<div style="width:100%; display:flex; flex-direction:column-reverse; height:120px; justify-content:flex-start;">
						<div style={`background:var(--green); height:${(v.allow / maxVol) * 120}px; border-radius:0 0 3px 3px;`}></div>
						<div style={`background:var(--red); height:${(v.deny / maxVol) * 120}px; border-radius:3px 3px 0 0;`}></div>
					</div>
					<div class="muted" style="font-size:10px;">{v.day.slice(5)}</div>
				</div>
			{/each}
		</div>
		<div style="display:flex; gap:16px; margin-top:10px; font-size:12px;">
			<span><span style="display:inline-block; width:10px; height:10px; background:var(--green); border-radius:2px;"></span> Allowed</span>
			<span><span style="display:inline-block; width:10px; height:10px; background:var(--red); border-radius:2px;"></span> Denied</span>
		</div>
	</div>

	<div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
		<div class="card">
			<h2>Busiest products (7d)</h2>
			<table>
				<thead><tr><th>Product</th><th>Checks</th><th>Denied</th></tr></thead>
				<tbody>
					{#each data.topProducts as t}
						<tr><td>{t.product}</td><td class="muted">{t.checks.toLocaleString()}</td><td style="color:var(--red);">{t.denied.toLocaleString()}</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
		<div class="card">
			<h2>Recent denied checks</h2>
			<table>
				<thead><tr><th>Product</th><th>Place</th><th>When</th></tr></thead>
				<tbody>
					{#each data.recentDenied as r}
						<tr><td>{r.product}</td><td class="muted">{r.placeId || '—'}</td><td class="muted">{fmtDate(r.at)}</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
{/if}
