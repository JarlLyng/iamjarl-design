// IAMJARL marketing kit v1.32.0: generated from kit/wave.js, do not edit
// A waveform from real audio, as data (#91).
//
// TonVault's signature is the waveform of a sample on the card. A site feeds
// these functions the peaks of real audio at build time and inlines the SVG,
// so no JavaScript ships and the page shows the sound itself, not a picture
// of one. Unlike the drawings (kit/loose.js), the line is clean: a waveform is
// a measurement, and it should look like one.
//
// Pure and deterministic, like stairsPoints: the same input gives the same path.
//
//   peaksOf(samples, buckets)          -> the loudest absolute sample in each
//                                         of `buckets` equal runs, from 0 to 1
//   wavePath(peaks, box, { shape })    -> SVG path data
//
// shape "envelope" (the default) is one closed outline, mirrored about the
// middle, to be filled: kit.css's .ij-wave fills it with the accent and draws
// its edge in the text colour, so a light accent such as TonVault's lime still
// reads on a light page (lime on off-white is 1.1:1; the edge carries it).
// shape "bars" is one vertical stroke per peak, for a denser, digital look.

const round = n => Math.round(n * 10) / 10;

export function peaksOf(samples, buckets) {
  if (!samples?.length || !(buckets > 0)) throw new Error('peaksOf needs samples and a number of buckets');
  const out = [];
  const per = samples.length / buckets;
  let loudest = 0;
  for (let i = 0; i < buckets; i++) {
    let p = 0;
    for (let j = Math.floor(i * per), end = Math.max(Math.floor((i + 1) * per), j + 1); j < end && j < samples.length; j++) {
      p = Math.max(p, Math.abs(samples[j]));
    }
    out.push(p);
    loudest = Math.max(loudest, p);
  }
  // Normalised to the loudest bucket, so a quiet sample still fills its box.
  return loudest > 0 ? out.map(p => p / loudest) : out;
}

export function wavePath(peaks, { x = 0, y = 0, width, height } = {}, { shape = 'envelope', floor = 0.012 } = {}) {
  if (!Array.isArray(peaks) || peaks.length < 2) throw new Error('wavePath needs at least two peaks');
  if (!(width > 0) || !(height > 0)) throw new Error('wavePath needs a box with a width and a height');
  const mid = y + height / 2;
  const half = height / 2;
  const step = width / (peaks.length - 1);
  // A floor keeps silence visible as a hairline instead of nothing at all.
  const amp = p => Math.max(floor, Math.min(1, Math.abs(p))) * half;
  if (shape === 'bars') {
    return peaks.map((p, i) => `M${round(x + i * step)} ${round(mid - amp(p))}V${round(mid + amp(p))}`).join('');
  }
  if (shape !== 'envelope') throw new Error(`wavePath shape is "envelope" or "bars", not "${shape}"`);
  const top = peaks.map((p, i) => `${round(x + i * step)} ${round(mid - amp(p))}`);
  const bottom = peaks.map((p, i) => `${round(x + i * step)} ${round(mid + amp(p))}`).reverse();
  return `M${top[0]}L${top.slice(1).join('L')}L${bottom.join('L')}Z`;
}
