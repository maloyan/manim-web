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
- **Keep example-based tests few.** We are migrating to property-based tests
  soon (see the code-quality note below), so don't enumerate many cases by
  hand. Write the smallest set that pins the behavior — one or two
  representatives is usually enough — and state the **property** the examples
  stand in for as a `// MIGRATION:` comment, so it can be lifted into a
  generated property later. Example:
  ```typescript
  // MIGRATION: example for the property
  //   ∀ 3D mesh m, m.normalizeTransform() leaves rotation/scaleVector unchanged.
  // Replace with a property test once the suite lands.
  ```

## Code Style

- ESLint + Prettier enforced via pre-commit hook (husky + lint-staged)
- Max 500 lines per file (eslint `max-lines` rule)
- No `any` types (`@typescript-eslint/no-explicit-any`) — use proper types, never `eslint-disable`
- camelCase naming convention for methods/properties
- Logging: use the `logger` utility (`src/utils/logger.ts`), never raw `console.*`. `logger.warn`/`logger.error`/`logger.info`/`logger.debug` prefix `[manim-web]`, respect the configured log level, sanitize args, and notify `onLog` listeners. Raw `console.*` bypasses all of that (and tests fail on unexpected `console.warn`/`console.error`). Note: much of the existing codebase still uses raw `console.*` and is being migrated — new code must use `logger`.

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

### JSDoc contracts (`@pre` / `@post` / `@inv` / `@note`)

- `@pre` and `@post` must be boolean expressions or typed signatures — no prose verbs like "updated" or "unchanged"
- Use `===`, `!==`, `=>` (logical implication), and `old.x` to refer to pre-call values
- Type constraints on parameters go in `@pre`, not in the description
- `@note` is for implementation gotchas only — never a disguised `@pre` or `@post`

```typescript
// Good
// @pre  !this.isEmpty()
// @pre  fn(pts).length === pts.length
// @post getWorldPoints()[i] === old.getWorldPoints().map(fn)[i]

// Bad — prose, not checkable
// @post own points updated; parent transforms unchanged

// Bad — @note disguising a @pre
// @note Caller must check isEmpty() before calling this
// should be: @pre !this.isEmpty()

// Bad — restates what the TS type already says
// @pre  fn !== null
// @pre  fn: (pts: number[][]) => number[][]

// Bad — prose sentence, not a boolean expression
// @pre  normalizeTransform() is only meaningful when !this.isEmpty()
// should be: @pre !this.isEmpty()
```

> **Code-quality push (in progress).** We are actively tightening these
> invariants and will soon back them with **property-based tests** that exercise
> each `@pre`/`@post` over generated inputs. When adding or changing a method,
> write its contract as checkable boolean expressions now so it is ready to be
> turned into a property. Some existing example-based tests are marked
> `MIGRATION:` — they are weak placeholders to be replaced once the
> property-based suite lands; prefer asserting on observable invariants (world
> geometry, bounds) over internal attributes (raw `position`, `_points3D`).

## Commits, Changelog & Releases

`CHANGELOG.md` is **generated**, not hand-written. It is produced by
[`standard-version`](https://github.com/conventional-changelog/standard-version)
from the [Conventional Commits](https://www.conventionalcommits.org/) history,
using the type → section mapping in `.versionrc.json`. Commit subject lines are
therefore user-facing release notes — write them as such.

### Commit message format

```
<type>(<scope>): <imperative subject>

<optional body>

<optional footer(s)>
```

Allowed `<type>` values and where they land in `CHANGELOG.md`:

| Type       | Section in CHANGELOG | Notes                                |
| ---------- | -------------------- | ------------------------------------ |
| `feat`     | Features             | Triggers a **minor** version bump    |
| `fix`      | Bug Fixes            | Triggers a **patch** bump            |
| `perf`     | Performance          | Patch bump                           |
| `refactor` | Refactoring          | Patch bump                           |
| `docs`     | Documentation        | Patch bump                           |
| `test`     | Tests                | Patch bump                           |
| `chore`    | *(hidden)*           | Still counts toward release if cut   |

`<scope>` should be the issue number for work tied to a tracked issue:
`fix(#344): ...`, `feat(#358): ...`. For tooling commits use a topical scope
(`chore(deps-dev): ...`, `fix(ci): ...`).

The subject must be short, imperative, and stand alone in release notes
(`add multi-camera example scenes`, not `WIP changes`). It is the *only* part
of the commit that downstream consumers reliably see.

### Breaking changes

A commit is breaking iff it changes the public API or runtime behaviour in a
way users must adapt to. Mark it **both** ways:

1. Append `!` after the type/scope: `feat(scene)!: drop legacy add() overload`.
2. Add a `BREAKING CHANGE:` footer with a one-paragraph migration note:

   ```
   feat(scene)!: drop legacy add() overload

   BREAKING CHANGE: Scene.add() no longer accepts a raw THREE.Object3D. Wrap
   it in a Mobject (see docs/migration/0.4.md) before passing it in.
   ```

`standard-version` bumps to a **major** version when it sees `!` or
`BREAKING CHANGE:`. The footer text is what users will read — make it
actionable.

### PR titles → CHANGELOG

The repo allows squash merging. When squashing, **leave the squash commit
subject equal to the PR title** — don't retype it in the merge dialog. PR
titles must therefore also follow Conventional Commits; treat the PR title
as the release-notes entry it will become.

### Release process

Releases are cut locally, then finished by CI:

1. From a clean `main` (or release branch), run the appropriate script:
   - `npm run release` — auto-detects bump from commits since the last tag.
   - `npm run release:minor` / `npm run release:major` — force a bump (rare;
     only when the commit history under-states the change).
2. `standard-version` updates `package.json` and regenerates the relevant
   section of `CHANGELOG.md`. **Review the generated diff.** If a subject
   line reads badly as a release note, do **not** rewrite the already-merged
   commit on `main`; instead add a short clarifying note immediately above
   the generated release section, and fix the habit at the source (PR title
   review) for next time.
3. Push the release commit (and the tag `standard-version` created) to
   `origin/main`.
4. `.github/workflows/release.yml` fires on the `package.json` change. It
   creates the tag if missing, opens a GitHub Release, and publishes to npm.

Caveats agents should know:

- **GitHub Release notes** are built from `git log`, *not* from
  `CHANGELOG.md` — bad commit subjects show up in two places, not one.
- **Never hand-edit generated release entries** in `CHANGELOG.md`. Fix the
  underlying commit message and regenerate, or add a note above the
  generated section.
- **Don't run `npm run release`** as part of a feature PR. Version bumps are
  a separate, deliberate commit on `main`.
