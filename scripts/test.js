#!/usr/bin/env node
// Contract tests — verify generated outputs contain the API the docs promise.
// No test framework, just assertions.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
  'public enum Common',
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
  '--ij-spacing-md',
  '--ij-radius-lg',
  '--ij-font-size-base',
  '--ij-shadow-md',
  '--ij-duration-normal',
  '--ij-easing-standard',
  '--ij-breakpoint-md',
  '--ij-focus-width',
];
for (const v of cssVars) {
  check(`CSS contains "${v}"`, css.includes(v));
}
check('CSS has dark-mode media query', css.includes('@media (prefers-color-scheme: dark)'));
check('CSS has .light class override', /\.light\s*\{/.test(css));
check('CSS has .dark class override', /\.dark\s*\{/.test(css));

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

console.log();
if (failed > 0) {
  console.error(`❌ ${failed} test(s) failed.`);
  process.exit(1);
} else {
  console.log('✅ All contract tests passed.');
}
