#!/usr/bin/env node
// Contract tests — verify generated outputs contain the API the docs promise.
// No test framework, just assertions.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHex, parseRgba, parseColor, contrastRatio } from './color.js';
import { extractNotes } from './release-notes.js';
import { selectLinks, categoryReach } from '../components/select-links.js';
import { accentFor } from '../components/accent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

let failed = 0;
function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ ${name}`);
  } else {
    console.error(`  ✗ ${name}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf-8');
}

console.log('Running contract tests...\n');

// --- Swift output ---
console.log('Swift output:');
const swift = read('Sources/IAMJARLDesignTokens/DesignTokens.swift');
const swiftAPI = [
  'public enum DesignTokens',
  'public enum Spacing',
  'public enum Radius',
  'public enum Typography',
  'public enum ColorToken',
  'public enum Shadow',
  'public enum Motion',
  'public enum Container',
  'public enum Breakpoint',
  'public enum Focus',
  'public enum ZIndex',
  'public enum Opacity',
  'public enum Common',
  'public static func primaryHover(_ scheme: ColorScheme)',
  'public enum State {',
  'public static func primary(_ scheme: ColorScheme)',
  'public extension Color',
  'init(hex: String)',
  'init(rgba: String)',
];
for (const sig of swiftAPI) {
  check(`Swift contains "${sig}"`, swift.includes(sig));
}

