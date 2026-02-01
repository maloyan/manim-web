# AGENTS.md

## Overview

manim-js is a TypeScript port of [Manim](https://github.com/3b1b/manim) (Mathematical Animation Engine) for the browser. Built on Three.js and WebGL, it provides a declarative animation API for math visualizations with no server-side rendering required.

## Quick Start

```bash
npm install
npm run dev
```

## Build Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript compile + Vite build |
| `npm run preview` | Preview production build |
| `npm run typecheck` | Type check without emit |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting |
| `npm test` | Run Vitest tests |
| `npm run test:watch` | Run tests in watch mode |

## Testing

- Framework: Vitest
- Test files: co-located with source (`*.test.ts`)
- Run single test: `npx vitest run src/path/to/file.test.ts`

## Project Structure

```
src/
├── core/           # Scene, Mobject, VMobject, VGroup, Camera, Renderer
├── animation/      # All animation types (creation, fading, movement, transform)
├── constants/      # Colors and direction constants
├── mobjects/
│   ├── geometry/   # 2D shapes (Circle, Line, Polygon, Arrow, etc.)
│   ├── graphing/   # Axes, NumberLine, FunctionGraph, VectorField
│   ├── text/       # Text, MathTex, KaTeX rendering
│   ├── three-d/    # 3D primitives and surfaces
│   ├── svg/        # SVG parsing, Brace
│   ├── graph/      # Network graph visualization
│   ├── matrix/     # Matrix display
│   └── table/      # Table display
├── interaction/    # Drag, hover, click, orbit controls
├── integrations/   # React and Vue wrappers
├── export/         # GIF and video export
├── rate-functions/ # Easing and timing functions
└── utils/          # Performance monitoring
tools/
└── py2ts.cjs       # Python Manim -> TypeScript converter
```

## Conventions

- TypeScript strict mode (`strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`)
- ES2020 target
- ESNext module system with bundler module resolution
- Vite for bundling (library mode with `vite-plugin-dts` for declaration generation)
- Three.js for WebGL rendering
- KaTeX for LaTeX rendering
- camelCase for functions/methods, PascalCase for classes
- Test files co-located: `foo.ts` -> `foo.test.ts`
- Path alias: `@/*` maps to `src/*`
- Lint-staged with Husky: ESLint + Prettier run on staged `.ts`/`.tsx` files

## Architecture

- `src/core/` -- Scene, Mobject, VMobject, VGroup, Camera, Renderer
- `src/animation/` -- All animation types (creation, fading, movement, transform)
- `src/constants/` -- Color constants and direction vectors
- `src/mobjects/` -- All visual objects (geometry, text, graphing, 3D, SVG, graph, matrix, table)
- `src/interaction/` -- Drag, hover, click handlers and orbit controls
- `src/integrations/` -- React and Vue component wrappers (separate export paths: `manim-js/react`, `manim-js/vue`)
- `src/export/` -- GIF and video export
- `src/rate-functions/` -- Easing and timing functions (smooth, easeIn/Out, bounce, etc.)
- `src/utils/` -- Performance monitoring utilities

## Dependencies

- **three**: WebGL rendering engine
- **katex**: LaTeX math rendering
- **earcut**: Polygon triangulation
- **polygon-clipping**: Boolean polygon operations
- **opentype.js**: Font/glyph handling
- **gif.js**: GIF export

## Monitoring & Observability

- **CI Dashboard**: [GitHub Actions](https://github.com/maloyan/manim-js/actions) — build, test, and security scan status
- **Release History**: [GitHub Releases](https://github.com/maloyan/manim-js/releases) — versioned releases with changelogs
- **Dependency Updates**: [Dependabot alerts](https://github.com/maloyan/manim-js/security/dependabot) — automated dependency vulnerability tracking
- **Secret Scanning**: [Security alerts](https://github.com/maloyan/manim-js/security) — gitleaks secret scanning results
