## Summary

<!-- One or two sentences. What does this PR change, and why? -->

## Related issues

<!-- Link the issue(s) this PR resolves. Use "Closes #NNN" so GitHub closes
     them on merge. For a change with no issue, say so. -->

Closes #

## Changes

<!-- Bullet the user-visible changes. One change per line. -->

-

## Testing / gauntlet

Run the full gauntlet before you request review. Every box must pass.

- [ ] Type-check — `npm run typecheck`
- [ ] Unit tests — `npm test`
- [ ] Lint — `npm run lint`
- [ ] Format — `npm run format:check`
- [ ] No eslint-disable — `npm run lint:no-disable`
- [ ] Unused code — `npm run knip`
- [ ] Build — `npm run build`

## Conventional Commit title

<!-- The PR title becomes the squash-commit subject and lands verbatim in
     CHANGELOG.md. Use Conventional Commits: `feat(#NNN): ...`, `fix(#NNN): ...`,
     `docs(#NNN): ...`. For a breaking change, append `!` to the type/scope AND
     add a `BREAKING CHANGE: <migration note>` line below.
     See AGENTS.md -> "Commits, Changelog & Releases". -->

- [ ] The PR title follows Conventional Commits.
