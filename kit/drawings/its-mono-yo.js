// It's mono's drawings (#83): sampler types on a studio desk at night, in the
// same loose hand as Wean's. Types, not products: no logo, no name and no
// detail that belongs to one model, so nothing looks like a maker's machine or
// suggests a maker stands behind the app. The guide beside each drawing names
// the model in text.
//
// Each machine is drawn from above, the way a manual draws a panel, with the
// thickness of its front edge so it sits on the desk. The one lime line is the
// mono signal: a single cable running into the machine's input. Everything
// else is off-white line.
//
// Geometry only; render.js draws it through the loose stroke.

const ink = (points, seed, extra = {}) => ({ kind: 'ink', points, seed, wobble: 0.7, step: 10, ...extra });
const detail = (points, seed, extra = {}) => ({ kind: 'detail', points, seed, wobble: 0.35, step: 9, ...extra });
const faint = (points, seed, extra = {}) => ({ kind: 'faint', points, seed, wobble: 0.5, step: 8, ...extra });
const mark = (points, seed, extra = {}) => ({ kind: 'mark', points, seed, wobble: 0.9, step: 10, ...extra });

// A rectangle with its corners rounded by a cut, drawn as one closed stroke.
function rect(x, y, w, h, r = 3) {
  return [[x + r, y], [x + w - r, y], [x + w, y + r], [x + w, y + h - r], [x + w - r, y + h],
    [x + r, y + h], [x, y + h - r], [x, y + r], [x + r, y]];
}
// A circle as a closed run of points; small ones need fewer.
function circle(cx, cy, r, n = Math.max(6, Math.round(r * (r < 6 ? 1 : 0.9)))) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}

// The body of a machine seen from above: its top, and the front edge's
// thickness below it, so it stands on the desk.
function body(x, y, w, h, seed, { depth = 7, r = 6 } = {}) {
  return [
    ink(rect(x, y, w, h, r), seed, { double: true, step: 16 }),
    ink([[x + 2, y + h], [x + 3, y + h + depth - 2], [x + r + 2, y + h + depth], [x + w - r - 2, y + h + depth], [x + w - 3, y + h + depth - 2], [x + w - 2, y + h]], seed + 1),
  ];
}
// A knob: its rim and the line that shows where it points.
function knob(cx, cy, r, turn, seed) {
  const a = (-135 + turn * 270) * Math.PI / 180 - Math.PI / 2;
  return [
    detail(circle(cx, cy, r), seed, { step: 8 }),
    detail([[cx + Math.cos(a) * r * 0.25, cy + Math.sin(a) * r * 0.25], [cx + Math.cos(a) * r * 0.85, cy + Math.sin(a) * r * 0.85]], seed + 1, { wobble: 0.1, step: 3 }),
  ];
}
const knobs = (x, y, n, gap, r, seed, turns = []) =>
  Array.from({ length: n }, (_, i) => knob(x + i * gap, y, r, turns[i] ?? ((i * 0.37 + 0.2) % 1), seed + i * 3)).flat();
