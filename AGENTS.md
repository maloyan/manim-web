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

## Geometry conventions

Low-level 3-vector math lives in **`src/utils/vectors.ts`**: `dotVec`, `crossVec`,
`lengthVec`, `normalizeVec`, `unitPerpendicularTo`, `orthonormalFrame`,
`orientation2D`, `addVec`, `subVec`, `scaleVec`. Higher-level plane / basis
helpers live in `src/utils/math.ts` and are built on top of those.

- **Never inline component arithmetic for cross/dot/length/normalize.** If you
  catch yourself writing `a[1] * b[2] - a[2] * b[1]` or
  `Math.sqrt(dx*dx + dy*dy + dz*dz)`, import the helper instead. New helpers
  belong in `vectors.ts` so every call site shares one implementation.
- **No axis-equal-to-Z special cases.** Do not branch on
  `Math.abs(v[2]) < eps`, "is this the Z axis?", or "is the plane the XY
  plane?" to pick a basis. Use `orthonormalFrame(normal)` — it gives you a
  right-handed `{u, v, n}` for any normal.
  *Exception:* `orthonormalizeBasis` in `src/utils/math.ts` keeps a
  Z-biased fallback for its collinear-input branch. Callers (fill
  triangulation in particular) rely on the fallback landing in the same
  plane the geometry occupies — see the regression test in
  `src/utils/math.test.ts`. Don't remove that fallback without first
  rewriting `selectScatteredPoints` so collinear triples can't reach it.
- **No plane-in-special-configuration shortcuts.** Curvature, perpendicular
  distance, projection etc. should be written with the full 3D cross / dot
  product, not their 2D restrictions. The 2D form is fine for genuinely
  2D problems (e.g. a Graham scan); document the assumption and use
  `orientation2D` rather than rolling another inline cross.
- **Prefer vector / matrix products to component arithmetic.** Use
  `transformPointByMatrix`, `crossVec`, `dotVec`, etc. so geometric intent is
  visible in the code.
