<script>
	import '../app.css';
	import { page } from '$app/stores';
	import Confirm from '$lib/Confirm.svelte';
	let { children } = $props();

	const nav = [
		{ href: '/', label: 'Dashboard' },
		{ href: '/clients', label: 'Clients' },
		{ href: '/products', label: 'Products' },
		{ href: '/licenses', label: 'Licenses' },
		{ href: '/broadcast', label: 'Broadcast' },
		{ href: '/webstore', label: 'Web Store' },
		{ href: '/analytics', label: 'Analytics' },
		{ href: '/audit', label: 'Audit Log' },
		{ href: '/system', label: 'System' }
	];
</script>

<div class="app">
	<aside class="sidebar">
		<div class="brand">W<span>DI</span> Panel</div>
		{#each nav as item}
			<a
				class="nav-link"
				class:active={item.href === '/' ? $page.url.pathname === '/' : $page.url.pathname.startsWith(item.href)}
				href={item.href}
			>{item.label}</a>
		{/each}
		<div style="margin-top:auto; padding:10px; font-size:11px;" class="muted">
			SSH-tunnel only · admin
		</div>
	</aside>
	<div class="content">
		<header class="topbar">
			<form method="GET" action="/search" style="width:100%; max-width:520px;">
				<input class="topsearch" name="q" placeholder="🔍 Search clients (ID) or products…" value={$page.url.pathname === '/search' ? ($page.url.searchParams.get('q') ?? '') : ''} />
			</form>
		</header>
		<main class="main">
			{@render children()}
		</main>
	</div>
</div>

<Confirm />

<style>
	.content { display: flex; flex-direction: column; min-height: 100vh; }
	.topbar { padding: 14px 32px; border-bottom: 1px solid var(--border); background: var(--bg-elev); }
	.topsearch { width: 100%; padding: 9px 14px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 14px; }
	.topsearch:focus { outline: none; border-color: var(--accent); }
</style>
