# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] — 2026-08-13

Maintenance release. No token values changed — every generated output is byte-identical to 1.1.0 apart from the version stamp.

### Changed
- **Node floor raised from 20 to 22** (`engines`, `.nvmrc`, both workflows). Node 20 reached end-of-life in April 2026. PR-CI now runs the Node matrix `[22, 24]` so the declared floor is actually tested, and `.nvmrc` pins the recommended 24.
- `actions/checkout` and `actions/setup-node` bumped to v7.
- `CLAUDE.md` is now a symlink to `AGENTS.md`. The two files had been byte-identical duplicates, which is a guarantee of eventual drift; there is now one file to edit.

### Fixed
- **Version coherence.** 1.1.0 shipped as a git tag while `tokens.json` `meta.version` and `package.json` both still read `1.0.0`, so anything reading the version programmatically got the wrong answer. Both now track the tag, and `1.1.0` is documented below.
- `build-tokens.yml` only triggered on `tokens.json` changes, so the `Package.swift`-only 1.1.0 release was never validated, regenerated or tagged by CI — the tag was created by hand. The workflow now also watches `package.json`, `Package.swift`, `design.md` and `scripts/**`, and tagging remains a no-op when the tag already exists.
- `scripts/validate.js` now hard-fails unless `tokens.json`, `package.json`, the `CHANGELOG.md` entry (heading **and** link reference) and the `design.md` heading all agree on the version. This is the check that would have caught the 1.1.0 drift at commit time.
- `CHANGELOG.md` was missing release link references for every 1.x version.

## [1.1.0] — 2026-06-24

Documented retroactively — this version was tagged without a changelog entry or a version bump in `tokens.json`/`package.json`. See the 1.2.0 *Fixed* notes above.

### Changed
- **Lowered the SwiftUI macOS deployment floor from 13 to 11**, so the package can be consumed by apps still supporting macOS Big Sur. No token values changed.

## [1.0.0] — 2026-05-31

First stable release. New token groups for interaction states, disabled UI, stacking, and accessible state text.

### Added
- **Mode-aware state text colors** (`colors.modes.{light,dark}.state.{success,warning,error}`). The shared `success`/`warning`/`error` colors are *fills* (paired with `on*`); used as foreground text on `background.app` they failed WCAG AA (`success` 2.78:1, `warning` 2.84:1 on white; `error` 3.90:1 on black). The new `state.*` colors are AA-verified against `background.app` in each mode and the validator now **hard-fails** if they drop below 4.5:1.
- **Primary interaction states** (`primaryHover`, `primaryPressed`, `primarySubtle`) per mode — apps no longer hand-roll hover/pressed/tint colors.
- **Disabled tokens**: `text.disabled` and `background.disabled` per mode, plus an `opacity` scale (`disabled: 0.4`, `muted: 0.65`).
- **Z-index scale** (`zIndex`): base, dropdown, sticky, overlay, modal, popover, toast, tooltip. Validator enforces strictly ascending values. Emitted as Swift `DesignTokens.ZIndex`, CSS `--ij-z-*`, and TS `zIndex`.
- New Swift accessors: `Common.primaryHover/primaryPressed/primarySubtle`, `Common.Text.disabled`, `Common.Background.disabled`, and `Common.State.{success,warning,error}` (mode-aware text colors).

### Changed
- **BREAKING — `typography.lineHeights` keys renamed** from `tight/normal/relaxed/xxl/sm` (unordered) to `xs/sm/base/lg/xl/xxl`, each paired 1:1 with a `typography.sizes` key. Update any references to the old keys.

### Internal
- CSS generator refactored to a single generic mode-emitter (removed three duplicated flatten blocks).
- Schema, validator, and contract tests extended to cover all new token groups.

## [0.5.0] — 2026-05-01

