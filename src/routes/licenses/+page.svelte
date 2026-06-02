<script>
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import Confirm from '$lib/Confirm.svelte';

	let { data, form } = $props();

	let showGrant = $state(false);
	let showBulk = $state(false);

	// confirm-everything: hold the pending form submit
	let confirmOpen = $state(false);
	let confirmCfg = $state({ title: '', message: '', danger: false });
	let pendingSubmit = null;

	function armConfirm(cfg) {
		return ({ cancel, submit }) => {
			confirmCfg = cfg;
			pendingSubmit = submit;
			confirmOpen = true;
			cancel(); // hold until confirmed
			return async () => {}; // no-op; real submit happens after confirm
		};
	}
	function doConfirm() {
		confirmOpen = false;
		pendingSubmit?.();
		pendingSubmit = null;
	}

	function onFilter(e) { goto(`/licenses?product=${encodeURIComponent(e.target.value)}`); }
	function gotoPage(p) { goto(`/licenses?product=${encodeURIComponent(data.productFilter)}&page=${p}`); }
	function fmtDate(d) { return d ? new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—'; }
</script>

<Confirm bind:open={confirmOpen} title={confirmCfg.title} message={confirmCfg.message} danger={confirmCfg.danger} confirmLabel={confirmCfg.danger ? 'Yes, do it' : 'Confirm'} onconfirm={doConfirm} />

<div style="display:flex; justify-content:space-between; align-items:center;">
	<h1 class="page-title">Licenses <span class="muted" style="font-size:16px;">({data.total})</span></h1>
	<div style="display:flex; gap:10px;">
		<button class="btn primary" onclick={() => (showGrant = !showGrant)}>+ Grant license</button>
		<button class="btn ghost" onclick={() => (showBulk = !showBulk)}>Bulk grant</button>
	</div>
</div>

{#if form?.message}
	<div class="toast {form.ok ? 'ok' : 'err'}">{form.message}</div>
{/if}

{#if showGrant}
	<div class="card">
		<h2>Grant a license</h2>
		<form method="POST" action="?/grant" use:enhance={armConfirm({ title: 'Grant license', message: 'Grant this product to this client?' })}>
			<div class="row">
				<input name="clientId" class="inp" placeholder="Client _id (Mongo id)" required />
				<select name="productId" class="inp" required>
					<option value="">Select product…</option>
					{#each data.productList as p}<option value={p.id}>{p.name}</option>{/each}
				</select>
				<button class="btn primary" type="submit">Grant</button>
			</div>
			<p class="muted" style="font-size:12px; margin-top:8px;">Tip: find a client's id from their profile page URL, or grant directly from a client's profile.</p>
		</form>
	</div>
{/if}

{#if showBulk}
	<div class="card">
		<h2>Bulk grant by Roblox IDs</h2>
		<form method="POST" action="?/bulkGrant" use:enhance={armConfirm({ title: 'Bulk grant', message: 'Grant this product to all listed Roblox IDs?' })}>
			<select name="productId" class="inp" required style="margin-bottom:10px;">
				<option value="">Select product…</option>
				{#each data.productList as p}<option value={p.id}>{p.name}</option>{/each}
			</select>
			<textarea name="robloxIds" class="inp" rows="4" placeholder="Paste Roblox IDs, separated by spaces, commas, or newlines"></textarea>
			<button class="btn primary" type="submit" style="margin-top:10px;">Bulk grant</button>
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
						<form method="POST" action="?/revoke" use:enhance={armConfirm({ title: 'Revoke license', message: `Revoke ${l.productName} from ${l.robloxName}?`, danger: true })} style="display:inline;">
							<input type="hidden" name="whitelistId" value={l.id} />
							<button class="btn-sm danger" type="submit">Revoke</button>
						</form>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

{#if data.totalPages > 1}
	<div style="display:flex; gap:8px; align-items:center; justify-content:center; margin-top:16px;">
		<button class="pgbtn" disabled={data.page <= 1} onclick={() => gotoPage(data.page - 1)}>← Prev</button>
		<span class="muted">Page {data.page} of {data.totalPages}</span>
		<button class="pgbtn" disabled={data.page >= data.totalPages} onclick={() => gotoPage(data.page + 1)}>Next →</button>
	</div>
{/if}

<style>
	.btn { padding: 9px 16px; border-radius: 8px; border: 1px solid var(--border); cursor: pointer; font-weight: 600; font-size: 13px; }
	.btn.primary { background: var(--accent); color: #fff; border-color: var(--accent); }
	.btn.ghost { background: transparent; color: var(--text); }
	.btn-sm { padding: 5px 12px; border-radius: 6px; border: 1px solid var(--border); cursor: pointer; font-size: 12px; font-weight: 600; }
	.btn-sm.danger { background: transparent; color: var(--red); border-color: var(--red); }
	.btn-sm.danger:hover { background: var(--red); color: #fff; }
	.row { display: flex; gap: 10px; align-items: center; }
	.inp { width: 100%; padding: 9px 12px; background: var(--bg-elev); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 14px; }
	.inp:focus { outline: none; border-color: var(--accent); }
	select.inp option, select.search option { background: var(--bg-elev); }
	.pgbtn { background: var(--bg-card); color: var(--text); border: 1px solid var(--border); padding: 8px 14px; border-radius: 8px; cursor: pointer; }
	.pgbtn:disabled { opacity: 0.4; }
	.toast { padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-weight: 500; }
	.toast.ok { background: rgba(63,185,80,0.15); color: var(--green); border: 1px solid var(--green); }
	.toast.err { background: rgba(248,81,73,0.15); color: var(--red); border: 1px solid var(--red); }
</style>
