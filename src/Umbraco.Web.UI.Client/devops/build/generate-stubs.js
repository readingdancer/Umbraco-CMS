/**
 * Hybrid Build: Bundled Entry Point + Original Modules
 * 
 * Since minified bundles don't expose named exports properly for re-export,
 * we use a hybrid approach:
 * 1. Copy ALL original module files from dist-cms (for import compatibility)
 * 2. Replace ONLY the main app entry point with the bundled version
 * 
 * This gives us:
 * - Fast initial load (single bundle for main app)
 * - Full backward compatibility (original modules for extensions/login/etc)
 */

import { 
	existsSync, 
	readdirSync, 
	mkdirSync, 
	writeFileSync, 
	statSync,
	readFileSync,
	cpSync,
	rmSync
} from 'fs';
import { resolve, dirname } from 'path';

const distCmsDir = resolve(process.cwd(), 'dist-cms');
const distBundledDir = resolve(process.cwd(), 'dist-bundled');
const outputDir = resolve(process.cwd(), 'dist-final');

/**
 * Main function
 */
async function buildHybrid() {
	console.log('🔧 Building hybrid output (bundled entry + original modules)...\n');
	
	// Check prerequisites
	if (!existsSync(distCmsDir)) {
		console.error('❌ dist-cms not found. Run "npm run build" first.');
		process.exit(1);
	}
	
	if (!existsSync(distBundledDir)) {
		console.error('❌ dist-bundled not found. Run "npm run build:bundle" first.');
		process.exit(1);
	}
	
	// Clean output directory
	console.log('🧹 Cleaning output directory...');
	rmSync(outputDir, { recursive: true, force: true });
	mkdirSync(outputDir, { recursive: true });
	
	// Step 1: Copy ALL files from dist-cms
	console.log('\n📦 Copying original modules from dist-cms...');
	cpSync(distCmsDir, outputDir, { recursive: true });
	console.log('   ✓ All original modules copied');
	
	// Step 2: Replace the main app entry point with the bundled version
	console.log('\n📦 Replacing main app entry with bundle...');
	const appJsSrc = resolve(distBundledDir, 'app.js');
	const appJsDest = resolve(outputDir, 'apps/app/app.element.js');
	
	if (existsSync(appJsSrc)) {
		const content = readFileSync(appJsSrc);
		writeFileSync(appJsDest, content);
		console.log('   ✓ apps/app/app.element.js (bundled - 12MB)');
		
		// Also copy source map
		const mapSrc = appJsSrc + '.map';
		if (existsSync(mapSrc)) {
			const mapContent = readFileSync(mapSrc);
			writeFileSync(appJsDest + '.map', mapContent);
			console.log('   ✓ apps/app/app.element.js.map');
		}
	}
	
	// Count files for statistics
	const jsFileCount = countFiles(outputDir, '.js');
	const bundleSize = existsSync(appJsDest) ? statSync(appJsDest).size : 0;
	
	// Summary
	console.log('\n📊 Summary:');
	console.log(`   Total JS files: ${jsFileCount}`);
	console.log(`   Main bundle size: ${(bundleSize / 1024 / 1024).toFixed(2)} MB`);
	console.log(`   Main bundle gzipped: ~${(bundleSize / 1024 / 1024 * 0.26).toFixed(2)} MB`);
	
	console.log('\n✅ Hybrid build complete!');
	console.log(`   Output: ${outputDir}`);
	console.log('\n📋 How it works:');
	console.log('   1. Browser loads apps/app/app.element.js (the bundled entry point)');
	console.log('   2. The bundle contains ALL app code in a single file');
	console.log('   3. Other pages (login, etc) use original modules');
	console.log('   4. Extensions use original modules → full compatibility!');
}

/**
 * Count files with a specific extension
 */
function countFiles(dir, extension) {
	let count = 0;
	if (!existsSync(dir)) return count;
	
	const items = readdirSync(dir);
	for (const item of items) {
		const fullPath = resolve(dir, item);
		const stat = statSync(fullPath);
		if (stat.isDirectory()) {
			count += countFiles(fullPath, extension);
		} else if (item.endsWith(extension)) {
			count++;
		}
	}
	return count;
}

// Run
buildHybrid().catch(console.error);
