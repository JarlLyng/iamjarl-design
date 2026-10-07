# IAMJARL Design System (v1.18.0)

This document defines a shared visual DNA across all IAMJARL apps and web projects.
Use together with `tokens.json` (single source of truth).

## Goals
- Different products, same family feeling
- Low maintenance: update tokens once, apply in each project
- Works in both light and dark mode

## The DNA
### Color
- Primary is a bold neon accent:
  - Light: #A435D2 (hover #8E2BB8, pressed #7A2499)
  - Dark:  #D0FF00 (hover #B8E000, pressed #A0C400)
  - `primarySubtle` is a low-alpha tint for selected/active backgrounds.
- UI uses subtle translucent backgrounds (muted/card) instead of heavy borders.
- States are consistent across all products:
  - Success: #4CAF50
  - Error:   #D70015
  - Warning: #FF6B35

#### State colors: fills vs. text
- The shared `success` / `warning` / `error` colors are **fills** — only use them as backgrounds, always paired with their `on*` color (`onSuccess`, etc.).
- For colored **text/icons on a normal background** (e.g. inline error messages, success labels), use the mode-aware `state.success` / `state.warning` / `state.error` tokens. These are tuned per mode to meet WCAG AA against `background.app`.
- Never use a raw fill color as text — `success` (#4CAF50) on white is only 2.78:1 and fails AA.

#### Interaction & disabled states
- Hover/pressed: use `primaryHover` / `primaryPressed` (mode-aware) instead of darkening primary by hand.
- Disabled elements: use `text.disabled` and `background.disabled`, or apply `opacity.disabled` (0.4) to the whole control. Never invent your own disabled greys.

#### Semantic usage
- `primary` is an accent color and must always be paired with a semantic on-color.
- Never guess text color on top of colored backgrounds.
- Use the following rules:
  - `primary` → use `onPrimary` for text and icons
  - `success` → use `onSuccess`
  - `warning` → use `onWarning`
  - `error` → use `onError`

### Patterns
Longer-form recipes that need more than a rule live in [`patterns/`](patterns/):

- **[The photographic hero ground](patterns/photographic-hero.md)** — a photograph behind the hero, darkened until the text wins. Carries the overlay two sites derived independently, the opacity floor that makes text safe regardless of the image (**α ≥ 0.60**), and a weight budget measured against what is shipping today.

### Display type (web only)
The tokens ship `system-ui` and `ui-monospace` and nothing else, so every site that wanted a voice went looking on its own. Four found four different answers; the rest fell back to Inter or the system stack. That is why nine sites read the same and four read like one-offs.

**Three approved faces.** A family picks one. Body copy stays `--ij-font-ui` everywhere — this is the voice, not the text.

| Slot | Face | Licence | For |
|---|---|---|---|
| `mono` | **JetBrains Mono** | OFL-1.1 | Gear, timers, data — where the number is the interface |
| `geometric` | **Outfit** | OFL-1.1 | Tools, for products that present themselves as instruments |
| `humanist` | **Instrument Sans** | OFL-1.1 | Health and calm, where a site should not read as an instrument |

Two of the three were derived rather than chosen: JetBrains Mono is the only mono in production, and Outfit is on two sites where DM Sans is on one. **The humanist slot has no production evidence behind it and is therefore the most revisable of the three.**

Assigned per category in `apps.json`, overridable per app, emitted as `--ij-font-display` in `dist/identity/<app>.css`. Every stack ends in a real fallback, so a site that has not loaded the file still reads correctly.

#### The assignments
Decided by the owner on 2026-10-03 (#50).

| Family | Face | Except |
|---|---|---|
| `fitness` | JetBrains Mono — timers, sets, reps and weights | **Walkful** and **Wean** take Instrument Sans: health and calm, not an instrument |
| `music` | JetBrains Mono — gear, samplers, card data | **Echolume** takes Outfit: the live canvas is its signature, and the site already sets Outfit |
| `web-tools` | Outfit — tools that present themselves as instruments | |
| `images` | Outfit | |

iamjarl.com and Made by Human are outside the system and get no face.

**A face in the sheet is not a face on the page.** A site picks it up by loading the face's sheet (below) and using `var(--ij-font-display)` where its voice belongs. The one place the system uses it by itself is `<ij-nav>`'s wordmark: a site that loads both its identity sheet and the nav gets the wordmark in its family's face, or in the stack's fallback if the face is not loaded. For a mono family the fallback is `ui-monospace`, which is a visible change, so load the face before moving the sheet.

#### Load the face from the design system. Do not link Google Fonts.
`fonts.googleapis.com` is a third-party request on every page view, and it carries the visitor's IP and referring page. This portfolio tells people it has no tracking and no third parties; loading a font from Google contradicts that on the one page making the claim.

**Since 1.17.0 the three faces ship from here**, so a site loads them the way it already loads `tokens.css`: one pinned `<link>` with `integrity`, from the same place and the same tag. The README has it pinned to the current release.

```html
<link rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/jarllyng/iamjarl-design@vX.Y.Z/dist/fonts/outfit.css"
  integrity="<from sri.json at that tag>" crossorigin="anonymous">
```

Each sheet is one generated `@font-face`. Its `font-family` is the name `--ij-font-display` asks for, so the two cannot drift apart. It uses `font-display: swap`, so the fallback stack is readable until the file lands, and it covers the latin subset, which includes æ, ø and å. The woff2 sits in `fonts/` beside its OFL-1.1 licence, at the same tag. The relative url in the sheet finds it on jsDelivr and inside `node_modules` alike.

- **A site with a build step** imports `@iamjarl/design-tokens/fonts/outfit.css`. The bundler serves the file from the site's own origin, with no CDN at all.
- **A site that wants no CDN** copies `fonts/<face>-latin-wght-normal.woff2` and its `LICENSE-<face>.txt`, then writes the same `@font-face`. OFL-1.1 permits this as long as the licence goes with the file.

| Face | Sheet | File | Weights |
|---|---|---|---|
| JetBrains Mono | `dist/fonts/jetbrains-mono.css` | 40 KB | 100–800 |
| Outfit | `dist/fonts/outfit.css` | 32 KB | 100–900 |
| Instrument Sans | `dist/fonts/instrument-sans.css` | 30 KB | 400–700 |

The files are Fontsource's variable latin subsets (v5.3.0), and `tokens.json` records each one's source. A woff2 loaded from a sheet cannot carry `integrity` (a CSS `url()` has no attribute for it), so the sheet is pinned with a hash and the font is covered by the tag being immutable.

### Family accent (web only)
The system defines one primary per mode. That is why thirteen of fifteen sites ended up black with the same lime pill — they inherited exactly what they were given, and there was no layer where they were allowed to differ.

A **family accent** is that layer. It is declared per category in `apps.json`, optionally overridden per app, and it never replaces `primary`:

- `primary` stays the brand thread. It is what makes the portfolio one family.
- `--ij-color-accent-family` is what a single site may lean on — its hero, its CTA, its headline mark.

Absent means the mode primary, so a site that declares nothing renders exactly as before.

**Both modes are required.** An accent that works on black and not on white is not an accent, it is a second primary, and `validate.js` rejects it. Each mode's value is held to the same bar `primary` already clears:

- at least 4.5:1 against that mode's `background.app`, so it can be used as text or an icon
- able to carry black or white at 4.5:1, so it can be used as a fill

Lime as a light-mode accent gives 1.17:1 on white and is refused. That check is the whole reason a family accent can be trusted the way the rest of the tokens are.

**On the sites only, not inside the apps** (decided 2026-10-04, #53). The family accents group the products on the web. Inside an app, the user is already in the product, and the app's colour belongs to its icon: Anvil's App Store icon is magenta, which the fitness lime would clash with. So the Swift package does not offer them, and a contract test keeps it that way.

It ships as a small per-app stylesheet, `dist/identity/<app>.css`, because `tokens.css` is one file shared by every site and cannot carry a per-site value. Nothing is generated for an app whose accent resolves to the primary.

#### The declared families

| Family | Light | Dark | Sites |
|---|---|---|---|
| `fitness` | `#587114` | `#D0FF00` | Anvil Workout, WODrounds, Wean, Walkful |
| `music` | `#177082` | `#23ACC7` | It's mono yo!, It's 404 yo!, Echolume, TonVault, Patternaut |
| `web-tools` | `#217370` | `#35B6B2` | BotLens, PageLens |
| `images` | `#B4401D` | `#DD5931` | TrimrPix, TrimrPix for iOS |

`play` and the two uncategorised sites declare nothing and still resolve to the primary.

Two of these are worth knowing the reasoning for, because the next family will face the same questions:

- **`fitness` is anchored on the lime the sites already run.** WODrounds and Walkful had it in production, so only the light half needed solving. The cost is that lime at a light-mode lightness is olive, and the pair reads as two related colours rather than one. That is the honest shape of the constraint: a hue bright enough for black cannot also be dark enough for white.
- **`web-tools` and `music` are close in hue.** Teal and cyan are one step apart. They were kept because both sites in `web-tools` are a sibling pair that should read as one thing, and because no third family sits between them. If BotLens and Echolume ever need to be told apart at a glance, `web-tools` is the cheaper of the two to move.

None sits at the 4.5:1 line. The lowest is `images` at 5.55:1 on black, chosen deliberately: a value that only just clears a hard-fail breaks on the next nudge.

### Site navigation (web only)
The top of the page is for intent. Implemented by `<ij-nav>` — see the README — and these rules hold whether a site uses the component or not.

- **At most three links, one call to action, and an optional secondary item** (a GitHub link, a changelog). Support and Privacy are obligations, not destinations: they belong in the footer.
- **The CTA is the store link.** It carries `data-umami-event="store-click"` with `data-umami-event-placement="nav"`, so it can be told apart from the hero's.
- **One CTA above the fold.** If the hero has its own, the nav's waits until the hero's has scrolled away (`cta-after`). Two accent buttons with different labels on the first screen was a critique finding on Echolume.
- **Every link is in the served HTML.** Crawlers that do not run JavaScript see the nav as plain links. A nav built by script is invisible to them.
- **One row on a phone.** Brand and CTA stay; the links fold behind a disclosure button. A header that stacks into rows and stays sticky takes a large share of a small screen.
- **The accent is a dot and a fill, never the link text** — see *Text on a translucent surface* above. Links are `text.secondary`, and go to `text.primary` on hover and for the current page, which is also underlined so colour is not the only signal.
- **Order is brand, links, secondary, CTA** — in the DOM as well as on screen, so focus follows what the eye sees.

### Gradients (web only)
- Two per mode: `gradient.primary` (the accent extended into a second stop) and `gradient.brand` (the two accents against each other, reversed per mode).
- **A gradient must begin at a color the system names.** Later stops are part of that gradient's identity, not colors the system endorses for general use — the validator enforces the first stop and leaves the rest alone.
- Use `var(--ij-gradient-primary)` rather than rebuilding a gradient by hand. Both were derived from what the sites had each invented separately.
- Not available in SwiftUI. A CSS gradient string has no Swift equivalent and the apps do not use them.

#### Gradients are decorative. Never put text on one.
This is rule 6 applied to a ramp instead of a flat color, and it is easy to miss because a gradient looks like a background.

A ramp between two brand colors has no single safe foreground. **Three of the four shipped gradients cannot carry any text color at AA:**

| Gradient | Safe foreground |
|---|---|
| `light.gradient.primary` | **none** |
| `light.gradient.brand` | **none** |
| `dark.gradient.brand` | **none** |
| `dark.gradient.primary` | black |

`#A435D2` gives black only 4.02:1; `#D0FF00` gives white 1.17:1. Whichever foreground you pick, one end of the ramp fails — and reversing the gradient per mode just moves which end.

`onPrimary` is **not** the answer. It means "text on the solid primary", and applying it to a ramp moves the failure to the lime end, where it goes from a near miss to unreadable.

Each gradient in `tokens.css` carries its own verdict as a comment, so the answer is visible where the value is used:

```css
--ij-gradient-brand: linear-gradient(135deg, #D0FF00, #A435D2); /* decorative only — no text colour clears AA */
```

**What to do instead**, in order of preference:

1. **Put the text on a solid surface.** Use `primary` with `onPrimary` for the panel, and let the gradient be an accent around it — a top border, a rule, a flourish behind the panel. This is the only option where the contrast guarantee is real rather than approximated.
2. **Stop the ramp before the text.** Keep the gradient decorative in the same block, but end it where the text begins, so the text sits on a stop you have actually checked.
3. **Narrow the ramp.** Run it between two colors of similar luminance so one foreground clears both ends. Changes the look, and the look is usually the reason the gradient is there.

A scrim between gradient and text is a fourth option and the weakest: it dulls the brand color, which is most of what a brand gradient is for.

### Tints, glows and translucency
Use `color-mix()` against an existing token. It works on every color, needs nothing generated, and keeps the source color visible in the code:

```css
/* a 30% tint of the accent */
background: color-mix(in srgb, var(--ij-color-primary) 30%, transparent);

/* a soft hero glow, built from the accent rather than a hardcoded rgba */
background: radial-gradient(ellipse 80% 60% at 50% -10%,
              color-mix(in srgb, var(--ij-color-primary) 12%, transparent), transparent 60%);

/* the same trick works for state colors, which a triplet never covered */
border-color: color-mix(in srgb, var(--ij-color-error) 40%, transparent);
```

#### Text on a translucent surface
A translucent bar or panel has no fixed background: whatever scrolls under it is part of its ground. So its text is checked the way the photographic hero is, by compositing the surface over the worst case beneath it — pure white under a dark surface, pure black under a light one.

| Text on a `background.app` surface at opacity α | AA over anything from |
|---|---|
| `text.primary` and `text.secondary` | **α ≥ 0.58** light, **α ≥ 0.64** dark |
| any family accent, or `primary` | α ≥ 0.94 light, α ≥ 0.90 dark |

The second row is why **an accent fills and decorates on a translucent surface, but does not write on it.** At a translucency worth having, a teal link falls to 3.86:1. Use `text.*` for the words, and put the accent in a dot, a border or an opaque button. `<ij-nav>` sits at 0.75, and a contract test re-derives both floors from `color.js`.

Where `backdrop-filter` is missing, or the visitor sets `prefers-reduced-transparency`, go solid: translucency without blur is text over a sharp, moving page.

> **Deprecated:** `--ij-color-primary-rgb` (added 1.3.0, deprecated 1.6.0, removed in 2.0.0). It only ever existed for `primary`, so every other color would have needed its own triplet. `color-mix()` generalises; the triplet did not. It is still emitted, so 1.3–1.5 consumers keep working — but do not adopt it in new code.

### Shadows
- Three elevation levels: `sm` (subtle), `md` (default), `lg` (modals/popovers)
- All shadows are black with varying opacity for cross-mode consistency
- Use sparingly — prefer flat UI with translucent backgrounds

### Motion
- Three durations: `fast` (150ms), `normal` (250ms), `slow` (400ms)
- Two easing curves:
  - `standard` — cubic-bezier(0.4, 0, 0.2, 1), for most transitions
  - `emphasized` — cubic-bezier(0.2, 0, 0, 1), for attention-grabbing motion
- Prefer `normal` + `standard` as defaults

### Breakpoints (web only)
- `popup: 320` (Chrome extension popups), `sm: 640`, `md: 768`, `lg: 1024`, `xl: 1280`, `xxl: 1536`
- Mobile-first approach: default styles target smallest, media queries add larger

### Container widths (web only)
- `sm: 680` (prose, forms), `md: 900` (text column), `lg: 1080` (default page content), `xl: 1400` (wide/full-bleed sections)
- **Distinct from breakpoints.** A breakpoint is where the layout changes; a container is how wide content is allowed to get. A page can use one container across every breakpoint.
- Pair with a viewport clamp so narrow screens still get a gutter: `width: min(92vw, var(--ij-container-lg))`

### Focus
- Ring width: 2px, offset: 2px
- Focus ring color should be `primary` (mode-aware)
- Always preserve keyboard focus — never `outline: none` without replacement

### Z-index (stacking)
- Use the `zIndex` scale — never magic numbers — so layers stack predictably across products.
- Order (low → high): `dropdown` (1000), `sticky` (1100), `overlay` (1200), `modal` (1300), `popover` (1400), `toast` (1500), `tooltip` (1600). `base` is 0.
- Pick the smallest layer that works; values are spaced by 100 so you rarely need anything in between.

### Opacity
- `opacity.disabled` (0.4) for disabled controls; `opacity.muted` (0.65) for de-emphasized-but-active content.

### Typography
- Default UI font: system-ui (platform native)
- Keep type scale minimal and consistent.
- Prefer semibold for headings, regular for body.

#### In apps: text follows Dynamic Type
A token is a size at the default text setting, not a fixed size. Someone who has asked their phone for larger text gets it. In SwiftUI, set text with `.ijFont(_:)` rather than `.font(.system(size:))`: it is exactly the token at the default size, and scales along the Apple text style nearest to it, from `caption` for `xs` to `largeTitle` for `xxl`.

#### Numerals: when the number is the interface
Timers, counters and readouts use the numeral scale — `sm` 32, `md` 56, `lg` 80 — derived from what the fitness apps ship. Two rules come with it:

- **Tabular digits, always.** Proportional digits make a running timer shift sideways every second: "1111" is 109 px wide at `md` where "0000" is 149.
- **Dynamic Type, capped at 1.5×.** A numeral still grows for someone who needs larger text, but not until it leaves the screen.

`.ijNumeral(_:)` does both. The design (default, rounded, monospaced) is the app's: WODrounds sets its timer monospaced, Anvil rounded.

### Icons: Phosphor on the web, SF Symbols in native apps
Decided by the owner on 2026-10-04 (#53).

- **Websites use Phosphor.** Default weight **regular**; allowed weights thin, light, regular, bold, fill, duotone.
- **Native apps use SF Symbols** on iOS, iPadOS, watchOS, tvOS and macOS. They follow Dynamic Type, take the weight of the text beside them, carry accessibility labels, and match the system font that `.ijFont` scales. The surfaces the system draws itself — widgets, Live Activities, tab bars, the watch — use them anyway, so an app on Phosphor ends up with two sets.
- **One set per app, never both.** Anvil was the case this rule was written for: Phosphor in the app, SF Symbols in its watch app, widgets and tab bar.

In a native app, size a symbol with the text style it sits beside (`.font(.body)`, `.imageScale(.large)`) rather than in fixed points, so it scales with the text. The 20 and 24 below are the web sizes. The usage and colour rules apply to both.

#### Usage rules
- Use **regular** weight for all core UI by default.
- Use **duotone** only for highlights, illustrations, or special emphasis — never for core navigation or standard actions.
- Avoid mixing different icon weights within the same screen or component.

#### Sizes (web)
- **20** → inline actions (toolbars, list rows, secondary actions)
- **24** → primary actions, navigation, empty states

#### Color
- Icons should be single-color.
- Default icon color:
  - Use `text.primary` from the current color mode.
- Active or emphasized icons:
  - May use `primary`.
- Destructive actions:
  - Use `error`.

Icons should communicate meaning, not decoration. If an icon does not add clarity, omit it.

## Rules (non-negotiable)
1. **Do not hardcode colors**.
   - Always read from `tokens.json`.
2. **Always support light + dark mode**.
   - Use `tokens.tokens.colors.modes.light` / `.dark`.
3. **No pure white/black by default**.
   - Use mode tokens for text/background.
4. **Primary is not for destructive actions**.
   - Use `error` for destructive actions.
5. **Keep corner radius consistent**.
   - Use radius tokens (sm/md/lg).

6. **Always use semantic on-colors for contrast**.
   - Never place `text.primary` or `text.inverse` directly on `primary`, `success`, `warning`, or `error`.
   - Always use the matching `on*` token.
7. **If contrast is uncertain, default to maximum contrast**.
   - Black text on bright colors.
   - White text on dark colors.

## Implementation Guidance

### Token mapping
- `primary` -> main CTAs, progress bars, links, toggles
- `background.muted` / `background.card` -> cards, sections, subtle containers
- `text.primary` -> main text
- `text.secondary` -> helper text / labels
- `border.subtle` -> separators (use sparingly)

### Accessibility
- Primary must not be used for long text paragraphs.
- All text/background combinations must meet WCAG 2.1 AA contrast:
  - 4.5:1 for normal text
  - 3:1 for large text (≥ 18pt regular / 14pt bold)
- For text or icons on colored backgrounds:
  - Always use semantic on-colors (`onPrimary`, `onSuccess`, `onWarning`, `onError`).
  - Never guess or invert colors manually.

### UI Recipes (Canonical)

#### Primary Button
- Background: `primary` (hover `primaryHover`, pressed `primaryPressed`)
- Text / Icon: `onPrimary`
- Radius: `radius.md`
- Padding: `spacing.md` (vertical) / `spacing.xl` (horizontal)
- Disabled: `background.disabled` bg + `text.disabled`, or `opacity.disabled` on the whole button

#### Secondary Button
- Background: `background.card`
- Border: `border.subtle`
- Text / Icon: `text.primary`

#### Destructive Button
- Background: `error`
- Text / Icon: `onError`

## Cursor usage
When starting a new project:
- **SwiftUI**: Add the SPM package (`https://github.com/jarllyng/iamjarl-design.git`) and `import IAMJARLDesignTokens`.
- **React web**: `npm install github:jarllyng/iamjarl-design`, then import from `@iamjarl/design-tokens` (TS) or `@iamjarl/design-tokens/css` (CSS).
- **Expo / React Native**: Same npm install, import the TS module.
- If package installation is not possible, read `tokens.json` and create local token mappings.
- Never invent new colors unless the design system is updated first.