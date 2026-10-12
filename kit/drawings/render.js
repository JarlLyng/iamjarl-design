// A drawing, from its description to inline SVG (#75).
//
// A description is geometry: the strokes as points, each with a kind. Every
// stroke goes through loosePath, so all the drawings, and a site's data line,
// share one hand. The SVG carries no colour of its own:
//
//   ink     charcoal, var(--ij-color-text-primary): the contours
//   detail  the same ink, finer: hatching, joints, grain
//   faint   the same ink, lighter: mist, distance, things under water
//   mark    the one magenta line, var(--ij-color-accent). Exactly one per drawing.
//
// A stroke with `double` is drawn twice, the second pass finer and a hair
// off, the way a pen goes back over a line it cares about.
//
// Inline it in the page: a CSS variable can't reach into an <img>. kit.css
// keeps the strokes' width on screen whatever the drawing's size, so a drawing
// stays readable at phone width.

import { loosePath } from '../loose.js';

const STYLE = {
  ink:    { colour: 'var(--ij-color-text-primary)', width: 1.6, opacity: null },
  detail: { colour: 'var(--ij-color-text-primary)', width: 1, opacity: 0.8 },
  faint:  { colour: 'var(--ij-color-text-primary)', width: 1.1, opacity: 0.4 },
  mark:   { colour: 'var(--ij-color-accent)', width: 3, opacity: null },
};

const pathFor = (s, again = false) => (s.parts ?? [s.points])
  .map((pts, i) => loosePath(again ? pts.map(([x, y]) => [x + 0.9, y + 0.7]) : pts, {
    seed: (s.seed ?? 1) + i * 101 + (again ? 57 : 0),
    wobble: (s.wobble ?? 1.4) * (again ? 1.4 : 1), step: s.step ?? 14, overshoot: s.overshoot ?? 1.5,
  }))
  .join('');

export function renderDrawing(drawing) {
  const [w, h] = drawing.size;
  const marks = drawing.strokes.filter(s => s.kind === 'mark');
  if (marks.length !== 1) throw new Error(`${drawing.id}: a drawing has exactly one mark, not ${marks.length}`);
  const groups = [];
  // The second passes of doubled strokes go in with the detail, finer.
  const again = drawing.strokes.filter(s => s.double).map(s => ({ ...s, kind: 'detail', again: true }));
  for (const kind of ['faint', 'detail', 'ink']) {
    const strokes = [...drawing.strokes, ...again].filter(s => s.kind === kind);
    if (!strokes.length) continue;
    const st = STYLE[kind];
    const attrs = `style="stroke: ${st.colour}" stroke-width="${st.width}"${st.opacity ? ` stroke-opacity="${st.opacity}"` : ''}`;
    const paths = strokes.map(s => `    <path d="${pathFor(s, s.again)}"${s.dash ? ` stroke-dasharray="${s.dash}"` : ''}/>`).join('\n');
    groups.push(`  <g ${attrs}>\n${paths}\n  </g>`);
  }
  const m = marks[0];
  groups.push(`  <path class="ij-mark" style="stroke: ${STYLE.mark.colour}" stroke-width="${STYLE.mark.width}" d="${pathFor(m)}"/>`);
  return [
    `<svg class="ij-drawing ij-drawing--${drawing.id}" viewBox="0 0 ${w} ${h}" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">`,
    ...groups,
    '</svg>',
  ].join('\n');
}
