// A site's identity, resolved from the registry: its ground, its text, its
// accent and the display face it speaks in (#65).
//
// Until 1.22.0 a site took its accent and face from its family, so the four
// fitness sites shared one lime and one face, and twelve of thirteen sites read
// as one near-black template. Now each app declares its own in apps.json, under
// "identity", and the family layer is gone. The values the families had were
// copied onto their apps, so a site that changes nothing renders as before.
//
//   "identity": {
//     "scheme": "light",            one mode only; absent means it follows the visitor
//     "display": "humanist",        a face from tokens.json's approved set
//     "numerals": "mono",           a second face for .ij-numeral, when the
//                                   numbers want a face of their own (#91)
//     "panels": "bordered",         cards drawn with a thin border, as in a
//                                   hardware manual; absent means flat (#83)
//     "light": { "background", "surface", "text", "accent", "accentText" },
//     "dark":  { … }                every field optional
//   }
//
// accent is the colour a site leans on: strokes, fills, the drawing's one line.
// It may be too light to read as text (Walkful's magenta is), so accentText is
// the text-safe variant for links and small highlights, and defaults to accent.
//
// Pure: no DOM, no fetch. The same function feeds the generated CSS, the
// validator and the tests.

import { parseColor, contrastRatio } from '../scripts/color.js';

export const MODES = ['light', 'dark'];
export const COLOR_FIELDS = ['background', 'surface', 'text', 'accent', 'accentText'];

// Secondary and tertiary text, mixed from the site's text toward its ground, so
// they keep the text's warmth or coolness instead of the tokens' neutral grey.
// The validator holds both to AA on every ground they can land on.
export const TEXT_MIX = { secondary: 0.80, tertiary: 0.70 };

// How a site draws its cards. Flat is the kit's default: a card is its colour.
export const PANELS = ['flat', 'bordered'];

const hex = ({ r, g, b }) => '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();

export function mix(a, b, t) {
  const A = parseColor(a), B = parseColor(b);
  return hex({ r: A.r * t + B.r * (1 - t), g: A.g * t + B.g * (1 - t), b: A.b * t + B.b * (1 - t) });
}

// Black or white, whichever reads better on a fill. The validator requires the
// better of the two to clear AA, so an accent can always be a button.
export function onColor(fill) {
  const c = parseColor(fill);
  return contrastRatio(parseColor('#000000'), c) >= contrastRatio(parseColor('#FFFFFF'), c) ? '#000000' : '#FFFFFF';
}

export function identityFor(registry, appId, tokens) {
  const app = registry.apps.find(a => a.id === appId);
  if (!app) throw new Error(`Unknown app "${appId}"`);
  const id = app.identity ?? null;

  let display = null;
  if (id?.display) {
    const face = tokens.brand?.typography?.display?.[id.display];
    if (!face) throw new Error(`Unknown display face "${id.display}" for "${appId}"`);
    display = { key: id.display, face };
  }
  // The numbers' face, if they have their own: Anvil's headlines are Outfit
  // and its weights and reps JetBrains Mono (#91).
  let numerals = null;
  if (id?.numerals) {
    const face = tokens.brand?.typography?.display?.[id.numerals];
    if (!face) throw new Error(`Unknown numeral face "${id.numerals}" for "${appId}"`);
    numerals = { key: id.numerals, face };
  }

  const scheme = id?.scheme ?? null;
  const modes = {};
  for (const mode of scheme ? [scheme] : MODES) {
    const own = id?.[mode] ?? {};
    const base = tokens.tokens.colors.modes[mode];
    const background = own.background ?? base.background.app;
    const text = own.text ?? base.text.primary;
    const accent = own.accent ?? base.primary;
    const accentText = own.accentText ?? accent;
    // Only what the app declared is emitted; the rest stays the tokens' own.
    const declared = Object.fromEntries(COLOR_FIELDS.filter(f => own[f]).map(f => [f, own[f]]));
    const reground = Boolean(own.background || own.text);
    modes[mode] = {
      declared,
      background, surface: own.surface ?? null, text, accent, accentText,
      onAccent: onColor(accent),
      textSecondary: reground ? mix(text, background, TEXT_MIX.secondary) : null,
      textTertiary: reground ? mix(text, background, TEXT_MIX.tertiary) : null,
    };
  }

  const hasColour = Object.values(modes).some(m => Object.keys(m.declared).length);
  const panels = id?.panels ?? null;
  return { app, scheme, display, numerals, panels, modes, hasColour, isEmpty: !hasColour && !display && !numerals && !scheme && !panels };
}