// A square pad, a round one, or a grid of either.
const pad = (x, y, w, seed, h = w, r = 2.5) => detail(rect(x, y, w, h, r), seed, { step: 12, wobble: 0.25 });
function pads(x, y, cols, rows, s, gap, seed, { round = false, h = s } = {}) {
  const out = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const px = x + i * (s + gap), py = y + j * (h + gap);
    out.push(round ? detail(circle(px + s / 2, py + s / 2, s / 2), seed + j * cols + i, { step: 8 }) : pad(px, py, s, seed + j * cols + i, h));
  }
  return out;
}
// A row of step keys: small, square-cornered and a little wider than tall.
const keys = (x, y, n, w, h, gap, seed) => Array.from({ length: n }, (_, i) => detail(rect(x + i * (w + gap), y, w, h, 1), seed + i, { step: 7, wobble: 0.15 }));
// A screen: its frame, and a faint trace of what it shows.
function screen(x, y, w, h, seed, { show = 'lines', lines = 3 } = {}) {
  const out = [detail(rect(x, y, w, h, 2), seed, { step: 6 })];
  if (show === 'wave') {
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      pts.push([x + 5 + t * (w - 10), y + h / 2 + Math.sin(t * Math.PI * 7) * (h * 0.3) * Math.sin(t * Math.PI)]);
    }
    out.push(faint(pts, seed + 1, { wobble: 0.15, step: 6 }));
  } else if (show === 'columns') {
    // A tracker's columns: short rows of notes, one under another.
    const cols = 3, cw = (w - 12) / cols;
    for (let c = 0; c < cols; c++) for (let r = 0; r < lines; r++) {
      const ly = y + 7 + r * ((h - 12) / (lines - 1));
      out.push(faint([[x + 6 + c * cw, ly], [x + 6 + c * cw + cw * (0.55 + ((r + c) % 3) * 0.12), ly]], seed + 2 + c * 20 + r, { wobble: 0.1, step: 40 }));
    }
  } else {
    for (let i = 0; i < lines; i++) {
      const ly = y + (h * (i + 1)) / (lines + 1);
      out.push(faint([[x + 5, ly], [x + 5 + (w - 10) * (0.9 - (i % 3) * 0.22), ly]], seed + 1 + i, { wobble: 0.15, step: 30 }));
    }
  }
  return out;
}
// A fader or crossfader: its slot and its cap.
function fader(x, y, len, at, seed, { vertical = false } = {}) {
  const [x1, y1] = vertical ? [x, y + len] : [x + len, y];
  const cx = vertical ? x : x + len * at, cy = vertical ? y + len * at : y;
  return [
    detail([[x, y], [x1, y1]], seed, { wobble: 0.1, step: 5 }),
    detail(vertical ? rect(cx - 7, cy - 3.5, 14, 7, 1.5) : rect(cx - 3.5, cy - 7, 7, 14, 1.5), seed + 1, { step: 3 }),
  ];
}
// A jack: the socket's two rings.
const jack = (cx, cy, seed, r = 3.4) => [detail(circle(cx, cy, r, r > 5 ? 10 : 6), seed, { step: 6 }), detail(circle(cx, cy, r * 0.45, 4), seed + 1, { step: 6 })];
const jacks = (x, y, n, gap, seed) => Array.from({ length: n }, (_, i) => jack(x + i * gap, y, seed + i * 2)).flat();
// In a busy rack, a socket is one ring.
const sockets = (x, y, n, gap, seed) => Array.from({ length: n }, (_, i) => detail(circle(x + i * gap, y, 3.2, 6), seed + i, { step: 6 }));

// Points along a cubic curve, for a cable that sweeps rather than bends.
function curve([x0, y0], [x1, y1], [x2, y2], [x3, y3], n = 16) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
      u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3]);
  }
  return out;
}
// The mono signal, plugged in: a plug in the jack, seen from above, its body
// in ink, and the lime cable from its tail along a curve that starts off the
// edge of the drawing (from, c1, c2 are that curve's start and pulls).
function plugged(jx, jy, dx, dy, from, c1, c2, seed, { len = 15, half = 3.6 } = {}) {
  const nx = -dy, ny = dx;
  const bx = jx + dx * 3, by = jy + dy * 3, ex = bx + dx * len, ey = by + dy * len;
  const tail = [ex + dx * 3, ey + dy * 3];
  return [
    ...jack(jx, jy, seed),
    ink([[bx + nx * half, by + ny * half], [ex + nx * half, ey + ny * half], [ex + nx * (half - 1.4), tail[1] - dy * 0 + ny * (half - 1.4) + dy * 2],
      [ex - nx * (half - 1.4), ey - ny * (half - 1.4) + dy * 2], [ex - nx * half, ey - ny * half], [bx - nx * half, by - ny * half]], seed + 2, { wobble: 0.15, step: 4 }),
    detail([[bx + dx * len * 0.45 + nx * half, by + dy * len * 0.45 + ny * half], [bx + dx * len * 0.45 - nx * half, by + dy * len * 0.45 - ny * half]], seed + 3, { wobble: 0.05, step: 3 }),
    mark(curve(from, c1, c2, tail, 14), seed + 4),
  ];
}
// A patch cable in a rack, seen from the front: a plug head on the jack and
// the cable hanging from it. Off-white unless it is the mono signal.
function patch(jx, jy, to, sag, seed, kind = 'detail') {
  const [tx, ty] = to;
  const pts = curve([jx, jy + 4], [jx, jy + sag], [tx, ty + sag], [tx, ty + 4], 14);
  return [detail(circle(jx, jy, 4.6, 8), seed, { step: 6 }), ({ kind, points: pts, seed: seed + 1, wobble: 0.6, step: 12 })];
}
// A Eurorack module, seen from the front: its panel, its two screw holes, and
// what is on it.
function module(x, y, w, h, seed, parts = []) {
  return [
    ink(rect(x, y, w, h, 1.5), seed, { wobble: 0.5, step: 26 }),
    detail(circle(x + 5, y + 5, 1.6, 4), seed + 1, { step: 6 }), detail(circle(x + w - 5, y + h - 5, 1.6, 4), seed + 2, { step: 6 }),
    ...parts,
  ];
}
// The rails a rack's modules hang from.
const rails = (x0, x1, y, h, seed) => [
  ink([[x0, y], [x1, y]], seed, { double: true, step: 30 }), ink([[x0, y + h], [x1, y + h]], seed + 1, { double: true, step: 30 }),
  faint([[x0, y - 6], [x1, y - 6]], seed + 2, { step: 40 }), faint([[x0, y + h + 6], [x1, y + h + 6]], seed + 3, { step: 40 }),
];
// A shadow on the desk: a few short hatches.
const hatch = (x, y, n, seed) => Array.from({ length: n }, (_, i) =>
  faint([[x + i * 7, y + 6], [x + i * 7 + 6, y]], seed + i, { wobble: 0.1, step: 4 }));


