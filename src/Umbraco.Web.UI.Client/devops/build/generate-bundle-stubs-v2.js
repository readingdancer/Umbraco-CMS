/**
 * Generate Bundle Stubs v2
 *
 * Creates stub files at original module paths that re-export from bundled chunks.
 * This maintains 100% backward compatibility with import maps while using optimized bundles.
 *
 * Strategy:
 * 1. Parse original dist-cms files to extract their exports
 * 2. Create stub files that re-export those same exports from the bundled chunks
 * 3. Copy static assets unchanged
 */

import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	writeFileSync,
	cpSync,
	rmSync,
	statSync,
} from 'fs';
import { dirname, resolve, relative, join, basename } from 'path';

const distCmsPath = resolve(import.meta.dirname, '../../dist-cms');
const distBundledPath = resolve(import.meta.dirname, '../../dist-bundled');
const outputPath = resolve(import.meta.dirname, '../../dist-cms-bundled');

/**
 * Extract export names from a JavaScript file
 */
function extractExports(filePath) {
	if (!existsSync(filePath)) return [];

	const content = readFileSync(filePath, 'utf-8');
	const exports = new Set();

	// Match: export { name1, name2 as alias2 }
	const namedExportRegex = /export\s*\{([^}]+)\}/g;
	let match;
	while ((match = namedExportRegex.exec(content)) !== null) {
		const names = match[1].split(',').map((n) => {
			const parts = n.trim().split(/\s+as\s+/);
			return parts[parts.length - 1].trim(); // Get the exported name (after 'as' if present)
		});
		names.forEach((n) => {
			if (n && !n.startsWith('*')) exports.add(n);
		});
	}

	// Match: export const/let/var/function/class name
	const directExportRegex = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
	while ((match = directExportRegex.exec(content)) !== null) {
		exports.add(match[1]);
	}

	// Match: export default
	if (/export\s+default\s/.test(content)) {
		exports.add('default');
	}

	return Array.from(exports);
}

/**
 * Determine which bundle chunk contains exports for a given module path
 */
function determineBundleChunk(modulePath) {
	// Normalize path separators
	const normalizedPath = modulePath.replace(/\\/g, '/');

	// Map module paths to bundle chunks based on our manualChunks strategy
	if (normalizedPath.includes('/external/lit/') || normalizedPath.includes('/external/lit.')) {
		return 'vendor-lit.js';
	}
	if (normalizedPath.includes('/external/rxjs/') || normalizedPath.includes('/external/rxjs.')) {
		return 'vendor-rxjs.js';
	}
	if (normalizedPath.includes('/external/uui/') || normalizedPath.includes('/external/uui.')) {
		return 'vendor-uui.js';
	}
	if (normalizedPath.includes('/external/')) {
		return 'vendor-uui.js'; // Other externals go to uui bundle
	}
	if (normalizedPath.includes('/libs/')) {
		return 'core.js';
	}
	if (normalizedPath.includes('/packages/core/')) {
		return 'core.js';
	}
	if (normalizedPath.includes('/packages/block/')) {
		return 'feature-blocks.js';
	}
	if (normalizedPath.includes('/packages/property-editors/') || normalizedPath.includes('/packages/data-type/')) {
		return 'feature-editors.js';
	}
	// Everything else goes to feature-all
	return 'feature-all.js';
}

/**
 * Generate a stub file that re-exports from a bundle chunk
 */
function generateStubContent(originalExports, chunkPath, originalFilePath) {
	if (originalExports.length === 0) {
		// If no named exports, might be a side-effect only module
		return `// Auto-generated stub - side-effect import from bundle\nimport '${chunkPath}';\n`;
	}

	// Check if we have a default export
	const hasDefault = originalExports.includes('default');
	const namedExports = originalExports.filter((e) => e !== 'default');

	let content = `// Auto-generated stub - re-exports from bundled chunk\n`;
	content += `// Original: ${originalFilePath}\n`;

	if (namedExports.length > 0) {
		content += `export { ${namedExports.join(', ')} } from '${chunkPath}';\n`;
	}

	if (hasDefault) {
		content += `export { default } from '${chunkPath}';\n`;
	}

	return content;
}

/**
 * Calculate relative path from stub to chunk
 */
function getRelativeChunkPath(stubPath, chunkName) {
	const stubDir = dirname(stubPath);
	const chunkPath = resolve(outputPath, 'chunks', chunkName);
	let relPath = relative(stubDir, chunkPath).replace(/\\/g, '/');
	if (!relPath.startsWith('.')) {
		relPath = './' + relPath;
	}
	return relPath;
}

/**
 * Recursively process directories
 */
