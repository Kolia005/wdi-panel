<script>
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { confirmAction } from '$lib/Confirm.svelte';
	let { data, form } = $props();
	let q = $state(data?.q ?? '');
	let showCreate = $state(false);
	let createForm = $state();

	function doSearch(e) {
		e.preventDefault();
		goto(`/products?q=${encodeURIComponent(q)}`, { keepFocus: true });
	}
	const products = $derived(data?.products ?? []);
</script>

<div style="display:flex; justify-content:space-between; align-items:center;">
	<h1 class="page-title">Products <span class="muted" style="font-size:16px;">({products.length})</span></h1>
	<button class="btn primary" onclick={() => (showCreate = !showCreate)}>+ New product</button>
</div>

{#if form?.message}<div class="toast {form.ok ? 'ok' : 'err'}">{form.message}</div>{/if}

{#if showCreate}
	<div class="card">
		<h2>Create product</h2>
		<form method="POST" action="?/create" bind:this={createForm} use:enhance>
			<div style="display:grid; gap:10px;">
				<input name="name" class="inp" placeholder="Product name (required)" required />
				<input name="description" class="inp" placeholder="Description" />
				<input name="fileurl" class="inp" placeholder="File URL (Discord CDN link or download URL)" />
				<button class="btn primary" type="button" style="justify-self:start;"
					onclick={() => { if (createForm.reportValidity()) confirmAction({ title: 'Create product', message: 'Create this new product?', run: () => createForm.requestSubmit() }); }}
				>Create</button>
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
