#!/usr/bin/env node
// Contract tests — verify generated outputs contain the API the docs promise.
// No test framework, just assertions.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHex, parseRgba, parseColor, contrastRatio } from './color.js';
import { extractNotes, sriNotes } from './release-notes.js';
import { selectLinks, categoryReach } from '../components/select-links.js';
import { identityFor, mix, TEXT_MIX } from '../components/identity.js';
import { loosePath, stairsPoints } from '../kit/loose.js';
import { renderDrawing } from '../kit/drawings/render.js';
import { identitySheetCss } from './css-modes.js';
import { WEAN_DRAWINGS } from '../kit/drawings/wean.js';
import { NAV_ALPHA, NAV_COLLAPSE_BELOW, MAX_LINKS, currentIndex, heroOnScreen, navWarnings } from '../components/nav-rules.js';
import { storeLink, factsLine, badgeFile, badgeHeight, smartBannerHtml, fragmentName, offer, PLACEMENTS, TONES } from '../components/store.js';

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
  'public enum Palette',
  'public enum Style: CaseIterable, Sendable',
  'public enum Numeral: CaseIterable, Sendable',
];
for (const sig of swiftAPI) {
  check(`Swift contains "${sig}"`, swift.includes(sig));
}

// The palette is what apps should reach for: every mode-aware colour, adapting
// by itself. Count it against tokens.json so a token added to the modes cannot
// be left out of it, and against the generated tests so none goes unchecked.
const modeLeaves = (() => {
  const out = [];
  const walk = (o, p) => { for (const [k, v] of Object.entries(o)) {
    if (k === 'gradients') continue;
    typeof v === 'string' ? out.push([...p, k].join('.')) : walk(v, [...p, k]);
  } };
  walk(JSON.parse(read('tokens.json')).tokens.colors.modes.light, []);
  return out;
})();
const paletteBlock = swift.slice(swift.indexOf('public enum Palette'));
check(`the palette covers every mode-aware colour (${modeLeaves.length})`,
  (paletteBlock.match(/= DesignTokens\.adaptive\(/g) || []).length === modeLeaves.length);
check('every palette colour has a generated Swift test',
  (read('Tests/IAMJARLDesignTokensTests/PaletteTests.swift').match(/try assertAdaptive\(/g) || []).length === modeLeaves.length);
check('the CSS font names are deprecated in Swift, not silently kept',
  (swift.match(/@available\(\*, deprecated[^\n]*\n\s*public static let (uiFontName|monoFontName)/g) || []).length === 2,
  '"system-ui" means nothing to SwiftUI');
const swiftSrc = name => read(`Sources/IAMJARLDesignTokens/${name}`);
check('ijFont scales with Dynamic Type', /ScaledMetric\(wrappedValue: style\.size, relativeTo: style\.textStyle\)/.test(swiftSrc('DynamicType.swift')));
check('ijNumeral uses tabular digits and is capped',
  swiftSrc('DynamicType.swift').includes('.monospacedDigit()') && swiftSrc('DynamicType.swift').includes('numeralMaxScale'));
check('adaptive colours cover UIKit, AppKit and watchOS',
  ['os(watchOS)', 'canImport(UIKit)', 'canImport(AppKit)'].every(x => swiftSrc('Adaptive.swift').includes(x)));

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
check('CSS has the numeral scale', ['sm', 'md', 'lg'].every(k => css.includes(`--ij-font-size-numeral-${k}:`)));

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
  'export type Numeral',
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
const sriFile = JSON.parse(read('dist/sri.json'));
const sriBlock = sriNotes(sriFile, tokens.meta.version);
check(`release notes carry every integrity hash for the tag (${Object.keys(sriFile.files).length})`,
  Object.entries(sriFile.files).every(([f, h]) => sriBlock.includes(`| \`${f}\` | \`${h}\` |`)) &&
  sriBlock.includes(`@v${tokens.meta.version}/`) && sriNotes(sriFile, '9.9.9') === '');

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
check('the link rows take --ij-footer-links-justify, defaulting to flex-start',
  /--_links-justify:\s*var\(--ij-footer-links-justify,\s*flex-start\)/.test(comp) &&
  /\.links \{[^}]*justify-content: var\(--_links-justify\)/.test(comp),
  'text-align inherits into the shadow DOM but flex items ignore it, so the rows need their own hook');
check('columns layout neutralises the horizontal justify',
  /:host\(\[layout="columns"\]\) \.links \{[^}]*justify-content: flex-start/.test(comp),
  'a row value must not act on the vertical axis once the links stack');
check('README documents the alignment hook',
  read('README.md').includes('--ij-footer-links-justify'));
check('footer hover is the text-safe accent, then the family accent, then primary',
  (comp.match(/--_hover:\s*var\(--ij-color-accent-text, var\(--ij-color-accent-family, var\(--ij-color-primary,/g) || []).length === 2,
  'both blocks (#57); hover is text, so it takes accentText, and a pre-1.22 sheet still works (#65)');
check('component honours a provided cross-links slot',
  comp.includes(`this.querySelector('[slot="cross-links"]')`) &&
  comp.includes('<slot name="cross-links">'));

// The bundle inlines the registry, so whatever apps.json gains is served to
// every visitor. The footer reads seven fields; anything else reaching the
// bundle is weight paid for data the footer cannot use — a family accent, for
// instance.
const bundledRegistry = JSON.parse(
  comp.match(/const REGISTRY = (\{[\s\S]*?\n\});/)[1]
);
check('the bundled registry is projected, not the whole file',
  Object.keys(bundledRegistry).join() === 'apps',
  'categories, meta and $comment are not read by the footer');
check('the bundle carries no colour data', !/accent|#[0-9a-f]{3,8}\b/i.test(
  comp.slice(comp.indexOf('const REGISTRY'), comp.indexOf('];', comp.indexOf('const REGISTRY')))),
  'the footer cannot use colour, so it must not ship any');
check('every field the footer reads survives the projection',
  bundledRegistry.apps.every(a => a.id && a.name && a.url && a.status) &&
  bundledRegistry.apps.some(a => a.always) &&
  bundledRegistry.apps.some(a => a.category && a.listed),
  'projecting away a field the selection needs would silently empty a footer');

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

// --- <ij-nav> ---
//
// The rules live in components/nav-rules.js, pure, and are asserted here. What
// needs a browser — focus order, the disclosure, sticky, cta-after — is in
// scripts/test-browser.js.

console.log('\n<ij-nav> rules:');
const X = 'https://x.test';
check('marks the link for this page', currentIndex([`${X}/a.html`, `${X}/b.html`], `${X}/b.html`) === 1);
check('matches a clean URL to a link written with .html', currentIndex([`${X}/guide.html`], `${X}/guide`) === 0);
check('treats index.html and a trailing slash as the same page',
  currentIndex([`${X}/`], `${X}/index.html`) === 0 && currentIndex([`${X}/docs/`], `${X}/docs`) === 0);
check('ignores the query string', currentIndex([`${X}/a.html`], `${X}/a.html?utm_source=x`) === 0);
check('never marks a link to another site', currentIndex(['https://github.com/a'], 'https://github.com/a') === 0 &&
  currentIndex(['https://github.com/a'], `${X}/a`) === -1);
check('never marks an in-page anchor', currentIndex([`${X}/#features`], `${X}/`) === -1,
  'on a one-page site every section link would otherwise claim to be the page');
check('an unparseable location marks nothing', currentIndex([`${X}/`], 'not a url') === -1);

const echolume = {
  brand: 1,
  links: [{ text: 'How it works' }, { text: 'OBS Guide' }, { text: 'Twitch' }],
  cta: [{ text: 'Download', event: 'store-click', placement: 'nav' }],
  secondary: 1,
};
check("Echolume's header breaks no rule", navWarnings(echolume).length === 0, navWarnings(echolume).join(' | '));
check(`more than ${MAX_LINKS} links is flagged`, navWarnings({ ...echolume,
  links: [...echolume.links, { text: 'Blog' }] }).some(w => w.includes('4 links')));
check('Support and Privacy are sent to the footer', ['Privacy', 'Support', ' privacy policy'].every(text =>
  navWarnings({ ...echolume, links: [{ text }] }).some(w => w.includes('belongs in the footer'))));
check('a CTA copied from the hero is flagged', navWarnings({ ...echolume,
  cta: [{ text: 'Get it', event: 'store-click', placement: 'hero' }] }).some(w => w.includes('placement="hero"')));
check('a CTA without analytics is not second-guessed', navWarnings({ ...echolume,
  cta: [{ text: 'Download' }] }).length === 0);
check('two CTAs, no brand, two secondaries are each flagged', [
  navWarnings({ ...echolume, cta: [...echolume.cta, ...echolume.cta] }),
  navWarnings({ ...echolume, brand: 0 }),
  navWarnings({ ...echolume, secondary: 2 }),
].every(w => w.length === 1));

check('cta-after reads the latest entry, not the first', heroOnScreen([
  { isIntersecting: true }, { isIntersecting: false }]) === false,
  'a scroll before the first delivery batches the stale entry with the fresh one');
check('cta-after decides nothing from an empty callback',
  heroOnScreen([]) === null && heroOnScreen([{ isIntersecting: true }]) === true);
check('the nav folds at the system\'s md breakpoint', NAV_COLLAPSE_BELOW === tokens.tokens.breakpoints.md,
  `nav ${NAV_COLLAPSE_BELOW}, breakpoints.md ${tokens.tokens.breakpoints.md}`);

// The bar is translucent, so the text on it has no fixed background. Composite
// the bar over the worst case beneath it and find the opacity at which the text
// colours still clear AA; NAV_ALPHA must sit above it in both modes.
const navFloor = (() => {
  const modes = tokens.tokens.colors.modes;
  const mix = (a, b, t) => ({ r: a.r * t + b.r * (1 - t), g: a.g * t + b.g * (1 - t), b: a.b * t + b.b * (1 - t) });
  const over = (c, g) => (c.a === undefined || c.a === 1 ? c : mix(c, g, c.a));
  const worst = [parseHex('#000000'), parseHex('#FFFFFF')];
  const ok = (m, a) => [modes[m].text.primary, modes[m].text.secondary].every(t => worst.every(w => {
    const ground = mix(parseColor(modes[m].background.app), w, a);
    return contrastRatio(over(parseColor(t), ground), ground) >= 4.5;
  }));
  return Object.fromEntries(['light', 'dark'].map(m =>
    [m, [...Array(101).keys()].map(i => i / 100).find(a => ok(m, a))]));
})();
check(`the bar's opacity (${NAV_ALPHA}) keeps its text AA over anything`,
  NAV_ALPHA >= navFloor.light && NAV_ALPHA >= navFloor.dark,
  `floor: light ${navFloor.light}, dark ${navFloor.dark}`);

const navSrc = read('components/ij-nav.js');
const navDist = read('dist/components/ij-nav.js');
check('the accent is never a text colour on the bar', !/(^|[^-])color:\s*var\(--_accent\)/m.test(navSrc),
  'over the worst case an accent falls below AA at this opacity; it may fill, not write');
check('the focus ring is text.primary, not the accent', /outline:\s*var\(--_focus\) solid var\(--_strong\)/.test(navSrc));
check('the CTA puts the identity\'s on-accent on the accent, falling back to onPrimary',
  /::slotted\(\[slot="cta"\]\) \{[^}]*background: var\(--_accent\);[^}]*color: var\(--_on-accent\)/.test(navSrc) &&
  (navSrc.match(/--_on-accent:\s*var\(--ij-color-on-accent, var\(--ij-color-on-primary,/g) || []).length === 2 &&
  (navSrc.match(/--_accent:\s*var\(--ij-color-accent, var\(--ij-color-accent-family, var\(--ij-color-primary,/g) || []).length === 2,
  'on Walkful\'s sand, onPrimary on magenta would be 2.7:1; a pre-1.22 sheet has neither new name (#65)');
const navCode = navSrc.replace(/^\s*\/\/.*$/gm, '');   // the usage comment shows slotted <a>s
check('every link is slotted, none generated',
  (navCode.match(/<a /g) || []).length === 1 && navCode.includes('<a class="skip"'),
  'the only anchor the component writes is the skip link');
check('the bundle is self-contained', !/^import /m.test(navDist) && navDist.includes('function currentIndex'));
check('the bundle defines the element once, guarded',
  (navDist.match(/customElements\.define\('ij-nav'/g) || []).length === 1 &&
  navDist.includes("if (!customElements.get('ij-nav'))"));
check('the bundle pulls in no stylesheet', !/@import|<link\b|adoptedStyleSheets/.test(navDist),
  'theming comes from the host through custom properties; a stylesheet here would override the site');
check('package.json exports it', JSON.parse(read('package.json')).exports['./components/nav'] === './dist/components/ij-nav.js');

// --- Site identity (#65) ---
// Each app declares its own ground, text, accent and face. The family layer
// that set them per category until 1.21.0 is gone; its values were copied onto
// the apps, so what must hold is that a sheet built from them still says what
// the old one said, under the old name too, and that a site with a ground of
// its own gets text derived from it.

console.log('\nSite identity:');
const fullTokens = JSON.parse(read('tokens.json'));
const tokenTree = fullTokens.tokens;
const shippedApps = registry.apps.filter(a => a.status === 'shipped');
const identityDir = path.join(ROOT, 'dist/identity');
const sheets = fs.existsSync(identityDir) ? fs.readdirSync(identityDir) : [];
const hexOf = h => parseHex(h);

check('every category carries a label, and no longer an accent or a face', Object.values(registry.categories)
  .every(c => typeof c?.label === 'string' && c.label.length > 0 && c.accent === undefined && c.display === undefined));
check('a sheet exists for every app with an identity, and only for those', (() => {
  const expected = shippedApps.filter(a => !identityFor(registry, a.id, fullTokens).isEmpty).map(a => `${a.id}.css`).sort();
  return expected.join() === [...sheets].sort().join();
})(), 'an app with nothing of its own must not get a sheet restating the tokens');
// Sites on 1.12 to 1.21 read --ij-color-accent-family, and <ij-nav> and
// <ij-footer> fall back to it. It stays, as the text-safe accent.
check('every sheet with an accent emits it, its on-colour, its text-safe variant, and the 1.21 name for that', shippedApps.every(a => {
  const id = identityFor(registry, a.id, fullTokens);
  if (!id.hasColour) return true;
  const css = read(`dist/identity/${a.id}.css`);
  return Object.values(id.modes).every(m => css.includes(`--ij-color-accent: ${m.accent};`) &&
    css.includes(`--ij-color-on-accent: ${m.onAccent};`) && css.includes(`--ij-color-accent-text: ${m.accentText};`) &&
    css.includes(`--ij-color-accent-family: ${m.accentText};`));
}));
// A sheet from before 1.22 has no --ij-color-on-accent, so <ij-nav>'s CTA falls
// back to onPrimary on the family accent. That is only safe because onPrimary IS
// background.app in both modes, which every family accent cleared at AA.
check('onPrimary is background.app in both modes, so a pre-1.22 accent still carries it',
  ['light', 'dark'].every(m => tokenTree.colors.modes[m].onPrimary === tokenTree.colors.modes[m].background.app));
check('README documents adopting an identity sheet, with integrity and both mode rules', (() => {
  const md = read('README.md');
  const at = md.indexOf('## Site identity: `dist/identity/<app>.css`');
  const sec = at === -1 ? '' : md.slice(at, md.indexOf('\n## ', at + 1));
  return sec.includes('integrity=') && sec.includes('sri.json') && sec.includes('class="dark"') &&
    sec.includes('"scheme": "light"') && sec.includes('--ij-color-accent-text') && sec.includes('--ij-color-on-accent');
})(), 'the first adopter had to compute the hash by hand and find the dark-mode rule themselves');
check('every on-accent is black or white and reads at AA on its accent', shippedApps.every(a =>
  Object.values(identityFor(registry, a.id, fullTokens).modes).every(m =>
    ['#000000', '#FFFFFF'].includes(m.onAccent) && contrastRatio(hexOf(m.onAccent), hexOf(m.accent)) >= 4.5)));
const walkful = identityFor(registry, 'walkful', fullTokens);
const walkfulCss = read('dist/identity/walkful.css');
check('Walkful is light only: sand, charcoal, magenta for strokes and a deeper magenta for text', (() => {
  const m = walkful.modes.light;
  return walkful.scheme === 'light' && Object.keys(walkful.modes).join() === 'light' && m.accent === '#F140FE' &&
    contrastRatio(hexOf(m.accent), hexOf(m.background)) < 3 && contrastRatio(hexOf(m.accentText), hexOf(m.background)) >= 4.5 &&
    contrastRatio(hexOf(m.text), hexOf(m.background)) >= 7;
})(), 'the magenta is for strokes; text takes accentText');
check('a light-only sheet sets color-scheme and holds the light tokens in dark mode too', (() => {
  const darkBlock = walkfulCss.split('@media (prefers-color-scheme: dark)')[1] ?? '';
  const m = walkful.modes.light;
  return walkfulCss.includes('color-scheme: light;') &&
    darkBlock.includes(`--ij-color-bg-app: ${m.background};`) && darkBlock.includes(`--ij-color-text-primary: ${m.text};`) &&
    darkBlock.includes(`--ij-color-state-error: ${tokenTree.colors.modes.light.state.error};`) &&
    !walkfulCss.includes(`--ij-color-state-error: ${tokenTree.colors.modes.dark.state.error};`);
})(), 'tokens.css switches every colour in dark mode; a light-only site must not get half of them');

check('scripts/css-modes.js writes exactly the sheets the build ships', shippedApps
  .map(a => [a, identityFor(registry, a.id, fullTokens)]).filter(([, id]) => !id.isEmpty)
  .every(([a, id]) => identitySheetCss(a, id, fullTokens) === read(`dist/identity/${a.id}.css`)));
// WODrounds is the first dark-only site (#78): in a light visitor's browser,
// its sheet must put back every dark colour, not only its own.
check('a dark-only sheet (WODrounds) sets color-scheme and holds the dark tokens for a visitor in light mode too', (() => {
  const css = read('dist/identity/wodrounds.css');
  const lightBlock = css.split('@media (prefers-color-scheme: light)')[1] ?? '';
  return css.includes('color-scheme: dark;') && lightBlock.includes('--ij-color-bg-app: #0B0C0D;') &&
    lightBlock.includes(`--ij-color-state-error: ${tokenTree.colors.modes.dark.state.error};`) &&
    lightBlock.includes(`--ij-color-border-default: ${tokenTree.colors.modes.dark.border.default};`) &&
    !css.includes('#587114');
})(), 'a dark site must not get the light half of the tokens on a light system');

// Resolution, checked against a registry built for the purpose rather than
// against whatever the real one happens to hold today.
const probe = JSON.parse(JSON.stringify(registry));
const pb = probe.apps.find(a => a.id === 'botlens');
check('with no identity, an app resolves to the tokens and gets nothing', (() => {
  delete pb.identity;
  const r = identityFor(probe, 'botlens', fullTokens);
  return r.isEmpty && r.modes.light.accent === tokenTree.colors.modes.light.primary &&
    r.modes.dark.background === tokenTree.colors.modes.dark.background.app && r.modes.light.textSecondary === null;
})());
check('accentText defaults to the accent', (() => {
  pb.identity = { light: { accent: '#217370' }, dark: { accent: '#35B6B2' } };
  return identityFor(probe, 'botlens', fullTokens).modes.light.accentText === '#217370';
})());
check("a ground of its own re-derives the secondary text from the site's own text", (() => {
  pb.identity = { scheme: 'light', light: { background: '#E8EEF2', text: '#1F2A33' } };
  const r = identityFor(probe, 'botlens', fullTokens);
  return Object.keys(r.modes).join() === 'light' &&
    r.modes.light.textSecondary === mix('#1F2A33', '#E8EEF2', TEXT_MIX.secondary) &&
    r.modes.light.textTertiary === mix('#1F2A33', '#E8EEF2', TEXT_MIX.tertiary);
})());
check('an unknown app throws', (() => {
  try { identityFor(registry, 'nope', fullTokens); return false; } catch { return true; }
})());
check('an unknown face throws rather than emitting it', (() => {
  pb.identity = { display: 'blackletter' };
  try { identityFor(probe, 'botlens', fullTokens); return false; } catch { return true; }
})());

// --- Display type ---
const faces = fullTokens.brand.typography.display;
check('four approved display faces', Object.keys(faces).length === 4);
check('every approved face records a licence and a real fallback', Object.values(faces).every(f =>
  f.licence && f.stack.includes(',') && /sans-serif|monospace|serif$/.test(f.stack.trim())),
  'a stack without a real fallback leaves a site unreadable until the file lands');
check('a face with axes carries them in the sheet, and the kit and the nav apply them', shippedApps
  .map(a => [a, identityFor(registry, a.id, fullTokens)]).filter(([, id]) => id.display?.face.axes)
  .every(([a, id]) => read(`dist/identity/${a.id}.css`).includes(`--ij-font-display-axes: ${id.display.face.axes};`)) &&
  identityFor(registry, 'walkful', fullTokens).display?.face.name === 'Fraunces' &&
  /font-variation-settings: var\(--ij-font-display-axes, normal\)/.test(read('kit/kit.css')) &&
  /font-variation-settings: var\(--ij-font-display-axes, normal\)/.test(read('components/ij-nav.js')),
  "Fraunces rests at its sharp end; Walkful was shown it soft (#65)");
check('every sheet with a face emits its stack and says to self-host it', shippedApps
  .map(a => [a, identityFor(registry, a.id, fullTokens)])
  .filter(([, id]) => id.display)
  .every(([a, id]) => {
    const css = read(`dist/identity/${a.id}.css`);
    return css.includes(`--ij-font-display: ${id.display.face.stack};`) && css.includes('Self-host it');
  }), 'a face that is declared but never emitted is the inert state this replaced');
// The faces ship from here (1.17.0): one generated @font-face per face, whose
// family must be the name --ij-font-display asks for, and whose url must land
// on the woff2 from wherever the sheet is loaded.
for (const f of Object.values(faces)) {
  const name = f.file.replace(/-latin-[a-z0-9]+-normal\.woff2$/, '');
  const sheet = `dist/fonts/${name}.css`;
  const css = fs.existsSync(path.join(ROOT, sheet)) ? read(sheet) : '';
  check(`${f.name} ships with a font-face sheet that names it as the stack does`,
    css.includes(`font-family: ${f.stack.split(',')[0].trim()};`) && css.includes(`font-weight: ${f.weights};`));
  const url = (css.match(/url\('([^']+)'\)/) || [])[1] ?? '';
  check(`${f.name}'s url resolves to its file, from the sheet's own folder`,
    fs.existsSync(path.resolve(ROOT, 'dist/fonts', url)) && url.endsWith(f.file), url);
  check(`${f.name}'s sheet has an SRI entry`, sheet in JSON.parse(read('dist/sri.json')).files);
}
const pkgJson = JSON.parse(read('package.json'));
check('the package ships fonts/ and exports the sheets',
  pkgJson.files.includes('fonts/') && pkgJson.exports['./fonts/*'] === './dist/fonts/*');
check('design.md tells sites to load the face from here, never from Google Fonts',
  /Load the face from the design system\. Do not link Google Fonts/.test(read('design.md')));

// --- Marketing kit (#65) ---
// A scale for marketing pages, separate from the app scale, and sections built
// on it in plain HTML. What must hold: the scale says what #65 asked of it at
// both ends, the kit takes every colour from the tokens and the identity, and
// both demo pages compose every section, so each is shown under two identities.
console.log('\nMarketing kit:');
const mkt = fullTokens.tokens.marketing;
const tokensCssText = read('dist/css/tokens.css');
const mktVars = [...Object.keys(mkt.type).flatMap(k => [`--ij-mkt-${k}-size`, `--ij-mkt-${k}-leading`, `--ij-mkt-${k}-tracking`]),
  ...Object.keys(mkt.space).map(k => `--ij-mkt-space-${k}`), ...Object.keys(mkt.width).map(k => `--ij-mkt-width-${k}`)];
check(`tokens.css carries the whole marketing scale (${mktVars.length})`, mktVars.every(v => tokensCssText.includes(`${v}:`)),
  mktVars.filter(v => !tokensCssText.includes(`${v}:`)).join(', '));
const atViewport = (name, vw) => {
  const m = tokensCssText.match(new RegExp(`${name}: clamp\\(([\\d.]+)rem, ([\\d.-]+)rem \\+ ([\\d.]+)vw, ([\\d.]+)rem\\)`));
  if (!m) return NaN;
  const [lo, b, slope, hi] = m.slice(1).map(Number);
  return Math.min(Math.max(b * 16 + slope * vw / 100, lo * 16), hi * 16);
};
check('the fluid sizes land on their min and max at the two viewports', Object.entries(mkt.type).filter(([, v]) => v.min !== v.max)
  .every(([k, v]) => Math.abs(atViewport(`--ij-mkt-${k}-size`, mkt.viewport.min) - v.min) < 0.1 &&
    Math.abs(atViewport(`--ij-mkt-${k}-size`, mkt.viewport.max) - v.max) < 0.1 &&
    Math.abs(atViewport(`--ij-mkt-${k}-size`, 2560) - v.max) < 0.1));
check('#65 at both ends: body 18 px or more, display about 48 to 96 px', mkt.type.body.min >= 18 &&
  mkt.type.display.min >= 48 && mkt.type.display.max <= 96 + 24);
check('the Swift package has no marketing scale', !/marketing|--ij-mkt|mkt/i.test(
  fs.readdirSync(path.join(ROOT, 'Sources/IAMJARLDesignTokens')).map(f => read(`Sources/IAMJARLDesignTokens/${f}`)).join('\n')),
  'web only: an app has no landing page');
const kitSrc = read('kit/kit.css');
check('kit.css writes no colour of its own', !/#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i.test(kitSrc.replace(/\/\*[\s\S]*?\*\//g, '')),
  'every colour comes from the tokens or the identity, so the same markup is any site');
const KIT_HOOKS = ['--ij-phone-width', '--ij-tv-width', '--ij-watch-width', '--ij-display-weight', '--ij-wordmark-em', '--ij-scene-height'];
const definedVars = new Set([tokensCssText, ...fs.readdirSync(identityDir).map(f => read(`dist/identity/${f}`))]
  .flatMap(css => css.match(/--ij-[a-z0-9-]+(?=:)/g) ?? []));
const kitUses = [...new Set(kitSrc.match(/var\(--ij-[a-z0-9-]+/g).map(v => v.slice(4)))];
check(`every variable kit.css reads is a token, an identity value or a documented hook (${kitUses.length})`,
  kitUses.every(v => definedVars.has(v) || KIT_HOOKS.includes(v)), kitUses.filter(v => !definedVars.has(v) && !KIT_HOOKS.includes(v)).join(', '));
const kitDist = read('dist/kit/kit.css');
check('dist/kit/kit.css is the source with its version on top, hashed and exported',
  kitDist.startsWith(`/* IAMJARL marketing kit v${fullTokens.meta.version}:`) && kitDist.endsWith(kitSrc) &&
  'dist/kit/kit.css' in JSON.parse(read('dist/sri.json')).files && JSON.parse(read('package.json')).exports['./kit/*'] === './dist/kit/*');
const KIT_CLASSES = ['ij-hero--split', 'ij-hero--centred', 'ij-phone', 'ij-statement', 'ij-drawing', 'ij-card', 'ij-tour',
  'ij-trait--number', 'ij-assurances', 'ij-maker', 'ij-closing', 'ij-wordmark'];
const demos = { walkful: read('kit/walkful.html'), wean: read('kit/wean.html') };
// Wean's page has no cited fact by its brief (wean-nicotine#396), so the dated
// source card is shown under Walkful only; every other section under both.
const shownTwice = KIT_CLASSES.filter(c => ['ij-hero--split', 'ij-hero--centred'].includes(c) ||
  Object.values(demos).every(html => new RegExp(`class="[^"]*\\b${c}\\b`).test(html)));
check('both demos compose every section, so each is shown under two identities, and the two hero layouts between them',
  shownTwice.length === KIT_CLASSES.length && demos.walkful.includes('ij-hero--split') && demos.wean.includes('ij-hero--centred') &&
  demos.walkful.includes('class="ij-source"'),
  KIT_CLASSES.filter(c => !shownTwice.includes(c)).join(', '));
// The portfolio's standard (#71): no Made by Human badge and no AI-authorship
// wording on an app site. A drawing credit is allowed, as one line in the
// footer's fineprint and nowhere else.
check('the demos carry no Made by Human badge and no AI wording outside the fineprint credit',
  Object.values(demos).every(html => !/madebyhuman\.iamjarl\.com\/badges/i.test(html) &&
    !/(co-created|made|built|written|generated) (with|by) AI/i.test(html) &&
    !/\bAI\b/.test(html.replace(/<span slot="fineprint">[\s\S]*?<\/span>/g, ''))),
  'the badge lives in the README; a drawing credit is one line in the fineprint');
check('the WODrounds example, too, carries no badge or AI wording and loads nothing from Google', (() => {
  const html = read('kit/wodrounds.html');
  return !/madebyhuman\.iamjarl\.com\/badges|fonts\.googleapis|fonts\.gstatic/i.test(html) &&
    !/\bAI\b/.test(html.replace(/<span slot="fineprint">[\s\S]*?<\/span>/g, '')) &&
    [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].every(m => m[1].startsWith('../dist/components/') || m[1] === '../dist/kit/kit.js');
})());
// A scene (#81) sets the mood and never carries the content: at most two on a
// page, none in the hero, each photo decorative (alt="") and loaded lazily,
// and nothing in kit.css that moves it.
check('the kit\'s scenes: at most two a page, none in the hero, every photo decorative and lazy, nothing that moves', (() => {
  const pages = [read('kit/wodrounds.html'), ...Object.values(demos)];
  const scene = kitSrc.slice(kitSrc.indexOf('/* ---------- A scene'), kitSrc.indexOf('/* ---------- Closing'));
  return pages.every(html => {
    const hero = html.slice(html.indexOf('class="ij-hero'), html.indexOf('</section>', html.indexOf('class="ij-hero')));
    const photos = [...html.matchAll(/<img class="ij-scene__photo"[^>]*>/g)].map(m => m[0]);
    return (html.match(/class="ij-scene"/g) ?? []).length <= 2 && !hero.includes('ij-scene') &&
      photos.every(t => / alt=""/.test(t) && / loading="lazy"/.test(t));
  }) && /class="ij-scene"/.test(pages[0]) && /grayscale\(1\)/.test(scene) && !/animation|transition|background-attachment|transform/.test(scene);
})());
check('the demos load nothing from Google, and no script but the system\'s components',
  Object.values(demos).every(html => !/fonts\.googleapis|fonts\.gstatic/.test(html) &&
    [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].every(m => m[1].startsWith('../dist/components/') || m[1] === '../dist/kit/kit.js')));

// Motion (#65): two things move, from one small module of the system's own.
// The owner chose it over vendoring Motion, so it stays small and dependency
// free, and it has to defer to reduce motion in both places it acts.
const kitJsSrc = read('kit/kit.js');
const kitJsDist = read('dist/kit/kit.js');
check('kit.js is the system\'s own: no import, no dependency, under 4 KB',
  !/^\s*import\s/m.test(kitJsSrc) && !/\bfrom\s+['"]/.test(kitJsSrc) && Buffer.byteLength(kitJsDist) < 4096,
  `${Buffer.byteLength(kitJsDist)} bytes`);
check('kit.js defers to reduce motion for the video and the tour, and steps back if it is turned on',
  /prefers-reduced-motion: reduce/.test(kitJsSrc) && (kitJsSrc.match(/reduce\.addEventListener\('change'/g) || []).length === 2 &&
  /e\.isIntersecting && !reduce\.matches/.test(kitJsSrc));
check('dist/kit/kit.js is the source with its version on top, and hashed',
  kitJsDist.startsWith(`// IAMJARL marketing kit v${fullTokens.meta.version}:`) && kitJsDist.endsWith(kitJsSrc) &&
  'dist/kit/kit.js' in JSON.parse(read('dist/sri.json')).files);
check('the crossfade uses the motion tokens, and only once the tour has settled',
  /\.ij-tour\.is-ready [^{]*\{ transition: opacity var\(--ij-duration-slow\) var\(--ij-easing-standard\)/.test(kitSrc) &&
  !/\.ij-tour\.is-live[^{]*\{[^}]*transition/.test(kitSrc));

// --- Drawings and the loose stroke (#75) ---
// Wean's drawings are generated from their descriptions, so what must hold is
// the rule they are drawn by: one magenta waterline each, taking the accent
// token and stepping down left to right, nothing hard-coded, and the files and
// the example page carrying exactly what the descriptions draw.
console.log('\nDrawings:');
check('the loose stroke is deterministic, and differs with its seed',
  loosePath([[0, 0], [100, 0], [100, 40]], { seed: 3 }) === loosePath([[0, 0], [100, 0], [100, 40]], { seed: 3 }) &&
  loosePath([[0, 0], [100, 0]], { seed: 3 }) !== loosePath([[0, 0], [100, 0]], { seed: 4 }));
check('a staircase is a tread per value, joined by risers', JSON.stringify(stairsPoints([2, 1], { width: 20, height: 10, max: 2 })) ===
  JSON.stringify([[0, 0], [10, 0], [10, 5], [20, 5]]));
check('eight drawings, on coast and tide, each with an id of its own', WEAN_DRAWINGS.length === 8 &&
  new Set(WEAN_DRAWINGS.map(d => d.id)).size === 8);
const marksDown = WEAN_DRAWINGS.filter(d => {
  const m = d.strokes.filter(st => st.kind === 'mark');
  if (m.length !== 1) return false;
  const pts = (m[0].parts ?? [m[0].points]).flat();
  return pts.every((p, i) => i === 0 || (p[0] >= pts[i - 1][0] - 0.01 && p[1] >= pts[i - 1][1] - 0.01)) && pts.at(-1)[1] > pts[0][1];
});
check('each has exactly one magenta waterline, and it only ever steps down, left to right', marksDown.length === 8,
  WEAN_DRAWINGS.filter(d => !marksDown.includes(d)).map(d => d.id).join(', '));
const svgs = WEAN_DRAWINGS.map(renderDrawing);
check('every colour is a token: the mark the accent, the rest the text colour, no literal anywhere',
  svgs.every(svg => (svg.match(/class="ij-mark" style="stroke: var\(--ij-color-accent\)"/g) || []).length === 1 &&
    !/#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i.test(svg) && /var\(--ij-color-text-primary\)/.test(svg)));
check('each drawing ships as a file in dist/drawings/wean/, and the example page shows the same SVG', WEAN_DRAWINGS.every((d, i) => {
  const f = `dist/drawings/wean/${d.id.replace(/^wean-/, '')}.svg`;
  return fs.existsSync(path.join(ROOT, f)) && read(f).includes(svgs[i]) && read('kit/wean.html').includes(svgs[i]);
}));
check('the drawings stay light: each under 16 KB before compression', svgs.every(svg => Buffer.byteLength(svg) < 16384),
  svgs.map(svg => Buffer.byteLength(svg)).join(', '));
check('kit.css keeps a drawing\'s strokes readable at any size, and gives a data line the accent in the same hand',
  /\.ij-drawing path \{ vector-effect: non-scaling-stroke; \}/.test(read('kit/kit.css')) &&
  /\.ij-loose \{[^}]*stroke: var\(--ij-color-accent\);[^}]*vector-effect: non-scaling-stroke;/.test(read('kit/kit.css')));
// The example staircase follows Wean's own maths (lib/taper-plan.ts): a
// one-decimal allowance, shown as whole pouches, until it shows none.
const taper = [];
for (let w = 0; w < 520; w++) {
  const a = Math.max(0, Math.min(10, Math.round(10 * 0.9 ** w * 10) / 10));
  taper.push(Math.floor(a));
  if (Math.floor(a) === 0) break;
}
check(`the Wean example's staircase is Wean's taper for 10 a day at 10% a week (${taper.length} weeks), with a text version`,
  read('kit/wean.html').includes(`Week by week: ${taper.join(', ')}.`) && /<path class="ij-loose" d="/.test(read('kit/wean.html')) &&
  taper.slice(0, 6).join() === '10,9,8,7,6,5' && taper.at(-2) === 1 && taper.at(-1) === 0);
check('dist/kit/loose.js is the source with its version on top, hashed, and the drawings are exported',
  read('dist/kit/loose.js').endsWith(read('kit/loose.js')) && 'dist/kit/loose.js' in JSON.parse(read('dist/sri.json')).files &&
  JSON.parse(read('package.json')).exports['./drawings/*'] === './dist/drawings/*');

// --- Owner decisions, 2026-10-04 (#53) ---
// Written down in the docs, and the one with code consequences asserted on the
// code: the family accents are a web layer, so the Swift package must not
// carry them. If someone adds them "for consistency", this says why not.
console.log('\nOwner decisions (#53):');
const designMd = read('design.md');
check('design.md: Phosphor on the web, SF Symbols in native apps, never both',
  /Websites use Phosphor/.test(designMd) && /Native apps use SF Symbols/.test(designMd) && /One set per app, never both/.test(designMd));
check('AGENTS.md rule 5 says the same', /5\. Icons: \*\*Phosphor on the web\*\*.*\*\*SF Symbols in native apps\*\*/.test(read('AGENTS.md')));
check('tokens.json names both sets', fullTokens.brand.icons.library === 'phosphor' && fullTokens.brand.icons.nativeLibrary === 'sf-symbols');
check('design.md: family accents on the sites only', /On the sites only, not inside the apps/.test(designMd));
const swiftAll = fs.readdirSync(path.join(ROOT, 'Sources/IAMJARLDesignTokens'))
  .map(f => read(`Sources/IAMJARLDesignTokens/${f}`)).join('\n');
const accentHexes = [...new Set(registry.apps.filter(a => a.identity)
  .flatMap(a => ['light', 'dark'].flatMap(m => [a.identity[m]?.accent, a.identity[m]?.accentText]).filter(Boolean)))]
  .filter(h => ![tokenTree.colors.modes.light.primary, tokenTree.colors.modes.dark.primary].includes(h));
check('the Swift package carries no site accent',
  !/accent[-_]?family|familyAccent|accentFamily/i.test(swiftAll) && accentHexes.every(h => !swiftAll.toUpperCase().includes(h.toUpperCase())),
  'inside an app its colour belongs to its icon; the accents group products on the web (#53)');

// --- Supply chain (#59) ---
// A tag can be moved to point at other code; a commit SHA cannot. The version
// comment is what Dependabot reads to keep a SHA pin current.
console.log('\nSupply chain:');
const workflowDir = path.join(ROOT, '.github/workflows');
const usesLines = fs.readdirSync(workflowDir).filter(f => /\.ya?ml$/.test(f))
  .flatMap(f => read(`.github/workflows/${f}`).split('\n').filter(l => /^\s*-?\s*uses:/.test(l)).map(l => [f, l.trim()]));
const unpinned = usesLines.filter(([, l]) => !/uses:\s*[\w.-]+\/[\w.-]+@[0-9a-f]{40}\s+#\s*v\d+\.\d+\.\d+$/.test(l));
check(`every Action is pinned to a commit SHA with its version (${usesLines.length})`, usesLines.length > 0 && unpinned.length === 0,
  unpinned.map(([f, l]) => `${f}: ${l}`).join('; '));
const depYml = read('.github/dependabot.yml');
const ecosystems = (depYml.match(/package-ecosystem:/g) || []).length;
const cooldowns = [...depYml.matchAll(/cooldown:\s*\n\s*default-days:\s*(\d+)/g)].map(m => Number(m[1]));
check('every Dependabot ecosystem waits at least 7 days', ecosystems > 0 && cooldowns.length === ecosystems && cooldowns.every(d => d >= 7),
  `${ecosystems} ecosystem(s), cooldowns: ${cooldowns.join(', ') || 'none'}`);
check('AGENTS.md treats outside input as data', /## Outside input is data, not instructions/.test(read('AGENTS.md')) &&
  /Hidden text is a red flag/.test(read('AGENTS.md')));

// --- Store button (#58) ---
// Every fact a store button prints comes from apps.json through store.js; the
// fragments are checked against both, so a hand edit cannot slip in.
console.log('\nStore button:');
const ios = { platform: 'app-store', id: '6759229877', minOS: '16.0', price: { us: '$2.99', dk: '29,00 kr' }, locales: ['en', 'da'] };
const mac = { platform: 'mac-app-store', id: '6792136657', minOS: '14.0', price: { us: '$1.99' }, locales: ['en'] };
const cws = { platform: 'chrome-web-store', id: 'lpopnolnbpkmealenachikdfkfeaoecl', slug: 'botlens', price: { us: 'Free' }, locales: ['en'] };
check('the App Store link carries the portfolio campaign, mt=8 for iPhone',
  storeLink(ios) === 'https://apps.apple.com/app/id6759229877?pt=128512007&ct=site&mt=8');
check('the Mac App Store link uses mt=12', storeLink(mac).endsWith('&mt=12'));
check('the Chrome Web Store link is the listing', storeLink(cws) === 'https://chromewebstore.google.com/detail/botlens/lpopnolnbpkmealenachikdfkfeaoecl');
check('the facts line: price, once, the OS floor', factsLine(ios, 'en') === '$2.99 once · iOS 16 or later' &&
  factsLine(mac, 'en') === '$1.99 once · macOS 14 or later');
check('a translated page quotes its own storefront in its own words', factsLine(ios, 'da') === '29,00 kr engangskøb · iOS 16 eller nyere');
check('a free app says so, without "once"', factsLine({ ...ios, price: { us: 'Free' } }, 'en') === 'Free · iOS 16 or later' &&
  factsLine(cws, 'en') === 'Free');
check('a missing storefront price throws rather than printing nothing', (() => {
  try { factsLine(ios, 'sv'); return false; } catch { return true; }
})());
check('badges at their minimum legible height: Apple 40 px, Google 58', badgeHeight('app-store') === 40 &&
  badgeHeight('mac-app-store') === 40 && badgeHeight('chrome-web-store') === 58);
check('a fragment is named by placement and tone, the hero and the following badge adding nothing',
  fragmentName('wodrounds', 'da') === 'wodrounds.da.html' &&
  fragmentName('wodrounds', 'da', { placement: 'midpage' }) === 'wodrounds.da.midpage.html' &&
  fragmentName('wodrounds', 'da', { tone: 'white' }) === 'wodrounds.da.white.html' &&
  fragmentName('wodrounds', 'da', { placement: 'footer', tone: 'black' }) === 'wodrounds.da.footer.black.html');
check('the Offer reads the storefront price as a number in its currency', (() => {
  const o = offer(ios, 'da'), u = offer(ios, 'en');
  return o.price === '29.00' && o.priceCurrency === 'DKK' && u.price === '2.99' && u.priceCurrency === 'USD' &&
    o['@type'] === 'Offer' && o.url === 'https://apps.apple.com/app/id6759229877';
})());
check('the Offer reads thousands separators both ways, and a free app as 0',
  offer({ ...ios, price: { us: '$1,299.00' } }, 'en').price === '1299.00' &&
  offer({ ...ios, price: { dk: '1.299,00\u00a0kr' } }, 'da').price === '1299.00' &&
  offer(cws, 'en').price === '0' && offer(cws, 'en').url === storeLink(cws));
check('an Offer price it cannot read throws rather than guessing', (() => {
  try { offer({ ...ios, price: { us: 'about three dollars' } }, 'en'); return false; } catch { return true; }
})());
check('the localised App Store badge, the English Mac badge', badgeFile('app-store', 'da', 'black') === 'app-store-black-da-dk.svg' &&
  badgeFile('mac-app-store', 'da', 'white') === 'mac-app-store-white-en-us.svg');

const storeAppsReg = registry.apps.filter(a => a.status === 'shipped' && a.store);
const fragmentProblems = [];
for (const a of storeAppsReg) {
  for (const code of a.store.locales) {
    const href = storeLink(a.store).replace(/&/g, '&amp;');
    for (const placement of PLACEMENTS) {
      for (const tone of [undefined, ...TONES]) {
        const name = fragmentName(a.id, code, { placement, tone });
        if (!fs.existsSync(path.join(ROOT, 'dist/store', name))) { fragmentProblems.push(`${name} missing`); continue; }
        const html = read(`dist/store/${name}`);
        if (!html.includes(`href="${href}"`)) fragmentProblems.push(`${name}: link`);
        if (!html.includes(`<p class="ij-store-facts">${factsLine(a.store, code)}</p>`)) fragmentProblems.push(`${name}: facts`);
        if (!/data-umami-event="store-click"/.test(html) || !html.includes(`data-umami-event-locale="${code}"`)) fragmentProblems.push(`${name}: event`);
        if (!html.includes(`data-umami-event-placement="${placement}"`)) fragmentProblems.push(`${name}: placement`);
        if (!html.includes(`height="${badgeHeight(a.store.platform)}"`)) fragmentProblems.push(`${name}: badge height`);
        // A fixed tone is one <img> of that tone and nothing for the browser to swap.
        const ok = tone
          ? !html.includes('<source') && html.includes(`/${badgeFile(a.store.platform, code, tone)}"`)
          : html.includes(`srcset="`) && html.includes(`/${badgeFile(a.store.platform, code, 'white')}"`) &&
            html.includes(`/${badgeFile(a.store.platform, code, 'black')}"`);
        if (!ok) fragmentProblems.push(`${name}: tone`);
      }
    }
    const n = `dist/store/${a.id}.${code}.nav.html`;
    if (!fs.existsSync(path.join(ROOT, n))) { fragmentProblems.push(`${n} missing`); continue; }
    const nav = read(n);
    if (!nav.includes(`href="${href}"`)) fragmentProblems.push(`${a.id}.${code}.nav: link`);
    if (!/\n<a slot="cta"[^>]*data-umami-event-placement="nav"/.test(nav)) fragmentProblems.push(`${a.id}.${code}: nav fragment`);
    const o = `dist/store/${a.id}.${code}.offer.json`;
    if (!fs.existsSync(path.join(ROOT, o)) || JSON.stringify(JSON.parse(read(o))) !== JSON.stringify(offer(a.store, code))) fragmentProblems.push(`${o}: offer`);
  }
  const banner = smartBannerHtml(a, registry);
  if (Boolean(banner) !== fs.existsSync(path.join(ROOT, `dist/store/${a.id}.head.html`))) fragmentProblems.push(`${a.id}: smart banner`);
}
check(`every store fragment matches the registry (${storeAppsReg.reduce((n, a) => n + a.store.locales.length, 0)} locales, ${PLACEMENTS.length} placements, ${TONES.length + 1} tones, the nav and the Offer)`,
  fragmentProblems.length === 0, fragmentProblems.join('; '));
check('an iPhone app, or a Mac app with an iPhone sibling, gets a Smart App Banner',
  read('dist/store/trimrpix.head.html').includes('app-id=6761081919') && !fs.existsSync(path.join(ROOT, 'dist/store/tonvault.head.html')));
const storeDist = read('dist/components/ij-store-cta.js');
check('the element bundle is self-contained', !/^import /m.test(storeDist) && storeDist.includes('function storeLink') &&
  (storeDist.match(/customElements\.define\('ij-store-cta'/g) || []).length === 1);
check('the element ships with an SRI entry and an export', 'dist/components/ij-store-cta.js' in JSON.parse(read('dist/sri.json')).files &&
  JSON.parse(read('package.json')).exports['./components/store-cta'] === './dist/components/ij-store-cta.js');
// The portfolio's voice rules ban the em-dash, and a site cannot fix a comment
// in a file marked "do not edit": every paste would bring one back (#63).
const generatedFiles = dir => fs.readdirSync(path.join(ROOT, dir), { recursive: true })
  .map(f => path.join(dir, String(f))).filter(f => fs.statSync(path.join(ROOT, f)).isFile() && !/\.(woff2|png|svg)$/.test(f));
const dashed = ['dist', 'Sources', 'Tests'].flatMap(generatedFiles).filter(f => read(f).includes('\u2014'));
check('no generated file carries an em-dash', dashed.length === 0, dashed.join(', '));
check('the README gives the element its integrity hash', (() => {
  const block = read('README.md').split('<!-- SRI:BEGIN -->')[1]?.split('<!-- SRI:END -->')[0] ?? '';
  return block.includes('dist/components/ij-store-cta.js') && block.includes(sriFile.files['dist/components/ij-store-cta.js']);
})());
check('the badges ship with their source and rules', JSON.parse(read('package.json')).files.includes('badges/') &&
  /Use them as published/.test(read('badges/README.md')));

// --- Patterns ---
// The contrast floor is the part a site would otherwise re-derive or skip, so
// it is asserted rather than left to survive edits by luck.
console.log('\nPatterns:');
const heroPattern = read('patterns/photographic-hero.md');
check('the photographic hero pattern exists and is linked',
  heroPattern.length > 0 && read('design.md').includes('patterns/photographic-hero.md'));
check('it states the opacity floor', /\u03b1 \u2265 0\.60/.test(heroPattern));
check('the floor it states is the one color.js computes', (() => {
  // rgba(13,13,13,0.60) composited over the lightest possible image, white text
  const a = 0.6, g = 13;
  const bg = { r: Math.round(g * a + 255 * (1 - a)), g: Math.round(g * a + 255 * (1 - a)),
               b: Math.round(g * a + 255 * (1 - a)), a: 1 };
  return contrastRatio(parseColor('#FFFFFF'), bg) >= 4.5;
})(), 'the documented floor must still hold if the math ever changes');
check('it carries a weight budget', /Budget: 250 KB/.test(heroPattern));
check('it warns about the stacking bug', /paints \*after\* its positioned/.test(heroPattern));

console.log('\nSubresource integrity:');
const sri = JSON.parse(read('dist/sri.json'));
check('sri.json version matches tokens.json', sri.version === tokens.meta.version);
check('sri.json declares sha384', sri.algorithm === 'sha384');

const missingFiles = Object.keys(sri.files).filter(rel => !fs.existsSync(path.join(ROOT, rel)));
check('every entry points at a file that exists', missingFiles.length === 0,
  `listed but not built: ${missingFiles.join(', ')}`);
const recomputed = Object.fromEntries(
  Object.keys(sri.files).filter(rel => !missingFiles.includes(rel)).map(rel => [
    rel,
    'sha384-' + crypto.createHash('sha384')
      .update(fs.readFileSync(path.join(ROOT, rel))).digest('base64'),
  ])
);
check('every hash matches its file', Object.entries(sri.files)
  .every(([rel, h]) => recomputed[rel] === h),
  Object.keys(sri.files).filter(r => recomputed[r] !== sri.files[r]).join(', '));
check('covers the four shared CDN files',
  ['dist/css/tokens.css', 'dist/css/tokens.shadow.css', 'dist/components/ij-footer.js', 'dist/components/ij-nav.js']
    .every(f => f in sri.files));
// A site adopts its identity sheet with one pinned <link>, exactly like
// tokens.css, so a sheet without a hash forces every adopter to compute one by
// hand — which is what the first adopter had to do (JarlLyng/echolume#198).
const unhashed = sheets.filter(f => !(`dist/identity/${f}` in sri.files));
check('every identity sheet has an entry', sheets.length > 0 && unhashed.length === 0,
  `no hash for: ${unhashed.join(', ')}`);
check('footer fragments are deliberately not listed',
  !Object.keys(sri.files).some(f => f.startsWith('dist/footers/')),
  'a fragment is copied into the site\'s HTML at build time; SRI applies only to fetched resources');

// README carries the paste-ready tags and is generated, but sits outside the
// dist/ drift check — so it is asserted here instead.
const readme = read('README.md');
const block = readme.slice(readme.indexOf('<!-- SRI:BEGIN -->'), readme.indexOf('<!-- SRI:END -->'));
check('README has the SRI markers', block.length > 0);
check('README block pins the current version', block.includes(`@v${tokens.meta.version}/`));
check('README block carries the current hashes',
  block.includes(sri.files['dist/css/tokens.css']) &&
  block.includes(sri.files['dist/components/ij-footer.js']));
check('README block uses crossorigin on every tag',
  (block.match(/crossorigin="anonymous"/g) || []).length === (block.match(/integrity="/g) || []).length &&
  (block.match(/integrity="/g) || []).length === 4);

// Pins outside the SRI block. README.md sits outside the dist/ drift check, so
// this is what catches a release built without `npm run build`. The patterns are
// deliberately broader than any one install method: a pin in a new form still
// has to be current.
const pins = [...readme.matchAll(
  /iamjarl-design(?:\.git", from: "|[@#]v)(\d+\.\d+\.\d+)/g
)].map(m => m[1]);
check('the README has install pins to check', pins.length >= 5,
  `found ${pins.length}; if the install sections moved, this test must move with them`);
check('every install pin in the README is the current version',
  pins.every(v => v === tokens.meta.version),
  `stale: ${[...new Set(pins.filter(v => v !== tokens.meta.version))].join(', ')} — run npm run build`);

console.log();
if (failed > 0) {
  console.error(`❌ ${failed} test(s) failed.`);
  process.exit(1);
} else {
  console.log('✅ All contract tests passed.');
}
