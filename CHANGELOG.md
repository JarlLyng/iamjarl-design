# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.12.1] — 2026-09-23

The drift 1.7.0 and 1.7.1 fixed had come back, for the same reason as last time. This release fixes it and removes the reason. Documentation and tooling only; no token, component or footer output changes. Closes #39.

### Fixed
- **The README installed old versions.** Four pins had fallen three to five releases behind while the SRI block beside them was current, so the file disagreed with itself: Swift `from: "1.8.1"`, the footer `@v1.8.1`, npm `#v1.8.0`, and the fragment `curl` at `@v1.8.1`. The issue found three; the fourth was in the crawler section.
- **`MIGRATION.md` stopped at v1.7.0** — eight releases behind, having been five behind when 1.7.1 filled it. It now has a section from v1.7.0 on, with a row for every release, including the ones where the answer is "No".
- **Three range claims in the README named an end version** ("v1.1 through v1.8", "1.2.x → 1.8.1", PageLens "behind `v1.8.0`" — it is on v1.9.0). A range with an end goes stale at the next release; they are now stated open-ended.

### Changed
- **`build.js` writes the README's install pins** from `package.json`, the way it already writes the SRI block. The three install forms — jsDelivr, npm from GitHub, Swift Package Manager — are rewritten; prose that mentions a version, such as "deprecated since 1.6.0", is history and left alone.
- **`validate.js` fails a release without a `MIGRATION.md` row**, beside the four places it already checks the version. The row is the one thing that cannot be generated, because what a consumer has to do is a judgement.
- **A contract test fails when any install pin in the README is not the current version.** The README sits outside the `dist/` drift check, so this is what catches a release built without `npm run build`.
- **PR CI now runs when `MIGRATION.md` or `README.md` changes.** Both are read by checks — the migration row by `validate.js`, the pins and SRI block by the contract tests — but neither was in the workflow's path filter, so a PR touching only one of them never ran the check that reads it.

### Why this shape
Generate what can be derived, check what cannot, and stop writing down what does not need a version. The README pins no longer take a hand edit at all. The migration row still does — and forgetting it now fails CI with the line to add, the way a missing CHANGELOG entry already did.

## [1.12.0] — 2026-09-20

Four families declare an accent, so the identity layer stops being inert. No token changed; the sites that inherit nothing still render exactly as before.

### Added
- **Family accents on four categories** in `apps.json`, emitted as `--ij-color-accent-family` in `dist/identity/<app>.css`:

| Family | Light | Dark | Lowest contrast | Sites |
|---|---|---|---|---|
| `fitness` | `#587114` | `#D0FF00` | 5.55:1 | 4 |
| `music` | `#177082` | `#23ACC7` | 5.71:1 | 5 |
| `web-tools` | `#217370` | `#35B6B2` | 5.60:1 | 2 |
| `images` | `#B4401D` | `#DD5931` | 5.55:1 | 2 |

- **13 generated identity sheets**, one per shipped app in a declared family. `play` and the two uncategorised sites declare nothing and still resolve to the primary, which is the half of the contract that keeps opting in optional.
- **The declared families are now documented in `design.md`**, with the reasoning for the two that involved a real trade-off.

### How the values were picked
- **Every pair clears the same bar `primary` does** — at least 4.5:1 on its own `background.app`, and able to carry black or white at 4.5:1. `validate.js` already enforced this; nothing here relaxes it.
- **A first pass landing at 4.50–4.67 was discarded.** Those values are valid and fragile: the validator hard-fails at 4.5, so a value sitting on the line breaks on the next nudge. The set was regenerated against a 5.5 target, and the lowest now sits at 5.55:1.
- **`fitness` is anchored on `#D0FF00`** because WODrounds and Walkful already ship it, so only the light half was an open question. The cost is visible: lime at a light-mode lightness is olive, and the pair reads as two related colours rather than one.

