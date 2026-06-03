<script>
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { confirmAction } from '$lib/Confirm.svelte';

	let { data, form } = $props();
	let showGrant = $state(false);
	let showBulk = $state(false);
	let grantForm = $state();
	let bulkForm = $state();

	function onFilter(e) { goto(`/licenses?product=${encodeURIComponent(e.target.value)}`); }
	function fmtDate(d) { return d ? new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—'; }
</script>

<div style="display:flex; justify-content:space-between; align-items:center;">
	<h1 class="page-title">Licenses <span class="muted" style="font-size:16px;">({data.total})</span></h1>
	<div style="display:flex; gap:10px;">
		<button class="btn primary" onclick={() => (showGrant = !showGrant)}>+ Grant license</button>
		<button class="btn ghost" onclick={() => (showBulk = !showBulk)}>Bulk grant</button>
	</div>
</div>

{#if form?.message}<div class="toast {form.ok ? 'ok' : 'err'}">{form.message}</div>{/if}

{#if showGrant}
	<div class="card">
		<h2>Grant a license</h2>
		<form method="POST" action="?/grant" bind:this={grantForm} use:enhance>
			<div class="row">
				<input name="clientId" class="inp" placeholder="Client _id (from their profile URL)" required />
				<select name="productId" class="inp" required>
					<option value="">Select product…</option>
					{#each data.productList as p}<option value={p.id}>{p.name}</option>{/each}
				</select>
				<button class="btn primary" type="button"
					onclick={() => { if (grantForm.reportValidity()) confirmAction({ title: 'Grant license', message: 'Grant this product to this client?', run: () => grantForm.requestSubmit() }); }}
				>Grant</button>
			</div>
			<p class="muted" style="font-size:12px; margin-top:8px;">Tip: easiest to grant directly from a client's profile page.</p>
		</form>
	</div>
{/if}

{#if showBulk}
	<div class="card">
		<h2>Bulk grant by Roblox IDs</h2>
		<form method="POST" action="?/bulkGrant" bind:this={bulkForm} use:enhance>
			<select name="productId" class="inp" required style="margin-bottom:10px;">
				<option value="">Select product…</option>
				{#each data.productList as p}<option value={p.id}>{p.name}</option>{/each}
			</select>
			<textarea name="robloxIds" class="inp" rows="4" placeholder="Paste Roblox IDs, separated by spaces, commas, or newlines"></textarea>
			<button class="btn primary" type="button" style="margin-top:10px;"
				onclick={() => { if (bulkForm.reportValidity()) confirmAction({ title: 'Bulk grant', message: 'Grant this product to all listed Roblox IDs?', run: () => bulkForm.requestSubmit() }); }}
			>Bulk grant</button>
		</form>
	</div>
{/if}

<select class="search" value={data.productFilter} onchange={onFilter} style="cursor:pointer;">
	<option value="">All products</option>
	{#each data.productList as p}<option value={p.id}>{p.name}</option>{/each}
</select>

<div class="card" style="padding:0;">
	<table>
		<thead><tr><th>Product</th><th>Roblox</th><th>Roblox ID</th><th>Granted</th><th></th></tr></thead>
		<tbody>
			{#each data.licenses as l}
				<tr>
					<td>{#if l.productId}<a href={`/products/${l.productId}`}>{l.productName}</a>{:else}{l.productName}{/if}</td>
					<td>{#if l.clientId}<a href={`/clients/${l.clientId}`}>{l.robloxName}</a>{:else}{l.robloxName}{/if}</td>
					<td class="muted">{l.roblox}</td>
					<td class="muted">{fmtDate(l.created)}</td>
					<td class="right">
						<form method="POST" action="?/revoke" use:enhance style="display:inline;">
							<input type="hidden" name="whitelistId" value={l.id} />
							<button class="btn-sm danger" type="button"
								onclick={(e) => confirmAction({ title: 'Revoke license', message: `Revoke ${l.productName} from ${l.robloxName}?`, danger: true, run: () => e.target.closest('form').requestSubmit() })}
							>Revoke</button>
						</form>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

{#if data.totalPages > 1}
	<div class="pager">
		{#if data.page > 1}<a class="pgbtn" href={`/licenses?product=${encodeURIComponent(data.productFilter)}&page=${data.page - 1}`}>← Prev</a>{/if}
		<span class="muted">Page {data.page} of {data.totalPages}</span>
		{#if data.page < data.totalPages}<a class="pgbtn" href={`/licenses?product=${encodeURIComponent(data.productFilter)}&page=${data.page + 1}`}>Next →</a>{/if}
	</div>
{/if}

<style>
	.btn-sm { padding: 5px 12px; border-radius: 6px; border: 1px solid var(--red); cursor: pointer; font-size: 12px; font-weight: 600; background: transparent; color: var(--red); }
	.btn-sm.danger:hover { background: var(--red); color: #fff; }
	.row { display: flex; gap: 10px; align-items: center; }
	.pager { display: flex; gap: 8px; align-items: center; justify-content: center; margin-top: 16px; }
	.pgbtn { background: var(--bg-card); color: var(--text); border: 1px solid var(--border); padding: 8px 14px; border-radius: 8px; }
	.pgbtn:hover { border-color: var(--accent); text-decoration: none; }
</style>