// --- CSS output ---
console.log('\nCSS output:');
const css = read('dist/css/tokens.css');
const cssVars = [
  '--ij-color-primary',
  '--ij-color-on-primary',
  '--ij-color-text-primary',
  '--ij-color-bg-app',
  '--ij-color-success',
  '--ij-color-error',
  '--ij-color-state-success',
  '--ij-color-primary-hover',
  '--ij-color-text-disabled',
  '--ij-color-bg-disabled',
  '--ij-spacing-md',
  '--ij-radius-lg',
  '--ij-font-size-base',
  '--ij-shadow-md',
  '--ij-duration-normal',
  '--ij-easing-standard',
  '--ij-container-lg',
  '--ij-breakpoint-md',
  '--ij-focus-width',
  '--ij-z-modal',
  '--ij-opacity-disabled',
];
for (const v of cssVars) {
  check(`CSS contains "${v}"`, css.includes(v));
}
check('CSS has dark-mode media query', css.includes('@media (prefers-color-scheme: dark)'));
check('CSS has .light class override', /\.light\s*\{/.test(css));
check('CSS has .dark class override', /\.dark\s*\{/.test(css));
check('CSS has popup breakpoint', css.includes('--ij-breakpoint-popup'));

// Gradients — web only, own namespace, and each must start at a system color.
check('CSS emits gradients in every mode block',
  (css.match(/--ij-gradient-primary:/g) || []).length === 4);
check('gradients use --ij-gradient-*, not --ij-color-gradients-*',
  css.includes('--ij-gradient-brand:') && !css.includes('--ij-color-gradients'));
check('every gradient starts at a system color', (() => {
  const tk = JSON.parse(read('tokens.json')).tokens.colors;
  const sys = new Set([tk.modes.light.primary, tk.modes.dark.primary,
    ...Object.values(tk.shared), ...Object.values(tk.static)].map(c => c.toUpperCase()));
  return ['light', 'dark'].every(m => Object.values(tk.modes[m].gradients)
    .every(g => sys.has((g.match(/#[0-9a-fA-F]{6}/) || [''])[0].toUpperCase())));
})());
// Every gradient carries its text-safety verdict where it is used. Three of the
// four ramps cannot carry any foreground at AA, and that is invisible from the
// value itself — which is how it reached production on two sites.
check('every gradient states whether text can sit on it', (() => {
  // two gradients in each of the four mode blocks
  const lines = css.split('\n').filter(l => /--ij-gradient-[a-z-]+:/.test(l));
  return lines.length === 8 &&
    lines.every(l => /\/\* (text-safe: (black|white)( or (black|white))?|decorative only[^*]*) \*\//.test(l));
})());
check('design.md forbids text on a gradient',
  read('design.md').includes('Gradients are decorative. Never put text on one.'));
check('design.md warns against onPrimary on a ramp',
  /`onPrimary` is \*\*not\*\* the answer/.test(read('design.md')));

check('Swift does not emit gradients', !/gradient/i.test(swift),
  'a CSS gradient string has no SwiftUI equivalent');
check('primary-rgb is marked deprecated, not silently kept',
  css.includes('--ij-color-primary-rgb') && /primary-rgb:[^;]*;\s*\/\* deprecated/.test(css));
check('design.md documents color-mix as the replacement',
  read('design.md').includes('color-mix(in srgb'));

// --ij-color-primary-rgb is derived from each mode's primary. It must appear in
// all four mode blocks — a silent miss in one mode is the bug this guards.
const rgbCount = (css.match(/--ij-color-primary-rgb:/g) || []).length;
check('CSS emits primary-rgb in all four mode blocks', rgbCount === 4, `found ${rgbCount}`);
check('CSS primary-rgb is a bare r, g, b triplet', /--ij-color-primary-rgb: \d+, \d+, \d+;/.test(css));
check('CSS container widths are ascending', (() => {
  const v = ['sm', 'md', 'lg', 'xl'].map(k => {
    const m = css.match(new RegExp(`--ij-container-${k}: (\\d+)px`));
    return m ? Number(m[1]) : NaN;
  });
  return v.every((n, i) => Number.isFinite(n) && (i === 0 || n > v[i - 1]));
})());

// --- Shadow DOM CSS (for Chrome extension content scripts) ---
console.log('\nShadow DOM CSS:');
const shadowCss = read('dist/css/tokens.shadow.css');
check('shadow.css uses :host scope', shadowCss.includes(':host {'));
check('shadow.css does NOT use :root', !shadowCss.includes(':root'));
check('shadow.css has all --ij- variables', shadowCss.includes('--ij-color-primary') && shadowCss.includes('--ij-spacing-md'));
check('shadow.css has dark mode support', shadowCss.includes('@media (prefers-color-scheme: dark)'));

// --- TypeScript declarations ---
console.log('\nTypeScript declarations:');
const dts = read('dist/ts/tokens.d.ts');
const dtsExports = [
  'export declare const meta',
  'export declare const spacing',
  'export declare const radius',
  'export declare const typography',
  'export declare const colors',
  'export declare const shadows',
  'export declare const motion',
  'export declare const container',
  'export declare const breakpoints',
  'export declare const focus',
  'export type ColorMode',
  'export type ThemeColors',
  'export type SpacingKey',
  'export type ShadowKey',
  'export type BreakpointKey',
  'export declare const zIndex',
  'export declare const opacity',
  'export type ZIndexKey',
  'export type OpacityKey',
];
for (const sig of dtsExports) {
  check(`.d.ts has "${sig}"`, dts.includes(sig));
}

// --- JS runtime ---
console.log('\nJS runtime:');
const mod = await import(path.join(ROOT, 'dist/ts/tokens.js'));
check('exports meta', typeof mod.meta === 'object' && typeof mod.meta.version === 'string');
check('exports spacing', typeof mod.spacing === 'object' && typeof mod.spacing.md === 'number');
check('exports colors.light', typeof mod.colors?.light?.primary === 'string');
check('exports colors.dark', typeof mod.colors?.dark?.primary === 'string');
check('exports shadows', typeof mod.shadows?.md === 'object');
check('exports motion.duration', typeof mod.motion?.duration?.normal === 'number');
check('exports motion.easing', Array.isArray(mod.motion?.easing?.standard));
check('exports container', typeof mod.container === 'object' && typeof mod.container.lg === 'number');
check('exports breakpoints', typeof mod.breakpoints === 'object');
check('exports focus', typeof mod.focus === 'object');
check('exports zIndex', typeof mod.zIndex === 'object' && typeof mod.zIndex.modal === 'number');
check('exports opacity', typeof mod.opacity === 'object' && typeof mod.opacity.disabled === 'number');
check('exports colors.light.state', typeof mod.colors?.light?.state?.success === 'string');
check('exports colors.light.primaryHover', typeof mod.colors?.light?.primaryHover === 'string');
check('shadowCss returns string', typeof mod.shadowCss('md') === 'string');
check('easingCss returns cubic-bezier', mod.easingCss('standard').startsWith('cubic-bezier'));
check('modeColors(light) === colors.light', mod.modeColors('light') === mod.colors.light);

// --- Version sync ---
console.log('\nVersion consistency:');
const tokens = JSON.parse(read('tokens.json'));
const pkg = JSON.parse(read('package.json'));
check('tokens.json version === package.json version', tokens.meta.version === pkg.version);
check('JS module version === tokens.json version', mod.meta.version === tokens.meta.version);

// --- npm pack contents ---
console.log('\nPackage manifest:');
check('package.json type is module', pkg.type === 'module');
check('main points to .js', pkg.main?.endsWith('.js'));
check('types points to .d.ts', pkg.types?.endsWith('.d.ts'));
check('exports["."] has types/import', pkg.exports?.['.']?.types && pkg.exports['.'].import);
check('exports["./css"] is set', pkg.exports?.['./css']);

// --- Color math (unit tests for scripts/color.js) ---
// This is the validator's safety line; if the contrast math regresses,
// inaccessible token pairs could ship. Test it against known values.
console.log('\nColor math (unit):');

// parseHex
const red = parseHex('#FF0000');
check('parseHex #FF0000', red && red.r === 255 && red.g === 0 && red.b === 0 && red.a === 1);
const argb = parseHex('#80FFFFFF');
check('parseHex 8-digit alpha', argb && Math.abs(argb.a - 0x80 / 255) < 1e-9 && argb.r === 255);
check('parseHex rejects 3-digit', parseHex('#FFF') === null);
check('parseHex rejects non-hex', parseHex('#GGGGGG') === null);

// parseRgba
const rgba = parseRgba('rgba(0, 0, 0, 0.5)');
check('parseRgba alpha', rgba && rgba.r === 0 && rgba.a === 0.5);
check('parseRgba rejects out-of-range channel', parseRgba('rgba(300, 0, 0, 1)') === null);
check('parseRgba rejects alpha > 1', parseRgba('rgba(0, 0, 0, 2)') === null);

// parseColor dispatch
check('parseColor handles hex', parseColor('#000000') !== null);
check('parseColor handles rgba', parseColor('rgba(0, 0, 0, 1)') !== null);
check('parseColor rejects garbage', parseColor('blue') === null);
check('parseColor rejects non-string', parseColor(123) === null);

// contrastRatio — known WCAG values
const white = parseColor('#FFFFFF'), black = parseColor('#000000');
check('contrast black/white === 21', Math.abs(contrastRatio(white, black) - 21) < 0.01);
check('contrast identical === 1', Math.abs(contrastRatio(white, white) - 1) < 1e-9);
check('contrast is symmetric', Math.abs(contrastRatio(white, black) - contrastRatio(black, white)) < 1e-9);
// error #D70015 on white should match the validator's reported 5.38:1
const err = parseColor('#D70015');
check('contrast #D70015 on white ≈ 5.38', Math.abs(contrastRatio(err, white) - 5.38) < 0.05);

// --- Release notes (feeds the GitHub Release step in build-tokens.yml) ---

console.log('\nRelease notes:');
const changelog = read('CHANGELOG.md');
const notes = extractNotes(changelog, tokens.meta.version);
check(`release notes exist for ${tokens.meta.version}`, typeof notes === 'string' && notes.length > 0);
check('release notes exclude the next heading', !String(notes).includes('## ['));
check('release notes exclude link references', !/^\[\d+\.\d+\.\d+\]:/m.test(String(notes)));
check('unknown version yields no notes', extractNotes(changelog, '9.9.9') === null);

// --- Component: link selection (pure logic, no DOM) ---
//
// The custom element is a rendering shell over selectLinks(), so the decisions
// live here and are testable without a browser. See COMPONENTS.md for what this
// deliberately does NOT cover and the manual check that compensates.

console.log('\nComponent link selection:');
const registry = JSON.parse(read('apps.json'));
const ids = sel => sel.links.map(a => a.id);

const tonvault = selectLinks(registry, 'tonvault');
check('never links to itself', !ids(tonvault).includes('tonvault'));
check('groups by category', tonvault.siblings.every(a => a.category === 'music'));
check('a full cluster needs no top-up', tonvault.topUp.length === 0);
check('always-links appear', tonvault.always.map(a => a.id).join() === 'made-by-human,iamjarl');
check('always-links come last', ids(tonvault).slice(-2).join() === 'made-by-human,iamjarl');
check('side projects excluded by default', !ids(tonvault).includes('beertuner'));
check('TonVault now links Echolume', ids(tonvault).includes('echolume'), 'the gap the pilot fixes');

// A two-member category would otherwise render one link and test nothing.
const trimrpix = selectLinks(registry, 'trimrpix');
check('a thin cluster is topped up', trimrpix.topUp.length > 0);
check('top-up reaches the minimum', trimrpix.siblings.length + trimrpix.topUp.length >= 3);
check('top-up never repeats a sibling',
  new Set(ids(trimrpix)).size === ids(trimrpix).length);
check('top-up prefers the least-connected', (() => {
  const reach = trimrpix.topUp.map(a => categoryReach(
    registry.apps.filter(x => x.status === 'shipped' && x.always !== true), a));
  return reach.every((r, i) => i === 0 || r >= reach[i - 1]);
})());

// The rule must be a pure function of the registry's CONTENT. If it depended on
// the registry's ORDER, re-sorting apps.json would rewrite every committed
// fragment, and the drift check would fire on a cosmetic edit.
check('selection is independent of registry order', (() => {
  const ids = registry.apps.filter(a => a.status === 'shipped').map(a => a.id).sort();
  const snap = r => ids.map(id => {
    const s = selectLinks(r, id);
    return id + ':' + [...s.siblings, ...s.topUp].map(l => l.id).join(',');
  }).join('|');
  const base = snap(registry);
  for (let t = 0; t < 25; t++) {
    const r = JSON.parse(JSON.stringify(registry));
    for (let i = r.apps.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [r.apps[i], r.apps[j]] = [r.apps[j], r.apps[i]];
    }
    if (snap(r) !== base) return false;
  }
  return true;
})());

// The reason the rule changed: a two-member category left its apps reachable
// from one footer each. No shipped app should sit that far below the rest.
check('every app is reachable from at least 3 footers', (() => {
  const counts = {};
  const linkable = registry.apps.filter(a => a.status === 'shipped' && a.always !== true);
  for (const a of linkable) counts[a.id] = 0;
  for (const a of registry.apps.filter(a => a.status === 'shipped')) {
    for (const l of selectLinks(registry, a.id).links) if (l.id in counts) counts[l.id]++;
  }
  return Math.min(...Object.values(counts)) >= 3;
})(), 'a small category must not strand its members');

check('side projects can be opted in',
  selectLinks(registry, 'tonvault', { include: ['shipped', 'side-project'] })
    .links.some(a => a.id === 'beertuner'));
check('an unknown id throws rather than rendering nothing', (() => {
  try { selectLinks(registry, 'nope'); return false; } catch { return true; }
})());
check('every app id resolves', registry.apps.every(a => {
  try { selectLinks(registry, a.id); return true; } catch { return false; }
}));

// --- Component: built artifact ---
console.log('\nComponent build:');
const comp = read('dist/components/ij-footer.js');
check('is self-contained (no imports to resolve)', !/^import /m.test(comp));
check('exports nothing (side-effect module)', !/^export /m.test(comp));
check('registry is inlined', comp.includes('const REGISTRY = {'));
check('defines the element', comp.includes("customElements.define('ij-footer'"));
check('guards against double definition', comp.includes("customElements.get('ij-footer')"));
// tokens.shadow.css declares :host { --ij-*: ... }, which would beat the host
// page's inherited values and override the site's chosen mode. The component
// must inherit, never redeclare — so it pulls in no stylesheet at all.
check('pulls in no external stylesheet', !/@import/.test(comp));
check('adopts no stylesheet object', !comp.includes('adoptedStyleSheets'));
check('reads host tokens through fallbacks, not redeclaration',
  /var\(--ij-color-text-secondary, /.test(comp) && !/^\s*--ij-[a-z-]+:/m.test(comp));
check('stamped with the current version', comp.includes(`v${tokens.meta.version}`));

// Regressions the redesign fixed. Each maps to something both reference
// footers in the portfolio do, or to a bug the first draft shipped.
check('has a fineprint slot', comp.includes('name="fineprint"'),
  'without it a site loses its legal text on upgrade');
check('cross-links render as one group, not two rows',
  comp.includes('[...siblings, ...topUp, ...always]'));
check('labels are sentence case, not shouted',
  !/text-transform:\s*uppercase/.test(comp) && !/letter-spacing:\s*0\.05em/.test(comp));
check('links carry no platform suffix', !comp.includes('class="platform"'));
check('supports the columns layout', comp.includes('[layout="columns"]'));

// --- Build-time cross-link fragments (#22) ---
//
// The component builds cross-links at runtime, so crawlers that do not run JS
// never see them. These fragments put the same links in a site's served HTML.
// Both paths must come from the same selectLinks(), or the registry has two
// answers and the whole point is lost.

console.log('\nFooter fragments:');
check('component honours a provided cross-links slot',
  comp.includes(`this.querySelector('[slot="cross-links"]')`) &&
  comp.includes('<slot name="cross-links">'));

const shipped = registry.apps.filter(a => a.status === 'shipped');
let fragProblems = [];
for (const app of shipped) {
  let frag;
  try {
    frag = read(`dist/footers/${app.id}.html`);
  } catch {
    fragProblems.push(`${app.id}: no fragment`);
    continue;
  }
  const hrefs = [...frag.matchAll(/<a slot="cross-links" href="([^"]+)"/g)].map(m => m[1]);
  const expected = selectLinks(registry, app.id).links.map(l => l.url);
  if (JSON.stringify(hrefs) !== JSON.stringify(expected)) {
    fragProblems.push(`${app.id}: fragment links differ from selectLinks()`);
  }
  const anchors = (frag.match(/<a /g) || []).length;
  if (anchors !== hrefs.length) fragProblems.push(`${app.id}: an anchor is missing slot="cross-links"`);
  if (!frag.includes('registry updated')) fragProblems.push(`${app.id}: no registry date stamp`);
}
check(`a fragment per shipped app (${shipped.length})`, fragProblems.length === 0,
  fragProblems.slice(0, 3).join('; '));
check('fragments never link the site to itself', shipped.every(a =>
  !read(`dist/footers/${a.id}.html`).includes(`"${a.url}"`)));

// --- Subresource integrity ---
//
// A stale integrity attribute fails closed: the browser blocks the resource.
// For tokens.css that is a page with no tokens at all, so these hashes must
// never lag the files they cover.

// --- Family accents ---
//
// The system defines one primary per mode, so thirteen of fifteen sites ended up
// identical. A family accent lets a category differ without leaving the system.
// It ships inert: nothing renders differently until a category opts in.

console.log('\nFamily accents:');
const tokenTree = JSON.parse(read('tokens.json')).tokens;
const shippedApps = registry.apps.filter(a => a.status === 'shipped');

check('every category carries a label', Object.values(registry.categories)
  .every(c => typeof c?.label === 'string' && c.label.length > 0));
check('resolves to the shared primary when nothing is declared', shippedApps.every(a => {
  const acc = accentFor(registry, a.id, tokenTree);
  return acc.light === tokenTree.colors.modes.light.primary &&
         acc.dark === tokenTree.colors.modes.dark.primary;
}), 'no accents are declared yet, so nothing may differ');
check('nothing is generated while nothing differs',
  !fs.existsSync(path.join(ROOT, 'dist/accents')) ||
  fs.readdirSync(path.join(ROOT, 'dist/accents')).length === 0,
  'an app matching the primary must not get a sheet repeating it');

// Resolution order, checked against a registry built for the purpose rather
// than against whatever the real one happens to hold today.
const probe = JSON.parse(JSON.stringify(registry));
probe.categories['web-tools'].accent = { light: '#0B6E4F', dark: '#37B6E9' };
check('a category accent reaches its apps',
  accentFor(probe, 'botlens', tokenTree).light === '#0B6E4F');
check('the source is reported', accentFor(probe, 'botlens', tokenTree).source === 'category');
probe.apps.find(a => a.id === 'botlens').accent = { light: '#A435D2', dark: '#D0FF00' };
check('an app accent overrides its category',
  accentFor(probe, 'botlens', tokenTree).light === '#A435D2' &&
  accentFor(probe, 'pagelens', tokenTree).light === '#0B6E4F');
check('an app matching the primary is not treated as a family accent',
  accentFor(probe, 'botlens', tokenTree).isFamilyAccent === false,
  'it resolves to the primary, so there is nothing to emit');
check('an unknown app throws', (() => {
  try { accentFor(registry, 'nope', tokenTree); return false; } catch { return true; }
})());

console.log('\nSubresource integrity:');
const sri = JSON.parse(read('dist/sri.json'));
check('sri.json version matches tokens.json', sri.version === tokens.meta.version);
check('sri.json declares sha384', sri.algorithm === 'sha384');

const recomputed = Object.fromEntries(
  Object.keys(sri.files).map(rel => [
    rel,
    'sha384-' + crypto.createHash('sha384')
      .update(fs.readFileSync(path.join(ROOT, rel))).digest('base64'),
  ])
);
check('every hash matches its file', Object.entries(sri.files)
  .every(([rel, h]) => recomputed[rel] === h),
  Object.keys(sri.files).filter(r => recomputed[r] !== sri.files[r]).join(', '));
check('covers the three CDN-served files', Object.keys(sri.files).length === 3 &&
  ['dist/css/tokens.css', 'dist/css/tokens.shadow.css', 'dist/components/ij-footer.js']
    .every(f => f in sri.files));

// README carries the paste-ready tags and is generated, but sits outside the
// dist/ drift check — so it is asserted here instead.
const readme = read('README.md');
const block = readme.slice(readme.indexOf('<!-- SRI:BEGIN -->'), readme.indexOf('<!-- SRI:END -->'));
check('README has the SRI markers', block.length > 0);
check('README block pins the current version', block.includes(`@v${tokens.meta.version}/`));
check('README block carries the current hashes',
  block.includes(sri.files['dist/css/tokens.css']) &&
  block.includes(sri.files['dist/components/ij-footer.js']));
check('README block uses crossorigin', (block.match(/crossorigin="anonymous"/g) || []).length === 2);

console.log();
if (failed > 0) {
  console.error(`❌ ${failed} test(s) failed.`);
  process.exit(1);
} else {
  console.log('✅ All contract tests passed.');
}
