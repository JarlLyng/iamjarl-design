#!/usr/bin/env node

// Prints the CHANGELOG.md section for a given version, for use as GitHub
// release notes. Defaults to tokens.json's meta.version.
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

  console.log(notes);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
