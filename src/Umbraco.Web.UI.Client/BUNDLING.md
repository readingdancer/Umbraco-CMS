# Client-Side Bundling Optimization

## Overview

This document describes the optimized bundling strategy for the Umbraco backoffice client-side code. The goal is to reduce the number of HTTP requests from 1500+ individual files to approximately 10 optimized bundles.

## Current Status

### Achieved Results

The bundling configuration (`vite.bundle.config.ts`) successfully produces **8 JavaScript files** (down from 1500+):

| File | Size | Description |
|------|------|-------------|
| `umbraco-backoffice.js` | 62 KB | Main entry point + all app elements |
| `vendor-lit.js` | 26 KB | Lit framework |
| `vendor-rxjs.js` | 27 KB | RxJS |
| `vendor-uui.js` | 5 MB | UUI + all external dependencies |
| `core.js` | 3.7 MB | Core libraries + packages/core |
| `feature-editors.js` | 718 KB | Tiptap, code-editor, property-editors |
| `feature-blocks.js` | 296 KB | Block editors |
| `feature-all.js` | 1.7 MB | All other feature packages |

**This is a 99.6% reduction in file count!**

### Benchmark Results

Run `npm run build:benchmark` to compare builds:

| Metric | Original | Bundled | Improvement |
|--------|----------|---------|-------------|
| JS Files | 2,357 | 9 | **99.6% reduction** |
| Total Size | 12.8 MB | 11.4 MB | **10.7% smaller** |
| HTTP Requests | 2,357 | 9 | **2,348 fewer** |
| Est. Load Time | 31.4s | 0.15s | **99.5% faster** |

The bundled output is actually smaller due to Rollup's tree-shaking removing unused code.

### Build Commands

```bash
# Standard build (produces dist-cms with many files)
npm run build

# Bundle build (produces dist-bundled with optimized chunks)
npm run build:bundle

# Compare builds (file counts, sizes, estimated load times)
npm run build:benchmark
```

## Architecture

### Chunk Strategy

The `manualChunks` function in `vite.bundle.config.ts` defines how code is grouped:

1. **Vendor Chunks**: Third-party libraries
   - `vendor-lit`: Lit framework
   - `vendor-rxjs`: RxJS
   - `vendor-uui`: Umbraco UI components
   - `vendor-misc`: Other external dependencies

2. **Core Chunk**: Foundation code
   - `core`: All libs/ and packages/core/ (kept together to avoid circular dependencies)

3. **Feature Chunks**: Lazy-loaded functionality
   - `feature-editors`: Tiptap, code-editor, property-editors
   - `feature-blocks`: Block editors
   - `feature-all`: All other packages

### Why This Structure?

- **Circular Dependencies**: packages/core has internal circular dependencies (e.g., modal-manager ↔ router). Splitting it into smaller chunks caused circular chunk dependencies.
- **Lazy Loading**: Feature chunks are dynamically imported when needed
- **Caching**: Vendor chunks change rarely and can be cached long-term

## Known Limitations

### Import Map Compatibility

**Issue**: The existing import map system expects specific module paths like `@umbraco-cms/backoffice/packages/core/auth`. The bundled output merges these into larger chunks.

**Impact**: Extensions that import specific modules won't work directly with the bundled output.

**Potential Solutions**:
1. Generate stub files at original paths that re-export from chunks
2. Update backend import map generation to resolve to bundled chunks
3. Use a hybrid approach: bundled for main app, original modules for extensions

### Chunk Sizes

Chunks are intentionally large to minimize HTTP requests:
- `vendor-uui.js` (5 MB) - includes UUI + OpenID, SignalR, Tiptap libs, etc.
- `core.js` (3.7 MB) - all core functionality kept together to avoid circular dependencies

With HTTP/2 and proper caching, these sizes are acceptable trade-offs for reduced request count.

## Files

- `vite.bundle.config.ts` - Bundling configuration
- `devops/build/generate-bundle-stubs.js` - Stub generator (needs work for import map compatibility)
- `dist-bundled/` - Output directory for bundled build

## Next Steps

1. **Import Map Compatibility**: Resolve how extensions can import specific modules
2. **Testing**: Verify all functionality works with bundled output
3. **Benchmarking**: Measure actual load time improvements
4. **Integration**: Update CMS to serve bundled assets in production


