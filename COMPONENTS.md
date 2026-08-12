# Components (proposed layer)

This repo ships design **tokens** today. This document proposes adding a **components** layer, and
records the reasoning so the decision is reviewable rather than implied by a commit.

Status: **proposal, nothing implemented yet.** Written 2026-08-12, revised 2026-08-13 after an audit
of the five in-scope marketing sites overturned one of its premises. The audit is in the PR
discussion; its findings are folded in below.

## Why

Every marketing site re-implements its own navigation, footer and call-to-action. That is duplicated
work and it drifts.

The intended split, decided at portfolio level:

| Layer | Shared? | Lives in |
|---|---|---|
| Tokens (colour, type, spacing) | yes, but **not yet actually adopted** | this repo |
| **Components (footer, nav, CTA)** | **yes, proposed** | **this repo** |
| Page patterns (hero, storytelling arc) | shared rules, not shared layout | the private strategy hub |
| Content, imagery, tone | per app | the app's own repo |

The sites should not look identical. They serve different audiences and that difference is
deliberate. They should be identical only where nothing but craft is at stake.

## The premise that had to be corrected

The first draft of this document claimed the sites already share tokens and differ only in
structure. **They do not share tokens.** Read against the five sites:

| Site | Token layer | `<nav>` element | Footer cross-links |
|---|---|---|---|
| WODrounds | **none**, hand-rolled CSS | yes | 7 |
| Echolume | **23 invented `--ij-*` names** | yes | 4 |
| Walkful | **none**, hand-rolled CSS | **none at all** | 6 |
| TonVault | vendored copy, **v1.0.0** | yes | inside a prose sentence |
| BotLens | vendored copy, **v0.5.0** | yes | **no cross-link section at all** |

Two sites carry vendored snapshots of `tokens.css`, two and three releases behind v1.2.1. Two use no
tokens at all. Echolume declares 23 variables **inside the `--ij-` namespace** using names this repo
does not define, so `--ij-color-bg` where the real token is `--ij-color-bg-app`, `--ij-space-md`
where it is `--ij-spacing-md`; only two of its 23 names collide with real ones. BotLens on v0.5.0
predates the entire v1.0 layer, so it has no `state.*` text colours, no `primaryHover` or
`primaryPressed`, no disabled tokens, no z-index scale, and still uses the pre-rename `lineHeights`
keys.

This matters directly for theming. A component reading `var(--ij-color-bg-card)` resolves to
**nothing** on three of the five sites.

## Step zero is not a component

Get all five sites onto **one pinned, current `tokens.css`** first, and clean up the counterfeit
namespace in the same pass. This is not a detour. It is a prerequisite for any component to theme
correctly, it is cheap, and it tests the exact distribution mechanism this proposal is least sure
about, a pinned CDN URL, on something with near-zero rendering risk. Once the five share one token
layer through one URL, a component rides a mechanism that has already proven itself.

## Distribution: web components, from a pinned tag

Components should ship as **custom elements**, not as framework components.

