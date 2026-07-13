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
