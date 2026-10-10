#!/usr/bin/env node

// Prints the CHANGELOG.md section for a given version, for use as GitHub
// release notes, followed by the version's integrity hashes when dist/sri.json
// is for that version. Defaults to tokens.json's meta.version.
//
//   node scripts/release-notes.js          # current version
//   node scripts/release-notes.js 1.1.0    # a specific one
//
// Exits non-zero if the version has no section, so CI fails loudly rather
// than publishing an empty release.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

export function extractNotes(changelog, version) {
  const lines = changelog.split('\n');
  const start = lines.findIndex(l => l.startsWith(`## [${version}]`));
  if (start === -1) return null;

  // Run to the next release heading, or to the link-reference block that
  // closes the file.
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## [') || /^\[\d+\.\d+\.\d+\]:/.test(lines[i])) {
      end = i;
      break;
    }
  }

  return lines.slice(start + 1, end).join('\n').trim();
}

// The integrity hash of every file a site loads from the CDN, for this tag.
// Sites computed them by hand from the CDN file whenever a release's notes
// left them out (#63); dist/sri.json has them, so every release now carries
// them. Empty when sri.json belongs to another version.
export function sriNotes(sri, version) {
  if (sri?.version !== version) return '';
  const cdn = `https://cdn.jsdelivr.net/gh/jarllyng/iamjarl-design@v${version}/`;
  return [
    '### Integrity hashes',
    '',
    `For the files at \`${cdn}\`. Paste the hash into \`integrity\`, with \`crossorigin="anonymous"\`.`,
    '',
    '| File | `integrity` |',
    '|---|---|',
    ...Object.entries(sri.files).map(([f, h]) => `| \`${f}\` | \`${h}\` |`),
  ].join('\n');
}

function main() {
  const version =
    process.argv[2] ||
    JSON.parse(fs.readFileSync(path.join(root, 'tokens.json'), 'utf-8')).meta.version;

  const changelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf-8');
  const notes = extractNotes(changelog, version);

  if (!notes) {
    console.error(`No CHANGELOG.md section found for ${version}`);
    process.exit(1);
  }

  const sriPath = path.join(root, 'dist', 'sri.json');
  const sri = fs.existsSync(sriPath) ? JSON.parse(fs.readFileSync(sriPath, 'utf-8')) : null;
  console.log([notes, sriNotes(sri, version)].filter(Boolean).join('\n\n'));
}

if (import.meta.url === `file://${process.argv[1]}`) main();
