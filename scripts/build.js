#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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
    w(`      public static let primary = ${swiftColorInit(m.primary)}`);
    w(`      public static let onPrimary = ${swiftColorInit(m.onPrimary)}`);
    w();

    // Nested groups: text, background, surface, border
    const groups = [
      { key: 'text', label: 'Text' },
      { key: 'background', label: 'Background' },
      { key: 'surface', label: 'Surface' },
      { key: 'border', label: 'Border' },
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

  w('    public static func primary(_ scheme: ColorScheme) -> Color {');
  w('      DesignTokens.color(light: ColorToken.Light.primary, dark: ColorToken.Dark.primary, scheme: scheme)');
  w('    }');
  w();

  // Common.Text
  w('    public enum Text {');
  for (const prop of ['primary', 'secondary', 'tertiary', 'inverse']) {
    w(`      public static func ${prop}(_ scheme: ColorScheme) -> Color {`);
    w(`        DesignTokens.color(light: ColorToken.Light.Text.${prop}, dark: ColorToken.Dark.Text.${prop}, scheme: scheme)`);
    w('      }');
  }
  w('    }');
  w();

  // Common.Background
  w('    public enum Background {');
  for (const prop of ['app', 'muted', 'card']) {
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

function generateCSS(tokens) {
  const { meta, brand, tokens: t } = tokens;
  const lines = [];
  const w = (line = '') => lines.push(line);

  w(`/* IAMJARL Design Tokens v${meta.version} — generated, do not edit */`);
  w();
  w(':root {');

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

  // Focus
  if (t.focus) {
    w('  /* Focus ring */');
    for (const [key, val] of Object.entries(t.focus)) {
      w(`  --ij-focus-${camelToKebab(key)}: ${val}px;`);
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
  w('  /* Mode colors (light default) */');
  function flattenColors(obj, prefix) {
    for (const [key, val] of Object.entries(obj)) {
      if (typeof val === 'object') {
        flattenColors(val, `${prefix}-${camelToKebab(key)}`);
      } else {
        w(`  --ij-color-${prefix}-${camelToKebab(key)}: ${val};`);
      }
    }
  }
  // Top-level mode colors
  const light = t.colors.modes.light;
  w(`  --ij-color-primary: ${light.primary};`);
  w(`  --ij-color-on-primary: ${light.onPrimary};`);
  flattenColors(light.text, 'text');
  flattenColors(light.background, 'bg');
  flattenColors(light.surface, 'surface');
  flattenColors(light.border, 'border');

  w('}');
  w();

  // Dark mode
  w('@media (prefers-color-scheme: dark) {');
  w('  :root {');
  const dark = t.colors.modes.dark;
  w(`    --ij-color-primary: ${dark.primary};`);
  w(`    --ij-color-on-primary: ${dark.onPrimary};`);
  function flattenColorsDark(obj, prefix) {
    for (const [key, val] of Object.entries(obj)) {
      if (typeof val === 'object') {
        flattenColorsDark(val, `${prefix}-${camelToKebab(key)}`);
      } else {
        w(`    --ij-color-${prefix}-${camelToKebab(key)}: ${val};`);
      }
    }
  }
  flattenColorsDark(dark.text, 'text');
  flattenColorsDark(dark.background, 'bg');
  flattenColorsDark(dark.surface, 'surface');
  flattenColorsDark(dark.border, 'border');
  w('  }');
  w('}');
  w();

  // Explicit class overrides
  w('/* Explicit class overrides for manual mode switching */');
  w('.light {');
  w(`  --ij-color-primary: ${light.primary};`);
  w(`  --ij-color-on-primary: ${light.onPrimary};`);
  flattenColorsClass(lines, light, '  ');
  w('}');
  w();
  w('.dark {');
  w(`  --ij-color-primary: ${dark.primary};`);
  w(`  --ij-color-on-primary: ${dark.onPrimary};`);
  flattenColorsClass(lines, dark, '  ');
  w('}');
  w();

  return lines.join('\n');
}

function flattenColorsClass(lines, mode, indent) {
  function flatten(obj, prefix) {
    for (const [key, val] of Object.entries(obj)) {
      if (typeof val === 'object') {
        flatten(val, `${prefix}-${camelToKebab(key)}`);
      } else {
        lines.push(`${indent}--ij-color-${prefix}-${camelToKebab(key)}: ${val};`);
      }
    }
  }
  flatten(mode.text, 'text');
  flatten(mode.background, 'bg');
  flatten(mode.surface, 'surface');
  flatten(mode.border, 'border');
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
  if (t.breakpoints) {
    w('export type Breakpoints = typeof breakpoints;');
    w('export type BreakpointKey = keyof Breakpoints;');
  }
  if (t.focus) {
    w('export type Focus = typeof focus;');
  }
  w();

  return lines.join('\n');
}

// ============================================================
// MAIN
// ============================================================

function main() {
  const tokens = readTokens();
  console.log(`Building IAMJARL Design Tokens v${tokens.meta.version}...\n`);

  // Swift
  const swiftOut = path.join(ROOT, 'Sources', 'IAMJARLDesignTokens', 'DesignTokens.swift');
  writeFile(swiftOut, generateSwift(tokens));

  // CSS
  const cssOut = path.join(ROOT, 'dist', 'css', 'tokens.css');
  writeFile(cssOut, generateCSS(tokens));

  // TypeScript
  const tsOut = path.join(ROOT, 'dist', 'ts', 'tokens.ts');
  writeFile(tsOut, generateTS(tokens));

  console.log('\nDone! Generated 3 platform files.');
}

main();
