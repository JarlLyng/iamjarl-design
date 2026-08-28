# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] — 2026-08-29

Gradients, and the answer to whether `--ij-color-primary-rgb` should have shipped. Closes the questions in #15 and unblocks the TrimrPix and Walkful token migrations.

### Added
- **`gradients` per mode** — `gradient.primary` (the accent extended into a second stop) and `gradient.brand` (the two accents against each other, reversed per mode), emitted as `--ij-gradient-*`. Derived from what the sites had each invented: everything in production was already `135deg`, two or three stops, and mode-aware.
- **The rule that makes them safe:** a gradient must begin at a color the system already names. The second stop then belongs to that gradient rather than becoming an unnamed color loose in the palette — the same reasoning that lets `primarySubtle` hold a literal `rgba()`. `validate.js` enforces the first stop and leaves later stops alone.

### Deprecated
- **`--ij-color-primary-rgb`** (added 1.3.0, removal in 2.0.0). It existed because CSS cannot build `rgba()` from a hex custom property — but it only ever covered `primary`, so `error`, `success` and every future color would each have needed their own triplet. `color-mix(in srgb, var(--ij-color-primary) 30%, transparent)` does the same job on every color token and generates nothing. Still emitted, marked deprecated in the CSS, so 1.3–1.5 consumers keep working. `design.md` now documents `color-mix()` as the idiom, including the hero-glow recipe that had been a candidate for its own token.

### Notes
- Gradients are **web only**. A CSS gradient string has no SwiftUI equivalent and the apps do not use them; the Swift generator skips them by an explicit list rather than by accident.
- Naming: gradients live under `colors.modes.*` in `tokens.json` but emit as `--ij-gradient-*`, not `--ij-color-gradients-*`. That is the second documented exception to the naming rule, alongside `background` → `bg`.
- **TrimrPix's gradient is not accommodated here.** Its purple is `#CE63FF`, which was this system's own light primary until 0.1.4 replaced it for contrast — so it is drift, not a second purple. Corrected to `#A435D2`, its gradient is `gradient.brand` exactly. That correction belongs to TrimrPix as a proposal, not to this repo as a fix.

## [1.5.0] — 2026-08-29

`<ij-footer>` reshaped against the two footers in the portfolio that already read well — WODrounds and Wean Nicotine — before the first consumer ships it.

### Fixed
- **A site would have lost its fine print on upgrade.** Unslotted light DOM is hidden once a shadow root attaches, and the first draft offered nowhere to put a copyright line, legal disclaimer or attribution. TonVault's Elektron disclaimer would have silently disappeared. There is now a `fineprint` slot, and both reference footers confirm the region belongs there.

### Changed
- **Labels are sentence case at normal weight.** The uppercase, letter-spaced, semibold heading did not match either reference footer; both use plain sentence case and lean on opacity instead.
- **Cross-links render as one group.** `Made by Human` and `All projects` sit with the apps rather than on a row of their own, as both reference footers have them.
- **Links no longer carry a platform suffix.** `(Mac)` after every name turned a scannable list into noise, and neither reference footer annotates its links.

### Added
- `layout="columns"` — the Wean Nicotine shape: a grid of groups with links stacked under each heading, collapsing to one column under 480px. Default stays `stacked`, the WODrounds shape.
- `links-label` to override the heading above the site's own links, which otherwise uses the app's name from the registry.

## [1.4.0] — 2026-08-29

The first component. `<ij-footer>` renders a site's footer cross-links from a registry in this repo, so a new app is added once here rather than in every site's footer by hand.

### Added
- **`apps.json`** — the canonical product registry: id, name, url, platform, category, status. Grouped by audience so a site links what its own visitor would want (a training app links the training apps), per #6. Two flags keep the data honest about intent: `always` for the portfolio-wide links that belong in every footer, and `consumes` for which sites actually render the component, so a rollout can go one site at a time. A `status` field carries side projects alongside shipped products without deciding yet whether they appear — the render rule filters, the data stays complete.
- **`<ij-footer>`** at `dist/components/ij-footer.js`, exported as `@iamjarl/design-tokens/components`. Ships as one self-contained ESM file with the registry inlined: one script tag, no module resolution, no runtime fetch that could fail or hit CORS.
- **`scripts/validate.js` gates the registry** — unique ids, https urls, known status, every app either in a declared category or marked `always` (never neither, which would silently drop it from every footer), and at least one consumer.

