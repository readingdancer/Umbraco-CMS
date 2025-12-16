/**
 * Generate Bundle Stubs
 *
 * This script creates thin re-export stubs at the original file locations
 * that point to the bundled chunks. This maintains import map compatibility
 * while using the optimized bundled code.
 *
 * The import map continues to work as before, but instead of loading
 * hundreds of small files, each stub imports from a larger bundled chunk.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync, cpSync, rmSync } from 'fs';
import { dirname, resolve, relative, basename, join } from 'path';

const distCmsPath = resolve(import.meta.dirname, '../../dist-cms');
const distBundledPath = resolve(import.meta.dirname, '../../dist-bundled');
const outputPath = resolve(import.meta.dirname, '../../dist-cms-bundled');

/**
 * Recursively get all JS files from a directory
 */
function getJsFilesRecursively(dir, baseDir = dir) {
	const files = [];
	if (!existsSync(dir)) return files;

	const items = readdirSync(dir);
	for (const item of items) {
		const fullPath = resolve(dir, item);
		const stat = statSync(fullPath);
		if (stat.isDirectory()) {
			files.push(...getJsFilesRecursively(fullPath, baseDir));
		} else if (item.endsWith('.js') && !item.endsWith('.map')) {
			const relativePath = relative(baseDir, fullPath);
			files.push(relativePath);
		}
	}
	return files;
}

/**
 * Parse the bundled output to understand chunk mappings
 */
function parseBundledOutput() {
	const chunkMappings = new Map();

	// Read the bundled chunks directory
	const chunksDir = resolve(distBundledPath, 'chunks');
	if (existsSync(chunksDir)) {
		const chunkFiles = readdirSync(chunksDir).filter((f) => f.endsWith('.js'));
		for (const chunkFile of chunkFiles) {
			const chunkPath = resolve(chunksDir, chunkFile);
			const content = readFileSync(chunkPath, 'utf-8');

			// Extract exported symbols from the chunk
			const exportMatches = content.matchAll(/export\s*\{([^}]+)\}/g);
			for (const match of exportMatches) {
				const exports = match[1].split(',').map((e) => e.trim().split(' as ')[0].trim());
				for (const exp of exports) {
					if (exp) {
						chunkMappings.set(exp, `./chunks/${chunkFile}`);
					}
				}
			}
		}
	}

	return chunkMappings;
}

/**
 * Generate a stub file that re-exports from the bundled entry
 */
function generateStubContent(originalPath, bundledEntryPath) {
	// Calculate relative path from stub to bundled entry
	const stubDir = dirname(originalPath);
	const relPath = relative(stubDir, bundledEntryPath).replace(/\\/g, '/');
	const importPath = relPath.startsWith('.') ? relPath : `./${relPath}`;

	return `// Auto-generated stub - re-exports from bundled chunk
export * from '${importPath}';
`;
}

/**
 * Copy static assets that don't need bundling
 */