### Changed
- **`design.md` said the sheets ship at `dist/accents/<app>.css`.** They have shipped at `dist/identity/` since 1.11.0 — the rename missed this line. It had no consumer to mislead while the layer was inert, which is exactly why it survived.
- **`<ij-footer>` inlined the entire registry**, so declaring an accent wrote colour data into a component that cannot use one, and served it to every visitor. The bundle now carries a projection of the seven fields the footer actually reads (`id, name, url, category, status, listed, always`); `categories`, `platform`, `consumes` and the `$comment` no longer ship. The file drops from 16.5 KB to 14.2 KB, and all 15 sites' rendered links are byte-identical before and after. This does not affect SRI: a pinned URL such as `@v1.11.1` is immutable, so its hash never changes, and the footer's hash changes with every release anyway because the version is in its header.
- **Two contract tests asserted the layer was inert** — that every shipped app resolves to the primary, and that `dist/identity/` is empty. Both were correct until this release and would now fail. They are replaced by the invariants that outlive the first opt-in: a declared category reaches every app in it, an undeclared one still resolves to the primary, and a sheet exists for exactly the apps that differ.

### Note
No site consumes an identity sheet yet. This release makes the accents exist and be correct; adopting one is a per-site decision and a single `<link>`.

## [1.11.1] — 2026-09-19

The first entry in `patterns/`. Documentation only. Closes #31.

### Added
- **[`patterns/photographic-hero.md`](patterns/photographic-hero.md)** — a photograph behind the hero, darkened until the text wins. Two sites had solved it independently and eleven had not tried it.

### What it settles
- **The overlay**, derived rather than invented. WODrounds and Anvil reached almost the same answer without talking to each other: horizontal, near-opaque where the text sits, thinning toward the image. Both are quoted, with a tokenised version.
- **An opacity floor that removes the check entirely.** Text over a photograph has no fixed background, so the usual contrast test does not apply. Compositing the overlay over the *lightest possible* image gives a threshold instead: **α ≥ 0.60 guarantees AA for white text no matter what the photograph does.** Both production sites sit at 0.95–0.97 where their text falls, which is why neither has a problem despite never having computed it. A contract test re-derives the number from `color.js`, so the documented floor cannot drift from the math.
- **A weight budget measured against production.** WODrounds ships **2521 KB** for its hero — the original at 3936px, more than twice any viewport it meets. The same image is 280 KB at 1600px and 164 KB at 1200px. Budget: **250 KB at the largest breakpoint**, and nearly all of the 9× saving comes from serving a sensible width rather than from the codec.
- **The stacking bug**, which bit this pattern during a prototype: a positioned pseudo-element paints *after* its positioned siblings at the same z-index, so the overlay covers the text and the hero goes flat. One line fixes it and it is easy to lose.

### Note
`alt=""` on the hero image is documented as correct rather than lazy. The first rule of the pattern is that the photograph is mood and never subject; an empty `alt` is that rule enforced in the markup.

## [1.11.0] — 2026-09-19

An approved display set, so a site's voice is a choice from a list rather than a search. Closes #30. Ships inert, like the family accent.

### Added
- **`brand.typography.display`** in `tokens.json` — three approved faces with their stack, licence and intended use:

| Slot | Face | Licence |
|---|---|---|
| `mono` | JetBrains Mono | OFL-1.1 |
| `geometric` | Outfit | OFL-1.1 |
| `humanist` | Instrument Sans | OFL-1.1 |

- **`display` on a category in `apps.json`**, overridable per app, emitted as `--ij-font-display`.
- **`displayFor()`** in `components/identity.js`, beside `accentFor()`.

### How the three were picked
Two were derived from production rather than chosen: **JetBrains Mono** is the only mono in use (WODrounds), and **Outfit** runs on two sites where DM Sans runs on one. **The humanist slot has no production evidence and is the most revisable of the three** — it exists because health and calm products should not read as instruments, and nothing in the portfolio had answered that yet.

Worth recording: `Inter` is on three sites as the fallback nobody chose. Part of what this set is for.

### Self-hosting, not Google Fonts
`design.md` says to self-host, with the `@font-face` recipe and subsetting note. `fonts.googleapis.com` is a third-party request carrying the visitor's IP on every page view, and this portfolio tells people it has no third parties on the very pages making the claim. All three faces are OFL-1.1, so redistribution is a licensing non-issue.

