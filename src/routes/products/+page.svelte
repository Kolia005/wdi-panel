<script>
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import Confirm from '$lib/Confirm.svelte';
	let { data, form } = $props();
	let q = $state(data?.q ?? '');
	let showCreate = $state(false);
	const products = $derived(data?.products ?? []);

	let confirmOpen = $state(false);
	let pendingSubmit = null;
	function armConfirm() {
		return ({ cancel, submit }) => { pendingSubmit = submit; confirmOpen = true; cancel(); return async () => {}; };
	}
	function doConfirm() { confirmOpen = false; pendingSubmit?.(); pendingSubmit = null; }

	function doSearch(e) {
		e.preventDefault();
		goto(`/products?q=${encodeURIComponent(q)}`, { keepFocus: true });
	}
</script>

<Confirm bind:open={confirmOpen} title="Create product" message="Create this new product?" onconfirm={doConfirm} />

<div style="display:flex; justify-content:space-between; align-items:center;">
	<h1 class="page-title">Products <span class="muted" style="font-size:16px;">({products.length})</span></h1>
	<button class="cbtn primary" onclick={() => (showCreate = !showCreate)}>+ New product</button>
</div>

{#if form?.message}<div class="toast {form.ok ? 'ok' : 'err'}">{form.message}</div>{/if}

{#if showCreate}
	<div class="card">
		<h2>Create product</h2>
		<form method="POST" action="?/create" use:enhance={armConfirm()}>
			<div style="display:grid; gap:10px;">
				<input name="name" class="inp" placeholder="Product name (required)" required />
				<input name="description" class="inp" placeholder="Description" />
				<input name="fileurl" class="inp" placeholder="File URL (Discord CDN link or download URL)" />
				<button class="cbtn primary" type="submit" style="justify-self:start;">Create</button>
			</div>
			<p class="muted" style="font-size:12px; margin-top:8px;">Note: this creates the product record. Injecting whitelist code into a Roblox file needs the obfuscator (separate, parked).</p>
		</form>
	</div>
{/if}

<form onsubmit={doSearch}>
	<input class="search" bind:value={q} placeholder="Search products by name…" />
</form>

<div class="card" style="padding:0;">
	<table>
		<thead><tr><th>Name</th><th>Description</th><th>Owners</th><th>File</th></tr></thead>
		<tbody>
			{#each products as p}
				<tr style="cursor:pointer;" onclick={() => goto(`/products/${p.id}`)}>
					<td><strong>{p.name}</strong></td>
					<td class="muted">{p.description}</td>
					<td><span class="badge {p.owners > 0 ? 'green' : 'yellow'}">{p.owners}</span></td>
					<td>{#if p.hasFile}<span class="badge green">stored</span>{:else if p.fileurl}<span class="badge yellow">url</span>{:else}<span class="badge red">none</span>{/if}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.cbtn { padding: 9px 16px; border-radius: 8px; border: 1px solid var(--border); cursor: pointer; font-weight: 600; font-size: 13px; }
	.cbtn.primary { background: var(--accent); color: #fff; border-color: var(--accent); }
	.inp { width: 100%; padding: 9px 12px; background: var(--bg-elev); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 14px; }
	.inp:focus { outline: none; border-color: var(--accent); }
	.toast { padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-weight: 500; }
	.toast.ok { background: rgba(63,185,80,0.15); color: var(--green); border: 1px solid var(--green); }
	.toast.err { background: rgba(248,81,73,0.15); color: var(--red); border: 1px solid var(--red); }
</style>
