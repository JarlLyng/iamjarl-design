#!/usr/bin/env node
// Compares the store facts in apps.json with what the App Store says now, using
// Apple's public lookup API. The store button prints apps.json, so a price or an
// OS floor changed in App Store Connect and not here would put a wrong fact on
// every site (#58).
//
//   node scripts/check-store-facts.js           prints the comparison; exit 1 on drift
//   node scripts/check-store-facts.js --issue   also keeps ONE issue in this repo
//                                               up to date, and closes it when the
//                                               facts agree again (CI, weekly)
//
// It reports and never edits: whether a price changed on purpose is the owner's
// call. The Chrome Web Store has no comparable API, and both extensions are free.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { LOCALES } from '../components/store.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ISSUE_TITLE = 'Store facts differ from the App Store';
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps.json'), 'utf-8'));
const apps = registry.apps.filter(a => a.status === 'shipped' && ['app-store', 'mac-app-store'].includes(a.store?.platform));

async function lookup(id, front) {
  const url = `https://itunes.apple.com/lookup?id=${id}&country=${front}`;
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()).results?.[0] ?? null;
    } catch (e) {
      if (attempt === 3) throw new Error(`${url}: ${e.message}`);
      await new Promise(r => setTimeout(r, attempt * 2000));
    }
  }
}

const drift = [];
let checked = 0;
for (const app of apps) {
  const s = app.store;
  const fronts = [...new Set(s.locales.map(l => LOCALES[l].front))];
  for (const front of fronts) {
    const live = await lookup(s.id, front);
    checked++;
    if (!live) { drift.push([app.id, front, 'listing', 'listed', 'not found']); continue; }
    if (live.formattedPrice !== s.price[front]) drift.push([app.id, front, 'price', s.price[front], live.formattedPrice]);
    if (front === 'us' && live.minimumOsVersion !== s.minOS) drift.push([app.id, front, 'minOS', s.minOS, live.minimumOsVersion]);
  }
}

const table = [
  '| App | Storefront | Field | apps.json | App Store |',
  '|---|---|---|---|---|',
  ...drift.map(r => `| ${r.map(c => `\`${String(c).replace(/ /g, ' ')}\``).join(' | ')} |`),
].join('\n');
const summary = drift.length
  ? `**${drift.length} difference(s)** across ${checked} storefront lookups.\n\n${table}`
  : `All ${checked} storefront lookups agree with \`apps.json\`.`;
console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);

if (process.argv.includes('--issue')) {
  const gh = (...args) => execFileSync('gh', args, { encoding: 'utf-8' }).trim();
  const open = JSON.parse(gh('issue', 'list', '--state', 'open', '--search', `in:title "${ISSUE_TITLE}"`, '--json', 'number,title'))
    .find(i => i.title === ISSUE_TITLE);
  if (drift.length) {
    const body = `The store button prints \`apps.json\`, and the App Store now says something else:\n\n${table}\n\n` +
      'If the store is right, update `apps.json` and release. If `apps.json` is right, fix the listing in App Store Connect.\n\n' +
      '_Kept up to date by `.github/workflows/store-facts.yml`, which checks weekly and closes this issue when the facts agree. It never edits `apps.json` itself._';
    if (open) gh('issue', 'edit', String(open.number), '--body', body);
    else gh('issue', 'create', '--title', ISSUE_TITLE, '--body', body);
  } else if (open) {
    gh('issue', 'close', String(open.number), '--comment', `The facts agree again (${checked} storefront lookups).`);
  }
  process.exit(0);
}
process.exit(drift.length ? 1 : 0);
