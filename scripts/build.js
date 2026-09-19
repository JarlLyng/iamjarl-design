#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseHex, parseColor, contrastRatio } from './color.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const TOKENS_PATH = path.join(ROOT, 'tokens.json');

function readTokens() {
  const raw = fs.readFileSync(TOKENS_PATH, 'utf-8');
  return JSON.parse(raw);
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`  ✓ ${path.relative(ROOT, filePath)}`);
}

// --- Swift reserved words that need backtick escaping ---
const SWIFT_RESERVED = new Set([
  'default', 'class', 'import', 'return', 'switch', 'case', 'break',
  'continue', 'func', 'var', 'let', 'struct', 'enum', 'protocol',
  'extension', 'self', 'super', 'init', 'true', 'false', 'nil',
  'throw', 'try', 'catch', 'guard', 'where', 'in', 'for', 'while',
  'repeat', 'if', 'else', 'do', 'as', 'is', 'operator', 'static',
  'public', 'private', 'internal', 'open', 'fileprivate', 'type',
]);

function swiftName(key) {
  return SWIFT_RESERVED.has(key) ? '`' + key + '`' : key;
}

function isRgba(value) {
  return typeof value === 'string' && value.startsWith('rgba(');
}

function swiftColorInit(value) {
  return isRgba(value) ? `Color(rgba: "${value}")` : `Color(hex: "${value}")`;
}

// ============================================================
// SWIFT GENERATOR
// ============================================================

