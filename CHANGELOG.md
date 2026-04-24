# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.3.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v0.3.0
[0.2.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v0.2.0
[0.1.4]: https://github.com/jarllyng/iamjarl-design/releases/tag/v0.1.4
[0.1.3]: https://github.com/jarllyng/iamjarl-design/releases/tag/v0.1.3
[0.1.2]: https://github.com/jarllyng/iamjarl-design/releases/tag/v0.1.2
[0.1.1]: https://github.com/jarllyng/iamjarl-design/releases/tag/v0.1.1
