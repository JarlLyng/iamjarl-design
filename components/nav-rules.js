// The rules <ij-nav> enforces, kept out of the DOM so they are covered by the
// same dependency-free contract tests as the tokens. The element is a rendering
// shell over these, the way <ij-footer> is a shell over select-links.js.
//
// Pure: no DOM, no fetch, no globals.

// How opaque the bar is. Derived, not chosen: text sits on a translucent ground
// with the page scrolling underneath, so its background is whatever is behind
// it. Compositing the bar over the worst case — pure white under a dark bar,
// pure black under a light one — gives the opacity at which text.primary and
// text.secondary still clear AA: 0.58 in light mode, 0.64 in dark. A contract
// test re-derives both from color.js, so this value cannot drift below them.
//
// The family accent is deliberately NOT a text colour on the bar. Keeping an
// accent legible over the worst case needs 0.94, which leaves no translucency
// worth having; at 0.75 a teal link falls to 3.86:1. So the accent is carried by
// the dot and by the CTA's opaque fill, where it is safe at any opacity.
export const NAV_ALPHA = 0.75;

// Below this width the links fold behind a disclosure button and the bar stays
// one row. The system's `md` breakpoint; a contract test holds them together.
export const NAV_COLLAPSE_BELOW = 768;

// The top nav is for intent (DESIGN.md, "Rules for a site that sells an app").
export const MAX_LINKS = 3;

// Obligations, not destinations: they belong in the footer.
const FOOTER_ONLY = /^\s*(privacy|support|terms|legal|imprint|contact)\b/i;

// A URL reduced to what identifies a page on a static site: no query, no hash,
// no trailing slash, no `index.html`, and `/page.html` equal to `/page` so that
// hosts serving clean URLs match the links written with the extension.
function pageKey(url) {
  let p = url.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  if (p.length > 1) p = p.replace(/\/$/, '');
  return `${url.origin}${p}`;
}

// Which of the links, if any, points at the page the visitor is on. Returns an
// index into `hrefs`, or -1. Links to another origin never match, and a link
// that only changes the hash (`#download`) is not a page.
export function currentIndex(hrefs, here) {
  let at;
  try { at = new URL(here); } catch { return -1; }
  const key = pageKey(at);
  return hrefs.findIndex(href => {
    let u;
    try { u = new URL(href, at); } catch { return false; }
    if (u.origin !== at.origin) return false;
    if (u.hash) return false;   // an anchor on a page, not the page itself
    return pageKey(u) === key;
  });
}

// What a site put in the nav that the rules say does not belong there. The
// element logs these as warnings rather than hiding anything: every link stays
// in light DOM for crawlers, and the site decides what to do about it.
//
//   content = {
//     brand:     number of slot="brand" elements,
//     links:     [{ text }],
//     cta:       [{ text, event, placement }]   // data-umami-* attributes
//     secondary: number of slot="secondary" elements,
//   }
export function navWarnings({ brand = 0, links = [], cta = [], secondary = 0 }) {
  const out = [];
  if (brand === 0) {
    out.push('no slot="brand": the nav needs the site\'s name, linking home');
  } else if (brand > 1) {
    out.push(`${brand} elements in slot="brand"; use one`);
  }
  if (links.length > MAX_LINKS) {
    out.push(`${links.length} links; the top nav holds at most ${MAX_LINKS} — ` +
      'the rest belong on the page or in the footer');
  }
  for (const { text } of links) {
    if (FOOTER_ONLY.test(text ?? '')) {
      out.push(`"${text.trim()}" belongs in the footer: it is an obligation, not a destination`);
    }
  }
  if (cta.length > 1) {
    out.push(`${cta.length} elements in slot="cta"; the nav has one call to action`);
  }
  for (const { text, event, placement } of cta) {
    if (event && placement !== 'nav') {
      out.push(`the CTA "${(text ?? '').trim()}" reports placement="${placement ?? ''}"; ` +
        'use data-umami-event-placement="nav" so it can be told apart from the hero\'s');
    }
  }
  if (secondary > 1) {
    out.push(`${secondary} elements in slot="secondary"; use at most one`);
  }
  return out;
}
