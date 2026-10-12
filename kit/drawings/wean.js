// Wean's drawings (#75): coast and tide, a misty morning with the tide going
// out. One loose hand throughout. The waterline is always the one magenta
// line, and it always steps down from left to right, as Wean's allowance does.
// Everything else is charcoal. No faces, and nothing of what you cut down.
//
// Geometry only; render.js draws it through the loose stroke.

function rng(seed) {
  let s = (seed * 9301 + 49297) % 233280;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}

// A waterline that steps down: level runs joined by short drops. The runs are
// a little uneven, as water is.
function steps(x0, y0, x1, n, drop, seed = 1) {
  const r = rng(seed);
  const run = (x1 - x0) / (n + 1);
  const pts = [[x0, y0]];
  for (let i = 1; i <= n; i++) {
    const x = x0 + run * i + (r() - 0.5) * run * 0.3, y = y0 + drop * (i - 1);
    pts.push([x, y], [x + 2, y + drop]);
  }
  pts.push([x1, y0 + drop * n]);
  return pts;
}

// A stone: a rounded top, a flatter base, the outline left open where the pen
// lifts, and a few strokes of shade low on its right.
function stone(cx, cy, rx, ry, seed, { shade = 3 } = {}) {
  const r = rng(seed);
  const j = (v, a) => v + (r() - 0.5) * a;
  const outline = [
    [j(cx - rx * 0.62, 2), j(cy + ry * 0.4, 1)],
    [j(cx - rx, 2), j(cy + ry * 0.12, 2)],
    [j(cx - rx * 0.78, 2), j(cy - ry * 0.62, 2)],
    [j(cx - rx * 0.18, 2), j(cy - ry, 1.5)],
    [j(cx + rx * 0.5, 2), j(cy - ry * 0.82, 2)],
    [j(cx + rx * 0.97, 2), j(cy - ry * 0.08, 2)],
    [j(cx + rx * 0.84, 2), j(cy + ry * 0.38, 1)],
    [j(cx - rx * 0.32, 2), j(cy + ry * 0.44, 1)],
  ];
  const strokes = [{ kind: 'ink', points: outline, seed, wobble: 0.6, step: Math.max(6, rx / 3), double: rx > 24 }];
  for (let i = 0; i < shade; i++) {
    const x = cx + rx * (0.3 + i * 0.17);
    strokes.push({ kind: 'detail', points: [[x, cy + ry * 0.3], [x + rx * 0.12, cy - ry * 0.12]], seed: seed + 11 + i, wobble: 0.2, step: 4 });
  }
  return strokes;
}

// A crest on rough water: a slope up, a peak, and the top curling over.
const crest = (cx, cy, w, h, seed) => ({
  kind: 'ink', seed, wobble: 0.5, step: 6,
  points: [[cx - w / 2, cy], [cx - w * 0.18, cy - h * 0.6], [cx, cy - h], [cx + w * 0.14, cy - h * 0.86], [cx + w * 0.12, cy - h * 0.52], [cx + w / 2, cy - h * 0.1]],
});
// Rough water: one long line, choppy, its crests a little sharp.
function chop(x0, x1, y, amp, period, seed) {
  const r = rng(seed);
  const pts = [];
  const phase = r() * Math.PI * 2;
  for (let x = x0; x <= x1; x += period / 6) {
    const t = ((x - x0) / period) * Math.PI * 2 + phase;
    const crest = Math.pow(Math.abs(Math.sin(t / 2)), 3) * 2 - 1;   // sharp tops, wide troughs
    pts.push([x, y - crest * amp * (0.75 + r() * 0.5)]);
  }
  return { kind: 'ink', points: pts, seed, wobble: 0.4, step: period / 6 };
}
// A ripple: a low, wide arc.
const ripple = (cx, cy, w, h = 2.5) => [[cx - w / 2, cy], [cx - w / 4, cy - h], [cx + w / 4, cy - h * 0.6], [cx + w / 2, cy]];
// A level line: the horizon, mist, still water.
const level = (x0, x1, y, tilt = 0) => [[x0, y], [x1, y + tilt]];
// A tuft of shore grass: a few blades fanning up from one point.
const tuft = (x, y, h, seed) => [-0.5, -0.2, 0.15, 0.45].map((a, i) => ({
  kind: 'detail', seed: seed + i, wobble: 0.3, step: 5, points: [[x + i * 1.5, y], [x + i * 1.5 + a * h * 0.6, y - h * (0.7 + (i % 2) * 0.3)]],
}));

