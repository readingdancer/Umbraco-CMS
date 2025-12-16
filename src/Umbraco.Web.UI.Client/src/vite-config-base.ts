import type { BuildOptions, UserConfig, LibraryOptions } from 'vite';

interface UmbViteDefaultConfigArgs {
	base?: string;
	dist: BuildOptions['outDir'];
	external?: string | string[] | RegExp | RegExp[];
	entry?: LibraryOptions['entry'];
	plugins?: UserConfig['plugins'];
}

/**
 * Custom manualChunks function to group shared code into larger chunks.
 * This reduces HTTP requests while maintaining import map compatibility.
 *
 * Strategy:
 * - Group Lit-related dependencies together
 * - Group RxJS dependencies together
 * - Group UUI components together
 * - Keep other shared code in a common chunk
 */
function manualChunks(id: string): string | undefined {
	// Don't chunk entry points or external modules
	if (!id.includes('node_modules') && !id.includes('.pnpm')) {
		return undefined;
	}

	// Normalize path for consistent matching
	const normalizedId = id.replace(/\\/g, '/');

	// Lit ecosystem - group together
	if (
		normalizedId.includes('/lit/') ||
		normalizedId.includes('/lit-html/') ||
		normalizedId.includes('/lit-element/') ||
		normalizedId.includes('/@lit/') ||
		normalizedId.includes('/@lit-labs/')
	) {
		return 'vendor-lit';
	}

	// RxJS - group together
	if (normalizedId.includes('/rxjs/')) {
		return 'vendor-rxjs';
	}

	// UUI components - group together
	if (normalizedId.includes('/@umbraco-ui/')) {
		return 'vendor-uui';
	}

	// Other node_modules go to a shared vendor chunk
	if (normalizedId.includes('node_modules') || normalizedId.includes('.pnpm')) {
		return 'vendor-shared';
	}

	return undefined;
}

export const getDefaultConfig = (args: UmbViteDefaultConfigArgs): UserConfig => {
	return {
		build: {
			target: 'es2022',
			lib: {
				entry: args.entry || ['index.ts', 'manifests.ts', 'umbraco-package.ts'],
				formats: ['es'],
			},
			outDir: args.dist,
			emptyOutDir: true,
			sourcemap: true,
			rollupOptions: {
				external: args.external || [/^@umbraco-cms/],
				output: {
					manualChunks,
					// Use consistent chunk naming
					chunkFileNames: '[name]-[hash:8].js',
				},
			},
		},
		plugins: args.plugins,
		base: args.base,
	};
};
