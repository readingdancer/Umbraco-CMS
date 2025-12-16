/**
 * Copy Bundled Build to CMS (Hybrid)
 *
 * Copies all original modules (for login, extensions, import maps)
 * then replaces the main app entry point with the optimized bundle.
 */

import { cpSync, rmSync, existsSync, readdirSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, join } from 'path';

const distCmsDir = './dist-cms';
const distBundledDir = './dist-bundled';
const outputDir = '../Umbraco.Cms.StaticAssets/wwwroot/umbraco/backoffice';

console.log('🚀 Creating hybrid bundled build...\n');

// Check if builds exist
if (!existsSync(distCmsDir)) {
	console.error('❌ dist-cms not found. Run "npm run build" first.');
	process.exit(1);
}

if (!existsSync(distBundledDir)) {
	console.error('❌ dist-bundled not found. Run "npm run build:bundle" first.');
	process.exit(1);
}

// Prepare assets in dist-cms first
console.log('📦 Preparing assets...');
cpSync('./src/assets', `${distCmsDir}/assets`, { recursive: true });
console.log('  ✓ Copied assets/');

cpSync('./src/css', `${distCmsDir}/css`, { recursive: true });
console.log('  ✓ Copied CSS/');

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

// Step 1: Copy ALL original modules (for login, extensions, import maps)
console.log('\n📦 Step 1: Copying original build (for login, extensions, import maps)...');
cpSync(distCmsDir, outputDir, { recursive: true });
const originalCount = countFiles(outputDir, '.js');
console.log(`  ✓ Copied ${originalCount} JS files from dist-cms`);

// Step 2: Replace ONLY the main app entry point with bundled version
console.log('\n📦 Step 2: Replacing main app entry point with bundle...');
const bundledEntry = resolve(distBundledDir, 'umbraco-backoffice.js');
const appEntry = resolve(outputDir, 'apps/app/app.element.js');

if (existsSync(bundledEntry)) {
	// Copy the bundled version over the original
	cpSync(bundledEntry, appEntry);
	const mapFile = bundledEntry + '.map';
	if (existsSync(mapFile)) {
		cpSync(mapFile, appEntry + '.map');
	}
	const bundleSize = (statSync(bundledEntry).size / 1024 / 1024).toFixed(2);
	console.log(`  ✓ Replaced apps/app/app.element.js with bundle (${bundleSize} MB)`);
}

// Copy mockServiceWorker if exists
const mswSrc = resolve(distBundledDir, 'mockServiceWorker.js');
if (existsSync(mswSrc)) {
	cpSync(mswSrc, resolve(outputDir, 'mockServiceWorker.js'));
	console.log('  ✓ Copied mockServiceWorker.js');
}

// Count files
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

// Final stats
const finalJsCount = countFiles(outputDir, '.js');
const bundleSize = existsSync(appEntry) ? (statSync(appEntry).size / 1024 / 1024).toFixed(2) : 0;

console.log('\n📊 Build Statistics:');
console.log(`   Total JS files: ${finalJsCount}`);
console.log(`   Main bundle size: ${bundleSize} MB (gzip ~${(bundleSize / 4).toFixed(1)} MB)`);

console.log('\n✅ Hybrid build complete!');
console.log(`   Output: ${resolve(outputDir)}`);
console.log('\n📋 How it works:');
console.log('   - Login, extensions, import maps use original module files');
console.log('   - Main backoffice app uses the optimized single bundle');
console.log('   - Best of both worlds: compatibility + performance');

