<script module>
	import { writable } from 'svelte/store';
	// Global pending-confirm config: { title, message, danger, run }
	export const confirmStore = writable(null);
	export function confirmAction(cfg) {
		confirmStore.set(cfg);
	}
</script>

<script>
	let cfg = $state(null);
	confirmStore.subscribe((v) => (cfg = v));
	function cancel() { confirmStore.set(null); }
	function ok() {
		const run = cfg?.run;
		confirmStore.set(null);
		run?.();
	}
</script>

{#if cfg}
	<div class="overlay" onclick={cancel} role="presentation">
		<div class="dialog" onclick={(e) => e.stopPropagation()} role="dialog">
			<h3>{cfg.title}</h3>
			<p class="muted">{cfg.message}</p>
			<div class="actions">
				<button class="btn ghost" onclick={cancel}>Cancel</button>
				<button class="btn {cfg.danger ? 'danger' : 'primary'}" onclick={ok}>{cfg.danger ? 'Yes, do it' : 'Confirm'}</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; }
	.dialog { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 24px; max-width: 440px; width: 90%; }
	.dialog h3 { margin: 0 0 10px; }
	.actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
	.btn { padding: 9px 18px; border-radius: 8px; border: 1px solid var(--border); cursor: pointer; font-weight: 600; font-size: 14px; }
	.btn.ghost { background: transparent; color: var(--text); }
	.btn.primary { background: var(--accent); color: #fff; border-color: var(--accent); }
	.btn.danger { background: var(--red); color: #fff; border-color: var(--red); }
	.btn:hover { opacity: 0.9; }
</style>
