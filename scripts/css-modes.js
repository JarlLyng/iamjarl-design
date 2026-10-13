// The CSS a mode's colours and a site's identity are written as (#65), shared
// by build.js and the tests, so a sheet the registry has no app for yet, such
// as one held in the dark, can be generated and checked in a browser too.
//
// Pure: no file system, no registry lookups.

import { parseHex, parseColor, contrastRatio } from './color.js';

export function camelToKebab(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

// Which single foreground, if any, clears WCAG AA across every stop of a
// gradient. Decorative ramps legitimately span extremes, so this is a note
// rather than an error — but it travels with the value so a consumer reads it
// where they use it rather than discovering it in an audit.
export function gradientTextNote(value) {
  const stops = (String(value).match(/#[0-9a-fA-F]{6}/g) || []).map(parseColor).filter(Boolean);
  if (!stops.length) return 'decorative';
  const safe = [['black', parseColor('#000000')], ['white', parseColor('#FFFFFF')]]
    .filter(([, fg]) => stops.every(s => contrastRatio(fg, s) >= 4.5))
    .map(([n]) => n);
  return safe.length ? `text-safe: ${safe.join(' or ')}` : 'decorative only, no text colour clears AA';
}

// Emit CSS custom properties for a single color mode. Scalar props become
// --ij-color-<key>; nested groups are flattened (background → "bg").
export function modeColorLines(mode, indent) {
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

// One app's identity sheet, from its resolved identity (identityFor).
export function identitySheetCss(app, id, tokens) {
  const rgb = hex => { const { r, g, b } = parseHex(hex); return `${r}, ${g}, ${b}`; };

  // One mode's variables: only what the app declared, plus what follows from
  // it. A new ground re-derives the secondary text; an accent brings its
  // on-colour and its text-safe variant. --ij-color-accent-family is the name
  // sites on 1.12 to 1.21 read, kept as the text-safe accent.
  const vars = (mode, indent, { face = false } = {}) => {
    const m = id.modes[mode];
    const d = m.declared;
    const lines = [];
    const v = (name, value) => lines.push(`${indent}--ij-${name}: ${value};`);
    if (d.background) v('color-bg-app', m.background);
    if (d.surface) { v('color-bg-card', m.surface); v('color-surface-default', m.surface); }
    if (d.text) v('color-text-primary', m.text);
    if (m.textSecondary) { v('color-text-secondary', m.textSecondary); v('color-text-tertiary', m.textTertiary); }
    if (d.accent || d.accentText) {
      v('color-accent', m.accent);
      v('color-accent-rgb', rgb(m.accent));
      v('color-on-accent', m.onAccent);
      v('color-accent-text', m.accentText);
      v('color-accent-family', m.accentText);
      v('color-accent-family-rgb', rgb(m.accentText));
    }
    // The face does not change with mode, so it goes in the :root block only.
    if (face && id.display) v('font-display', id.display.face.stack);
    // A face whose character lives on an axis (Fraunces' SOFT) carries it
    // here, so a site gets the face it was shown, not the axis's default.
    if (face && id.display?.face.axes) v('font-display-axes', id.display.face.axes);
    // The numbers' own face (#91), with its own axes so the display face's
    // (Fraunces' SOFT) never reaches a mono numeral.
    if (face && id.numerals) {
      v('font-numeral', id.numerals.face.stack);
      v('font-numeral-axes', id.numerals.face.axes ?? 'normal');
    }
    // Bordered panels (#83) don't change with mode either: the border colour
    // they name is the mode's own.
    if (face && id.panels === 'bordered') v('panel-border', '1px solid var(--ij-color-border-default)');
    return lines;
  };

  const body = [
    `/* IAMJARL identity for ${app.name}: generated, do not edit */`,
    `/* design system v${tokens.meta.version}. ${id.scheme ? `${id.scheme === 'light' ? 'Light' : 'Dark'} only: this sheet holds the site in that mode whatever the visitor's setting.` : 'Follows the visitor\'s light or dark setting.'} */`,
    id.display
      ? `/* Display face: ${id.display.face.name} (${id.display.face.licence}). Self-host it; see design.md. */`
      : null,
    id.numerals
      ? `/* Numeral face: ${id.numerals.face.name} (${id.numerals.face.licence}), for .ij-numeral. Load it too. */`
      : null,
    '',
    ':root {',
    id.scheme ? `  color-scheme: ${id.scheme};` : null,
    ...vars(id.scheme ?? 'light', '  ', { face: true }),
    '}',
  ];

  if (id.scheme) {
    // One mode only. tokens.css switches every colour in the other mode, so
    // the sheet puts back the whole set for its own mode, then its identity.
    const other = id.scheme === 'light' ? 'dark' : 'light';
    body.push(
      '',
      `@media (prefers-color-scheme: ${other}) {`,
      '  :root {',
      ...modeColorLines(tokens.tokens.colors.modes[id.scheme], '    '),
      ...vars(id.scheme, '    '),
      '  }',
      '}',
      '',
      `.${other} {`,
      ...modeColorLines(tokens.tokens.colors.modes[id.scheme], '  '),
      ...vars(id.scheme, '  '),
      '}',
    );
  } else if (id.hasColour) {
    body.push(
      '',
      '@media (prefers-color-scheme: dark) {',
      '  :root:not(.light) {',
      ...vars('dark', '    '),
      '  }',
      '}',
      '',
      '.light {',
      ...vars('light', '  '),
      '}',
      '',
      '.dark {',
      ...vars('dark', '  '),
      '}',
    );
  }
  body.push('');
  return body.filter(l => l !== null).join('\n');
}
