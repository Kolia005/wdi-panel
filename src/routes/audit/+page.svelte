<script>
	import { goto } from '$app/navigation';
	let { data } = $props();
	function onFilter(e) { goto(`/audit?action=${encodeURIComponent(e.target.value)}`); }
	function fmtDate(d) { return d ? new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'medium' }) : '—'; }
	function fmtDetails(d) {
		return Object.entries(d).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('  ·  ');
	}
	function actionColor(a) {
		if (a.includes('delete') || a.includes('revoke') || a.includes('unlink')) return 'red';
		if (a.includes('create') || a.includes('grant') || a.includes('link')) return 'green';
		return 'yellow';
	}
</script>

<h1 class="page-title">Audit Log <span class="muted" style="font-size:16px;">({data.total})</span></h1>

<select class="search" value={data.action} onchange={onFilter} style="cursor:pointer; max-width:300px;">
	<option value="">All actions</option>
	{#each data.actionTypes as a}<option value={a}>{a}</option>{/each}
</select>

<div class="card" style="padding:0;">
	<table>
		<thead><tr><th>Action</th><th>Details</th><th>When</th></tr></thead>
		<tbody>
			{#each data.entries as e}
				<tr>
					<td><span class="badge {actionColor(e.action)}">{e.action}</span></td>
					<td class="muted" style="font-size:13px;">{fmtDetails(e.details)}</td>
					<td class="muted" style="white-space:nowrap;">{fmtDate(e.at)}</td>
				</tr>
			{/each}
			{#if data.entries.length === 0}
				<tr><td colspan="3" class="muted" style="text-align:center; padding:30px;">No audit entries yet. Actions you take in the panel will be recorded here.</td></tr>
			{/if}
		</tbody>
	</table>
</div>

{#if data.totalPages > 1}
	<div class="pager">
		{#if data.page > 1}<a class="pgbtn" href={`/audit?action=${encodeURIComponent(data.action)}&page=${data.page - 1}`}>← Prev</a>{/if}
		<span class="muted">Page {data.page} of {data.totalPages}</span>
		{#if data.page < data.totalPages}<a class="pgbtn" href={`/audit?action=${encodeURIComponent(data.action)}&page=${data.page + 1}`}>Next →</a>{/if}
	</div>
{/if}

<style>
	.pager { display: flex; gap: 8px; align-items: center; justify-content: center; margin-top: 16px; }
	.pgbtn { background: var(--bg-card); color: var(--text); border: 1px solid var(--border); padding: 8px 14px; border-radius: 8px; }
	.pgbtn:hover { border-color: var(--accent); text-decoration: none; }
</style>
