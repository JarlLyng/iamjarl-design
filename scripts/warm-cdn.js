#!/usr/bin/env node

// Warms jsDelivr for a release (#100), so a site's first visitor never waits on
// a cold cache.
//
// jsDelivr's /gh/ path fetches a file from GitHub the first time anyone asks for
// it at a tag, and that first fetch is the one that fails. On 2026-10-14 v1.32.0
// answered 503 "No healthy backends" for minutes after it was tagged, while
// v1.31.0, already cached, was fine. A tagged file never changes, so once
// jsDelivr holds it, it serves it from its own cache.
//
// This asks for every published file right after the release and retries each
// one until it is served. Where dist/sri.json has a hash, the file must also
// match it.
//
//   node scripts/warm-cdn.js            # the version in tokens.json
//   node scripts/warm-cdn.js 1.32.1
//
// Exits non-zero if a file still isn't served by the deadline, so the release
// run shows it.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CDN = 'https://cdn.jsdelivr.net/gh/jarllyng/iamjarl-design';
const PUBLISHED = ['dist', 'fonts', 'badges'];

// Every file a site can load from the tag: what package.json publishes, less
// the docs. Paths are relative to the repo, as sri.json and the CDN name them.
export function filesToWarm(root = ROOT) {
  const out = [];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(rel);
      else if (e.isFile() && !e.name.startsWith('.')) out.push(rel);
    }
  };
  for (const dir of PUBLISHED) if (fs.existsSync(path.join(root, dir))) walk(dir);
  return out.sort();
}

const sha384 = buf => `sha384-${crypto.createHash('sha384').update(buf).digest('base64')}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function warmOne(url, want, deadline) {
  let wait = 5000, last = '';
  while (true) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
      const body = Buffer.from(await res.arrayBuffer());
      if (res.status === 200 && (!want || sha384(body) === want)) return null;
      last = res.status === 200 ? 'hash differs from sri.json' : `HTTP ${res.status}`;
    } catch (err) {
      last = err.name === 'TimeoutError' ? 'timed out' : err.message;
    }
    if (Date.now() + wait > deadline) return last;
    await sleep(wait);
    wait = Math.min(wait * 2, 60000);
  }
}

async function main() {
  const version = process.argv[2] ?? JSON.parse(fs.readFileSync(path.join(ROOT, 'tokens.json'), 'utf-8')).meta.version;
  const sri = JSON.parse(fs.readFileSync(path.join(ROOT, 'dist/sri.json'), 'utf-8'));
  const hashes = sri.version === version ? sri.files : {};
  const files = filesToWarm();
  const deadline = Date.now() + 15 * 60 * 1000;
  console.log(`Warming ${files.length} files of v${version} on jsDelivr…`);

  const failed = [];
  const queue = [...files];
  await Promise.all(Array.from({ length: 16 }, async () => {
    for (let f; (f = queue.shift()); ) {
      const why = await warmOne(`${CDN}@v${version}/${f}`, hashes[f], deadline);
      if (why) failed.push(`${f}: ${why}`);
    }
  }));

  if (failed.length) {
    console.error(`\n${failed.length} of ${files.length} files not served after 15 minutes:\n  ${failed.join('\n  ')}`);
    process.exit(1);
  }
  console.log(`All ${files.length} files served${Object.keys(hashes).length ? `, ${Object.keys(hashes).length} matching sri.json` : ''}.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