function generateSwift(tokens) {
  const { meta, brand, tokens: t } = tokens;
  const lines = [];
  const w = (line = '') => lines.push(line);

  w('import SwiftUI');
  w();
  w('// MARK: - IAMJARL Design Tokens (SwiftUI)');
  w('//');
  w(`// Auto-generated from tokens.json v${meta.version} — do not edit manually.`);
  w('// Run: node scripts/build.js');
  w('//');
  w('// Design DNA:');
  w(`// - Neon primary (light: ${t.colors.modes.light.primary}, dark: ${t.colors.modes.dark.primary})`);
  w('// - Subtle translucent surfaces');
  w('// - Consistent state colors (success/warning/error)');
  w();
  w('public enum DesignTokens {');
  w();

  // Spacing
  w('  // MARK: Spacing');
  w('  public enum Spacing {');
  for (const [key, val] of Object.entries(t.spacing)) {
    w(`    public static let ${key}: CGFloat = ${val}`);
  }
  w('  }');
  w();

  // Radius
  w('  // MARK: Radius');
  w('  public enum Radius {');
  for (const [key, val] of Object.entries(t.radius)) {
    w(`    public static let ${key}: CGFloat = ${val}`);
  }
  w('  }');
  w();

  // Typography
  w('  // MARK: Typography');
  w('  // Note: SwiftUI does not use numeric weights directly; these are mapped to Font.Weight.');
  w('  public enum Typography {');
  w(`    public static let uiFontName: String = "${brand.typography.family.ui}"`);
  w(`    public static let monoFontName: String = "${brand.typography.family.mono}"`);
  w();
  w('    public enum Size {');
  for (const [key, val] of Object.entries(brand.typography.sizes)) {
    w(`      public static let ${key}: CGFloat = ${val}`);
  }
  w('    }');
  w();
  w('    public enum LineHeight {');
  for (const [key, val] of Object.entries(brand.typography.lineHeights)) {
    w(`      public static let ${key}: CGFloat = ${val}`);
  }
  w('    }');
  w();
  w('    public enum Weight {');
  const weightMap = { 400: '.regular', 600: '.semibold', 700: '.bold' };
  for (const [key, val] of Object.entries(brand.typography.weights)) {
    const swiftWeight = weightMap[val] || '.regular';
    w(`      public static let ${key}: Font.Weight = ${swiftWeight}`);
  }
  w('    }');
  w('  }');
  w();

  // Shadows
  if (t.shadows) {
    w('  // MARK: Shadow');
    w('  public enum Shadow {');
    w('    public struct Value {');
    w('      public let x: CGFloat');
    w('      public let y: CGFloat');
    w('      public let blur: CGFloat');
    w('      public let opacity: Double');
    w('    }');
    for (const [key, val] of Object.entries(t.shadows)) {
      w(`    public static let ${key} = Value(x: ${val.x}, y: ${val.y}, blur: ${val.blur}, opacity: ${val.opacity})`);
    }
    w('  }');
    w();
  }

  // Motion
  if (t.motion) {
    w('  // MARK: Motion');
    w('  public enum Motion {');
    w('    public enum Duration {');
    for (const [key, val] of Object.entries(t.motion.duration)) {
      const seconds = val / 1000;
      w(`      public static let ${key}: Double = ${seconds}`);
    }
    w('    }');
    w();
    w('    public enum Easing {');
    for (const [key, val] of Object.entries(t.motion.easing)) {
      const [c1x, c1y, c2x, c2y] = val;
      w(`      public static func ${key}(duration: Double = Duration.normal) -> Animation {`);
      w(`        Animation.timingCurve(${c1x}, ${c1y}, ${c2x}, ${c2y}, duration: duration)`);
      w('      }');
    }
    w('    }');
    w('  }');
    w();
  }

  // Container widths
  if (t.container) {
    w('  // MARK: Container widths');
    w('  public enum Container {');
    for (const [key, val] of Object.entries(t.container)) {
      w(`    public static let ${key}: CGFloat = ${val}`);
    }
    w('  }');
    w();
  }

  // Breakpoints
  if (t.breakpoints) {
    w('  // MARK: Breakpoints');
    w('  public enum Breakpoint {');
    for (const [key, val] of Object.entries(t.breakpoints)) {
      w(`    public static let ${key}: CGFloat = ${val}`);
    }
    w('  }');
    w();
  }

  // Focus
  if (t.focus) {
    w('  // MARK: Focus');
    w('  public enum Focus {');
    for (const [key, val] of Object.entries(t.focus)) {
      w(`    public static let ${key}: CGFloat = ${val}`);
    }
    w('  }');
    w();
  }

  // Z-index
  if (t.zIndex) {
    w('  // MARK: Z-Index');
    w('  public enum ZIndex {');
    for (const [key, val] of Object.entries(t.zIndex)) {
      w(`    public static let ${swiftName(key)}: Double = ${val}`);
    }
    w('  }');
    w();
  }

  // Opacity
  if (t.opacity) {
    w('  // MARK: Opacity');
    w('  public enum Opacity {');
    for (const [key, val] of Object.entries(t.opacity)) {
      w(`    public static let ${swiftName(key)}: Double = ${val}`);
    }
    w('  }');
    w();
  }

  // Color Tokens
  w('  // MARK: Color Tokens');
  w('  public enum ColorToken {');
  w();

  // Static colors
  w('    // Static');
  for (const [key, val] of Object.entries(t.colors.static)) {
    w(`    public static let ${key} = ${swiftColorInit(val)}`);
  }
  w();

  // Shared state colors
  w('    // Shared state colors');
  w('    public enum State {');
  const shared = t.colors.shared;
  const sharedPairs = [
    ['success', 'onSuccess'],
    ['warning', 'onWarning'],
    ['error', 'onError'],
  ];
  for (const [color, onColor] of sharedPairs) {
    w(`      public static let ${color} = ${swiftColorInit(shared[color])}`);
    w(`      public static let ${onColor} = ${swiftColorInit(shared[onColor])}`);
    w();
  }
  // Remove trailing empty line
  if (lines[lines.length - 1] === '') lines.pop();
  w('    }');
  w();

  // Mode-aware colors
  for (const mode of ['light', 'dark']) {
    const label = mode.charAt(0).toUpperCase() + mode.slice(1);
    const m = t.colors.modes[mode];

    w(`    // Mode-aware colors (${label})`);
    w(`    public enum ${label} {`);
    // Scalar color props at the mode root (primary, onPrimary, primaryHover, ...)
    for (const [k, v] of Object.entries(m)) {
      if (typeof v === 'string') {
        w(`      public static let ${swiftName(k)} = ${swiftColorInit(v)}`);
      }
    }
    w();

    // Nested groups: text, background, surface, border, state.
    // gradients is deliberately absent — a CSS gradient string has no SwiftUI
    // equivalent, and the apps do not use them. Do not add it here.
    const groups = [
      { key: 'text', label: 'Text' },
      { key: 'background', label: 'Background' },
      { key: 'surface', label: 'Surface' },
      { key: 'border', label: 'Border' },
      { key: 'state', label: 'State' },
    ];

    for (const group of groups) {
      const obj = m[group.key];
      if (!obj) continue;
      w(`      public enum ${group.label} {`);
      for (const [k, v] of Object.entries(obj)) {
        w(`        public static let ${swiftName(k)} = ${swiftColorInit(v)}`);
      }
      w('      }');
      w();
    }
    // Remove trailing empty line before closing enum
    if (lines[lines.length - 1] === '') lines.pop();
    w('    }');
    w();
  }

  // Remove trailing empty line
  if (lines[lines.length - 1] === '') lines.pop();
  w('  }');
  w();

  // Mode helpers
  w('  // MARK: - Mode Helpers');
  w();
  w('  /// Pick a value by ColorScheme.');
  w('  public static func pick<T>(_ light: T, _ dark: T, scheme: ColorScheme) -> T {');
  w('    scheme == .dark ? dark : light');
  w('  }');
  w();
  w('  /// Pick a Color by ColorScheme.');
  w('  public static func color(light: Color, dark: Color, scheme: ColorScheme) -> Color {');
  w('    pick(light, dark, scheme: scheme)');
  w('  }');
  w();

  // Common convenience accessors
  w('  /// Convenient accessors for common colors without nesting.');
  w('  public enum Common {');
  w('    public enum OnPrimary {');
  w('      public static func text(_ scheme: ColorScheme) -> Color {');
  w('        DesignTokens.color(');
  w('          light: ColorToken.Light.onPrimary,');
  w('          dark: ColorToken.Dark.onPrimary,');
  w('          scheme: scheme');
  w('        )');
  w('      }');
  w('    }');

  for (const prop of ['primary', 'primaryHover', 'primaryPressed', 'primarySubtle']) {
    w(`    public static func ${prop}(_ scheme: ColorScheme) -> Color {`);
    w(`      DesignTokens.color(light: ColorToken.Light.${prop}, dark: ColorToken.Dark.${prop}, scheme: scheme)`);
    w('    }');
  }
  w();

  // Common.Text
  w('    public enum Text {');
  for (const prop of ['primary', 'secondary', 'tertiary', 'disabled', 'inverse']) {
    w(`      public static func ${prop}(_ scheme: ColorScheme) -> Color {`);
    w(`        DesignTokens.color(light: ColorToken.Light.Text.${prop}, dark: ColorToken.Dark.Text.${prop}, scheme: scheme)`);
    w('      }');
  }
  w('    }');
  w();

  // Common.Background
  w('    public enum Background {');
  for (const prop of ['app', 'muted', 'card', 'disabled']) {
    w(`      public static func ${prop}(_ scheme: ColorScheme) -> Color {`);
    w(`        DesignTokens.color(light: ColorToken.Light.Background.${prop}, dark: ColorToken.Dark.Background.${prop}, scheme: scheme)`);
    w('      }');
  }
  w('    }');
  w();

  // Common.Border
  w('    public enum Border {');
  for (const prop of ['subtle', 'default']) {
    const escaped = swiftName(prop);
    w(`      public static func ${escaped}(_ scheme: ColorScheme) -> Color {`);
    w(`        DesignTokens.color(light: ColorToken.Light.Border.${prop}, dark: ColorToken.Dark.Border.${prop}, scheme: scheme)`);
    w('      }');
  }
  w('    }');
  w();

  // Common.State — mode-aware state colors safe for use as foreground/text
  w('    public enum State {');
  for (const prop of ['success', 'warning', 'error']) {
    w(`      public static func ${prop}(_ scheme: ColorScheme) -> Color {`);
    w(`        DesignTokens.color(light: ColorToken.Light.State.${prop}, dark: ColorToken.Dark.State.${prop}, scheme: scheme)`);
    w('      }');
  }
  w('    }');
  w('  }');
  w('}');
  w();

  // Color extensions
  w('// MARK: - Color Parsing Helpers');
  w();
  w('public extension Color {');
  w('  /// Initialize a Color from hex strings like "#RRGGBB" or "#AARRGGBB".');
  w('  init(hex: String) {');
  w('    let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)');
  w('    var int: UInt64 = 0');
  w('    Scanner(string: hex).scanHexInt64(&int)');
  w();
  w('    let a, r, g, b: UInt64');
  w('    switch hex.count {');
  w('    case 6:');
  w('      (a, r, g, b) = (255, (int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)');
  w('    case 8:');
  w('      (a, r, g, b) = ((int >> 24) & 0xFF, (int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)');
  w('    default:');
  w('      (a, r, g, b) = (255, 0, 0, 0)');
  w('    }');
  w();
  w('    self.init(');
  w('      .sRGB,');
  w('      red: Double(r) / 255.0,');
  w('      green: Double(g) / 255.0,');
  w('      blue: Double(b) / 255.0,');
  w('      opacity: Double(a) / 255.0');
  w('    )');
  w('  }');
  w();
  w('  /// Initialize a Color from a CSS-like rgba() string: "rgba(r, g, b, a)".');
  w('  init(rgba: String) {');
  w('    let cleaned = rgba');
  w('      .replacingOccurrences(of: "rgba(", with: "")');
  w('      .replacingOccurrences(of: ")", with: "")');
  w('      .replacingOccurrences(of: " ", with: "")');
  w();
  w('    let parts = cleaned.split(separator: ",").map(String.init)');
  w('    guard parts.count == 4,');
  w('          let r = Double(parts[0]),');
  w('          let g = Double(parts[1]),');
  w('          let b = Double(parts[2]),');
  w('          let a = Double(parts[3]) else {');
  w('      self = .clear');
  w('      return');
  w('    }');
  w();
  w('    self.init(.sRGB, red: r / 255.0, green: g / 255.0, blue: b / 255.0, opacity: a)');
  w('  }');
  w('}');
  w();

  return lines.join('\n');
}

