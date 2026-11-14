// App icons (#124): one Icon Composer .icon per app, built from a motif in
// icons/ and the app's family in tokens.json (brand.appIcons).
//
// A motif is a 1024 x 1024 SVG drawn in currentColor, with one line weight.
// The family gives it a ground and a line colour. The .icon carries:
//   icon.json                 the ground, one group, its layers, the platforms
//   Assets/<layer>.svg        the line colour
//   Assets/<layer>-dark.svg   the dark appearance's line, when it differs
//   Assets/<layer>-tinted.svg white, which the system tints
// Clear and tinted are the system's own, made from these layers. Nothing here
// draws the icon's shape: Icon Composer masks it, the same on iPhone and Mac.
//
// A motif with layers groups them at the top level:
//   <g data-layer="dim" data-opacity="0.4">…</g>
// and the first group listed is drawn on top. Without groups it is one layer,
// "symbol".
//
// Pure apart from reading the motif file, so build.js writes the bundles with
// it and the contract tests check them without Icon Composer.

import fs from 'node:fs';
import path from 'node:path';

// The family is the store's: an App Store app is an iPhone app, a Mac App
// Store app a Mac one.
export const FAMILY_OF_STORE = { 'app-store': 'iphone', 'mac-app-store': 'mac' };

export function iconApps(registry) {
  return registry.apps.filter(a => a.status === 'shipped' && a.icon);
}

function srgb(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  return `srgb:${r.toFixed(5)},${g.toFixed(5)},${b.toFixed(5)},1.00000`;
}

// The layers of a motif, in the order they are drawn, top first.
export function motifLayers(svg) {
  const body = svg.replace(/<!--[\s\S]*?-->/g, '').match(/<svg[^>]*>([\s\S]*)<\/svg>/)?.[1];
  if (body === undefined) throw new Error('not an SVG');
  const groups = [...body.matchAll(/<g data-layer="([a-z-]+)"(?: data-opacity="([\d.]+)")?>([\s\S]*?)<\/g>/g)];
  if (!groups.length) return [{ name: 'symbol', opacity: 1, body: body.trim() }];
  return groups.map(([, name, opacity, inner]) => ({ name, opacity: opacity ? Number(opacity) : 1, body: inner.trim() }));
}

// Which platforms the icon is for, from the app's own: an iPhone app's icon
// also serves its Mac and Watch builds, where it has them.
export function platformsFor(app) {
  const family = FAMILY_OF_STORE[app.store?.platform];
  if (family === 'mac') return { squares: ['macOS'] };
  const on = new Set(String(app.platform).split(',').map(s => s.trim()));
  const squares = ['iOS', ...(on.has('Mac') ? ['macOS'] : [])];
  return on.has('Watch') ? { squares, circles: ['watchOS'] } : { squares };
}

// The colours an app's icon takes: its family's, with the app's own dark line
// where it has one (WODrounds' lime).
export function iconColours(app, spec) {
  const family = spec.families[app.icon.family];
  if (!family) throw new Error(`Unknown icon family "${app.icon.family}" for "${app.id}"`);
  return {
    ground: family.ground,
    line: family.line,
    dark: { ground: family.dark.ground, line: app.icon.darkLine ?? family.dark.line },
    tinted: spec.tinted,
  };
}

const asset = (app, layer, colour, version) => [
  `<!-- IAMJARL app icon for ${app.name}, layer "${layer.name}": generated from icons/${app.icon.motif ?? app.id}.svg, do not edit. v${version} -->`,
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">',
  layer.body.replace(/currentColor/g, colour).split('\n').map(l => '  ' + l.trim()).join('\n'),
  '</svg>',
  '',
].join('\n');