// A wave as a line of points: a few cycles, its swing easing at the ends.
function wave(x0, x1, y, amp, cycles, phase = 0, n = Math.round(cycles * 10)) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push([x0 + (x1 - x0) * t, y + Math.sin(t * Math.PI * 2 * cycles + phase) * amp * (0.35 + 0.65 * Math.sin(Math.PI * t))]);
  }
  return out;
}
// A folder seen flat: its tab and its body, and the files in it as lines.
function folder(x, y, w, h, seed, files = 3) {
  const out = [ink([[x, y + 8], [x, y + 2], [x + 3, y], [x + w * 0.32, y], [x + w * 0.38, y + 6], [x + w - 3, y + 6], [x + w, y + 9],
    [x + w, y + h - 3], [x + w - 3, y + h], [x + 3, y + h], [x, y + h - 3], [x, y + 8]], seed, { wobble: 0.5, step: 18 })];
  for (let i = 0; i < files; i++) {
    const fy = y + 18 + i * ((h - 26) / Math.max(1, files - 1 || 1));
    out.push(detail(wave(x + 10, x + 10 + (w - 24) * (0.6 + (i % 2) * 0.25), fy, 2.2, 3 + i, i, 6 * (3 + i)), seed + 10 + i, { wobble: 0.05, step: 8 }));
  }
  return out;
}