The font files are **not** shipped here. Three binaries change what this package is and how it is updated; that deserves its own decision rather than arriving inside a typography change.

### Changed
- **`dist/accents/` is now `dist/identity/`**, and the export is `./identity/*`. One file now carries both the family accent and the display face, because they are one decision about how a site presents itself. The old path shipped in 1.10.0 with zero files in it and no consumer, so this costs nothing.
- `components/accent.js` is now `components/identity.js`.

### Still inert
No family declares a face, so no identity sheet is generated and nothing renders differently. A contract test asserts that. An unknown face name hard-fails rather than emitting a `--ij-font-display` pointing at something nobody approved or licensed.

## [1.10.0] — 2026-09-19

The identity layer, shipped inert. Closes #29. No site renders differently until a category opts in.

### Added
- **`accent` on a category in `apps.json`**, `{ light, dark }`, optionally overridden per app. Resolution is app → category → mode primary, so absent means nothing changes.
- **`components/accent.js`** — `accentFor(registry, appId, tokens)`, pure and exported, feeding the generated CSS, the validator and anything the component does with it later.
- **`dist/accents/<app>.css`** — `--ij-color-accent-family` and its `-rgb` twin, per mode, exported as `@iamjarl/design-tokens/accents/*`.

### Why
The system defines one primary per mode, so thirteen of fifteen live sites are black with the same lime pill. That is not drift — they inherited exactly what they were given, and there was no layer where a site was allowed to differ. `primary` stays the brand thread; the family accent is what one site may lean on.

### The check that makes it trustworthy
**Both modes are required, and each is held to the bar `primary` already clears:** at least 4.5:1 against its own `background.app`, and able to carry black or white at 4.5:1. An accent that works on one ground only is a second primary, and `validate.js` hard-fails it — lime as a light accent gives 1.17:1 on white and is refused.

### Why it ships empty
No accents are declared. `accentFor` resolves every app to the shared primary, no accent sheet is generated, and a contract test asserts that nothing is emitted while nothing differs. Adding a family is then one registry edit that the validator gates, rather than a release.

### Decisions this settles, and one it does not
`apps.json` categories are the grain, with a per-app override as the escape hatch — rather than a second taxonomy that would have to be kept consistent with the first, which is the failure mode this repo keeps closing. If identity and cross-link relevance ever genuinely diverge, that is the signal to split them; not before.

**Which colours the first families get is still open.** That is a brand decision, and the machinery is deliberately separate from it.

### Note
`categories` in `apps.json` changed from `"id": "label"` to `"id": { "label": ... }` so it can carry an accent. Only `Object.keys` was ever read, so nothing downstream breaks.

## [1.9.2] — 2026-09-19

No token values changed. Closes an accessibility gap in the gradients shipped in 1.6.0.

### Fixed
- **Three of the four gradients cannot carry any text colour at AA, and the system said nothing about it.** Raised by JarlLyng/TrimrPix#58 during their token migration. Checking all four:

| Gradient | Safe foreground |
|---|---|
| `light.gradient.primary` | **none** |
| `light.gradient.brand` | **none** |
| `dark.gradient.brand` | **none** |
| `dark.gradient.primary` | black |

  `#A435D2` gives black 4.02:1; `#D0FF00` gives white 1.17:1. Whichever foreground is chosen, one end of the ramp fails, and reversing the gradient per mode only moves which end.

  This is the mistake `design.md` rule 6 already forbids for flat colours and `validate.js` already hard-fails for every `on*` pair. Gradients got a rule about their first stop and no contrast rule at all, so the system shipped a token that invites exactly the error it refuses to make.

### Changed
- **Every gradient now carries its verdict in the CSS**, so the answer is visible where the value is used rather than found in an audit:
  ```css
  --ij-gradient-brand: linear-gradient(135deg, #D0FF00, #A435D2); /* decorative only — no text colour clears AA */
  ```