// The bundle as { relative path: content }.
export function iconBundle(app, motifSvg, spec, version) {
  const c = iconColours(app, spec);
  const layers = motifLayers(motifSvg);
  const files = {};
  const jsonLayers = layers.map(layer => {
    const names = [{ value: `${layer.name}.svg` }];
    files[`Assets/${layer.name}.svg`] = asset(app, layer, c.line, version);
    if (c.dark.line !== c.line) {
      files[`Assets/${layer.name}-dark.svg`] = asset(app, layer, c.dark.line, version);
      names.push({ appearance: 'dark', value: `${layer.name}-dark.svg` });
    }
    files[`Assets/${layer.name}-tinted.svg`] = asset(app, layer, c.tinted, version);
    names.push({ appearance: 'tinted', value: `${layer.name}-tinted.svg` });
    return {
      name: layer.name,
      glass: spec.glass.layers,
      ...(layer.opacity < 1 ? { opacity: layer.opacity } : {}),
      'image-name-specializations': names,
    };
  });
  const icon = {
    'fill-specializations': [
      { value: { solid: srgb(c.ground) } },
      ...(c.dark.ground !== c.ground ? [{ appearance: 'dark', value: { solid: srgb(c.dark.ground) } }] : []),
    ],
    groups: [{
      name: app.name,
      layers: jsonLayers,
      shadow: { kind: spec.glass.shadow, opacity: spec.glass.shadowOpacity },
      translucency: { enabled: spec.glass.translucency, value: 0 },
      specular: spec.glass.specular,
    }],
    'supported-platforms': platformsFor(app),
  };
  files['icon.json'] = JSON.stringify(icon, null, 2) + '\n';
  return files;
}

export function readMotif(root, app) {
  return fs.readFileSync(path.join(root, 'icons', `${app.icon.motif ?? app.id}.svg`), 'utf-8');
}

// The extent of a motif's ink, as far as its numbers say: every coordinate,
// widened by half the line where an element is stroked. A curve's control
// points count too, so this can only overstate the extent, never miss it.
export function motifExtent(svg) {
  const xs = [], ys = [];
  const body = svg.replace(/<!--[\s\S]*?-->/g, '');
  for (const [el] of body.matchAll(/<(path|line|circle|rect)\b[^>]*\/>/g)) {
    const attr = n => { const m = el.match(new RegExp(`\\s${n}="([^"]+)"`)); return m ? m[1] : null; };
    const num = n => Number(attr(n));
    const half = attr('stroke-width') ? Number(attr('stroke-width')) / 2 : 0;
    const add = (x0, x1, y0, y1) => { xs.push(x0 - half, x1 + half); ys.push(y0 - half, y1 + half); };
    if (el.startsWith('<line')) add(Math.min(num('x1'), num('x2')), Math.max(num('x1'), num('x2')), Math.min(num('y1'), num('y2')), Math.max(num('y1'), num('y2')));
    else if (el.startsWith('<circle')) add(num('cx') - num('r'), num('cx') + num('r'), num('cy') - num('r'), num('cy') + num('r'));
    else if (el.startsWith('<rect')) add(num('x'), num('x') + num('width'), num('y'), num('y') + num('height'));
    else {
      // Absolute commands only: M L H V C Q Z.
      const d = attr('d');
      if (/[a-z]/.test(d.replace(/e-?\d/g, ''))) throw new Error(`relative path command in "${d.slice(0, 40)}…"`);
      let x = 0, y = 0;
      const px = [], py = [];
      for (const [, cmd, args] of d.matchAll(/([MLHVCQZ])([^MLHVCQZ]*)/g)) {
        const n = args.trim().split(/[\s,]+/).filter(Boolean).map(Number);
        if (cmd === 'H') for (const v of n) { x = v; px.push(x); py.push(y); }
        else if (cmd === 'V') for (const v of n) { y = v; px.push(x); py.push(y); }
        else for (let i = 0; i + 1 < n.length; i += 2) { x = n[i]; y = n[i + 1]; px.push(x); py.push(y); }
      }
      add(Math.min(...px), Math.max(...px), Math.min(...py), Math.max(...py));
    }
  }
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}
