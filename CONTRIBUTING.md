# Contributing to IAMJARL Design System

Thanks for your interest! This is primarily a personal design system, but PRs and issues are welcome.

## Reporting issues

- **Bug in tokens** (wrong value, missing token) → [open an issue](https://github.com/jarllyng/iamjarl-design/issues/new?template=bug-report.md)
- **Token request** (need a new token category or value) → [open an issue](https://github.com/jarllyng/iamjarl-design/issues/new?template=token-request.md)

## Proposing changes

1. Fork the repo
2. Edit `tokens.json` (never edit generated files in `Sources/` or `dist/` directly — they're rebuilt by CI)
   - Adding or changing an app in the footer? Edit `apps.json`, not a site's markup. `dist/components/` is generated from it.
3. Bump `meta.version` in `tokens.json` following [SemVer](https://semver.org/):
   - **Patch** (x.x.0 → x.x.1) — value tweaks to existing tokens (e.g. a color adjustment); no new or renamed keys
   - **Minor** (x.0 → x.1) — new tokens or token categories, added without breaking existing keys
   - **Major** (1.0 → 2.0) — breaking changes: renamed/removed keys or structural changes
4. Update `meta.updated` date
5. Run locally to verify:
   ```bash
   node scripts/validate.js   # checks structure + WCAG contrast
   node scripts/build.js      # regenerates platform files
   ```
6. Update `CHANGELOG.md` with your change — add both a `## [x.y.z]` section and the matching `[x.y.z]: <release url>` link reference at the bottom
7. Open a PR

Your changelog entry becomes the GitHub Release body verbatim (`scripts/release-notes.js` extracts it, and the workflow publishes it), so write it for someone reading it on its own rather than scrolling the file.

The version has to be written in four places and `scripts/validate.js` fails if they disagree: `meta.version` in `tokens.json`, `version` in `package.json`, the `CHANGELOG.md` entry, and the `(vX.Y.Z)` marker in the `design.md` heading. Run it before pushing.

## Development

No dependencies required. Scripts use only Node.js built-ins (Node 22+ — see `.nvmrc`).

```bash
# Validate token structure and contrast (fails on WCAG AA violations)
node scripts/validate.js

# Generate platform files
node scripts/build.js

# Run contract tests against generated outputs
node scripts/test.js
```

CI runs all three on every PR plus `swift build` and `npm pack --dry-run`. Generated files in `Sources/` and `dist/` must be in sync with `tokens.json` or PR-CI fails.

## Code style

- Keep `tokens.json` human-readable (2-space indentation)
- Generated files are committed — don't `.gitignore` them
- Never invent new tokens locally in consuming projects; always update `tokens.json` first
