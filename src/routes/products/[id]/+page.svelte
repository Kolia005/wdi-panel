<script>
	import { enhance } from '$app/forms';
	import Confirm from '$lib/Confirm.svelte';
	let { data, form } = $props();
	const { product, owners } = data;

	let editing = $state(false);
	let confirmOpen = $state(false);
	let confirmCfg = $state({ title: '', message: '', danger: false });
	let pendingSubmit = null;
	function armConfirm(cfg) {
		return ({ cancel, submit }) => { confirmCfg = cfg; pendingSubmit = submit; confirmOpen = true; cancel(); return async () => {}; };
	}
	function doConfirm() { confirmOpen = false; pendingSubmit?.(); pendingSubmit = null; }
	function fmtDate(d) { return d ? new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—'; }
</script>

<Confirm bind:open={confirmOpen} title={confirmCfg.title} message={confirmCfg.message} danger={confirmCfg.danger} confirmLabel={confirmCfg.danger ? 'Yes, delete' : 'Confirm'} onconfirm={doConfirm} />

<a href="/products" class="muted">← Back to products</a>

{#if form?.message}<div class="toast {form.ok ? 'ok' : 'err'}">{form.message}</div>{/if}

<div style="display:flex; justify-content:space-between; align-items:flex-start; margin:16px 0 6px;">
	<div>
		<h1 class="page-title" style="margin:0;">{product.name}</h1>
		<p class="muted" style="margin-top:4px;">{product.description}</p>
	</div>
	<div style="display:flex; gap:8px;">
		<button class="btn ghost" onclick={() => (editing = !editing)}>Edit</button>
		<form method="POST" action="?/delete" use:enhance={armConfirm({ title: 'Delete product', message: `Delete "${product.name}" and remove ALL ${owners.length} license(s) for it? This cannot be undone.`, danger: true })}>
			<button class="btn danger" type="submit">Delete</button>
		</form>
	</div>
</div>

{#if editing}
	<div class="card">
		<h2>Edit product</h2>
		<form method="POST" action="?/edit" use:enhance={armConfirm({ title: 'Save changes', message: 'Update this product?' })}>
			<div style="display:grid; gap:10px;">
				<label>Name<input name="name" class="inp" value={product.name} required /></label>
				<label>Description<input name="description" class="inp" value={product.description} /></label>
				<label>File URL<input name="fileurl" class="inp" value={product.fileurl} /></label>
				<button class="btn primary" type="submit" style="justify-self:start;">Save</button>
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
	.btn { padding: 9px 16px; border-radius: 8px; border: 1px solid var(--border); cursor: pointer; font-weight: 600; font-size: 13px; }
	.btn.primary { background: var(--accent); color: #fff; border-color: var(--accent); }
	.btn.ghost { background: transparent; color: var(--text); }
	.btn.danger { background: transparent; color: var(--red); border-color: var(--red); }
	.btn.danger:hover { background: var(--red); color: #fff; }
	label { display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: var(--text-dim); }
	.inp { width: 100%; padding: 9px 12px; background: var(--bg-elev); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 14px; }
	.inp:focus { outline: none; border-color: var(--accent); }
	.toast { padding: 12px 16px; border-radius: 8px; margin: 16px 0; font-weight: 500; }
	.toast.ok { background: rgba(63,185,80,0.15); color: var(--green); border: 1px solid var(--green); }
	.toast.err { background: rgba(248,81,73,0.15); color: var(--red); border: 1px solid var(--red); }
</style>
