<script>
	let { data, form } = $props();
</script>

<div style="display:flex; justify-content:space-between; align-items:center;">
	<h1 class="page-title">Clients <span class="muted" style="font-size:16px;">({data.total})</span></h1>
	<a class="cbtn primary" href="?link=1#linkform">+ Force-link</a>
</div>

{#if form?.message}<div class="toast {form.ok ? 'ok' : 'err'}">{form.message}</div>{/if}

{#if data.showLink}
	<div class="card" id="linkform">
		<h2>Force-link a Roblox account to a Discord user</h2>
		<form method="POST" action="?/forcelink">
			<div class="row">
				<input name="roblox" class="inp" placeholder="Roblox ID" required />
				<input name="discord" class="inp" placeholder="Discord ID" required />
				<button class="cbtn primary" type="submit">Link</button>
			</div>
		</form>
	</div>
{/if}

<form method="GET">
	<input class="search" name="q" value={data.q} placeholder="Search by Roblox ID or Discord ID…" />
</form>

<div class="card" style="padding:0;">
	<table>
		<thead><tr><th>Roblox</th><th>Roblox ID</th><th>Discord ID</th><th>Licenses</th><th>Linked</th></tr></thead>
		<tbody>
			{#each data.clients as c}
				<tr>
					<td><a href={`/clients/${c.id}`}><strong>{c.robloxName}</strong></a></td>
					<td class="muted">{c.roblox}</td>
					<td class="muted">{c.discord}</td>
					<td><span class="badge {c.licenses > 0 ? 'green' : 'yellow'}">{c.licenses}</span></td>
					<td class="muted">{c.created ? new Date(c.created).toLocaleDateString('en-GB', { dateStyle: 'medium' }) : '—'}</td>
				</tr>
			{/each}
			{#if data.clients.length === 0}
				<tr><td colspan="5" class="muted" style="text-align:center; padding:30px;">No clients found.</td></tr>
			{/if}
		</tbody>
	</table>
</div>

{#if data.totalPages > 1}
	<div class="pager">
		{#if data.page > 1}<a class="pgbtn" href={`?q=${encodeURIComponent(data.q)}&page=${data.page - 1}`}>← Prev</a>{/if}
		<span class="muted">Page {data.page} of {data.totalPages}</span>
		{#if data.page < data.totalPages}<a class="pgbtn" href={`?q=${encodeURIComponent(data.q)}&page=${data.page + 1}`}>Next →</a>{/if}
	</div>
{/if}

<style>
	.cbtn { padding: 9px 16px; border-radius: 8px; border: 1px solid var(--border); cursor: pointer; font-weight: 600; font-size: 13px; }
	.cbtn.primary { background: var(--accent); color: #fff; border-color: var(--accent); }
	a.cbtn:hover { text-decoration: none; opacity: 0.9; }
	.row { display: flex; gap: 10px; align-items: center; }
	.inp { width: 100%; padding: 9px 12px; background: var(--bg-elev); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 14px; }
	.inp:focus { outline: none; border-color: var(--accent); }
	.pager { display: flex; gap: 8px; align-items: center; justify-content: center; margin-top: 16px; }
	.pgbtn { background: var(--bg-card); color: var(--text); border: 1px solid var(--border); padding: 8px 14px; border-radius: 8px; }
	.pgbtn:hover { border-color: var(--accent); text-decoration: none; }
	.toast { padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-weight: 500; }
	.toast.ok { background: rgba(63,185,80,0.15); color: var(--green); border: 1px solid var(--green); }
	.toast.err { background: rgba(248,81,73,0.15); color: var(--red); border: 1px solid var(--red); }
</style>