- `validate.js` computes and reports text-safety per gradient. **Deliberately not a failure** — a decorative ramp is allowed to span extremes. What was wrong was shipping that silently.
- `design.md` gains the rule and three ordered alternatives for a brand surface that needs text, the first being to put the text on a solid `primary` panel and let the gradient be an accent around it. It also warns against `onPrimary`, which looks like the fix and moves the failure to the lime end, from a near miss to unreadable.

### Note
The gradient values are unchanged. They were derived from what two sites already shipped, and narrowing them would change the look of both to fix a use those sites should not have been making. The rule is the fix; the ramps are fine as decoration.

## [1.9.1] — 2026-09-19

Patternaut joins the registry. No token or API changes.

### Added
- **Patternaut** in `apps.json`, in the music category. It ships to the Mac App Store shortly and its site consumes `<ij-footer>`, which needs the app to exist here for its cross-links to resolve.

### Why
A site adopting the shared footer for an app the registry does not know renders a footer without that app's own identity. Registering it is the one step that has to happen here rather than in the app's repo.

## [1.9.0] — 2026-09-12

The cross-link top-up rule was leaving two apps almost unreachable. Footer contents change; no token or API changes.

### Changed
- **Top-up now picks the least-connected app, not the newest.** When a category has fewer than three members, the footer tops up from the rest of the registry. That top-up used to prefer the most recently added app; it now prefers the app whose own category reaches the fewest footers.

### Why
Measured across the live sites: the newest app was chosen for every top-up and appeared in **nine** footers, while BotLens and PageLens — the only two members of their category — sat at **one inbound link each**. The rule was concentrating links on whatever shipped last.

"Newest first" was a proxy for *new apps need exposure most*. Category reach is the accurate version of that intent, and it does not decay: an app stops being new, but a two-member category keeps under-reaching forever.

| | Before | After |
|---|---|---|
| BotLens, PageLens | 1 | 5 |
| TrimrPix | 1 | 3 |
| TonVault | 9 | 3 |
| Walkful | 7 | 3 |
| Spread (std. dev.) | 2.33 | **0.87** |

Nothing now sits below three.

### Also
- **Selection no longer depends on the order of `apps.json`.** Ranking is computed from registry content, and each group is sorted by id. Re-sorting or reformatting the registry cannot rewrite a committed fragment — previously it rewrote all fourteen. A contract test shuffles the registry 25 times and asserts the result is unchanged.
- Ranking deliberately uses category reach rather than actual inbound links. Counting real inbound would make the rule depend on its own output, so two runs could disagree and the fragments would stop being reproducible.

### For sites already running the component
Re-pull your fragment from `dist/footers/<app>.html`. Two of the four adopters get one link swapped; the other two only see the list reordered. Nothing breaks if you do not — the old fragment is still valid markup.

## [1.8.1] — 2026-09-12

Documentation only.

### Fixed
- **The README described only the CDN path**, which implicitly recommended it to everyone. A site with a build step is better served installing the package: the version lands in `package.json` where dependency tooling can see it, the lockfile pins the exact commit rather than a movable tag, there is no runtime dependency on a third-party CDN, and `integrity` becomes unnecessary because nothing crosses an origin. PageLens had already worked this out independently; the guidance now says so.
- The SRI section now states that it applies to the CDN path only.
- Four version references in the README had gone stale again (`from: "1.7.0"`, two `@v1.7.0` URLs, and "through v1.7"). They are hand-written and drift every release; the SRI block is generated and did not. Worth generating the rest of them if this recurs.

## [1.8.0] — 2026-09-12

Subresource integrity for the three files sites load from the CDN.

### Added
- **`dist/sri.json`** — sha384 hashes for `tokens.css`, `tokens.shadow.css` and `ij-footer.js`, generated at build time and exported as `@iamjarl/design-tokens/sri.json`.
- **Paste-ready tags in the README**, written into a marked block by `build.js` so the pinned version and its hash can never disagree. Contract tests assert the block is current, since `README.md` sits outside the `dist/` drift check.

### Why
A pinned tag says *which* file you want; a hash proves you got it. JarlLyng/BotLens#32 told adopters to copy an `integrity` value from this README — one that had never existed. Rather than delete the instruction, the hashes now exist.

