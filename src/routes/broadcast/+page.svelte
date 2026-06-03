<script>
	import { enhance } from '$app/forms';
	import { confirmAction } from '$lib/Confirm.svelte';
	let { data, form } = $props();

	let productId = $state('');
	let message = $state('');
	let testDiscordId = $state('');
	let sendForm = $state();

	function fmtDate(d) { return d ? new Date(d).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '—'; }
	const selectedName = $derived(data.products.find((p) => p.id === productId)?.name || '');
</script>

<h1 class="page-title">Broadcast / Message</h1>
<p class="muted" style="margin-top:-8px;">DM all owners of a product through the bot. <strong>{data.membership.inServer}</strong> of <strong>{data.membership.total}</strong> linked users are currently in the server (only those can receive DMs).</p>

{#if form?.message}<div class="toast {form.ok === false ? 'err' : 'ok'}">{form.message}</div>{/if}

<div class="card">
	<h2>Compose</h2>

	<label class="lbl">Product
		<select class="inp" bind:value={productId}>
			<option value="">Select a product…</option>
			{#each data.products as p}<option value={p.id}>{p.name}</option>{/each}
		</select>
	</label>

	<!-- Preview reachable count -->
	<form method="POST" action="?/preview" use:enhance style="margin:10px 0;">
		<input type="hidden" name="productId" value={productId} />
		<button class="btn ghost" type="submit" disabled={!productId}>Check how many owners are reachable</button>
	</form>
	{#if form?._preview && form.ok}
		<div class="previewbox">
			<strong>{form.product}</strong>: {form.total} owners · <span style="color:var(--green)">{form.reachable} reachable</span> · <span style="color:var(--red)">{form.unreachable} left server (won't receive)</span>
		</div>
	{/if}

	<label class="lbl" style="margin-top:12px;">Message
		<textarea class="inp" rows="5" bind:value={message} placeholder="Your message to all owners of this product…"></textarea>
	</label>

	<!-- Test send -->
	<div class="card" style="background:var(--bg-elev); margin-top:14px;">
		<h2 style="font-size:14px;">Test first (recommended)</h2>
		<form method="POST" action="?/test" use:enhance>
			<input type="hidden" name="productId" value={productId} />
			<input type="hidden" name="message" value={message} />
			<div class="row">
				<input class="inp" name="testDiscordId" bind:value={testDiscordId} placeholder="Your Discord ID (sends only to you)" />
				<button class="btn" type="submit" disabled={!productId || !message || !testDiscordId}>Send test to this user</button>
			</div>
			<p class="muted" style="font-size:12px; margin-top:6px;">The user must own this product. Verifies your message + that DMs work before the full send.</p>
		</form>
	</div>

	<!-- Full send -->
	<form method="POST" action="?/send" bind:this={sendForm} use:enhance style="margin-top:16px;">
		<input type="hidden" name="productId" value={productId} />
		<input type="hidden" name="message" value={message} />
		<button class="btn danger" type="button" disabled={!productId || !message}
			onclick={() => confirmAction({
				title: 'Send to ALL owners',
				message: `Send this message to every reachable owner of "${selectedName}"? This DMs real customers and can't be undone. Sending is throttled (~1/sec) so it may take a few minutes.`,
				danger: true,
				run: () => sendForm.requestSubmit()
			})}
		>📣 Send to all owners of {selectedName || '…'}</button>
	</form>
	<p class="muted" style="font-size:12px; margin-top:8px;">Sends are throttled to respect Discord limits. Users who left the server are skipped automatically and reported.</p>
</div>

<div class="card">
	<div style="display:flex; justify-content:space-between; align-items:center;">
		<h2>Broadcast history</h2>
		<form method="POST" action="?/resync" use:enhance><button class="btn ghost" type="submit">↻ Re-sync membership</button></form>
	</div>
	<table>
		<thead><tr><th>Product</th><th>Message</th><th>Sent</th><th>Left</th><th>Failed</th><th>When</th></tr></thead>
		<tbody>
			{#each data.history as h}
				<tr>
					<td><strong>{h.product}</strong></td>
					<td class="muted" style="max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{h.message}</td>
					<td style="color:var(--green)">{h.sent}</td>
					<td class="muted">{h.notInServer}</td>
					<td style="color:var(--red)">{h.failed}</td>
					<td class="muted">{fmtDate(h.at)}</td>
				</tr>
			{/each}
			{#if data.history.length === 0}<tr><td colspan="6" class="muted" style="text-align:center; padding:20px;">No broadcasts sent yet.</td></tr>{/if}
		</tbody>
	</table>
</div>

<style>
	.lbl { display: block; font-size: 12px; color: var(--text-dim); margin-bottom: 4px; }
	.row { display: flex; gap: 10px; align-items: center; }
	.previewbox { padding: 10px 14px; background: var(--bg-elev); border: 1px solid var(--border); border-radius: 8px; font-size: 14px; }
</style>