### Added
- **Chrome extension support** with first-class documentation:
  - New `popup` breakpoint at 320px for Chrome extension popup widths.
  - New `dist/css/tokens.shadow.css` — same variables but scoped to `:host` for use in Shadow DOM (content scripts that don't want to inherit host page styles).
  - New `@iamjarl/design-tokens/css/shadow` export.
  - README, AGENTS.md, and CLAUDE.md now document popup, options, sidepanel, content script (Shadow DOM), and service worker patterns.

## [0.4.0] — 2026-05-01

### Added
- **Proper npm package contract**: generates `dist/ts/tokens.js` (ESM runtime) and `dist/ts/tokens.d.ts` (type declarations) alongside the `.ts` source. `package.json` now uses `"type": "module"` with strict `exports` map.
- **Contract tests** (`scripts/test.js`) — 56 assertions verifying generated Swift, CSS, JS, and `.d.ts` outputs match the documented API.
- **PR-CI workflow** — runs validate, build, drift check, contract tests, `npm pack --dry-run`, and `swift build` on every PR touching tokens or generators.
- **Dependabot config** for monthly GitHub Actions updates.
- **PR template** with version-bump, validate/build, and changelog checklist.
- **Version sync check** — validator fails if `tokens.json` `meta.version` and `package.json` `version` disagree.
- `tokens.json` and `design.md` now ship in the npm tarball.

### Changed
- **Error color updated from `#FF3B30` to `#D70015`** so white text reaches WCAG AA (5.38:1 vs previous 3.55:1).
- **Validator now fails** (not just warns) when any semantic `on*` pair drops below WCAG AA 4.5:1. The design system now refuses to ship inaccessible color pairs.
- **`index.html` viewer now consumes `dist/css/tokens.css`** — the design system is its own first consumer.
- **Build pipeline auto-tags** with proper `git fetch-tags` so it doesn't miss existing tags.
- Stricter `rgba()` validation: r/g/b must be 0–255, alpha 0–1.

### Breaking
- Error color changed (visual change for any UI using `error` token).
- `package.json` is now ESM (`"type": "module"`). Runtime entry is `.js` not `.ts` — most consumers are unaffected, but projects deep-importing the `.ts` source need to switch to the package's main export.

## [0.3.0] — 2026-04-25

### Added
- **JSON Schema** (`tokens.schema.json`) for IDE autocomplete and inline validation in `tokens.json`. Referenced via `$schema`.
- **Named TypeScript types** for ergonomic consumer use (`Spacing`, `SpacingKey`, `ThemeColors`, `ShadowKey`, `BreakpointKey`, etc.).
- **`npm run serve`** and **`npm run dev`** scripts for running `index.html` locally without CORS issues.

### Changed
- **CSS variables now prefixed with `--ij-`** to avoid collisions with third-party libraries (Tailwind, UI kits). Existing CSS using `var(--color-primary)` must update to `var(--ij-color-primary)`.

### Breaking
- All CSS custom properties have been renamed (e.g. `--color-primary` → `--ij-color-primary`). Update any consuming web project to use the new prefixed names.

## [0.2.0] — 2026-04-20

### Added
- **Shadow tokens** (`sm`, `md`, `lg`) with `x/y/blur/opacity` structure — emitted as Swift structs, CSS `box-shadow` strings, and TS objects with `shadowCss()` helper.
- **Motion tokens**: three durations (`fast`, `normal`, `slow`) and two easing curves (`standard`, `emphasized`) as cubic-bezier control points. Swift emits `Animation` factories; CSS emits `cubic-bezier(...)` strings.
- **Breakpoint tokens** (`sm` 640 → `xxl` 1536) for responsive web layouts.
- **Focus ring tokens** (`width`, `offset`) for consistent keyboard focus styling.
- Validation checks for all new optional sections in `scripts/validate.js`.

### Changed
- **`onSuccess` switched from white to black** (contrast 2.78:1 → 7.56:1) for WCAG AA compliance.

## [0.1.4] — 2026-03-31

### Changed
- **Light primary** updated from `#CE63FF` to `#A435D2` for better readability on white backgrounds.
- **Light `onPrimary`** switched from black to white (button text now has 5.23:1 contrast).

## [0.1.3] — 2026-03-15

### Changed
- **Light primary** updated from `#00E56F` to `#CE63FF` (shift to purple branding).

### Fixed
- GitHub Actions permissions — workflow can now commit and tag automatically.
- Workflow trigger extended to fire on workflow file changes as well as `tokens.json` changes.

## [0.1.2] — 2026-03-15

### Changed
- **Light primary** updated from `#00FF7B` to `#00E56F` (slightly deeper green for better on-white contrast).

## [0.1.1] — 2026-01-18

### Added
- Initial public release.
- `tokens.json` — single source of truth for colors, spacing, radius, typography, and icons.
- `design.md` — design rules, UI recipes, and non-negotiable guidelines.
- `index.html` — visual token viewer with copy-to-clipboard support.
- Automated build pipeline generating:
  - SwiftUI package at `Sources/IAMJARLDesignTokens/DesignTokens.swift`
  - CSS custom properties at `dist/css/tokens.css`
  - TypeScript module at `dist/ts/tokens.ts`
- `scripts/validate.js` with JSON schema and WCAG 2.1 contrast checks.
- GitHub Actions workflow to regenerate platform files and tag versions on push.
- Light + dark mode support across all platforms.

[1.2.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.2.0
[1.1.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.1.0
[1.0.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.0.0
[0.5.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v0.5.0
[0.4.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v0.4.0
[0.3.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v0.3.0
[0.2.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v0.2.0
[0.1.4]: https://github.com/jarllyng/iamjarl-design/releases/tag/v0.1.4
[0.1.3]: https://github.com/jarllyng/iamjarl-design/releases/tag/v0.1.3
[0.1.2]: https://github.com/jarllyng/iamjarl-design/releases/tag/v0.1.2
[0.1.1]: https://github.com/jarllyng/iamjarl-design/releases/tag/v0.1.1
