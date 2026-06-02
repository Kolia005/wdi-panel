import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapter(),
		// Admin tool reached via SSH tunnel on varying localhost ports — the tunnel
		// already provides auth (SSH key). Disable SvelteKit's origin-based CSRF check
		// so form POSTs through the tunnel aren't blocked. Safe here: not public-facing.
		csrf: { checkOrigin: false }
	}
};

export default config;
