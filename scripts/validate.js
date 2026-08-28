#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseColor, contrastRatio } from './color.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOKENS_PATH = path.join(__dirname, '..', 'tokens.json');

let errors = 0;

function fail(msg) {
  console.error(`  ✗ ${msg}`);
  errors++;
}

function pass(msg) {
  console.log(`  ✓ ${msg}`);
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
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(tokens.meta.updated) || isNaN(Date.parse(tokens.meta.updated))) {
    fail(`meta.updated "${tokens.meta.updated}" is not a valid ISO date (YYYY-MM-DD)`);
  } else {
    pass(`meta.updated: ${tokens.meta.updated}`);
  }

  validateVersionCoherence(tokens.meta.version);

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

  // Shadows (optional)
  if (tokens.tokens.shadows) {
    let bad = 0;
    for (const [k, v] of Object.entries(tokens.tokens.shadows)) {
      const hasAll = ['x', 'y', 'blur', 'opacity'].every(f => typeof v[f] === 'number');
      if (!hasAll) { fail(`Shadow "${k}" missing x/y/blur/opacity numeric fields`); bad++; }
    }
    if (!bad) pass(`shadows: ${Object.keys(tokens.tokens.shadows).length} values`);
  }

  // Motion (optional)
  if (tokens.tokens.motion) {
    const m = tokens.tokens.motion;
    if (!m.duration || !m.easing) {
      fail('motion must have duration and easing');
    } else {
      const badDur = Object.entries(m.duration).filter(([, v]) => typeof v !== 'number' || v < 0);
      const badEase = Object.entries(m.easing).filter(([, v]) => !Array.isArray(v) || v.length !== 4);
      if (badDur.length) fail(`Invalid duration values: ${badDur.map(([k]) => k).join(', ')}`);
      if (badEase.length) fail(`Invalid easing values (must be [x1,y1,x2,y2]): ${badEase.map(([k]) => k).join(', ')}`);
      if (!badDur.length && !badEase.length) {
        pass(`motion: ${Object.keys(m.duration).length} durations, ${Object.keys(m.easing).length} easings`);
      }
    }
  }

  // Breakpoints (optional)
  if (tokens.tokens.breakpoints) {
    const invalid = Object.entries(tokens.tokens.breakpoints).filter(([, v]) => typeof v !== 'number' || v <= 0);
    if (invalid.length) fail(`Invalid breakpoint values: ${invalid.map(([k]) => k).join(', ')}`);
    else pass(`breakpoints: ${Object.keys(tokens.tokens.breakpoints).length} values`);
  }

  // Focus (optional)
  if (tokens.tokens.focus) {
    const invalid = Object.entries(tokens.tokens.focus).filter(([, v]) => typeof v !== 'number' || v < 0);
    if (invalid.length) fail(`Invalid focus values: ${invalid.map(([k]) => k).join(', ')}`);
    else pass(`focus: ${Object.keys(tokens.tokens.focus).length} values`);
  }

  // Z-index (optional) — non-negative numbers, strictly ascending by value
  if (tokens.tokens.zIndex) {
    const entries = Object.entries(tokens.tokens.zIndex);
    const invalid = entries.filter(([, v]) => typeof v !== 'number' || v < 0);
    if (invalid.length) {
      fail(`Invalid zIndex values: ${invalid.map(([k]) => k).join(', ')}`);
    } else {
      const vals = entries.map(([, v]) => v);
      const ascending = vals.every((v, i) => i === 0 || v > vals[i - 1]);
      if (!ascending) fail('zIndex values must be strictly ascending in declaration order');
      else pass(`zIndex: ${entries.length} layers`);
    }
  }

  // Opacity (optional) — numbers in [0, 1]
  if (tokens.tokens.opacity) {
    const invalid = Object.entries(tokens.tokens.opacity).filter(([, v]) => typeof v !== 'number' || v < 0 || v > 1);
    if (invalid.length) fail(`Invalid opacity values (must be 0–1): ${invalid.map(([k]) => k).join(', ')}`);
    else pass(`opacity: ${Object.keys(tokens.tokens.opacity).length} values`);
  }

  // Container widths (optional) — positive numbers, strictly ascending by value
  if (tokens.tokens.container) {
    const entries = Object.entries(tokens.tokens.container);
    const invalid = entries.filter(([, v]) => typeof v !== 'number' || v <= 0);
    if (invalid.length) {
      fail(`Invalid container values: ${invalid.map(([k]) => k).join(', ')}`);
    } else {
      const vals = entries.map(([, v]) => v);
      const ascending = vals.every((v, i) => i === 0 || v > vals[i - 1]);
      if (!ascending) fail('container values must be strictly ascending in declaration order');
      else pass(`container: ${entries.length} widths`);
    }
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

  // The CSS build derives --ij-color-primary-rgb from each mode's primary by
  // parsing it as hex. A non-hex primary is silently skipped there, so one mode
  // would ship the variable and the other would not. Require hex instead.
  for (const mode of ['light', 'dark']) {
    const primary = colors.modes[mode]?.primary;
    if (typeof primary !== 'string' || !/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(primary)) {
      fail(`${mode}.primary must be a 6- or 8-digit hex color (got "${primary}") — --ij-color-primary-rgb is derived from it`);
    } else {
      pass(`${mode}.primary is hex, so --ij-color-primary-rgb can be derived`);
    }
  }

  // Gradients (optional) — CSS value strings, and each must begin at a color the
  // system already names. That constraint is what keeps a gradient's second stop
  // an implementation detail rather than an unnamed color leaking into general
  // use. See COMPONENTS.md and design.md.
  const systemColors = new Set(
    [
      ...Object.values(colors.static ?? {}),
      ...Object.values(colors.shared ?? {}),
      colors.modes.light.primary,
      colors.modes.dark.primary,
    ].map(c => String(c).toUpperCase())
  );

  for (const mode of ['light', 'dark']) {
    const gradients = colors.modes[mode].gradients;
    if (!gradients) continue;
    let bad = 0;
    for (const [key, val] of Object.entries(gradients)) {
      if (typeof val !== 'string' || !/-gradient\(/.test(val)) {
        fail(`${mode}.gradients.${key} is not a CSS gradient value`);
        bad++;
        continue;
      }
      const first = (val.match(/#[0-9a-fA-F]{6}/) || [])[0];
      if (!first) {
        fail(`${mode}.gradients.${key} has no hex color stop`);
        bad++;
      } else if (!systemColors.has(first.toUpperCase())) {
        fail(
          `${mode}.gradients.${key} starts at ${first}, which is not a system color. ` +
            `A gradient must begin at a named token; later stops may be literals.`
        );
        bad++;
      }
    }
    if (!bad) pass(`${mode}.gradients: ${Object.keys(gradients).length}, each starting at a system color`);
  }

  // Validate all color values
  // Gradients are CSS value strings, not colors, and are checked above.
  const allColors = getAllColorValues(colors).filter(c => !c.path.includes('.gradients.'));
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

// Every place the version is written down must agree with tokens.json.
// v1.1.0 shipped as a tag with meta.version still at 1.0.0 and no changelog
// entry — these checks make that state impossible to commit.
function validateVersionCoherence(version) {
  const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf-8');

  try {
    const pkg = JSON.parse(read('package.json'));
    if (pkg.version !== version) {
      fail(`version mismatch: tokens.json=${version}, package.json=${pkg.version}`);
    } else {
      pass(`version sync: tokens.json and package.json both at ${version}`);
    }
  } catch (e) {
    fail(`Could not read package.json: ${e.message}`);
  }

  try {
    const changelog = read('CHANGELOG.md');
    if (!changelog.includes(`## [${version}]`)) {
      fail(`CHANGELOG.md has no "## [${version}]" entry — every release needs one`);
    } else if (!new RegExp(`^\\[${version.replace(/\./g, '\\.')}\\]:`, 'm').test(changelog)) {
      fail(`CHANGELOG.md is missing the "[${version}]: <release url>" link reference`);
    } else {
      pass(`CHANGELOG.md documents ${version}`);
    }
  } catch (e) {
    fail(`Could not read CHANGELOG.md: ${e.message}`);
  }

  try {
    const heading = read('design.md').split('\n', 1)[0];
    const found = heading.match(/\(v(\d+\.\d+\.\d+)\)/);
    if (!found) {
      fail('design.md heading is missing a "(vX.Y.Z)" version marker');
    } else if (found[1] !== version) {
      fail(`design.md heading says v${found[1]}, tokens.json says ${version}`);
    } else {
      pass(`design.md heading matches ${version}`);
    }
  } catch (e) {
    fail(`Could not read design.md: ${e.message}`);
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

    // State colors used as foreground/text must pass AA against the app background.
    // (The shared state colors are fills; these mode-aware variants are for text.)
    if (m.state) {
      for (const key of ['success', 'warning', 'error']) {
        pairs.push({
          fg: `${mode}.state.${key}`,
          bg: `${mode}.background.app`,
          fgVal: m.state[key],
          bgVal: m.background.app,
        });
      }
    }
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
    } else {
      fail(`${fg} on ${bg}: ${ratioStr}:1 — below WCAG AA (4.5:1). Semantic on-color pairs are non-negotiable.`);
    }
  }
}

// apps.json feeds <ij-footer>'s cross-links. A bad entry here ships a broken or
// missing link on every consuming site, so it is gated like the tokens are.
function validateApps() {
  console.log('\nApp registry (apps.json):');

  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'apps.json'), 'utf-8'));
  } catch (e) {
    fail(`Could not read apps.json: ${e.message}`);
    return;
  }

  const apps = registry.apps;
  if (!Array.isArray(apps) || apps.length === 0) {
    fail('apps.json has no apps array');
    return;
  }

  const categories = Object.keys(registry.categories ?? {});
  if (!categories.length) fail('apps.json has no categories');

  const ids = new Set();
  const problems = [];
  for (const a of apps) {
    if (!a.id || !/^[a-z0-9-]+$/.test(a.id)) problems.push(`bad id "${a.id}"`);
    else if (ids.has(a.id)) problems.push(`duplicate id "${a.id}"`);
    else ids.add(a.id);

    if (!a.name) problems.push(`${a.id}: missing name`);
    if (!/^https:\/\/[^\s"']+$/.test(a.url ?? '')) problems.push(`${a.id}: url must be https`);
    if (!['shipped', 'side-project'].includes(a.status)) problems.push(`${a.id}: unknown status "${a.status}"`);

    // An app is either in a known category or marked always — never neither,
    // or it can never be selected and silently disappears from every footer.
    if (a.always === true) {
      if (a.category) problems.push(`${a.id}: always-links must not also have a category`);
    } else if (!categories.includes(a.category)) {
      problems.push(`${a.id}: category "${a.category}" is not declared in categories`);
    }
  }

  if (problems.length) {
    for (const p of problems) fail(p);
  } else {
    pass(`${apps.length} apps, ${categories.length} categories, ids unique`);
  }

  const always = apps.filter(a => a.always === true);
  if (!always.length) fail('no always-links — every footer would lack a portfolio link');
  else pass(`${always.length} always-links: ${always.map(a => a.name).join(', ')}`);

  const consumers = apps.filter(a => a.consumes === true);
  if (!consumers.length) fail('no app has consumes:true — nothing renders the component');
  else pass(`${consumers.length} component consumer(s): ${consumers.map(a => a.name).join(', ')}`);
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
  validateApps();

  console.log();
  if (errors > 0) {
    console.error(`❌ ${errors} error(s) found.`);
    process.exit(1);
  } else {
    console.log('✅ All checks passed.');
  }
}

main();
