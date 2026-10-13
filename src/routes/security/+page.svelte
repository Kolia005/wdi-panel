<script>
	import { enhance } from '$app/forms';
	import { confirmAction } from '$lib/Confirm.svelte';
	let { data, form } = $props();

	let pack = $state('');
	let mode = $state('full');
	let killScope = $state('universe');
	let killValue = $state('');
	let killReason = $state('');
	let killForm = $state();
	let startAccessForm = $state();
	let endAccessForm = $state();

	function fmtDate(d) { return d ? new Date(d).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '—'; }
	const overrides = $derived(Object.entries(data.enforcement || {}));
	const modeText = { full: 'Full (entitlement + rig-lock)', entitlement: 'License only — rig-lock OFF', off: 'OFF — open to everyone' };
	const modeColor = { full: 'var(--green)', entitlement: 'var(--yellow)', off: 'var(--red)' };
	const lblStyle = 'flex:2; min-width:170px; display:flex; flex-direction:column; gap:4px; font-size:13px;';
</script>

<h1 class="page-title">Whitelist Security</h1>
<p class="muted" style="margin-top:-8px;">Remote controls for the in-game whitelist. Every change is <strong>signed</strong> into <code>/verify</code> and applies to every game on its next check.</p>

{#if form?.message}<div class="toast {form.ok === false ? 'err' : 'ok'}">{form.message}</div>{/if}

<div class="card">
 <h2>Open access and end-of-access message</h2>
 <p class="muted">Set the message shown by updated AVCS copies when access is denied. Saving the message does not start a trial.</p>
 {#if data.accessCampaign}
  <form method="POST" action="?/saveAccessCampaign" use:enhance style="display:grid; gap:12px; margin-top:16px;">
   <label><input type="checkbox" name="enabled" checked={data.accessCampaign.enabled} /> Show the configured message when access is denied</label>
   <fieldset style="border:1px solid var(--border); border-radius:8px; padding:12px;">
    <legend>Products</legend>
    {#each data.products as product}
     <label style="display:block; margin:6px 0;"><input type="checkbox" name="products" value={product} checked={data.accessCampaign.products.includes(product)} /> {product}</label>
    {/each}
   </fieldset>
   <label style={lblStyle}>Title<input class="inp" name="title" maxlength="120" value={data.accessCampaign.title} required /></label>
   <label style={lblStyle}>Player message<textarea class="inp" name="message" maxlength="1200" rows="3" required>{data.accessCampaign.message}</textarea></label>
   <p class="muted" style="font-size:12px; margin:0;">For players, refer to the experience's Social Links. Roblox does not permit direct Discord invites inside an experience.</p>
   <label style={lblStyle}>Studio owner message<textarea class="inp" name="studioMessage" maxlength="1200" rows="3" required>{data.accessCampaign.studioMessage}</textarea></label>
   <label style={lblStyle}>Discord invite for Studio owners<input class="inp" name="inviteUrl" type="url" maxlength="200" value={data.accessCampaign.inviteUrl} placeholder="https://discord.gg/…" /></label>
   <div><button class="btn" type="submit">Save message</button></div>
  </form>
  {#if data.accessCampaign.trial}
   <p><strong>{data.accessCampaign.trial.endsAt * 1000 > Date.now() ? 'Open access is active' : 'Open access has ended'}</strong> · Ends {fmtDate(data.accessCampaign.trial.endsAt * 1000)}</p>
  {:else}<p class="muted">No trial has been started.</p>{/if}
  <p class="muted" style="font-size:13px;">The selected products are open for 48 hours. At the deadline, full whitelist enforcement resumes on new license checks. Existing servers keep their startup authorization until they close. Paid licenses continue working. Campaign timing takes priority over the manual pack controls below.</p>
  <div style="display:flex; flex-wrap:wrap; gap:10px;">
   <form method="POST" action="?/startAccessCampaign" bind:this={startAccessForm} use:enhance>
    <button class="btn" type="button" disabled={!data.accessCampaign.enabled || (data.accessCampaign.trial && data.accessCampaign.trial.endsAt * 1000 > Date.now())}
     onclick={() => confirmAction({ title: 'Start 48-hour open access', message: `Open these products to everyone for 48 hours: ${data.accessCampaign.products.join(', ')}? The countdown starts immediately.`, run: () => startAccessForm.requestSubmit() })}>Start 48-hour open access</button>
   </form>
   {#if data.accessCampaign.trial && data.accessCampaign.trial.endsAt * 1000 > Date.now()}
    <form method="POST" action="?/endAccessCampaign" bind:this={endAccessForm} use:enhance>
     <button class="btn danger" type="button" onclick={() => confirmAction({ title: 'End open access now', message: 'Restore full whitelist enforcement for new license checks now?', danger: true, run: () => endAccessForm.requestSubmit() })}>End open access now</button>
    </form>
   {/if}
  </div>
 {:else}<p class="muted">Access settings could not be loaded. Reload before making changes.</p>{/if}
</div>

<div class="card alert-card">
	<div class="alert-heading">
		<div>
			<h2>Experience ownership alerts</h2>
			<p class="muted alert-copy">Group transfers and creator changes are recorded here. Discord DMs are not used for these alerts.</p>
		</div>
		<div class="alert-stats" aria-label="Security alert totals">
			<span class="stat danger"><strong>{data.alertCounts.unacknowledged}</strong> unacknowledged</span>
			<span class="stat"><strong>{data.alertCounts.active}</strong> active</span>
		</div>
	</div>

	{#if data.alerts.length === 0}
		<p class="muted empty-alerts">No ownership alerts recorded.</p>
	{:else}
		<div class="table-wrap">
			<table class="alerts-table">
				<thead><tr><th>Status</th><th>Alert</th><th>Target</th><th>Updated</th><th></th></tr></thead>
				<tbody>
					{#each data.alerts as alert}
						<tr class:resolved={!alert.active}>
							<td>
								<span class="status-pill" class:active={alert.active} class:acknowledged={alert.active && alert.acknowledgedAt}>
									{alert.active ? (alert.acknowledgedAt ? 'Acknowledged' : 'Active') : 'Resolved'}
								</span>
							</td>
							<td>
								<strong>{alert.title}</strong>
								<div class="muted alert-message">{alert.message}</div>
							</td>
							<td class="target-cell">
								{#if alert.universeId}<div>Universe <code>{alert.universeId}</code></div>{/if}
								{#if alert.placeId}<div>Place <code>{alert.placeId}</code></div>{/if}
								{#if alert.robloxId}<div>Roblox <code>{alert.robloxId}</code></div>{/if}
							</td>
							<td class="muted date-cell">{fmtDate(alert.updated || alert.created)}</td>
							<td>
								{#if alert.active && !alert.acknowledgedAt}
									<form method="POST" action="?/ackAlert" use:enhance style="margin:0;">
										<input type="hidden" name="id" value={alert.id} />
										<button class="btn ghost" type="submit">Acknowledge</button>
									</form>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<div class="card">
	<h2>Pack enforcement</h2>
	<p class="muted" style="font-size:13px;"><strong>Full</strong> = normal (ownership + rig-lock). <strong>License only</strong> = keep the ownership check but turn the rig-lock OFF (use if a legit customer's edited rig is being refused). <strong>Off</strong> = disable this pack's whitelist entirely, for everyone.</p>

	<form method="POST" action="?/setEnforce" use:enhance style="display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap; margin-top:12px;">
		<label style={lblStyle}>Pack
			<select class="inp" name="pack" bind:value={pack}>
				<option value="">Select a pack…</option>
				{#each data.products as p}<option value={p}>{p}</option>{/each}
			</select>
		</label>
		<label style={lblStyle}>Mode
			<select class="inp" name="mode" bind:value={mode}>
				<option value="full">Full — entitlement + rig-lock</option>
				<option value="entitlement">License only — rig-lock OFF</option>
				<option value="off">OFF — open to everyone</option>
			</select>
		</label>
		<button class="btn {mode === 'off' ? 'danger' : ''}" type="submit" disabled={!pack}>Apply</button>
	</form>

	<h2 style="font-size:14px; margin-top:18px;">Active overrides</h2>
	{#if overrides.length === 0}
		<p class="muted">All packs at <strong style="color:var(--green)">full</strong> enforcement.</p>
	{:else}
		<table>
			<thead><tr><th>Pack</th><th>Mode</th><th></th></tr></thead>
			<tbody>
				{#each overrides as [p, m]}
					<tr>
						<td><strong>{p}</strong></td>
						<td style="color:{modeColor[m] || 'var(--text)'}; font-weight:600;">{modeText[m] || m}</td>
						<td>
							<form method="POST" action="?/setEnforce" use:enhance style="margin:0;">
								<input type="hidden" name="pack" value={p} />
								<input type="hidden" name="mode" value="full" />
								<button class="btn ghost" type="submit">Reset to full</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<style>
	.alert-card { border-color: color-mix(in srgb, var(--red) 35%, var(--border)); }
	.alert-heading { display:flex; justify-content:space-between; align-items:flex-start; gap:20px; }
	.alert-heading h2 { margin-bottom:4px; }
	.alert-copy { font-size:13px; margin:0; }
	.alert-stats { display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
	.stat { white-space:nowrap; border:1px solid var(--border); border-radius:999px; padding:6px 10px; font-size:12px; background:var(--bg-elev); }
	.stat.danger { border-color:color-mix(in srgb, var(--red) 45%, var(--border)); color:var(--red); }
	.empty-alerts { margin:18px 0 4px; }
	.table-wrap { overflow-x:auto; margin-top:16px; }
	.alerts-table { min-width:820px; }
	.alert-message { margin-top:5px; max-width:680px; font-size:12px; line-height:1.45; }
	.target-cell { min-width:190px; font-size:12px; line-height:1.65; }
	.date-cell { white-space:nowrap; }
	.status-pill { display:inline-flex; align-items:center; min-height:26px; border-radius:999px; padding:3px 9px; border:1px solid var(--border); color:var(--muted); font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
	.status-pill.active { color:var(--red); border-color:color-mix(in srgb, var(--red) 50%, var(--border)); background:color-mix(in srgb, var(--red) 9%, transparent); }
	.status-pill.acknowledged { color:var(--yellow); border-color:color-mix(in srgb, var(--yellow) 45%, var(--border)); background:color-mix(in srgb, var(--yellow) 8%, transparent); }
	tr.resolved { opacity:.62; }
	@media (max-width: 720px) {
		.alert-heading { flex-direction:column; }
		.alert-stats { justify-content:flex-start; }
	}
</style>

<div class="card">
	<h2>Remote kill switch</h2>
	<p class="muted" style="font-size:13px;">Cut a specific game or owner off from the whitelist. Its next check returns a signed <code>killed</code> flag and the vehicle system shuts down. Use on someone abusing or pirating your assets — lift it anytime.</p>

	<form method="POST" action="?/kill" bind:this={killForm} use:enhance style="display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap; margin-top:12px;">
		<label style="flex:1; min-width:150px; display:flex; flex-direction:column; gap:4px; font-size:13px;">Target type
			<select class="inp" name="scope" bind:value={killScope}>
				<option value="universe">Universe ID</option>
				<option value="place">Place ID</option>
				<option value="user">Roblox user ID (owner)</option>
			</select>
		</label>
		<label style="flex:2; min-width:140px; display:flex; flex-direction:column; gap:4px; font-size:13px;">Value
			<input class="inp" name="value" bind:value={killValue} placeholder="ID to kill" />
		</label>
		<label style="flex:2; min-width:140px; display:flex; flex-direction:column; gap:4px; font-size:13px;">Reason
			<input class="inp" name="reason" bind:value={killReason} placeholder="e.g. pirating US pack" />
		</label>
		<button class="btn danger" type="button" disabled={!killValue}
			onclick={() => confirmAction({
				title: 'Remote-kill this target',
				message: `Cut off ${killScope} "${killValue}" from the whitelist? Their vehicles stop working on the next check. You can lift it anytime.`,
				danger: true,
				run: () => killForm.requestSubmit()
			})}
		>💀 Kill</button>
	</form>

	<h2 style="font-size:14px; margin-top:18px;">Active kills</h2>
	{#if data.kills.length === 0}
		<p class="muted">No active kills.</p>
	{:else}
		<table>
			<thead><tr><th>Type</th><th>Value</th><th>Reason</th><th>Since</th><th></th></tr></thead>
			<tbody>
				{#each data.kills as k}
					<tr>
						<td>{k.scope}</td>
						<td><strong>{k.value}</strong></td>
						<td class="muted">{k.reason || '—'}</td>
						<td class="muted">{fmtDate(k.created)}</td>
						<td>
							<form method="POST" action="?/unkill" use:enhance style="margin:0;">
								<input type="hidden" name="scope" value={k.scope} />
								<input type="hidden" name="value" value={k.value} />
								<button class="btn ghost" type="submit">Lift</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>