function copyStaticAssets() {
	console.log('📦 Copying static assets...');

	// Copy assets folder
	const assetsSource = resolve(distCmsPath, 'assets');
	const assetsDest = resolve(outputPath, 'assets');
	if (existsSync(assetsSource)) {
		cpSync(assetsSource, assetsDest, { recursive: true });
		console.log('  ✓ Copied assets/');
	}

	// Copy css folder
	const cssSource = resolve(distCmsPath, 'css');
	const cssDest = resolve(outputPath, 'css');
	if (existsSync(cssSource)) {
		cpSync(cssSource, cssDest, { recursive: true });
		console.log('  ✓ Copied css/');
	}

	// Copy json-schema folder
	const jsonSchemaSource = resolve(distCmsPath, 'json-schema');
	const jsonSchemaDest = resolve(outputPath, 'json-schema');
	if (existsSync(jsonSchemaSource)) {
		cpSync(jsonSchemaSource, jsonSchemaDest, { recursive: true });
		console.log('  ✓ Copied json-schema/');
	}

	// Copy monaco-editor (has workers that need to stay separate)
	const monacoSource = resolve(distCmsPath, 'monaco-editor');
	const monacoDest = resolve(outputPath, 'monaco-editor');
	if (existsSync(monacoSource)) {
		cpSync(monacoSource, monacoDest, { recursive: true });
		console.log('  ✓ Copied monaco-editor/');
	}

	// Copy external/monaco-editor
	const externalMonacoSource = resolve(distCmsPath, 'external', 'monaco-editor');
	const externalMonacoDest = resolve(outputPath, 'external', 'monaco-editor');
	if (existsSync(externalMonacoSource)) {
		mkdirSync(dirname(externalMonacoDest), { recursive: true });
		cpSync(externalMonacoSource, externalMonacoDest, { recursive: true });
		console.log('  ✓ Copied external/monaco-editor/');
	}

	// Copy umbraco-package.json
	const pkgSource = resolve(distCmsPath, 'umbraco-package.json');
	const pkgDest = resolve(outputPath, 'umbraco-package.json');
	if (existsSync(pkgSource)) {
		cpSync(pkgSource, pkgDest);
		console.log('  ✓ Copied umbraco-package.json');
	}

	// Copy tsconfig files
	const tsconfigBuildSource = resolve(distCmsPath, 'tsconfig.build.json');
	const tsconfigBuildDest = resolve(outputPath, 'tsconfig.build.json');
	if (existsSync(tsconfigBuildSource)) {
		cpSync(tsconfigBuildSource, tsconfigBuildDest);
		console.log('  ✓ Copied tsconfig.build.json');
	}

	// Copy vite-config-base.js
	const viteConfigSource = resolve(distCmsPath, 'vite-config-base.js');
	const viteConfigDest = resolve(outputPath, 'vite-config-base.js');
	if (existsSync(viteConfigSource)) {
		cpSync(viteConfigSource, viteConfigDest);
		console.log('  ✓ Copied vite-config-base.js');
	}

	// Copy extension-types (TypeScript definitions)
	const extTypesSource = resolve(distCmsPath, 'packages', 'extension-types');
	const extTypesDest = resolve(outputPath, 'packages', 'extension-types');
	if (existsSync(extTypesSource)) {
		mkdirSync(dirname(extTypesDest), { recursive: true });
		cpSync(extTypesSource, extTypesDest, { recursive: true });
		console.log('  ✓ Copied packages/extension-types/');
	}
}

/**
 * Copy bundled chunks to output
 */
function copyBundledChunks() {
	console.log('📦 Copying bundled chunks...');

	const chunksSource = resolve(distBundledPath, 'chunks');
	const chunksDest = resolve(outputPath, 'chunks');

	if (existsSync(chunksSource)) {
		mkdirSync(chunksDest, { recursive: true });
		cpSync(chunksSource, chunksDest, { recursive: true });

		const chunkCount = readdirSync(chunksSource).filter((f) => f.endsWith('.js')).length;
		console.log(`  ✓ Copied ${chunkCount} chunk files`);
	}
}

/**
 * Generate stub files for import map compatibility
 */
function generateStubs() {
	console.log('📝 Generating entry point stubs...');

	let stubCount = 0;

	// Process bundled entry points
	const bundledDirs = ['apps', 'libs', 'external', 'packages'];

	for (const dir of bundledDirs) {
		const bundledDir = resolve(distBundledPath, dir);
		if (!existsSync(bundledDir)) continue;

		const jsFiles = getJsFilesRecursively(bundledDir, bundledDir);

		for (const jsFile of jsFiles) {
			// Skip chunk files
			if (jsFile.includes('chunks/')) continue;

			const bundledFilePath = resolve(bundledDir, jsFile);
			const outputFilePath = resolve(outputPath, dir, jsFile);
			const outputDir = dirname(outputFilePath);

			// Create directory if needed
			mkdirSync(outputDir, { recursive: true });

			// Copy the bundled entry file directly (it contains the re-exports)
			cpSync(bundledFilePath, outputFilePath);

			// Also copy source map if exists
			const mapFile = bundledFilePath + '.map';
			if (existsSync(mapFile)) {
				cpSync(mapFile, outputFilePath + '.map');
			}

			stubCount++;
		}
	}

	console.log(`  ✓ Generated ${stubCount} entry point files`);
}

/**
 * Main function
 */
function main() {
	console.log('🚀 Starting bundle stub generation...\n');

	// Validate paths
	if (!existsSync(distCmsPath)) {
		console.error('❌ dist-cms directory not found. Run "npm run build" first.');
		process.exit(1);
	}

	if (!existsSync(distBundledPath)) {
		console.error('❌ dist-bundled directory not found. Run "npm run build:bundle" first.');
		process.exit(1);
	}

	// Clean output directory
	console.log('🧹 Cleaning output directory...');
	rmSync(outputPath, { recursive: true, force: true });
	mkdirSync(outputPath, { recursive: true });

	// Copy static assets
	copyStaticAssets();
	console.log('');

	// Copy bundled chunks
	copyBundledChunks();
	console.log('');

	// Generate stub files
	generateStubs();

	console.log('\n✅ Bundle stub generation complete!');
	console.log(`   Output: ${outputPath}`);
}

main();

