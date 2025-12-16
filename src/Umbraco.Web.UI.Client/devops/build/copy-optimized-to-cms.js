/**
 * Copy Optimized Build to CMS
 * 
 * This script copies the optimized build (bundles + stubs) to the CMS static assets folder.
 */

import { cpSync, rmSync, existsSync, readdirSync, mkdirSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, join } from 'path';

const distFinalDir = './dist-final';
const outputDir = '../Umbraco.Cms.StaticAssets/wwwroot/umbraco/backoffice';

console.log('🚀 Copying optimized build to CMS...\n');

// Check if dist-final exists
if (!existsSync(distFinalDir)) {
	console.error('❌ dist-final not found. Run the full build first:');
	console.error('   npm run build:optimized');
	process.exit(1);
}

// Clean output directory
console.log('🧹 Cleaning output directory...');
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

// Copy everything from dist-final
console.log('\n📦 Copying optimized build...');
cpSync(distFinalDir, outputDir, { recursive: true });

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

function getDirSize(dir) {
	let size = 0;
	if (!existsSync(dir)) return size;
	const items = readdirSync(dir);
	for (const item of items) {
		const fullPath = join(dir, item);
		const stat = statSync(fullPath);
		if (stat.isDirectory()) {
			size += getDirSize(fullPath);
		} else {
			size += stat.size;
		}
	}
	return size;
}

// Statistics
const totalJsFiles = countFiles(outputDir, '.js');
const appJsPath = resolve(outputDir, 'app.js');
const bundleSize = existsSync(appJsPath) ? statSync(appJsPath).size : 0;
const stubCount = totalJsFiles - 1; // All except app.js are stubs

console.log('\n📊 Build Statistics:');
console.log(`   Main bundle: app.js (${(bundleSize / 1024 / 1024).toFixed(2)} MB)`);
console.log(`   Stub files: ${stubCount}`);
console.log(`   Total JS files: ${totalJsFiles}`);

console.log('\n✅ Copy complete!');
console.log(`   Output: ${resolve(outputDir)}`);
console.log('\n📋 How it works (single bundle mode):');
console.log('   1. Browser loads apps/app/app.element.js (entry point)');
console.log('   2. All code is in app.js (single bundle)');
console.log('   3. Stubs re-export from app.js for import map compatibility');
console.log('   4. Extensions import from stubs → same bundle instance');
console.log('   5. 100% backward compatible!');

