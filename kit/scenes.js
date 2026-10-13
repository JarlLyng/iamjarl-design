// Photo scenes with the one magenta line (#90).
//
// Wean's and Walkful's drawings didn't hold up next to the type and the app
// captures, so the owner chose photographs for their mood instead (2026-10-13):
// a real place, made monochrome and quiet by the kit's scene, with the brief's
// one magenta line drawn on it by hand. On Walkful it is the walked path, on
// Wean the waterline, which always falls from left to right.
//
// Each scene names its photo (free under the Unsplash License, no faces, no
// brands) and the line as points in the photo's own pixels, as it is shown:
// for a mirrored photo, in the mirrored picture. The build draws the
// line through the loose stroke into an SVG the size of the photo; with
// preserveAspectRatio "xMidYMid slice" it crops exactly as the photo does under
// object-fit: cover, so the line stays on the path at any width.
//
// The photos stay with the sites; nothing here ships them. A site downloads the
// photo, or loads it from Unsplash, and inlines the line.

export const SCENES = [
  {
    id: 'wean-tidal-flats',
    app: 'wean-nicotine',
    title: 'Tidal flats under a grey sky, the water drawing back',
    use: 'A band of its own between sections',
    photo: { unsplash: 'okDw1STxJZ8', src: 'photo-1780565855583-161615b9f0a9', by: 'Julia Taubitz', size: [1600, 1067] },
    // The water's edge rises to the right in the photo, so it is shown mirrored
    // and the line falls left to right, as Wean's allowance does.
    mirrored: true,
    line: [[0, 680], [100, 681], [200, 683], [300, 686], [350, 690], [400, 693], [500, 699], [600, 705], [700, 712],
      [800, 720], [900, 729], [1000, 737], [1100, 744], [1200, 752], [1300, 760], [1400, 768], [1500, 778], [1600, 788]],
    seed: 31,
  },
  {
    id: 'wean-low-tide',
    app: 'wean-nicotine',
    title: 'Wide tidal flats under an overcast sky',
    use: 'Behind the closing wordmark',
    photo: { unsplash: 'tEiP7X6u3Yc', src: 'photo-1780565854848-ab87b775c47d', by: 'Julia Taubitz', size: [1600, 1067] },
    mirrored: false,
    line: null,
  },
  {
    id: 'walkful-path-in-fog',
    app: 'walkful',
    title: 'A path worn through the grass, between trees in fog',
    use: 'A band of its own between sections',
    photo: { unsplash: 'ZrQZf1xY8KQ', src: 'photo-1760283467156-90141d225116', by: 'Luca Volpe', size: [1600, 1067] },
    mirrored: false,
    // the middle of the worn path, from the near edge into the gap between the pines
    line: [[905, 1067], [866, 1000], [812, 930], [758, 860], [716, 790], [700, 730], [708, 680], [730, 645], [752, 618]],
    seed: 47,
  },
  {
    id: 'walkful-worn-path',
    app: 'walkful',
    title: 'A narrow worn path through grass, under large trees',
    use: 'Behind the closing wordmark',
    photo: { unsplash: '6KCyb6eoWmY', src: 'photo-1784859499528-02ecc1df6dda', by: 'zhao sky', size: [1600, 1067] },
    mirrored: false,
    line: null,
  },
];