const ink = (points, seed, extra = {}) => ({ kind: 'ink', points, seed, ...extra });
const detail = (points, seed, extra = {}) => ({ kind: 'detail', points, seed, wobble: 0.4, step: 6, ...extra });
const faint = (points, seed, extra = {}) => ({ kind: 'faint', points, seed, ...extra });
const mark = (points, seed, extra = {}) => ({ kind: 'mark', points, seed, ...extra });
const MIST = '26 10 48 14 18 12';
const WATER = '50 14 30 10';

export const WEAN_DRAWINGS = [
  {
    id: 'wean-shoreline',
    title: 'A low shoreline in morning mist',
    use: 'Hero, under the headline',
    size: [560, 140],
    strokes: [
      faint(level(46, 214, 22, -1), 3, { dash: MIST }),
      faint(level(258, 432, 30, 1), 4, { dash: MIST }),
      faint(level(128, 336, 44), 5, { dash: MIST }),
      faint(level(386, 528, 52, -1), 6, { dash: MIST }),
      faint([[20, 78], [60, 72], [104, 70], [150, 74], [190, 79]], 7, { wobble: 0.8 }),
      ink([[300, 80], [338, 72], [378, 67], [420, 68], [468, 75], [512, 79], [548, 83]], 8, { wobble: 1 }),
      ink([[14, 94], [140, 89], [262, 91], [384, 95], [548, 97]], 9, { double: true }),
      ...tuft(30, 92, 14, 10),
      ...tuft(118, 89, 10, 15),
      ...stone(70, 98, 12, 6, 20, { shade: 2 }),
      ...stone(94, 100, 7, 4, 21, { shade: 1 }),
      faint(ripple(236, 128, 34), 22),
      faint(ripple(396, 134, 26), 23),
      mark(steps(22, 110, 470, 2, 5, 24), 25, { wobble: 1 }),
    ],
  },
  {
    id: 'wean-flat-rocks',
    title: 'The tide going out over flat rocks, in steps',
    use: 'Statement: less, a little at a time',
    size: [480, 300],
    strokes: [
      faint(level(64, 226, 40), 31, { dash: MIST }),
      faint(level(262, 420, 52, -2), 32, { dash: MIST }),
      faint(level(20, 460, 80), 33, { dash: '90 16 60 12' }),
      // three shelves, each lower and further out: an uneven top, a face
      ink([[26, 118], [60, 114], [96, 116], [140, 113], [202, 120], [206, 147]], 34, { double: true }),
      ink([[150, 156], [196, 152], [240, 154], [290, 152], [330, 159], [333, 183]], 35, { double: true }),
      ink([[280, 194], [322, 190], [370, 192], [414, 190], [452, 197], [454, 219]], 36, { double: true }),
      detail([[62, 125], [80, 129], [96, 127]], 37),
      detail([[126, 131], [150, 128], [164, 134]], 38),
      detail([[214, 165], [240, 168]], 39),
      detail([[260, 162], [272, 166]], 40),
      detail([[352, 205], [380, 202], [394, 206]], 41),
      // striations on the faces
      detail([[196, 126], [194, 142]], 42), detail([[186, 125], [185, 140]], 43),
      detail([[322, 164], [320, 178]], 44), detail([[312, 163], [311, 176]], 45),
      detail([[442, 202], [441, 215]], 46), detail([[432, 201], [431, 213]], 47),
      faint(ripple(92, 166, 40), 48),
      faint(ripple(252, 202, 36), 49),
      faint(ripple(386, 240, 44), 50),
      faint(ripple(428, 258, 30), 51),
      faint(level(70, 200, 232), 52, { dash: WATER }),
      ...stone(56, 262, 10, 6, 53, { shade: 2 }),
      ...stone(82, 268, 7, 4, 54, { shade: 1 }),
      ...stone(36, 272, 6, 3, 55, { shade: 1 }),
      mark([[28, 147], [204, 147], [205, 183], [331, 183], [332, 219], [460, 219]], 56),
    ],
  },
  {
    id: 'wean-stones',
    title: 'One wave reaching a little higher up the stones while the tide still falls',
    use: 'Statement: a day over is met with calm',
    size: [480, 300],
    strokes: [
      faint(level(70, 250, 40), 61, { dash: MIST }),
      faint(level(290, 430, 50), 62, { dash: MIST }),
      ...stone(70, 140, 32, 19, 64),
      ...stone(130, 160, 21, 13, 65, { shade: 2 }),
      ...stone(196, 172, 34, 18, 66),
      ...stone(262, 184, 21, 12, 67, { shade: 2 }),
      ...stone(332, 192, 30, 15, 68),
      ...stone(398, 204, 17, 10, 69, { shade: 2 }),
      // the wave's reach: a foam edge a little above the falling water
      ink([[192, 202], [212, 197], [234, 193], [256, 192], [278, 195], [300, 200]], 70, { wobble: 0.7, step: 8 }),
      detail([[206, 192], [208, 192]], 71, { step: 2 }),
      detail([[222, 188], [224, 188]], 72, { step: 2 }),
      detail([[236, 187], [238, 187]], 73, { step: 2 }),
      faint(ripple(110, 230, 48), 74),
      faint(ripple(250, 246, 52), 75),
      faint(ripple(390, 262, 56), 76),
      faint(level(140, 330, 270), 77, { dash: WATER }),
      mark(steps(30, 192, 456, 2, 18, 78), 79),
    ],
  },
  {
    id: 'wean-mooring-post',
    title: 'A mooring post with tide marks, the water at a lower mark',
    use: 'Statement: your pace, your plan',
    size: [480, 300],
    strokes: [
      faint(level(40, 216, 118), 81, { dash: '60 12 40 10' }),
      faint(level(266, 448, 120), 82, { dash: '60 12 40 10' }),
      faint(level(90, 260, 50), 83, { dash: MIST }),
      faint(level(300, 420, 62), 84, { dash: MIST }),
      // the post, a little irregular, its top cut on a slant
      ink([[226, 70], [228, 130], [229, 186]], 85, { wobble: 0.6, double: true }),
      ink([[254, 64], [253, 130], [252, 186]], 86, { wobble: 0.6, double: true }),
      ink([[224, 72], [240, 63], [256, 63]], 87, { wobble: 0.4, step: 6 }),
      detail([[236, 82], [237, 120]], 88), detail([[244, 94], [244, 136]], 89), detail([[233, 128], [234, 150]], 90),
      // an iron ring on the post
      ink([[254, 84], [262, 86], [264, 94], [258, 100], [253, 98]], 91, { wobble: 0.2, step: 4 }),
      // tide marks, highest first
      detail([[254, 112], [266, 112]], 92, { step: 4 }),
      detail([[254, 130], [264, 130]], 93, { step: 4 }),
      detail([[254, 148], [266, 148]], 94, { step: 4 }),
      detail([[254, 166], [264, 166]], 95, { step: 4 }),
      detail([[254, 184], [266, 184]], 96, { step: 4 }),
      // the band the high water left on the wood
      detail([[229, 152], [236, 146]], 97), detail([[230, 162], [244, 150]], 98), detail([[231, 172], [252, 156]], 99), detail([[240, 176], [252, 166]], 100),
      // the post below the water, and its broken reflection
      faint([[229, 196], [230, 250]], 101, { dash: '12 7 20 9' }),
      faint([[252, 198], [251, 248]], 102, { dash: '16 8 10 7' }),
      faint(ripple(206, 214, 26, 2), 103),
      faint(ripple(278, 222, 30, 2), 104),
      faint(ripple(140, 244, 60), 105),
      faint(ripple(360, 256, 64), 106),
      { kind: 'mark', seed: 107, parts: [[[38, 190], [222, 190]], [[258, 190], [300, 190], [301, 200], [452, 200]]] },
    ],
  },
  {
    id: 'wean-harbour-steps',
    title: 'Harbour steps going down into still water',
    use: 'Framing the taper staircase',
    size: [480, 300],
    strokes: [
      faint(level(260, 440, 44), 111, { dash: MIST }),
      faint(level(330, 460, 70), 112, { dash: '60 12 40 10' }),
      // the steps in profile, the wall they come down, and their back edges
      ink([[24, 64], [118, 64], [118, 104], [208, 104], [208, 144], [298, 144], [298, 196]], 113, { wobble: 0.8, double: true }),
      ink([[24, 52], [24, 214]], 114, { wobble: 0.6, double: true }),
      ink([[118, 64], [136, 52], [24, 52]], 115, { wobble: 0.5 }),
      ink([[208, 104], [226, 92], [136, 92]], 116, { wobble: 0.5 }),
      ink([[298, 144], [316, 132], [226, 132]], 117, { wobble: 0.5 }),
      // joints in the stone, staggered course by course
      detail([[70, 64], [70, 104]], 118), detail([[24, 104], [118, 104]], 119, { step: 10 }),
      detail([[160, 104], [160, 144]], 120), detail([[48, 144], [208, 144]], 121, { step: 10 }),
      detail([[252, 144], [252, 184]], 122), detail([[90, 104], [90, 144]], 123), detail([[130, 144], [130, 184]], 124),
      detail([[24, 184], [298, 184]], 125, { step: 12 }),
      // an iron ring in the wall
      ink([[62, 152], [70, 150], [74, 158], [68, 165], [61, 161], [61, 154]], 126, { wobble: 0.2, step: 4 }),
      // weed at the waterline
      detail([[230, 198], [236, 210]], 127), detail([[242, 198], [246, 210]], 128), detail([[258, 199], [261, 210]], 129),
      // the steps under the water, faint
      faint([[298, 196], [298, 224], [388, 224], [388, 252], [470, 252]], 130, { wobble: 0.8 }),
      faint([[298, 224], [316, 212], [376, 212]], 131, { wobble: 0.5 }),
      faint(ripple(150, 240, 70, 1.5), 132),
      faint(ripple(250, 268, 60, 1.5), 133),
      faint(level(40, 200, 262), 134, { dash: WATER }),
      mark([[30, 206], [250, 206], [251, 212], [466, 212]], 135, { wobble: 1 }),
    ],
  },
  {
    id: 'wean-breakwater',
    title: 'A breakwater, rough sea beyond it and calm water behind',
    use: 'The tour step for the craving tools',
    size: [480, 300],
    strokes: [
      faint(level(20, 460, 36), 141, { dash: '90 16 60 12' }),
      // rough water, calmer towards the horizon
      chop(24, 456, 52, 2.5, 26, 142),
      chop(20, 460, 76, 4, 36, 143),
      chop(16, 464, 104, 6.5, 48, 144),
      detail([[96, 70], [102, 67]], 145, { step: 3 }), detail([[250, 72], [256, 69]], 146, { step: 3 }), detail([[392, 71], [398, 68]], 147, { step: 3 }),
      detail([[60, 97], [68, 93]], 148, { step: 3 }), detail([[206, 98], [214, 94]], 149, { step: 3 }), detail([[350, 97], [358, 93]], 150, { step: 3 }),
      // spray thrown up where the sea meets the stones
      detail([[160, 124], [154, 116]], 151, { step: 3 }), detail([[170, 120], [168, 110]], 152, { step: 3 }), detail([[180, 123], [186, 114]], 153, { step: 3 }),
      detail([[300, 124], [296, 115]], 154, { step: 3 }), detail([[310, 121], [311, 111]], 155, { step: 3 }),
      // the breakwater: big stones, shoulder to shoulder
      ...stone(44, 146, 30, 17, 170),
      ...stone(108, 150, 33, 18, 171),
      ...stone(174, 145, 30, 19, 172),
      ...stone(240, 151, 35, 17, 173),
      ...stone(306, 146, 30, 18, 174),
      ...stone(370, 150, 32, 17, 175),
      ...stone(434, 146, 28, 17, 176),
      // the calm side, in front
      faint(level(70, 200, 228), 177, { dash: WATER }),
      faint(level(260, 420, 244), 178, { dash: WATER }),
      faint(level(140, 330, 264), 179, { dash: '40 16 60 12' }),
      mark(steps(24, 198, 458, 2, 6, 180), 181, { wobble: 1 }),
    ],
  },
  {
    id: 'wean-boat',
    title: 'A small boat pulled up on the sand, its rope to a post',
    use: 'Privacy and price',
    size: [480, 300],
    strokes: [
      faint(level(70, 240, 44), 191, { dash: MIST }),
      faint(level(20, 460, 92), 192, { dash: '90 16 60 12' }),
      // the sand, sloping down to the water, passing behind the boat
      ink([[16, 196], [92, 197]], 193),
      ink([[270, 204], [380, 210], [466, 214]], 194),
      // the boat: sheer, inner gunwale, hull, keel, transom, a strake
      ink([[92, 136], [130, 150], [180, 156], [228, 154], [266, 146]], 195, { wobble: 0.8, double: true }),
      detail([[100, 142], [136, 153], [182, 159], [228, 157], [262, 151]], 196, { wobble: 0.6, step: 10 }),
      ink([[92, 136], [102, 160], [128, 184], [176, 194], [230, 192], [262, 178], [266, 146]], 197, { wobble: 0.8, double: true }),
      detail([[118, 178], [176, 188], [232, 186], [258, 172]], 198, { wobble: 0.6, step: 10 }),
      detail([[140, 194], [214, 196]], 199, { step: 10 }),
      detail([[148, 152], [150, 146]], 200, { step: 3 }), detail([[222, 154], [224, 148]], 201, { step: 3 }),
      // its shadow on the sand
      detail([[120, 198], [134, 192]], 202), detail([[150, 200], [164, 194]], 203), detail([[180, 200], [194, 195]], 204), detail([[210, 200], [224, 195]], 205), detail([[240, 199], [252, 192]], 206),
      // the post, and the rope to it, slack
      ink([[380, 156], [381, 212]], 207, { wobble: 0.5, double: true }),
      detail([[376, 156], [386, 155]], 208, { step: 4 }),
      detail([[377, 172], [385, 172]], 209, { step: 4 }),
      ink([[94, 140], [130, 168], [200, 182], [262, 186], [322, 180], [380, 164]], 210, { wobble: 1 }),
      // ripple marks the water left in the sand, and the wet edge
      faint(ripple(58, 222, 22, 2), 211),
      faint(ripple(110, 228, 26, 2), 212),
      faint(ripple(300, 228, 24, 2), 213),
      faint(ripple(196, 234, 28, 2), 214),
      faint(ripple(410, 232, 22, 2), 215),
      faint(level(200, 470, 242, 1), 216, { dash: '30 10 50 12' }),
      mark(steps(232, 256, 468, 1, 8, 217), 218, { wobble: 1 }),
    ],
  },
  {
    id: 'wean-low-tide',
    title: 'The open shore at low tide, wide and quiet',
    use: 'Closing, above the wordmark',
    size: [960, 240],
    strokes: [
      faint(level(40, 600, 70), 221, { dash: '90 14 50 18' }),
      faint(level(744, 920, 70), 222, { dash: '60 14 40 12' }),
      // a low island far out, its trees a soft edge
      ink([[600, 70], [612, 66], [620, 60], [628, 57], [636, 55], [644, 57], [652, 54], [660, 52], [668, 55], [676, 53], [684, 56], [694, 58], [706, 62], [720, 66], [744, 70]], 223, { wobble: 0.5, step: 6 }),
      // a post out on the flats
      ink([[836, 74], [837, 52]], 229, { wobble: 0.2, step: 6 }),
      detail([[833, 52], [841, 51]], 230, { step: 3 }),
      faint(level(120, 380, 44), 233, { dash: MIST }),
      faint(level(460, 700, 34), 234, { dash: MIST }),
      // tide pools and a few stones
      ink([[204, 178], [228, 172], [262, 171], [292, 174], [298, 180], [270, 185], [232, 186], [206, 182]], 235, { wobble: 0.6, step: 10 }),
      ink([[660, 192], [684, 187], [712, 188], [722, 194], [698, 198], [668, 197]], 236, { wobble: 0.6, step: 10 }),
      ...stone(330, 196, 9, 5, 237, { shade: 1 }),
      ...stone(346, 200, 6, 3, 238, { shade: 1 }),
      ...stone(780, 206, 8, 4, 239, { shade: 1 }),
      // ripple marks across the flats
      ...[[90, 168], [140, 174], [370, 170], [420, 176], [470, 168], [520, 182], [570, 176], [620, 186], [780, 180], [830, 188], [880, 178], [120, 206], [200, 214], [460, 210], [540, 220], [620, 214], [860, 220]]
        .map(([x, y], i) => faint(ripple(x, y, 28, 2), 240 + i)),
      mark(steps(40, 118, 920, 2, 6, 270), 271, { wobble: 1.2 }),
    ],
  },
];
