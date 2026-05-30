# iamjarl-design

[![Version](https://img.shields.io/github/v/tag/jarllyng/iamjarl-design?label=version&sort=semver)](https://github.com/jarllyng/iamjarl-design/releases)
[![License](https://img.shields.io/github/license/jarllyng/iamjarl-design)](LICENSE)
[![Build Tokens](https://github.com/jarllyng/iamjarl-design/actions/workflows/build-tokens.yml/badge.svg)](https://github.com/jarllyng/iamjarl-design/actions/workflows/build-tokens.yml)
[![SPM compatible](https://img.shields.io/badge/SPM-compatible-brightgreen.svg)](https://swift.org/package-manager/)

Shared design system for all IAMJARL products (apps + web).

This repository is the **single source of truth** for colors, typography, spacing, radius and icon usage across all IAMJARL projects.
It is designed to work equally well for **humans** (design overview) and **AI tools like Cursor** (deterministic tokens + rules).

[![Co-created with AI](https://madebyhuman.iamjarl.com/badges/co-created-white.svg)](https://madebyhuman.iamjarl.com)

> **⚠️ Upgrading?** v0.4 changed the error color and switched the npm package to ESM. v0.3 prefixed all CSS variables with `--ij-`. See **[MIGRATION.md](MIGRATION.md)** for step-by-step upgrade guides.

---

## What's inside
- `tokens.json` — machine-readable design tokens (colors incl. interaction/disabled/state-text, spacing, radius, typography, icons, shadows, motion, breakpoints, focus, z-index, opacity)
- `design.md` — rules, principles and non-negotiables (Cursor-friendly)
- `index.html` — human-friendly viewer that renders tokens visually
- `scripts/build.js` — generates platform-specific token files from `tokens.json`
- `scripts/validate.js` — validates token structure and contrast ratios

### Generated outputs
- `Sources/IAMJARLDesignTokens/DesignTokens.swift` — Swift (SPM package)
- `dist/css/tokens.css` — CSS custom properties (light + dark mode)
- `dist/ts/tokens.ts` — TypeScript module (React + Expo)

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
    .package(url: "https://github.com/jarllyng/iamjarl-design.git", from: "1.0.0")
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

## Upgrading

When updating to a new version, check **[MIGRATION.md](MIGRATION.md)** for breaking changes and step-by-step instructions.

| From → To | Breaking? | Affects |
| --- | --- | --- |
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
- [ ] Bump `meta.version` in `tokens.json` (patch bump is fine)
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