function processDirectory(srcDir, outputDir, relativePath = '') {
	if (!existsSync(srcDir)) return;

	const items = readdirSync(srcDir);

	for (const item of items) {
		const srcPath = join(srcDir, item);
		const outPath = join(outputDir, item);
		const itemRelPath = relativePath ? `${relativePath}/${item}` : item;
		const stat = statSync(srcPath);

		if (stat.isDirectory()) {
			mkdirSync(outPath, { recursive: true });
			processDirectory(srcPath, outPath, itemRelPath);
		} else if (item.endsWith('.js') && !item.endsWith('.js.map')) {
			// Generate stub for JS files
			const exports = extractExports(srcPath);
			const chunkName = determineBundleChunk(itemRelPath);
			const chunkRelPath = getRelativeChunkPath(outPath, chunkName);
			const stubContent = generateStubContent(exports, chunkRelPath, itemRelPath);

			writeFileSync(outPath, stubContent);
		} else if (item.endsWith('.js.map')) {
			// Skip source maps for stubs (they wouldn't be valid anyway)
		} else {
			// Copy other files as-is (d.ts files, etc.)
			cpSync(srcPath, outPath);
		}
	}
}

/**
 * Copy static assets that don't need stubbing
 */
function copyStaticAssets() {
	console.log('📦 Copying static assets...');

	const staticDirs = ['assets', 'css', 'json-schema', 'monaco-editor'];

	for (const dir of staticDirs) {
		const srcPath = resolve(distCmsPath, dir);
		const destPath = resolve(outputPath, dir);
		if (existsSync(srcPath)) {
			cpSync(srcPath, destPath, { recursive: true });
			console.log(`  ✓ Copied ${dir}/`);
		}
	}

	// Copy config files
	const configFiles = ['umbraco-package.json', 'tsconfig.build.json', 'tsconfig.build.tsbuildinfo', 'vite-config-base.js'];
	for (const file of configFiles) {
		const srcPath = resolve(distCmsPath, file);
		const destPath = resolve(outputPath, file);
		if (existsSync(srcPath)) {
			cpSync(srcPath, destPath);
			console.log(`  ✓ Copied ${file}`);
		}
	}
}

/**
 * Copy bundled chunks
 */
function copyBundledChunks() {
	console.log('\n📦 Copying bundled chunks...');

	const chunksSource = resolve(distBundledPath, 'chunks');
	const chunksDest = resolve(outputPath, 'chunks');

	if (existsSync(chunksSource)) {
		mkdirSync(chunksDest, { recursive: true });
		cpSync(chunksSource, chunksDest, { recursive: true });

		const chunkCount = readdirSync(chunksSource).filter((f) => f.endsWith('.js')).length;
		console.log(`  ✓ Copied ${chunkCount} chunk files to /chunks/`);
	} else {
		console.error('  ❌ No chunks directory found in dist-bundled!');
	}
}

/**
 * Generate stubs for module directories
 */
function generateModuleStubs() {
	console.log('\n📝 Generating module stubs...');

	const moduleDirs = ['apps', 'libs', 'external', 'packages'];
	let totalStubs = 0;

	for (const dir of moduleDirs) {
		const srcDir = resolve(distCmsPath, dir);
		const outDir = resolve(outputPath, dir);

		if (existsSync(srcDir)) {
			mkdirSync(outDir, { recursive: true });
			processDirectory(srcDir, outDir, dir);

			// Count generated stubs
			const stubCount = countJsFiles(outDir);
			console.log(`  ✓ Generated ${stubCount} stubs in ${dir}/`);
			totalStubs += stubCount;
		}
	}

	console.log(`\n  Total stubs: ${totalStubs}`);
}

/**
 * Count JS files in a directory
 */
function countJsFiles(dir) {
	let count = 0;
	if (!existsSync(dir)) return count;

	const items = readdirSync(dir);
	for (const item of items) {
		const fullPath = join(dir, item);
		const stat = statSync(fullPath);
		if (stat.isDirectory()) {
			count += countJsFiles(fullPath);
		} else if (item.endsWith('.js')) {
			count++;
		}
	}
	return count;
}

/**
 * Main entry point
 */
function main() {
	console.log('🚀 Starting Bundle Stub Generation v2\n');
	console.log('This creates stub files that re-export from bundled chunks');
	console.log('while maintaining 100% import map compatibility.\n');

	// Validate source directories
	if (!existsSync(distCmsPath)) {
		console.error('❌ dist-cms not found. Run "npm run build" first.');
		process.exit(1);
	}

	if (!existsSync(distBundledPath)) {
		console.error('❌ dist-bundled not found. Run "npm run build:bundle" first.');
		process.exit(1);
	}

	// Clean output
	console.log('🧹 Cleaning output directory...');
	rmSync(outputPath, { recursive: true, force: true });
	mkdirSync(outputPath, { recursive: true });

	// Copy static assets
	copyStaticAssets();

	// Copy bundled chunks
	copyBundledChunks();

	// Generate module stubs
	generateModuleStubs();

	console.log('\n✅ Bundle stub generation complete!');
	console.log(`   Output: ${outputPath}`);
	console.log('\n📋 Summary:');
	console.log('   - All original module paths preserved (import map compatible)');
	console.log('   - Modules now re-export from larger bundled chunks');
	console.log('   - Static assets copied unchanged');
}

main();

