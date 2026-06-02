<script>
	let { data } = $props();
</script>

<h1 class="page-title">Search results for "{data.q}"</h1>

<div class="card">
	<h2>Clients ({data.clients.length})</h2>
	{#if data.clients.length === 0}
		<p class="muted">No matching clients.</p>
	{:else}
		<table>
			<thead><tr><th>Roblox</th><th>Roblox ID</th><th>Discord ID</th></tr></thead>
			<tbody>
				{#each data.clients as c}
					<tr><td><a href={`/clients/${c.id}`}><strong>{c.robloxName}</strong></a></td><td class="muted">{c.roblox}</td><td class="muted">{c.discord}</td></tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<div class="card">
	<h2>Products ({data.products.length})</h2>
	{#if data.products.length === 0}
		<p class="muted">No matching products.</p>
	{:else}
		<table>
			<thead><tr><th>Name</th><th>Description</th></tr></thead>
			<tbody>
				{#each data.products as p}
					<tr><td><a href={`/products/${p.id}`}><strong>{p.name}</strong></a></td><td class="muted">{p.description}</td></tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<p class="muted" style="font-size:13px;">Tip: client search matches Roblox IDs and Discord IDs (usernames are resolved live, not stored).</p>
