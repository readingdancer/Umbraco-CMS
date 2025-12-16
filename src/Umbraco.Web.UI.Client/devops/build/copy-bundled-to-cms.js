/**
 * Copy Bundled Build to CMS
 * 
 * Copies the optimized bundled build to the CMS static assets folder.
 * This creates a hybrid setup where:
 * - Bundled chunks are used for core loading (fast)
 * - Original module structure preserved for import map compatibility
 */

import { cpSync, rmSync, existsSync, mkdirSync, readdirSync, writeFileSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';

const distCmsDir = './dist-cms';
const distBundledDir = './dist-bundled';
const outputDir = '../Umbraco.Cms.StaticAssets/wwwroot/umbraco/backoffice';

console.log('🚀 Copying bundled build to CMS...\n');

// Check if builds exist
if (!existsSync(distCmsDir)) {
	console.error('❌ dist-cms not found. Run "npm run build" first.');
	process.exit(1);
}

if (!existsSync(distBundledDir)) {
	console.error('❌ dist-bundled not found. Run "npm run build:bundle" first.');
	process.exit(1);
}

// Copy assets from src
console.log('📦 Copying assets...');
cpSync('./src/assets', `${distCmsDir}/assets`, { recursive: true });
console.log('  ✓ Copied assets/');

// Copy CSS from src
console.log('📦 Copying CSS...');
cpSync('./src/css', `${distCmsDir}/css`, { recursive: true });
console.log('  ✓ Copied css/');

// Minify CSS
console.log('📦 Minifying CSS...');
execSync('npx postcss dist-cms/css/**/*.css --replace --use cssnano --verbose', { stdio: 'inherit' });
console.log('  ✓ Minified CSS');

// Clean output directory
console.log('\n🧹 Cleaning output directory...');
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

// Copy original dist-cms (for import map compatibility)
console.log('\n📦 Copying original build (for import maps)...');
cpSync(distCmsDir, outputDir, { recursive: true });
console.log('  ✓ Copied dist-cms/');

// Copy bundled chunks on top
console.log('\n📦 Copying bundled chunks...');
const chunksDir = resolve(distBundledDir, 'chunks');
const outputChunksDir = resolve(outputDir, 'chunks');
if (existsSync(chunksDir)) {
	mkdirSync(outputChunksDir, { recursive: true });
	cpSync(chunksDir, outputChunksDir, { recursive: true });
	const chunkCount = readdirSync(chunksDir).filter(f => f.endsWith('.js')).length;
	console.log(`  ✓ Copied ${chunkCount} chunk files`);
}

// Copy main bundle entry
const mainBundle = resolve(distBundledDir, 'umbraco-backoffice.js');
if (existsSync(mainBundle)) {
	cpSync(mainBundle, resolve(outputDir, 'umbraco-backoffice.js'));
	const mapFile = mainBundle + '.map';
	if (existsSync(mapFile)) {
		cpSync(mapFile, resolve(outputDir, 'umbraco-backoffice.js.map'));
	}
	console.log('  ✓ Copied umbraco-backoffice.js');
}

console.log('\n✅ Copied bundled build to CMS successfully!');
console.log(`   Output: ${resolve(outputDir)}`);
console.log('\n📝 Note: The original modules are preserved for import map compatibility.');
console.log('   Bundled chunks are in the /chunks/ directory.');

