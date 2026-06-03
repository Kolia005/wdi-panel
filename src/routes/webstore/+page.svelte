<script>
	import { enhance } from '$app/forms';
	let { data, form } = $props();
	let resolvingId = $state(null); // purchase id being resolved
	function fmtDate(d) { return d ? new Date(d).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '—'; }
	function statusBadge(s) { return s === 'granted' ? 'green' : s === 'held' ? 'yellow' : s === 'refunded' ? 'red' : 'yellow'; }
</script>

<h1 class="page-title">Web Store <span class="muted" style="font-size:15px;">Wix purchases</span></h1>

{#if form?.message}<div class="toast {form.ok === false ? 'err' : 'ok'}">{form.message}</div>{/if}

<div class="kpi-grid">
	<div class="kpi"><div class="label">Granted (web)</div><div class="value" style="color:var(--green)">{data.grantedCount}</div></div>
	<div class="kpi"><div class="label">Needs attention (held)</div><div class="value" style="color:var(--yellow)">{data.heldCount}</div></div>
	<div class="kpi"><div class="label">Product mappings</div><div class="value">{data.mappings.length}</div></div>
</div>

{#if data.heldCount > 0}
	<div class="card" style="border-color:var(--yellow);">
		<h2>⚠️ Held purchases — need manual action</h2>
		<p class="muted" style="font-size:13px; margin-top:-6px;">These paid but couldn't auto-grant (bad Roblox name or unmapped product). Resolve each by entering the correct Roblox ID + product.</p>
		<table>
			<thead><tr><th>Wix order</th><th>Wix product</th><th>Typed Roblox</th><th>Reason</th><th>When</th><th></th></tr></thead>
			<tbody>
				{#each data.purchases.filter((p) => p.status === 'held') as p}
					<tr>
						<td class="muted">{p.wixOrderId || '—'}</td>
						<td>{p.wixProduct}</td>
						<td class="muted">{p.robloxInput}</td>
						<td><span class="badge yellow">{p.reason}</span></td>
						<td class="muted">{fmtDate(p.at)}</td>
						<td class="right"><button class="btn-sm" onclick={() => (resolvingId = resolvingId === p.id ? null : p.id)}>Resolve</button></td>
					</tr>
					{#if resolvingId === p.id}
						<tr>
							<td colspan="6" style="background:var(--bg-elev);">
								<form method="POST" action="?/resolveHeld" use:enhance class="resolverow">
									<input type="hidden" name="purchaseId" value={p.id} />
									<input class="inp" name="robloxId" placeholder="Correct Roblox ID (numeric)" required />
									<select class="inp" name="productId" required>
										<option value="">Product…</option>
										{#each data.products as pr}<option value={pr.id}>{pr.name}</option>{/each}
									</select>
									<button class="btn primary" type="submit">Grant</button>
								</form>
							</td>
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<div class="card">
	<h2>Product mapping (Wix name → WDI product)</h2>
	<p class="muted" style="font-size:13px; margin-top:-6px;">Auto-matching tries exact name first; add a mapping here when your Wix product name differs from the WDI product name.</p>
	<form method="POST" action="?/saveMapping" use:enhance class="resolverow" style="margin-bottom:14px;">
		<input class="inp" name="wixName" placeholder="Exact Wix product name" required />
		<select class="inp" name="productId" required>
			<option value="">WDI product…</option>
			{#each data.products as pr}<option value={pr.id}>{pr.name}</option>{/each}
		</select>
		<button class="btn primary" type="submit">Save mapping</button>
	</form>
	<table>
		<thead><tr><th>Wix name</th><th>→ WDI product</th><th></th></tr></thead>
		<tbody>
			{#each data.mappings as m}
				<tr>
					<td>{m.wixName}</td>
					<td><strong>{m.productName}</strong></td>
					<td class="right">
						<form method="POST" action="?/deleteMapping" use:enhance style="display:inline;">
							<input type="hidden" name="id" value={m.id} />
							<button class="btn-sm danger" type="submit">Remove</button>
						</form>
					</td>
				</tr>
			{/each}
			{#if data.mappings.length === 0}<tr><td colspan="3" class="muted" style="text-align:center; padding:16px;">No custom mappings. Exact-name matches still work automatically.</td></tr>{/if}
		</tbody>
	</table>
</div>

<div class="card">
	<h2>Recent web purchases</h2>
	<table>
		<thead><tr><th>Status</th><th>Product</th><th>Roblox</th><th>Email</th><th>When</th></tr></thead>
		<tbody>
			{#each data.purchases as p}
				<tr>
					<td><span class="badge {statusBadge(p.status)}">{p.status}</span></td>
					<td>{p.productName || p.wixProduct}</td>
					<td class="muted">{p.robloxName || p.robloxInput}</td>
					<td class="muted">{p.email || '—'}</td>
					<td class="muted">{fmtDate(p.at)}</td>
				</tr>
			{/each}
			{#if data.purchases.length === 0}<tr><td colspan="5" class="muted" style="text-align:center; padding:20px;">No web purchases yet.</td></tr>{/if}
		</tbody>
	</table>
</div>

<style>
	.resolverow { display: flex; gap: 10px; align-items: center; }
	.resolverow .inp { flex: 1; }
	.btn-sm { padding: 5px 12px; border-radius: 6px; border: 1px solid var(--border); cursor: pointer; font-size: 12px; font-weight: 600; background: var(--bg-elev); color: var(--text); }
	.btn-sm.danger { color: var(--red); border-color: var(--red); background: transparent; }
	.btn-sm.danger:hover { background: var(--red); color: #fff; }
</style>
