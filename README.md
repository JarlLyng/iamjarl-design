# iamjarl-design

[![Version](https://img.shields.io/github/v/tag/jarllyng/iamjarl-design?label=version&sort=semver)](https://github.com/jarllyng/iamjarl-design/releases)
[![License](https://img.shields.io/github/license/jarllyng/iamjarl-design)](LICENSE)
[![Build Tokens](https://github.com/jarllyng/iamjarl-design/actions/workflows/build-tokens.yml/badge.svg)](https://github.com/jarllyng/iamjarl-design/actions/workflows/build-tokens.yml)
[![SPM compatible](https://img.shields.io/badge/SPM-compatible-brightgreen.svg)](https://swift.org/package-manager/)

Shared design system for all IAMJARL products (apps + web).

This repository is the **single source of truth** for colors, typography, spacing, radius and icon usage across all IAMJARL projects.
It is designed to work equally well for **humans** (design overview) and **AI tools like Cursor** (deterministic tokens + rules).

[![Co-created with AI](https://madebyhuman.iamjarl.com/badges/co-created-white.svg)](https://madebyhuman.iamjarl.com)

> **⚠️ Upgrading?** Everything from v1.1 through v1.8 is a safe bump — nothing has been renamed or removed since v1.0. The last breaking change was v1.0, which renamed the `typography.lineHeights` keys (`tight/normal/relaxed/…` → `xs/sm/base/lg/xl/xxl`). Earlier: v0.4 changed the error color and switched the npm package to ESM; v0.3 prefixed all CSS variables with `--ij-`. See **[MIGRATION.md](MIGRATION.md)** for step-by-step upgrade guides.

---

## What's inside
- `tokens.json` — machine-readable design tokens (colors incl. interaction/disabled/state-text, spacing, radius, typography, icons, shadows, motion, breakpoints, focus, z-index, opacity)
- `design.md` — rules, principles and non-negotiables (Cursor-friendly)
- `COMPONENTS.md` — the components layer: reasoning, scope and testing policy
- `apps.json` — canonical product registry, consumed by `<ij-footer>` for cross-links
- `index.html` — human-friendly viewer that renders tokens visually
- `scripts/build.js` — generates platform-specific token files from `tokens.json`
- `scripts/validate.js` — validates token structure and contrast ratios

### Generated outputs
- `Sources/IAMJARLDesignTokens/DesignTokens.swift` — Swift (SPM package)
- `dist/css/tokens.css` — CSS custom properties (light + dark mode)
- `dist/css/tokens.shadow.css` — same variables scoped to `:host` (Shadow DOM / content scripts)
- `dist/ts/tokens.js` — ESM runtime (npm main entry)
- `dist/ts/tokens.d.ts` — TypeScript declarations
- `dist/ts/tokens.ts` — TypeScript source (for inspection / TS-aware bundlers)
- `dist/components/ij-footer.js` — `<ij-footer>` web component, registry inlined
- `dist/footers/<app>.html` — pre-rendered cross-links per app, for inlining at build time

---

## Quick start: Install in your project

### SwiftUI (iOS / macOS) via Swift Package Manager

In Xcode: File > Add Package Dependencies, enter:

```
https://github.com/jarllyng/iamjarl-design.git
```

Or in your `Package.swift`:

```swift
dependencies: [
    .package(url: "https://github.com/jarllyng/iamjarl-design.git", from: "1.8.1")
]
```

Then use in code:

```swift
import IAMJARLDesignTokens

// Mode-aware colors
let primary = DesignTokens.Common.primary(scheme)
let textColor = DesignTokens.Common.Text.primary(scheme)

// Spacing and radius
let padding = DesignTokens.Spacing.md
let corner = DesignTokens.Radius.lg
```

### React web (npm)

```bash
npm install github:jarllyng/iamjarl-design
```

CSS custom properties:

```css
@import '@iamjarl/design-tokens/css';

.button {
  background: var(--ij-color-primary);
  color: var(--ij-color-on-primary);
  border-radius: var(--ij-radius-md);
  padding: var(--ij-spacing-md) var(--ij-spacing-xl);
}
.button:hover  { background: var(--ij-color-primary-hover); }
.button:active { background: var(--ij-color-primary-pressed); }
.button:disabled {
  background: var(--ij-color-bg-disabled);
  color: var(--ij-color-text-disabled);
}

/* Inline validation text uses the AA-safe state colors, not the fills */
.error-text { color: var(--ij-color-state-error); }
```

TypeScript imports:

```typescript
import { colors, spacing, radius } from '@iamjarl/design-tokens';

const theme = colors.light;
// theme.primary, theme.text.primary, etc.
```

### Expo / React Native

```bash
npm install github:jarllyng/iamjarl-design
```

```typescript
import { colors, spacing, typography } from '@iamjarl/design-tokens';
import { useColorScheme } from 'react-native';

function useTheme() {
  const scheme = useColorScheme() ?? 'light';
  return colors[scheme];
}

// In a component:
const theme = useTheme();
// theme.primary, theme.text.primary, theme.background.app, etc.
```

### Chrome extension (Manifest V3)

```bash
npm install github:jarllyng/iamjarl-design
```

**Popup, options page, side panel** — link the standard CSS file:

```html
<!-- popup.html / options.html / sidepanel.html -->
<link rel="stylesheet" href="dist/css/tokens.css">
<style>
  body {
    width: var(--ij-breakpoint-popup);  /* 320px popup width */
    padding: var(--ij-spacing-lg);
    background: var(--ij-color-bg-app);
    color: var(--ij-color-text-primary);
  }
</style>
```

Add the file to `web_accessible_resources` in `manifest.json` if needed:

```json
{
  "web_accessible_resources": [{
    "resources": ["dist/css/tokens.css"],
    "matches": ["<all_urls>"]
  }]
}
```

**Content script with Shadow DOM** — use the `:host`-scoped variant to isolate from the host page:

```typescript
import shadowCss from '@iamjarl/design-tokens/css/shadow' with { type: 'css' };

const container = document.createElement('div');
const shadow = container.attachShadow({ mode: 'open' });
shadow.adoptedStyleSheets = [shadowCss];

shadow.innerHTML = `
  <style>
    .card {
      background: var(--ij-color-bg-card);
      color: var(--ij-color-text-primary);
      padding: var(--ij-spacing-md);
      border-radius: var(--ij-radius-md);
    }
  </style>
  <div class="card">Hello from extension</div>
`;
document.body.appendChild(container);
```

If your bundler doesn't support CSS imports as `CSSStyleSheet`, fetch and inject as text:

```typescript
const cssUrl = chrome.runtime.getURL('dist/css/tokens.shadow.css');
const cssText = await fetch(cssUrl).then(r => r.text());

const style = document.createElement('style');
style.textContent = cssText;
shadow.appendChild(style);
```

**Background/service worker** — use the TS module for color values without DOM:

```typescript
import { colors } from '@iamjarl/design-tokens';
chrome.action.setBadgeBackgroundColor({ color: colors.light.primary });
```

---

## Web component: `<ij-footer>`

A shared footer that builds its cross-links from [`apps.json`](apps.json), so adding an app updates
every site instead of nine hand-kept lists. Works in any page — no build step, no framework.

```html
<script type="module"
  src="https://cdn.jsdelivr.net/gh/jarllyng/iamjarl-design@v1.8.1/dist/components/ij-footer.js"></script>

<ij-footer app="tonvault" tagline="An IAMJARL app. Pay once, own it.">
  <a slot="links" href="/privacy">Privacy</a>
  <a slot="links" href="/support">Support</a>

  <!-- Copyright, legal disclaimers, attribution -->
  <p slot="fineprint">&copy; 2026 IAMJARL. Not affiliated with Elektron.</p>

  <!-- No slot attribute: shown only until the component upgrades, so this is
       what a visitor sees if the script never loads. Always include one. -->
  <p>&copy; 2026 TonVault · <a href="/privacy">Privacy</a></p>
</ij-footer>
```

| Attribute | |
| --- | --- |
| `app` | **Required.** An `id` from `apps.json` |
| `tagline` | Optional line above the links |
| `layout` | `stacked` (default, the WODrounds shape) or `columns` (the Wean Nicotine shape) |
| `links-label` | Heading above your own links; defaults to the app's name |

### Two ways to take it, and which one you want

The snippets above load from a CDN, which is right for a hand-edited static site. **If your site has
a build step, install it instead.**

| | Pinned CDN URL | npm dependency |
|---|---|---|
| Best for | hand-edited static HTML | anything with a build |
| Where the version lives | in the markup | in `package.json`, where Dependabot can see it |
| Reproducibility | the tag | the lockfile pins the exact commit |
| Runtime dependency | a third-party CDN | none — served from your own origin |
| Needs `integrity`? | yes, worth it | no — nothing crosses an origin |

```bash
npm install github:jarllyng/iamjarl-design#v1.8.0
```

```js
import '@iamjarl/design-tokens/components';   // registers <ij-footer>
import '@iamjarl/design-tokens/css';          // the token layer
```

Pin the tag in the dependency, not just the range. PageLens does this and its lockfile resolves to
the exact commit behind `v1.8.0`, which is a stronger guarantee than a tag URL — a tag can in
principle be moved, a commit cannot.

The cross-link fragment works either way: fetch `dist/footers/<app>.html` during the build, or read
it from `node_modules/@iamjarl/design-tokens/dist/footers/`.

### Pinning with Subresource Integrity

For the CDN path only — a bundled dependency is served from your own origin and needs none of this.

A pinned tag says *which* file you want; an `integrity` hash proves you got it. jsDelivr serves
`/gh/` paths byte-for-byte, so these hashes are valid for the URLs below. They are generated at
build time and regenerate every release &mdash; copy them from here, never from an older version.

<!-- SRI:BEGIN -->
```html
<link rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/jarllyng/iamjarl-design@v1.9.0/dist/css/tokens.css"
  integrity="sha384-9TObbFSG6c8YTCyahSy1E3odNMMUIa8tvGfmYlwzL82AuEvCQI0QlHu+vys/tasZ"
  crossorigin="anonymous">

<script type="module"
  src="https://cdn.jsdelivr.net/gh/jarllyng/iamjarl-design@v1.9.0/dist/components/ij-footer.js"
  integrity="sha384-5DR63q3a8ZV2CCfPBzXLA7uvad6Hi7uzJVjyBemBJNR1AN0cj5IbsdFvdFV/Zd7v"
  crossorigin="anonymous"></script>
```
<!-- SRI:END -->

Machine-readable equivalents live in [`dist/sri.json`](dist/sri.json), exported as
`@iamjarl/design-tokens/sri.json` if your build wants to inject them.

**Know the failure mode before you add it.** A mismatched hash fails closed: the browser blocks the
resource outright. For the component that means the pre-upgrade fallback footer. **For
`tokens.css` it means the page renders with no tokens at all**, which is a far louder failure than
a stale stylesheet would have been. Both are safe when the tag and hash move together &mdash; which
is why they are published together here &mdash; but bump them in the same commit, and never carry a
hash across a version change.

### Cross-links in your served HTML

The component builds the cross-links at runtime, so crawlers that do not execute JavaScript
(GPTBot, ClaudeBot, CCBot, PerplexityBot) never see them. If your site has a build step, inline the
pre-rendered fragment for your app and the component will slot it instead of regenerating:

```bash
curl -sO https://cdn.jsdelivr.net/gh/jarllyng/iamjarl-design@v1.8.1/dist/footers/botlens.html
```

```html
<ij-footer app="botlens">
  <a slot="links" href="/privacy">Privacy</a>
  <!-- contents of dist/footers/botlens.html -->
  <a slot="cross-links" href="https://pagelens.iamjarl.com">PageLens</a>
  <a slot="cross-links" href="https://tonvault.iamjarl.com">TonVault</a>
</ij-footer>
```

Both paths come from the same registry and the same selection rule, so they render the same links.
The difference is freshness: a fragment is a snapshot that refreshes when you rebuild, where the
generated version is current on every load. Omit the slot entirely and nothing changes.

Two slots, because a footer carries two kinds of per-site content. `links` holds your own
navigation; `fineprint` holds the colophon — copyright, legal text, attribution. **Put legal text in
`fineprint`, not loose in the tag** — unslotted content is hidden once the component upgrades.

**Pin the tag.** A version-pinned jsDelivr URL is immutable and supports SRI. Serving always-latest
means one bad commit reaches every site at once.

`app` must match an `id` in `apps.json`. Links are grouped by that app's category, so a training app
links the other training apps; `Made by Human` and `All projects` appear everywhere. A category with
fewer than three members is topped up with the newest apps, and a site never links to itself.

### Theming

The component **inherits** your tokens — it declares none of its own. Import `dist/css/tokens.css`
on the page and the footer follows it, including a pinned `.light` or `.dark` class. Without a token
layer it falls back to the system's own values and follows `prefers-color-scheme`.

Do **not** feed it `tokens.shadow.css`: those `:host` declarations would beat the page's and override
the mode your site chose.

### Adding an app

Edit [`apps.json`](apps.json), run `node scripts/validate.js && node scripts/build.js`, and open a
PR. Every consuming site picks it up on its next version bump.

---

## Token reference & naming

The **[live viewer](https://jarllyng.github.io/iamjarl-design/)** and [`tokens.json`](tokens.json) are the canonical, always-current list of every token. The rules below let you derive a CSS variable or Swift accessor name without looking it up.

### CSS variable naming
Every variable is prefixed `--ij-` and the token path is lower-kebab-cased:

| Token (in `tokens.json`) | CSS variable |
| --- | --- |
| `spacing.md` | `--ij-spacing-md` |
| `radius.lg` | `--ij-radius-lg` |
| `colors.modes.*.primary` | `--ij-color-primary` |
| `colors.modes.*.onPrimary` | `--ij-color-on-primary` |
| `colors.modes.*.primaryHover` | `--ij-color-primary-hover` |
| `colors.modes.*.text.secondary` | `--ij-color-text-secondary` |
| `colors.modes.*.text.disabled` | `--ij-color-text-disabled` |
| `colors.modes.*.background.card` | `--ij-color-bg-card` ⚠️ `background` → `bg` |
| `colors.modes.*.state.error` | `--ij-color-state-error` (text-safe; AA on `background.app`) |
| `colors.shared.error` | `--ij-color-error` (fill; pair with `--ij-color-on-error`) |
| `colors.modes.*.gradients.primary` | `--ij-gradient-primary` ⚠️ not `--ij-color-gradients-*` |
| `shadows.md` | `--ij-shadow-md` |
| `motion.duration.normal` | `--ij-duration-normal` |
| `motion.easing.standard` | `--ij-easing-standard` |
| `breakpoints.md` | `--ij-breakpoint-md` |
| `focus.width` | `--ij-focus-width` |
| `zIndex.modal` | `--ij-z-modal` |
| `opacity.disabled` | `--ij-opacity-disabled` |

Rule: `--ij-` + group + kebab(key). Two non-obvious mappings: **`background` → `bg`**, and **gradients get their own `--ij-gradient-*` namespace** rather than being flattened under `--ij-color-`. Mode colors (`primary`, `text.*`, `background.*`, `surface.*`, `border.*`, `state.*`) switch automatically via `prefers-color-scheme`, or manually with a `.light` / `.dark` class on a parent.

### Gradients and tints
- `--ij-gradient-primary` / `--ij-gradient-brand` are mode-aware CSS gradient values. Web only — they have no SwiftUI equivalent.
- For a tint, glow or translucent border, use `color-mix()` against an existing token rather than a hardcoded `rgba()`:
  ```css
  background: color-mix(in srgb, var(--ij-color-primary) 30%, transparent);
  ```
- `--ij-color-primary-rgb` is **deprecated** since 1.6.0 (removal in 2.0.0). It only covered `primary`; `color-mix()` works on every color token.

### State colors: fill vs. text
- `--ij-color-{success,warning,error}` are **fills** — use as backgrounds, paired with `--ij-color-on-*`.
- `--ij-color-state-{success,warning,error}` are **text/foreground** colors, tuned per mode to meet WCAG AA on `--ij-color-bg-app`. Never use a raw fill color as text.

### Swift accessors
Mode-aware colors take the `ColorScheme`: `DesignTokens.Common.primary(scheme)`, `.Text.disabled(scheme)`, `.State.error(scheme)`. Non-color scales are static: `DesignTokens.Spacing.md`, `.Radius.lg`, `.ZIndex.modal`, `.Opacity.disabled`. See [CLAUDE.md](CLAUDE.md) for the full accessor list.

---

## Upgrading

When updating to a new version, check **[MIGRATION.md](MIGRATION.md)** for breaking changes and step-by-step instructions.

| From → To | Breaking? | Affects |
| --- | --- | --- |
| 1.2.x → 1.8.1 | No | Six releases, all additive — no CSS variable renamed or removed. One caveat: don't adopt `--ij-color-primary-rgb`, deprecated in 1.6.0 in favour of `color-mix()` |
| 1.1.x → 1.2.0 | No | Nothing in the tokens. Repo maintenance only: Node floor raised to 22, version-coherence checks, CI fixes |
| 1.0.x → 1.1.0 | No | SwiftUI only — macOS deployment floor lowered 13 → 11. No token values changed |
| 0.5.x → 1.0.0 | Yes | `typography.lineHeights` keys renamed (`tight/normal/relaxed/…` → `xs/sm/base/lg/xl/xxl`). Otherwise additive: state-text colors, primary hover/pressed/subtle, disabled tokens, z-index, opacity |
| 0.4.x → 0.5.0 | No | Additive only (Chrome extension support, popup breakpoint, shadow CSS) |
| 0.3.x → 0.4.0 | Yes | Error color (visual) + npm package now ESM |
| 0.2.x → 0.3.0 | Yes | CSS variables now prefixed with `--ij-` |
| 0.1.x → 0.2.0 | No | Additive only (new shadow/motion/breakpoint/focus tokens) |

For SwiftUI: **File → Packages → Update to Latest Package Versions**
For npm: `npm update @iamjarl/design-tokens`

---

## Cursor start prompt (copy/paste)

Use this when you start a new project or when you want Cursor to sync an existing project with the latest tokens.

```text
You must follow the IAMJARL Design System.

Source of truth:
- Design rules: https://jarllyng.github.io/iamjarl-design/design.md
- Tokens (JSON): https://jarllyng.github.io/iamjarl-design/tokens.json
- Human viewer: https://jarllyng.github.io/iamjarl-design/

Rules:
- Do NOT invent new colors, spacing, radius or typography values.
- Always support light + dark mode using the tokens.
- Use Phosphor icons and follow the icon rules in design.md.
- For colored backgrounds, always use semantic on-colors (onPrimary, onSuccess, onWarning, onError) to ensure sufficient contrast.

Integration:
- SwiftUI: Add the SPM package from https://github.com/jarllyng/iamjarl-design.git and use `import IAMJARLDesignTokens`.
- React/Expo: Install via `npm install github:jarllyng/iamjarl-design` and import from `@iamjarl/design-tokens`.
- If SPM/npm is not an option, read tokens.json and create local token mappings.

Task:
1) Install the design tokens package for this project type.
2) Update the UI to use tokens only (no hardcoded values).
3) If there are conflicts, prefer the design system.
```

---

## Update workflow (when changing the design system)

### 1) Make the change
- [ ] Update `tokens.json` (preferred) or `design.md` (rules)
- [ ] Bump `meta.version` in `tokens.json` per [SemVer](https://semver.org/) — see [CONTRIBUTING.md](CONTRIBUTING.md) (patch = value tweak, minor = new token, major = rename/removal). Keep it in sync with `package.json`.
- [ ] Update `meta.updated` date in `tokens.json`

### 2) Verify locally
```bash
node scripts/validate.js   # check structure + contrast
node scripts/build.js       # regenerate platform files
```
- [ ] Open `index.html` locally and confirm tokens render correctly

### 3) Publish
- [ ] Commit everything (including generated files in `Sources/` and `dist/`)
- [ ] Push to GitHub
- [ ] GitHub Actions will auto-regenerate and tag the version

### 4) Sync projects
- **SwiftUI**: In Xcode, update the package version (File > Packages > Update)
- **React/Expo**: Run `npm update @iamjarl/design-tokens`
- Visually verify key screens in light + dark mode

---

## Building locally

```bash
# Validate tokens.json
node scripts/validate.js

# Generate platform files
node scripts/build.js
```

No dependencies required — scripts use only Node.js built-ins.

---

## Hosting

This repo is hosted on GitHub Pages:

```
https://jarllyng.github.io/iamjarl-design/
```
