# IAMJARL Design System (v1.32.2)

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

**Five approved faces.** Each site's identity picks one (see *Site identity* below). Body copy stays `--ij-font-ui` everywhere: this is the voice, not the text.

| Slot | Face | Licence | For |
|---|---|---|---|
| `mono` | **JetBrains Mono** | OFL-1.1 | Gear, timers, data — where the number is the interface |
| `geometric` | **Outfit** | OFL-1.1 | Tools, for products that present themselves as instruments |
| `humanist` | **Instrument Sans** | OFL-1.1 | Health and calm, where a site should not read as an instrument |
| `serif` | **Fraunces**, soft | OFL-1.1 | Calm and care: a soft serif for headlines, where a site should feel warm and unhurried |
| `grotesque` | **Bricolage Grotesque** | OFL-1.1 | Warm precision: a grotesque with character, for a tool that should feel friendly without going soft |

Two of the three were derived rather than chosen: JetBrains Mono is the only mono in production, and Outfit is on two sites where DM Sans is on one. **The humanist slot has no production evidence behind it and is therefore the most revisable of the three.**

Named in each app's `identity` in `apps.json`, emitted as `--ij-font-display` in `dist/identity/<app>.css`. Every stack ends in a real fallback, so a site that has not loaded the file still reads correctly.

