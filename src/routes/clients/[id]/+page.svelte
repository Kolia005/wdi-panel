<script>
	import { enhance } from '$app/forms';
	import { confirmAction } from '$lib/Confirm.svelte';
	let { data, form } = $props();
	const { client, licenses, grantable } = data;

	let editing = $state(false);
	let editForm = $state();
	let grantForm = $state();
	let unlinkForm = $state();

	function fmtDate(d) { return d ? new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—'; }
</script>

<a href="/clients" class="muted">← Back to clients</a>

{#if form?.message}<div class="toast {form.ok ? 'ok' : 'err'}">{form.message}</div>{/if}

<div style="display:flex; align-items:center; gap:18px; margin:18px 0 26px;">
	<img src={`https://www.roblox.com/headshot-thumbnail/image?userId=${client.roblox}&width=150&height=150&format=png`} alt="avatar" style="width:80px; height:80px; border-radius:12px; background:var(--bg-card); border:1px solid var(--border);" />
	<div style="flex:1;">
		<h1 class="page-title" style="margin:0;">{client.robloxName}
			{#if client.inServer === true}<span class="badge green" style="font-size:12px; vertical-align:middle;">In server</span>
			{:else if client.inServer === false}<span class="badge red" style="font-size:12px; vertical-align:middle;">Left server — can't DM</span>
			{:else}<span class="badge yellow" style="font-size:12px; vertical-align:middle;">membership unknown</span>{/if}
		</h1>
		{#if client.robloxDisplay && client.robloxDisplay !== client.robloxName}<div class="muted">"{client.robloxDisplay}"</div>{/if}
	</div>
	<div style="display:flex; gap:8px;">
		<button class="btn ghost" onclick={() => (editing = !editing)}>Edit</button>
		<form method="POST" action="?/unlink" bind:this={unlinkForm} use:enhance>
			<input type="hidden" name="confirm" value="1" />
			<button class="btn danger" type="button"
				onclick={() => confirmAction({ title: 'Unlink client', message: `Unlink ${client.robloxName} and remove ALL ${licenses.length} of their licenses? This cannot be undone.`, danger: true, run: () => unlinkForm.requestSubmit() })}
			>Unlink</button>
		</form>
	</div>
</div>

{#if editing}
	<div class="card">
		<h2>Edit client</h2>
		<form method="POST" action="?/edit" bind:this={editForm} use:enhance>
			<div class="row">
				<label>Roblox ID<input name="roblox" class="inp" value={client.roblox} required /></label>
				<label>Discord ID<input name="discord" class="inp" value={client.discord} required /></label>
				<button class="btn primary" type="button" style="align-self:flex-end;"
					onclick={() => { if (editForm.reportValidity()) confirmAction({ title: 'Save changes', message: "Update this client's Roblox/Discord IDs?", run: () => editForm.requestSubmit() }); }}
				>Save</button>
			</div>
		</form>
	</div>
{/if}

<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; margin-bottom:24px;">
	<div class="kpi"><div class="label">Roblox ID</div><div class="value" style="font-size:18px;">{client.roblox}</div>
		<a class="sub" style="color:var(--accent);" href={`https://www.roblox.com/users/${client.roblox}/profile`} target="_blank" rel="noreferrer">View profile →</a></div>
	<div class="kpi"><div class="label">Discord ID</div><div class="value" style="font-size:18px;">{client.discord}</div></div>
	<div class="kpi"><div class="label">Licenses</div><div class="value">{licenses.length}</div></div>
	<div class="kpi"><div class="label">Linked</div><div class="value" style="font-size:18px;">{fmtDate(client.created)}</div></div>
</div>

<div class="card">
	<h2>Grant a product</h2>
	<form method="POST" action="?/grant" bind:this={grantForm} use:enhance>
		<div class="row">
			<select name="productId" class="inp" required>
				<option value="">Select a product to grant…</option>
				{#each grantable as p}<option value={p.id}>{p.name}</option>{/each}
			</select>
			<button class="btn primary" type="button"
				onclick={() => { if (grantForm.reportValidity()) confirmAction({ title: 'Grant product', message: 'Grant this product to this client?', run: () => grantForm.requestSubmit() }); }}
			>Grant</button>
		</div>
		{#if grantable.length === 0}<p class="muted" style="margin-top:8px;">This client already owns every product.</p>{/if}
	</form>
</div>

<div class="card">
	<h2>Owned products ({licenses.length})</h2>
	<table>
		<thead><tr><th>Product</th><th>Granted</th><th></th></tr></thead>
		<tbody>
			{#each licenses as l}
				<tr>
					<td>{#if l.productId}<a href={`/products/${l.productId}`}>{l.productName}</a>{:else}{l.productName}{/if}</td>
					<td class="muted">{fmtDate(l.created)}</td>
					<td class="right">
						{#if l.productId}
						<form method="POST" action="?/revoke" use:enhance style="display:inline;" id={`rev-${l.productId}`}>
							<input type="hidden" name="productId" value={l.productId} />
							<button class="btn-sm danger" type="button"
								onclick={(e) => confirmAction({ title: 'Revoke product', message: `Revoke ${l.productName} from ${client.robloxName}?`, danger: true, run: () => e.target.closest('form').requestSubmit() })}
							>Revoke</button>
						</form>
						{/if}
					</td>
				</tr>
			{/each}
			{#if licenses.length === 0}<tr><td colspan="3" class="muted" style="text-align:center; padding:24px;">No products owned.</td></tr>{/if}
		</tbody>
	</table>
</div>

<style>
	.btn-sm { padding: 5px 12px; border-radius: 6px; border: 1px solid var(--border); cursor: pointer; font-size: 12px; font-weight: 600; background: transparent; color: var(--red); border-color: var(--red); }
	.btn-sm.danger:hover { background: var(--red); color: #fff; }
	.row { display: flex; gap: 12px; align-items: center; }
	label { display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: var(--text-dim); flex: 1; }
</style>
