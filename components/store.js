// The store button, from the registry: the link with its campaign, the click
// event, the badge and the facts line. Pure — no DOM, no fetch — so build.js
// writes the fragments with it, <ij-store-cta> renders with it, and the
// contract tests check it without a browser.
//
// Every site used to hand-write all of this, and each copy drifted on its own:
// campaign parameters missing on four sites, the click event on two, a price
// wrong on one, an OS requirement wrong on another (#58).

// Apple's campaign: one provider token for the portfolio, and ct=site per site
// rather than per page — Apple only reports a campaign after five first-time
// downloads, so splitting it per page would hide every number.
export const CAMPAIGN = { pt: '128512007', ct: 'site' };
const MEDIA_TYPE = { 'app-store': '8', 'mac-app-store': '12' };
const OS_NAME = { 'app-store': 'iOS', 'mac-app-store': 'macOS' };

// A page locale: which App Store storefront its price comes from, which badge
// Apple localised for it, and the words around them. English pages quote the
// US store; a translated page quotes its own country's (owner, #58).
export const LOCALES = {
  en: { front: 'us', badge: 'en-us', free: 'Free', once: 'once', orLater: 'or later', download: 'Download',
        alt: { 'app-store': 'Download on the App Store', 'mac-app-store': 'Download on the Mac App Store', 'chrome-web-store': 'Available in the Chrome Web Store' } },
  da: { front: 'dk', badge: 'da-dk', free: 'Gratis', once: 'engangskøb', orLater: 'eller nyere', download: 'Hent',
        alt: { 'app-store': 'Hent i App Store' } },
  de: { front: 'de', badge: 'de-de', free: 'Kostenlos', once: 'einmalig', orLater: 'oder neuer', download: 'Laden',
        alt: { 'app-store': 'Laden im App Store' } },
  es: { front: 'es', badge: 'es-es', free: 'Gratis', once: 'pago único', orLater: 'o posterior', download: 'Descargar',
        alt: { 'app-store': 'Descárgalo en el App Store' } },
  fr: { front: 'fr', badge: 'fr-fr', free: 'Gratuit', once: 'achat unique', orLater: 'ou version ultérieure', download: 'Télécharger',
        alt: { 'app-store': 'Télécharger dans l’App Store' } },
  nb: { front: 'no', badge: 'no-no', free: 'Gratis', once: 'engangskjøp', orLater: 'eller nyere', download: 'Last ned',
        alt: { 'app-store': 'Last ned på App Store' } },
  sv: { front: 'se', badge: 'sv-se', free: 'Gratis', once: 'engångsköp', orLater: 'eller senare', download: 'Hämta',
        alt: { 'app-store': 'Hämta i App Store' } },
};
LOCALES.no = LOCALES.nb;   // Norwegian pages say either

export function locale(code) {
  const l = LOCALES[code];
  if (!l) throw new Error(`No store locale "${code}"`);
  return l;
}

// The store page, with the campaign. The Chrome Web Store has no campaign
// parameters, so its link is the listing itself.
export function storeLink(store) {
  if (store.platform === 'chrome-web-store') {
    return `https://chromewebstore.google.com/detail/${store.slug}/${store.id}`;
  }
  const mt = MEDIA_TYPE[store.platform];
  if (!mt) throw new Error(`Unknown store platform "${store.platform}"`);
  return `https://apps.apple.com/app/id${store.id}?pt=${CAMPAIGN.pt}&ct=${CAMPAIGN.ct}&mt=${mt}`;
}

// "$2.99 once · iOS 16 or later". The price is the store's own wording for that
// storefront, so it can be compared with Apple's lookup as a string.
export function factsLine(store, code) {
  const l = locale(code);
  const raw = store.price?.[l.front];
  if (raw === undefined) throw new Error(`No ${l.front} price for "${store.id}" (locale ${code})`);
  const price = raw === 'Free' ? l.free : `${raw} ${l.once}`;
  if (!OS_NAME[store.platform]) return price;
  const version = String(store.minOS).replace(/(\.0)+$/, '');
  return `${price} · ${OS_NAME[store.platform]} ${version} ${l.orLater}`;
}

// Which badge file, for a platform, locale and tone. Apple localises the App
// Store badge; the Mac App Store and Chrome Web Store badges ship in English.
export function badgeFile(platform, code, tone) {
  if (platform === 'chrome-web-store') return tone === 'white' ? 'chrome-web-store-border.png' : 'chrome-web-store.png';
  const loc = platform === 'app-store' ? locale(code).badge : 'en-us';
  const name = platform === 'app-store' ? 'app-store' : 'mac-app-store';
  return `${name}-${tone}-${loc}.svg`;
}

// Apple's minimum is 40 px. Google's badge carries its words small inside a lot
// of space, and 58 px is the smallest size Google itself publishes (206 x 58);
// at 40 the words cannot be read.
export function badgeHeight(platform) {
  return platform === 'chrome-web-store' ? 58 : 40;
}

export function badgeAlt(platform, code) {
  return locale(code).alt[platform] ?? LOCALES.en.alt[platform];
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function eventAttrs(store, placement, code) {
  return `data-umami-event="store-click" data-umami-event-store="${esc(store.platform)}" ` +
    `data-umami-event-placement="${esc(placement)}" data-umami-event-locale="${esc(code)}"`;
}

// The badge and the facts line. Black badge on a light page, white on a dark
// one, following the visitor's setting; <ij-store-cta tone="…"> can pin it for a
// site whose mode does not follow the system. Height per badgeHeight().
//   badges = { base: 'https://…/badges/', width: file => width at 40 px tall }
export function badgeHtml(app, code, { placement = 'hero', badges }) {
  const s = app.store;
  const src = tone => esc(badges.base + badgeFile(s.platform, code, tone));
  const height = badgeHeight(s.platform);
  const width = Math.round(badges.width(badgeFile(s.platform, code, 'black')) * height / 40);
  return [
    `<div class="ij-store" data-ij-store="${esc(app.id)}" data-ij-store-locale="${esc(code)}">`,
    `  <a class="ij-store-badge" href="${esc(storeLink(s))}" ${eventAttrs(s, placement, code)}>`,
    `    <picture>`,
    `      <source srcset="${src('white')}" media="(prefers-color-scheme: dark)">`,
    `      <img src="${src('black')}" alt="${esc(badgeAlt(s.platform, code))}" width="${width}" height="${height}">`,
    `    </picture>`,
    `  </a>`,
    `  <p class="ij-store-facts">${esc(factsLine(s, code))}</p>`,
    `</div>`,
  ].join('\n');
}

// The nav's call to action is a text link, not a badge: Apple allows one badge
// per layout, never as the dominant element. Same link, same event.
export function navLinkHtml(app, code) {
  const s = app.store;
  return `<a slot="cta" href="${esc(storeLink(s))}" ${eventAttrs(s, 'nav', code)}>${esc(locale(code).download)}</a>`;
}

// Safari's Smart App Banner, for an iPhone app or a Mac app with an iPhone
// sibling. Null when there is nothing on iPhone to point at.
export function smartBannerHtml(app, registry) {
  const s = app.store;
  let id = s.platform === 'app-store' ? s.id : null;
  if (!id && s.iphoneSibling) id = registry.apps.find(a => a.id === s.iphoneSibling)?.store?.id ?? null;
  return id ? `<meta name="apple-itunes-app" content="app-id=${esc(id)}">` : null;
}
