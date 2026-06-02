<script>
	let { data } = $props();
	const { kpis, topProducts, recentLicenses, growth } = data;

	const maxGrowth = Math.max(1, ...growth.map((g) => g.count));
	const maxTop = Math.max(1, ...topProducts.map((p) => p.count));

	function fmtDate(d) {
		return new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
	}
</script>

<h1 class="page-title">Dashboard</h1>

<div class="kpi-grid">
	<div class="kpi">
		<div class="label">Clients</div>
		<div class="value">{kpis.clientCount}</div>
		<div class="sub">+{kpis.clientsThisWeek} this week</div>
	</div>
	<div class="kpi">
		<div class="label">Products</div>
		<div class="value">{kpis.productCount}</div>
	</div>
	<div class="kpi">
		<div class="label">Active Licenses</div>
		<div class="value">{kpis.licenseCount}</div>
		<div class="sub">+{kpis.licensesThisWeek} this week</div>
	</div>
	<div class="kpi">
		<div class="label">Avg licenses / client</div>
		<div class="value">{(kpis.licenseCount / Math.max(1, kpis.clientCount)).toFixed(1)}</div>
	</div>
</div>

<div class="card">
	<h2>License grants — last 14 days</h2>
	{#if growth.length === 0}
		<p class="muted">No grants in the last 14 days.</p>
	{:else}
		<div style="display:flex; align-items:flex-end; gap:6px; height:140px;">
			{#each growth as g}
				<div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:6px;">
					<div
						title={`${g._id}: ${g.count}`}
						style={`width:100%; background:var(--accent); border-radius:4px 4px 0 0; height:${(g.count / maxGrowth) * 110}px; min-height:3px;`}
					></div>
					<div class="muted" style="font-size:10px; transform:rotate(-45deg); white-space:nowrap;">{g._id.slice(5)}</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
	<div class="card">
		<h2>Top products by licenses</h2>
		<table>
			<tbody>
				{#each topProducts as p}
					<tr>
						<td>{p.name}</td>
						<td style="width:50%;">
							<div style="display:flex; align-items:center; gap:8px;">
								<div style={`height:8px; border-radius:4px; background:var(--accent); width:${(p.count / maxTop) * 100}%;`}></div>
								<span class="muted">{p.count}</span>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div class="card">
		<h2>Recent license grants</h2>
		<table>
			<thead><tr><th>Product</th><th>Roblox</th><th>When</th></tr></thead>
			<tbody>
				{#each recentLicenses as r}
					<tr>
						<td>{r.productName}</td>
						<td class="muted">{r.clientRoblox}</td>
						<td class="muted">{fmtDate(r.created)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
