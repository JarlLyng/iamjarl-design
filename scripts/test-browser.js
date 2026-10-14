#!/usr/bin/env node
// Browser tests for the components: what the contract tests cannot reach —
// shadow DOM, slots, focus order, keyboard, media queries, and the pre-upgrade
// fallback. Real Chrome over the DevTools protocol (scripts/browser.js), so no
// npm dependency is added.
//
// Without Chrome this skips locally and fails in CI, where it must run.

import http from 'node:http';
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findChrome, launch } from './browser.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let failed = 0;
function check(name, condition, detail = '') {
  if (condition) console.log(`  ✓ ${name}`);
  else { console.error(`  ✗ ${name}${detail ? ' — ' + detail : ''}`); failed++; }
}

// --- Fixtures ---------------------------------------------------------------

const page = ({ body, tokens = true, identity = null, nav = true, footer = false }) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
${tokens ? '<link rel="stylesheet" href="/dist/css/tokens.css">' : ''}
${identity ? `<link rel="stylesheet" href="/dist/identity/${identity}.css">` : ''}
${nav ? '<script type="module" src="/dist/components/ij-nav.js"></script>' : ''}
${footer ? '<script type="module" src="/dist/components/ij-footer.js"></script>' : ''}
<style>
  body { margin: 0; font-family: system-ui, sans-serif; background: var(--ij-color-bg-app, #fff); color: var(--ij-color-text-primary, #000); }
  main { display: block; padding: 24px; }
  .tall { height: 3000px; }
</style></head><body>${body}</body></html>`;

// Echolume's header, the model in #46.
const FULL_NAV = `
<ij-nav>
  <a slot="brand" href="./">Echolume</a>
  <a slot="links" href="how-it-works.html">How it works</a>
  <a slot="links" href="obs-guide.html">OBS Guide</a>
  <a slot="links" href="twitch-guide.html">Twitch</a>
  <a slot="cta" href="https://apps.apple.com/app/id0"
     data-umami-event="store-click" data-umami-event-placement="nav">Download</a>
  <a slot="secondary" href="https://github.com/JarlLyng/echolume">GitHub</a>
</ij-nav>`;

const FIXTURES = {
  full: page({ identity: 'echolume', body: `${FULL_NAV}<main id="main"><h1>Echolume</h1><div class="tall"></div></main>` }),

  // TonVault's bar: a wordmark with its own mark, one store link, no #main,
  // and the placement it uses today.
  minimal: page({ body: `
<ij-nav>
  <a slot="brand" href="./"><svg width="20" height="20" viewBox="0 0 32 32" aria-hidden="true"><path d="M6 16h20" stroke="currentColor" stroke-width="2"/></svg>TonVault</a>
  <a slot="cta" href="https://apps.apple.com/app/id1"
     data-umami-event="store-click" data-umami-event-placement="header">Download</a>
</ij-nav>
<main><div class="tall"></div></main>` }),

  rules: page({ body: `
<ij-nav>
  <a slot="brand" href="./">Site</a>
  <a slot="links" href="a.html">A</a><a slot="links" href="b.html">B</a>
  <a slot="links" href="c.html">C</a><a slot="links" href="privacy.html">Privacy</a>
  <a slot="cta" href="#" data-umami-event="store-click" data-umami-event-placement="hero">Get it</a>
</ij-nav><main id="main"></main>` }),

  hero: page({ identity: 'echolume', body: `
${FULL_NAV.replace('<ij-nav>', '<ij-nav cta-after="#hero-cta">')}
<main id="main"><h1>Echolume</h1><a id="hero-cta" href="#">Get Echolume</a><div class="tall"></div></main>` }),

  // The site marks the current page itself; the component must leave it alone.
  preset: page({ body: FULL_NAV.replace('href="twitch-guide.html"', 'href="twitch-guide.html" aria-current="page"') + '<main id="main"></main>' }),

  noscript: page({ nav: false, body: `${FULL_NAV}<main id="main"></main>` }),

  // A footer as WODrounds' homes have it: its own links, the cross-links and
  // the fineprint in slots, and a hand-written fallback line in none (#84).
  // The second has no fallback. Served with and without the component.
  ...Object.fromEntries([['footer-nojs', false], ['footer-js', true]].map(([name, footer]) => [name, page({ nav: false, footer, identity: 'wodrounds', body: `
<link rel="stylesheet" href="/dist/kit/kit.css">
<main class="ij-page">
<ij-footer id="with-fallback" app="wodrounds">
  <a slot="links" href="#">Privacy</a>
  <a slot="cross-links" href="https://walkful.iamjarl.com">Walkful</a>
  <p slot="fineprint">© 2026 IAMJARL.</p>
  <p id="fallback"><a href="#">Privacy</a> · © 2026 IAMJARL.</p>
</ij-footer>
<ij-footer id="no-fallback" app="wodrounds">
  <a slot="links" href="#">Support</a>
  <p slot="fineprint">© 2026 IAMJARL.</p>
</ij-footer>
</main>` })])),

  // A Swedish page (#80): the nav and the footer print their own words in it,
  // read from the nearest lang attribute; an attribute still overrides a word.
  'labels-sv': page({ identity: 'wodrounds', footer: true, body: `<div lang="sv">${FULL_NAV}<main id="main"><h1>Svenska</h1></main>
<ij-footer id="sv-footer" app="wodrounds"></ij-footer>
<ij-footer id="own-words" app="wodrounds" more-label="Fler appar"></ij-footer></div>` }),

  'footer-unknown': page({ nav: false, footer: true, body: `
<ij-footer app="does-not-exist"><p id="fallback">© 2026 Fallback</p></ij-footer>` }),

  // The three shipped faces, loaded the way a site would: the generated sheet
  // from dist/fonts/, which points at the woff2 in fonts/ by a relative url.
  fonts: page({ nav: false, body: `
<link rel="stylesheet" href="/dist/fonts/jetbrains-mono.css">
<link rel="stylesheet" href="/dist/fonts/outfit.css">
<link rel="stylesheet" href="/dist/fonts/instrument-sans.css">
<link rel="stylesheet" href="/dist/fonts/fraunces.css">
<h1 style="font-family: 'JetBrains Mono', monospace">12:30</h1>
<h1 style="font-family: 'Outfit', sans-serif">Echolume</h1>
<h1 style="font-family: 'Instrument Sans', sans-serif">Wean</h1>
<h1 style="font-family: 'Fraunces', serif; font-variation-settings: 'SOFT' 100">Walkful</h1>` }),

  // A light-only identity (Walkful, #65) seen by a visitor in dark mode: the
  // sheet must hold the page, the nav and the footer in its own colours.
  'identity-light-only': page({ footer: true, identity: 'walkful', body: `
<ij-nav><a slot="brand" href="./">Walkful</a><a slot="cta" href="#">Download</a></ij-nav>
<main id="main"><h1>Every step counts.</h1><p class="sub">Calm.</p></main>
<ij-footer app="walkful"><a slot="links" href="#">Privacy</a></ij-footer>` }),

  // The kit's screen recording (#65), with play and pause counted rather than
  // played: the question is when the module asks, not whether a codec exists.
  'kit-loop': page({ nav: false, body: `<script>
  window.__plays = 0; window.__pauses = 0;
  HTMLMediaElement.prototype.play = function () { window.__plays++; return Promise.resolve(); };
  HTMLMediaElement.prototype.pause = function () { window.__pauses++; };
</script>
<link rel="stylesheet" href="/dist/kit/kit.css">
<main class="ij-page"><div class="ij-phone"><div class="ij-phone__screen">
  <video class="ij-loop" muted loop playsinline preload="none" poster="/badges/app-store-black-en-us.svg"></video>
</div></div><div style="height: 3000px"></div></main>
<script type="module" src="/dist/kit/kit.js"></script>` }),

  // A drawing under a dark-only identity (WODrounds', the first): the kit must
  // hold for any dark site that has drawings, though WODrounds itself has none.
  'kit-dark-drawing': page({ nav: false, identity: 'wodrounds', body: `
<link rel="stylesheet" href="/dist/kit/kit.css">
<main class="ij-page" style="padding: 24px">${fs.readFileSync(path.join(ROOT, 'dist/drawings/its-mono-yo/pad-sampler.svg'), 'utf-8')}</main>` }),

  // A scene (#81) at its worst: a white photo on a dark site, a black one on a
  // light site. Every kind of text a scene may carry, and a long line that
  // wraps at phone width, so the scrim has to follow the words.
  ...Object.fromEntries([['kit-scene-dark', 'wodrounds', 'white'], ['kit-scene-light', 'walkful', 'black']].map(([name, identity, fill]) =>
    [name, page({ nav: false, identity, body: `
<link rel="stylesheet" href="/dist/kit/kit.css">
<main class="ij-page">
  <section class="ij-section"><div class="ij-container"><h2 class="ij-headline">Before the scene.</h2></div></section>
  <section class="ij-scene">
    <img class="ij-scene__photo" alt="" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' preserveAspectRatio='none'%3E%3Crect width='16' height='16' fill='${fill}'/%3E%3C/svg%3E">
    <div class="ij-container ij-closing">
      <h2 class="ij-headline">A headline on the photo.</h2>
      <p class="ij-wordmark" style="--ij-wordmark-em: 5.2">WODrounds</p>
      <p>A sentence in the secondary colour that runs long enough to wrap over two or three lines on a phone, with <a href="#">a link</a> in it.</p>
      <div class="ij-store"><p class="ij-store-facts">$2.99 once · iOS 16 or later</p></div>
    </div>
  </section>
</main>` })])),

  // Footer hover: the family accent under an identity sheet, primary without.
  'footer-accent': page({ nav: false, footer: true, identity: 'echolume', body: `
<ij-footer app="echolume"><a slot="links" href="#">Privacy</a></ij-footer>` }),

  // The store button: the generated fragment as a site would paste it, with its
  // badges pointed at this server instead of the release tag on the CDN.
  'store-fragment': page({ nav: false, body: `<main id="main">${
    fs.readFileSync(path.join(ROOT, 'dist/store/wodrounds.da.html'), 'utf-8')
      .replace(/https:\/\/cdn\.jsdelivr\.net\/gh\/jarllyng\/iamjarl-design@v[\d.]+\/badges\//g, '/badges/')}</main>` }),
  // An always-dark site's closing call to action, pasted by hand with no module:
  // the white, midpage variant must be right in the served HTML alone (#63).
  'store-tone': page({ nav: false, body: `<main id="main" style="background: #000">${
    fs.readFileSync(path.join(ROOT, 'dist/store/wodrounds.da.midpage.white.html'), 'utf-8')
      .replace(/https:\/\/cdn\.jsdelivr\.net\/gh\/jarllyng\/iamjarl-design@v[\d.]+\/badges\//g, '/badges/')}</main>` }),
  'store-element': page({ nav: false, body: `<script type="module" src="/dist/components/ij-store-cta.js"></script>
<ij-store-cta id="from-registry" app="tonvault" placement="midpage"></ij-store-cta>
<ij-store-cta id="pinned" app="wodrounds" tone="white">${
    fs.readFileSync(path.join(ROOT, 'dist/store/wodrounds.en.html'), 'utf-8')
      .replace(/https:\/\/cdn\.jsdelivr\.net\/gh\/jarllyng\/iamjarl-design@v[\d.]+\/badges\//g, '/badges/')}</ij-store-cta>
<ij-store-cta id="unknown" app="nope"></ij-store-cta>` }),

  'footer-justify': page({ nav: false, footer: true, body: `
<div style="width: 900px"><ij-footer app="its-mono-yo" style="text-align: center; --ij-footer-links-justify: center"></ij-footer></div>` }),
};

const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml', '.png': 'image/png' };

function serve() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const fx = url.pathname.match(/^\/fixture\/([^/]+)\//);
    if (fx && FIXTURES[fx[1]]) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(FIXTURES[fx[1]]);
    }
    // /nojs/<path>: the repo's own page with every <script> removed, to read a
    // page as a crawler, a link preview or a visitor without JavaScript does.
    const nojs = url.pathname.startsWith('/nojs/');
    const file = path.join(ROOT, path.normalize(nojs ? url.pathname.slice(5) : url.pathname));
    if (nojs && file.endsWith('.html') && file.startsWith(ROOT) && fs.existsSync(file)) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(fs.readFileSync(file, 'utf-8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ''));
    }
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404); return res.end();
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r(server)));
}

