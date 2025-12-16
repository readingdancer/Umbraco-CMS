# Client Bundle Optimization

This document describes the bundling optimization system for the Umbraco Backoffice client.

## Overview

The Umbraco Backoffice client uses a two-tier build system:

1. **Granular Build (`dist-cms`)**: Individual files for npm package consumers and extension developers
2. **Bundled Build (`dist-cms-bundled`)**: Optimized chunks for CMS runtime performance

## Build Commands

### Standard Build (for development/npm)

```bash
npm run build:for:cms
```

This creates ~1500+ individual JS files in `dist-cms`, maintaining the granular structure needed for:
- Extension development with proper tree-shaking
- npm package exports
- Fast incremental development builds

### Bundled Build (for production CMS)

```bash
npm run build:for:cms:bundled
```

This creates ~30-50 optimized chunks in `dist-cms-bundled`, providing:
- Fewer HTTP requests
- Better compression efficiency
- Maintained import map compatibility

## Chunk Strategy

The bundling system groups code into logical chunks:

### Vendor Chunks (External Dependencies)
| Chunk | Contents |
|-------|----------|
| `vendor-lit` | Lit framework, directives |
| `vendor-rxjs` | RxJS observables and operators |
| `vendor-uui` | Umbraco UI components |
| `vendor-openid` | OpenID authentication |
| `vendor-dompurify` | HTML sanitization |
| `vendor-marked` | Markdown parsing |
| `vendor-signalr` | Real-time communication |
| `vendor-luxon` | Date/time handling |

### Core Chunks (Always Loaded)
| Chunk | Contents |
|-------|----------|
| `core-libs` | Base APIs (context-api, element-api, extension-api) |
| `core-auth` | Authentication, routing, server connection |
| `core-ui` | Modal, notification, localization, themes |
| `core-entity` | Entity system, workspace infrastructure |
| `core-navigation` | Collection, tree, menu, section |
| `core-property` | Property editor system |
| `core-components` | Shared UI components |
| `core-api` | Management API client |

### Feature Chunks (Lazy Loaded)
| Chunk | Contents | Loaded When |
|-------|----------|-------------|
| `feature-tiptap` | Rich text editor | RTE property editor opens |
| `feature-monaco` | Code editor | Code editor property opens |
| `feature-block` | Block editors | Block property editor opens |
| `feature-documents` | Document management | Content section |
| `feature-media` | Media management | Media section |
| `feature-members` | Member management | Members section |
| `feature-user` | User management | Users section |
| `feature-templating` | Templates, scripts | Settings section |
| `feature-settings` | Languages, data types | Settings section |
| `feature-tools` | Health check, logs | Settings section |

## Lazy Loading

The manifest system already supports lazy loading via dynamic imports:

```typescript
const manifest: ManifestPropertyEditorUi = {
  type: 'propertyEditorUi',
  alias: 'Umb.PropertyEditorUi.CodeEditor',
  // Dynamic import - only loaded when editor is used
  element: () => import('./property-editor-ui-code-editor.element.js'),
  // ...
};
```

The bundling configuration respects these boundaries by placing each feature's code in separate chunks.

## Import Map Compatibility

The bundled build maintains full import map compatibility:
- All original file paths work unchanged
- Entry point files re-export from bundled chunks
- Extensions continue to work without modification

## File Structure

```
dist-cms-bundled/
├── chunks/                    # Bundled code chunks
│   ├── vendor-lit-[hash].js
│   ├── vendor-rxjs-[hash].js
│   ├── core-libs-[hash].js
│   ├── feature-tiptap-[hash].js
│   └── ...
├── apps/                      # App entry points
│   └── app/
│       └── app.element.js
├── libs/                      # Library entry points
├── packages/                  # Package entry points
├── external/                  # External dependency entry points
├── assets/                    # Static assets
├── css/                       # Stylesheets
├── monaco-editor/             # Monaco editor (separate)
└── umbraco-package.json       # Import map manifest
```

## Performance Impact

| Metric | Before | After |
|--------|--------|-------|
| JS Files | ~1500+ | ~30-50 |
| Initial HTTP Requests | ~200+ | ~10-15 |
| Compression Ratio | Lower | Higher |
| Cache Efficiency | Lower | Higher |

## Development vs Production

- **Development**: Use `npm run dev` - serves unbundled files for fast HMR
- **Production**: Use `npm run build:for:cms:bundled` - optimized bundles

## Troubleshooting

### Build fails with "dist-cms not found"
Run `npm run build && npm run build:workspaces` first to create the unbundled output.

### Extension not loading
Check that the extension's manifest uses dynamic imports for element loading.

### Source maps not working
Ensure `sourcemap: true` is set in `vite.bundle.config.ts`.

