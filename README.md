# iamjarl-design

[![Version](https://img.shields.io/github/v/tag/jarllyng/iamjarl-design?label=version&sort=semver)](https://github.com/jarllyng/iamjarl-design/releases)
[![License](https://img.shields.io/github/license/jarllyng/iamjarl-design)](LICENSE)
[![Build Tokens](https://github.com/jarllyng/iamjarl-design/actions/workflows/build-tokens.yml/badge.svg)](https://github.com/jarllyng/iamjarl-design/actions/workflows/build-tokens.yml)
[![SPM compatible](https://img.shields.io/badge/SPM-compatible-brightgreen.svg)](https://swift.org/package-manager/)

Shared design system for all IAMJARL products (apps + web).

This repository is the **single source of truth** for colors, typography, spacing, radius and icon usage across all IAMJARL projects.
It is designed to work equally well for **humans** (design overview) and **AI tools like Cursor** (deterministic tokens + rules).

[![Co-created with AI](https://madebyhuman.iamjarl.com/badges/co-created-white.svg)](https://madebyhuman.iamjarl.com)

> **⚠️ Upgrading?** Every 1.x release is a safe bump — no token or CSS variable has been renamed or removed since v1.0. The last breaking change was v1.0, which renamed the `typography.lineHeights` keys (`tight/normal/relaxed/…` → `xs/sm/base/lg/xl/xxl`). Earlier: v0.4 changed the error color and switched the npm package to ESM; v0.3 prefixed all CSS variables with `--ij-`. See **[MIGRATION.md](MIGRATION.md)** for step-by-step upgrade guides.

---

## What's inside
- `tokens.json` — machine-readable design tokens (colors incl. interaction/disabled/state-text, spacing, radius, typography, icons, shadows, motion, breakpoints, focus, z-index, opacity)
- `design.md` — rules, principles and non-negotiables (Cursor-friendly)
- `COMPONENTS.md` — the components layer: reasoning, scope and testing policy
- `apps.json` — canonical product registry, consumed by `<ij-footer>` for cross-links
- `index.html` — the docs page: every token in both modes, the families, the faces and live components, rendered from `tokens.json` and `apps.json`. A browser test fails if a token is missing from it
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

### SwiftUI (iOS / macOS / watchOS / tvOS) via Swift Package Manager

In Xcode: File > Add Package Dependencies, enter:

```
https://github.com/jarllyng/iamjarl-design.git
```

Or in your `Package.swift`:

```swift
dependencies: [
    .package(url: "https://github.com/jarllyng/iamjarl-design.git", from: "1.26.0")
]
```

Then use in code:

```swift
import IAMJARLDesignTokens

// Colours that resolve light or dark by themselves — nothing to pass
Text("Start")
  .foregroundStyle(DesignTokens.Palette.Text.primary)
  .background(DesignTokens.Palette.Background.app)

// Text that follows Dynamic Type, at the token's size by default
Text("Rounds").ijFont(.lg, weight: .semibold)

// A number that is the interface: tabular digits, capped growth
Text("12:30").ijNumeral(.lg)

// Spacing and radius
let padding = DesignTokens.Spacing.md
let corner = DesignTokens.Radius.lg
```

**Why `Palette` rather than `Common`:** `Common.primary(scheme)` needs the `ColorScheme` passed in,
so it only works inside a view that has read it, and every app ended up wrapping it. `Palette`
resolves by itself — in a widget, a `.tint()`, a `ShapeStyle` or a UIKit/AppKit view as well.
`Common` and `ColorToken` stay. For an app's own derived colours, `DesignTokens.adaptive(light:dark:)`
makes one that adapts the same way.

**Why `.ijFont` rather than `.font(.system(size: DesignTokens.Typography.Size.base))`:** the fixed
version stays 16 pt for someone who has asked their phone for larger text. `.ijFont` is exactly the
token at the default size and scales along the nearest Apple text style (`caption` for `xs` up to
`largeTitle` for `xxl`), with the token's line height. On macOS and tvOS, which have no Dynamic
Type, it is the token.

**Numerals** — `sm` 32, `md` 56, `lg` 80 — were derived from what ships: WODrounds' 80 pt timer
and 56 pt values, and the watch timers of WODrounds (34) and Anvil (30). `.ijNumeral` sets
tabular digits, so a timer does not shift sideways as its digits change, and caps Dynamic Type
at 1.5×, because an 80 pt timer that keeps growing leaves the screen. Pick the design for your
app: `.ijNumeral(.lg, design: .rounded)`.

On watchOS `Palette` is always the dark value — the watch has one appearance.

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
  src="https://cdn.jsdelivr.net/gh/jarllyng/iamjarl-design@v1.26.0/dist/components/ij-footer.js"></script>

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
| `links-label` | Heading above your own `slot="links"` links; defaults to the app's name. With no `slot="links"` there is no group and no heading. The cross-links heading, "More from IAMJARL", is fixed |

| Custom property | |
| --- | --- |
| `--ij-footer-links-justify` | How the link rows align: any `justify-content` value, default `flex-start`. Labels, tagline and fineprint already follow the page's `text-align`; the rows are flex and cannot, so a centred footer sets both: `ij-footer { text-align: center; --ij-footer-links-justify: center; }`. In `layout="columns"` the links stack and follow `text-align` on their own |

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
npm install github:jarllyng/iamjarl-design#v1.26.0
```

```js
import '@iamjarl/design-tokens/components';   // registers <ij-footer>
import '@iamjarl/design-tokens/css';          // the token layer
```

Pin the tag in the dependency, not just the range. PageLens does this and its lockfile resolves the
tag to an exact commit, which is a stronger guarantee than a tag URL — a tag can in principle be
moved, a commit cannot.

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
  href="https://cdn.jsdelivr.net/gh/jarllyng/iamjarl-design@v1.26.0/dist/css/tokens.css"
  integrity="sha384-PKlt/RFEr/PqV2mjuOAm2tovN6l9sR3RwM+JgU1GP9vJisydnvt6l3h//+ythhEH"
  crossorigin="anonymous">

<script type="module"
  src="https://cdn.jsdelivr.net/gh/jarllyng/iamjarl-design@v1.26.0/dist/components/ij-footer.js"
  integrity="sha384-PerBKUYbLWOcIY2bcVsIp53pRh4d0gpDmMrTPzU5c/dy/Uo/zIqK3A0MKM51tkKU"
  crossorigin="anonymous"></script>

<script type="module"
  src="https://cdn.jsdelivr.net/gh/jarllyng/iamjarl-design@v1.26.0/dist/components/ij-nav.js"
  integrity="sha384-WVM/rurI3KnRJKOiwseL9jwHJtTQ5lNwC9JfFlzXqKlUo6a2dkeV5hJvqRV+sLUQ"
  crossorigin="anonymous"></script>

<script type="module"
  src="https://cdn.jsdelivr.net/gh/jarllyng/iamjarl-design@v1.26.0/dist/components/ij-store-cta.js"
  integrity="sha384-3SiL3GvIokgWBt6RthMtHo3kc3yW9JQYK3z1OoSWmwaYAS44CrfuRK70EgE2DGIm"
  crossorigin="anonymous"></script>
```
<!-- SRI:END -->

Machine-readable equivalents live in [`dist/sri.json`](dist/sri.json), exported as
`@iamjarl/design-tokens/sri.json` if your build wants to inject them.

---

**Know the failure mode before you add it.** A mismatched hash fails closed: the browser blocks the
resource outright. For the component that means the pre-upgrade fallback footer. **For
`tokens.css` it means the page renders with no tokens at all**, which is a far louder failure than
a stale stylesheet would have been. Both are safe when the tag and hash move together &mdash; which
is why they are published together here &mdash; but bump them in the same commit, and never carry a
hash across a version change.

### Mixing versions

Nothing breaks when a page loads files from different releases. Every file loads only files from
its own tag, and the components fall back to their own value for any token the page lacks. What a
file that trails behind misses is content: the footer's cross-links and the store facts are as of
its tag. The simple rule is one version for everything, changed in one go, with the hashes from
that release's notes.

### Cross-links in your served HTML

The component builds the cross-links at runtime, so crawlers that do not execute JavaScript
(GPTBot, ClaudeBot, CCBot, PerplexityBot) never see them. If your site has a build step, inline the
pre-rendered fragment for your app and the component will slot it instead of regenerating:

```bash
curl -sO https://cdn.jsdelivr.net/gh/jarllyng/iamjarl-design@v1.26.0/dist/footers/botlens.html
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

## Web component: `<ij-nav>`

The shared site navigation. Where the footer is the same on every site, the nav carries each site's
name and its most important button, so **it shares behaviour, not content**: you supply the links,
it supplies the landmark, the sticky translucent bar, the phone layout and the keyboard handling.

```html
<script type="module"
  src="https://cdn.jsdelivr.net/gh/jarllyng/iamjarl-design@v1.26.0/dist/components/ij-nav.js"></script>

<ij-nav>
  <a slot="brand" href="/">Echolume</a>
  <a slot="links" href="/how-it-works.html">How it works</a>
  <a slot="links" href="/obs-guide.html">OBS Guide</a>
  <a slot="links" href="/twitch-guide.html">Twitch</a>
  <a slot="secondary" href="https://github.com/JarlLyng/echolume">GitHub</a>
  <a slot="cta" href="https://apps.apple.com/app/…"
     data-umami-event="store-click" data-umami-event-placement="nav">Download</a>
</ij-nav>
<main id="main">…</main>
```

Place it **directly in `<body>`**: it is `position: sticky`, and a sticky element only sticks within
its parent. For the pinned-with-`integrity` version, use the SRI block above.

| Slot | |
| --- | --- |
| `brand` | **Required.** Your wordmark, linking home. A dot in your site's accent sits beside it, unless the link carries its own mark (an `<svg>` or `<img>`) |
| `links` | Up to three. The one for this page gets `aria-current="page"`, unless you set it yourself |
| `secondary` | Optional, one. A quiet button — GitHub, a changelog |
| `cta` | One. Your store link, filled with your site's accent, with its on-accent text |

| Attribute | |
| --- | --- |
| `label` | The landmark's `aria-label`. Default `Main` |
| `skip-to` | The id the skip link jumps to. Default `main`. No element with that id, no skip link — and a console warning |
| `cta-after` | A selector for your hero's CTA. While it is on screen, the nav's CTA waits, so there is one call to action above the fold |

**What it does for you:**

- **Sticky, translucent at 0.75, blurred.** Solid where `backdrop-filter` is missing or the visitor
  prefers reduced transparency. 0.75 is above the floor at which `text.*` stays AA over anything that
  scrolls underneath (see design.md, *Text on a translucent surface*).
- **One row below 768px.** Brand and CTA stay, the links and secondary item fold behind a button
  with `aria-expanded`. Escape closes it and returns focus; so does a click outside.
- **Focus in visual order**, a skip link first, and a visible ring on everything.
- **Console warnings** for what the rules say does not belong: a fourth link, Privacy or Support in
  the nav, a second CTA, a CTA reporting `placement="hero"`. Nothing is hidden: every link still
  renders, and the site decides.

**Before the script loads**, `<ij-nav>` is a row of plain links — which is also what a crawler sees.
To make that state look like a bar and avoid a jump on upgrade:

```css
ij-nav:not(:defined) {
  display: flex; flex-wrap: wrap; align-items: center; gap: var(--ij-spacing-lg);
  padding: var(--ij-spacing-md) var(--ij-spacing-xxxl);
}
```

**A global link colour overrides the component.** Page CSS beats a component's `::slotted()` rules,
so a site-wide `a { color: var(--accent) }` paints every slotted nav link in the accent, which is
exactly what the bar cannot carry (design.md, *Text on a translucent surface*). Scope the rule to
links outside the components:

```css
a:where(:not([slot])) { color: var(--accent); }
```

Echolume found this when it adopted the nav (#57). The same holds for `<ij-footer>`.

Attributes and slots only, so it works unchanged in React, where `<ij-nav>` is just an element.

---

## Store button: `<ij-store-cta>`

The badge, the campaign link, the `store-click` event and the facts line, all from `apps.json`.
**Paste the fragment** into your page; it is plain HTML and needs no JavaScript:

```html
<!-- dist/store/<app>.<locale>.html, e.g. wodrounds.da.html -->
<div class="ij-store" data-ij-store="wodrounds" data-ij-store-locale="da">
  <a class="ij-store-badge" href="https://apps.apple.com/app/id6759229877?pt=128512007&amp;ct=site&amp;mt=8"
     data-umami-event="store-click" data-umami-event-store="app-store"
     data-umami-event-placement="hero" data-umami-event-locale="da">
    <picture>…black and white badge…</picture>
  </a>
  <p class="ij-store-facts">29,00 kr engangskøb · iOS 16 eller nyere</p>
</div>
```

**Pick the file for the spot and the site.** Each one is right as served, so a site that pastes the
right file needs no script:

| File | For |
| --- | --- |
| `dist/store/<app>.<locale>.html` | the hero; the badge follows the visitor's light or dark setting |
| `dist/store/<app>.<locale>.<placement>.html` | `midpage` or `footer`: a later repeat, so the click event says where it was |
| `dist/store/<app>.<locale>[.<placement>].<tone>.html` | `black` or `white` fixed, for a site that is always light or always dark. One `<img>`, no `<source>` |
| `dist/store/<app>.<locale>.nav.html` | `<ij-nav>`'s call to action: a text link, since there is one badge per layout. Its `slot="cta"` does nothing outside `<ij-nav>`, so a site's own nav can keep it |
| `dist/store/<app>.<locale>.offer.json` | the JSON-LD `Offer`, below |
| `dist/store/<app>.head.html` | Safari's Smart App Banner, for an iPhone app or a Mac app with an iPhone sibling |

So Echolume, always dark, uses `echolume.en.white.html` in the hero and `echolume.en.footer.white.html`
at the end of the page.

**A site with no build step pastes by hand, and refreshes by hand.** The comment on the first line
names the version it came from: when a release changes a price or an OS floor, paste the files
from that release again. The hub is adding a check that reports a site whose pasted copy no
longer matches (#63).

### Structured data: the `Offer`

`<app>.<locale>.offer.json` is the `offers` value of the page's `SoftwareApplication`, in the
currency of the storefront the page quotes, so the JSON-LD and the facts line agree:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "WODrounds",
  "operatingSystem": "iOS",
  "offers": { "@type": "Offer", "price": "29.00", "priceCurrency": "DKK", "url": "https://apps.apple.com/app/id6759229877" }
}
</script>
```

The Offer's `url` is the plain store page: the campaign counts visitors who click, and a search
engine reading the markup is not one.

### Layout

The fragment brings no styles. These defaults, from the pilots on Anvil and Patternaut, cover what
every site ended up writing:

```css
ij-store-cta { display: block; }          /* a custom element is inline by default */

.ij-store {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--ij-spacing-xs);
}
.ij-store .ij-store-facts {               /* doubled, to outrank a section's own `p` rule */
  margin: 0;
  font-size: var(--ij-font-size-sm);
  color: var(--ij-color-text-secondary);
}
.ij-store-badge img { height: 52px; width: auto; }   /* a hero size; never below 40 (Chrome: 58) */

.cta-row { display: flex; align-items: flex-start; gap: var(--ij-spacing-md); }  /* badge beside a plain button */
```

The fragment sets the badge at its minimum, 40 px for Apple and 58 px for the Chrome Web Store.
Set a larger hero size on the `img` with `height`, and leave `width` to follow.

### The element

**Wrap a fragment in `<ij-store-cta>`** to change the placement or tone of one you pasted once and
reuse. Left empty, the element renders the fragment itself from the registry, which suits a site
without a build step, but crawlers will not see that copy:

```html
<script type="module" src="https://cdn.jsdelivr.net/gh/jarllyng/iamjarl-design@v1.26.0/dist/components/ij-store-cta.js"></script>
<ij-store-cta app="wodrounds" placement="midpage" tone="white">…fragment…</ij-store-cta>
```

Its `integrity` hash is in the [SRI block](#pinning-with-subresource-integrity) above, and every
release's notes list the hashes for all its files.

| Attribute | |
| --- | --- |
| `app` | An `id` from `apps.json`, needed when the element renders the fragment itself |
| `placement` | `hero` (default), `midpage` or `footer`, written to the click event |
| `locale` | The page's language; the element otherwise reads `<html lang>` |
| `tone` | `black` or `white`. Leave it out and the badge follows the visitor's setting; set it on a site that is always dark |

The facts come from `apps.json`, and a weekly workflow checks them against the App Store, opening
one issue here if they differ.

---

## Marketing kit: `dist/kit/kit.css`

Sections an app site composes, in plain HTML with these classes (#65). Every colour comes from
`tokens.css` and your identity sheet, and every size from the marketing scale (`--ij-mkt-*`), so the
same markup is Walkful's sand and magenta or a cool grey-blue. Each section reads in full without
JavaScript. See the three live demos: [Walkful](https://jarllyng.github.io/iamjarl-design/kit/walkful.html),
[Wean](https://jarllyng.github.io/iamjarl-design/kit/wean.html) and, dark,
[WODrounds](https://jarllyng.github.io/iamjarl-design/kit/wodrounds.html).

```html
<link rel="stylesheet" href="…/dist/css/tokens.css" integrity="…" crossorigin="anonymous">
<link rel="stylesheet" href="…/dist/identity/<app>.css" integrity="…" crossorigin="anonymous">
<link rel="stylesheet" href="…/dist/fonts/<face>.css" integrity="…" crossorigin="anonymous">
<link rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/jarllyng/iamjarl-design@v1.26.0/dist/kit/kit.css"
  integrity="<from sri.json>" crossorigin="anonymous">

<body class="ij-page">
  <section class="ij-hero ij-hero--split">
    <div class="ij-container ij-hero__inner">
      <div class="ij-hero__text">
        <h1 class="ij-display">Every step counts.</h1>
        <p class="ij-lede">One line that carries the outcome.</p>
        <!-- the store fragment, e.g. dist/store/walkful.en.black.html -->
      </div>
      <div class="ij-hero__media">
        <div class="ij-phone"><div class="ij-phone__screen"><img src="today.png" alt="…" fetchpriority="high"></div></div>
      </div>
    </div>
  </section>
  <section class="ij-section">…</section>
</body>
```

| Section | Classes | Without JavaScript |
| --- | --- | --- |
| Hero, split or centred | `.ij-hero--split`, `.ij-hero--centred`, `.ij-hero__text`, `.ij-hero__media` | Complete |
| The phone, straight | `.ij-phone`, `.ij-phone__screen`, `.ij-phone__frame`, `.ij-phone--drawn` | Complete |
| Apple TV and Watch | `.ij-tv`, `.ij-tv__screen`, `.ij-watch`, `.ij-watch__screen` | Complete |
| Statements, one drawing each | `.ij-statements`, `.ij-statement`, `.ij-drawing` | Complete |
| Frameless pieces | `.ij-bento` with `.ij-card` (`--half`, `--wide`), or `.ij-rows` with `.ij-row` | Complete |
| The phone that stays | `.ij-tour`, `.ij-tour__screens`, `.ij-tour__steps` | The screens in a row, the texts below |
| Where it works | `.ij-traits`, `.ij-trait`, `.ij-trait--number`, `.ij-trait--wide`, `.ij-numeral` | Complete |
| Privacy and price | `.ij-assurances`, `.ij-assurance`, `.ij-assurance--label` | Complete |
| A note from the maker | `.ij-maker`, `.ij-maker__sign` | Complete |
| A dated source | `.ij-source`, `.ij-source__fact`, `.ij-source__meta` | Complete |
| A photo scene, for the mood | `.ij-scene`, `.ij-scene__photo` | Complete |
| Closing wordmark | `.ij-closing`, `.ij-wordmark` | Complete |

Type roles: `.ij-display`, `.ij-headline`, `.ij-title`, `.ij-lede`, `.ij-small`, `.ij-numeral`,
`.ij-wordmark`. Layout: `.ij-container`, `.ij-section`, `.ij-section--band` (a section on the card
colour), `.ij-measure`, `.ij-stack`. Six hooks: `--ij-phone-width`, `--ij-tv-width` and `--ij-watch-width`; `--ij-scene-height`, a photo band's height; `--ij-display-weight`, for a face
whose regular weight reads too light (the kit never synthesises bold, since a face like Young Serif has
only one); and `--ij-wordmark-em`, the closing wordmark's width in em. The wordmark grows to the scale's
size but never past its column, which a long name or a wide face would otherwise run over: set it to
about 5.2 for "WODrounds" in JetBrains Mono. The default, 4, suits a name of six or seven letters in a
proportional face.

**A site that is dark whatever the visitor's setting** gives its identity `"scheme": "dark"`, and the
sheet holds every colour in dark mode. Use the `.white` store fragments, and the kit does the rest: the
phone takes an edge from `--ij-color-border-default`, so it doesn't vanish into the ground, and a drawing's
ink follows `--ij-color-text-primary` to light. The [WODrounds example](https://jarllyng.github.io/iamjarl-design/kit/wodrounds.html)
runs the kit that way, tested for a visitor in light and in dark mode.

`.ij-numeral` sets tabular figures, so a running time doesn't shift as its digits change.

**The phone frame is drawn, never Apple's.** Apple's licence for its Design Resources forbids using
them as website content or redistributing them, so no bezel ships from here. `.ij-phone` is a generic
phone drawn in CSS until your drawn frame lands: put the SVG in `<img class="ij-phone__frame">` and
add `.ij-phone--drawn`. Apple's marketing rules also say a drawn device must not carry details unique
to its products, so the drawing has no island and no side buttons.

**An Apple TV or a Watch is framed the same way:** `.ij-tv` (a 16:9 screen on a short foot,
560 px by default) and `.ij-watch` (a 416:496 screen between two plain straps, 170 px), both black
with the border colour's edge and no crown or button. In a `.ij-traits` grid, give the TV's trait
`.ij-trait--wide` so it spans two columns on a wide screen:

```html
<div class="ij-trait ij-trait--wide">
  <div class="ij-tv" style="--ij-tv-width: 420px"><div class="ij-tv__screen"><img src="tv.jpg" alt="…" loading="lazy"></div></div>
  <h3 class="ij-title">Readable across the room</h3><p>…</p>
</div>
```

Or show the screen frameless, as a piece in a `.ij-card`.

**A photo scene sets a site's mood, never its content** (#81). `.ij-scene` lays a photo across the page:
on its own between two sections, with nothing on it, or behind a section's words, such as the closing
wordmark and the store button. The kit turns the photo black and white, so your accent stays the only
colour, and dims it toward your ground, fading into the ground at the foot. Words on a scene keep the
photo's room above them, sit on a scrim of the ground that follows them, and all take the primary text
colour, so they read at AA over any photo: the browser tests paint a white photo under a dark site and a
black one under a light site.

```html
<!-- a band of its own -->
<div class="ij-scene" aria-hidden="true">
  <img class="ij-scene__photo" src="gym-960.jpg" srcset="gym-960.jpg 960w, gym-1920.jpg 1920w" sizes="100vw"
    width="1920" height="1280" alt="" loading="lazy" decoding="async" style="object-position: 50% 35%">
</div>

<!-- behind the closing -->
<section class="ij-scene" aria-label="Download WODrounds">
  <img class="ij-scene__photo" src="…" alt="" loading="lazy" decoding="async">
  <div class="ij-container ij-closing">…the wordmark and the store fragment…</div>
</section>
```

Never in the hero, where the product is the picture; at most two on a page; loaded lazily; and nothing
moves. The photos are your site's, not this repo's. A photo of people is a cropped body shot with no face
and no brand, under a licence that allows commercial use. Set `object-position` to keep the subject in
frame.

**Two things move, from `dist/kit/kit.js`.** One small module of the system's own (3 KB, no
dependencies), loaded after the page; nothing waits for it:

```html
<script type="module"
  src="https://cdn.jsdelivr.net/gh/jarllyng/iamjarl-design@v1.26.0/dist/kit/kit.js"
  integrity="<from sri.json>" crossorigin="anonymous"></script>
```

- **A screen recording in the phone** plays while it is on screen and pauses when it is not. Give it
  no `autoplay`, so that without the module, and under reduce motion, it shows its poster:

  ```html
  <div class="ij-phone__screen">
    <video class="ij-loop" muted loop playsinline preload="none"
      poster="today-poster.jpg" width="1206" height="2622" aria-label="Walkful's Today screen">
      <source src="today.mp4" type="video/mp4">
    </video>
  </div>
  ```

  Encode it at the size it is shown, around 300 to 600 KB, and keep it to the hero: a poster loads
  with the page wherever the video is.
- **The phone that stays.** On a wide screen with motion allowed, `.ij-tour` becomes one phone that
  holds still while the feature texts scroll past, and its screen crossfades to the one whose text is
  in the middle. The texts are never dimmed. On a phone, under reduce motion, or without the module,
  the screens sit in a row.

Nothing else animates, and nothing animates in. There is no motion library: the crossfade is CSS
with the motion tokens, and the module only decides when.

**Drawings, and a data line in their hand** (#75). A site's drawings ship as SVG in
`dist/drawings/<app>/`, generated from their descriptions in `kit/drawings/`. Inline each one in the
page, since a CSS variable can't reach into an `<img>`: the magenta takes `--ij-color-accent` and the
ink `--ij-color-text-primary`, and `kit.css` keeps the strokes' width on screen at any size. For a
line drawn from data, such as Wean's taper staircase, run `kit/loose.js` at build time and give the
path `.ij-loose`, so it reads as one of the drawings and not as a chart:

```js
import { loosePath, stairsPoints } from '@iamjarl/design-tokens/kit/loose.js';
// values: the allowance week by week, from the app's own maths
const d = loosePath(stairsPoints(values, { x: 16, y: 14, width: 608, height: 176, max: values[0] }), { seed: 7 });
// <svg class="ij-staircase" viewBox="0 0 640 210" role="img" aria-labelledby="stairs-text">
//   <path class="ij-loose" d="${d}"/></svg>, and the values as text in the page
```

The same points and seed give the same path, so the page builds the same every time.

**No Made by Human badge and no AI-authorship wording on an app site.** The badge belongs in your
README. If your drawings were made with AI, say so in one plain line in the footer's fineprint,
`<span slot="fineprint">Illustrations drawn with AI, finished by hand.</span>`, and nowhere else
(design.md, *Marketing pages*).

**Load the first screen at once and everything else lazily.** The hero's image takes
`fetchpriority="high"`; every image below it `loading="lazy"`. The browser tests hold both demos to
it, and to every text reading at AA on whatever it sits on.

## Site identity: `dist/identity/<app>.css`

Your site's own ground, text, accent and display face, declared for your app in
[`apps.json`](apps.json) under `identity` (#65), and listed live on the
[docs page](https://jarllyng.github.io/iamjarl-design/#identities). It replaces the family accent of 1.12 to
1.21: every app's accent and face were copied over unchanged, so loading the new sheet changes
nothing on a site that did not ask for a new identity. If your app has no file in
[`dist/identity/`](dist/identity), it has no identity of its own and renders with the tokens.

```html
<!-- tokens.css first, from the SRI block above, then the identity sheet -->
<link rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/jarllyng/iamjarl-design@v1.26.0/dist/identity/<app>.css"
  integrity="<from sri.json, see below>"
  crossorigin="anonymous">
```

**The hash is in `sri.json`, at the same version as the tag.** Every sheet has an entry. This prints
yours:

```bash
curl -s https://cdn.jsdelivr.net/gh/jarllyng/iamjarl-design@v1.26.0/dist/sri.json | grep 'identity/<app>.css'
```

Each sheet carries the version in its header, so its hash changes every release. Move the tag and
the hash together, as with `tokens.css`.

**What the sheet sets.** Only what your identity declares, plus what follows from it:

| Variable | For |
| --- | --- |
| `--ij-color-bg-app`, `--ij-color-bg-card`, `--ij-color-text-primary` | Your ground, your cards and your text, if your identity has its own. The tokens' names, so everything built on them, `<ij-nav>` and `<ij-footer>` included, follows |
| `--ij-color-text-secondary`, `--ij-color-text-tertiary` | Mixed from your text toward your ground, so they keep its warmth or coolness. Both clear AA |
| `--ij-color-accent` | Strokes, fills, the one line in a drawing. It may be too light to read as text: Walkful's magenta is 2.7:1 on its sand |
| `--ij-color-on-accent` | Text on an accent fill: black or white, whichever reads, at AA at least |
| `--ij-color-accent-text` | Links, small highlights, focus rings: at least 4.5:1 on your ground and your cards |
| `--ij-color-accent-family` | The 1.12 to 1.21 name, now the same as `--ij-color-accent-text`. A site that uses it keeps working |
| `--ij-font-display` | Your display face's stack |
| `--ij-font-display-axes` | The face's variation settings, if it has any: Fraunces is soft only at `'SOFT' 100`. Put `font-variation-settings: var(--ij-font-display-axes, normal)` beside your `font-family`; the kit and `<ij-nav>` already do |

Translucent: `color-mix(in srgb, var(--ij-color-accent) 15%, transparent)`, or the
`--ij-color-accent-rgb` triplet the sheet also sets.

**A site with one mode is held in it.** If your identity says `"scheme": "light"` (Walkful) or
`"dark"`, the sheet sets `color-scheme` and holds every colour in that mode, whatever the visitor's
setting. Nothing to add to the page. A site that follows the visitor gets both modes, switched under
`prefers-color-scheme` as in `tokens.css`. A site without a `scheme` that is nevertheless always dark
needs `class="dark"` on `<html>`, or a visitor in light mode gets the light accent on a dark page.
Echolume does exactly this today; giving it `"scheme": "dark"` would make the class unnecessary.

**The display face comes from here too.** The sheet sets `--ij-font-display` to the face's stack; load the face itself from the same tag:

```html
<link rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/jarllyng/iamjarl-design@v1.26.0/dist/fonts/<face>.css"
  integrity="<from sri.json>" crossorigin="anonymous">
```

`<face>` is the one your identity names (the docs page lists them): `jetbrains-mono`, `outfit`, `instrument-sans` or `fraunces`. With a build step, `import '@iamjarl/design-tokens/fonts/outfit.css'` serves it from your own origin instead. Then put it where your voice belongs: `h1, h2, h3 { font-family: var(--ij-font-display); }`. Never from Google Fonts; design.md says why.

**Not listed in `sri.json`: the footer fragments.** You copy them into your own HTML at build time,
and the browser never fetches them as a resource, so an `integrity` attribute has nothing to check.

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
Mode-aware colours resolve by themselves through `DesignTokens.Palette` — `.primary`, `.Text.disabled`, `.State.error`. The older `DesignTokens.Common.primary(scheme)` form, which takes the `ColorScheme`, still works. Text: `.ijFont(.base)` and `.ijNumeral(.lg)`. Non-color scales are static: `DesignTokens.Spacing.md`, `.Radius.lg`, `.ZIndex.modal`, `.Opacity.disabled`. See [AGENTS.md](AGENTS.md) for the full accessor list.

---

## Upgrading

When updating to a new version, check **[MIGRATION.md](MIGRATION.md)** for breaking changes and step-by-step instructions.

| From → To | Breaking? | Affects |
| --- | --- | --- |
| 1.2.x → any later 1.x | No | All additive — no CSS variable renamed or removed. One caveat: don't adopt `--ij-color-primary-rgb`, deprecated in 1.6.0 in favour of `color-mix()`. MIGRATION.md has a row for every release |
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
- Icons: Phosphor on the web, SF Symbols in native apps, never both in one app (design.md).
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
- [ ] `node scripts/test-browser.js` covers the docs page; `node scripts/test-browser.js --serve` serves it for looking at (it fetches `tokens.json`, so it needs http, not `file://`)

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

This repo is hosted on GitHub Pages, from `main`:

```
https://jarllyng.github.io/iamjarl-design/
```

The page renders `tokens.json` and `apps.json` at the commit it is served from, so it is never behind a release. It also cannot quietly stop covering one: a browser test walks every token in `tokens.json` and fails if the page does not show it, and checks that every CSS variable and Swift name it prints exists. The previous page stopped at v1.0.0's tokens for seventeen releases, while still showing the current version number.
