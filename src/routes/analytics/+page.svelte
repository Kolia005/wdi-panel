<script>
	let { data } = $props();
	function fmtDate(d) { return d ? new Date(d).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '—'; }
	const maxVol = data.empty ? 1 : Math.max(1, ...data.volume.map((v) => v.allow + v.deny));
</script>

<h1 class="page-title">Analytics <span class="muted" style="font-size:15px;">piracy & usage</span></h1>

{#if data.empty}
	<div class="card">
		<h2>No verification data yet</h2>
		<p class="muted">Verification logging is live on the API. As your Roblox games check licenses, piracy detection and usage trends will appear here within minutes.</p>
	</div>
{:else}
	<div class="kpi-grid">
		<div class="kpi"><div class="label">Total checks logged</div><div class="value">{data.kpis.total.toLocaleString()}</div></div>
		<div class="kpi"><div class="label">Checks (last 24h)</div><div class="value">{data.kpis.last24h.toLocaleString()}</div></div>
		<div class="kpi"><div class="label">Denied (last 24h)</div><div class="value" style="color:var(--red);">{data.kpis.denied24h.toLocaleString()}</div></div>
	</div>

	<div class="card">
		<h2>🏴‍☠️ Suspected piracy — games running your assets without a license</h2>
		<p class="muted" style="font-size:13px; margin-top:-6px;">Games that ran your product and were <strong>denied</strong> (last 30 days). Click a game to open it on Roblox. ⚠️ = the place also has some licensed checks, so it may be a real customer who hasn't linked yet.</p>

		{#each data.piracy as p}
			{#if p.unlicensedPlaces > 0 || p.suspects.length > 0}
				<div class="prodblock">
					<div class="prodhead">
						<strong>{p.product}</strong>
						<span class="badge {p.unlicensedPlaces >= 10 ? 'red' : p.unlicensedPlaces >= 3 ? 'yellow' : 'green'}">
							{p.unlicensedPlaces} unlicensed game{p.unlicensedPlaces === 1 ? '' : 's'}
						</span>
						<span class="muted" style="font-size:12px;">{p.totalDenied} denied checks</span>
					</div>
					<table>
						<thead><tr><th>Game</th><th>Creator</th><th>Denied hits</th><th>Last seen</th><th></th></tr></thead>
						<tbody>
							{#each p.suspects as s}
								<tr class:dim={s.alsoLicensed}>
									<td>
										{#if s.game.name}<strong>{s.game.name}</strong>{:else}<span class="muted">place {s.placeId}</span>{/if}
										{#if s.alsoLicensed}<span title="Also has licensed checks — may be a real customer">⚠️</span>{/if}
									</td>
									<td class="muted">{s.game.creator || '—'}{#if s.game.creatorType === 'Group'} (group){/if}</td>
									<td>{s.hits}</td>
									<td class="muted">{fmtDate(s.lastSeen)}</td>
									<td class="right"><a class="opengame" href={s.game.url} target="_blank" rel="noreferrer">Open ↗</a></td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		{/each}
		{#if data.piracy.length === 0}<p class="muted" style="text-align:center; padding:20px;">No denied-place activity in the last 30 days. 🎉</p>{/if}
	</div>

	<div class="card">
		<h2>Verification volume — last 14 days</h2>
		<div style="display:flex; align-items:flex-end; gap:6px; height:150px;">
			{#each data.volume as v}
				<div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:4px;" title={`${v.day}: ${v.allow} allowed, ${v.deny} denied`}>
					<div style="width:100%; display:flex; flex-direction:column-reverse; height:120px;">
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
{/if}

<style>
	.prodblock { border: 1px solid var(--border); border-radius: 8px; padding: 12px 14px; margin-top: 14px; }
	.prodhead { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
	.opengame { font-size: 12px; font-weight: 600; padding: 4px 10px; border: 1px solid var(--accent); border-radius: 6px; }
	.opengame:hover { background: var(--accent); color: #fff; text-decoration: none; }
	tr.dim td { opacity: 0.55; }
</style>