// ============================================================
// CSS GENERATOR
// ============================================================

function camelToKebab(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function generateCSS(tokens, scope = ':root') {
  const { meta, brand, tokens: t } = tokens;
  const lines = [];
  const w = (line = '') => lines.push(line);
  const isShadow = scope === ':host';

  w(`/* IAMJARL Design Tokens v${meta.version} — generated, do not edit */`);
  if (isShadow) {
    w('/* Shadow DOM variant: variables scoped to :host for content scripts */');
  }
  w();
  w(`${scope} {`);

  // Spacing
  w('  /* Spacing */');
  for (const [key, val] of Object.entries(t.spacing)) {
    w(`  --ij-spacing-${key}: ${val}px;`);
  }
  w();

  // Radius
  w('  /* Radius */');
  for (const [key, val] of Object.entries(t.radius)) {
    w(`  --ij-radius-${key}: ${val}px;`);
  }
  w();

  // Typography
  w('  /* Typography */');
  w(`  --ij-font-ui: ${brand.typography.family.ui};`);
  w(`  --ij-font-mono: ${brand.typography.family.mono};`);
  w();
  for (const [key, val] of Object.entries(brand.typography.sizes)) {
    w(`  --ij-font-size-${key}: ${val}px;`);
  }
  w();
  for (const [key, val] of Object.entries(brand.typography.lineHeights)) {
    w(`  --ij-line-height-${key}: ${val}px;`);
  }
  w();
  for (const [key, val] of Object.entries(brand.typography.weights)) {
    w(`  --ij-font-weight-${key}: ${val};`);
  }
  w();

  // Shadows
  if (t.shadows) {
    w('  /* Shadows */');
    for (const [key, val] of Object.entries(t.shadows)) {
      w(`  --ij-shadow-${key}: ${val.x}px ${val.y}px ${val.blur}px rgba(0, 0, 0, ${val.opacity});`);
    }
    w();
  }

  // Motion
  if (t.motion) {
    w('  /* Motion — duration */');
    for (const [key, val] of Object.entries(t.motion.duration)) {
      w(`  --ij-duration-${key}: ${val}ms;`);
    }
    w();
    w('  /* Motion — easing */');
    for (const [key, val] of Object.entries(t.motion.easing)) {
      w(`  --ij-easing-${key}: cubic-bezier(${val.join(', ')});`);
    }
    w();
  }

  // Breakpoints
  if (t.breakpoints) {
    w('  /* Breakpoints (for JS / SCSS use; CSS media queries need literal px values) */');
    for (const [key, val] of Object.entries(t.breakpoints)) {
      w(`  --ij-breakpoint-${key}: ${val}px;`);
    }
    w();
  }

  // Container widths
  if (t.container) {
    w('  /* Container max-widths */');
    for (const [key, val] of Object.entries(t.container)) {
      w(`  --ij-container-${camelToKebab(key)}: ${val}px;`);
    }
    w();
  }

  // Focus
  if (t.focus) {
    w('  /* Focus ring */');
    for (const [key, val] of Object.entries(t.focus)) {
      w(`  --ij-focus-${camelToKebab(key)}: ${val}px;`);
    }
    w();
  }

  // Z-index
  if (t.zIndex) {
    w('  /* Z-index */');
    for (const [key, val] of Object.entries(t.zIndex)) {
      w(`  --ij-z-${camelToKebab(key)}: ${val};`);
    }
    w();
  }

  // Opacity
  if (t.opacity) {
    w('  /* Opacity */');
    for (const [key, val] of Object.entries(t.opacity)) {
      w(`  --ij-opacity-${camelToKebab(key)}: ${val};`);
    }
    w();
  }

  // Static colors
  w('  /* Static colors */');
  for (const [key, val] of Object.entries(t.colors.static)) {
    w(`  --ij-color-${camelToKebab(key)}: ${val};`);
  }
  w();

  // Shared state colors
  w('  /* Shared state colors */');
  for (const [key, val] of Object.entries(t.colors.shared)) {
    w(`  --ij-color-${camelToKebab(key)}: ${val};`);
  }
  w();

  // Light mode colors (default)
  const light = t.colors.modes.light;
  const dark = t.colors.modes.dark;
  w('  /* Mode colors (light default) */');
  for (const line of modeColorLines(light, '  ')) w(line);

  w('}');
  w();

  // Dark mode
  w('@media (prefers-color-scheme: dark) {');
  w(`  ${scope} {`);
  for (const line of modeColorLines(dark, '    ')) w(line);
  w('  }');
  w('}');
  w();

  // Explicit class overrides
  w('/* Explicit class overrides for manual mode switching */');
  w('.light {');
  for (const line of modeColorLines(light, '  ')) w(line);
  w('}');
  w();
  w('.dark {');
  for (const line of modeColorLines(dark, '  ')) w(line);
  w('}');
  w();

  return lines.join('\n');
}

// Emit CSS custom properties for a single color mode. Scalar props become
// --ij-color-<key>; nested groups are flattened (background → "bg").
// Which single foreground, if any, clears WCAG AA across every stop of a
// gradient. Decorative ramps legitimately span extremes, so this is a note
// rather than an error — but it travels with the value so a consumer reads it
// where they use it rather than discovering it in an audit.
function gradientTextNote(value) {
  const stops = (String(value).match(/#[0-9a-fA-F]{6}/g) || []).map(parseColor).filter(Boolean);
  if (!stops.length) return 'decorative';
  const safe = [['black', parseColor('#000000')], ['white', parseColor('#FFFFFF')]]
    .filter(([, fg]) => stops.every(s => contrastRatio(fg, s) >= 4.5))
    .map(([n]) => n);
  return safe.length ? `text-safe: ${safe.join(' or ')}` : 'decorative only — no text colour clears AA';
}

function modeColorLines(mode, indent) {
  const out = [];
  // DEPRECATED since 1.6.0, removal in 2.0.0. Use
  //   color-mix(in srgb, var(--ij-color-primary) 30%, transparent)
  // which works on every color token instead of only this one. Still emitted so
  // 1.3-1.5 consumers keep working; see design.md.
  // validate.js requires primary to be hex, so this should never throw. Fail
  // loudly rather than silently omitting the variable from one mode only.
  const rgb = typeof mode.primary === 'string' ? parseHex(mode.primary) : null;
  if (!rgb) {
    throw new Error(
      `Cannot derive --ij-color-primary-rgb: primary is "${mode.primary}", which is not a 6- or 8-digit hex color. Run scripts/validate.js.`
    );
  }
  out.push(`${indent}--ij-color-primary-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b}; /* deprecated, use color-mix() */`);
  // Gradients are values, not colors, so they get their own --ij-gradient-*
  // namespace rather than being flattened into --ij-color-gradients-*.
  // Each carries whether text can sit on it, because the answer is not visible
  // from the value and three of the four ramps cannot carry any foreground.
  for (const [key, val] of Object.entries(mode.gradients ?? {})) {
    out.push(`${indent}--ij-gradient-${camelToKebab(key)}: ${val}; /* ${gradientTextNote(val)} */`);
  }

  const groupPrefix = { background: 'bg' };
  function flatten(obj, prefix) {
    for (const [key, val] of Object.entries(obj)) {
      if (typeof val === 'object' && val !== null) {
        flatten(val, `${prefix}-${camelToKebab(key)}`);
      } else {
        out.push(`${indent}--ij-color-${prefix}-${camelToKebab(key)}: ${val};`);
      }
    }
  }
  for (const [key, val] of Object.entries(mode)) {
    if (key === 'gradients') continue;
    if (typeof val === 'object' && val !== null) {
      flatten(val, groupPrefix[key] || camelToKebab(key));
    } else {
      out.push(`${indent}--ij-color-${camelToKebab(key)}: ${val};`);
    }
  }
  return out;
}

// ============================================================
// TYPESCRIPT GENERATOR
// ============================================================

function generateTS(tokens) {
  const { meta, brand, tokens: t } = tokens;
  const lines = [];
  const w = (line = '') => lines.push(line);

  w(`// IAMJARL Design Tokens v${meta.version} — generated, do not edit`);
  w();
  w(`export const meta = ${JSON.stringify({ name: meta.name, version: meta.version })} as const;`);
  w();
  w(`export const spacing = ${JSON.stringify(t.spacing)} as const;`);
  w();
  w(`export const radius = ${JSON.stringify(t.radius)} as const;`);
  w();
  w(`export const typography = ${JSON.stringify({
    family: brand.typography.family,
    weights: brand.typography.weights,
    sizes: brand.typography.sizes,
    lineHeights: brand.typography.lineHeights,
  }, null, 2)} as const;`);
  w();
  w(`export const icons = ${JSON.stringify({
    library: brand.icons.library,
    defaultWeight: brand.icons.defaultWeight,
    weightsAllowed: brand.icons.weightsAllowed,
    defaultSizes: brand.icons.defaultSizes,
  }, null, 2)} as const;`);
  w();

  w('export const colors = {');
  w(`  static: ${JSON.stringify(t.colors.static)},`);
  w(`  shared: ${JSON.stringify(t.colors.shared)},`);
  w(`  light: ${JSON.stringify(t.colors.modes.light, null, 4).split('\n').map((l, i) => i === 0 ? l : '  ' + l).join('\n')},`);
  w(`  dark: ${JSON.stringify(t.colors.modes.dark, null, 4).split('\n').map((l, i) => i === 0 ? l : '  ' + l).join('\n')},`);
  w('} as const;');
  w();

  w('export type ColorMode = "light" | "dark";');
  w();
  w('/** Get mode-aware colors */');
  w('export function modeColors(mode: ColorMode) {');
  w('  return colors[mode];');
  w('}');
  w();

  // Shadows
  if (t.shadows) {
    w(`export const shadows = ${JSON.stringify(t.shadows, null, 2)} as const;`);
    w();
    w('/** Format a shadow token as a CSS box-shadow string */');
    w('export function shadowCss(name: keyof typeof shadows): string {');
    w('  const s = shadows[name];');
    w('  return `${s.x}px ${s.y}px ${s.blur}px rgba(0, 0, 0, ${s.opacity})`;');
    w('}');
    w();
  }

  // Motion
  if (t.motion) {
    w(`export const motion = ${JSON.stringify(t.motion, null, 2)} as const;`);
    w();
    w('/** Format an easing token as a CSS cubic-bezier string */');
    w('export function easingCss(name: keyof typeof motion.easing): string {');
    w('  return `cubic-bezier(${motion.easing[name].join(", ")})`;');
    w('}');
    w();
  }

  // Container widths
  if (t.container) {
    w(`export const container = ${JSON.stringify(t.container)} as const;`);
    w();
  }

  // Breakpoints
  if (t.breakpoints) {
    w(`export const breakpoints = ${JSON.stringify(t.breakpoints)} as const;`);
    w();
  }

  // Focus
  if (t.focus) {
    w(`export const focus = ${JSON.stringify(t.focus)} as const;`);
    w();
  }

  // Z-index
  if (t.zIndex) {
    w(`export const zIndex = ${JSON.stringify(t.zIndex)} as const;`);
    w();
  }

  // Opacity
  if (t.opacity) {
    w(`export const opacity = ${JSON.stringify(t.opacity)} as const;`);
    w();
  }

  // Named type aliases for ergonomic consumer use
  w('// Type aliases');
  w('export type Spacing = typeof spacing;');
  w('export type SpacingKey = keyof Spacing;');
  w('export type Radius = typeof radius;');
  w('export type RadiusKey = keyof Radius;');
  w('export type Typography = typeof typography;');
  w('export type FontSize = keyof Typography["sizes"];');
  w('export type FontWeight = keyof Typography["weights"];');
  w('export type LineHeight = keyof Typography["lineHeights"];');
  w('export type ThemeColors = typeof colors.light;');
  w('export type StaticColors = typeof colors.static;');
  w('export type SharedColors = typeof colors.shared;');
  if (t.shadows) {
    w('export type Shadows = typeof shadows;');
    w('export type ShadowKey = keyof Shadows;');
  }
  if (t.motion) {
    w('export type Motion = typeof motion;');
    w('export type DurationKey = keyof Motion["duration"];');
    w('export type EasingKey = keyof Motion["easing"];');
  }
  if (t.container) {
    w('export type Container = typeof container;');
  }
  if (t.breakpoints) {
    w('export type Breakpoints = typeof breakpoints;');
    w('export type BreakpointKey = keyof Breakpoints;');
  }
  if (t.focus) {
    w('export type Focus = typeof focus;');
  }
  if (t.zIndex) {
    w('export type ZIndex = typeof zIndex;');
    w('export type ZIndexKey = keyof ZIndex;');
  }
  if (t.opacity) {
    w('export type Opacity = typeof opacity;');
    w('export type OpacityKey = keyof Opacity;');
  }
  w();

  return lines.join('\n');
}

// ============================================================
// JAVASCRIPT (ESM) GENERATOR — strips types from TS output
// ============================================================

function generateJS(tokens) {
  const { meta, brand, tokens: t } = tokens;
  const lines = [];
  const w = (line = '') => lines.push(line);

  w(`// IAMJARL Design Tokens v${meta.version} — generated, do not edit`);
  w();
  w(`export const meta = ${JSON.stringify({ name: meta.name, version: meta.version })};`);
  w();
  w(`export const spacing = ${JSON.stringify(t.spacing)};`);
  w();
  w(`export const radius = ${JSON.stringify(t.radius)};`);
  w();
  w(`export const typography = ${JSON.stringify({
    family: brand.typography.family,
    weights: brand.typography.weights,
    sizes: brand.typography.sizes,
    lineHeights: brand.typography.lineHeights,
  })};`);
  w();
  w(`export const icons = ${JSON.stringify({
    library: brand.icons.library,
    defaultWeight: brand.icons.defaultWeight,
    weightsAllowed: brand.icons.weightsAllowed,
    defaultSizes: brand.icons.defaultSizes,
  })};`);
  w();
  w(`export const colors = ${JSON.stringify({
    static: t.colors.static,
    shared: t.colors.shared,
    light: t.colors.modes.light,
    dark: t.colors.modes.dark,
  })};`);
  w();
  w('export function modeColors(mode) { return colors[mode]; }');
  w();
  if (t.shadows) {
    w(`export const shadows = ${JSON.stringify(t.shadows)};`);
    w('export function shadowCss(name) {');
    w('  const s = shadows[name];');
    w('  return `${s.x}px ${s.y}px ${s.blur}px rgba(0, 0, 0, ${s.opacity})`;');
    w('}');
    w();
  }
  if (t.motion) {
    w(`export const motion = ${JSON.stringify(t.motion)};`);
    w('export function easingCss(name) {');
    w('  return `cubic-bezier(${motion.easing[name].join(", ")})`;');
    w('}');
    w();
  }
  if (t.container) {
    w(`export const container = ${JSON.stringify(t.container)};`);
    w();
  }
  if (t.breakpoints) {
    w(`export const breakpoints = ${JSON.stringify(t.breakpoints)};`);
    w();
  }
  if (t.focus) {
    w(`export const focus = ${JSON.stringify(t.focus)};`);
    w();
  }
  if (t.zIndex) {
    w(`export const zIndex = ${JSON.stringify(t.zIndex)};`);
    w();
  }
  if (t.opacity) {
    w(`export const opacity = ${JSON.stringify(t.opacity)};`);
    w();
  }
  return lines.join('\n');
}

// ============================================================
// TYPESCRIPT DECLARATIONS (.d.ts)
// ============================================================

function generateDTS(tokens) {
  const { meta, brand, tokens: t } = tokens;
  const lines = [];
  const w = (line = '') => lines.push(line);

  w(`// IAMJARL Design Tokens v${meta.version} — generated, do not edit`);
  w();
  w(`export declare const meta: { readonly name: string; readonly version: string };`);
  w();
  w(`export declare const spacing: ${JSON.stringify(t.spacing)};`);
  w(`export declare const radius: ${JSON.stringify(t.radius)};`);
  w(`export declare const typography: ${JSON.stringify({
    family: brand.typography.family,
    weights: brand.typography.weights,
    sizes: brand.typography.sizes,
    lineHeights: brand.typography.lineHeights,
  })};`);
  w(`export declare const icons: ${JSON.stringify({
    library: brand.icons.library,
    defaultWeight: brand.icons.defaultWeight,
    weightsAllowed: brand.icons.weightsAllowed,
    defaultSizes: brand.icons.defaultSizes,
  })};`);
  w(`export declare const colors: ${JSON.stringify({
    static: t.colors.static,
    shared: t.colors.shared,
    light: t.colors.modes.light,
    dark: t.colors.modes.dark,
  })};`);
  w();
  w('export type ColorMode = "light" | "dark";');
  w('export declare function modeColors(mode: ColorMode): typeof colors.light;');
  w();
  if (t.shadows) {
    w(`export declare const shadows: ${JSON.stringify(t.shadows)};`);
    w('export declare function shadowCss(name: keyof typeof shadows): string;');
  }
  if (t.motion) {
    w(`export declare const motion: ${JSON.stringify(t.motion)};`);
    w('export declare function easingCss(name: keyof typeof motion.easing): string;');
  }
  if (t.container) {
    w(`export declare const container: ${JSON.stringify(t.container)};`);
  }
  if (t.breakpoints) {
    w(`export declare const breakpoints: ${JSON.stringify(t.breakpoints)};`);
  }
  if (t.focus) {
    w(`export declare const focus: ${JSON.stringify(t.focus)};`);
  }
  if (t.zIndex) {
    w(`export declare const zIndex: ${JSON.stringify(t.zIndex)};`);
  }
  if (t.opacity) {
    w(`export declare const opacity: ${JSON.stringify(t.opacity)};`);
  }
  w();
  // Type aliases
  w('export type Spacing = typeof spacing;');
  w('export type SpacingKey = keyof Spacing;');
  w('export type Radius = typeof radius;');
  w('export type RadiusKey = keyof Radius;');
  w('export type Typography = typeof typography;');
  w('export type FontSize = keyof Typography["sizes"];');
  w('export type FontWeight = keyof Typography["weights"];');
  w('export type LineHeight = keyof Typography["lineHeights"];');
  w('export type ThemeColors = typeof colors.light;');
  w('export type StaticColors = typeof colors.static;');
  w('export type SharedColors = typeof colors.shared;');
  if (t.shadows) {
    w('export type Shadows = typeof shadows;');
    w('export type ShadowKey = keyof Shadows;');
  }
  if (t.motion) {
    w('export type Motion = typeof motion;');
    w('export type DurationKey = keyof Motion["duration"];');
    w('export type EasingKey = keyof Motion["easing"];');
  }
  if (t.container) {
    w('export type Container = typeof container;');
  }
  if (t.breakpoints) {
    w('export type Breakpoints = typeof breakpoints;');
    w('export type BreakpointKey = keyof Breakpoints;');
  }
  if (t.focus) {
    w('export type Focus = typeof focus;');
  }
  if (t.zIndex) {
    w('export type ZIndex = typeof zIndex;');
    w('export type ZIndexKey = keyof ZIndex;');
  }
  if (t.opacity) {
    w('export type Opacity = typeof opacity;');
    w('export type OpacityKey = keyof Opacity;');
  }
  w();
  return lines.join('\n');
}

// ============================================================
// COMPONENTS
// ============================================================

// The component ships as ONE self-contained ESM file with the registry baked
// in: a single script tag, no module resolution on the CDN, and no runtime
// fetch of apps.json that could fail or hit CORS. Sources stay separate files
// so the pure logic can be tested without a DOM.
function generateComponent(tokens) {
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps.json'), 'utf-8'));
  const src = name => fs.readFileSync(path.join(ROOT, 'components', name), 'utf-8');

  // Inline the modules: drop their local imports, keep everything else.
  const inline = code =>
    code
      .split('\n')
      .filter(line => !/^import .* from '\.\/.*';$/.test(line))
      .join('\n')
      .replace(/^export (const|function|class) /gm, '$1 ');

// The footer reads seven fields and nothing else — it never touches
// `categories`, `platform` or `consumes`. Inlining the whole registry shipped
// those to every visitor and, worse, tied this file's SRI hash to them: picking
// a family accent would change the hash of a component that cannot use one, and
// every site pinning `integrity` would break over a colour. Project it down.
const FOOTER_FIELDS = ['id', 'name', 'url', 'category', 'status', 'listed', 'always'];

function footerRegistry(registry) {
  return {
    apps: registry.apps.map(app =>
      Object.fromEntries(
        FOOTER_FIELDS.filter(k => app[k] !== undefined).map(k => [k, app[k]])
      )
    ),
  };
}

  return [
    `// IAMJARL <ij-footer> v${tokens.meta.version} — generated, do not edit`,
    `// Sources: components/select-links.js, components/ij-footer.js, apps.json`,
    '',
    `const REGISTRY = ${JSON.stringify(footerRegistry(registry), null, 2)};`,
    '',
    inline(src('select-links.js')).trim(),
    '',
    inline(src('ij-footer.js')).trim(),
    '',
  ].join('\n');
}


// One pre-rendered cross-link fragment per shipped app, for sites that can
// inline HTML at build time. The component builds these at runtime, which means
// GPTBot, ClaudeBot, CCBot and PerplexityBot never see them — they do not run
// JS. A fragment in the served HTML does reach them.
//
// Generated from the same selectLinks() and apps.json the component uses, so
// there is still one registry and one selection rule. The trade is freshness:
// a fragment is a snapshot, and a site that does not rebuild keeps the links it
// last built with.
async function generateFooterFragments(tokens) {
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps.json'), 'utf-8'));
  const { selectLinks } = await import(
    pathToFileURL(path.join(ROOT, 'components', 'select-links.js')).href
  );

  const esc = str => String(str).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const out = [];
  for (const app of registry.apps.filter(a => a.status === 'shipped')) {
    const { links } = selectLinks(registry, app.id);
    const body = links
      .map(l => `<a slot="cross-links" href="${esc(l.url)}">${esc(l.name)}</a>`)
      .join('\n');
    out.push([
      app.id,
      [
        `<!-- IAMJARL cross-links for ${esc(app.name)} — generated, do not edit -->`,
        `<!-- design system v${tokens.meta.version}, registry updated ${esc(registry.meta.updated)} -->`,
        `<!-- Paste inside <ij-footer app="${esc(app.id)}">. Rebuild to refresh. -->`,
        body,
        '',
      ].join('\n'),
    ]);
  }
  return out;
}


// ============================================================
// SUBRESOURCE INTEGRITY
// ============================================================

// Sites load these three from a pinned CDN URL. A hash makes that pin
// tamper-evident, and jsDelivr serves /gh/ paths byte-for-byte, so a hash
// computed here is valid for the URL. Generated rather than hand-kept, because
// it changes every release and a stale integrity attribute fails closed.
const SRI_FILES = [
  'dist/css/tokens.css',
  'dist/css/tokens.shadow.css',
  'dist/components/ij-footer.js',
];

function computeSri() {
  const out = {};
  for (const rel of SRI_FILES) {
    const buf = fs.readFileSync(path.join(ROOT, rel));
    out[rel] = 'sha384-' + crypto.createHash('sha384').update(buf).digest('base64');
  }
  return out;
}

// Paste-ready tags, kept in the README between markers so the version and the
// hash can never disagree. A contract test asserts this block is current.
function sriReadmeBlock(version, hashes) {
  const cdn = p => `https://cdn.jsdelivr.net/gh/jarllyng/iamjarl-design@v${version}/${p}`;
  return [
    '```html',
    '<link rel="stylesheet"',
    `  href="${cdn('dist/css/tokens.css')}"`,
    `  integrity="${hashes['dist/css/tokens.css']}"`,
    '  crossorigin="anonymous">',
    '',
    '<script type="module"',
    `  src="${cdn('dist/components/ij-footer.js')}"`,
    `  integrity="${hashes['dist/components/ij-footer.js']}"`,
    '  crossorigin="anonymous"></script>',
    '```',
  ].join('\n');
}

function writeSriReadme(version, hashes) {
  const readmePath = path.join(ROOT, 'README.md');
  const md = fs.readFileSync(readmePath, 'utf-8');
  const begin = '<!-- SRI:BEGIN -->';
  const end = '<!-- SRI:END -->';
  const a = md.indexOf(begin);
  const b = md.indexOf(end);
  if (a === -1 || b === -1) {
    throw new Error('README.md is missing the SRI:BEGIN / SRI:END markers');
  }
  const next =
    md.slice(0, a + begin.length) +
    '\n' + sriReadmeBlock(version, hashes) + '\n' +
    md.slice(b);
  if (next !== md) {
    fs.writeFileSync(readmePath, next, 'utf-8');
    console.log('  \u2713 README.md (SRI block)');
  }
}

// A site's identity is per-app, so it cannot live in tokens.css — that file is
// one stylesheet shared by every site. It ships the way footer cross-links do:
// a small per-app artifact the site links or inlines.
//
// Only apps that actually declare something get a file, so the output stays
// empty until a family opts in rather than restating the defaults once per app.
async function generateIdentitySheets(tokens) {
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps.json'), 'utf-8'));
  const { accentFor, displayFor } = await import(
    pathToFileURL(path.join(ROOT, 'components', 'identity.js')).href
  );

  const rgb = hex => { const { r, g, b } = parseHex(hex); return `${r}, ${g}, ${b}`; };
  const out = [];

  for (const app of registry.apps.filter(a => a.status === 'shipped')) {
    const accent = accentFor(registry, app.id, tokens.tokens);
    const display = displayFor(registry, app.id, tokens);
    if (!accent.isFamilyAccent && !display.face) continue;

    const vars = (mode, indent) => {
      const lines = [];
      if (accent.isFamilyAccent) {
        lines.push(`${indent}--ij-color-accent-family: ${accent[mode]};`);
        lines.push(`${indent}--ij-color-accent-family-rgb: ${rgb(accent[mode])};`);
      }
      // The display face does not change with mode, so it is emitted once, in
      // the :root block only.
      if (display.face && mode === 'light') {
        lines.push(`${indent}--ij-font-display: ${display.face.stack};`);
      }
      return lines.join('\n');
    };

    const body = [
      `/* IAMJARL identity for ${app.name} — generated, do not edit */`,
      `/* design system v${tokens.meta.version}, family: ${app.category ?? '—'} */`,
      display.face
        ? `/* Display face: ${display.face.name} (${display.face.licence}). Self-host it — see design.md. */`
        : null,
      accent.isFamilyAccent
        ? `/* Primary is unchanged and still the brand thread; the accent is what this site may lean on. */`
        : null,
      '',
      ':root {',
      vars('light', '  '),
      '}',
    ];

    if (accent.isFamilyAccent) {
      body.push(
        '',
        '@media (prefers-color-scheme: dark) {',
        '  :root:not(.light) {',
        vars('dark', '    '),
        '  }',
        '}',
        '',
        `.light { --ij-color-accent-family: ${accent.light}; --ij-color-accent-family-rgb: ${rgb(accent.light)}; }`,
        `.dark { --ij-color-accent-family: ${accent.dark}; --ij-color-accent-family-rgb: ${rgb(accent.dark)}; }`
      );
    }
    body.push('');
    out.push([app.id, body.filter(l => l !== null).join('\n')]);
  }
  return out;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const tokens = readTokens();
  console.log(`Building IAMJARL Design Tokens v${tokens.meta.version}...\n`);

  // Swift
  writeFile(path.join(ROOT, 'Sources', 'IAMJARLDesignTokens', 'DesignTokens.swift'), generateSwift(tokens));

  // CSS (default scope :root for normal pages)
  writeFile(path.join(ROOT, 'dist', 'css', 'tokens.css'), generateCSS(tokens, ':root'));

  // CSS (Shadow DOM variant for content scripts)
  writeFile(path.join(ROOT, 'dist', 'css', 'tokens.shadow.css'), generateCSS(tokens, ':host'));

  // TypeScript source (for inspection/import in TS-aware bundlers)
  writeFile(path.join(ROOT, 'dist', 'ts', 'tokens.ts'), generateTS(tokens));

  // JavaScript ESM (the actual runtime entry for npm consumers)
  writeFile(path.join(ROOT, 'dist', 'ts', 'tokens.js'), generateJS(tokens));

  // TypeScript declarations
  writeFile(path.join(ROOT, 'dist', 'ts', 'tokens.d.ts'), generateDTS(tokens));

  // Web component (single self-contained file, registry inlined)
  writeFile(path.join(ROOT, 'dist', 'components', 'ij-footer.js'), generateComponent(tokens));

  // Build-time cross-link fragments, one per shipped app
  const fragments = await generateFooterFragments(tokens);
  for (const [id, html] of fragments) {
    writeFile(path.join(ROOT, 'dist', 'footers', `${id}.html`), html);
  }

  // Integrity hashes, computed AFTER the files they cover are written
  const hashes = computeSri();
  writeFile(
    path.join(ROOT, 'dist', 'sri.json'),
    JSON.stringify({ version: tokens.meta.version, algorithm: 'sha384', files: hashes }, null, 2) + '\n'
  );
  writeSriReadme(tokens.meta.version, hashes);

  // Per-app identity: family accent and display face (empty until one is declared)
  const identity = await generateIdentitySheets(tokens);
  for (const [id, css] of identity) {
    writeFile(path.join(ROOT, 'dist', 'identity', `${id}.css`), css);
  }

  console.log(
    `\nDone! Generated 8 platform files, ${fragments.length} footer fragments` +
    `, ${identity.length} identity sheet(s).`
  );
}

await main();
