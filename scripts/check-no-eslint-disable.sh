#!/usr/bin/env bash
#
# Fail if any `eslint-disable` / `eslint-enable` directive exists anywhere in
# the repository.
#
# Issue #398: the codebase had accumulated 100+ `eslint-disable` comments that
# silently suppressed lint problems. This guard is the authoritative ban — it
# greps the raw source repo-wide, so (unlike the ESLint `no-use` rule) it cannot
# be evaded with an inline `/* eslint ...: off */` and it also covers files
# ESLint itself ignores or never sees (test files, docs, `.mjs`/`.cjs` scripts,
# config files, `.mdx`). Fix the root cause instead.
#
# It matches a directive only when `eslint-disable`/`eslint-enable` is the first
# token of a comment (`//`, `/*`, ` *`, `<!--`, `{/*`, `#`), which is the only
# form ESLint honours — so prose/filename mentions of "eslint-disable" (e.g. in
# AGENTS.md or this script's own name) are correctly ignored.
#
# Usage: bash scripts/check-no-eslint-disable.sh
set -euo pipefail

cd "$(dirname "$0")/.."

PATTERN='(//|/\*|\*|<!--|\{/\*|#)[[:space:]]*eslint-(disable|enable)'

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  # Tracked files only; git grep already skips node_modules/dist via .gitignore.
  matches=$(git grep -nIE "$PATTERN" -- . || true)
else
  # Fallback for a non-git checkout.
  matches=$(grep -rnIE "$PATTERN" \
    --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build . || true)
fi

if [ -n "$matches" ]; then
  echo "✖ Found 'eslint-disable'/'eslint-enable' directive(s) (banned — see issue #398):"
  echo ""
  echo "$matches"
  echo ""
  echo "Fix the underlying lint problem instead of suppressing it."
  exit 1
fi

echo "✓ No 'eslint-disable' directives anywhere in the repo."
