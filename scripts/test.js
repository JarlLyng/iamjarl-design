#!/usr/bin/env node
// Contract tests — verify generated outputs contain the API the docs promise.
// No test framework, just assertions.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHex, parseRgba, parseColor, contrastRatio } from './color.js';
import { extractNotes } from './release-notes.js';

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

console.log();
if (failed > 0) {
  console.error(`❌ ${failed} test(s) failed.`);
  process.exit(1);
} else {
  console.log('✅ All contract tests passed.');
}
