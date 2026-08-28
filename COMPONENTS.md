# Components (proposed layer)

This repo ships design **tokens** today. This document proposes adding a **components** layer, and
records the reasoning so the decision is reviewable rather than implied by a commit.

Status: **`<ij-footer>` shipped in 1.4.0**, with TonVault as the first and only consumer. The rest
of this document is the reasoning that led there, kept because the decisions are still live.
Written 2026-08-12, revised 2026-08-13 after an audit of five of the marketing sites overturned one
of its premises, and 2026-08-29 when the footer was built.

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

### Two scopes, two counts

The numbers below differ on purpose, and the two layers are not scoped the same way.

- **Tokens belong on every site — all nine.** There is no reason for a concept site to hold a
  different set of colours or spacing than an app site.
- **Components belong on the app marketing sites**, the ones that sell an app. The concept sites
  are deliberately excluded: their whole point is that they look like themselves.

Where this document says *five*, it is reporting the audit, which read five sites. That is a fact
about the evidence, not a statement of scope.

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

Two sites carry vendored snapshots of `tokens.css`, three and four releases behind v1.2.1. Two use
no tokens at all. Echolume declares 23 variables **inside the `--ij-` namespace** using names this
repo does not define, so `--ij-color-bg` where the real token is `--ij-color-bg-app`, `--ij-space-md`
where it is `--ij-spacing-md`. BotLens on v0.5.0 predates the entire v1.0 layer, so it has no
`state.*` text colours, no `primaryHover` or `primaryPressed`, no disabled tokens, no z-index scale,
and still uses the pre-rename `lineHeights` keys.

This matters directly for theming. A component reading `var(--ij-color-bg-card)` resolves to
**nothing** on three of the five sites.

### Echolume is not a rename job

Six of Echolume's 23 names are not invented at all — they are **real tokens, redefined with
different values**:

