# Migration Guide

Step-by-step instructions for updating consumer projects between versions.

---

## v1.7.0 → any later 1.x

Coming from 1.2.x? Read [the section below](#v12x--v170) first — it covers 1.3.0 to 1.7.0 — then this one.

### What changed
**Nothing broke.** No CSS custom property was renamed or removed between v1.7.0 and today; the `diff` recipe in the section below confirms it for any pair of tags. Package exports have only been added (`./sri.json`, `./identity/*`, `./patterns/*`).

This table gets a row for every release, including the ones where the answer is "nothing". A consumer several releases behind should be able to read one table rather than a changelog. `validate.js` fails a release that does not add its row.

| Release | Added | Anything to do? |
|---|---|---|
| **1.7.1** | Documentation only — the previous gap in this file | No |
| **1.8.0** | `dist/sri.json` and paste-ready `integrity` tags in the README | Only if you pin with SRI — see below |
| **1.8.1** | Documentation: installing from npm versus loading from the CDN | No |
| **1.9.0** | Footer top-up now picks the least-connected app; selection no longer depends on the order of `apps.json` | If you inline a footer fragment, re-pull `dist/footers/<app>.html` — every fragment changed. The old one is still valid markup |
| **1.9.1** | Patternaut in the registry | If you inline a fragment for a music app, re-pull it |
| **1.9.2** | Every gradient carries its text-safety verdict in the CSS | Check that no text sits on a gradient — only `dark.gradient.primary` with black clears AA |
| **1.10.0** | The identity layer: `accent` in `apps.json`, per-app sheets | No — it shipped empty |
| **1.11.0** | Approved display faces; per-app sheets move from `dist/accents/` to `dist/identity/` | No — the old path never held a file |
| **1.11.1** | [`patterns/photographic-hero.md`](patterns/photographic-hero.md) | No |
| **1.12.0** | Four families declare an accent, as `--ij-color-accent-family` in `dist/identity/<app>.css`. `ij-footer.js` drops from 16.5 to 14.2 KB, rendering the same links | No — the accent is opt-in, one `<link>` |
| **1.12.1** | Version pins in the README are generated; this table is enforced | No |
| **1.13.0** | `--ij-footer-links-justify` aligns the footer's link rows | Only if your footer is centred or right-aligned — set it alongside `text-align` |
| **1.13.1** | `sri.json` lists every identity sheet; the README documents adopting one | If you pin an identity sheet with `integrity`, take the hash from `sri.json` from now on |

### Who needs to migrate
- ✅ **Everyone** — bump the version. Nothing you use today changes value or name.
- ⚠️ **If you pin with `integrity`**, move the tag and the hash together, in one commit, and take the hash from the README or `sri.json` *at the version you move to*. `ij-footer.js` carries the version in its header, so its hash changes with every release. A mismatched hash fails closed: for the footer that is the fallback markup, for `tokens.css` a page with no tokens at all.
- ⚠️ **If you inline a footer fragment**, re-pull it when you bump past 1.9.0 or 1.9.1. Nothing breaks if you don't; your cross-links just stay as they were.

### New capabilities worth adopting
- **`integrity` on CDN tags** (1.8.0) — the README block is generated, so the tag and the hash in it always agree.
- **Your family's accent** (1.12.0) — `dist/identity/<app>.css`, if your app's category has declared one. It gives your site a colour of its own without leaving the system; `primary` is unchanged. [design.md](design.md#family-accent-web-only) lists the families.
- **The photographic hero** (1.11.1) — if your hero is text on a flat colour and your app has a mood image.

### Action
- **SPM**: Xcode → File → Packages → Update to Latest Package Versions
- **npm**: change the tag in `package.json` (`github:jarllyng/iamjarl-design#vX.Y.Z`), then `npm install`
- **Pinned CDN URL**: change the tag in the `<link>` and `<script>`, and their `integrity`, all at once

---

## v1.2.x → v1.7.0

### What changed
**Nothing broke.** Verified across every release in the range: no CSS custom property was renamed or removed between v1.2.1 and v1.7.0. Six releases, all additive.

| Release | Added | Anything to do? |
|---|---|---|
| **1.3.0** | `container` max-widths (`--ij-container-*`), `--ij-color-primary-rgb` | No |
| **1.4.0** | `<ij-footer>` web component, `apps.json` registry | No — opt in when you want it |
| **1.5.0** | `fineprint` slot and `layout="columns"` on the footer | Only if you already use the footer |
| **1.6.0** | `gradient` family (`--ij-gradient-*`) | **One thing** — see below |
| **1.6.1** | Registry metadata only | No |
| **1.7.0** | `cross-links` slot, `dist/footers/*.html` fragments | No — opt in if your site has a build step |

### Who needs to migrate
- ✅ **Everyone** — bump the version. Nothing you use today changes value or name.
- ⚠️ **One thing to avoid adopting:** `--ij-color-primary-rgb` was added in 1.3.0 and **deprecated in 1.6.0** (removal in 2.0.0). It only ever covered `primary`, so every other colour would have needed its own triplet. Use `color-mix()` instead, which works on every colour token:
  ```css
  /* not this */   rgba(var(--ij-color-primary-rgb), 0.3)
  /* this */       color-mix(in srgb, var(--ij-color-primary) 30%, transparent)
  ```
  It is still emitted, so existing 1.3–1.5 usage keeps working — just do not reach for it in new code.

### New capabilities worth adopting
- **`--ij-container-*`** if your site hand-rolls a content max-width. Six sites had invented their own before this existed.
- **`--ij-gradient-primary` / `--ij-gradient-brand`** instead of rebuilding a gradient by hand.
- **`<ij-footer>`** if you maintain a "More from IAMJARL" list. It reads `apps.json`, so adding an app stops being an edit in every repo.
- **`dist/footers/<app>.html`** if your site has a build step. The component builds cross-links at runtime, which means crawlers that do not execute JavaScript never see them; inlining the fragment puts them in the served HTML. See the README.

### How to check a bump yourself
This guide is written after the fact because it was missing, and a consuming repo had to establish the same thing by reading the diff. If you want to verify a future bump independently, compare the emitted variable names:

```bash
diff <(curl -s https://cdn.jsdelivr.net/gh/jarllyng/iamjarl-design@v1.2.1/dist/css/tokens.css \
        | grep -o '^\s*--ij-[a-z0-9-]*' | tr -d ' ' | sort -u) \
     <(curl -s https://cdn.jsdelivr.net/gh/jarllyng/iamjarl-design@v1.7.0/dist/css/tokens.css \
        | grep -o '^\s*--ij-[a-z0-9-]*' | tr -d ' ' | sort -u)
```

Lines with `<` are names that disappeared — those are the only ones that can break a site. Anything with `>` is new and optional.

### Action
- **SPM**: Xcode → File → Packages → Update to Latest Package Versions
- **npm**: `npm update @iamjarl/design-tokens`
- **Pinned CDN URL**: change the tag in the `<link>` and `<script>` — both at once, so they cannot drift apart

---

## v1.0.x / v1.1.x → v1.2.0

### What changed
Nothing in the tokens. Every generated file is identical apart from the version stamp, so there is no visual or API change on any platform.

1. **v1.1.0** lowered the SwiftUI macOS deployment floor from 13 to 11.
2. **v1.2.0** is repo maintenance: Node floor raised from 20 (end-of-life) to 22, version-coherence validation, and the CI trigger fix that let 1.1.0 ship untagged.

### Who needs to migrate
- ✅ **Everyone** — bump the version and you're done. No code changes.
- ⚠️ **Only if you build this repo** (not if you consume it): local Node must be 22+. `nvm use` picks up the pinned 24 from `.nvmrc`.

### Action
- **SPM**: Xcode → File → Packages → Update to Latest Package Versions
- **npm**: `npm update @iamjarl/design-tokens`

> If you were pinned to `1.0.0` because `package.json` said that was the latest: it wasn't. `v1.1.0` was tagged with the version files left at `1.0.0`. That's fixed as of 1.2.0.

---

## v0.5.x → v1.0.0

### What changed
1. **`typography.lineHeights` keys renamed** (BREAKING): `tight/normal/relaxed/xxl/sm` → `xs/sm/base/lg/xl/xxl`, now paired 1:1 with `typography.sizes`. Note `sm` still exists but its value changed (18 → 20).
2. **Additive — no migration needed**: mode-aware `state.{success,warning,error}` text colors, `primaryHover`/`primaryPressed`/`primarySubtle`, `text.disabled` + `background.disabled`, the `zIndex` scale, and the `opacity` scale.

### Who needs to migrate
- ⚠️ **Any project referencing line-height tokens by name** (`lineHeights.tight`, `.relaxed`, etc.) — update to the new keys. If you only use sizes/weights, no change.
- ✅ Everything else — bump the version; all other changes are additive.

### Action
- Search your codebase for `lineHeight`/`LineHeight` references to the old keys (`tight`, `normal`, `relaxed`) and map them: `tight→xs` (16), `normal→base` (24), `relaxed→lg` (28). Pick the key that matches the font size you're pairing it with.
- **SPM**: Xcode → File → Packages → Update to Latest Package Versions
- **npm**: `npm update @iamjarl/design-tokens`

### New capabilities worth adopting
- Replace any hand-rolled hover/pressed colors with `primaryHover`/`primaryPressed`.
- Replace colored validation text using raw `error`/`success` fills with the mode-aware `state.*` tokens (the old usage failed WCAG AA).
- Replace magic z-index numbers with the `zIndex` scale.

---

## v0.3.x → v0.4.0

### What changed
1. **Error color updated**: `#FF3B30` → `#D70015` for WCAG AA compliance with white text.
2. **`package.json` is now ESM** with proper `.js` + `.d.ts` artifacts. Runtime entry moved from `.ts` to `.js`.

### Who needs to migrate
- ✅ **SwiftUI projects** — just bump the SPM version. Visual change: error red is slightly darker.
- ⚠️ **React/Expo projects** — bump version. If you imported from the `.ts` source directly (rare), switch to the package's main export.
- ✅ **CSS-only projects** — bump version, no other changes.

### Action
- **SPM**: Xcode → File → Packages → Update to Latest Package Versions
- **npm**: `npm update @iamjarl/design-tokens` (or update the `from:` version in your manifest)
- Visually verify destructive UI in light + dark mode — red is slightly deeper.

If you previously imported via:
```ts
import { colors } from '@iamjarl/design-tokens/dist/ts/tokens.ts';  // ❌ deep import
```
switch to the package main export:
```ts
import { colors } from '@iamjarl/design-tokens';  // ✅ uses exports map
```

---

## v0.2.x → v0.3.0

**Status: Breaking change for web/CSS consumers only.** SwiftUI and TypeScript imports are unaffected.

### What changed
All CSS custom properties have been prefixed with `--ij-` to prevent collisions with third-party libraries (Tailwind, UI kits, etc.).

### Who needs to migrate
- ✅ **SwiftUI projects** — no changes needed
- ⚠️ **React web projects using CSS variables** — must update all `var(--*)` references
- ✅ **React/Expo projects using TS imports** — no changes needed (TS API is unchanged)

### CSS find & replace

In your project, find and replace these patterns:

| Old | New |
| --- | --- |
| `var(--color-` | `var(--ij-color-` |
| `var(--spacing-` | `var(--ij-spacing-` |
| `var(--radius-` | `var(--ij-radius-` |
| `var(--font-` | `var(--ij-font-` |
| `var(--line-height-` | `var(--ij-line-height-` |
| `var(--shadow-` | `var(--ij-shadow-` |
| `var(--duration-` | `var(--ij-duration-` |
| `var(--easing-` | `var(--ij-easing-` |
| `var(--breakpoint-` | `var(--ij-breakpoint-` |
| `var(--focus-` | `var(--ij-focus-` |

### One-liner (macOS/Linux)

From your project root:

```bash
# Preview changes (dry run)
grep -rn "var(--" src/ --include="*.css" --include="*.scss" --include="*.tsx" --include="*.ts"

# Apply changes (creates .bak files first)
find src -type f \( -name "*.css" -o -name "*.scss" -o -name "*.tsx" -o -name "*.ts" \) \
  -exec sed -i.bak -E 's/var\(--(color|spacing|radius|font|line-height|shadow|duration|easing|breakpoint|focus)-/var(--ij-\1-/g' {} +

# Verify, then delete backups
find src -name "*.bak" -delete
```

### Example diff

```diff
.button {
-  background: var(--color-primary);
-  color: var(--color-on-primary);
-  border-radius: var(--radius-md);
-  padding: var(--spacing-md) var(--spacing-xl);
-  box-shadow: var(--shadow-md);
-  transition: transform var(--duration-fast) var(--easing-standard);
+  background: var(--ij-color-primary);
+  color: var(--ij-color-on-primary);
+  border-radius: var(--ij-radius-md);
+  padding: var(--ij-spacing-md) var(--ij-spacing-xl);
+  box-shadow: var(--ij-shadow-md);
+  transition: transform var(--ij-duration-fast) var(--ij-easing-standard);
}
```

### After migrating

1. Run your project's build / dev server
2. Visually verify key screens in light + dark mode
3. Update your project's lockfile to v0.3.0

---

## Pre-v0.2.0

Earlier versions had no breaking changes. Patch and minor bumps were color/value tweaks only — safe to update by re-running `npm update` or Xcode's "Update Package Versions".
