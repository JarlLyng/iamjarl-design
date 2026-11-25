// Color parsing + WCAG 2.1 contrast math.
// Shared by validate.js (token validation) and test.js (unit tests).
// No dependencies — pure functions.

export function parseHex(hex) {
  const h = hex.replace(/^#/, '');
  if (h.length !== 6 && h.length !== 8) return null;
  const int = parseInt(h, 16);
  if (isNaN(int)) return null;
  if (h.length === 6) {
    return { r: (int >> 16) & 0xFF, g: (int >> 8) & 0xFF, b: int & 0xFF, a: 1 };
  }
  return { r: (int >> 16) & 0xFF, g: (int >> 8) & 0xFF, b: int & 0xFF, a: ((int >> 24) & 0xFF) / 255 };
}

export function parseRgba(str) {
  const m = str.match(/^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/);
  if (!m) return null;
  const r = Number(m[1]), g = Number(m[2]), b = Number(m[3]), a = Number(m[4]);
  // Strict bounds: r/g/b must be 0-255, alpha 0-1
  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) return null;
  if (a < 0 || a > 1) return null;
  return { r, g, b, a };
}

export function parseColor(value) {
  if (typeof value !== 'string') return null;
  if (value.startsWith('#')) return parseHex(value);
  if (value.startsWith('rgba(')) return parseRgba(value);
  return null;
}

export function srgbToLinear(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function relativeLuminance({ r, g, b }) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

export function contrastRatio(c1, c2) {
  const l1 = relativeLuminance(c1);
  const l2 = relativeLuminance(c2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// OKLab (Björn Ottosson, 2020): a space where a distance reads about the same to
// the eye in every hue, unlike sRGB's. Used to hold colours that must be told
// apart, such as the categorical fills (#112), at a distance from each other.
export function oklab({ r, g, b }) {
  const [R, G, B] = [r, g, b].map(srgbToLinear);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return {
    L: 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  };
}

// The distance between two colours in OKLab. 0.02 is about the least a person
// notices side by side; colours meant to be told apart at a glance want 0.1 or more.
export function deltaEOK(c1, c2) {
  const p = oklab(c1), q = oklab(c2);
  return Math.hypot(p.L - q.L, p.a - q.a, p.b - q.b);
}
