# Agent Instructions

**manim-web** — Mathematical animation library for the browser (TypeScript, Three.js, KaTeX).

## Project Commands

```bash
npm run dev               # Start Vite dev server
npm run build             # TypeScript compile + Vite build
npm run typecheck         # Type-check without emitting
npm test                  # Run unit tests (vitest)
npm run test:coverage     # Run tests with coverage report
npm run test:integration  # Run Playwright smoke tests
npm run lint              # ESLint
npm run format:check      # Prettier check
npm run docs              # Generate example docs + build Docusaurus site
```

## Architecture

- `src/core/` — Mobject, VMobject, Group, VGroup, Scene, Camera, Renderer
- `src/animation/` — Animation base, Transform, FadeIn/Out, Create, etc.
- `src/mobjects/` — Geometry, graphing, text, SVG, table, matrix, probability
- `src/integrations/` — React and Vue components
- `src/utils/` — Math helpers, vectors, triangulation, skeletonization
- `examples/` — HTML+TS example pairs (auto-generated docs from these)
- `docs/` — Docusaurus documentation site
- `tools/py2ts.cjs` — Python Manim to TypeScript converter

## Testing

- Unit tests live alongside source: `src/**/*.test.ts`
- Use `vitest` with `happy-dom` environment for DOM-dependent tests
- Add `// @vitest-environment happy-dom` at top of test files that need DOM/canvas
- Coverage config in `vitest.config.ts` (v8 provider, lcov reporter)
- Integration smoke test: `tests/integration/smoke.spec.ts`

## Code Style

- ESLint + Prettier enforced via pre-commit hook (husky + lint-staged)
- Max 500 lines per file (eslint `max-lines` rule)
- No `any` types (`@typescript-eslint/no-explicit-any`) — use proper types, never `eslint-disable`
- camelCase naming convention for methods/properties