#### The assignments
Decided by the owner on 2026-10-03 (#50), per family; since 1.22.0 each app carries its own (#65), with the same values. Walkful's became Fraunces, soft, when it got its own identity (#65).

| Family | Face | Except |
|---|---|---|
| `fitness` | JetBrains Mono — timers, sets, reps and weights | **Walkful** and **Wean** take Instrument Sans: health and calm, not an instrument |
| `music` | JetBrains Mono — gear, samplers, card data | **Echolume** takes Outfit: the live canvas is its signature, and the site already sets Outfit |
| `web-tools` | Outfit — tools that present themselves as instruments | |
| `images` | Outfit | **TrimrPix** and **TrimrPix for iOS** take Bricolage Grotesque (#96) |

iamjarl.com and Made by Human are outside the system and get no face.

**A face in the sheet is not a face on the page.** A site picks it up by loading the face's sheet (below) and using `var(--ij-font-display)` where its voice belongs. The one place the system uses it by itself is `<ij-nav>`'s wordmark: a site that loads both its identity sheet and the nav gets the wordmark in its family's face, or in the stack's fallback if the face is not loaded. For a mono family the fallback is `ui-monospace`, which is a visible change, so load the face before moving the sheet.

#### Load the face from the design system. Do not link Google Fonts.
`fonts.googleapis.com` is a third-party request on every page view, and it carries the visitor's IP and referring page. This portfolio tells people it has no tracking and no third parties; loading a font from Google contradicts that on the one page making the claim.

**Since 1.17.0 the faces ship from here**, so a site loads them the way it already loads `tokens.css`: one pinned `<link>` with `integrity`, from the same place and the same tag. The README has it pinned to the current release.

```html
<link rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/jarllyng/iamjarl-design@vX.Y.Z/dist/fonts/outfit.css"
  integrity="<from sri.json at that tag>" crossorigin="anonymous">
```

Each sheet is one generated `@font-face`. Its `font-family` is the name `--ij-font-display` asks for, so the two cannot drift apart. It uses `font-display: swap`, so the fallback stack is readable until the file lands, and it covers the latin subset, which includes æ, ø and å. The woff2 sits in `fonts/` beside its OFL-1.1 licence, at the same tag. The relative url in the sheet finds it on jsDelivr and inside `node_modules` alike.

- **A site with a build step** imports `@iamjarl/design-tokens/fonts/outfit.css`. The bundler serves the file from the site's own origin, with no CDN at all.
- **A site that wants no CDN** copies `fonts/<face>-latin-*-normal.woff2` and its `LICENSE-<face>.txt`, then writes the same `@font-face`. OFL-1.1 permits this as long as the licence goes with the file.

| Face | Sheet | File | Weights |
|---|---|---|---|
| JetBrains Mono | `dist/fonts/jetbrains-mono.css` | 40 KB | 100–800 |
| Outfit | `dist/fonts/outfit.css` | 32 KB | 100–900 |
| Instrument Sans | `dist/fonts/instrument-sans.css` | 30 KB | 400–700 |
| Fraunces | `dist/fonts/fraunces.css` | 62 KB | 100–900, and the `SOFT` axis |
| Bricolage Grotesque | `dist/fonts/bricolage-grotesque.css` | 75 KB | 200–800, and optical size |

The files are Fontsource's variable latin subsets (v5.3.0), and `tokens.json` records each one's source.

**Fraunces is soft only when asked.** Its file carries the `SOFT` axis, which rounds the serifs and terminals off, but the axis rests at 0, the sharp end. Use it with `font-variation-settings: 'SOFT' 100`, which `tokens.json` records as the face's `axes`. An identity sheet whose face has axes sets them as `--ij-font-display-axes`, and the kit and `<ij-nav>` apply it, so a site gets the soft cut without writing it. The owner chose it for Walkful on 2026-10-11 over Young Serif (one heavy weight) and Newsreader (more editorial than warm); the comparison is on #65. A woff2 loaded from a sheet cannot carry `integrity` (a CSS `url()` has no attribute for it), so the sheet is pinned with a hash and the font is covered by the tag being immutable.

**Bricolage Grotesque sizes itself.** Its file carries an optical-size axis, and browsers set it from the text's size by themselves (`font-optical-sizing: auto`), so a 96 px headline gets the tighter display cut and a label the open text cut, with no axes to set. The owner chose it for TrimrPix on 2026-10-13 (#96) from three open faces on both heroes: Nunito was the softest and the most generic, and Gabarito sat too close to Outfit, which three sites already use. Bricolage was the most its own, and clearly apart from the four faces before it. The comparison is on #96.

### Site identity (web only)
Side by side, twelve of the thirteen app sites were near-black, with the same neon accent and the same layout. They inherited exactly what they were given: one primary, then from 1.12.0 one accent and from 1.16.0 one display face per *family*, shared by every site in it. The owner decided on 2026-10-11 that every app site gets its own personality (#65).

So each app declares its **identity** in `apps.json`: its own ground, text, accent and display face. It ships as a small per-app stylesheet, `dist/identity/<app>.css`, because `tokens.css` is one file shared by every site and cannot carry a per-site value. The family layer is gone. Its values were copied onto each app, so a site that did not ask for a new identity renders exactly as before, and the old variable name, `--ij-color-accent-family`, is still set.

```json
"identity": {
  "scheme": "light",
  "display": "humanist",
  "light": { "background": "#F5EFE6", "surface": "#FFFCF7", "text": "#2B2825",
             "accent": "#F140FE", "accentText": "#A80FB3" }
}
```

| Field | What it is | Held to |
|---|---|---|
| `scheme` | `light` or `dark` for a site with one mode. Absent: the site follows the visitor, and every colour is declared for both modes | |
| `display` | A face from the approved set above | |
| `background`, `surface` | The page's ground and its cards. Declared together with `text` | |
| `text` | Body copy. Secondary and tertiary text are mixed from it toward the ground, so a warm site's grey is warm | **7:1** on the ground and the cards, because it is the body of a marketing page. The two mixes at AA |
| `accent` | What the site leans on: strokes, fills, the one line in a drawing | Able to carry black or white at AA, so it can be a button. **Not** held to contrast as text |
| `accentText` | The accent's text-safe variant, for links, small highlights and focus rings. Defaults to `accent` | **4.5:1** on the ground and the cards |
| `numerals` | A second face from the approved set, for `.ij-numeral` and the figures in a table, when the numbers want their own (#91): Anvil's headlines are Outfit and its weights and reps JetBrains Mono. Absent: the display face | |
| `panels` | `bordered`: cards drawn with a thin line in the border colour, as in a hardware manual (#83). Absent: flat | |

**Two accents, because a site's colour is often too light to read.** Walkful's magenta is the colour of its icon and of the path in its drawings, and it is 2.7:1 on sand. As a stroke, a fill or a large shape it is the site; as a link it would fail. So the magenta draws and a deeper magenta writes. A site whose accent already reads, like every family accent carried over, needs no second value.

**What is shared, and what is open.** `primary` stays the system's brand colour: the apps use it, and the components fall back to it when a site has no identity. The accent is per app, not a fixed magenta. Walkful takes the icons' magenta; the Mac apps' icons are lime on black, and what ties the portfolio's sites together is not decided. Until it is, nothing shared is enforced beyond the tokens and the components.

**A site with one mode is held in it.** Light-only means light for a visitor whose system is dark, too: the sheet sets `color-scheme` and puts back every colour of its mode, which `tokens.css` would otherwise switch. A site that follows the visitor gets both, switched the way `tokens.css` switches.

**On the sites only, not inside the apps** (decided 2026-10-04, #53). The identity is how the products present themselves on the web. Inside an app, the user is already in the product, and the app's colour belongs to its icon. So the Swift package does not offer these values, and a contract test keeps it that way.

#### The identities

| Site | Scheme | Ground and text | Accent (text) | Face |
|---|---|---|---|---|
| **Walkful** | light | sand `#F5EFE6`, charcoal `#2B2825`, cards `#FFFCF7` | `#F140FE` (`#A80FB3`) | Fraunces, soft |
| **Wean** | light | misty grey-blue `#E6ECEF`, charcoal `#22292E`, cards `#F5F8F9` | `#F140FE` (`#A80FB3`) | Instrument Sans |
| **WODrounds** | dark | near-black `#0B0C0D`, off-white `#F2F3EF`, cards `#17191B` | `#D0FF00` | JetBrains Mono |
| **It's mono, yo!** | dark | blue-black `#0D0F13`, off-white `#EDEFF2`, cards `#161A21`, bordered | `#D0FF00` | JetBrains Mono |
| **Anvil Workout** | light | notebook neutral `#F3F3EF`, charcoal `#1C1D21`, white cards | `#F140FE` (`#A80FB3`) | Outfit; numbers in JetBrains Mono |
| **TonVault** | light | paper `#F5F4EE`, ink `#141414`, white cards, bordered | `#D0FF00` (`#4A5900`), a highlighter | JetBrains Mono |
| **TrimrPix** | light | lilac-white `#F1F0F6`, ink `#1C1B22`, white cards | `#D0FF00` (`#4A5900`), a highlighter | Bricolage Grotesque; numbers in JetBrains Mono |
| **TrimrPix for iOS** | light | lilac-white `#F1F0F6`, ink `#1C1B22`, white cards | `#F140FE` (`#A80FB3`) | Bricolage Grotesque; numbers in JetBrains Mono |
| It's 404 yo!, Echolume, Patternaut | both | the tokens' | `#177082` / `#23ACC7` | JetBrains Mono; Echolume Outfit |
| BotLens, PageLens | both | the tokens' | `#217370` / `#35B6B2` | Outfit |

All but Walkful, Wean, WODrounds, It's mono, Anvil, TonVault and the two TrimrPix sites are the family values carried over, light / dark. TrimrPix (#96) is one identity on two sites: the same lilac-white ground, ink (15.1:1), white cards and Bricolage Grotesque, with each app's own icon colour as the accent. The Mac site's lime is a highlighter, as on TonVault, 1.0:1 on the ground and so never text, with a dark olive for links (6.8:1); the iPhone site's magenta draws and its deep magenta writes (5.5:1), as on Walkful. The ground tells it apart from Walkful's sand, Wean's grey-blue, Anvil's notebook and TonVault's paper, and its picture is its own work: the same photo before and after, with the sizes. Anvil (#91) shares the icons' magenta with Walkful and Wean and is told apart by its ground, a clean notebook neutral, and by its two faces: Outfit for the words, JetBrains Mono for every number. TonVault (#91) is a light service manual: black ink on paper, bordered panels, and the icon's lime as a highlighter. Lime is 1.1:1 on the paper, so it is never text there: it fills behind black text, and inside the waveforms, whose ink edge carries their shape; its links take a dark olive. Each will change when its site gets its own personality. Wean shares Walkful's magenta, the iPhone icons' line, and differs in ground and face: cool where Walkful is warm, a humanist sans where Walkful has a serif. WODrounds is the first dark site: the app's own lime on near-black, which reads as text too (16.8:1), so it needs no second accent. Its numbers are the picture, so it has no drawings; two gym photos in black and white set the mood around them (#81). It's mono is the second dark site with the same lime, the app's own, and must not read as WODrounds' template: its ground is a blue-black desk at night rather than a neutral black, its cards are bordered panels like a hardware manual, and its pictures are drawings of the samplers it serves (#83). The docs page renders this table live from `apps.json`, with every contrast.

### Marketing pages (web only)
Each app site has one job: show what the app is, quickly, and hand the visitor to the store. The owner compared the portfolio's sites with app sites they admire (#65), and what the good ones share is a short list. The kit in `dist/kit/kit.css` is built to make it the easy path:

- **One ground, one display face, one accent and one visual language,** per site. The identity carries the first three; the drawings, or whatever the site's visual language is, are the fourth.
- **The product big, straight and with plausible data.** A phone on the first screen, never tilted. Below it, features as frameless pieces: one number, one chart, one card from the app, shown large.
- **One quiet block per feature.** A short headline and one sentence.
- **Privacy and price stated as features,** and **a person behind the app:** a short note from the maker, signed.
- **One thing that moves, and it is the product.** A short screen recording in the hero, and the phone that stays on screen while the features scroll past. Nothing animates in, and the resting state is always the whole page. Both are CSS with the motion tokens, switched by the kit's own module (`dist/kit/kit.js`, no library; the owner chose that over vendoring Motion, #65), and both stop under reduce motion.
- **Dark is as good as light.** A site may be dark whatever the visitor's setting (`"scheme": "dark"`): the sheet holds every colour, the phone takes an edge from the border colour, a drawing's ink turns light, and the store button takes its `.white` fragment. WODrounds' example is tested in both of a visitor's modes. A long name or a wide face sets `--ij-wordmark-em`, so the closing wordmark never runs past its column.
- **A Mac window is not framed at all** (#83). The capture carries its own chrome; `.ij-window` clips it to its own corners, so a video's black-masked corners never show, and gives it the border colour's edge. In the tour, the window takes the wider column and holds still.
- **The other screens are framed plainly, or not at all.** `.ij-tv` and `.ij-watch` draw an Apple TV and a Watch the way `.ij-phone` draws a phone: generic, black, with an edge from the border colour, and nothing unique to Apple's hardware (no crown, no side button). A TV stands on a short foot and a watch has two plain straps, so each reads as a device at a glance. A screen can also go frameless, as a piece in a card.
- **A photo scene can carry the site's one magenta line** (#90), drawn on the photo by hand and cropped as the photo is: `.ij-scene__line`, from `kit/scenes.js`. A photo may be shown mirrored when the line must run the other way.
- **A photo may set the mood, never carry the content** (#81, the owner's call on 2026-10-12, for WODrounds' gym). `.ij-scene` lays one across the page, between sections or behind the closing words. It is black and white, so the accent stays the only colour, and dimmed toward the ground. Words on it sit on a scrim of the ground and take the primary text colour, so they read at AA over any photo. Never in the hero, at most two on a page, loaded lazily, and nothing moves. A photo of people is a cropped body shot: no face, no brand.
- **Light pages.** Below the first screen everything loads lazily. A screen recording is encoded at display size, around 300 to 600 KB, with a poster frame.
- **Hygiene.** The kit's skip link (`.ij-skip`) first, real headings in order, body text at 18 px or more, no unverifiable numbers (a privacy-first app cannot count its users), no urgency banners, no tilted or animated devices.
- **One visual language per site, drawn once, here.** Walkful's is paths and trees, and Wean's coast and tide, now as photographs (#90): a real place, made monochrome and quiet by the kit's scene, with the brief's one magenta line drawn on it, Walkful's walked path and Wean's waterline falling from left to right; WODrounds' is its own numbers, with a gym photo or two for the mood; TrimrPix' (#96) is its own result, the same photo before and after with the sizes beside it, and no drawings; Anvil's and TonVault's (#91) are their own data, with no drawings: Anvil's training log as figures, TonVault's samples as waveforms drawn from real audio by `kit/wave.js`, in a clean line because a waveform is a measurement; It's mono's (#83) is the samplers on a studio desk, drawn as types and never as models, the lime line always the one mono signal going in. Wean's drawings of #75 and Walkful's placeholders didn't hold up next to the type and the app captures: generated drawings read as diagrams, so the owner chose photographs (2026-10-13), and fewer pictures over more. The drawings that remain are written as SVG from descriptions in `kit/drawings/`, so a site inlines them and they take its tokens. A line drawn from data goes through the same loose stroke (`kit/loose.js`, `.ij-loose`). No faces, and nothing of what an app helps you cut down.
- **No Made by Human badge and no AI-authorship wording on an app site** (the portfolio's standard; #71). The badge belongs in the repo's README. A site may link Made by Human as a sibling, labelled "Made by Human", as `<ij-footer>` does. There are two exceptions, both one plain line: a note on authorship on an editorial article, and, for drawings made with AI, a single credit in the footer's fineprint, such as "Illustrations drawn with AI, finished by hand" (decided by the owner on 2026-10-11). Never in the hero, the copy or the store text, never as a badge, and never as a claim that the drawings are hand-drawn.

**The marketing scale is separate from the app scale.** Headlines run from 52 px on a phone to 96 px from a 1280 px viewport up, body text from 18 px, content 1,100 px wide, and the sections far apart. All of it is fluid and in rem, as `--ij-mkt-*` in `tokens.css`; the docs page shows every value. Cards keep `radius.lg`: rule 6 holds on marketing pages too.

### Site navigation (web only)
The top of the page is for intent. Implemented by `<ij-nav>` — see the README — and these rules hold whether a site uses the component or not.

- **At most three links, one call to action, and an optional secondary item** (a GitHub link, a changelog). Support and Privacy are obligations, not destinations: they belong in the footer.
- **The CTA is the store link.** It carries `data-umami-event="store-click"` with `data-umami-event-placement="nav"`, so it can be told apart from the hero's.
- **One CTA above the fold.** If the hero has its own, the nav's waits until the hero's has scrolled away (`cta-after`). Two accent buttons with different labels on the first screen was a critique finding on Echolume.
- **Every link is in the served HTML.** Crawlers that do not run JavaScript see the nav as plain links. A nav built by script is invisible to them.
- **One row on a phone.** Brand and CTA stay; the links fold behind a disclosure button. A header that stacks into rows and stays sticky takes a large share of a small screen.
- **The accent is a dot and a fill, never the link text** — see *Text on a translucent surface* above. Links are `text.secondary`, and go to `text.primary` on hover and for the current page, which is also underlined so colour is not the only signal.
- **Order is brand, links, secondary, CTA** — in the DOM as well as on screen, so focus follows what the eye sees.
- **The page's language, not English** (#80). The few words `<ij-nav>` and `<ij-footer>` print themselves ("Skip to content", "Menu", "More from IAMJARL", "All projects") follow the page's `lang` in the seven languages the sites are written in. App names are names and stay as they are.

### Store buttons (web only)
The link to the store is the most important link on a site that sells an app. Before `<ij-store-cta>` every site wrote its own, and they drifted: campaign parameters missing on four sites, the click event on two, a price wrong on one and an OS requirement on another. Now every fact comes from `apps.json`, and these rules travel with it.

- **One badge per layout, never the dominant element.** Apple's badge is at least 40 px tall; the Chrome Web Store badge 58 px, the smallest Google publishes, because its words are small inside it. The badge sits under the hero's message, not in place of it. The nav's call to action is a text link to the same place, because a second badge would break the first rule.
- **The right badge**: the Mac App Store badge for a Mac app, the App Store badge for iPhone, Apple's localised badge on a translated page, black on light and white on dark. The files ship in `badges/` exactly as Apple and Google publish them, and are never edited.
- **The campaign is the portfolio's**: `pt=128512007`, `ct=site`, and `mt=8` for iPhone or `mt=12` for Mac. `ct` is per site, not per page, because Apple only shows a campaign after five first-time downloads.
- **Every store link reports `store-click`**, with `store`, `placement` (`hero`, `nav`, `midpage`, `footer`) and `locale`.
- **The facts line is the store's own**: the price as that storefront states it, "once" for a one-time purchase, and the minimum OS: *"$2.99 once · iOS 16 or later"*. English pages quote the US store; a translated page quotes its own country's. A weekly check compares the registry with Apple and opens an issue when they differ.
- **It works without JavaScript, all of it.** The generated fragment is plain HTML in the served page, where crawlers and AI assistants read it. There is a file per placement and per fixed tone, so a site that pastes by hand serves the right event and, on an always-dark site, the right badge with no script (#63).
- **The structured data quotes the same price.** A page's JSON-LD takes its `Offer` from the generated `offer.json`, not from a hand-typed number.

A QR code for iPhone-only apps on desktop is planned as a later step.

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
| an accent that reads at AA on the ground, or `primary` | α ≥ 0.94 light, α ≥ 0.90 dark |

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
- `opacity.disabled` (0.4) for disabled controls; `opacity.muted` (0.65) for de-emphasized-but-active content. **Never on text:** 0.65 of the secondary colour falls to about 3.4:1 on a light ground. Quiet text takes `text.tertiary`, which every identity holds at AA (#98).

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