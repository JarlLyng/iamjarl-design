#!/usr/bin/env node
// Browser tests for the components: what the contract tests cannot reach —
// shadow DOM, slots, focus order, keyboard, media queries, and the pre-upgrade
// fallback. Real Chrome over the DevTools protocol (scripts/browser.js), so no
// npm dependency is added.
//
// Without Chrome this skips locally and fails in CI, where it must run.

import http from 'node:http';
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

  'footer-unknown': page({ nav: false, footer: true, body: `
<ij-footer app="does-not-exist"><p id="fallback">© 2026 Fallback</p></ij-footer>` }),

  'footer-justify': page({ nav: false, footer: true, body: `
<div style="width: 900px"><ij-footer app="its-mono-yo" style="text-align: center; --ij-footer-links-justify: center"></ij-footer></div>` }),
};

const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json' };

function serve() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const fx = url.pathname.match(/^\/fixture\/([^/]+)\//);
    if (fx && FIXTURES[fx[1]]) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(FIXTURES[fx[1]]);
    }
    const file = path.join(ROOT, path.normalize(url.pathname));
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
  console.error('\n❌ Browser tests did not finish within 90s.');
  process.exit(1);
}, 90000);
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

  // Footer: the manual checks that have already caught real bugs.
  console.log('\n<ij-footer>:');
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
  check('--ij-footer-links-justify: center centres the row', gaps.left > 20 && Math.abs(gaps.left - gaps.right) < 2,
    JSON.stringify(gaps));
} finally {
  await browser.close();
  server.close();
}

console.log();
if (failed > 0) {
  console.error(`❌ ${failed} browser test(s) failed.`);
  process.exit(1);
}
console.log('✅ All browser tests passed.');
