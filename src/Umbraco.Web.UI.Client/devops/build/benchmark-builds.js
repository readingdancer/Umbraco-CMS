/**
 * Benchmark Build Comparison
 * 
 * Compares the original dist-cms build with the optimized dist-bundled build
 * to measure file count, sizes, and estimated load time improvements.
 */

import { existsSync, readdirSync, statSync } from 'fs';
import { resolve, extname } from 'path';

const distCmsPath = resolve(import.meta.dirname, '../../dist-cms');
const distBundledPath = resolve(import.meta.dirname, '../../dist-bundled');

/**
 * Recursively get all files from a directory
 */
function getAllFiles(dir, baseDir = dir) {
	const files = [];
	if (!existsSync(dir)) return files;

	const items = readdirSync(dir);
	for (const item of items) {
		const fullPath = resolve(dir, item);
		const stat = statSync(fullPath);
		if (stat.isDirectory()) {
			files.push(...getAllFiles(fullPath, baseDir));
		} else {
			files.push({
				path: fullPath.replace(baseDir, '').replace(/\\/g, '/'),
				size: stat.size,
				ext: extname(item).toLowerCase()
			});
		}
	}
	return files;
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Calculate statistics for a build
 */
function analyzeBuild(name, path) {
	console.log(`\n📊 Analyzing ${name}...`);
	
	if (!existsSync(path)) {
		console.log(`   ❌ Directory not found: ${path}`);
		return null;
	}

	const allFiles = getAllFiles(path);
	
	// Filter by extension
	const jsFiles = allFiles.filter(f => f.ext === '.js' && !f.path.includes('.map'));
	const cssFiles = allFiles.filter(f => f.ext === '.css');
	const mapFiles = allFiles.filter(f => f.ext === '.map' || f.path.includes('.map'));
	const otherFiles = allFiles.filter(f => !['.js', '.css', '.map'].includes(f.ext) && !f.path.includes('.map'));

	// Calculate sizes
	const totalJsSize = jsFiles.reduce((sum, f) => sum + f.size, 0);
	const totalCssSize = cssFiles.reduce((sum, f) => sum + f.size, 0);
	const totalMapSize = mapFiles.reduce((sum, f) => sum + f.size, 0);
	const totalOtherSize = otherFiles.reduce((sum, f) => sum + f.size, 0);

	// Separate Monaco files (these are kept separate in both builds)
	const monacoFiles = jsFiles.filter(f => f.path.includes('monaco'));
	const nonMonacoJsFiles = jsFiles.filter(f => !f.path.includes('monaco'));
	const nonMonacoJsSize = nonMonacoJsFiles.reduce((sum, f) => sum + f.size, 0);

	return {
		name,
		totalFiles: allFiles.length,
		jsFiles: {
			count: jsFiles.length,
			size: totalJsSize,
			nonMonacoCount: nonMonacoJsFiles.length,
			nonMonacoSize: nonMonacoJsSize,
			monacoCount: monacoFiles.length
		},
		cssFiles: {
			count: cssFiles.length,
			size: totalCssSize
		},
		mapFiles: {
			count: mapFiles.length,
			size: totalMapSize
		},
		otherFiles: {
			count: otherFiles.length,
			size: totalOtherSize
		},
		files: jsFiles // For detailed listing
	};
}

/**
 * Estimate HTTP/2 load time improvement
 * Based on typical latency and connection overhead
 */
function estimateLoadTimeImprovement(originalFiles, bundledFiles) {
	// Assumptions:
	// - Average RTT: 50ms
	// - HTTP/2 multiplexing: 6 concurrent streams typical
	// - Per-request overhead: ~5ms (headers, etc.)
	
	const RTT = 50; // ms
	const CONCURRENT_STREAMS = 6;
	const REQUEST_OVERHEAD = 5; // ms
	
	// Original: Many small files = many round trips even with HTTP/2
	const originalRoundTrips = Math.ceil(originalFiles / CONCURRENT_STREAMS);
	const originalTime = (originalRoundTrips * RTT) + (originalFiles * REQUEST_OVERHEAD);
	
	// Bundled: Few large files = fewer round trips
	const bundledRoundTrips = Math.ceil(bundledFiles / CONCURRENT_STREAMS);
	const bundledTime = (bundledRoundTrips * RTT) + (bundledFiles * REQUEST_OVERHEAD);
	
	return {
		original: originalTime,
		bundled: bundledTime,
		improvement: originalTime - bundledTime,
		percentImprovement: ((originalTime - bundledTime) / originalTime * 100).toFixed(1)
	};
}

/**
 * Main benchmark function
 */
function runBenchmark() {
	console.log('🚀 Build Benchmark Comparison\n');
	console.log('='.repeat(60));

	const original = analyzeBuild('dist-cms (Original)', distCmsPath);
	const bundled = analyzeBuild('dist-bundled (Optimized)', distBundledPath);

	if (!original || !bundled) {
		console.log('\n❌ Cannot compare - one or both builds are missing.');
		console.log('   Run "npm run build" and "npm run build:bundle" first.');
		return;
	}

	// Print comparison table
	console.log('\n' + '='.repeat(60));
	console.log('📈 COMPARISON RESULTS');
	console.log('='.repeat(60));

	console.log('\n📁 FILE COUNTS (excluding Monaco editor):');
	console.log('─'.repeat(50));
	console.log(`   Original JS files:  ${original.jsFiles.nonMonacoCount.toLocaleString().padStart(6)}`);
	console.log(`   Bundled JS files:   ${bundled.jsFiles.nonMonacoCount.toLocaleString().padStart(6)}`);
	console.log(`   ─────────────────────────────────`);
	console.log(`   Reduction:          ${(original.jsFiles.nonMonacoCount - bundled.jsFiles.nonMonacoCount).toLocaleString().padStart(6)} files (${((1 - bundled.jsFiles.nonMonacoCount / original.jsFiles.nonMonacoCount) * 100).toFixed(1)}%)`);

	console.log('\n📦 TOTAL JS SIZE (excluding Monaco & source maps):');
	console.log('─'.repeat(50));
	console.log(`   Original:           ${formatBytes(original.jsFiles.nonMonacoSize).padStart(10)}`);
	console.log(`   Bundled:            ${formatBytes(bundled.jsFiles.nonMonacoSize).padStart(10)}`);
	const sizeDiff = bundled.jsFiles.nonMonacoSize - original.jsFiles.nonMonacoSize;
	const sizeChange = sizeDiff > 0 ? `+${formatBytes(sizeDiff)}` : `-${formatBytes(Math.abs(sizeDiff))}`;
	console.log(`   Difference:         ${sizeChange.padStart(10)} (${((sizeDiff / original.jsFiles.nonMonacoSize) * 100).toFixed(1)}%)`);

	// Estimate load time improvement
	const loadTime = estimateLoadTimeImprovement(
		original.jsFiles.nonMonacoCount,
		bundled.jsFiles.nonMonacoCount
	);

	console.log('\n⚡ ESTIMATED LOAD TIME (HTTP/2, 50ms RTT):');
	console.log('─'.repeat(50));
	console.log(`   Original:           ${loadTime.original.toLocaleString().padStart(6)} ms`);
	console.log(`   Bundled:            ${loadTime.bundled.toLocaleString().padStart(6)} ms`);
	console.log(`   ─────────────────────────────────`);
	console.log(`   Improvement:        ${loadTime.improvement.toLocaleString().padStart(6)} ms (${loadTime.percentImprovement}% faster)`);

	console.log('\n📋 HTTP REQUESTS:');
	console.log('─'.repeat(50));
	console.log(`   Original requests:  ${original.jsFiles.nonMonacoCount.toLocaleString().padStart(6)}`);
	console.log(`   Bundled requests:   ${bundled.jsFiles.nonMonacoCount.toLocaleString().padStart(6)}`);
	console.log(`   ─────────────────────────────────`);
	console.log(`   Requests saved:     ${(original.jsFiles.nonMonacoCount - bundled.jsFiles.nonMonacoCount).toLocaleString().padStart(6)}`);

	// List bundled files
	console.log('\n📄 BUNDLED OUTPUT FILES:');
	console.log('─'.repeat(50));
	const bundledJsFiles = bundled.files
		.filter(f => !f.path.includes('monaco') && !f.path.includes('mockServiceWorker'))
		.sort((a, b) => b.size - a.size);
	
	for (const file of bundledJsFiles) {
		const name = file.path.replace(/^\/chunks\//, '').replace(/^\//, '');
		console.log(`   ${name.padEnd(30)} ${formatBytes(file.size).padStart(10)}`);
	}

	console.log('\n' + '='.repeat(60));
	console.log('✅ Benchmark complete!');
	console.log('='.repeat(60));

	// Summary
	console.log('\n📝 SUMMARY:');
	console.log(`   • Reduced JS files from ${original.jsFiles.nonMonacoCount.toLocaleString()} to ${bundled.jsFiles.nonMonacoCount} (${((1 - bundled.jsFiles.nonMonacoCount / original.jsFiles.nonMonacoCount) * 100).toFixed(1)}% reduction)`);
	console.log(`   • Estimated ${loadTime.percentImprovement}% faster initial load time`);
	console.log(`   • ${(original.jsFiles.nonMonacoCount - bundled.jsFiles.nonMonacoCount).toLocaleString()} fewer HTTP requests`);
}

runBenchmark();

