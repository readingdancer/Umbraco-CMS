import { defineConfig, type UserConfig, type Plugin } from 'vite';
import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';

const distCmsPath = resolve(__dirname, 'dist-cms');
const bundledOutputPath = resolve(__dirname, 'dist-bundled');

/**
 * Tiered Bundling Strategy
 * 
 * Tier 0: Foundation (external + libs + packages/core)
 *   - Loaded first, contains all shared code
 *   - No dependencies on feature code
 * 
 * Tier 1: Feature bundles (packages/* except core)
 *   - Lazy loaded on demand
 *   - Only import from foundation
 * 
 * This avoids circular dependencies because each tier
 * only imports from lower tiers.
 */

/**
 * Plugin to handle worker URL references
 */
function workerUrlPlugin(): Plugin {
	return {
		name: 'worker-url-handler',
		enforce: 'pre',
		resolveId(source) {
			if (source.includes('.worker') || source.includes('token-check')) {
				return { id: source, external: true };
			}
			return null;
		},
		transform(code, id) {
			if (code.includes('new URL(') && code.includes('import.meta.url')) {
				const workerUrlRegex = /new\s+URL\s*\(\s*["']([^"']*\.worker[^"']*)["']\s*,\s*import\.meta\.url\s*\)/g;
				let transformed = code.replace(workerUrlRegex, (match, path) => {
					return `new URL("${path}", window.location.origin + "/umbraco/backoffice/")`;
				});
				const viteIgnoreRegex = /new\s+URL\s*\(\s*\/\*\s*@vite-ignore\s*\*\/\s*["']([^"']+)["']\s*,\s*import\.meta\.url\s*\)/g;
				transformed = transformed.replace(viteIgnoreRegex, (match, path) => {
					return `new URL("${path}", window.location.origin + "/umbraco/backoffice/")`;
				});
				if (transformed !== code) {
					return { code: transformed, map: null };
				}
			}
			return null;
		},
	};
}

/**
 * Generate aliases for @umbraco-cms/backoffice/* imports
 */
function generateAliases(): Record<string, string> {
	const aliases: Record<string, string> = {};
	const pkgJsonPath = resolve(__dirname, 'package.json');
	const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
	const exports = pkgJson.exports || {};

	for (const [key, value] of Object.entries(exports)) {
		if (key === '.' || !value || typeof value !== 'string') continue;
		if (!value.endsWith('.js')) continue;
		const moduleKey = key.replace(/^\.\//, '@umbraco-cms/backoffice/');
		const modulePath = resolve(__dirname, value as string);
		aliases[moduleKey] = modulePath;
	}

	return aliases;
}

/**
 * For now, use single bundle (inlineDynamicImports) to avoid circular deps.
 * The tiered approach needs more work to properly resolve all dependencies.
 */
function manualChunks(id: string): string | undefined {
	// Not used when inlineDynamicImports is true
	return undefined;
}

/**
 * Plugin to fix bundle paths in the app entry point
 * The backend injects a cache-buster hash into URLs, so we need absolute paths
 * that work regardless of the hash directory
 */
function fixBundlePathsPlugin(): Plugin {
	return {
		name: 'fix-bundle-paths',
		generateBundle(options, bundle) {
			for (const [fileName, chunk] of Object.entries(bundle)) {
				if (chunk.type === 'chunk' && fileName === 'app.js') {
					// Use absolute paths from /umbraco/backoffice/ to avoid cache-buster hash issues
					chunk.code = chunk.code
						.replace(/["']\.\/bundles\//g, '"/umbraco/backoffice/bundles/')
						.replace(/["']bundles\//g, '"/umbraco/backoffice/bundles/')
						.replace(/["']\.\/app\.js["']/g, '"/umbraco/backoffice/app.js"');
				}
			}
		},
	};
}

const config: UserConfig = {
	build: {
		target: 'es2022',
		outDir: bundledOutputPath,
		emptyOutDir: true,
		sourcemap: true,
		minify: 'esbuild',
		chunkSizeWarningLimit: 5000,
		rollupOptions: {
			input: {
				'app': resolve(distCmsPath, 'apps/app/app.element.js'),
			},
			output: {
				format: 'es',
				entryFileNames: '[name].js',
				assetFileNames: 'assets/[name][extname]',
				inlineDynamicImports: true, // Single bundle to avoid circular deps
			},
			treeshake: {
				moduleSideEffects: true,
				propertyReadSideEffects: false,
			},
			// Mark workers as external
			external: [
				/\.worker\.js$/,
				/token-check/,
			],
		},
	},
	plugins: [workerUrlPlugin(), fixBundlePathsPlugin()],
	resolve: {
		alias: generateAliases(),
	},
};

export default defineConfig(config);
