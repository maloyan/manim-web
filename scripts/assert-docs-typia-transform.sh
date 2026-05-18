#!/usr/bin/env bash
# Verifies the built docs bundle has typia.assert<T>(...) calls transformed.
#
# Background: docusaurus historically aliased `manim-web` to `../src/index.ts`
# (raw TS). Its webpack pipeline has no typia transform, so `typia.assert<T>(x)`
# shipped untransformed and threw "no transform has been configured" at runtime.
# Fix: docs resolves `manim-web` to built `dist/` (vite already applies the
# transform). This script enforces the invariant.

set -euo pipefail

ASSETS_DIR="docs/build/assets/js"

if [[ ! -d "$ASSETS_DIR" ]]; then
  echo "::error::Expected docs build output at $ASSETS_DIR, but directory is missing. Did the docs build step run?"
  exit 1
fi

shopt -s nullglob
js_files=("$ASSETS_DIR"/*.js)
shopt -u nullglob

if [[ ${#js_files[@]} -eq 0 ]]; then
  echo "::error::No JS files found under $ASSETS_DIR. Docs build produced no bundle."
  exit 1
fi

NEEDLE="no transform has been configured"
if grep -rq "$NEEDLE" "$ASSETS_DIR"; then
  echo "::error::Docs bundle contains untransformed typia.assert calls."
  echo "Symptom: literal string '$NEEDLE' found in $ASSETS_DIR."
  echo "Likely causes:"
  echo "  - Webpack alias or package resolution pointing manim-web at raw src/ (e.g. via the 'source' export condition)"
  echo "  - vite typia plugin missing from manim-web build, leaving dist/ untransformed"
  echo "Fix: ensure docs resolves manim-web to dist/index.js and that 'npm run build' runs the @typia/unplugin/vite plugin."
  exit 1
fi

echo "OK: $ASSETS_DIR shows no untransformed typia.assert calls."
