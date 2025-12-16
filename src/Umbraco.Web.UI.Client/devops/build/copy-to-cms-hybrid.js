/**
 * Hybrid Copy to CMS
 *
 * Creates a hybrid build that:
 * 1. Copies the original dist-cms for import map compatibility
 * 2. Adds bundled chunks from dist-bundled for faster app loading
 * 3. Replaces the app entry point with the bundled version
 *
 * This maintains backward compatibility with extensions while
 * providing optimized loading for the main backoffice app.
 */

import { cpSync, rmSync, existsSync, readdirSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, join } from 'path';

const distCmsDir = './dist-cms';
const distBundledDir = './dist-bundled';
const outputDir = '../Umbraco.Cms.StaticAssets/wwwroot/umbraco/backoffice';

console.log('🚀 Creating hybrid build...\n');

// Check if builds exist
if (!existsSync(distCmsDir)) {
	console.error('❌ dist-cms not found. Run "npm run build" first.');
	process.exit(1);
}

if (!existsSync(distBundledDir)) {
	console.error('❌ dist-bundled not found. Run "npm run build:bundle" first.');
	process.exit(1);
}

/**
 * Count files in a directory recursively
 */
function countFiles(dir, extension = '.js') {
	let count = 0;
	if (!existsSync(dir)) return count;

	const items = readdirSync(dir);
	for (const item of items) {
		const fullPath = join(dir, item);
		const stat = statSync(fullPath);
		if (stat.isDirectory()) {
			count += countFiles(fullPath, extension);
		} else if (item.endsWith(extension)) {
			count++;
		}
	}
	return count;
}

// Copy assets
console.log('📦 Copying assets...');
cpSync('./src/assets', `${distCmsDir}/assets`, { recursive: true });
console.log('  ✓ Copied assets/');

// Copy SRC CSS
console.log('📦 Copying src CSS...');
cpSync('./src/css', `${distCmsDir}/css`, { recursive: true });
console.log('  ✓ Copied src CSS/');

// Minify CSS
console.log('📦 Minifying CSS...');
try {
	execSync(`npx postcss ${distCmsDir}/css/**/*.css --replace --use cssnano --verbose`, { stdio: 'inherit' });
	console.log('  ✓ Minified CSS');
} catch (error) {
	console.warn('  ⚠️ CSS minification had warnings but continuing...');
}

// Clean output directory
console.log('\n🧹 Cleaning output directory...');
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

// Step 1: Copy original dist-cms (for import map compatibility)
console.log('\n📦 Step 1: Copying original build (for import maps)...');
cpSync(distCmsDir, outputDir, { recursive: true });
const originalCount = countFiles(outputDir, '.js');
console.log(`  ✓ Copied ${originalCount} JS files from dist-cms`);

// Step 2: Copy bundled chunks and main bundle
console.log('\n📦 Step 2: Adding bundled chunks...');
const chunksSource = resolve(distBundledDir, 'chunks');
const chunksDest = resolve(outputDir, 'chunks');

if (existsSync(chunksSource)) {
	mkdirSync(chunksDest, { recursive: true });
	cpSync(chunksSource, chunksDest, { recursive: true });
	const chunkFiles = readdirSync(chunksSource).filter(f => f.endsWith('.js'));
	console.log(`  ✓ Copied ${chunkFiles.length} chunk files:`);
	chunkFiles.forEach(f => {
		const size = (statSync(join(chunksSource, f)).size / 1024).toFixed(1);
		console.log(`    - ${f} (${size} KB)`);
	});
}

// Step 2b: Copy main bundle to root (chunks import from ../umbraco-backoffice.js)
const mainBundleSource = resolve(distBundledDir, 'umbraco-backoffice.js');
const mainBundleRootDest = resolve(outputDir, 'umbraco-backoffice.js');
if (existsSync(mainBundleSource)) {
	// Read and adjust paths for root location
	let bundleContent = readFileSync(mainBundleSource, 'utf-8');
	// Remove self-import
	bundleContent = bundleContent.replace(/import\s*["']\.\/umbraco-backoffice\.js["'];?\s*/g, '');
	writeFileSync(mainBundleRootDest, bundleContent);
	console.log('  ✓ Copied umbraco-backoffice.js to root');
	
	// Copy source map
	const mapSource = mainBundleSource + '.map';
	if (existsSync(mapSource)) {
		cpSync(mapSource, mainBundleRootDest + '.map');
	}
}

// Step 3: Replace app entry point with redirect to bundled version
console.log('\n📦 Step 3: Replacing app entry point with redirect to bundled version...');
const originalEntry = resolve(outputDir, 'apps/app/app.element.js');

// The app entry just re-exports from the root bundle
// This keeps the original path working while using the optimized bundle
const redirectContent = `// Redirect to optimized bundle
export * from "../../umbraco-backoffice.js";
import "../../umbraco-backoffice.js";
`;
writeFileSync(originalEntry, redirectContent);
console.log('  ✓ Replaced apps/app/app.element.js with redirect to bundled version');

// Step 4: Copy mockServiceWorker
const mswSource = resolve(distBundledDir, 'mockServiceWorker.js');
const mswDest = resolve(outputDir, 'mockServiceWorker.js');
if (existsSync(mswSource)) {
	cpSync(mswSource, mswDest);
	console.log('  ✓ Copied mockServiceWorker.js');
}

// Final stats
console.log('\n📊 Build Statistics:');
const finalJsCount = countFiles(outputDir, '.js');
const chunkCount = existsSync(chunksDest) ? countFiles(chunksDest, '.js') : 0;
console.log(`   Total JS files: ${finalJsCount}`);
console.log(`   - Original modules: ${finalJsCount - chunkCount}`);
console.log(`   - Bundled chunks: ${chunkCount}`);

console.log('\n✅ Hybrid build complete!');
console.log(`   Output: ${resolve(outputDir)}`);
console.log('\n📋 How it works:');
console.log('   - Import maps continue to resolve to original module files');
console.log('   - App entry point loads optimized bundled chunks');
console.log('   - Extensions work unchanged (use original modules)');
console.log('   - Main app loads ~11 chunks instead of thousands of files');

