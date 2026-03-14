#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const TOKENS_PATH = path.join(__dirname, '..', 'tokens.json');

let errors = 0;

function fail(msg) {
  console.error(`  ✗ ${msg}`);
  errors++;
}

function pass(msg) {
  console.log(`  ✓ ${msg}`);
}

// --- Color parsing ---

function parseHex(hex) {
  const h = hex.replace(/^#/, '');
  if (h.length !== 6 && h.length !== 8) return null;
  const int = parseInt(h, 16);
  if (isNaN(int)) return null;
  if (h.length === 6) {
    return { r: (int >> 16) & 0xFF, g: (int >> 8) & 0xFF, b: int & 0xFF, a: 1 };
  }
  return { r: (int >> 16) & 0xFF, g: (int >> 8) & 0xFF, b: int & 0xFF, a: ((int >> 24) & 0xFF) / 255 };
}

function parseRgba(str) {
  const m = str.match(/^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/);
  if (!m) return null;
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: Number(m[4]) };
}

function parseColor(value) {
  if (typeof value !== 'string') return null;
  if (value.startsWith('#')) return parseHex(value);
  if (value.startsWith('rgba(')) return parseRgba(value);
  return null;
}

// --- WCAG contrast ---

function srgbToLinear(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance({ r, g, b }) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(c1, c2) {
  const l1 = relativeLuminance(c1);
  const l2 = relativeLuminance(c2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// --- Validation ---

function validateStructure(tokens) {
  console.log('\nSchema validation:');

  // Meta
  if (!tokens.meta || !tokens.meta.version) {
    fail('meta.version is missing');
  } else if (!/^\d+\.\d+\.\d+$/.test(tokens.meta.version)) {
    fail(`meta.version "${tokens.meta.version}" is not valid semver`);
  } else {
    pass(`meta.version: ${tokens.meta.version}`);
  }

  if (!tokens.meta.updated) {
    fail('meta.updated is missing');
  } else {
    pass(`meta.updated: ${tokens.meta.updated}`);
  }

  // Tokens
  if (!tokens.tokens) {
    fail('tokens section is missing');
    return;
  }

  // Spacing - all positive numbers
  if (tokens.tokens.spacing) {
    const invalid = Object.entries(tokens.tokens.spacing).filter(([, v]) => typeof v !== 'number' || v <= 0);
    if (invalid.length) fail(`Invalid spacing values: ${invalid.map(([k]) => k).join(', ')}`);
    else pass(`spacing: ${Object.keys(tokens.tokens.spacing).length} values`);
  } else {
    fail('tokens.spacing is missing');
  }

  // Radius
  if (tokens.tokens.radius) {
    const invalid = Object.entries(tokens.tokens.radius).filter(([, v]) => typeof v !== 'number' || v < 0);
    if (invalid.length) fail(`Invalid radius values: ${invalid.map(([k]) => k).join(', ')}`);
    else pass(`radius: ${Object.keys(tokens.tokens.radius).length} values`);
  } else {
    fail('tokens.radius is missing');
  }

  // Colors structure
  const colors = tokens.tokens.colors;
  if (!colors) {
    fail('tokens.colors is missing');
    return;
  }

  if (!colors.modes || !colors.modes.light || !colors.modes.dark) {
    fail('tokens.colors.modes.light and/or .dark is missing');
    return;
  }

  // Verify light and dark have same keys
  const lightKeys = getDeepKeys(colors.modes.light).sort();
  const darkKeys = getDeepKeys(colors.modes.dark).sort();

  if (JSON.stringify(lightKeys) === JSON.stringify(darkKeys)) {
    pass(`light/dark modes have matching keys (${lightKeys.length} each)`);
  } else {
    const onlyLight = lightKeys.filter(k => !darkKeys.includes(k));
    const onlyDark = darkKeys.filter(k => !lightKeys.includes(k));
    if (onlyLight.length) fail(`Keys only in light: ${onlyLight.join(', ')}`);
    if (onlyDark.length) fail(`Keys only in dark: ${onlyDark.join(', ')}`);
  }

  // Validate all color values
  const allColors = getAllColorValues(colors);
  let invalidColors = 0;
  for (const { path: p, value } of allColors) {
    if (!parseColor(value)) {
      fail(`Invalid color at ${p}: "${value}"`);
      invalidColors++;
    }
  }
  if (invalidColors === 0) {
    pass(`All ${allColors.length} color values are valid hex or rgba`);
  }
}

function validateContrast(tokens) {
  console.log('\nContrast checks (WCAG 2.1 AA ≥ 4.5:1):');

  const pairs = [];

  // Shared state colors
  const shared = tokens.tokens.colors.shared;
  pairs.push({ fg: 'onSuccess', bg: 'success', fgVal: shared.onSuccess, bgVal: shared.success });
  pairs.push({ fg: 'onWarning', bg: 'warning', fgVal: shared.onWarning, bgVal: shared.warning });
  pairs.push({ fg: 'onError', bg: 'error', fgVal: shared.onError, bgVal: shared.error });

  // Mode-specific
  for (const mode of ['light', 'dark']) {
    const m = tokens.tokens.colors.modes[mode];
    pairs.push({ fg: `${mode}.onPrimary`, bg: `${mode}.primary`, fgVal: m.onPrimary, bgVal: m.primary });
  }

  for (const { fg, bg, fgVal, bgVal } of pairs) {
    const c1 = parseColor(fgVal);
    const c2 = parseColor(bgVal);
    if (!c1 || !c2) {
      fail(`Cannot parse colors for ${fg} on ${bg}`);
      continue;
    }
    const ratio = contrastRatio(c1, c2);
    const ratioStr = ratio.toFixed(2);
    if (ratio >= 4.5) {
      pass(`${fg} on ${bg}: ${ratioStr}:1`);
    } else if (ratio >= 3.0) {
      console.log(`  ⚠ ${fg} on ${bg}: ${ratioStr}:1 (passes for large text only)`);
    } else {
      console.log(`  ⚠ ${fg} on ${bg}: ${ratioStr}:1 (below AA — consider adjusting)`);
    }
  }
}

// --- Helpers ---

function getDeepKeys(obj, prefix = '') {
  let keys = [];
  for (const [key, val] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'object' && val !== null) {
      keys = keys.concat(getDeepKeys(val, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

function getAllColorValues(obj, prefix = 'colors') {
  let results = [];
  for (const [key, val] of Object.entries(obj)) {
    const path = `${prefix}.${key}`;
    if (typeof val === 'object' && val !== null) {
      results = results.concat(getAllColorValues(val, path));
    } else if (typeof val === 'string') {
      results.push({ path, value: val });
    }
  }
  return results;
}

// --- Main ---

function main() {
  console.log('Validating tokens.json...');

  let tokens;
  try {
    const raw = fs.readFileSync(TOKENS_PATH, 'utf-8');
    tokens = JSON.parse(raw);
    pass('Valid JSON');
  } catch (e) {
    fail(`Invalid JSON: ${e.message}`);
    process.exit(1);
  }

  validateStructure(tokens);
  validateContrast(tokens);

  console.log();
  if (errors > 0) {
    console.error(`❌ ${errors} error(s) found.`);
    process.exit(1);
  } else {
    console.log('✅ All checks passed.');
  }
}

main();
