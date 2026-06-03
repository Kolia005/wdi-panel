<script>
	import { enhance } from '$app/forms';
	import { confirmAction } from '$lib/Confirm.svelte';
	let { data, form } = $props();
	const { product, owners } = data;

	let editing = $state(false);
	let editForm = $state();
	let deleteForm = $state();

	function fmtDate(d) { return d ? new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—'; }
</script>

<a href="/products" class="muted">← Back to products</a>

{#if form?.message}<div class="toast {form.ok ? 'ok' : 'err'}">{form.message}</div>{/if}

<div style="display:flex; justify-content:space-between; align-items:flex-start; margin:16px 0 6px;">
	<div>
		<h1 class="page-title" style="margin:0;">{product.name}</h1>
		<p class="muted" style="margin-top:4px;">{product.description}</p>
	</div>
	<div style="display:flex; gap:8px;">
		<button class="btn ghost" onclick={() => (editing = !editing)}>Edit</button>
		<form method="POST" action="?/delete" bind:this={deleteForm} use:enhance>
			<input type="hidden" name="confirm" value="1" />
			<button class="btn danger" type="button"
				onclick={() => confirmAction({ title: 'Delete product', message: `Delete "${product.name}" and remove ALL ${owners.length} license(s) for it? This cannot be undone.`, danger: true, run: () => deleteForm.requestSubmit() })}
			>Delete</button>
		</form>
	</div>
</div>

{#if editing}
	<div class="card">
		<h2>Edit product</h2>
		<form method="POST" action="?/edit" bind:this={editForm} use:enhance>
			<div style="display:grid; gap:10px;">
				<label>Name<input name="name" class="inp" value={product.name} required /></label>
				<label>Description<input name="description" class="inp" value={product.description} /></label>
				<label>File URL<input name="fileurl" class="inp" value={product.fileurl} /></label>
				<button class="btn primary" type="button" style="justify-self:start;"
					onclick={() => { if (editForm.reportValidity()) confirmAction({ title: 'Save changes', message: 'Update this product?', run: () => editForm.requestSubmit() }); }}
				>Save</button>
			</div>
		</form>
	</div>
{/if}

<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:16px; margin:20px 0;">
	<div class="kpi"><div class="label">Owners</div><div class="value">{owners.length}</div></div>
	<div class="kpi"><div class="label">File</div><div class="value" style="font-size:18px;">{product.hasFile ? `stored (${product.fileFormat})` : product.fileurl ? 'external url' : 'none'}</div></div>
	<div class="kpi"><div class="label">Created</div><div class="value" style="font-size:18px;">{fmtDate(product.created)}</div></div>
</div>

<div class="card">
	<h2>Owners ({owners.length})</h2>
	<table>
		<thead><tr><th>Roblox</th><th>Roblox ID</th><th>Discord ID</th><th>Granted</th></tr></thead>
		<tbody>
			{#each owners as o}
				<tr>
					<td>{#if o.clientId}<a href={`/clients/${o.clientId}`}>{o.robloxName}</a>{:else}{o.robloxName}{/if}</td>
					<td class="muted">{o.roblox}</td>
					<td class="muted">{o.discord}</td>
					<td class="muted">{fmtDate(o.created)}</td>
				</tr>
			{/each}
			{#if owners.length === 0}<tr><td colspan="4" class="muted" style="text-align:center; padding:24px;">No owners yet.</td></tr>{/if}
		</tbody>
	</table>
</div>

<style>
	label { display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: var(--text-dim); }
</style>