| Token | Echolume | Design system (light) |
|---|---|---|
| `--ij-color-primary` | `#d0ff00` | `#A435D2` |
| `--ij-color-text-tertiary` | `rgba(255, 255, 255, …)` | `rgba(0, 0, 0, 0.55)` |
| `--ij-radius-md` | `16px` | `12px` (the system's `lg`) |
| `--ij-duration-fast` | `0.2s` | `150ms` |
| `--ij-shadow-md` | `0 8px 24px` | `0 4px 8px` |
| `--ij-radius-sm` | `8px` | `8px` (the only match) |

Two consequences. First, both files declare on `:root` at equal specificity, so which one wins is
decided by **stylesheet load order** — a bug that can look correct locally and break on a deploy
that reorders them.

Second, and larger: those overrides are **dark-mode values used as fixed constants**. `#d0ff00` is
the system's dark primary, and the text colour is white-based. Echolume is a permanently dark site.
So adopting tokens there is not a rename in passing — it is a decision about whether the site
becomes mode-aware at all. Step one has to treat Echolume as that decision, not as cleanup.

## Step zero is not a component

Get **all nine sites** onto **one pinned, current `tokens.css`** first, and clean up the counterfeit
namespace in the same pass. This is not a detour. It is a prerequisite for any component to theme
correctly, it is cheap, and it tests the exact distribution mechanism this proposal is least sure
about, a pinned CDN URL, on something with near-zero rendering risk. Once they share one token
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

The footer has a live defect that a component fixes structurally. Counting inbound cross-links from
the five sites:

| Linked app | Inbound links |
|---|---|
| Made by Human | 5 |
| Anvil Workout, TrimrPix, Wean Nicotine, It's mono yo!, It's 404 yo! | 2 each |
| **Get to the Movie!** — not in the portfolio | **2** |
| Walkful, WODrounds | 1 each |
| **Echolume, TonVault, BotLens, PageLens** | **0** |

Four apps get nothing, including Echolume and a live PageLens site, while a project outside the
portfolio is linked from two sites. TonVault shows the mechanism: it names Echolume in a prose
sentence **with no href**, so both ends score zero. Hand-written cross-links don't just drift — they
quietly stop being links.

That carries a design consequence. The footer's app list must come from **data in this repo**, not
from per-site markup, or the duplication has only moved house.

### The content varies, and that is the point

A component shares **structure**, not content. Layout, spacing, type, mobile collapse, focus
handling and token-driven colour are identical everywhere; the app name, the links and the CTA are
per site. That split is the normal division of labour in a component, not a complication.

It is worth being precise about why this argues *for* a component rather than against one. If every
footer showed the same links, copy-paste would very nearly do. It is because the links vary **by
rule** that they should be computed rather than written out once per site.

The rule is relevance: cross-promotion works between apps whose audiences overlap. So a site
declares only who it is —

```html
<ij-footer app="wodrounds"></ij-footer>
```

— and the component resolves the rest from the registry: WODrounds gets the other training apps,
TonVault gets the other audio apps. Different content, one component, nothing to maintain per site.

### `apps.json`

```jsonc
{
  "clusters": {
    "training": "Training, movement and health",
    "audio":    "Audio and music production",
    "web":      "Browser and web-page tools"
  },
  "apps": [
    {
      "id": "wodrounds",
      "name": "WODrounds",
      "url": "https://wodrounds.iamjarl.com",
      "cluster": "training",
      "listed": true,     // may appear in other footers
      "consumes": true,   // renders <ij-footer> itself
      "pinned": false     // shown regardless of cluster
    }
  ]
}
```

Three flags, each earning its place against something real in the current footers:

- **`listed`** — appears in other sites' footers. Separate from `consumes`, because a site can
  belong in the list without rendering the component, and because anything not in the registry stops
  being linked by accident. Today a project that is not part of the portfolio is linked from two
  sites while four portfolio apps are linked from none.
- **`consumes`** — renders the component. Lets the rollout go one site at a time.
- **`pinned`** — shown in every footer regardless of cluster, for the portfolio-wide links that are
  a statement rather than a cross-sell.

Two edge cases the current data forces:

**Thin clusters.** The web-tools cluster has two members, so one of them would see a single sibling.
Rule: if a cluster yields fewer than three, top up from the rest of the registry, newest first. New
apps need the exposure most and are exactly what hand-written footers forget.

**Ordering.** Leave it to the registry, not to each site, or the footers drift again in a subtler
way. Cluster siblings first, then the top-up, then pinned links.

### Graceful degradation

A component loaded from a CDN is a dependency: if the script fails, the footer disappears. Custom
elements render their own children until they upgrade, so the fallback is free —

```html
<ij-footer app="wodrounds">
  <!-- shown if the script never loads -->
  <p>© 2026 WODrounds · <a href="/privacy.html">Privacy</a></p>
</ij-footer>
```

Worst case is a plainer footer, not a missing one. Every consuming site should ship this.

### Nav

Nav is as tokenisable as the footer: wordmark, links, CTA — three slots, and the CTA pointing at a
different store per site is an argument for a prop, not against the component. An earlier draft of
this document used that difference as a reason to defer nav, which overstated it.

The real reason to start with the footer is duller: it sits below the fold, so a mistake there is
cheap, and it is the one already asked for. Nav follows once the footer has held in production on at
least two sites.

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

## Testing: what CI covers, and what it does not

Decided when the footer was built rather than left to settle later, because the honest answer
constrains the design.

The repo's quality rests on hard-failing checks with **no dependencies**. A component brings DOM,
shadow roots, focus and keyboard behaviour, none of which that harness can reach. Rather than break
the zero-dependency promise for a single component, the decisions were moved out of the DOM:

**`components/select-links.js` is pure** — no DOM, no fetch, no globals. Every rule with a judgement
in it lives there (exclude self, group by category, top up a thin cluster, always-links last, filter
by status) and is covered by contract tests in the existing harness. The custom element is a
rendering shell over it.

`validate.js` gates `apps.json` the way it gates the tokens, and contract tests assert the built
artifact is self-contained, inlines the registry, defines the element once, and pulls in no
stylesheet.

**What this does not cover:** shadow-DOM rendering, slot behaviour, focus order, and the
pre-upgrade fallback. Those need a browser. Until one is worth adding, they are checked by hand
against `components/TESTING.md` before a release that touches the component. That checklist found a
real bug on its first run — attaching a shadow root before validating the `app` attribute hid the
fallback content precisely when an unknown id made it necessary.

This is a real gap, stated plainly rather than implied by silence. If the component layer grows past
one or two elements, a browser test runner earns its dependency and this section should be revisited.

## Non-negotiables that already apply

Everything in `design.md` holds for components too. Light and dark mode, WCAG AA contrast, keyboard
focus never removed without a replacement, no hardcoded colour, spacing or radius. A component that
breaks one of those is a bug, not a variant.

## Suggested order

1. One pinned, current `tokens.css` on all nine sites; clean up the counterfeit namespace at the
   same time.
2. `apps.json`, the canonical app registry.
3. `<ij-footer>` reading `apps.json`, rolled out to one site first.
4. Nav, once the footer has held in production on at least two sites.

## What deliberately does not live here

The *reasoning* behind page structure stays out of this repo: which hero converts, what the
storytelling arc should be, what the audience data says. That belongs in the private strategy hub,
along with anything competitive. This repo holds values and components, the things a consuming app
needs in order to build. Keeping that line clean is why this repo can stay public.
