// A small Chrome DevTools Protocol client, so the components can be tested in a
// real browser without breaking the zero-dependency promise: Node's built-in
// WebSocket, http and child_process, and the Chrome already on the machine —
// GitHub's Ubuntu runners ship it. No npm package is involved.
//
// It does only what the tests need: open a page, evaluate, press keys, resize,
// emulate media features, and collect console warnings.

import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];
const ON_PATH = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'];

export function findChrome() {
  for (const p of CANDIDATES) if (p && fs.existsSync(p)) return p;
  for (const name of ON_PATH) {
    try {
      const p = execFileSync('which', [name], { encoding: 'utf-8' }).trim();
      if (p) return p;
    } catch { /* not installed */ }
  }
  return null;
}

const KEYS = {
  Tab: { code: 'Tab', keyCode: 9 },
  Enter: { code: 'Enter', keyCode: 13, text: '\r' },
  Escape: { code: 'Escape', keyCode: 27 },
  ' ': { code: 'Space', keyCode: 32, text: ' ' },
};

export async function launch(chromePath) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ij-cdp-'));
  const args = [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--hide-scrollbars',
    // Ubuntu 24.04 restricts the user namespaces Chrome's sandbox needs. The
    // pages under test are this repo's own fixtures, served from localhost.
    ...(process.env.CI ? ['--no-sandbox'] : []),
    'about:blank',
  ];
  const proc = spawn(chromePath, args, { stdio: ['ignore', 'ignore', 'pipe'] });

  const wsUrl = await new Promise((resolve, reject) => {
    let buf = '';
    const timer = setTimeout(() => reject(new Error('Chrome did not start within 15s')), 15000);
    proc.stderr.on('data', d => {
      buf += d;
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) { clearTimeout(timer); resolve(m[1]); }
    });
    proc.on('exit', code => { clearTimeout(timer); reject(new Error(`Chrome exited (${code}): ${buf.slice(-500)}`)); });
  });

  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let nextId = 1;
  const pending = new Map();
  const listeners = new Set();
  ws.onmessage = ({ data }) => {
    const msg = JSON.parse(data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    } else if (msg.method) {
      for (const fn of listeners) fn(msg);
    }
  };
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });

  async function newPage() {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const call = (m, p) => send(m, p, sessionId);
    await call('Page.enable');
    await call('Runtime.enable');
    // A background headless page has no focus unless told to, and without it
    // Tab, :focus-visible and focus() all behave as if nothing were focused.
    await call('Emulation.setFocusEmulationEnabled', { enabled: true });

    const console_ = [];
    listeners.add(msg => {
      if (msg.sessionId === sessionId && msg.method === 'Runtime.consoleAPICalled') {
        console_.push({ type: msg.params.type, text: msg.params.args.map(a => a.value ?? a.description ?? '').join(' ') });
      }
    });

    const page = {
      console: console_,
      async goto(url) {
        console_.length = 0;
        const loaded = new Promise(res => {
          const fn = msg => {
            if (msg.sessionId === sessionId && msg.method === 'Page.loadEventFired') {
              listeners.delete(fn); res();
            }
          };
          listeners.add(fn);
        });
        await call('Page.navigate', { url });
        await loaded;
      },
      async eval(expression) {
        const r = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
        if (r.exceptionDetails) {
          throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
        }
        return r.result.value;
      },
      async key(name, { shift = false } = {}) {
        const k = KEYS[name];
        if (!k) throw new Error(`unknown key ${name}`);
        const base = { key: name, code: k.code, windowsVirtualKeyCode: k.keyCode, modifiers: shift ? 8 : 0 };
        await call('Input.dispatchKeyEvent', { type: k.text ? 'keyDown' : 'rawKeyDown', ...base, ...(k.text ? { text: k.text } : {}) });
        await call('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
      },
      async click(x, y) {
        for (const type of ['mousePressed', 'mouseReleased']) {
          await call('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
        }
      },
      async viewport(width, height = 800) {
        await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
      },
      async media(features) {
        await call('Emulation.setEmulatedMedia', { features });
      },
      // Let queued observers, transitions and media listeners run.
      settle(ms = 50) { return new Promise(r => setTimeout(r, ms)); },
    };
    return page;
  }

  async function close() {
    try { await send('Browser.close'); } catch { /* already gone */ }
    ws.close();
    await new Promise(r => { if (proc.exitCode !== null) r(); else proc.on('exit', r); });
    fs.rmSync(profile, { recursive: true, force: true });
  }

  return { newPage, close };
}
