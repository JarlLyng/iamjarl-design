# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.33.1] — 2026-10-16

TonVault's new price, released on the day of its app release (#93).

### Changed
- **TonVault's US price is $4.99,** up from $1.99, by the owner's decision on TonVault#31. It changes TonVault's store fragments' facts line, `tonvault.en.offer.json` and the kit's TonVault example.

### What TonVault loads
- **The new fragments, pasted from `@v1.33.1`:**
  - `dist/store/tonvault.en.black.html`, `.midpage.black.html` (the guide pages) and `.footer.black.html`;
  - `tonvault.en.offer.json`, for the JSON-LD offer.

  `tonvault.en.nav.html` carries no price.
- **The badge comes from the site's own copy** (since 1.33.0): `/assets/iamjarl-design@v1.33.1/badges/mac-app-store-black-en-us.svg`. Copy v1.33.1 with that badge, as the README's recipe does, before pasting.
- **The order (the hub's), so the site never shows a price the store doesn't:**
  1. The App Store price changes first.
  2. TonVault checks that Apple's lookup returns $4.99.
  3. This is merged.
  4. The fragments are pasted.

### Tests
- The store element's browser test reads TonVault's expected price from the registry instead of holding $1.99.

## [1.33.0] — 2026-10-16

The store fragments' badge comes from the site's own copy, so a self-hosted page makes no request to jsDelivr (#104).

### Changed
- **Every store fragment's badge points at `/assets/iamjarl-design@vX.Y.Z/badges/<file>.svg`.**
  - **Before:** it pointed at jsDelivr's copy of the tag. That was the one request to a third party left on a page that serves everything else itself, as TrimrPix found when it moved to a copy.
  - **Why this path:** it is where the README's copy recipe puts the release, and TrimrPix and Walkful already serve their copies there.
  - **What a site does:** copy the badges its fragments name, and paste fragments from the same release as its copy.
- **The copy recipe takes the badges.** The README now says to serve the folder at that path from the site's root.

### Tests
- **Every fragment's badge path:** each `src` and `srcset` names this release's copy path and a badge that exists.
- **Pasted verbatim:** the browser tests paste the fragments exactly as they ship, with no rewrite. The test server serves `/assets/iamjarl-design@vX.Y.Z/` from the repo, the way a self-hosted site does, and the badge loads at 40 px.

### Who should move
- **Every site that pastes store fragments:**
  - take this release's copy with the badges;
  - paste the fragments from it;
  - check that the badge loads and that no request goes to `cdn.jsdelivr.net`.
- **A site still on jsDelivr** has an issue from 1.32.2 to move to a copy. A fragment from this release won't show its badge until it has.

## [1.32.2] — 2026-10-15

Two findings from the move to 1.32.1:
- the footer's quiet text on a page that maps its own palette (PageLens);
- jsDelivr failing after a warmed release (Wean, TrimrPix), which makes a copy in the site the default.

### Fixed
- **`<ij-footer>`'s labels and fineprint on a page that maps its own palette and has no tertiary.**
  - **The cause:** 1.32.1 set them in `--ij-color-text-tertiary` (#98). A page that maps its own colours onto the footer instead of loading `tokens.css`, such as PageLens' guides, never set that variable, so the footer used its own fallback for the visitor's mode.
  - **The effect:** in a dark OS that fallback is white at 60%, which on such a light page was close to invisible (1:1).
  - **Now:** a missing tertiary falls back to the page's own secondary first, and only then to the footer's fallback.

### Changed
- **A live site serves the design system from its own origin** (#100, the owner's decision on 2026-10-15).
  - **Why:** jsDelivr's `/gh/` path answered `503` or timed out for minutes on files of v1.32.1, for Wean and TrimrPix, after the release had warmed it. The warm-up fills jsDelivr's store and the edge nearest GitHub; every other edge still fetches a file the first time a visitor near it asks. The token sheet, the identity sheet and `kit.css` block the first paint, so a stalled file blanks the page.
  - **How:** a static site copies the files it loads into its repo, checked against the tag's hashes, as the README's recipe shows. A site with a build installs the package. The CDN URLs are for trying something out.
  - **Where it's written:** the README, design.md and AGENTS.md now say so.

### Documented
- **A page that is light whatever the visitor's setting** and loads a sheet that follows it pins `<html class="light">`. Without it, a visitor in dark mode gets dark values, such as a light accent for hover, on a light page.
- **A page that maps its own palette onto the footer** sets the five variables the footer reads, the tertiary among them.

### Tests
- A light page that maps only its primary, secondary and border, in a dark OS: the labels and fineprint take its secondary, at AA. This test fails on 1.32.1 with white on white.

### Who should move
- **A page that maps its own palette onto `<ij-footer>`:** bump `ij-footer.js`, or map `--ij-color-text-tertiary`. PageLens has already done the second. A site that loads `tokens.css` or an identity sheet is unaffected.
- **Every site that loads the design system from jsDelivr when the page is shown:** serve a copy from the site itself. Each gets an issue: Walkful, Anvil, WODrounds, It's mono, Echolume, BotLens and Patternaut. TrimrPix, TrimrPix for iOS and TonVault take it with their redesigns.

## [1.32.1] — 2026-10-15

Three findings from TrimrPix' move to 1.32.0 (#98, #99, #100):
- the footer's quiet text was below AA on every light site;
- the kit didn't size an image inside a `<picture>`;
- jsDelivr was slow to serve a new tag.

### Fixed
- **`<ij-footer>`'s group labels and fineprint read at AA on every ground** (#98).
  - **Before:** they were faded with `opacity: 0.65`. On every light site that put the fineprint at 3.1 to 3.8:1, below AA, and the labels at 4.4:1 on Walkful and Wean.
  - **Now:** both take the tertiary text colour, 5.1:1 or more on every identity's ground and 4.8:1 on the tokens alone.
  - **What it looks like:** both stand out a little more against the ground, the fineprint most. Nothing else changes.
- **A `<picture>` works wherever the kit sizes an image** (#99):
  - **Where:** `.ij-window`, `.ij-phone__screen`, `.ij-tv__screen`, `.ij-watch__screen`, `.ij-card__piece` and `.ij-compare__item`.
  - **How:** the kit lays the `<picture>` out as if it weren't there, and sizes the `<img>` inside it as it does a bare one.
  - **Why it matters:** a site can serve its captures as AVIF and WebP with a fallback, where before the `<img>` kept its `height` attribute and was squashed.
- **A new tag no longer reaches its first visitor through a cold CDN** (#100). jsDelivr fetches a tagged file from GitHub the first time anyone asks for it, and that first fetch is the one that failed. On 2026-10-14, v1.32.0 answered `503` for minutes. A day later, about 300 of its 358 files had still never been fetched.
  - **The release now warms the cache:** `scripts/warm-cdn.js` asks for every published file straight after the release. It retries until each one is served and matches its hash in `sri.json`. Cold, that takes several minutes; warm, two seconds.

### Added
- **A copy served from the site itself,** in the README: download the tag's archive from GitHub, copy the files the page loads, and check each one against the tag's `sri.json`. The page then loads with no third-party request at all, the same reason the faces are self-hosted. The recipe is pinned to the current release like the other install lines.

### Tests
- **The kit examples' contrast scan:**
  - **What a reader sees:** each text's colour is composited through its alpha and every opacity above it, across slots and shadow roots.
  - **The footer too:** the scan now reads the footer's text, not just `<main>`.
- **Every identity's footer** in both modes, and one on the tokens alone: each text at AA, and nothing in the footer faded by opacity.
- **A `<picture>` fixture:** the window at its own ratio with its corners, the phone's screen filled, and the before and after at 3:2.

Each of these tests fails on 1.32.0.

### Who should move
- **Every light site that uses `<ij-footer>` with fineprint or groups**, to pass AA: Walkful, Wean, Anvil, TonVault, TrimrPix and TrimrPix for iOS, and the light family sites. Bump `ij-footer.js` and its hash. Nothing else changes.
- **A site that wants AVIF or WebP captures** in a window, a phone or a before and after: bump `kit.css` and its hash.
- **A site that shouldn't depend on jsDelivr:** serve a checked copy, as the README shows. Nothing requires it.

## [1.32.0] — 2026-10-13

TrimrPix' identity on its two sites, a fifth display face, and a before and after (#96).

### Added
- **TrimrPix' identity, one look on two sites,** light whatever the visitor's setting:
  - **Ground and cards:** a lilac-white `#F1F0F6`, with white cards, apart from Walkful's sand, Wean's grey-blue, Anvil's notebook and TonVault's paper.
  - **Text:** ink `#1C1B22` (15.1:1).
  - **Faces:** Bricolage Grotesque for headlines and JetBrains Mono for every size and percentage.
  - **Accent on the Mac site (`trimrpix`):** the Mac icon's lime `#D0FF00`, as a highlighter. It is 1.0:1 on the ground, so it is never text there: it fills behind black text (18:1), and links take a dark olive, `#4A5900` (6.8:1).
  - **Accent on the iPhone site (`trimrpix-ios`):** the icons' magenta `#F140FE`, with black on it, and `#A80FB3` for links (5.5:1).
- **Bricolage Grotesque, the fifth approved face** (`grotesque`, OFL-1.1), chosen by the owner from three on #96. It ships as `dist/fonts/bricolage-grotesque.css`, a 75 KB variable latin subset from Fontsource 5.3.0 with weights 200 to 800 and an optical-size axis, which the browser sets from the text's size by itself.
- **`.ij-compare`, a before and after:** the same picture twice, each a `figure.ij-compare__item` with its size in the caption. Side by side when there's room, stacked on a phone, and never more than two across. A `figcaption` straight in `.ij-compare` spans both.
- **`.ij-chips`, sizes as chips:** a list of `li.ij-chip`, short frameless facts in the numeral face, tabular, never broken.
- **`.ij-num` anywhere on the page,** not only in a table: a figure in the numeral face, with tabular digits, that never breaks.
- **Two kit examples,** `kit/trimrpix.html` and `kit/trimrpix-ios.html`, on the docs page:
  - **The Mac site:** a centred hero with the window, the before and after with its chips, the window tour, and "where it works" led by one measured saving. Its window shows today's captures, in the app's dark appearance, until TrimrPix retakes them light.
  - **The iPhone site:** a split hero with the phone, the same before and after, the phone tour, and "where it works" led by "0 duplicates".
  - **The photo is an example:** one Unsplash photo by Jeremy Bishop, at two qualities, credited in the fineprint, with sizes marked as an example. Each site shows its own photo, made by the app at stated settings, with its measured sizes.

### Fixed
- **A stack keeps its spacing around the new pieces too.** `.ij-label`, `.ij-compare` and `.ij-chips` reset their margins in the kit's one reset, before the stack's rule, as #88 settled. A new contract test fails if any kit block resets its own margin after the stack's rule.

### Tests
- Both examples at 1440 and 375 px with every section, AA, no overflow, and no JavaScript.
- Headlines in Bricolage Grotesque, the same photo twice with its sizes in mono, side by side at 1440 and stacked at 375, the chips in mono, every highlight black, and no lime text anywhere.
- Every later child of a stack keeps the stack's spacing on both pages.

### What TrimrPix (Mac) loads
All from `@v1.32.0`, with the hashes below:
- **The files:**
  - `dist/css/tokens.css` and `dist/identity/trimrpix.css`. Take the sheet with the redesign, not before: it turns the site light only.
  - `dist/fonts/bricolage-grotesque.css` **and** `dist/fonts/jetbrains-mono.css`, for the sizes;
  - `dist/kit/kit.css`, `dist/kit/kit.js`, `ij-nav.js` and `ij-footer.js`.
- **The `.black` Mac App Store fragments** (`dist/store/trimrpix.en.black.html`, `.footer.black.html`) and `trimrpix.en.offer.json` for the JSON-LD.
- **The pieces:**
  - `.ij-window` for the hero and `.ij-tour--window` for the tour, from 1.28.0;
  - `.ij-compare` with your own photo before and after, and its measured sizes in `.ij-num`;
  - `.ij-chips` for the sizes, `<mark>` for anything the lime stands behind, and never the lime as a text colour.
- **`.ij-skip`** first in the body. No drawings; the photo's credit goes in the fineprint, if the photo isn't your own.

### What TrimrPix for iOS loads
All from `@v1.32.0`, with the hashes below:
- **The files:**
  - `dist/css/tokens.css` and `dist/identity/trimrpix-ios.css`. It turns the site light only;
  - `dist/fonts/bricolage-grotesque.css` **and** `dist/fonts/jetbrains-mono.css`;
  - `dist/kit/kit.css`, `dist/kit/kit.js`, `ij-nav.js` and `ij-footer.js`.
- **The `.black` App Store fragments** (`dist/store/trimrpix-ios.en.black.html`, `.footer.black.html`) and `trimrpix-ios.en.offer.json`.
- **The pieces:**
  - `.ij-phone` in the hero and `.ij-tour` for the three steps;
  - the same `.ij-compare` and `.ij-chips` as the Mac site, with your own photo and sizes;
  - `<mark>` for highlights.
- **`.ij-skip`** first in the body. No drawings, and a credit line only for a photo that isn't your own.

## [1.31.0] — 2026-10-13

Wean's and Walkful's pictures, as photographs with their one magenta line (#90).

### Changed
- **Photographs in place of drawings, for Wean and Walkful.**
  - **Why:** Wean's coast drawings from #75 and Walkful's placeholders didn't hold up next to the type and the app captures. Generated drawings read as diagrams. Three more attempts, in a pen stroke and as an engraving, didn't reach the bar either.
  - **The owner's choice (2026-10-13):** photographs for the mood, fewer pictures over more.
  - **What the sites get:** two scenes each, on the kit's `.ij-scene` from 1.26.0, both free under the Unsplash License, with no faces and no brands:
    - **Wean,** two by Julia Taubitz: tidal flats under a grey sky, the water drawing back, as a band; and wide flats under an overcast sky, behind the closing.
    - **Walkful:** a path worn through the grass between trees in fog (Luca Volpe), as a band; and a narrow worn path under large trees (zhao sky), behind the closing.
- **Removed: Wean's eight drawings** (`dist/drawings/wean/`, `kit/drawings/wean.js`) and the example's taper staircase. Wean took both off its pages on 2026-10-13. `kit/loose.js` and `stairsPoints` stay.
- **The Wean and Walkful examples** show the scenes, and their statements stand as text, side by side. Wean's plan is a week-by-week table from Wean's own maths. The photographers are credited in the fineprint. The "Illustrations drawn with AI" line goes, as there are no drawings.

### Added
- **The scene's one magenta line,** `.ij-scene__line`: Walkful's walked path, Wean's waterline. It is drawn on the photo by hand through the loose stroke, as an SVG the size of the photo with `preserveAspectRatio="xMidYMid slice"`, so it crops exactly as the photo does at any width. It sits above the scene's dimming, so it stays vivid. The lines come from `kit/scenes.js` and ship in `dist/scenes/<app>/`.
- **`.ij-scene__photo--mirrored`**, for when the brief needs the line to run the other way. Wean's waterline must fall from left to right, and its photo's rises.
- **Statements without drawings** stand side by side as short columns.
- **Tests:**
  - every scene's photo is named, free and credited;
  - Wean's line falls left to right;
  - each line file is the size of its photo and is the same SVG on the example;
  - in Chrome at 1440 and 375 px, each line is in the accent, cropped with its photo over a monochrome picture, and Wean's photo is mirrored with the line falling.

### What Wean loads
- **`dist/kit/kit.css` from `@v1.31.0`,** with the hash below. The other files may follow.
- **The photos, from Unsplash (free licence):**
  - [okDw1STxJZ8](https://unsplash.com/photos/okDw1STxJZ8) as a band between sections, with `.ij-scene__photo--mirrored`;
  - [tEiP7X6u3Yc](https://unsplash.com/photos/tEiP7X6u3Yc) behind the closing wordmark.

  Self-host them at 960, 1280 and 1920 px, or load them from `images.unsplash.com` with `?w=`. Keep the band's photo centred.
- **The line:** `dist/scenes/wean-nicotine/tidal-flats.svg`, inlined in the band right after the photo.
- **What goes:** `dist/drawings/wean/` is gone, so the sync drops it.
- **Credit:** a photo credit in the fineprint is optional; the example has "Photos by Julia Taubitz on Unsplash". No badge.

### What Walkful loads
- **`dist/kit/kit.css` from `@v1.31.0`,** with the hash below.
- **The photos, from Unsplash (free licence):**
  - [ZrQZf1xY8KQ](https://unsplash.com/photos/ZrQZf1xY8KQ) as a band between sections;
  - [6KCyb6eoWmY](https://unsplash.com/photos/6KCyb6eoWmY) behind the closing wordmark.
- **The line:** `dist/scenes/walkful/path-in-fog.svg`, inlined in the band right after the photo.
- **What goes:**
  - the three placeholder drawings, so the statements stand as text;
  - the magenta underlines in the hero and under the maker's signature, so the walked path is the one magenta line;
  - the "Illustrations drawn with AI" line, if the site has it.

## [1.30.0] — 2026-10-13

Anvil Workout's and TonVault's identities, two light sites with no drawings, and a waveform helper for TonVault (#91).

### Added
- **Anvil Workout's identity:** light whatever the visitor's setting.
  - **Ground and cards:** a clean notebook neutral `#F3F3EF`, with white cards.
  - **Text:** charcoal `#1C1D21` (15.1:1).
  - **Accent:** the icons' magenta `#F140FE` for fills and strokes, with black on it, and `#A80FB3` for links (5.6:1), as on Walkful and Wean.
  - **Faces:** Outfit for headlines and JetBrains Mono for every number.

  The ground and the faces tell it apart from the two other magenta sites.
- **TonVault's identity:** a light service manual.
  - **Ground and cards:** paper `#F5F4EE`, with white cards drawn as bordered panels.
  - **Text:** ink `#141414` (16.7:1).
  - **Face:** JetBrains Mono for headlines, labels and values.
  - **Accent:** the icon's lime `#D0FF00`, as a highlighter. The lime is 1.1:1 on the paper, so it is never text there. It is a fill behind black text (18:1) and inside the waveforms, and its links take a dark olive, `#4A5900` (7:1).

  That keeps it apart from It's mono and WODrounds, which are dark with lime.
- **A numeral face of its own,** the identity field `"numerals"`. It sets `--ij-font-numeral`, which `.ij-numeral` and the figures in a table use. The validator holds it to the approved faces.
- **`kit/wave.js`**, published as `dist/kit/wave.js` with SRI. It has two pure functions, run at build time:
  - `peaksOf(samples, buckets)` gives the loudest sample in each run, from 0 to 1;
  - `wavePath(peaks, box, { shape })` draws a closed outline mirrored about the middle, or one bar per peak.

  `.ij-wave` fills the outline with the accent and edges it in the text colour, so a light accent still reads on a light page. The line is clean, not the drawings' loose stroke, because a waveform is a measurement.
- **More of the kit:**
  - `.ij-data`, a table of figures, numbers in the numeral face with tabular figures;
  - `<mark>` and `.ij-highlight`, the accent behind on-accent text;
  - `.ij-label`, a label in the display face's capitals.
  - A numeral never breaks across lines, and a numeral in a card is primary text.
- **Two kit examples,** `kit/anvil-workout.html` and `kit/tonvault.html`, on the docs page:
  - **Anvil's** data as the picture: a week of sets, a new record, the 1RM curve, the plate calculator and the Watch's rest, with 70 in "where it works". Its phone shows today's captures, in the app's dark appearance, until Anvil retakes them light.
  - **TonVault's** four jobs as numbered rows: a library with waveforms, the health check, duplicates and the verified backup. Its eight rules sit around an 8, and its window shows the current public screenshot. The example synthesises a beat and four sounds, a kick, a snare, a hat and a pad, from their physics, because it has no card; TonVault feeds `wavePath` real samples.
- **Tests:**
  - both examples at 1440 and 375 px with every section, AA and no overflow;
  - Anvil's faces, every number in mono with tabular figures, and its highlight at AA;
  - on TonVault, no text in the lime anywhere, the lime only behind black text and inside the waveforms with an ink edge, bordered panels and capital labels;
  - `peaksOf` and `wavePath` give fixed output for fixed input, and refuse bad input.

### What Anvil loads
All from `@v1.30.0`, with the hashes below:
- **The files:**
  - `dist/css/tokens.css` and `dist/identity/anvil-workout.css`. Take the sheet with the redesign, not before: it turns the site light only.
  - `dist/fonts/outfit.css` **and** `dist/fonts/jetbrains-mono.css`, for the numbers;
  - `dist/kit/kit.css`, `dist/kit/kit.js`, `ij-nav.js` and `ij-footer.js`.
- **The `.black` store fragments** (`anvil-workout.en.black.html`, `.footer.black.html`) and `anvil-workout.en.offer.json` for the JSON-LD.
- **The numbers:**
  - in `.ij-numeral`, with the 70 in `.ij-trait--number`;
  - a table of sets in `.ij-data` with `.ij-num` cells;
  - a highlight in `<mark>`.
- **`.ij-skip`** first in the body. No drawings, no photos and no credit line.

### What TonVault loads
All from `@v1.30.0`, with the hashes below:
- **The files:**
  - `dist/css/tokens.css` and `dist/identity/tonvault.css`. It turns the site light only, with bordered panels;
  - `dist/fonts/jetbrains-mono.css`;
  - `dist/kit/kit.css`, `dist/kit/kit.js`, `ij-nav.js` and `ij-footer.js`.
- **`dist/kit/wave.js`** at build time: `wavePath(peaksOf(samples, n), box)` on peaks from real samples, inlined in `<svg class="ij-wave">` with a label each.
- **The `.black` Mac App Store fragments** and `tonvault.en.offer.json`.
- **The lime:** `<mark>` for anything the lime should stand behind, and never the lime as a text colour.
- **The window and the labels:**
  - `.ij-window` for the hero loop and `.ij-tour--window` for the four jobs, from 1.28.0;
  - `.ij-label` for section labels.
- **The 8** in `.ij-trait--number`, with `.ij-traits--pairs` for the rules.
- **`.ij-skip`** first in the body. No drawings and no credit line.

## [1.29.1] — 2026-10-12

Two findings from Walkful's move to 1.29.0 (#88).

### Fixed
- **A stack lost its spacing to the kit's own margin resets.** `.ij-stack > * + *` spaces a stack's children. The type roles (`.ij-display`, `.ij-headline`, `.ij-title`, `.ij-numeral`, `.ij-wordmark`, `.ij-lede`), `.ij-source` and `.ij-review` each reset their own margin later in `kit.css`, as specifically, so the reset won.
  - **Where it showed:** a source card in a stack sat flush on its heading (Walkful works around it), and a second headline in a stack sat flush on what came before it (Wean's example).
  - **The fix:** the resets are now one rule, `.ij-page :where(…)`, placed just before the stack, so the stack wins. A site's own `h2 { margin }` still doesn't reach the kit's headings. `.ij-card` is in the rule too, so a `<figure>` can be a card without an inline `margin: 0`.
  - **The test:** checks that every later child of a stack, on all four examples, keeps the stack's spacing. Run against 1.29.0, it fails on Walkful's source card and Wean's second headline.
- **`<ij-nav>`'s landmark name stayed English.** Its `aria-label` defaulted to "Main" on every page. It now follows the page's language like the four words in 1.29.0: "Hovedmenu", "Hauptmenü", "Menú principal", "Menu principal", "Hovedmeny", "Huvudmeny". `label` still overrides it.

### What the sites change
- **Walkful** (walkful#205):
  - move `kit.css` and `ij-nav.js` to `@v1.29.1`;
  - its `.ij-stack > * + .ij-source` rule in `site.css` can go;
  - its `label="Hovednavigation"` may stay, since `label` still wins, or go, to take "Hovedmenu".
- **Wean:** take the same two files. If a card or source in a stack carries `margin: 0` of its own, drop it.
- **WODrounds:** the same two files. Its translated pages then name the nav landmark in their language.

## [1.29.0] — 2026-10-12

The last two findings from Wean's page (#80): the components speak the page's language, and the hooks are listed where a check can read them.

### Added
- **`<ij-nav>` and `<ij-footer>` print their own words in the page's language.** The four words are "Skip to content", "Menu", "More from IAMJARL" and "All projects". They were English on every page: Wean's Danish, Swedish and Norwegian pages and WODrounds' six translations all said "Menu" and "More from IAMJARL".
  - They now follow the nearest `lang` attribute in English, Danish, German, Spanish, French, Norwegian and Swedish, the languages the sites are written in. "no" and "nn" take Bokmål's words. Any other language falls back to English.
  - Attributes override a word: `skip-label` and `menu-label` on the nav, `more-label` and `projects-label` on the footer.
  - The table is `components/labels.js`.
- **A cross-link fragment per store language,** `dist/footers/<app>.<locale>.html`, with the portfolio link translated. App names stay as they are. English stays `<app>.html`.
- **`hooks.json` and `dist/hooks.json`: the names a site may meet that `tokens.css` does not define.** The hub's adoption check reported `--ij-display-weight` as a counterfeit token, because only `tokens.css` was there to read.
  - **`hooks`:** the eight a site may set, each with where it is read, its default and what it is for.
  - **`identity`:** the nine an identity sheet sets, read from the sheets as they are written, so the list cannot fall behind them.

  The package exports it as `@iamjarl/design-tokens/hooks.json`.
- **Tests:**
  - every store language has the four words, and an unknown one falls back to English;
  - the nav and footer bundles carry the table, and none of the words is hard-coded;
  - each language's fragment differs from the English one only in the portfolio link;
  - every hook in `hooks.json` is read where it says, with the default it states;
  - every variable the kit or a component reads is a token, an identity name or a listed hook;
  - in the browser, a Swedish page gets Swedish from both components, and an attribute still wins.

### What the sites change
- **WODrounds** (seven languages):
  - move `ij-nav.js` and `ij-footer.js` to `@v1.29.0`, with the hashes below. The other files may follow;
  - on each translated page, take the cross-link fragment in that page's language, `dist/footers/wodrounds.<locale>.html`, in place of the English one;
  - every page already has its `lang`, so nothing else is needed.
- **Wean** (English, Danish, Norwegian, Swedish): the same, with `wean-nicotine.<locale>.html`. Its Norwegian pages may carry `lang="no"` or `lang="nb"`; both get the Norwegian words.
- **Walkful:** its Danish page gets Danish words with the same bump, and `walkful.da.html` for its cross-links.
- **The hub's adoption check:** read `dist/hooks.json` before reporting a name that `tokens.css` does not define. A name in `hooks` is a site's to set; a name in `identity` comes from the site's identity sheet.

## [1.28.0] — 2026-10-12

It's mono's identity, its sampler drawings and a Mac window for the kit (#83). It's mono is the first Mac app on the kit.

### Added
- **It's mono's identity:** dark whatever the visitor's setting.
  - **Ground and cards:** a blue-black desk at night, `#0D0F13`, with cards `#161A21`.
  - **Text:** off-white `#EDEFF2` (16.7:1).
  - **Accent:** the app's lime `#D0FF00`, with black on it (18:1). The lime is its own text-safe accent (16.4:1).
  - **Face:** JetBrains Mono for headlines and every technical value.
  - **Bordered panels:** a new identity field, `"panels": "bordered"`, draws the kit's cards, traits and reviews with a thin line in the border colour, as in a hardware manual. The sheet sets `--ij-panel-border`, and a site without it keeps flat cards. The validator knows the field.

  It shares WODrounds' lime, the app's own, and is kept from reading as its template by the blue-black ground, the bordered panels and the drawings.
- **Eleven drawings in `dist/drawings/its-mono-yo/`:** eight sampler types, one beside each guide, and three close-ups for the statements. The owner chose eleven over reusing three.
  - **Types, never models:** no logo, no name, no text of any kind, and no detail that belongs to one machine. The tests refuse any text in them.
  - **One lime line in each,** the mono signal going in. Everything else is off-white.
  - Drawn through the loose stroke like Wean's: 133 KB together, 43 KB gzipped.

  | File | Drawing | For |
  |---|---|---|
  | `summed.svg` | Two channels summed into one line | Statement: correct mono |
  | `folder.svg` | A folder of samples going in whole | Statement: a whole folder at once |
  | `input.svg` | A plug in a sampler's input, on its back panel | Statement: the format your sampler wants |
  | `eurorack-module.svg` | A drum module in a modular rack | The Sample Drum guide |
  | `groovebox.svg` | A groovebox with a row of step buttons | The Digitakt guide |
  | `pad-sampler.svg` | A pad sampler | The SP-404 guide |
  | `eurorack-rack.svg` | A modular rack of sampler modules | The Eurorack samplers guide |
  | `crossfader.svg` | A larger groovebox with a crossfader | The Octatrack guide |
  | `drum-box.svg` | A small drum box | The Model:Samples guide |
  | `tracker.svg` | A tracker-style groovebox | The Polyend Tracker guide |
  | `pad-box.svg` | A box of large pads, with a big screen | The MPC guide |
- **`.ij-window`, a Mac window.** A Mac capture carries its own chrome, so the kit draws no frame. It clips the capture to the window's own corners at 2% of its width, a hair over the 1.9% measured on It's mono's captures, so the hero video's black-masked corners never show. It adds the border colour's edge. `--ij-window-width` sets its width.
- **`.ij-tour--window`, the window that stays.** The tour with windows in place of phones: the window takes the wider column and holds still while the texts pass. Under "reduce motion", or on a phone, it rests as a row.
- **`.ij-reviews` and `.ij-review`:** real reviews set as type, word for word, with name and country. No stars and no avatars. A card beside them can say what backs them.
- **`.ij-traits--pairs`** stands many short traits two a row on a phone, instead of one long column. A long title in a trait now wraps inside its card.
- **The kit's It's mono example,** `kit/its-mono-yo.html`, shows every section in that identity with the app's current captures and public copy. It is on the docs page beside the other three. The browser tests run it at 1440 and 375 px and check:
  - the window's clip and edge, and the bordered panels;
  - the eleven drawings at a readable size, with one lime line each;
  - the window that stays;
  - that nothing spills past its card.

### What It's mono loads
All from `@v1.28.0`, with the hashes below:
- **The files:** `dist/css/tokens.css`, `dist/identity/its-mono-yo.css`, `dist/fonts/jetbrains-mono.css`, `dist/kit/kit.css`, `dist/kit/kit.js`, `dist/components/ij-nav.js` and `ij-footer.js`. Take the identity sheet with the redesign, not before: it turns the site dark only, and today's theme toggle goes.
- **The `.white` Mac App Store fragments:** `dist/store/its-mono-yo.en.white.html` in the hero and `.footer.white.html` at the close, plus `its-mono-yo.en.offer.json` for the JSON-LD.
- **The eleven drawings, inlined** from `dist/drawings/its-mono-yo/`, each in the place the table above names, beside the guide link that names the model in text. Not as `<img>`, or they lose the tokens.
- **The window:** `.ij-window` around the hero's `video.ij-loop`, with its poster, and `.ij-tour--window` for the tour's three captures.
- **The rest of the page:**
  - `.ij-reviews` for the two reviews;
  - `.ij-traits--pairs` for the 8 and the samplers;
  - `--ij-wordmark-em: 8.6` on the closing "It's mono, yo!";
  - `.ij-skip` first in the body (1.27.0).
- **The credit line:** one plain line in the footer's fineprint, "Illustrations drawn with AI". No badge (#71).

## [1.27.0] — 2026-10-12

Three kit fixes found on the live sites (#80, #84), before It's mono's page is built on the kit (#83).

### Fixed
- **The tour's row of screens hid its first screen on a phone** (#80). The row was centred, and a centred row wider than its scroller overflows on both sides. The part past the start edge can't be scrolled to. At 375 px the first screen sat 182 px past the edge on Walkful and WODrounds, as Today and EMOM setup. Now the row starts at the edge when it overflows and stays centred when it fits.
- **`<ij-footer>` without JavaScript showed its links twice** (#84). Before a custom element upgrades, the browser shows all its children. That included the slotted links and fineprint as well as the hand-written fallback, so the cross-links and "© 2026 IAMJARL." appeared twice. `kit.css` now hides the slotted children of a footer that has a fallback, until it upgrades. A footer without a fallback still shows its slotted content. The README has the one rule for a site without the kit.
- **The kit's WODrounds example showed marks on its gym photos:** lettering on the wrist wraps, logos on the shorts and the waistband, and a beard. The hub's review on WODrounds#182 found them, and WODrounds#190 cleaned WODrounds' own copies. The example now loads those, pinned to the merge commit, with the new 1280 px step. The barbell is cropped to 1920 × 1164.
- **The kit's link rule took over a page's skip link** (#84). It coloured every link in the accent, which beat the page's own `.skip-link`. On WODrounds the focused skip link was lime on lime, under the sticky nav.

### Added
- **`.ij-skip`, the kit's skip link.** Put it first in the body: `<a class="ij-skip" href="#main">Skip to content</a>`.
  - It works without JavaScript.
  - It stays hidden until it takes focus, then shows above `<ij-nav>`.
  - It is drawn in the accent with its on-accent text, which the validator already holds to AA.
  - The link rule leaves it alone.
- **`<ij-nav>` leaves out its own skip link** when the page has one to the same target before the nav. Then there is one stop, not two. A page without one keeps the nav's.
- **The browser tests** check, at 375 px on all three examples, that the row starts at the edge. With reduce motion at 1440 px, they check that it stays centred. They check that the first Tab lands on `.ij-skip`, above the nav and at AA, with no second skip link. They check that a footer renders once with and without JavaScript. Run against 1.26.0, all of these fail.

### What Walkful, Wean and WODrounds change
- **Walkful,** on 1.22.0 today:
  - move every file to `@v1.27.0`, `ij-nav.js` and `ij-footer.js` included, with the hashes below. Nothing between 1.22 and 1.27 changes its page except fixes, and its `site.css` workaround for the link rule (1.22.1) can go;
  - add `<a class="ij-skip" href="#main">Skip to content</a>` first in the body. Today its only skip link is the nav's, which needs JavaScript;
  - the tour and the footer are fixed by the version bump.
- **Wean,** building its page (wean-nicotine#397):
  - build on `@v1.27.0`;
  - remove the three-line tour workaround (`.ij-tour:not(.is-live) .ij-tour__screens …`), since the kit does it now;
  - replace its `.skip-link` and the CSS for it with `.ij-skip`.
- **WODrounds,** on 1.26.0:
  - move every file to `@v1.27.0`;
  - replace `<a class="skip-link" href="#main">` with `<a class="ij-skip" href="#main">`, and delete the `.skip-link` CSS;
  - its footer's fallback line then shows once without JavaScript, and the tour starts at the edge, with no change on the page.

## [1.26.0] — 2026-10-12

A photo scene for a site's mood (#81), first for WODrounds' gym photos. The owner brought them back on 2026-10-12: the numbers stay the picture, and the photos set the mood around them.

### Added
- **`.ij-scene` in `kit.css`** lays a photo across the page:
  - **as a band of its own between sections,** with nothing written on it;
  - **or behind a section's words,** such as the closing wordmark and store button.

  The photo goes black and white, so the site's accent stays the only colour. It is dimmed toward the ground and fades into it at the foot, so the scene meets the next section without a seam.

  Words on a scene keep the photo's room above them, sit on a scrim of the ground that follows them, and all take the primary text colour. So they read at AA over any photo. The browser tests paint the worst case: a white photo under a dark site and a black one under a light site. They hide the words, read every pixel under them, and need 4.5:1. With the scene they measure at least 8.5:1; without the scrim the test fails at 2.5:1.

  One new hook, `--ij-scene-height`, sets a band's height.
- **Rules the contract tests hold to:**
  - never in the hero;
  - at most two on a page;
  - every photo decorative (`alt=""`) and loaded lazily;
  - nothing that moves.
- **The WODrounds example shows two scenes,** both from WODrounds' own repo:
  - the barbell on a chalked floor, as a band between the timers and the tour;
  - the kettlebell, behind the closing wordmark and store button.

### What WODrounds loads
- **`dist/kit/kit.css` from `@v1.26.0`,** with the hash below. Move the other files to `@v1.26.0` too, so the page loads one version. Only `kit.css` changes what the page does.
- **Two scenes at most,** with photos from WODrounds' own repo. The photos are not shipped from here. The old site's `docs/images/unsplash/`, in its git history, has them:
  - `victor-freitas-qZ-U9z4TQ6A` (the barbell), 77 KB at 960 px and 268 KB at 1920;
  - `ambitious-studio-rick-barrett-0tQLfwcr5-M` (the kettlebell), 48 and 206 KB.

  Use `srcset` with both widths, `loading="lazy"` and `alt=""`. Leave out the plank, whose rower shows its brand.
- **The markup** is in the README and in `kit/wodrounds.html`.
- **The brief** in WODrounds#182 said the gym photo goes. The owner's decision on 2026-10-12 brings two back, for the mood.

## [1.25.0] — 2026-10-12

WODrounds' identity, the first dark site, and frames for Apple TV and Watch (#78).

### Added
- **WODrounds' identity**, from its site brief: dark whatever the visitor's setting, near-black `#0B0C0D` with cards `#17191B`, off-white `#F2F3EF` for text (17.6:1), the app's lime `#D0FF00` for the accent with black on it (18:1), and JetBrains Mono for headlines and numbers. The lime reads as text on the near-black (16.8:1), so it is its own text-safe accent. No drawings: the numbers are the picture.
- **`.ij-tv` and `.ij-watch`,** an Apple TV and an Apple Watch framed the way `.ij-phone` frames a phone: generic and black, with an edge from `--ij-color-border-default` so they stand out on a dark ground, and nothing unique to Apple's hardware. The TV stands on a short foot and the watch has two plain straps. They are sized by `--ij-tv-width` (560 px by default) and `--ij-watch-width` (170 px). A screen can also go frameless as a piece in a card. `.ij-trait--wide` lets a trait, such as the TV's, span two columns on a wide screen.
- **The kit's WODrounds example,** `kit/wodrounds.html`, shows every section in WODrounds' dark identity with its public screenshots and copy: the hero phone, the timers as frameless pieces, the tour, the platforms with the Watch and TV frames, privacy and price, and the closing wordmark. The browser tests run it at 1440 and 375 px for a visitor in light and in dark mode, and check that `.ij-numeral`'s digits are tabular (all ten measure the same in JetBrains Mono) and that the frames keep their shape and their edge.

### Changed
- The dark sketch from 1.24.1 (`kit/dark.html`, `kit/sketches.js`) is retired: WODrounds' real identity replaces it, in the example, the tests and the docs page.

### What WODrounds loads
All from `@v1.25.0`, with the hashes below:
- `dist/css/tokens.css`, `dist/identity/wodrounds.css` (with the redesign, not before: it turns the site dark only), `dist/fonts/jetbrains-mono.css`, `dist/kit/kit.css` and `dist/kit/kit.js`.
- **The `.white` store fragments,** since the ground is always dark: `dist/store/wodrounds.<locale>.white.html` in the hero, and `.midpage.white.html` and `.footer.white.html` further down, for each of its seven languages.
- **`--ij-wordmark-em: 5.2`** on the closing wordmark, for "WODrounds" in JetBrains Mono.
- **`.ij-tv` and `.ij-watch`** for the Apple TV and Watch screenshots, or the screens frameless in cards.
- No drawings, and so no credit line in the footer.

## [1.24.1] — 2026-10-12

The kit, made ready for a site that is dark, before the first one asks (#65). Neither flagship is dark, but WODrounds, whose brief is being written, may be, and so may the Mac sites. Trying the kit in the dark found two things.

### Fixed
- **The phone vanished into a dark ground.** Its black frame had no edge against near-black. It now takes one from `--ij-color-border-default`, which is invisible on a light page and draws the phone out of a dark one.
- **The closing wordmark could run past its column.** "WODrounds" in JetBrains Mono is 5.1 em wide: 1,231 px on a 1,100 px column on a desktop, and 404 px on a 390 px phone, where it pushed the page sideways. The wordmark now grows to the scale's size but never wider than its column. A site with a long name or a wide face sets `--ij-wordmark-em`, the word's width in em (about 5.2 for that one). The default, 4, suits a name of six or seven letters in a proportional face, and Walkful's and Wean's wordmarks are unchanged.

### Added
- **A dark example,** `kit/dark.html`: every section under a sketched identity that is dark whatever the visitor's setting, with a mono face and WODrounds' public copy. It is not WODrounds' identity, which comes from its brief. The sketch lives in `kit/sketches.js`. The validator holds it to an app's rules, and its sheet is written by the same code as an app's. The browser tests run it at 1440 and 375 px for a visitor in light and in dark mode, and check that a drawing on it takes the light ink and keeps its magenta waterline.
- **`scripts/css-modes.js`:** the CSS for a mode's colours and for an identity sheet, moved out of `build.js` unchanged (every file in `dist/` is byte for byte the same). The tests can now generate and check a sheet no app has yet, such as a dark-only one.
- A third hook, `--ij-wordmark-em`, documented with the other two.

## [1.24.0] — 2026-10-12

Wean's drawings, and a loose stroke for a line drawn from data (#75).

### Added
- **Eight drawings on one theme, coast and tide,** a misty morning with the tide going out. In each, the waterline is the one magenta line and it steps down from left to right, as Wean's allowance does. Everything else is charcoal, with no faces and nothing of what Wean helps you cut down. In `dist/drawings/wean/`:

  | File | Drawing | For |
  |---|---|---|
  | `shoreline.svg` | A low shoreline in morning mist | The hero, under the headline |
  | `flat-rocks.svg` | The tide going out over flat rocks, in steps | Less, a little at a time |
  | `stones.svg` | One wave reaching a little higher up the stones while the tide still falls | A day over is met with calm |
  | `mooring-post.svg` | A mooring post with tide marks, the water at a lower mark | Your pace, your plan |
  | `harbour-steps.svg` | Harbour steps going down into still water | Beside the taper staircase |
  | `breakwater.svg` | A breakwater, rough sea beyond it and calm water behind | The tour step for the craving tools |
  | `boat.svg` | A small boat pulled up on the sand, its rope to a post | Privacy and price |
  | `low-tide.svg` | The open shore at low tide, wide and quiet | The closing, above the wordmark |

  They are written as SVG from descriptions in `kit/drawings/wean.js`, all through one loose stroke, so they share a hand. 60 KB together, 25 KB gzipped. The colours are tokens only: the magenta is `--ij-color-accent`, the ink `--ij-color-text-primary`.
- **`kit/loose.js`**, published as `dist/kit/loose.js` with an SRI entry: `loosePath(points, { seed })` draws a line in the drawings' hand, and `stairsPoints(values, box)` turns a run of values into a staircase. Deterministic, so a page builds the same every time, and pure, so it runs at build time with no JavaScript shipped. `kit.css` adds `.ij-loose` for the line (the accent, 3 px, kept at that width at any size), `.ij-staircase` for its SVG, and keeps every drawing's strokes at their width on screen.
- **The kit's Wean example** shows the eight drawings in their places and the taper staircase. The staircase is computed with Wean's own maths for 10 a day at 10% a week, in whole pouches: 24 weeks, big steps first and a long run at one a day. Its values are in the page as text. The example's copy now follows Wean's page brief.

### What Wean loads
All from `@v1.24.0`, with the hashes below:
- `dist/css/tokens.css`, `dist/identity/wean-nicotine.css` (with the redesign, not before), `dist/fonts/instrument-sans.css`, `dist/kit/kit.css` and `dist/kit/kit.js`, as for Walkful.
- **The eight drawings, inlined** in the page from `dist/drawings/wean/*.svg`, each in the place the table above names. Not as `<img>`, or they lose the tokens.
- **The staircase:** `loosePath(stairsPoints(values, …), { seed })` from `kit/loose.js`, run at build time on the values from `lib/taper-plan.ts`, in an `<svg class="ij-staircase">` with a `<path class="ij-loose">`. Put the values in the page as text too.
- The credit stays one plain line in the footer's fineprint, "Illustrations drawn with AI", and no badge (#71).

## [1.23.0] — 2026-10-11

Wean's identity, the second flagship after Walkful (#65).

### Added
- **Wean's identity**, from its site brief: light only, a misty grey-blue `#E6ECEF`, charcoal `#22292E` (12.4:1), cards `#F5F8F9`, the iPhone icons' magenta `#F140FE` for strokes and fills with black on it, `#A80FB3` for text (5.2:1 on the grey-blue), and Instrument Sans for headlines. It shares Walkful's magenta and differs in ground and face: cool where Walkful is warm, a humanist sans where Walkful has a serif.
- The kit's Wean example now loads Wean's own identity sheet instead of the sketch it carried.

### Note for Wean
Its 1.23 identity sheet turns today's dark navy and lime site light. Take it with the redesign, not before.

## [1.22.1] — 2026-10-11

What Walkful hit when it went live on the kit (#72, #71).

### Fixed
- **The kit's link rule reached into the components** (#72). `.ij-page a` coloured every link on the page, including the ones slotted into `<ij-nav>` and `<ij-footer>`, because a page rule beats a component's `::slotted` rule whatever its specificity. So the nav's Download button had deep magenta text on its magenta fill, about 2:1 where the nav means black at 6.9:1, and the nav's and the footer's links turned magenta. The rule now leaves anything with a `slot`, and anything inside one, to the component. Before the components are defined, as without JavaScript, their links take text colours.
- **`<ij-footer>` started at the window's edge** in a kit page, being a block with no width of its own. Placed straight under `.ij-page`, it now takes the content width.
- The kit's own tests missed both: the contrast check read only `main`, and the nav's CTA was tested on a page without the kit. Both demos are now checked at 1440 and 375 px for the CTA's text against its fill, for no accent text in the nav, and for the footer lining up with the content. Run against 1.22.0's stylesheet, the new check fails on all three.

### Added
- **The rule on Made by Human and AI wording, where sites read it** (#71). No badge and no AI-authorship wording on an app site; the badge belongs in the README. Two exceptions, one line each: an authorship note on an editorial article, and a credit for drawings made with AI in the footer's fineprint, such as "Illustrations drawn with AI, finished by hand" (the owner's decision). A contract test holds the demos to it.

## [1.22.0] — 2026-10-11

Each app site gets its own personality, and the system gets a kit to build them with (#65). Side by side, twelve of the thirteen app sites were near-black, with the same accent, the same layout and a small product in a dark void, because each took one accent and one face per family. The owner decided on 2026-10-11 that every site gets its own; Walkful is the pilot, and Wean follows.

### Added
- **Per-app site identity** (#67). Each app declares its own `identity` in `apps.json`: `background`, `surface`, `text`, `accent`, `accentText`, `display`, and optionally `scheme` for a site with one mode. `dist/identity/<app>.css` sets only what an app declares, under the tokens' own names, plus `--ij-color-accent`, `--ij-color-on-accent`, `--ij-color-accent-text` and `--ij-font-display-axes`. A one-mode sheet holds every colour in its mode whatever the visitor's setting. The validator holds text to 7:1, the text-safe accent and both derived greys to AA on the ground and the cards, and the accent able to carry black or white.
- **Walkful's identity:** light only, sand `#F5EFE6`, charcoal `#2B2825`, cards `#FFFCF7`, the icons' magenta `#F140FE` for strokes and fills and `#A80FB3` for text, Fraunces for headlines.
- **Fraunces, soft,** as a fourth display face, `serif` (#66): 62 KB, OFL-1.1, from Fontsource 5.3.0. Its file carries the `SOFT` axis, which rests at the sharp end; the identity sheet carries `'SOFT' 100` and the kit and `<ij-nav>` apply it. The owner chose it over Young Serif and Newsreader after seeing all three on Walkful's hero; the comparison is on #65.
- **The marketing scale** (#68), separate from the app scale: `--ij-mkt-*` for display (52 to 96 px), headline, title, lead, body (from 18 px), small, numeral and wordmark, the section rhythm and the content width (1,100 px). Fluid between a 375 and a 1280 px viewport, in rem. Web only.
- **The marketing kit** (#68): `dist/kit/kit.css`, sections in plain HTML that read in full without JavaScript. A hero, split or centred; a straight phone, drawn in CSS until a site's drawn frame lands (never Apple's bezel: its licence forbids it); statements with one drawing each; frameless pieces in a bento or alternating rows; the phone that stays; where-it-works traits with one large number; privacy and price; a maker note; a dated source; a closing wordmark. No colour of its own.
- **The kit's motion** (#69): `dist/kit/kit.js`, the system's own 3 KB module, no library. A muted screen recording plays while it is on screen; the phone that stays holds still while the feature texts scroll past and crossfades its screen with the motion tokens. Nothing animates in, nothing is dimmed, and under reduce motion, on a phone or without the module, the resting state is the whole page.
- **Two demo pages,** `kit/walkful.html` and `kit/wean.html`: every section under Walkful's identity and under a sketched Wean identity (cool grey-blue, a humanist sans), shown live on the docs page with the whole scale.

### Changed
- **The family layer is gone.** Every family's accent and face were copied onto its apps, so the twelve other sheets carry exactly the values they had, and still set `--ij-color-accent-family`, now as the text-safe accent. `<ij-nav>` and `<ij-footer>` read the new names first and fall back to the old ones; the nav's CTA puts `--ij-color-on-accent` on the accent.
- `scripts/browser.js` can set a scale factor and take a screenshot, for pictures a person has to judge.
- MIGRATION.md's table, sorted in 1.21.0, now also covers the identity switch in its own section.

## [1.21.0] — 2026-10-11

The store button after its first two pilots, Anvil Workout and Patternaut (#63). Most of the portfolio's sites have no build step, so they paste the fragment by hand, and anything the fragment left to JavaScript was wrong in the served HTML: the badge on an always-dark site, and the placement of every repeat.

### Added
- **A fragment per placement and tone.** `dist/store/<app>.<locale>.<placement>.html` for `midpage` and `footer`, and `.black.html` / `.white.html` (also after a placement) with one `<img>` of that tone and no `<source>`. A site that pastes the right file serves the right click event and badge with no script. 23 locales × 9 variants, from the same `badgeHtml()`.
- **`dist/store/<app>.<locale>.offer.json`**: the JSON-LD `Offer` for the page's storefront, with the price as a number in its currency (`29,00 kr` becomes `"29.00"`, `DKK`), so the structured data quotes the same price as the facts line. Its `url` is the plain store page, without the campaign. The validator now refuses a price that `offer()` cannot read.
- **Integrity hashes in every release's notes.** `release-notes.js` appends a table of every file in `dist/sri.json` for the tag, so nobody computes one from the CDN file again. The README's SRI block now includes `ij-store-cta.js`.
- **README:** which file goes where; that a site with no build step refreshes by hand and checks the version in the comment; a layout snippet for the fragment (`display: block` on the element, a column with a muted facts line, the facts selector doubled to outrank a section's own `p` rule, a hero height on the `img`); that the nav fragment's `slot="cta"` is harmless outside `<ij-nav>`; and a note on mixing versions.

### Changed
- **No em-dash in any generated file.** The portfolio's voice rules ban it, and a site cannot fix a comment in a file marked "do not edit", so every paste brought one back. The generator's comments and the component sources that bundles inline now use colons and commas. A contract test checks `dist/`, `Sources/` and `Tests/`.
- `<ij-store-cta>` renders a fixed tone directly when it builds the fragment from the registry.

### Not in this release
- **A check that a site's pasted fragments still match `dist/store/`.** The hub builds it on its side, next to its footer check.
- **The campaign in the Smart App Banner.** Apple's documentation of the banner names only `app-id` and `app-argument`, and its staff in the forum thread the hub cited say to use the tokens without saying how. The `affiliate-data=pt=…&ct=…` form comes from other developers, and the one in that thread who tried it saw no campaign data. The banner keeps `app-id` alone until there is something to confirm it.
- **A facts file for meta descriptions and FAQs.** The Offer covers the JSON-LD. The rest can follow if a site asks.

## [1.20.0] — 2026-10-10

The store button, from the registry (#58). Every site used to write its own store link and the facts beside it, and the hub's audit found them drifting: campaign parameters missing on four sites, the click event on two, a price wrong on one, an OS requirement wrong on another.

### Added
- **Store facts in `apps.json`** for all 13 apps that sell or list somewhere: platform, store ID, the minimum OS as Apple states it, the price per storefront in the store's own wording, and the site's page locales. TrimrPix for Mac also names its iPhone sibling. The IDs came from the live sites and the prices and OS floors from Apple's lookup API. English pages quote the US store, and translated pages their own country's (the owner's call): WODrounds in seven languages, Wean in four, Walkful in two.
- **`components/store.js`**, pure, builds everything a button prints:
  - **the link,** with the portfolio's campaign (`pt=128512007`, `ct=site`, `mt=8` or `mt=12`)
  - **the `store-click` event,** with store, placement and locale
  - **the facts line,** in seven languages: *"$2.99 once · iOS 16 or later"*, *"29,00 kr engangskøb · iOS 16 eller nyere"*
  - **the right badge** for the platform, locale and tone
- **`dist/store/`**, 52 generated fragments:
  - per app and locale, the badge with its facts line, plain HTML for the served page
  - a `.nav.html` text link for `<ij-nav>`'s CTA, since Apple allows one badge per layout
  - a `.head.html` Smart App Banner wherever there is an iPhone app
- **`<ij-store-cta>`** (`dist/components/ij-store-cta.js`, with SRI):
  - sets the event's placement and locale on the fragment it wraps
  - pins the badge's tone for an always-dark site
  - renders the fragment itself from the registry when left empty
- **`badges/`:** Apple's App Store badge in black and white in seven languages, the Mac App Store badge, and the Chrome Web Store badge. They were downloaded with the owner's approval from Apple's Marketing Toolbox and Google's branding page, verified, and shipped unedited with a README of their rules.
- **A weekly check** (`.github/workflows/store-facts.yml`, `scripts/check-store-facts.js`). It compares each app's price and OS floor with Apple's lookup API, in every storefront its pages use, and keeps one issue here while they differ, closing it when they agree. It never edits `apps.json`. Today all 21 lookups agree. A planted wrong price and OS floor were both reported.

### Checks
- `validate.js` refuses a store entry with an unknown platform, a malformed ID, a missing price for one of its locales, or a missing badge.
- **Contract tests (13)** hold the link, the facts in four shapes, and every one of the 23 app-and-locale fragments to the registry.
- **Browser tests:**
  - the fragment works with no JavaScript, with the badge loaded at 40 px
  - the Danish page gets the Danish badge and facts, and dark mode gets the white badge
  - the element renders from the registry, `tone` pins the badge, and an unknown app renders nothing and says why
- The docs page shows the button live.

### Notes
- Apple writes prices with a no-break space before the currency (`29,00 kr`). It is kept, because the weekly check compares Apple's exact string, and because the amount should not break across lines anyway.
- **Badge heights:** Apple's at its 40 px minimum, and the Chrome Web Store's at 58 px, the smallest size Google publishes. At 40 px Google's words were unreadable, which was only visible on screen, so the fix came from a visual check.
- A QR code for iPhone-only apps on desktop is a later step (the owner's call).

## [1.19.0] — 2026-10-09

Echolume adopted the whole stack, and two findings came back from it (#57).

### Changed
- **`<ij-footer>`'s hover and focus ring follow the family accent**, with the primary as fallback. On Echolume the site was teal everywhere and turned lime on footer hover, because the footer read only `--ij-color-primary` while `<ij-nav>`'s dot and CTA read the accent. On the footer's opaque ground, every accent is safe as text: `validate.js` holds each one to 4.5:1 on `background.app`. The reason the nav keeps the accent off its links — a translucent bar — does not apply here. A site without an identity sheet sees no change.
- **Echolume is registered as a consumer.** It is the first site on the whole stack: `<ij-nav>`, `<ij-footer>`, `tokens.css`, Outfit and its identity sheet, all from v1.18.1 with `integrity`, with the cross-links in the served HTML. Eight sites now render the footer.

### Documented
- **A global link colour overrides the components.** Page CSS beats `::slotted()`, so a site-wide `a { color: var(--accent) }` paints every slotted nav link in the accent, which on the translucent bar is the 3.86:1 case. Echolume scoped its rule with `a:where(:not([slot]))`, and the README now says so for every adopter.

### Tests
- A browser test resolves the footer's hover colour under Echolume's identity sheet (the accent) and without one (the primary). It was checked by putting the primary back.
- **The browser-test harness could hang on shutdown.** After a Chrome update from 153 to 155, the suite finished its checks in 4 seconds and then sat waiting. It ran up to 90 seconds, sometimes past the deadline. Chrome 155 can close the DevTools socket before it answers `Browser.close`, and the harness waited on that answer forever. Every shutdown step is now bounded, ending in `SIGKILL`, and the fixture server closes its keep-alive sockets at once. Five runs in a row: 7–9 s, no Chrome left behind.

## [1.18.1] — 2026-10-07

### Fixed
- **`<ij-footer>` drew an empty group when a site had no links of its own.** The group for `slot="links"` was always rendered, so a footer without own links showed a label above an empty row, and its gap. It's mono had set `links-label=""` to hide the label and still got the row. The group is now rendered only when there are links for it. Of the six live footers, It's mono is the only one without own links, so it is the only page that changes, and only by losing the empty space. Browser tests cover both cases, and were checked by forcing the group back.
- **`COMPONENTS.md` pinned a file that never existed**, `dist/components/index.js` at v1.3.0. The proposal planned an index, but the components shipped as one file each. The example now shows what was built.

### Checked, not changed
- **PageLens' cross-links do reach crawlers.** An earlier note here said they could not, because the site renders in the browser. It was wrong: a build plugin inlines the design system's fragment into the served HTML, and all five links are there, matching `dist/footers/pagelens.html`. No issue was filed.

## [1.18.0] — 2026-10-07

The two questions 1.15.0 left open, answered by the owner (#53) and written down where they bind.

### Decided
- **Icons: Phosphor on the web, SF Symbols in native apps, one set per app.** SF Symbols follow Dynamic Type, take the weight of the text beside them, carry accessibility labels, and match the system font `.ijFont` scales. The surfaces the system draws itself — widgets, Live Activities, tab bars, the watch — use them anyway, so an app on Phosphor ends up with both sets. Counted from `main`: Anvil uses Phosphor 93 times in its app and SF Symbols 13 times in its watch app, widgets and tab bar; TrimrPix (5) and TonVault (27) use Phosphor only; the other native apps already use SF Symbols.
- **Family accents: on the sites only.** They group the products on the web. Inside an app the user is already in the product, and the app's colour belongs to its icon — Anvil's App Store icon is magenta, which the fitness lime would clash with.

### Changed
- `design.md`: the icon section is now one rule per platform, with native sizing tied to the text rather than to points. The family-accent section says sites only.
- `AGENTS.md` rule 5 and the README say the same.
- **`tokens.json` names both sets:** `brand.icons.library` stays `phosphor` (the web, which the TypeScript export serves), and `brand.icons.nativeLibrary` is `sf-symbols`. The docs page shows both.

### Held by tests
- Contract tests check that `design.md`, `AGENTS.md` and `tokens.json` state both rules.
- **The Swift package must carry no family accent**, so if one is added "for consistency" the test fails and says why. It was checked by adding one.

### Follow-ups
Issues in Anvil, TrimrPix and TonVault, with each app's icons counted and listed. Anvil's mix is the first to fix; TrimrPix and TonVault can move with their next release.

## [1.17.1] — 2026-10-07

The docs page, rebuilt so it cannot fall behind again, and a token bug the rebuild found on its first render.

### Fixed
- **`--ij-font-mono` drew as serif in Chrome.** It was `ui-monospace` and nothing else. Chrome accepts that name — `CSS.supports` says yes — but has no font behind it, so it falls back to the default serif. Measured: `ui-monospace` renders `iiii` and `MMMM` at 18 and 57 px, exactly as `serif` does, where a real monospace gives 39 and 39. Every site that set code or numbers in `var(--ij-font-mono)` has shown Times in Chrome since the token existed. It is now `ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace`.
- **`--ij-font-ui` gets the same protection**: `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`. `system-ui` does work in current Chrome; the fallback covers the browsers where it does not.
- **`validate.js` requires every font stack to end in `sans-serif`, `serif` or `monospace`**, the generics browsers actually implement. The display stacks already did; the two base stacks were the ones that did not.

### Changed
- **`index.html`, the docs page at jarllyng.github.io/iamjarl-design, is rebuilt.** The old one had not changed since v1.0.0 (2026-05-31). It fetched `tokens.json` live, so it printed the current version, but drew only what its code knew in May: 9 of the 21 colours per mode, no scales, nothing from after 1.0. It also offered the state **fills** with a copy button and never the text-safe `state.*` colours, which invites exactly the mistake rule 7 forbids.
  - **What it shows now:** every token, in both modes side by side whatever the page's mode. That covers all 21 colours with contrast computed by `scripts/color.js`, the fills against the text colours (rule 7, with numbers), gradients with the build's own verdict, the text scale, weights, numerals, the three display faces loaded from `dist/fonts/` and drawn in themselves, the families with their accents and faces, every scale, and live `<ij-nav>` and `<ij-footer>`. Each row carries its CSS variable and its Swift name.
  - **It uses what it documents:** tokens only, the shipped faces, and `<ij-nav>` as its own navigation. It works at 375 px with no horizontal scroll.
- **A browser test now holds it to `tokens.json`.** It fails if any token in the file is missing from the page (125 today), if any CSS variable it prints is not in `tokens.css` (83), if any Swift name is not in the package (78), if a shipped app or family is missing, if anything loads from Google Fonts, or if the page scrolls sideways at 375 px. Each check was mutation-tested: an unknown token group, a wrong variable prefix, and the old mono stack.

## [1.17.0] — 2026-10-04

The three display faces ship from the design system, so thirteen sites do not each commit the same files. And a bug in `<ij-nav>`'s `cta-after`, found while adding the font tests.

### Added
- **`fonts/`**: the variable latin woff2 of JetBrains Mono (40 KB), Outfit (32 KB) and Instrument Sans (30 KB), each beside its OFL-1.1 licence. They are Fontsource's v5.3.0 subsets, and `tokens.json` records each one's file, weight axis and source. The package now ships `fonts/`.
- **`dist/fonts/<face>.css`**: one generated `@font-face` per face, exported as `@iamjarl/design-tokens/fonts/*` and hashed in `sri.json`. The `font-family` comes from the same stack `--ij-font-display` uses, so the two cannot name different families. The url is relative, so it finds the woff2 on jsDelivr at the same tag and inside `node_modules` alike.
- **Checks:**
  - `validate.js` fails a face without its woff2, with a file that is not woff2, without its OFL licence (the licence is the condition of redistribution), or with a malformed weight range.
  - Contract tests hold each sheet's family, weight and url to `tokens.json`.
  - A browser test loads all three faces through their sheets and checks that each woff2 came from `fonts/`.

### Why ship them, which design.md had deferred
1.16.0 asked thirteen sites to self-host the same three files, and five of them load fonts from Google Fonts today. Thirteen copies drift. jsDelivr is already the third party the sites accepted for `tokens.css`, so loading the faces from the same pinned tag adds no new one. A site with a build step gets them from `node_modules` and serves them itself.

### Fixed
- **`cta-after` could leave the nav's CTA hidden for the rest of a visit.** An IntersectionObserver callback can carry several entries for one target. If the page scrolls before the first delivery — a visitor landing on `/#download`, for one — the stale "hero on screen" entry and the fresh "gone" one arrive together. The component read the first. The browser test that checks the CTA returns after scrolling failed in 3 runs of 10 because of it.
  - **The fault was in the component.** An earlier read blamed background-tab throttling in the test harness; disabling throttling changed nothing, and an observer log showed both entries in one callback.
  - **The fix:** the decision is now a pure function, `heroOnScreen()` in `nav-rules.js`, which takes the last entry and is contract-tested with a batched pair. The reproduction ran 0 failures in 40, and the full browser suite 0 in 10.
  - **Impact:** no site uses `<ij-nav>` yet.

## [1.16.0] — 2026-10-04

Every family's display face is assigned. The owner's decision, from #50; the mechanism shipped in 1.11.0 and has been waiting. Closes #50.

### Added
- **Seven declarations in `apps.json`**: `fitness` and `music` take JetBrains Mono (`mono`); `web-tools` and `images` take Outfit (`geometric`); Walkful and Wean override to Instrument Sans (`humanist`), and Echolume to Outfit. Both production claims behind them were checked against the live sites: WODrounds' site sets JetBrains Mono, and Echolume's sets Outfit.
- **`--ij-font-display` in 13 identity sheets** — every shipped app in a family. iamjarl.com and Made by Human stay outside and get none.
- **The assignments in `design.md`**, with the reasons for the three exceptions.

### What changes on a page
Nothing changes on a page by itself. A site picks the face up by self-hosting the file and using `var(--ij-font-display)` where its voice belongs, which `design.md` already describes.

**The one exception is `<ij-nav>`.** Its wordmark is set in `--ij-font-display`, so a site that loads both the nav and an identity sheet at 1.16.0 gets its wordmark in the family face — or in the fallback if the file is not there, which for a mono family is `ui-monospace`. No site loads both today; the note is in `MIGRATION.md` and `design.md` for the first that does. Echolume, the nav pilot that loads its sheet, sets Outfit already, which is the face it is assigned.

### Tests
The contract test that asserted *no family has been assigned a face yet* was correct until this release and is replaced by the invariants that outlive it: a family's face reaches every app in it unless the app names its own, an app outside every family gets none, and every sheet with a face emits its stack along with the self-host note. Each was checked by breaking what it guards. A browser test confirms the nav's wordmark renders in Outfit under Echolume's sheet.

## [1.15.0] — 2026-10-03

The Swift package, made for apps. It was the web system translated mechanically, and the apps had each been filling the same gaps on their own: of the eleven that import it, nearly all carry a theme layer beside it. This release puts those layers in the package.

### Added
- **`DesignTokens.Palette`** — every mode-aware colour, resolving light or dark by itself: `Palette.primary`, `Palette.Text.secondary`, `Palette.State.error`. Nothing to pass, so it works in a widget, a `.tint()`, a `ShapeStyle` or a UIKit/AppKit view, not only inside a body that has read `colorScheme`. It replaces what Walkful wrote by hand (*"the package gives separate Light/Dark colours; we wrap them here"*), down to the `onPrimary` it had to hardcode as hex because of the API's shape. UIKit on iOS and tvOS, AppKit on macOS; on watchOS, which has one appearance, the dark value.
- **`DesignTokens.adaptive(light:dark:)`** for an app's own derived colours, such as Walkful's ring track.
- **`.ijFont(_:weight:design:)`** — the text scale under Dynamic Type. Exactly the token at the default size, scaling along the nearest Apple text style (`caption` for `xs` … `largeTitle` for `xxl`), with the token's line height. A fixed `.font(.system(size: Size.base))` stays 16 pt for someone who asked for larger text; of the apps, only TrimrPix for iOS had bridged this, in its own `DynamicFont.swift`.
- **The numeral scale** — `sm` 32, `md` 56, `lg` 80, in `tokens.json` as `brand.typography.numerals`, emitted for every platform (`--ij-font-size-numeral-*` on the web). Derived from production: WODrounds' 80 pt timer and 56 pt values, the watch timers of WODrounds (34) and Anvil (30). The text scale stopped at 36, so WODrounds had added its own.
- **`.ijNumeral(_:weight:design:)`** — tabular digits, so a timer does not shift sideways as it runs, and Dynamic Type capped at 1.5×, so an 80 pt timer does not leave the screen.
- **`DesignTokens.Typography.Style` and `.Numeral`**, generated. A text size without a Dynamic Type mapping fails the build rather than silently not scaling.

### Tests, where there were none
The Swift package had no tests, and CI only ever compiled it for macOS — the UIKit and watchOS paths had never been built there.

- **A generated test per palette colour (21):** it must resolve to the light token in a light appearance and the dark token in a dark one.
- **Typography measured in rendered pixels**, on an iOS simulator: every style is exact at the default size and grows at `accessibility3`; a numeral grows but stops at 1.5×; tabular digits hold "1111" and "0000" to the same width.
- **CI** now runs `swift test` on macOS, builds for iOS, watchOS and tvOS, and runs the tests on an iOS simulator.

Each was checked by breaking what it guards: an `adaptive()` that always returns the light colour, fixed sizes, no tabular digits, no cap.

### Changed
- **`Typography.uiFontName` and `monoFontName` are deprecated** in Swift. They held `"system-ui"` and `"ui-monospace"` — CSS values with no meaning in SwiftUI. No app used them.
- `tokens.schema.json` documents `numerals`, and `display`, which 1.11.0 added without it.

### Not in this release
- **Watch and TV scales.** WODrounds' watch app halves spacing and invents its own radii, and Apple TV is its second platform, so both are real. How much the system should carry for them is worth deciding from each app's platform split rather than assuming.
- **Two decisions for the owner:** whether native apps use Phosphor, as rule 5 says, or SF Symbols, as most of them do; and whether the family accents apply inside the apps or only on their sites.

## [1.14.0] — 2026-09-26

`<ij-nav>`, the shared site navigation, modelled on Echolume's header. The second component, and the first with browser tests. Closes #46.

### Added
- **`dist/components/ij-nav.js`**, exported as `@iamjarl/design-tokens/components/nav`, with SRI in `sri.json` and in the README's generated block. `./components/footer` is added as an alias for the existing `./components`.
- **Slots, not generated links:** `brand`, up to three `links`, one `secondary`, one `cta`. Every link is in light DOM, in the served HTML, so crawlers that do not run JavaScript see the whole nav, and without JavaScript it is a row of plain links.
- **What the component owns:** a `<nav>` landmark and a skip link; `aria-current="page"` on the link for this page (clean URLs and `index.html` included, in-page anchors never), unless the site set one; sticky, translucent and blurred, solid where `backdrop-filter` is missing or reduced transparency is preferred; and **one row below 768px**, with the links folded behind a disclosure button that opens with Enter, closes with Escape or a click outside, and returns focus.
- **`cta-after="<selector>"`** holds the nav's CTA while the hero's is on screen. One CTA above the fold is a rule in the hub, and Echolume's two differently labelled accent buttons were a critique finding.
- **Console warnings for the rules:** a fourth link, Privacy or Support in the nav, a second CTA or secondary item, a missing brand, and a CTA reporting a `placement` other than `nav`. Nothing is hidden.
- **`components/nav-rules.js`**, the rules as pure functions, tested without a DOM like the footer's `select-links.js`.
- **Browser tests with no dependency.** `scripts/browser.js` drives Chrome over the DevTools protocol with Node's built-in `WebSocket`; `scripts/test-browser.js` runs 39 checks in about four seconds, in PR CI, where a missing Chrome fails the run. `--serve` opens the same fixtures for looking at by hand.

### The accent fills; it does not write
Echolume's header is 75% opaque and draws hover and current links in its accent. Compositing that bar over the worst case beneath it — white under a dark bar, black under a light one — shows why that cannot carry over:

| At opacity 0.75 | Light | Dark |
|---|---|---|
| `text.secondary` | 6.26:1 | 6.69:1 |
| a family accent as text, worst of the four | 3.02:1 | 2.75:1 |

Keeping an accent AA on the bar needs 0.94 in light mode, which leaves no translucency worth having. So the accent is carried by the dot beside the wordmark and by the CTA's opaque fill. Links are `text.secondary`, turn `text.primary` on hover and for the current page, and the current page is underlined as well, so colour is not the only signal. The focus ring is `text.primary` for the same reason. A contract test re-derives the text floor from `color.js` (0.58 light, 0.64 dark) and fails if the bar's opacity drops below it, and another fails if the accent is ever used as a text colour on it. The general rule is now in `design.md`, *Text on a translucent surface*.

This applies to Echolume as it ships today: with its new teal accent, its hover links fall to 3.86:1 when a light screenshot scrolls under the bar. Adopting the component fixes that.

### Decided along the way
- **Focus order is DOM order.** Brand, links, secondary, CTA — so on a wide screen the secondary item sits before the CTA, where Echolume has it after. On a phone the folded menu moves after the disclosure button, so Tab goes from the button into what it opened.
- **The CTA is design.md's primary button on the accent**, with `onPrimary` on it (the equivalence 1.13.1 put under test), and `radius.md` rather than Echolume's pill: the system allows `sm`, `md` and `lg` only.
- **No invented hover colour** (rule 8): the CTA's label underlines. The system has no `accentHover`, and hand-rolling one is what the rule forbids.
- **The dot is skipped when the brand carries its own mark**, so TonVault's waveform logo does not get a second one beside it.

### Fixed before release, by the browser tests
- **`cta-after` flashed.** Its first state came from the observer's first callback, after the bar had painted, so the nav's CTA appeared and then faded out on every page load, focusable while it did. The first state is now set before paint, with transitions off.
- **The current-page mark ran the full width of the folded menu**, where links stretch to full-width targets, and read as a divider. It is a text underline now, which follows the text.
- **An in-page anchor would have been marked as the current page.** On a one-page site, `/#features` matched the home page.

### Changed
- `build.js` shares one `inline()` between the two component bundles. The footer's registry projection, which 1.12.0 left indented inside the function that uses it, is at module level.

## [1.13.1] — 2026-09-26

The identity sheets are loaded like `tokens.css` — one pinned `<link>` per site — but `sri.json` did not list them, so the first adopter had to compute a hash by hand. Closes #44 and #45, which reported it twice from Echolume's adoption.

### Fixed
- **`sri.json` now has an entry for every identity sheet**: 16 files, up from 3. Echolume's hand-computed hash for v1.13.0 was checked against the file and is correct, so publishing hashes changes nothing for a site that has already adopted.
- **The build hashed before it wrote the identity sheets.** They were generated after `sri.json`, so adding them to the manifest would have hashed the previous build's files. They are now written first.
- **A sheet the build no longer generates is removed.** `dist/identity/` had no clean-up, so if a family dropped its accent, the old sheet would have kept shipping — and would now have kept its hash too.
- **`apps.json` marked three sites as rendering `<ij-footer>`; seven do.** It's mono, BotLens, PageLens and TrimrPix for iOS were missing. Each was checked against its live site: six serve the element in their HTML, and PageLens renders it from React.

### Added
- **The README documents adopting an identity sheet**: the `<link>` with `integrity`, a one-line command that prints a sheet's hash from `sri.json`, how to use the accent as text, as a fill and translucent, and the rule #45 found in practice — a site that is always dark needs `class="dark"` on `<html>`, or light-mode visitors get the light accent on a dark page.
- **The fill advice is held by a test.** The README says to put `onPrimary` on the accent. That is safe only because `onPrimary` is the same colour as `background.app` in both modes, so an accent that clears 4.5:1 on its ground clears it under `onPrimary` too. A contract test asserts that equivalence, so the advice cannot silently stop being true.
- **Contract tests**: every identity sheet has an entry; every entry points at a file that exists (it used to crash the suite instead of failing); footer fragments are deliberately not listed.

### Not changed
**The footer fragments stay out of `sri.json`**, and the README now says why. A site copies them into its own HTML at build time; the browser never fetches them as a resource, so an `integrity` attribute would have nothing to check.

## [1.13.0] — 2026-09-23

A hook for aligning the footer's link rows, raised by It's mono's adoption. Closes #41.

### Added
- **`--ij-footer-links-justify`** on `<ij-footer>` — any `justify-content` value, default `flex-start`, so nothing moves for a site that does not set it.

### Why this was needed
On a centred footer the labels centred and the links did not. `text-align` inherits through the shadow boundary, so everything that is text followed the page; the link rows are flex containers, and flex items ignore `text-align`. Nothing on the host could reach them.

Measured in a browser with the page set to `text-align: center` and the property set to `center`. Generated links and links slotted from the build-time fragment — It's mono's setup — both centre, at 190 px either side of a 900 px row. With the property unset they sit flush left as before.

### Why a custom property and not `::part`
`part="links"` would let a host restyle the row in any way, and in doing so make the row's internal structure public API: every later change to the shadow DOM would become a breaking one. A custom property is one deliberate knob, in the two-tier pattern the component already uses for its colours and spacing. In `layout="columns"` the rows become columns, so the property is neutralised there, and a value meant for the horizontal axis never acts on the vertical one. Stacked links already follow `text-align` on their own.

### Documented
- **`links-label` labels the site's own group**, not the cross-links. The "More from IAMJARL" heading is fixed; setting `links-label` to that text printed it twice, which is the detour the issue describes.

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

[1.33.1]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.33.1
[1.33.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.33.0
[1.32.2]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.32.2
[1.32.1]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.32.1
[1.32.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.32.0
[1.31.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.31.0
[1.30.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.30.0
[1.29.1]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.29.1
[1.29.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.29.0
[1.28.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.28.0
[1.27.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.27.0
[1.26.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.26.0
[1.25.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.25.0
[1.24.1]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.24.1
[1.24.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.24.0
[1.23.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.23.0
[1.22.1]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.22.1
[1.22.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.22.0
[1.21.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.21.0
[1.20.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.20.0
[1.19.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.19.0
[1.18.1]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.18.1
[1.18.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.18.0
[1.17.1]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.17.1
[1.17.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.17.0
[1.16.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.16.0
[1.15.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.15.0
[1.14.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.14.0
[1.13.1]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.13.1
[1.13.0]: https://github.com/jarllyng/iamjarl-design/releases/tag/v1.13.0
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
