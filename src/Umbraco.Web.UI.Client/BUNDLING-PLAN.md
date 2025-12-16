# Umbraco Backoffice Bundling Plan

## Overview

This document outlines a plan to optimize the Umbraco backoffice client-side build by reducing the number of JavaScript files while maintaining 100% backward compatibility with third-party extensions.

## Current State

### The Problem

- **2,759 JavaScript files** are loaded for the backoffice
- Each file requires a separate HTTP request
- Even with HTTP/2 multiplexing, this creates significant overhead
- Initial page load is slow due to request waterfall

### File Distribution

| Category | Files | Description |
|----------|-------|-------------|
| `external/` | 27 | Vendor libraries (Lit, RxJS, UUI) |
| `libs/` | 127 | Shared utilities and APIs |
| `packages/core/` | 980 | Core framework code |
| `packages/*` (features) | ~1,500 | Feature packages (documents, media, etc.) |
| `apps/` | 38 | Application entry points |
| **Total** | **2,759** | |

### Why Simple Bundling Doesn't Work

Previous attempts at bundling failed due to:

1. **Circular Dependencies**: Chunks importing from each other cause "Cannot access X before initialization" errors
2. **Import Map Incompatibility**: Extensions rely on import maps pointing to individual module files
3. **Instance Mismatch**: Bundled code and original modules create different class instances, breaking singletons and contexts

## Proposed Solution: Tiered Bundling with Stubs

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        TIER 0                                │
│                    foundation.js                             │
│         (external + libs + packages/core)                    │
│                      ~4-5 MB                                 │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ imports from
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────┴───────┐   ┌───────┴───────┐   ┌───────┴───────┐
│    TIER 1     │   │    TIER 1     │   │    TIER 1     │
│ feature-      │   │ feature-      │   │ feature-      │
│ documents.js  │   │ media.js      │   │ editors.js    │
│   ~200KB      │   │   ~150KB      │   │   ~600KB      │
└───────────────┘   └───────────────┘   └───────────────┘
        ▲                   ▲                   ▲
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │ imports from
                    ┌───────┴───────┐
                    │    TIER 2     │
                    │   app.js      │
                    │  (entry point)│
                    └───────────────┘
```

### Stub Files for Backward Compatibility

For every original module path, we generate a stub file:

**Original path:** `/packages/core/extension-registry/index.js`

**Stub content:**
```javascript
// Stub file - re-exports from foundation bundle
export * from "../../../bundles/foundation.js";
```

This ensures:
- Import maps continue to work unchanged
- Extensions load from original paths
- Stubs re-export from already-loaded bundles (instant, no extra request)
- **Same instances** everywhere (no singleton issues)

### Directory Structure

```
dist-cms/
├── bundles/                      # NEW: Optimized bundles
│   ├── foundation.js             # Core + libs + external (~4-5MB)
│   ├── feature-documents.js      # Documents package (~200KB)
│   ├── feature-media.js          # Media package (~150KB)
│   ├── feature-members.js        # Members package (~100KB)
│   ├── feature-editors.js        # Tiptap + code-editor (~600KB)
│   ├── feature-blocks.js         # Block editors (~300KB)
│   └── feature-other.js          # Remaining packages (~500KB)
│
├── external/                     # Stub files (re-export from foundation)
│   ├── lit/index.js             
│   ├── rxjs/index.js
│   └── uui/index.js
│
├── libs/                         # Stub files (re-export from foundation)
│   ├── class-api/index.js
│   ├── context-api/index.js
│   └── ...
│
├── packages/                     # Stub files (re-export from bundles)
│   ├── core/                     # Re-export from foundation
│   │   ├── extension-registry/index.js
│   │   └── ...
│   ├── documents/                # Re-export from feature-documents
│   │   └── ...
│   └── ...
│
└── apps/
    └── app/
        └── app.element.js        # Entry point (loads bundles)