export const ITS_MONO_DRAWINGS = [
  {
    id: 'its-mono-yo-summed',
    title: 'Two channels summed into one line',
    use: 'Statement: correct mono, a proper downmix',
    size: [480, 260],
    strokes: [
      ink(wave(24, 196, 78, 15, 2.6, 0.3), 2100, { wobble: 0.3, step: 6 }),
      ink(wave(24, 196, 176, 15, 2.6, 0.9), 2101, { wobble: 0.3, step: 6 }),
      faint([[18, 60], [18, 96]], 2102), faint([[18, 158], [18, 194]], 2103),
      ink(curve([196, 78], [226, 78], [232, 126], [252, 127], 10), 2104, { wobble: 0.3, step: 6 }),
      ink(curve([196, 176], [226, 176], [232, 128], [252, 127], 10), 2105, { wobble: 0.3, step: 6 }),
      detail(circle(258, 127, 7, 10), 2106, { step: 3 }),
      detail([[254, 127], [262, 127]], 2107, { wobble: 0.05, step: 3 }), detail([[258, 123], [258, 131]], 2108, { wobble: 0.05, step: 3 }),
      // the corner of the machine it goes into
      ink([[400, -4], [400, 222], [404, 230], [484, 230]], 2110, { double: true }),
      ink([[410, 230], [411, 238], [484, 238]], 2111),
      ...knobs(428, 40, 2, 26, 8, 2112, [0.4, 0.7]),
      ...knobs(428, 76, 2, 26, 8, 2116, [0.6, 0.2]),
      mark(wave(265, 372, 127, 13, 2.2, 0.6, 40).concat([[380, 127]]), 2122, { wobble: 0.4, step: 6 }),
      ink([[380, 122], [399, 122], [399, 132], [380, 132], [380, 122]], 2124, { wobble: 0.1, step: 3 }),
      detail([[386, 122], [386, 132]], 2125, { wobble: 0.05, step: 3 }),
    ],
  },
  {
    id: 'its-mono-yo-folder',
    title: 'A folder of samples going in whole',
    use: 'Statement: a whole folder at once, nothing overwritten',
    size: [480, 260],
    strokes: [
      ...folder(34, 120, 150, 100, 2200, 3),
      ...folder(52, 84, 150, 100, 2220, 3),
      ...folder(70, 48, 150, 100, 2240, 4),
      faint([[40, 236], [196, 236]], 2260, { dash: '40 8 22 10' }),
      // a groovebox's back edge and its input, seen from above
      ...body(300, 96, 170, 112, 2270),
      ...knobs(322, 120, 4, 22, 6.5, 2275),
      ...screen(322, 140, 64, 28, 2285, { lines: 2 }),
      ...keys(320, 186, 8, 12, 6, 6, 2290),
      ...plugged(318, 96, 0, -1, [222, 84], [262, 92], [318, 30], 2299),
    ],
  },
  {
    id: 'its-mono-yo-input',
    title: 'A plug in a sampler\u2019s input, on its back panel',
    use: 'Statement: the format your sampler wants',
    size: [480, 260],
    strokes: [
      // the back panel, close: its top edge, its face and the desk under it
      ink([[20, 70], [460, 66]], 2300, { double: true }),
      ink([[20, 70], [22, 190], [458, 186], [460, 66]], 2301),
      faint([[10, 206], [470, 202]], 2302, { dash: '60 10 30 12' }),
      ...jack(96, 128, 2310, 9),
      ...jack(156, 128, 2314, 9),
      ...jack(262, 128, 2318, 9),
      ...jack(322, 128, 2322, 9),
      detail(rect(372, 114, 34, 26, 4), 2326, { step: 4 }),
      detail(rect(420, 116, 22, 14, 3), 2328, { step: 4 }),
      detail([[60, 96], [192, 94]], 2330, { wobble: 0.1 }), detail([[226, 94], [358, 92]], 2331, { wobble: 0.1 }),
      // the plug in the first input, its cable falling off the bottom edge
      ink(rect(84, 138, 24, 40, 4), 2340, { wobble: 0.25, step: 5 }),
      detail([[84, 150], [108, 150]], 2341, { wobble: 0.05 }), detail([[84, 156], [108, 156]], 2342, { wobble: 0.05 }),
      ink([[88, 178], [90, 192], [102, 192], [104, 178]], 2343, { wobble: 0.15, step: 4 }),
      mark(curve([96, 192], [96, 236], [150, 214], [168, 266], 14), 2344),
    ],
  },
  {
    id: 'its-mono-yo-pad-sampler',
    title: 'A pad sampler',
    use: 'Where it works: the SP-404 guide',
    size: [320, 240],
    strokes: [
      ...body(110, 40, 124, 172, 1100),
      ...knobs(127, 58, 5, 22.5, 6, 1110),
      ...screen(126, 74, 52, 20, 1130, { show: 'wave' }),
      ...knobs(196, 84, 2, 20, 5, 1140, [0.7, 0.3]),
      ...pads(126, 106, 4, 4, 21, 6, 1150),
      ...hatch(240, 200, 4, 1180),
      ...plugged(206, 40, 0, -1, [92, -6], [112, 36], [206, -14], 1190),
    ],
  },
  {
    id: 'its-mono-yo-groovebox',
    title: 'A groovebox with a row of step buttons',
    use: 'Where it works: the Digitakt guide',
    size: [320, 240],
    strokes: [
      ...body(36, 74, 248, 116, 1200),
      ...knobs(56, 98, 1, 0, 9, 1210, [0.6]),
      ...pads(48, 122, 2, 2, 9, 6, 1215),
      ...screen(92, 88, 74, 36, 1220, { lines: 3 }),
      ...knobs(186, 94, 4, 22, 6.5, 1230),
      ...knobs(186, 120, 4, 22, 6.5, 1250, [0.5, 0.3, 0.8, 0.45]),
      ...keys(52, 158, 16, 9.5, 7, 4.2, 1270),
      ...hatch(286, 178, 3, 1290),
      ...plugged(246, 74, 0, -1, [-6, 36], [110, 76], [240, -10], 1295),
    ],
  },
  {
    id: 'its-mono-yo-crossfader',
    title: 'A larger groovebox with a crossfader',
    use: 'Where it works: the Octatrack guide',
    size: [320, 240],
    strokes: [
      ...body(18, 64, 284, 132, 1300),
      ...screen(36, 80, 84, 40, 1310, { show: 'wave' }),
      ...knobs(142, 86, 6, 24, 6.5, 1320),
      ...knobs(142, 112, 6, 24, 6.5, 1340, [0.25, 0.6, 0.4, 0.9, 0.5, 0.15]),
      ...fader(40, 160, 70, 0.62, 1360),
      ...keys(128, 142, 8, 10, 6, 5, 1365),
      ...keys(128, 166, 16, 7.6, 7, 2.8, 1380),
      ...hatch(300, 184, 3, 1395),
      ...plugged(62, 64, 0, -1, [326, 34], [200, 66], [60, -8], 1397),
    ],
  },
  {
    id: 'its-mono-yo-drum-box',
    title: 'A small drum box',
    use: 'Where it works: the Model:Samples guide',
    size: [320, 240],
    strokes: [
      ...body(70, 62, 180, 128, 1400),
      ...screen(86, 78, 44, 22, 1410, { lines: 2 }),
      ...knobs(150, 88, 4, 24, 7, 1420),
      ...knobs(150, 116, 4, 24, 7, 1440, [0.4, 0.75, 0.2, 0.55]),
      ...pads(88, 112, 2, 1, 10, 8, 1450),
      ...pads(88, 140, 8, 1, 14, 4.6, 1460, { round: true }),
      ...pads(88, 164, 8, 1, 14, 4.6, 1480, { round: true }),
      ...hatch(252, 178, 3, 1495),
      ...plugged(226, 62, 0, -1, [110, -6], [130, 54], [226, -6], 1497),
    ],
  },
  {
    id: 'its-mono-yo-tracker',
    title: 'A tracker-style groovebox',
    use: 'Where it works: the Polyend Tracker guide',
    size: [320, 240],
    strokes: [
      ...body(26, 58, 268, 142, 1500),
      ...screen(42, 74, 132, 74, 1510, { show: 'columns', lines: 7 }),
      ...knobs(196, 84, 3, 30, 9, 1530, [0.3, 0.7, 0.5]),
      ...pads(186, 108, 5, 3, 13, 5, 1540),
      ...keys(42, 162, 16, 10, 7, 4.6, 1560),
      ...keys(42, 178, 16, 10, 7, 4.6, 1580),
      ...hatch(296, 188, 3, 1597),
      ...plugged(264, 58, 0, -1, [-6, 30], [120, 60], [262, -12], 1598),
    ],
  },
  {
    id: 'its-mono-yo-pad-box',
    title: 'A box of large pads, with a big screen',
    use: 'Where it works: the MPC guide',
    size: [320, 240],
    strokes: [
      ...body(54, 34, 212, 176, 1600),
      ...screen(72, 52, 108, 62, 1610, { show: 'wave' }),
      ...knobs(222, 82, 1, 0, 22, 1620, [0.55]),
      detail(circle(222, 82, 6), 1625, { step: 3 }),
      ...pads(70, 124, 2, 4, 9, 9, 1630, { h: 9 }),
      ...pads(120, 124, 4, 4, 18, 4.7, 1640),
      ...knobs(222, 128, 1, 0, 8, 1660, [0.3]),
      ...hatch(268, 198, 3, 1690),
      ...plugged(98, 34, 0, -1, [326, 22], [220, 34], [96, -12], 1695),
    ],
  },
  {
    id: 'its-mono-yo-eurorack-module',
    title: 'A drum module in a modular rack',
    use: 'Where it works: the Sample Drum guide',
    size: [320, 240],
    strokes: [
      ...rails(24, 296, 30, 162, 1700),
      ...module(30, 30, 64, 162, 1710, [...knobs(50, 62, 2, 24, 6, 1712), ...knobs(50, 92, 2, 24, 6, 1716), ...jacks(48, 170, 3, 14, 1720)]),
      ...module(98, 30, 108, 162, 1730, [
        ...screen(110, 44, 84, 30, 1732, { show: 'wave' }),
        ...knobs(122, 96, 3, 30, 8, 1740, [0.3, 0.6, 0.45]),
        ...pads(112, 118, 4, 1, 12, 9.5, 1750, { h: 8 }),
        ...jacks(118, 150, 4, 22, 1760), ...jacks(118, 172, 4, 22, 1770),
      ]),
      ...module(210, 30, 42, 162, 1780, [...knobs(231, 62, 1, 0, 9, 1782), ...knobs(231, 104, 1, 0, 6, 1786), ...jacks(231, 140, 1, 0, 1788), ...jacks(231, 170, 1, 0, 1790)]),
      ...module(256, 30, 40, 162, 1792, [...knobs(276, 70, 1, 0, 6, 1794), ...jacks(276, 150, 1, 0, 1796), ...jacks(276, 172, 1, 0, 1798)]),
      ...patch(62, 170, [276, 150], 46, 1800),
      detail(circle(118, 150, 4.6, 9), 1810, { step: 3 }),
      mark(curve([118, 154], [118, 214], [60, 206], [36, 244], 16), 1812),
    ],
  },
  {
    id: 'its-mono-yo-eurorack-rack',
    title: 'A modular rack of sampler modules',
    use: 'Where it works: the Eurorack samplers guide',
    size: [320, 240],
    strokes: [
      ...rails(14, 306, 26, 82, 1900),
      ...module(18, 26, 52, 82, 1910, [...screen(26, 36, 36, 16, 1911, { lines: 2 }), ...knobs(32, 66, 2, 22, 5, 1913), ...sockets(30, 94, 3, 13, 1916)]),
      ...module(74, 26, 34, 82, 1920, [...knobs(91, 44, 1, 0, 7, 1921), ...knobs(91, 66, 1, 0, 5, 1923), ...sockets(91, 94, 1, 0, 1925)]),
      ...module(112, 26, 70, 82, 1930, [...screen(120, 36, 54, 18, 1931, { show: 'wave' }), ...knobs(130, 68, 3, 18, 5, 1933), ...sockets(126, 94, 4, 14, 1937)]),
      ...module(186, 26, 30, 82, 1940, [...knobs(201, 46, 1, 0, 5, 1941), ...knobs(201, 66, 1, 0, 5, 1943), ...sockets(201, 94, 1, 0, 1945)]),
      ...module(220, 26, 86, 82, 1950, [...knobs(240, 46, 3, 22, 5.5, 1951), ...keys(232, 62, 5, 8, 6, 5.4, 1960), ...sockets(234, 94, 5, 15, 1966)]),
      ...rails(14, 306, 128, 82, 1970),
      ...module(18, 128, 96, 82, 1980, [...screen(28, 138, 60, 20, 1981, { lines: 2 }), ...knobs(36, 170, 3, 22, 6, 1983), ...sockets(32, 196, 5, 15, 1988)]),
      ...module(118, 128, 42, 82, 1990, [...knobs(139, 150, 1, 0, 9, 1991), ...sockets(139, 196, 1, 0, 1993)]),
      ...module(164, 128, 74, 82, 2000, [...knobs(180, 150, 3, 22, 6, 2001), ...sockets(178, 196, 4, 15, 2009)]),
      ...module(242, 128, 64, 82, 2020, [...screen(250, 138, 48, 18, 2021, { show: 'wave' }), ...knobs(258, 172, 2, 30, 6, 2023), ...sockets(258, 196, 2, 30, 2027)]),
      ...patch(30, 94, [139, 196], 40, 2040),
      ...patch(201, 94, [258, 196], 30, 2045),
      ...patch(165, 94, [32, 196], 54, 2050),
      detail(circle(126, 94, 4.6, 9), 2060, { step: 3 }),
      mark(curve([126, 98], [126, 120], [96, 118], [80, 124], 8).concat(curve([80, 124], [20, 132], [-2, 210], [-6, 244], 10).slice(1)), 2062),
    ],
  },
];