The reason is the actual shape of the consuming sites. Seven of the ten are plain static HTML with
no build step (Anvil Workout, WODrounds, TrimrPix, Echolume, It's 404 yo!, Walkful, BotLens), and
three are framework-based (PageLens and Made by Human on React, Wean Nicotine; plus the
iamjarl.com hub on Nuxt). A React component cannot be used in a static HTML page. A custom element
works in every one of them, with a single script tag and no tooling.

Proposed shape, alongside the existing token outputs:

```
dist/components/          # ESM, one file per component + an index
```

Serve it from a **pinned jsDelivr tag**, not GitHub Pages. Pages serves always-latest, so one bad
commit would hit every site at once. A tag URL is immutable, supports SRI, and needs no
infrastructure:

```html
<script type="module"
  src="https://cdn.jsdelivr.net/gh/jarllyng/iamjarl-design@v1.3.0/dist/components/index.js"></script>
<ij-footer></ij-footer>
```

## Theming: not with `tokens.shadow.css`

The first draft proposed reusing `dist/css/tokens.shadow.css`, since Shadow DOM scoping is what a
custom element needs. **That would break per-site theming.**

Custom properties inherit *through* the shadow boundary, so a component reading
`var(--ij-color-primary)` picks up the host's value for free, which is exactly what we want. But
`tokens.shadow.css` declares `:host { --ij-color-*: ... }`, and a declaration on `:host` beats an
inherited value. The component would override whatever mode the site had chosen and follow the OS
instead. Concretely: Walkful pins light mode with a class, and the component would render dark on a
light page, which is the fork this whole proposal exists to avoid.

`tokens.shadow.css` was built for the opposite need, a content script that wants isolation *from* a
hostile host page. Keep it for the Chrome extension case.

Because the hosts mostly do not define tokens yet, a component needs defaults a host can still
override. Two-tier variables do that:

```css
:host {
  /* the host wins if it has tokens, otherwise fall back to the system's own value */
  --_bg:   var(--ij-color-bg-card, rgba(0, 0, 0, 0.04));
  --_text: var(--ij-color-text-secondary, rgba(0, 0, 0, 0.70));
}
```

Plus `prefers-color-scheme` inside the shadow stylesheet, so mode still works on the three sites
with no token layer.

## Scope of the first release: the footer

Revised from "navigation first". Nav is the wrong pilot, for a sharper reason than "nav varies":
**each site's nav CTA points at a different store.** TonVault to the App Store, BotLens to the
Chrome Web Store, and Walkful has no nav element at all. The most important thing in a nav is
per-site by nature.

The footer is semantically identical on all five: tagline, own links, cross-links to the other
apps, copyright. It is also low-value and low-risk, which is the point of a pilot.

The footer has a live defect that a component fixes structurally: **not one of the five sites links
to the two newest apps**, and each lists a different arbitrary subset of the others. One of them
even links a side project that is not part of the portfolio at all.

That carries a design consequence. The footer's app list must come from **data in this repo**, not
from per-site markup, or the duplication has only moved house. Proposed: an `apps.json` with a flag
separating *gets the component* from *appears in the list*, since some sites link products that
belong in the list without being component consumers. One edit here, five footers update.

Nav follows once the footer has held in production on at least two sites.

## Decisions, now resolved

**Package naming: do not rename.** The audit settles it. Two sites vendored `tokens.css` by hand and
none of the five consume npm at all, so the package name barely reaches the actual consumers, while
a rename forces a coordinated edit across every Swift and framework consumer for no functional
gain. Add `./components` as a subpath export, the way `./css` and `./css/shadow` already work.
`design-tokens` stays an accurate name for what the main entry ships. Revisit if this repo genuinely
becomes components-first, when there is evidence.

**Versioning: minor, `1.3.0`** (1.2.0 and 1.2.1 are taken). Semver describes the contract, not the
ambition. A `2.0.0` sends every consumer to `MIGRATION.md` to read "nothing to do", which cries wolf
and devalues the signal for when a break is real, as the v1.0 `lineHeights` rename genuinely was.
This repo has just come out of a state where version numbers did not mean anything precise (#11),
and the whole fix was making them mean something exact. Inflating a version for narrative reasons is
the same mistake in a different coat. Communicate the change of identity through the README, the
changelog and a release note.

## Two costs to price before building

**Testing.** This repo's quality rests on hard-failing contrast checks, drift checks and contract
tests, all built on "no dependencies required, Node built-ins only". Components bring DOM, focus
handling and keyboard navigation, which none of that can reach. The choice is components tested to a
lower standard than the tokens, or breaking the zero-dependency promise with a real test runner.
Worth deciding on purpose now rather than discovering it half-built.

**Asymmetry.** Components are web-only and unusable from the SwiftUI apps, so this repo becomes
asymmetric by design: tokens for every platform, components for web. That is fine, but it has to be
written down, because a Swift consumer should not have to work it out.

## Non-negotiables that already apply

Everything in `design.md` holds for components too. Light and dark mode, WCAG AA contrast, keyboard
focus never removed without a replacement, no hardcoded colour, spacing or radius. A component that
breaks one of those is a bug, not a variant.

## Suggested order

1. One pinned, current `tokens.css` on all five sites; clean up the counterfeit namespace at the
   same time.
2. `apps.json`, the canonical app registry.
3. `<ij-footer>` reading `apps.json`, rolled out to one site first.
4. Nav, once the footer has held in production on at least two sites.

## What deliberately does not live here

The *reasoning* behind page structure stays out of this repo: which hero converts, what the
storytelling arc should be, what the audience data says. That belongs in the private strategy hub,
along with anything competitive. This repo holds values and components, the things a consuming app
needs in order to build. Keeping that line clean is why this repo can stay public.