```

## Implementation Plan

### Phase 1: Foundation Bundle

**Goal:** Create a single foundation bundle containing all shared code.

**Files to include:**
- All `external/*` (Lit, RxJS, UUI, Monaco, etc.)
- All `libs/*` (class-api, context-api, localization-api, etc.)
- All `packages/core/*` (extension-registry, modal, router, etc.)

**Vite config:**
```typescript
manualChunks: (id) => {
  if (id.includes('/external/') || id.includes('/libs/') || id.includes('/packages/core/')) {
    return 'foundation';
  }
  return undefined;
}
```

**Expected size:** ~4-5 MB (gzip ~1.2 MB)

### Phase 2: Feature Bundles

**Goal:** Create lazy-loaded bundles for feature packages.

**Bundles:**
| Bundle | Packages | Est. Size |
|--------|----------|-----------|
| `feature-documents.js` | documents | ~200KB |
| `feature-media.js` | media | ~150KB |
| `feature-members.js` | members | ~100KB |
| `feature-user.js` | user | ~150KB |
| `feature-editors.js` | tiptap, code-editor, markdown-editor, rte | ~600KB |
| `feature-blocks.js` | block | ~300KB |
| `feature-templating.js` | templating | ~150KB |
| `feature-other.js` | all remaining packages | ~500KB |

**Total feature bundles:** ~8 files, ~2.2 MB total

### Phase 3: Stub Generation

**Goal:** Generate stub files for all original module paths.

**Script: `generate-stubs.js`**

1. Scan `dist-cms` for all `.js` files
2. For each file, determine which bundle contains its code
3. Generate a stub file that re-exports from the appropriate bundle
4. Preserve the original directory structure

**Example stub:**
```javascript
// packages/documents/document-workspace.element.js
export * from "../../bundles/feature-documents.js";
```

**Estimated stub count:** ~2,700 files (~100 bytes each = ~270KB total)

### Phase 4: Entry Point Update

**Goal:** Update the main app entry point to load bundles efficiently.

**Load order:**
1. `foundation.js` - loaded synchronously (required for everything)
2. Feature bundles - loaded on-demand via dynamic imports

**Entry point (`app.element.js`):**
```javascript
// Load foundation first
import './bundles/foundation.js';

// Then bootstrap the app (features load on demand)
import { bootstrap } from './bundles/foundation.js';
bootstrap();
```

### Phase 5: Build Script Integration

**Goal:** Integrate bundling into the existing build process.

**New npm scripts:**
```json
{
  "build:bundles": "vite build --config vite.bundle.config.ts",
  "generate:stubs": "node ./devops/build/generate-stubs.js",
  "build:optimized": "npm run build && npm run build:bundles && npm run generate:stubs",
  "build:for:cms": "npm run build:optimized && node ./devops/build/copy-to-cms.js"
}
```

## Expected Outcomes

### File Count Reduction

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Bundle files | 0 | ~10 | N/A |
| Stub files | 0 | ~2,700 | N/A |
| **HTTP requests (first load)** | **2,759** | **~10** | **99.6%** |

### Load Time Improvement

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| HTTP requests | 2,759 | ~10 | 99.6% fewer |
| Connection overhead | High | Minimal | ~95% reduction |
| Estimated load time | ~5-10s | ~1-2s | 70-80% faster |

### Backward Compatibility

| Aspect | Status |
|--------|--------|
| Import maps | ✅ Unchanged |
| Third-party extensions | ✅ Work as before |
| Singleton instances | ✅ Same instances everywhere |
| Dynamic imports | ✅ Work via stubs |

## Risks and Mitigations

### Risk 1: Circular Dependencies in Foundation

**Risk:** Foundation bundle may have internal circular dependencies.

**Mitigation:** 
- Foundation contains only "leaf" code (external, libs, core)
- These are designed to not have circular deps with features
- Test thoroughly before proceeding to feature bundles

### Risk 2: Stub Re-exports Don't Work

**Risk:** `export * from` may not re-export everything correctly.

**Mitigation:**
- Test with actual extensions
- If needed, generate explicit named exports: `export { Foo, Bar } from './bundle.js'`
- May require analyzing each module's exports during stub generation

### Risk 3: Bundle Too Large

**Risk:** Foundation bundle may be too large for acceptable load times.

**Mitigation:**
- Foundation is ~4-5MB, gzipped ~1.2MB
- This is comparable to other modern web apps
- Can further split if needed (e.g., separate Monaco into its own bundle)

### Risk 4: Build Complexity

**Risk:** Build process becomes more complex and harder to maintain.

**Mitigation:**
- Document thoroughly
- Create clear npm scripts
- Add validation/testing steps

## Success Criteria

1. ✅ Backoffice loads with <15 HTTP requests for JS files
2. ✅ All existing extensions work without modification
3. ✅ Initial load time reduced by >50%
4. ✅ No "Cannot access X before initialization" errors
5. ✅ Build process completes in <60 seconds

## Next Steps

1. [ ] Implement Phase 1: Foundation bundle
2. [ ] Test foundation bundle works without circular dep errors
3. [ ] Implement Phase 3: Stub generation (before feature bundles)
4. [ ] Test with a sample extension
5. [ ] Implement Phase 2: Feature bundles
6. [ ] Full integration testing
7. [ ] Performance benchmarking
8. [ ] Documentation update

## Timeline

| Phase | Estimated Time |
|-------|---------------|
| Phase 1: Foundation | 2-4 hours |
| Phase 3: Stubs | 2-4 hours |
| Testing & fixes | 4-8 hours |
| Phase 2: Features | 2-4 hours |
| Integration | 2-4 hours |
| **Total** | **12-24 hours** |

---

*Document created: December 16, 2024*
*Last updated: December 16, 2024*

