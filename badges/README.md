# Store badges

The official badges, shipped here so `<ij-store-cta>` and the store fragments
can use them without each site keeping its own copy. Downloaded on 2026-10-10,
with the owner's approval.

| Files | Source | Rules |
|---|---|---|
| `app-store-{black,white}-{en-us,da-dk,de-de,es-es,fr-fr,no-no,sv-se}.svg` | Apple Marketing Toolbox, `toolbox.marketingtools.apple.com/api/v2/badges/download-on-the-app-store/…` | Apple's App Store Marketing Guidelines |
| `mac-app-store-{black,white}-en-us.svg` | Apple Marketing Toolbox, `…/download-on-the-mac-app-store/…` | Apple's App Store Marketing Guidelines |
| `chrome-web-store.png`, `chrome-web-store-border.png` | Google, developer.chrome.com/docs/webstore/branding (large PNG, without and with border) | Chrome Web Store branding guidelines |

## Rules that come with them

- **Use them as published.** Resize only, keep the ratio, never recolour,
  crop or redraw. Apple's minimum height on screen is 40 px, and the fragments
  set exactly that. The Chrome Web Store badge is set at 58 px, the smallest size
  Google publishes; at 40 its words cannot be read.
- **One badge per layout, and never the dominant element.** The nav's call to
  action is therefore a text link (`dist/store/<app>.<locale>.nav.html`), not a
  badge.
- **The right badge for the store**: the Mac App Store badge for Mac apps, and
  Apple's localised badge on a translated page.
- **Black on light, white on dark.** The fragments follow the visitor's setting;
  `<ij-store-cta tone="white">` pins it for a site that is always dark.
- **The Chrome Web Store badge always links to the listing**, and only while the
  extension is in the store. The bordered version is for coloured or dark
  backgrounds.

To refresh a badge, download it again from the same source. Never edit the file.