// --- In-page helpers ----------------------------------------------------------

const NAV = `document.querySelector('ij-nav')`;
const SR = `${NAV}.shadowRoot`;
const FOCUSED = `(() => {
  const a = document.activeElement;
  if (a && a.shadowRoot && a.shadowRoot.activeElement) {
    const s = a.shadowRoot.activeElement;
    return 'shadow:' + (s.classList[0] || s.tagName);
  }
  if (!a || a === document.body) return 'body';
  return (a.getAttribute('slot') || a.tagName.toLowerCase()) + ':' + a.textContent.trim();
})()`;
const shown = sel => `(el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden')(${sel})`;
const slotted = (slot, text) =>
  `[...document.querySelectorAll('ij-nav > [slot="${slot}"]')].find(a => a.textContent.trim() === ${JSON.stringify(text)})`;
const alphaOf = `(c => { const m = c.match(/\\/\\s*([\\d.]+)\\)$/) || c.match(/^rgba\\((?:[^,]+,){3}\\s*([\\d.]+)\\)$/); return m ? Number(m[1]) : 1; })`;

// A PNG screenshot as pixels, so a test can read what was painted: Chrome's
// are 8-bit RGB or RGBA, not interlaced. No dependency, only zlib.
function pngPixels(buf) {
  const width = buf.readUInt32BE(16), height = buf.readUInt32BE(20), channels = buf[25] === 6 ? 4 : 3;
  const idat = [];
  for (let o = 8; o < buf.length;) {
    const len = buf.readUInt32BE(o), type = buf.toString('ascii', o + 4, o + 8);
    if (type === 'IDAT') idat.push(buf.subarray(o + 8, o + 8 + len));
    o += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = width * channels, out = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)], row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? out[y * stride + x - channels] : 0, b = y ? out[(y - 1) * stride + x] : 0,
        c = x >= channels && y ? out[(y - 1) * stride + x - channels] : 0;
      const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
      const pred = [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][f];
      out[y * stride + x] = (row[x] + pred) & 255;
    }
  }
  return { width, height, channels, data: out };
}
const luminance = ([r, g, b]) => [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
  .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

async function tabs(p, n) {
  const seen = [];
  for (let i = 0; i < n; i++) { await p.key('Tab'); seen.push(await p.eval(FOCUSED)); }
  return seen;
}

// --- Run ----------------------------------------------------------------------

if (process.argv.includes('--serve')) {
  const server = await serve();
  const b = `http://127.0.0.1:${server.address().port}`;
  console.log('Fixtures (Ctrl-C to stop):');
  for (const name of Object.keys(FIXTURES)) console.log(`  ${b}/fixture/${name}/index.html`);
  await new Promise(() => {});
}

const chrome = findChrome();
if (!chrome) {
  const msg = 'no Chrome found (set CHROME_PATH)';
  if (process.env.CI) { console.error(`❌ Browser tests: ${msg}`); process.exit(1); }
  console.log(`Browser tests skipped: ${msg}.`);
  process.exit(0);
}

// A hung browser must fail the run, not stall CI until the job times out.
const deadline = setTimeout(() => {
  console.error('\n❌ Browser tests did not finish within 150s.');
  process.exit(1);
}, 150000);
deadline.unref();

const server = await serve();
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await launch(chrome);
const p = await browser.newPage();
// Wait for the element only where the page loads it: whenDefined() never
// settles on a page without the script, which is exactly the no-JS fixture.
const open = async (name, file = 'index.html') => {
  await p.goto(`${base}/fixture/${name}/${file}`);
  await p.eval(`document.querySelector('script[src$="ij-nav.js"]')
    ? customElements.whenDefined('ij-nav') : null`);
  await p.settle();
};

try {
  console.log('Running browser tests...\n');

  // Desktop
  console.log('<ij-nav>, desktop:');
  await p.viewport(1024, 800);
  await p.media([{ name: 'prefers-color-scheme', value: 'light' }]);
  await open('full', 'obs-guide.html');

  check('renders a nav landmark labelled "Main"',
    await p.eval(`${SR}.querySelector('nav')?.getAttribute('aria-label') === 'Main'`));
  check('is sticky, and stays at the top after scrolling', await p.eval(`(async () => {
    scrollTo(0, 1500); await new Promise(r => requestAnimationFrame(r));
    const top = ${NAV}.getBoundingClientRect().top;
    scrollTo(0, 0);
    return getComputedStyle(${NAV}).position === 'sticky' && Math.abs(top) < 1;
  })()`));

  const bar = await p.eval(`(() => { const s = getComputedStyle(${SR}.querySelector('.bar')); return { bg: s.backgroundColor, filter: s.backdropFilter }; })()`);
  const alpha = await p.eval(`${alphaOf}(${JSON.stringify(bar.bg)})`);
  check('is translucent at 0.75 and blurred', Math.abs(alpha - 0.75) < 0.01 && /blur\(16px\)/.test(bar.filter),
    `background ${bar.bg}, backdrop-filter ${bar.filter}`);

  check('marks the current page with aria-current', await p.eval(`
    ${slotted('links', 'OBS Guide')}.getAttribute('aria-current') === 'page' &&
    document.querySelectorAll('ij-nav [aria-current]').length === 1`));

  await open('full', 'obs-guide');
  check('matches a clean URL to a link written with .html',
    await p.eval(`${slotted('links', 'OBS Guide')}.getAttribute('aria-current') === 'page'`));

  await open('full', 'index.html');
  check('marks nothing on a page that has no link',
    await p.eval(`document.querySelectorAll('ij-nav [aria-current]').length === 0`));

  await open('preset', 'obs-guide.html');
  check('leaves an aria-current the site set itself', await p.eval(`
    ${slotted('links', 'Twitch')}.getAttribute('aria-current') === 'page' &&
    !${slotted('links', 'OBS Guide')}.hasAttribute('aria-current')`));

  await open('full', 'index.html');
  const order = await tabs(p, 7);
  const expected = ['shadow:skip', 'brand:Echolume', 'links:How it works', 'links:OBS Guide',
    'links:Twitch', 'secondary:GitHub', 'cta:Download'];
  check('focus follows visual order: skip, brand, links, secondary, CTA',
    JSON.stringify(order) === JSON.stringify(expected), order.join(' → '));

  await open('full', 'index.html');
  await tabs(p, 3);
  check('the focus ring is visible on a slotted link', await p.eval(`(() => {
    const s = getComputedStyle(document.activeElement);
    return s.outlineStyle === 'solid' && parseFloat(s.outlineWidth) >= 2;
  })()`));

  await open('full', 'index.html');
  await tabs(p, 1);
  await p.key('Enter');
  await p.settle();
  check('the skip link moves focus to #main, clear of the sticky bar', await p.eval(`
    document.activeElement.id === 'main' &&
    document.getElementById('main').getBoundingClientRect().top >= ${NAV}.getBoundingClientRect().bottom - 1`));

  check('the disclosure button is hidden on a wide screen',
    !(await p.eval(shown(`${SR}.querySelector('.toggle')`))));

  // The accent: dot and CTA fill, never text on the bar.
  const colours = await p.eval(`(() => {
    const cs = el => getComputedStyle(el);
    return {
      dot: cs(${SR}.querySelector('.dot')).backgroundColor,
      ctaBg: cs(${slotted('cta', 'Download')}).backgroundColor,
      ctaText: cs(${slotted('cta', 'Download')}).color,
      links: [...document.querySelectorAll('ij-nav > [slot="links"]')].map(a => cs(a).color),
    };
  })()`);
  check('the dot and the CTA carry the family accent (music, light: #177082)',
    colours.dot === 'rgb(23, 112, 130)' && colours.ctaBg === 'rgb(23, 112, 130)', JSON.stringify(colours));
  check('the CTA label is onPrimary', colours.ctaText === 'rgb(255, 255, 255)', colours.ctaText);
  check("the wordmark takes the family's display face (Echolume: Outfit)", await p.eval(
    `getComputedStyle(${slotted('brand', 'Echolume')}).fontFamily.startsWith('Outfit')`),
    await p.eval(`getComputedStyle(${slotted('brand', 'Echolume')}).fontFamily`));
  check('no link is drawn in the accent', colours.links.every(c => c !== colours.dot), colours.links.join(', '));

  await p.media([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await open('full', 'index.html');
  const dark = await p.eval(`({
    dot: getComputedStyle(${SR}.querySelector('.dot')).backgroundColor,
    ctaText: getComputedStyle(${slotted('cta', 'Download')}).color })`);
  check('in dark mode, the dark accent (#23ACC7) with black on it',
    dark.dot === 'rgb(35, 172, 199)' && dark.ctaText === 'rgb(0, 0, 0)', JSON.stringify(dark));

  await p.media([{ name: 'prefers-reduced-transparency', value: 'reduce' }]);
  await open('full', 'index.html');
  if (await p.eval(`matchMedia('(prefers-reduced-transparency: reduce)').matches`)) {
    const solid = await p.eval(`(() => { const s = getComputedStyle(${SR}.querySelector('.bar')); return { bg: s.backgroundColor, filter: s.backdropFilter }; })()`);
    check('goes solid when the visitor prefers reduced transparency',
      (await p.eval(`${alphaOf}(${JSON.stringify(solid.bg)})`)) === 1 && solid.filter === 'none', JSON.stringify(solid));
  } else {
    console.log('  – reduced transparency: this Chrome cannot emulate it, not checked');
  }
  await p.media([{ name: 'prefers-color-scheme', value: 'light' }]);

  // Mobile
  console.log('\n<ij-nav>, 375px:');
  await p.viewport(375, 812);
  await open('full', 'index.html');

  const row = await p.eval(`(() => {
    const r = el => el.getBoundingClientRect();
    const b = r(${slotted('brand', 'Echolume')}), c = r(${slotted('cta', 'Download')});
    return { height: r(${NAV}).height, brandMid: b.top + b.height / 2, ctaMid: c.top + c.height / 2 };
  })()`);
  check('stays one row: brand and CTA side by side, bar under 72px',
    row.height < 72 && Math.abs(row.brandMid - row.ctaMid) < 8, JSON.stringify(row));
  check('folds the links behind a disclosure button', await p.eval(`
    ${shown(`${SR}.querySelector('.toggle')`)} &&
    ${SR}.querySelector('.toggle').getAttribute('aria-expanded') === 'false' &&
    !${shown(slotted('links', 'How it works'))} && !${shown(slotted('secondary', 'GitHub'))}`));
  check('the button is named and a 44px target', await p.eval(`(() => {
    const t = ${SR}.querySelector('.toggle'), r = t.getBoundingClientRect();
    return t.textContent.trim() === 'Menu' && r.width >= 44 && r.height >= 44;
  })()`));

  const mobileOrder = await tabs(p, 4);
  check('focus order: skip, brand, CTA, button',
    JSON.stringify(mobileOrder) === JSON.stringify(['shadow:skip', 'brand:Echolume', 'cta:Download', 'shadow:toggle']),
    mobileOrder.join(' → '));

  await p.key('Enter');
  await p.settle();
  check('Enter opens it, and the links show', await p.eval(`
    ${SR}.querySelector('.toggle').getAttribute('aria-expanded') === 'true' &&
    ${shown(slotted('links', 'How it works'))} && ${shown(slotted('secondary', 'GitHub'))}`));
  check('Tab goes from the button into the menu', (await tabs(p, 1))[0] === 'links:How it works');

  await p.key('Escape');
  await p.settle();
  check('Escape closes it and returns focus to the button', await p.eval(`
    ${SR}.querySelector('.toggle').getAttribute('aria-expanded') === 'false' && ${FOCUSED} === 'shadow:toggle'`));

  await p.eval(`${SR}.querySelector('.toggle').click()`);
  await p.click(200, 600);
  await p.settle();
  check('a click outside closes it',
    await p.eval(`${SR}.querySelector('.toggle').getAttribute('aria-expanded') === 'false'`));

  await p.eval(`${SR}.querySelector('.toggle').click()`);
  await p.viewport(1024, 800);
  await p.settle(150);
  check('widening the window closes it and puts the links back in the row', await p.eval(`
    ${SR}.querySelector('.toggle').getAttribute('aria-expanded') === 'false' &&
    ${SR}.querySelector('.cta').previousElementSibling === ${SR}.querySelector('.menu') &&
    ${shown(slotted('links', 'How it works'))}`));

  // TonVault's case
  console.log('\n<ij-nav>, minimal (TonVault):');
  await p.viewport(375, 812);
  await open('minimal', 'index.html');
  check('no button and no menu when there is nothing to fold',
    await p.eval(`!${SR}.querySelector('.toggle') && !${SR}.querySelector('.menu')`));
  check('no dot when the brand carries its own mark', await p.eval(`!${SR}.querySelector('.dot')`));
  check('no skip link without a target, and says why', await p.eval(`!${SR}.querySelector('.skip')`) &&
    p.console.some(m => m.type === 'warning' && m.text.includes('no element with id="main"')));
  check('warns that the CTA reports placement="header"',
    p.console.some(m => m.type === 'warning' && m.text.includes('placement="header"')));

  // Rules
  console.log('\n<ij-nav>, rules:');
  await p.viewport(1024, 800);
  await open('rules', 'index.html');
  const warns = p.console.filter(m => m.type === 'warning').map(m => m.text);
  check('warns about a fourth link', warns.some(w => w.includes('4 links')), warns.join(' | '));
  check('warns that Privacy belongs in the footer', warns.some(w => w.includes('"Privacy" belongs in the footer')));
  check('warns about a CTA copied from the hero', warns.some(w => w.includes('placement="hero"')));
  check('hides nothing: all four links still render', await p.eval(
    `[...document.querySelectorAll('ij-nav > [slot="links"]')].every(a => a.getClientRects().length > 0)`));

  // One CTA above the fold
  console.log('\n<ij-nav>, cta-after:');
  await p.goto(`${base}/fixture/hero/index.html`);
  await p.eval(`customElements.whenDefined('ij-nav')`);
  check('holds the nav CTA from the first paint, with no fade on load', await p.eval(`
    ${SR}.querySelector('.bar').classList.contains('cta-held') && !${shown(slotted('cta', 'Download'))}`));
  check('a held CTA is out of the tab order', !(await tabs(p, 7)).includes('cta:Download'));
  await p.eval(`scrollTo(0, 1200)`);
  await p.settle(400);
  check('returns once the hero CTA has scrolled away', await p.eval(`
    !${SR}.querySelector('.bar').classList.contains('cta-held') && ${shown(slotted('cta', 'Download'))}`));

  // Without JavaScript
  console.log('\n<ij-nav>, before upgrade:');
  await open('noscript', 'index.html');
  check('every link is visible as plain light DOM', await p.eval(`
    !customElements.get('ij-nav') &&
    [...document.querySelectorAll('ij-nav > a')].length === 6 &&
    [...document.querySelectorAll('ij-nav > a')].every(a => a.getClientRects().length > 0)`));

  // Display faces
  console.log('\nDisplay faces:');
  await p.goto(`${base}/fixture/fonts/index.html`);
  const faces = await p.eval(`(async () => {
    await document.fonts.ready;
    const out = {};
    for (const fam of ['JetBrains Mono', 'Outfit', 'Instrument Sans', 'Fraunces']) {
      const loaded = await document.fonts.load('700 32px "' + fam + '"', 'Aa');
      out[fam] = loaded.length > 0 && loaded.every(f => f.status === 'loaded');
    }
    out.files = performance.getEntriesByType('resource').map(r => r.name).filter(n => n.endsWith('.woff2')).map(n => n.split('/').pop()).sort();
    return out;
  })()`);
  for (const fam of ['JetBrains Mono', 'Outfit', 'Instrument Sans', 'Fraunces']) {
    check(`${fam} loads through its generated sheet`, faces[fam] === true, JSON.stringify(faces));
  }
  check('each woff2 is fetched from fonts/, by the relative url', JSON.stringify(faces.files) === JSON.stringify([
    'fraunces-latin-soft-normal.woff2', 'instrument-sans-latin-wght-normal.woff2', 'jetbrains-mono-latin-wght-normal.woff2', 'outfit-latin-wght-normal.woff2']),
    faces.files.join(', '));

  // The docs page (index.html). It renders tokens.json live, but only what its
  // code knows how to draw — which is how the old one stalled at v1.0.0 while
  // still printing the current version. So: every token must be on it, and
  // every name it shows must exist.
  console.log('\nDocs page:');
  await p.viewport(1280, 900);
  await p.goto(`${base}/index.html`);
  await p.eval(`new Promise(r => { const t0 = Date.now(); (function w() {
    if (document.documentElement.dataset.rendered || Date.now() - t0 > 8000) return r(); setTimeout(w, 50); })(); })`);
  check('renders, without console errors',
    await p.eval(`document.documentElement.dataset.rendered === 'true'`) && !p.console.some(m => m.type === 'error'),
    JSON.stringify(p.console.filter(m => m.type === 'error')));

  const tokensJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'tokens.json'), 'utf-8'));
  const leaves = [];
  (function walk(node, at) {
    const composite = /^(tokens\.shadows|brand\.typography\.display)\.[^.]+$/.test(at);
    if (at && (composite || Array.isArray(node) || typeof node !== 'object' || node === null)) { leaves.push(at); return; }
    for (const [k, v] of Object.entries(node)) {
      if (!at && (k === '$schema' || k === 'meta')) continue;
      walk(v, at ? `${at}.${k}` : k);
    }
  })(tokensJson, '');
  const tokensShown = new Set(await p.eval(`[...document.querySelectorAll('[data-token]')].map(e => e.dataset.token)`));
  const missing = leaves.filter(l => !tokensShown.has(l));
  check(`every token in tokens.json is on the page (${leaves.length})`, missing.length === 0, `missing: ${missing.join(', ')}`);

  const reg = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps.json'), 'utf-8'));
  const appsShown = new Set(await p.eval(`[...document.querySelectorAll('[data-app]')].map(e => e.dataset.app)`));
  const shippedIds = reg.apps.filter(a => a.status === 'shipped').map(a => a.id);
  check('every shipped app is on the page, with its identity or in the list of those without',
    shippedIds.every(id => appsShown.has(id)), `apps missing: ${shippedIds.filter(id => !appsShown.has(id)).join(', ')}`);

  const codes = await p.eval(`[...document.querySelectorAll('code')].map(c => c.textContent.trim())`);
  const cssDefined = new Set([path.join(ROOT, 'dist/css/tokens.css'),
    ...fs.readdirSync(path.join(ROOT, 'dist/identity')).map(f => path.join(ROOT, 'dist/identity', f))]
    .flatMap(f => fs.readFileSync(f, 'utf-8').match(/--ij-[a-z0-9-]+(?=:)/g) ?? []));
  const cssShown = [...new Set(codes.filter(c => /^--ij-[a-z0-9-]+$/.test(c)))];
  check(`every CSS variable it names exists in tokens.css or an identity sheet (${cssShown.length})`, cssShown.every(v => cssDefined.has(v)),
    cssShown.filter(v => !cssDefined.has(v)).join(', '));
  const swiftSrc = ['DesignTokens.swift', 'DynamicType.swift', 'Adaptive.swift']
    .map(f => fs.readFileSync(path.join(ROOT, 'Sources/IAMJARLDesignTokens', f), 'utf-8')).join('\n');
  const swiftShown = [...new Set(codes.filter(c => /^(DesignTokens\.[A-Za-z.`]+(\(\))?|\.ij(Font|Numeral)\(\.[a-z]+\))$/.test(c)))];
  const swiftExists = name => {
    const m = name.match(/^\.ij(Font|Numeral)\(\.([a-z]+)\)$/);
    if (m) return new RegExp(`enum ${m[1] === 'Font' ? 'Style' : 'Numeral'}[^{]*\\{\\s*case [^\\n]*\\b${m[2]}\\b`).test(swiftSrc);
    const leaf = name.replace(/\(\)$/, '').split('.').pop().replace(/`/g, '');
    return new RegExp(`(enum|static (let|func)) \`?${leaf}\`?\\b`).test(swiftSrc);
  };
  check(`every Swift name it shows exists in the package (${swiftShown.length})`, swiftShown.every(swiftExists),
    swiftShown.filter(n => !swiftExists(n)).join(', '));

  const loadedFaces = await p.eval(`(async () => { await document.fonts.ready;
    return ['JetBrains Mono', 'Outfit', 'Instrument Sans', 'Fraunces'].filter(f => document.fonts.check('16px "' + f + '"')); })()`);
  const requests = await p.eval(`performance.getEntriesByType('resource').map(r => r.name)`);
  check('a footer with its own links still shows their group', await p.eval(`(() => {
    const sr = document.querySelector('.card ij-footer').shadowRoot;
    return sr.querySelectorAll('.group').length === 2 && !!sr.querySelector('slot[name="links"]');
  })()`));
  check('shows the four faces in themselves, and nothing comes from Google Fonts',
    loadedFaces.length === 4 && !requests.some(u => /fonts\.(googleapis|gstatic)\.com/.test(u)), JSON.stringify(loadedFaces));

  await p.viewport(375, 812);
  await p.goto(`${base}/index.html?narrow`);
  await p.eval(`new Promise(r => { (function w() { document.documentElement.dataset.rendered ? r() : setTimeout(w, 50); })(); })`);
  check('no horizontal scroll at 375px: wide tables scroll inside their own box',
    await p.eval(`document.documentElement.scrollWidth <= innerWidth`), String(await p.eval(`document.documentElement.scrollWidth`)));
  await p.viewport(1024, 800);

  // Store button
  console.log('\nStore button:');
  await p.viewport(1024, 800);
  await p.media([{ name: 'prefers-color-scheme', value: 'light' }]);
  await p.goto(`${base}/fixture/store-fragment/index.html`);
  await p.settle(300);
  const frag = await p.eval(`(async () => {
    const img = document.querySelector('.ij-store img');
    await (img.complete ? null : new Promise(r => img.addEventListener('load', r, { once: true })));
    const a = document.querySelector('.ij-store-badge');
    return { loaded: img.naturalWidth > 0, height: Math.round(img.getBoundingClientRect().height), src: img.currentSrc,
      alt: img.alt, href: a.href, event: a.dataset.umamiEvent, placement: a.dataset.umamiEventPlacement,
      facts: document.querySelector('.ij-store-facts').textContent };
  })()`);
  check('the fragment works without JavaScript: badge loaded at 40 px, link and event in place',
    frag.loaded && frag.height === 40 && frag.href.includes('pt=128512007') && frag.event === 'store-click' && frag.placement === 'hero',
    JSON.stringify(frag));
  check('the Danish page gets the Danish badge, alt text and facts',
    /app-store-black-da-dk\.svg$/.test(frag.src) && frag.alt === 'Hent i App Store' &&
    // Apple writes the price with a no-break space before the currency; keep it, compare loosely.
    frag.facts.replace(/\s/g, ' ') === '29,00 kr engangskøb · iOS 16 eller nyere',
    `${frag.src} · ${frag.alt} · ${frag.facts}`);
  await p.media([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await p.goto(`${base}/fixture/store-fragment/index.html?dark`);
  await p.settle(300);
  check('the white badge on a dark page', /app-store-white-da-dk\.svg$/.test(await p.eval(`document.querySelector('.ij-store img').currentSrc`)));
  await p.media([{ name: 'prefers-color-scheme', value: 'light' }]);

  await p.goto(`${base}/fixture/store-tone/index.html`);
  await p.settle(300);
  const tone = await p.eval(`(async () => {
    const img = document.querySelector('.ij-store img');
    await (img.complete ? null : new Promise(r => img.addEventListener('load', r, { once: true })));
    return { src: img.currentSrc, loaded: img.naturalWidth > 0, scripts: document.scripts.length,
      placement: document.querySelector('.ij-store-badge').dataset.umamiEventPlacement };
  })()`);
  check('without JavaScript, the white variant stays white for a visitor in light mode, placed midpage',
    /app-store-white-da-dk\.svg$/.test(tone.src) && tone.loaded && tone.scripts === 0 && tone.placement === 'midpage',
    JSON.stringify(tone));

  await p.goto(`${base}/fixture/store-element/index.html`);
  await p.eval(`customElements.whenDefined('ij-store-cta')`);
  await p.settle(300);
  const el = await p.eval(`(() => {
    const reg = document.querySelector('#from-registry'), pin = document.querySelector('#pinned');
    const ri = reg.querySelector('img'), pi = pin.querySelector('img');
    return { regSrc: ri && ri.getAttribute('src'), regLoaded: !!ri && ri.naturalWidth > 0,
      regPlacement: reg.querySelector('.ij-store-badge')?.dataset.umamiEventPlacement,
      regFacts: reg.querySelector('.ij-store-facts')?.textContent,
      pinSrc: pi.src, pinSource: !!pin.querySelector('source'),
      unknown: document.querySelector('#unknown').innerHTML.trim() };
  })()`);
  check('empty, it renders from the registry — Mac badge, facts, placement', /mac-app-store-black-en-us\.svg$/.test(el.regSrc || '') &&
    el.regLoaded && el.regPlacement === 'midpage' && el.regFacts === '$1.99 once · macOS 14 or later', JSON.stringify(el));
  check('tone="white" pins the badge for an always-dark site', /app-store-white-en-us\.svg$/.test(el.pinSrc) && !el.pinSource, el.pinSrc);
  check('an app with no store entry renders nothing and says why', el.unknown === '' &&
    p.console.some(m => m.type === 'error' && m.text.includes('no store entry for app "nope"')));

  // The marketing kit (#65): two demo pages, the same markup under two
  // identities. Each must read in full at both ends of the scale, with nothing
  // moving on load and no text below AA on whatever it sits on.
  console.log('\nMarketing kit:');
  const KIT_SECTIONS = ['.ij-hero', '.ij-phone', '.ij-statements', '.ij-card', '.ij-tour', '.ij-traits',
    '.ij-assurances', '.ij-maker', '.ij-source', '.ij-staircase', '.ij-scene', '.ij-window', '.ij-reviews', '.ij-closing'];
  // Walkful cites a dated source; Wean has none by its brief and shows its
  // taper staircase in that place instead (wean-nicotine#396, #75).
  // WODrounds alone sets its mood with photos (#81).
  // It's mono (#83) is a Mac app: a window, not a phone, and reviews set as type.
  const PHONE = ['.ij-window', '.ij-reviews'];
  const notOn = { walkful: ['.ij-staircase', ...PHONE], wean: ['.ij-source', '.ij-staircase', ...PHONE],
    wodrounds: ['.ij-staircase', '.ij-source', '.ij-statements', ...PHONE], 'its-mono-yo': ['.ij-phone', '.ij-source', '.ij-staircase', '.ij-scene'],
    // Anvil and TonVault (#91) use no drawings: the app's data is the picture.
    'anvil-workout': ['.ij-statements', '.ij-source', '.ij-staircase', '.ij-scene', ...PHONE],
    tonvault: ['.ij-phone', '.ij-statements', '.ij-tour', '.ij-source', '.ij-staircase', '.ij-scene', '.ij-reviews'],
    // TrimrPix (#96): before and after as the picture, one for each platform.
    trimrpix: ['.ij-phone', '.ij-statements', '.ij-card', '.ij-source', '.ij-staircase', '.ij-scene', '.ij-reviews'],
    'trimrpix-ios': ['.ij-window', '.ij-statements', '.ij-card', '.ij-source', '.ij-staircase', '.ij-scene', '.ij-reviews'] };
  const kitProbe = `(() => {
    const lum = c => { const m = c.match(/[\\d.]+/g).map(Number); const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
    const ground = el => { for (let n = el; n; n = n.parentElement) { const b = getComputedStyle(n).backgroundColor;
      if (b && !/rgba\\(.*, 0\\)$/.test(b) && b !== 'transparent') return b; } return 'rgb(255, 255, 255)'; };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const texts = [...document.querySelectorAll('main p, main h1, main h2, main h3, main blockquote, main figcaption')]
      .filter(e => e.offsetParent && e.textContent.trim());
    const low = texts.map(e => [e.textContent.trim().slice(0, 30), ratio(getComputedStyle(e).color, ground(e))]).filter(([, r]) => r < 4.5);
    const missing = ${JSON.stringify(KIT_SECTIONS)}.filter(sel => !document.querySelector(sel) || !document.querySelector(sel).getBoundingClientRect().height);
    const h1 = getComputedStyle(document.querySelector('h1'));
    const body = parseFloat(getComputedStyle(document.querySelector(':is(.ij-statement__text, .ij-row__text, .ij-card, .ij-trait) p:not(.ij-label, .ij-numeral)')).fontSize);
    const imgs = [...document.querySelectorAll('main img')];
    const hero = document.querySelector('.ij-hero');
    const lazyWrong = imgs.filter(i => hero.contains(i) ? i.loading === 'lazy' : i.loading !== 'lazy').map(i => i.alt);
    const screens = [...document.querySelectorAll('.ij-tour__screens > [data-step]')].map(e => Math.round(e.getBoundingClientRect().top));
    const hasTour = !!document.querySelector('.ij-tour');
    // The page's own rules must not reach into the components (#72): the nav's
    // CTA keeps its on-accent text, its links keep text colours, and the footer
    // lines up with the content.
    const swatch = v => { const i = document.createElement('i'); i.style.color = 'var(' + v + ')'; document.body.append(i); const c = getComputedStyle(i).color; i.remove(); return c; };
    const cta = document.querySelector('ij-nav a[slot="cta"]');
    const navLinks = [...document.querySelectorAll('ij-nav a[slot="brand"], ij-nav a[slot="links"]')].map(a => getComputedStyle(a).color);
    const ft = document.querySelector('ij-footer').getBoundingClientRect(), ct = document.querySelector('main .ij-container').getBoundingClientRect();
    return { overflow: document.documentElement.scrollWidth - innerWidth, missing, low, h1: parseFloat(h1.fontSize),
      face: h1.fontFamily, axes: h1.fontVariationSettings, body, lazyWrong, animations: document.getAnimations().length,
      screensInARow: !hasTour || (screens.length > 1 && screens.every(t => t === screens[0])), bg: getComputedStyle(document.body).backgroundColor,
      ctaRatio: ratio(getComputedStyle(cta).color, getComputedStyle(cta).backgroundColor),
      navNoAccent: !navLinks.includes(swatch('--ij-color-accent-text')),
      footerAligned: Math.abs(ft.left - ct.left) <= 1 && Math.abs(ft.width - ct.width) <= 1,
      wordmarkFits: (() => { const wm = document.querySelector('.ij-wordmark'), r = document.createRange(); r.selectNodeContents(wm);
        return r.getBoundingClientRect().width <= wm.closest('.ij-closing').getBoundingClientRect().width + 1; })() };
  })()`;
  for (const [demo, bg, faceRe] of [['walkful', 'rgb(245, 239, 230)', /Fraunces/], ['wean', 'rgb(230, 236, 239)', /Instrument Sans/],
    ['wodrounds', 'rgb(11, 12, 13)', /JetBrains Mono/], ['its-mono-yo', 'rgb(13, 15, 19)', /JetBrains Mono/],
    ['anvil-workout', 'rgb(243, 243, 239)', /Outfit/], ['tonvault', 'rgb(245, 244, 238)', /JetBrains Mono/],
    ['trimrpix', 'rgb(241, 240, 246)', /Bricolage Grotesque/], ['trimrpix-ios', 'rgb(241, 240, 246)', /Bricolage Grotesque/]]) {
    for (const [w, h, size] of [[1440, 900, 96], [375, 812, 52]]) {
      await p.viewport(w, h);
      await p.goto(`${base}/kit/${demo}.html`);
      await p.eval(`document.fonts.ready`);
      await p.settle(200);
      const k = await p.eval(kitProbe);
      k.missing = k.missing.filter(sel => !notOn[demo].includes(sel));
      check(`${demo} at ${w}: every section, no overflow, headline ${size} px in the site's face, body 18 px or more`,
        k.missing.length === 0 && k.overflow <= 0 && Math.abs(k.h1 - size) < 1 && faceRe.test(k.face) && k.body >= 18 && k.bg === bg &&
        (demo !== 'walkful' || k.axes === '"SOFT" 100'),
        JSON.stringify({ missing: k.missing, overflow: k.overflow, h1: k.h1, face: k.face, axes: k.axes, body: k.body, bg: k.bg }));
      check(`${demo} at ${w}: every text at AA on what it sits on, nothing moving on load`,
        k.low.length === 0 && k.animations === 0, JSON.stringify({ low: k.low, animations: k.animations }));
      if (w === 1440) check(`${demo}: the hero loads at once, everything below it lazily`, k.lazyWrong.length === 0, k.lazyWrong.join(', '));
      check(`${demo} at ${w}: the nav keeps its own colours (CTA at AA on its fill, no accent text) and the footer lines up with the content`,
        k.ctaRatio >= 4.5 && k.navNoAccent && k.footerAligned && k.wordmarkFits,
        JSON.stringify({ cta: k.ctaRatio, navNoAccent: k.navNoAccent, footer: k.footerAligned, wordmark: k.wordmarkFits }));
    }
    await p.viewport(1440, 900);
    await p.goto(`${base}/nojs/kit/${demo}.html`);
    await p.settle(200);
    const n = await p.eval(kitProbe);
    n.missing = n.missing.filter(sel => !notOn[demo].includes(sel));
    check(`${demo} without JavaScript: every section reads, and the phone that stays is a row of screens`,
      n.missing.length === 0 && n.low.length === 0 && n.screensInARow && await p.eval(`document.scripts.length === 0`),
      JSON.stringify({ missing: n.missing, low: n.low, row: n.screensInARow }));
  }
  // The kit in the dark, for a visitor whose system is dark too: the probe
  // above ran it for a light one. Nothing may change but the system's mode.
  await p.media([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await p.viewport(1440, 900);
  await p.goto(`${base}/kit/wodrounds.html`);
  await p.eval('document.fonts.ready');
  await p.settle(200);
  const dk = await p.eval(kitProbe);
  dk.missing = dk.missing.filter(sel => !notOn.wodrounds.includes(sel));
  const badge = await p.eval(`[...document.querySelectorAll('.ij-store-badge img')].every(i => /app-store-white-/.test(i.src))`);
  check('the WODrounds example reads the same for a visitor in dark mode: every section, every text at AA, the white badge',
    dk.missing.length === 0 && dk.low.length === 0 && dk.bg === 'rgb(11, 12, 13)' && dk.ctaRatio >= 4.5 && dk.wordmarkFits && badge,
    JSON.stringify({ missing: dk.missing, low: dk.low, bg: dk.bg, cta: dk.ctaRatio, badge }));
  await p.media([{ name: 'prefers-color-scheme', value: 'light' }]);
  await p.goto(`${base}/fixture/kit-dark-drawing/index.html`);
  await p.settle(150);
  const dd = await p.eval(`(() => { const svg = document.querySelector('.ij-drawing');
    return { ink: getComputedStyle(svg.querySelector('g:last-of-type path')).stroke, mark: getComputedStyle(svg.querySelector('.ij-mark')).stroke,
      bg: getComputedStyle(document.body).backgroundColor, edge: getComputedStyle(document.documentElement).getPropertyValue('--ij-color-border-default').trim() }; })()`);
  check('a drawing on a dark site takes the light ink and keeps its one line in the accent; the phone\'s edge is the dark border colour',
    dd.ink === 'rgb(242, 243, 239)' && dd.mark === 'rgb(208, 255, 0)' && dd.bg === 'rgb(11, 12, 13)' && /255, 255, 255/.test(dd.edge), JSON.stringify(dd));

  // WODrounds (#78): a timer's digits must not shift, so .ij-numeral sets
  // tabular figures and, in the face the page uses, every digit is as wide as
  // the next; and the television and the watch stand framed at both widths.
  for (const [w, h] of [[1440, 900], [375, 812]]) {
    await p.viewport(w, h);
    await p.goto(`${base}/kit/wodrounds.html`);
    await p.eval('document.fonts.ready');
    await p.settle(150);
    const wd = await p.eval(`(() => {
      const n = document.querySelector('.ij-numeral'), cs = getComputedStyle(n);
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.font = cs.fontWeight + ' 100px ' + cs.fontFamily;
      const widths = [...'0123456789'].map(d => +ctx.measureText(d).width.toFixed(2));
      const box = sel => { const e = document.querySelector(sel), r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; };
      const tv = document.querySelector('.ij-tv'), watch = document.querySelector('.ij-watch');
      return { numeric: cs.fontVariantNumeric, face: cs.fontFamily, digits: new Set(widths).size,
        tv: box('.ij-tv'), tvScreen: box('.ij-tv__screen'), watch: box('.ij-watch'), watchScreen: box('.ij-watch__screen'),
        foot: getComputedStyle(tv, '::after').content !== 'none', straps: getComputedStyle(watch, '::before').content !== 'none' && getComputedStyle(watch, '::after').content !== 'none',
        edge: [tv, watch].every(e => getComputedStyle(e).boxShadow.includes(getComputedStyle(document.documentElement).getPropertyValue('--ij-color-border-default').trim())) };
    })()`);
    if (w === 1440) check('WODrounds\' numerals set tabular figures, and every digit of JetBrains Mono is as wide as the next',
      /tabular-nums/.test(wd.numeric) && /JetBrains Mono/.test(wd.face) && wd.digits === 1, JSON.stringify({ numeric: wd.numeric, digits: wd.digits }));
    check(`at ${w}: the television and the watch stand framed, with an edge, the TV on a foot, the watch between its straps`,
      wd.tv.w >= 200 && Math.abs(wd.tvScreen.h / wd.tvScreen.w - 9 / 16) < 0.02 && wd.watch.w >= 100 &&
      Math.abs(wd.watchScreen.h / wd.watchScreen.w - 496 / 416) < 0.03 && wd.foot && wd.straps && wd.edge, JSON.stringify(wd));
  }
  await p.viewport(1440, 900);

  // A scene (#81): words on a photo read at AA whatever the photo is. Paint
  // the worst one, white under a dark site's light text and black under a
  // light site's dark text, hide the words, and read every pixel they would
  // sit on; the lowest contrast with each text's colour must still be 4.5:1.
  // The photo must still show above the words, or the scene is only a ground.
  for (const [name, label] of [['kit-scene-dark', 'a white photo on a dark site'], ['kit-scene-light', 'a black photo on a light site']]) {
    for (const [w, h] of [[1440, 900], [375, 812]]) {
      await p.viewport(w, h);
      await p.goto(`${base}/fixture/${name}/index.html`);
      await p.settle(150);
      const texts = await p.eval(`(() => {
        const rgb = c => c.match(/[\\d.]+/g).slice(0, 3).map(Number);
        const scene = document.querySelector('.ij-scene').getBoundingClientRect();
        const out = [...document.querySelectorAll('.ij-scene :is(h2, p, a)')].map(e => { const r = e.getBoundingClientRect();
          return { text: e.textContent.trim().slice(0, 24), color: rgb(getComputedStyle(e).color),
            clip: { x: Math.max(0, r.left), y: r.top + scrollY, width: Math.min(r.width, innerWidth - Math.max(0, r.left)), height: r.height } }; });
        const s = document.createElement('style'); s.textContent = '.ij-scene * { color: transparent !important; text-decoration-color: transparent !important; }';
        document.head.append(s);
        return { out, top: { x: 0, y: scene.top + scrollY, width: innerWidth, height: 24 },
          ground: rgb(getComputedStyle(document.querySelector('.ij-page')).backgroundColor), overflow: document.documentElement.scrollWidth - innerWidth };
      })()`);
      await p.settle(50);
      const worst = [];
      for (const t of texts.out) {
        const px = pngPixels(await p.screenshot({ clip: t.clip }));
        let min = Infinity;
        for (let i = 0; i < px.data.length; i += px.channels) min = Math.min(min, contrast(t.color, [px.data[i], px.data[i + 1], px.data[i + 2]]));
        worst.push([t.text, +min.toFixed(2)]);
      }
      const top = pngPixels(await p.screenshot({ clip: texts.top }));
      const mid = (12 * top.width + (top.width >> 1)) * top.channels;
      const shows = contrast([top.data[mid], top.data[mid + 1], top.data[mid + 2]], texts.ground) >= 3;
      const low = worst.filter(([, r]) => r < 4.5);
      check(`a scene at ${w}, ${label}: every text at AA on what is painted under it, the photo showing above the words`,
        low.length === 0 && worst.length === 5 && shows && texts.overflow <= 0,
        JSON.stringify({ worst, shows, overflow: texts.overflow }));
    }
  }
  await p.viewport(1440, 900);

  // It's mono (#83): a Mac window clipped to its own corners, at a hair over
  // the captures' 1.9% so a video's black-masked corners never show, with the
  // border colour's edge; cards drawn as bordered panels on this site only; and
  // the eleven drawings readable at phone width, each with its one lime line.
  for (const [w, h] of [[1440, 900], [375, 812]]) {
    await p.viewport(w, h);
    await p.goto(`${base}/kit/its-mono-yo.html`);
    await p.settle(200);
    const mono = await p.eval(`(() => {
      const edge = getComputedStyle(document.documentElement).getPropertyValue('--ij-color-border-default').trim();
      const media = [...document.querySelectorAll('.ij-window > img, .ij-window > video')].filter(m => m.getClientRects().length);
      const clip = media.map(m => { const r = m.getBoundingClientRect(), rad = parseFloat(getComputedStyle(m).borderTopLeftRadius);
        return +(rad / r.width).toFixed(4); });
      const panels = ['.ij-card', '.ij-trait', '.ij-review'].map(sel => { const cs = getComputedStyle(document.querySelector(sel));
        return cs.borderTopWidth === '1px' && cs.borderTopStyle === 'solid'; });
      const ds = [...document.querySelectorAll('svg[class*="ij-drawing--its-mono-yo-"]')];
      const spill = [...document.querySelectorAll('.ij-trait')].filter(t => t.scrollWidth > t.clientWidth + 1).length;
      return { clip, edge: media.every(m => getComputedStyle(m).boxShadow.includes(edge)), panels, spill,
        drawings: ds.length, narrowest: Math.min(...ds.map(d => Math.round(d.getBoundingClientRect().width))),
        marks: [...new Set(ds.map(d => getComputedStyle(d.querySelector('.ij-mark')).stroke))], ink: getComputedStyle(ds[0].querySelector('g:last-of-type path')).stroke };
    })()`);
    check(`It's mono at ${w}: every window clipped at 2% of its width with an edge, the cards bordered, eleven drawings readable, one lime line each, nothing past its card`,
      mono.clip.length >= 2 && mono.clip.every(c => c >= 0.0193 && c <= 0.021) && mono.edge && mono.panels.every(Boolean) &&
      mono.drawings === 11 && mono.narrowest >= 120 && mono.spill === 0 && mono.marks.join() === 'rgb(208, 255, 0)' && mono.ink === 'rgb(237, 239, 242)', JSON.stringify(mono));
  }
  await p.goto(`${base}/kit/walkful.html`);
  await p.settle(100);
  check('a site without bordered panels keeps its cards flat', await p.eval(`getComputedStyle(document.querySelector('.ij-card')).borderTopWidth === '0px'`));

  // Photo scenes with the one magenta line (#90), on Walkful and Wean at both
  // ends of the scale: the line in the accent at its width, cropped with the
  // photo so it stays inside the scene, above the scene's dimming; the photo in
  // monochrome, Wean's mirrored; and the line falling left to right on Wean.
  for (const [demo, w, h] of [['walkful', 1440, 900], ['walkful', 375, 812], ['wean', 1440, 900], ['wean', 375, 812]]) {
    await p.viewport(w, h);
    await p.goto(`${base}/kit/${demo}.html`);
    await p.settle(150);
    const sc = await p.eval(`(() => {
      const scene = document.querySelector('.ij-scene:has(.ij-scene__line)'), line = scene.querySelector('.ij-scene__line path');
      const photo = scene.querySelector('.ij-scene__photo'), a = scene.getBoundingClientRect(), b = line.getBoundingClientRect();
      const len = line.getTotalLength(), m = line.getScreenCTM(), at = t => { const q = line.getPointAtLength(len * t); return [q.x * m.a + m.e, q.y * m.d + m.f]; };
      return { stroke: getComputedStyle(line).stroke, effect: getComputedStyle(line).vectorEffect, filter: getComputedStyle(photo).filter,
        mirrored: getComputedStyle(photo).transform, z: getComputedStyle(scene.querySelector('.ij-scene__line')).zIndex,
        inside: b.width > 20 && b.left >= a.left - 2 && b.right <= a.right + 2 && b.top >= a.top - 2 && b.bottom <= a.bottom + 2,
        visible: (Math.min(b.right, a.right) - Math.max(b.left, a.left)) * (Math.min(b.bottom, a.bottom) - Math.max(b.top, a.top)) > 0,
        start: at(0.02), end: at(0.98) };
    })()`);
    check(`${demo} at ${w}: the scene's magenta line in the accent, cropped with its photo, over a monochrome photo${demo === 'wean' ? ', mirrored, the line falling left to right' : ''}`,
      sc.stroke === 'rgb(241, 64, 254)' && sc.effect === 'non-scaling-stroke' && sc.filter === 'grayscale(1)' && sc.visible && sc.z === '0' &&
      (demo === 'wean' ? sc.mirrored === 'matrix(-1, 0, 0, 1, 0, 0)' && sc.end[0] > sc.start[0] && sc.end[1] > sc.start[1] : sc.mirrored === 'none'),
      JSON.stringify(sc));
  }
  await p.viewport(1440, 900);

  // Motion (#65): two things move, and only when they may.
  await p.viewport(1440, 900);
  await p.media([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  await p.goto(`${base}/fixture/kit-loop/index.html`);
  await p.settle(300);
  const played = await p.eval('window.__plays');
  await p.eval('scrollTo(0, 2500)');
  await p.settle(300);
  check('a screen recording plays while it is on screen and pauses when it leaves',
    played >= 1 && await p.eval('window.__pauses') >= 1, JSON.stringify({ played, paused: await p.eval('window.__pauses') }));
  await p.media([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await p.goto(`${base}/fixture/kit-loop/index.html`);
  await p.settle(300);
  check('with reduce motion on, it never plays: the poster stays', await p.eval('window.__plays') === 0);
  await p.media([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  await p.goto(`${base}/fixture/kit-loop/index.html`);
  await p.settle(300);
  const before = await p.eval('window.__pauses');
  await p.media([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await p.settle(200);
  check('turning reduce motion on while it plays pauses it', await p.eval('window.__pauses') > before);
  await p.media([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);

  const tourState = `(() => {
    const t = document.querySelector('.ij-tour'), sc = t.querySelector('.ij-tour__screens');
    const ph = [...sc.querySelectorAll(':scope > [data-step]')];
    return { live: t.classList.contains('is-live'), ready: t.classList.contains('is-ready'), active: t.dataset.active ?? null,
      position: getComputedStyle(sc).position, opacities: ph.map(e => getComputedStyle(e).opacity),
      phoneTop: Math.round((ph.find(e => e.classList.contains('is-active')) ?? ph[0]).getBoundingClientRect().top),
      phoneSize: (r => [Math.round(r.width), Math.round(r.height)])((ph.find(e => e.classList.contains('is-active')) ?? ph[0]).getBoundingClientRect()),
      stepOpacity: [...t.querySelectorAll('.ij-tour__step')].map(e => getComputedStyle(e).opacity),
      animations: document.getAnimations().length };
  })()`;
  await p.goto(`${base}/kit/walkful.html`);
  await p.settle(300);
  const atLoad = await p.eval(tourState);
  check('nothing moves on load, though the tour has gone live', atLoad.live && atLoad.animations === 0, JSON.stringify(atLoad));
  const at = async step => {
    await p.eval(`document.querySelector('.ij-tour__step[data-step="${step}"]').scrollIntoView({ block: 'center' })`);
    await p.settle(700);
    return p.eval(tourState);
  };
  const one = await at(1), two = await at(2), three = await at(3);
  // From the second text on, the phone has reached its place and holds it.
  check('the phone that stays holds still and changes screen with the text in the middle',
    one.position === 'sticky' && one.active === '1' && two.active === '2' && three.active === '3' && two.ready &&
    two.opacities.join() === '0,1,0' && three.opacities.join() === '0,0,1' && Math.abs(two.phoneTop - three.phoneTop) <= 2 &&
    two.phoneSize[0] >= 280 && two.phoneSize[1] >= 600,
    JSON.stringify({ one, two, three }));
  check('no feature text is ever dimmed', two.stepOpacity.every(o => o === '1'), two.stepOpacity.join());
  await p.media([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await p.goto(`${base}/kit/walkful.html`);
  await p.settle(300);
  const still = await p.eval(tourState);
  await p.media([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  await p.viewport(375, 812);
  await p.goto(`${base}/kit/walkful.html`);
  await p.settle(300);
  const narrow = await p.eval(tourState);
  check('with reduce motion on, or on a phone, the tour stays a row of screens',
    !still.live && still.opacities.every(o => o === '1') && !narrow.live, JSON.stringify({ still, narrow }));

  // Anvil and TonVault (#91). Anvil: headlines in Outfit and every number in
  // JetBrains Mono with tabular figures, the record's highlight black on the
  // magenta. TonVault: the lime is never text on the paper; it is a highlight
  // behind black text and the fill of the waveforms, which an ink edge carries.
  for (const [w, h] of [[1440, 900], [375, 812]]) {
    await p.viewport(w, h);
    await p.goto(`${base}/kit/anvil-workout.html`);
    await p.eval('document.fonts.ready');
    await p.settle(150);
    const an = await p.eval(`(() => {
      const lum = c => { const m = c.match(/[\\d.]+/g).map(Number); const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
        return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
      const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
      const h1 = getComputedStyle(document.querySelector('h1')).fontFamily;
      const nums = [...document.querySelectorAll('.ij-numeral, .ij-data .ij-num')].map(e => getComputedStyle(e));
      const mark = getComputedStyle(document.querySelector('mark'));
      return { h1, mono: nums.every(cs => /JetBrains Mono/.test(cs.fontFamily) && /tabular-nums/.test(cs.fontVariantNumeric)), count: nums.length,
        mark: +ratio(mark.color, mark.backgroundColor).toFixed(2), markBg: mark.backgroundColor, overflow: document.documentElement.scrollWidth - innerWidth };
    })()`);
    check(`Anvil at ${w}: headlines in Outfit, every number in JetBrains Mono with tabular figures, the record's highlight at AA`,
      /Outfit/.test(an.h1) && an.mono && an.count >= 9 && an.markBg === 'rgb(241, 64, 254)' && an.mark >= 4.5 && an.overflow <= 0, JSON.stringify(an));
    await p.goto(`${base}/kit/tonvault.html`);
    await p.eval('document.fonts.ready');
    await p.settle(150);
    const tv = await p.eval(`(() => {
      const lime = 'rgb(208, 255, 0)';
      const asText = [...document.querySelectorAll('main *')].filter(e => e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) &&
        getComputedStyle(e).color === lime).map(e => e.tagName + '.' + e.className);
      const marks = [...document.querySelectorAll('main mark')].map(m => [getComputedStyle(m).backgroundColor, getComputedStyle(m).color]);
      const waves = [...document.querySelectorAll('.ij-wave path')].map(p => [getComputedStyle(p).fill, getComputedStyle(p).stroke]);
      const panel = getComputedStyle(document.querySelector('.ij-trait')).borderTopWidth;
      const label = getComputedStyle(document.querySelector('.ij-label')).textTransform;
      return { asText, marks: [...new Set(marks.map(m => m.join(' on ')))], waves: [...new Set(waves.map(w => w.join(' / ')))], count: waves.length, panel, label,
        overflow: document.documentElement.scrollWidth - innerWidth };
    })()`);
    check(`TonVault at ${w}: no lime text, lime as a highlight behind black and the waveforms' fill with an ink edge, bordered panels, labels in capitals`,
      tv.asText.length === 0 && tv.marks.join() === 'rgb(208, 255, 0) on rgb(0, 0, 0)' && tv.count === 5 &&
      tv.waves.join() === 'rgb(208, 255, 0) / rgb(20, 20, 20)' && tv.panel === '1px' && tv.label === 'uppercase' && tv.overflow <= 0, JSON.stringify(tv));
  }

  // TrimrPix (#96): one light look on both sites, Bricolage Grotesque for the
  // headlines and the numeral face for every size; the same photo twice, side
  // by side when there's room and stacked on a phone, each labelled with its
  // size; size chips in the numeral face; and on the Mac the lime only ever
  // behind black text.
  for (const [demo, w, h] of [['trimrpix', 1440, 900], ['trimrpix', 375, 812], ['trimrpix-ios', 1440, 900], ['trimrpix-ios', 375, 812]]) {
    await p.viewport(w, h);
    await p.goto(`${base}/kit/${demo}.html`);
    await p.eval('document.fonts.ready');
    await p.settle(150);
    const tp = await p.eval(`(() => {
      const items = [...document.querySelectorAll('.ij-compare__item')], imgs = items.map(i => i.querySelector('img'));
      const [a, b] = items.map(i => i.getBoundingClientRect());
      const sizes = items.map(i => i.querySelector('.ij-num')).map(n => [n.textContent.trim(), getComputedStyle(n).fontFamily]);
      const chips = [...document.querySelectorAll('.ij-chip')].map(c => getComputedStyle(c).fontFamily);
      const lime = 'rgb(208, 255, 0)';
      const limeText = [...document.querySelectorAll('main *')].filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && getComputedStyle(e).color === lime).length;
      const marks = [...new Set([...document.querySelectorAll('main mark')].map(m => getComputedStyle(m).color))];
      return { h1: getComputedStyle(document.querySelector('h1')).fontFamily, same: imgs.length === 2 && imgs[0].src.split('?')[0] === imgs[1].src.split('?')[0],
        sizes, chips: chips.length && chips.every(f => /JetBrains Mono/.test(f)), side: Math.abs(a.top - b.top) < 1, stacked: b.top > a.bottom - 1,
        limeText, marks, overflow: document.documentElement.scrollWidth - innerWidth };
    })()`);
    check(`${demo} at ${w}: headlines in Bricolage Grotesque, the same photo twice with its sizes in mono, ${w > 700 ? 'side by side' : 'stacked'}, size chips, highlights black, no lime text`,
      /Bricolage Grotesque/.test(tp.h1) && tp.same && tp.sizes.length === 2 && tp.sizes.every(([t, f]) => /\d MB$/.test(t) && /JetBrains Mono/.test(f)) && tp.chips &&
      (w > 700 ? tp.side : tp.stacked) && tp.limeText === 0 && tp.marks.join() === 'rgb(0, 0, 0)' && tp.overflow <= 0, JSON.stringify(tp));
  }

  // The window that stays: the same tour with a window in the wider column,
  // holding still while the texts pass, and changing with the one in the middle.
  await p.viewport(1440, 900);
  await p.goto(`${base}/kit/its-mono-yo.html`);
  await p.settle(300);
  const wAt = async step => {
    await p.eval(`document.querySelector('.ij-tour__step[data-step="${step}"]').scrollIntoView({ block: 'center' })`);
    await p.settle(300);
    // Read it at rest: a crossfade still running reads as neither screen.
    await p.eval(`Promise.all(document.getAnimations().map(a => a.finished.catch(() => {})))`);
    await p.settle(50);
    return p.eval(tourState);
  };
  const w1 = await wAt(1), w2 = await wAt(2), w3 = await wAt(3);
  check('the window that stays holds still, changes with the text in the middle, and takes the wider column',
    w1.live && w1.position === 'sticky' && w2.active === '2' && w3.active === '3' && w3.opacities.join() === '0,0,1' &&
    Math.abs(w2.phoneTop - w3.phoneTop) <= 2 && w2.phoneSize[0] >= 560 && Math.abs(w2.phoneSize[1] / w2.phoneSize[0] - 1280 / 1800) < 0.02,
    JSON.stringify({ w1, w2, w3 }));
  await p.viewport(1440, 900);

  // A stack spaces every child after the first (#88). Kit classes that reset
  // their own margin, later in kit.css and as specific, used to win: a source
  // card sat flush on its heading. Every later child of a stack, on every
  // example, must keep the stack's spacing.
  for (const demo of ['walkful', 'wean', 'wodrounds', 'its-mono-yo', 'anvil-workout', 'tonvault', 'trimrpix', 'trimrpix-ios']) {
    await p.viewport(1440, 900);
    await p.goto(`${base}/kit/${demo}.html`);
    await p.settle(100);
    const flush = await p.eval(`(() => { const want = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ij-mkt-space-stack')) || 0;
      const kids = [...document.querySelectorAll('.ij-stack > * + *')];
      const space = parseFloat(getComputedStyle(kids[0]).marginTop);
      return { n: kids.length, space, flush: kids.filter(k => Math.abs(parseFloat(getComputedStyle(k).marginTop) - space) > 0.5)
        .map(k => k.className || k.tagName) }; })()`);
    check(`${demo}: every later child of a stack keeps the stack's spacing`, flush.n > 0 && flush.space >= 16 && flush.flush.length === 0, JSON.stringify(flush));
  }

  // The row of screens (#80): a centred row wider than its scroller hid the
  // first screen past the start edge on a phone, where nothing could scroll to
  // it. It must start at the edge when it overflows, and stay centred when it fits.
  const rowProbe = `(() => { const sc = document.querySelector('.ij-tour__screens'), ph = [...sc.children];
    const r = sc.getBoundingClientRect(), first = ph[0].getBoundingClientRect(), last = ph.at(-1).getBoundingClientRect();
    return { overflows: sc.scrollWidth > sc.clientWidth + 1, start: Math.round(first.left - r.left), end: Math.round(r.right - last.right) }; })()`;
  for (const demo of ['walkful', 'wean', 'wodrounds', 'its-mono-yo', 'anvil-workout', 'trimrpix-ios']) {
    await p.viewport(375, 812);
    await p.goto(`${base}/kit/${demo}.html`);
    await p.settle(200);
    const row = await p.eval(rowProbe);
    check(`${demo} at 375: the row of screens starts at the edge, so the first screen can be seen`,
      row.overflows && row.start >= 0, JSON.stringify(row));
  }
  await p.media([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await p.viewport(1440, 900);
  await p.goto(`${base}/kit/walkful.html`);
  await p.settle(200);
  const fits = await p.eval(rowProbe);
  await p.media([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  check('with reduce motion at 1440, the row fits and stays centred', !fits.overflows && Math.abs(fits.start - fits.end) <= 2, JSON.stringify(fits));

  // The kit's skip link (#84): the link rule had turned a page's own skip link
  // into lime on lime, under the sticky nav. .ij-skip is the first stop, reads
  // at AA in the accent with its on-accent text, nothing covers it, and the nav
  // leaves out its own so there is one.
  for (const [demo, w, h] of [['wodrounds', 1440, 900], ['wodrounds', 375, 812], ['walkful', 1440, 900]]) {
    await p.viewport(w, h);
    await p.goto(`${base}/kit/${demo}.html`);
    await p.eval(`customElements.whenDefined('ij-nav')`);
    await p.settle(150);
    await p.key('Tab');
    const sk = await p.eval(`(() => {
      const a = document.activeElement, r = a.getBoundingClientRect(), cs = getComputedStyle(a);
      const lum = c => { const m = c.match(/[\\d.]+/g).map(Number); const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
        return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
      const bg = /rgba\\(.*, 0\\)$|transparent/.test(cs.backgroundColor) ? getComputedStyle(document.body).backgroundColor : cs.backgroundColor;
      const [x, y] = [lum(cs.color), lum(bg)].sort((m, n) => n - m);
      return { cls: a.className, inView: r.top >= 0 && r.bottom <= innerHeight, top: document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === a,
        ratio: +((x + 0.05) / (y + 0.05)).toFixed(2), navSkip: !!document.querySelector('ij-nav').shadowRoot.querySelector('.skip') };
    })()`);
    check(`${demo} at ${w}: the first Tab lands on the kit's skip link, on top of the nav, at AA, and the nav adds no second one`,
      sk.cls === 'ij-skip' && sk.inView && sk.top && sk.ratio >= 4.5 && !sk.navSkip, JSON.stringify(sk));
  }

  await p.viewport(1024, 800);

  // The components' own words in the page's language (#80).
  await p.viewport(375, 812);
  await p.goto(`${base}/fixture/labels-sv/index.html`);
  await p.eval(`Promise.all([customElements.whenDefined('ij-nav'), customElements.whenDefined('ij-footer')])`);
  await p.settle(150);
  const sv = await p.eval(`(() => { const nav = document.querySelector('ij-nav').shadowRoot, f = document.getElementById('sv-footer').shadowRoot,
    own = document.getElementById('own-words').shadowRoot;
    return { landmark: nav.querySelector('nav')?.getAttribute('aria-label'), skip: nav.querySelector('.skip')?.textContent, menu: nav.querySelector('.toggle .visually-hidden')?.textContent,
      more: f.querySelector('#more')?.textContent, projects: f.querySelector('a[href="https://iamjarl.com"]')?.textContent,
      override: own.querySelector('#more')?.textContent }; })()`);
  check('on a Swedish page the nav (its landmark too) and the footer speak Swedish, and an attribute still overrides a word',
    sv.landmark === 'Huvudmeny' && sv.skip === 'Till innehållet' && sv.menu === 'Meny' && sv.more === 'Mer från IAMJARL' && sv.projects === 'Alla projekt' && sv.override === 'Fler appar',
    JSON.stringify(sv));
  await p.viewport(1024, 800);

  // Footer: the manual checks that have already caught real bugs.
  console.log('\n<ij-footer>:');
  // Without JavaScript (#84): a footer with a fallback showed it and its
  // slotted links and fineprint, so the copyright line came twice.
  for (const name of ['footer-nojs', 'footer-js']) {
    await p.goto(`${base}/fixture/${name}/index.html`);
    if (name === 'footer-js') await p.eval(`customElements.whenDefined('ij-footer')`);
    await p.settle(150);
    const ft = await p.eval(`(() => {
      const shown = e => e.getClientRects().length > 0;
      const a = document.getElementById('with-fallback'), b = document.getElementById('no-fallback');
      return { fallback: shown(document.getElementById('fallback')), slottedA: [...a.children].filter(c => c.slot && shown(c)).length,
        slottedB: [...b.children].filter(c => c.slot && shown(c)).length };
    })()`);
    check(name === 'footer-nojs'
      ? 'without JavaScript, a footer with a fallback shows only the fallback, and one without shows its slotted links'
      : 'with JavaScript, the footer shows its slotted links and not the fallback',
      name === 'footer-nojs' ? ft.fallback && ft.slottedA === 0 && ft.slottedB === 2 : !ft.fallback && ft.slottedA === 3 && ft.slottedB === 2,
      JSON.stringify(ft));
  }

  await p.goto(`${base}/fixture/footer-unknown/index.html`);
  await p.settle(150);
  check('an unknown app keeps the fallback visible and logs why', await p.eval(`
    !document.querySelector('ij-footer').shadowRoot && document.getElementById('fallback').getClientRects().length > 0`) &&
    p.console.some(m => m.type === 'error' && m.text.includes('does-not-exist')));

  await p.goto(`${base}/fixture/footer-justify/index.html`);
  await p.settle(150);
  const gaps = await p.eval(`(() => {
    const row = document.querySelector('ij-footer').shadowRoot.querySelector('nav .links');
    const r = row.getBoundingClientRect(), as = [...row.querySelectorAll('a')].map(a => a.getBoundingClientRect());
    const first = as.filter(a => Math.abs(a.top - as[0].top) < 2);
    return { left: Math.min(...first.map(a => a.left)) - r.left, right: r.right - Math.max(...first.map(a => a.right)) };
  })()`);
  check('no links of its own, no empty group for them (It\'s mono\'s case)', await p.eval(`(() => {
    const sr = document.querySelector('ij-footer').shadowRoot;
    return sr.querySelectorAll('.group').length === 1 && !sr.querySelector('slot[name="links"]');
  })()`));
  await p.media([{ name: 'prefers-color-scheme', value: 'light' }]);
  await p.goto(`${base}/fixture/footer-accent/index.html`);
  await p.settle(150);
  const hoverAccent = await p.eval(`getComputedStyle(document.querySelector('ij-footer')).getPropertyValue('--_hover').trim()`);
  await p.goto(`${base}/fixture/footer-justify/index.html`);
  await p.settle(150);
  const hoverPrimary = await p.eval(`getComputedStyle(document.querySelector('ij-footer')).getPropertyValue('--_hover').trim()`);
  check('footer hover is the family accent under an identity sheet, primary without',
    /^(#177082|rgb\(23, 112, 130\))$/i.test(hoverAccent) && /^(#A435D2|rgb\(164, 53, 210\))$/i.test(hoverPrimary),
    `with sheet ${hoverAccent}, without ${hoverPrimary}`);
  await p.media([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await p.goto(`${base}/fixture/identity-light-only/index.html`);
  await p.eval(`Promise.all(['ij-nav', 'ij-footer'].map(t => customElements.whenDefined(t)))`);
  await p.settle(200);
  const lightOnly = await p.eval(`(() => {
    const nav = document.querySelector('ij-nav'), cta = nav.querySelector('[slot="cta"]');
    return { bg: getComputedStyle(document.body).backgroundColor, text: getComputedStyle(document.body).color,
      scheme: getComputedStyle(document.documentElement).colorScheme,
      ctaBg: getComputedStyle(cta).backgroundColor, ctaText: getComputedStyle(cta).color,
      hover: getComputedStyle(document.querySelector('ij-footer')).getPropertyValue('--_hover').trim() };
  })()`);
  check('a light-only identity holds a dark-mode visitor in its own colours: page, nav CTA, footer hover',
    lightOnly.bg === 'rgb(245, 239, 230)' && lightOnly.text === 'rgb(43, 40, 37)' && lightOnly.scheme === 'light' &&
    lightOnly.ctaBg === 'rgb(241, 64, 254)' && lightOnly.ctaText === 'rgb(0, 0, 0)' &&
    /^(#A80FB3|rgb\(168, 15, 179\))$/i.test(lightOnly.hover), JSON.stringify(lightOnly));
  await p.media([{ name: 'prefers-color-scheme', value: 'light' }]);
  await p.goto(`${base}/fixture/footer-justify/index.html`);
  await p.settle(150);
  check('--ij-footer-links-justify: center centres the row', gaps.left > 20 && Math.abs(gaps.left - gaps.right) < 2,
    JSON.stringify(gaps));
} finally {
  await browser.close();
  // Keep-alive sockets would otherwise hold the process open for seconds.
  server.closeAllConnections();
  server.close();
}

console.log();
if (failed > 0) {
  console.error(`❌ ${failed} browser test(s) failed.`);
  process.exit(1);
}
console.log('✅ All browser tests passed.');