### Notes for consumers
The component **inherits** the host's tokens rather than declaring its own, through two-tier variables with fallbacks. A site with a token layer gets its own theme, including a pinned `.light` or `.dark`; a site without one gets the system's values. It deliberately does not load `tokens.shadow.css` — those `:host` declarations would beat the page's and override the site's chosen mode.

Anything inside the tag without `slot="links"` is not rendered, which makes it the pre-upgrade fallback: if the script never loads, a visitor sees that plain HTML instead of nothing.

### Fixed
- Cross-links have drifted apart across the sites. TonVault did not link Echolume despite sharing an audience; the registry closes that on the pilot's first render.

## [1.3.0] — 2026-08-28

Two token families the marketing sites had each invented for themselves. Additive; no existing key changes.

### Added
- **`container` — content max-widths** (`sm: 680`, `md: 900`, `lg: 1080`, `xl: 1400`), emitted as `--ij-container-*`, `Container` in Swift, and `container` in TS. Derived from what the sites already ship rather than invented: six of them had their own content-width variable, and four had independently landed within 6% of each other (1040, 1080, 1088, 1100). Distinct from `breakpoints`, which say where layout changes rather than how wide content may get.
- **`--ij-color-primary-rgb`** — the mode-aware primary as a raw `r, g, b` triplet, so consumers can compose `rgba(var(--ij-color-primary-rgb), 0.3)` for tints, glows and borders. CSS cannot derive this from a hex custom property, which is why two sites had hand-written it; both had computed exactly the values this now generates.

### Fixed
- The `.d.ts` generator emitted `export type X = typeof x` for numeric token families without emitting `export declare const x`, so a strict TypeScript consumer could not compile against them. Found while adding `container`; the same shape would have broken any future numeric family.
- **`--ij-color-primary-rgb` could go missing from one mode without any warning.** The triplet is parsed from `primary` as hex, and a non-hex primary was skipped silently — so an `rgba()` primary (a legal value; `primarySubtle` already is one) would ship the variable in dark mode and omit it in light, breaking a consumer's `rgba(var(--ij-color-primary-rgb), …)` in one mode only. `validate.js` now requires `primary` to be hex in both modes, the CSS generator throws instead of skipping, and a contract test asserts the variable appears in all four mode blocks.

### Internal
- `validate.js` checks `container` values are positive and strictly ascending, matching how `zIndex` is enforced.
- Contract tests cover `container` across all four outputs (Swift enum, CSS variables, `.d.ts` const, JS runtime) and assert the container scale is ascending in the generated CSS.

## [1.2.1] — 2026-08-13

No token changes. Closes the last place the version could drift.

### Fixed
- **Every tag now gets a GitHub Release.** `build-tokens.yml` created git tags but never Release objects, so GitHub's "Latest release" label sat on **v0.5.0 through three subsequent releases** — the repo's own front page advertised a version three releases behind, while the README badge (which reads tags) correctly showed 1.2.0. Releases for 1.0.0, 1.1.0 and 1.2.0 have been backfilled, and the workflow now creates one alongside each tag, idempotently.

### Added
- `scripts/release-notes.js` — prints a version's `CHANGELOG.md` section, used as the release body so the notes have exactly one source. Contract tests cover extraction, boundary handling, and the unknown-version case.

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

Documented retroactively — this version was tagged without a changelog entry or a version bump in `tokens.json`/`package.json`. See the 1.2.0 *Fixed* notes for how that happened and what stops it recurring.

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

[1.6.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.6.0
[1.5.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.5.0
[1.4.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.4.0
[1.3.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.3.0
[1.2.1]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.2.1
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
