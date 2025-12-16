/**
 * Copy Bundled Build to CMS
 *
 * This script copies the optimized bundled build output to the CMS static assets folder.
 * It uses the bundled output (dist-cms-bundled) instead of the granular build (dist-cms).
 */

import { cpSync, rmSync, existsSync, readdirSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { resolve } from 'path';

const srcDir = './dist-cms-bundled';
const outputDir = '../Umbraco.Cms.StaticAssets/wwwroot/umbraco/backoffice';

// Validate source directory exists
if (!existsSync(srcDir)) {
	console.error('❌ dist-cms-bundled directory not found.');
	console.error('   Run "npm run build:bundle && npm run build:bundle:stubs" first.');
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

// Log file counts before
console.log('📊 Build Statistics:');
const jsFileCount = countFiles(srcDir, '.js');
const cssFileCount = countFiles(srcDir, '.css');
console.log(`   JS files: ${jsFileCount}`);
console.log(`   CSS files: ${cssFileCount}`);
console.log('');

// Copy assets
console.log('--- Copying assets ---');
cpSync('./src/assets', `${srcDir}/assets`, { recursive: true });
console.log('--- Copying assets done ---');

// Copy SRC CSS
console.log('--- Copying src CSS ---');
cpSync('./src/css', `${srcDir}/css`, { recursive: true });
console.log('--- Copying src CSS done ---');

// Minify CSS
console.log('--- Minifying CSS ---');
try {
	execSync(`npx postcss ${srcDir}/css/**/*.css --replace --use cssnano --verbose`, { stdio: 'inherit' });
	console.log('--- Minifying CSS done ---');
} catch (error) {
	console.warn('⚠️  CSS minification had warnings but continuing...');
}

// Remove existing output and copy new build
console.log('--- Removing old build ---');
rmSync(outputDir, { recursive: true, force: true });

console.log('--- Copying bundled build to CMS ---');
cpSync(srcDir, outputDir, { recursive: true });

// Final statistics
const finalJsCount = countFiles(outputDir, '.js');
console.log('');
console.log('✅ Copied bundled build output to CMS successfully.');
console.log(`   Output: ${outputDir}`);
console.log(`   Total JS files: ${finalJsCount}`);