Verified before building it: jsDelivr serves `/gh/` paths byte-for-byte, so a hash computed here is valid for the CDN URL. All three v1.7.1 files hash identically locally and over the wire.

### The failure mode, stated
A mismatched hash **fails closed** — the browser blocks the resource outright. For the component that is the pre-upgrade fallback footer. **For `tokens.css` it is a page with no tokens at all**, which is far louder than a stale stylesheet. Safe when the tag and hash move together, which is why they are published together and why the README block is generated rather than hand-kept — but bump them in one commit, and never carry a hash across a version change.

## [1.7.1] — 2026-09-12

Documentation only. No token, component or generated-output changes.

### Fixed
- **`MIGRATION.md` stopped at v1.2.0.** Five releases shipped without upgrade notes, so a consuming repo had to diff the emitted CSS itself to establish that a v1.2.1 → v1.6.0 bump was safe (raised in JarlLyng/BotLens#32). There is now a `v1.2.x → v1.7.0` entry recording what every release in the range added, the one thing not to adopt (`--ij-color-primary-rgb`, deprecated in 1.6.0), and the variable-name diff a consumer can run to verify a future bump without waiting for a guide.
- Verified while writing it: **no CSS custom property was renamed or removed between v1.2.1 and v1.7.0.** Six releases, entirely additive.
- README's upgrade table and banner also stopped at v1.2; both now cover the range.

## [1.7.0] — 2026-09-12

Closes #22. The footer's cross-links can now exist in a site's served HTML instead of only after JavaScript runs.

### Added
- **`cross-links` slot on `<ij-footer>`.** If the page supplies cross-links, the component slots them; if not, it generates them as before. One rule, both paths, and a site with no build step is unaffected.
- **`dist/footers/<app>.html`** — a pre-rendered fragment per shipped app, generated by `build.js` from the same `selectLinks()` and `apps.json` the component uses, and exported as `@iamjarl/design-tokens/footers/*`. A site inlines the fragment at build time and the links are in the HTML a crawler is served.

### Why
Googlebot renders JavaScript. **GPTBot, ClaudeBot, CCBot and PerplexityBot do not**, so on every site that adopted the component the cross-links were invisible to them. That matters unevenly and worst where it is most awkward: BotLens and PageLens are tools *about* AI-crawler visibility, and BotLens declined to adopt the component for exactly this reason.

Moving the generated links from shadow DOM to light DOM would not have helped — both are JavaScript. Only markup present in the served response reaches a crawler that does not execute it.

### The trade, stated
A fragment is a **snapshot**. A site that does not rebuild keeps the links it last built with, where the component would have been current on next load. For cross-promotion that changes a few times a year this is the right side of the trade, but it is a trade. Each fragment carries the design-system version and the registry's `updated` date as comments so a stale one is visible to a human reading the HTML.

Sites with no build step at all keep the JS-only behaviour. The fragment is there when they gain one.

### Internal
- Contract tests assert a fragment exists for every shipped app, that its links match `selectLinks()` exactly, that every anchor carries the slot attribute, and that no fragment links a site to itself. Verified by editing a fragment and watching the check fail.

## [1.6.1] — 2026-09-12

No token changes. Corrects the registry so it matches production.

### Fixed
- **`apps.json` recorded only one component consumer while two sites were running it.** Walkful adopted `<ij-footer>` and shipped it on v1.6.0, but its `consumes` flag stayed `false` for two weeks. The flag exists to make a rollout traceable, so a stale one makes the registry untrue about its own reach — the exact drift this repo keeps closing, in the one file added to stop it.

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

[1.12.1]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.12.1
[1.12.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.12.0
[1.11.1]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.11.1
[1.11.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.11.0
[1.10.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.10.0
[1.9.2]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.9.2
[1.9.1]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.9.1
[1.9.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.9.0
[1.8.1]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.8.1
[1.8.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.8.0
[1.7.1]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.7.1
[1.7.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.7.0
[1.6.1]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.6.1
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
