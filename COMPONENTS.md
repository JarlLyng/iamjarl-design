# Components (proposed layer)

This repo ships design **tokens** today. This document proposes adding a **components** layer, and
records the reasoning so the decision is reviewable rather than implied by a commit.

Status: **proposal, nothing implemented yet.** Written 2026-08-12.

## Why

The IAMJARL marketing sites already share tokens, so colours, type and spacing match. What they do
not share is structure, so every site re-implements its own navigation, footer and call-to-action.
That is duplicated work and it drifts.

The intended split, decided at portfolio level:

| Layer | Shared? | Lives in |
|---|---|---|
| Tokens (colour, type, spacing) | yes, already | this repo |
| **Components (nav, footer, CTA)** | **yes, proposed** | **this repo** |
| Page patterns (hero, storytelling arc) | shared rules, not shared layout | the private strategy hub |
| Content, imagery, tone | per app | the app's own repo |

The sites should not look identical. They serve different audiences and that difference is
deliberate. They should be identical only where nothing but craft is at stake.

## Distribution: web components

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

```html
<script type="module" src="https://.../dist/components/index.js"></script>
<ij-nav></ij-nav>
```

Components must consume tokens, never restate them. `dist/css/tokens.shadow.css` already exists for
Shadow DOM scoping, which is what a custom element needs, so the plumbing is in place.

## Scope of the first release: navigation only

Navigation is deliberately a **low-value, low-risk** first component. It is not the thing that
converts, and that is the point: it is a test of the distribution mechanism. If a nav can be
updated here and consumed by seven static sites without breaking any of them, the mechanism holds
for the components that matter. If it cannot, we learned that on the cheapest possible piece.

Footer and CTA follow only after the nav has proven itself in production on more than one site.

## Decisions this repo needs to make first

**Package naming.** The npm package is `@iamjarl/design-tokens`. Once it ships components that name
no longer describes it. Either rename, or give components a separate entry point and keep the
tokens name accurate. Worth choosing deliberately rather than drifting into a misnamed package.

**Versioning.** Adding a layer is additive, so semver says `1.2.0`. But it changes what this repo
*is*, from a token source into a design system with components, and this repo already has the habit
of documenting breaks in `MIGRATION.md`. A `2.0.0` with a migration note may communicate the change
better than a minor bump. Either is defensible; pick one on purpose.

**Theming per site.** Sites vary by mode (light or dark) and accent. Components must read those from
tokens and from the host, never hardcode them, so the same nav can sit on Walkful's light ground and
WODrounds' dark one without a fork.

## Non-negotiables that already apply

Everything in `design.md` holds for components too. Light and dark mode, WCAG AA contrast, keyboard
focus never removed without a replacement, no hardcoded colour, spacing or radius. A component that
breaks one of those is a bug, not a variant.

## What deliberately does not live here

The *reasoning* behind page structure stays out of this repo: which hero converts, what the
storytelling arc should be, what the audience data says. That belongs in the private strategy hub,
along with anything competitive. This repo holds values and components, the things a consuming app
needs in order to build. Keeping that line clean is why this repo can stay public.
