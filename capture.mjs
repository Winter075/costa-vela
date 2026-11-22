// Temporary build tool: drive headless Chrome over the DevTools Protocol to take
// real JPEG captures of the running Costa Vela game. Not part of the game.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;
const profile = mkdtempSync(join(tmpdir(), 'costa-chrome-'));
const chrome = spawn(CHROME, [
  '--headless=new',
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--enable-unsafe-swiftshader',
  '--use-gl=angle',
  '--use-angle=swiftshader',
  '--hide-scrollbars',
  '--window-size=1280,720',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
let nextId = 1;
const pending = new Map();
const errors = [];

function send(method, params = {}) {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

try {
  let version = null;
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) { version = await r.json(); break; }
    } catch { /* not up yet */ }
    await sleep(200);
  }
  if (!version) throw new Error('Chrome did not start');

  const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const page = targets.find((t) => t.type === 'page');
  if (!page) throw new Error('No page target');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      errors.push('EXCEPTION: ' + (msg.params.exceptionDetails.text ?? '') + ' ' + (msg.params.exceptionDetails.exception?.description ?? ''));
    } else if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      errors.push('LOG: ' + msg.params.entry.text);
    } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      errors.push('CONSOLE: ' + msg.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
    }
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });

  const jobs = [
    { url: 'http://127.0.0.1:8080/?shot=cover', out: 'screenshots/01-cover.jpg', wait: 4500 },
    { url: 'http://127.0.0.1:8080/?shot=street', out: 'screenshots/02-street.jpg', wait: 4500 },
    { url: 'http://127.0.0.1:8080/?shot=sunset', out: 'screenshots/03-sunset.jpg', wait: 4500 },
    { url: 'http://127.0.0.1:8080/?shot=garage', out: 'screenshots/04-garage.jpg', wait: 4500 },
  ];

  for (const job of jobs) {
    await send('Page.navigate', { url: job.url });
    await sleep(job.wait);
    const shot = await send('Page.captureScreenshot', {
      format: 'jpeg', quality: 75, captureBeyondViewport: false, fromSurface: true,
    });
    writeFileSync(job.out, Buffer.from(shot.data, 'base64'));
    console.log('captured', job.out);
  }
  console.log('ERRORS', JSON.stringify(errors, null, 2));
} finally {
  if (ws) ws.close();
  chrome.kill('SIGKILL');
}
