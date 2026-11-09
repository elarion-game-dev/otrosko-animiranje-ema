// Local preview: builds the site, serves dist/ and rebuilds when files change.
// The site is served under the same path as on GitHub Pages (e.g. /otrosko-animiranje-ema/), so links
// behave exactly like on the live site. The admin page works here too: sign in with a token to save to
// GitHub, or choose local mode to save into this folder.

import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { watch } from 'node:fs';
import { readFile, stat, unlink, writeFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeSettings } from '../src/settings.mjs';
import { basePath } from '../src/util.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const port = Number(process.env.PORT) || 4321;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

let base = '';
async function readBase() {
  try {
    base = basePath(normalizeSettings(JSON.parse(await readFile(path.join(root, 'content', 'site.json'), 'utf8'))).site.url);
  } catch {
    base = '';
  }
}

// Returns a file path, { redirect } for directories without a trailing slash (like GitHub Pages), or null.
async function resolveFile(urlPath) {
  let clean;
  try {
    clean = decodeURIComponent(urlPath.split('?')[0]);
  } catch {
    return null; // malformed escape such as "/%"
  }
  if (base) {
    if (clean === '/' || clean === base) return { redirect: `${base}/` };
    if (!clean.startsWith(`${base}/`)) return null;
    clean = clean.slice(base.length);
  }
  const target = path.resolve(dist, '.' + clean);
  if (target !== dist && !target.startsWith(dist + path.sep)) return null;
  try {
    const info = await stat(target);
    if (info.isDirectory()) return clean.endsWith('/') ? resolveFile(base + clean + 'index.html') : { redirect: base + clean + '/' };
    return target;
  } catch {
    return null;
  }
}

// --- local mode -------------------------------------------------------------------------------
// The editor at /admin/ can save into the project folder ("Lokalni način"). Only files the editor
// normally commits are allowed, and only requests from this server's own page: a custom header can't be
// sent by another website without a CORS preflight, which this server never answers.

const LOCAL_FILES = /^(content\/site\.json|public\/admin\/access\.json|public\/assets\/uploads\/[a-z0-9-]{1,80}\.(webp|png|jpg|gif))$/;
const hash = (text) => createHash('sha1').update(text).digest('hex');

async function readBody(req, limit = 40 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new Error('Too large');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function local(req, res, action) {
  const send = (status, data) => {
    res.writeHead(status, { 'Content-Type': TYPES['.json'], 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(data));
  };
  // Only this machine's own addresses: a website that points its domain at 127.0.0.1 (DNS rebinding) would
  // otherwise pass the same-origin check below with its own Host header.
  const host = String(req.headers.host ?? '');
  const origin = req.headers.origin;
  const localHost = [`127.0.0.1:${port}`, `localhost:${port}`, `[::1]:${port}`].includes(host);
  if (!localHost || req.headers['x-local-admin'] !== '1' || (origin && origin !== `http://${host}`)) return send(403, { error: 'Forbidden' });
  try {
    if (action === 'ping') return send(200, { ok: true });
    if (action.startsWith('file')) {
      const file = new URL(action, 'http://x/').searchParams.get('path') ?? '';
      if (!LOCAL_FILES.test(file)) return send(400, { error: 'Not allowed' });
      const text = await readFile(path.join(root, file), 'utf8').catch(() => null);
      return text === null ? send(404, { error: 'Not found' }) : send(200, { sha: hash(text), text });
    }
    if (action === 'commit' && req.method === 'POST') {
      const { files, expect } = JSON.parse(await readBody(req));
      if (!Array.isArray(files) || !files.every((f) => LOCAL_FILES.test(f?.path ?? ''))) return send(400, { error: 'Not allowed' });
      if (expect && !LOCAL_FILES.test(expect.path ?? '')) return send(400, { error: 'Not allowed' });
      if (expect) {
        const current = await readFile(path.join(root, expect.path), 'utf8').catch(() => '');
        if (hash(current) !== expect.sha) return send(409, { error: 'Datoteka se je medtem spremenila.' });
      }
      const blobs = {};
      for (const f of files) {
        const target = path.join(root, f.path);
        if (f.delete) {
          await unlink(target).catch(() => {});
          continue;
        }
        const data = f.encoding === 'base64' ? Buffer.from(f.content, 'base64') : String(f.content);
        await writeFile(target, data);
        blobs[f.path] = hash(f.encoding === 'base64' ? '' : data);
      }
      console.log(`Lokalno shranjeno: ${files.map((f) => f.path).join(', ')}`);
      return send(200, { commit: { sha: hash(String(Date.now())) }, blobs });
    }
    return send(404, { error: 'Unknown' });
  } catch (error) {
    return send(500, { error: error.message });
  }
}

const server = http.createServer(async (req, res) => {
  const localPrefix = `${base}/__local/`;
  if ((req.url ?? '').startsWith(localPrefix)) return local(req, res, req.url.slice(localPrefix.length));
  const file = await resolveFile(req.url ?? '/');
  const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  if (file?.redirect) {
    res.writeHead(301, { ...headers, Location: file.redirect });
    res.end();
    return;
  }
  if (!file) {
    res.writeHead(404, { ...headers, 'Content-Type': TYPES['.html'] });
    res.end(await readFile(path.join(dist, '404.html')).catch(() => 'Not found'));
    return;
  }
  res.writeHead(200, { ...headers, 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  res.end(await readFile(file));
});

// Each rebuild runs in a fresh process, so edits to src/*.mjs are picked up (Node caches imported modules).
// One build at a time: two builds would delete and copy dist/ under each other. Changes that arrive during a
// build trigger exactly one more build after it.
let building = null;
let again = false;
async function rebuild() {
  if (building) {
    again = true;
    return building;
  }
  building = buildOnce();
  await building;
  building = null;
  if (again) {
    again = false;
    await rebuild();
  }
}

const buildOnce = () =>
  new Promise((resolve) => {
    execFile(process.execPath, [path.join(root, 'scripts', 'build.mjs')], async (error, stdout, stderr) => {
      process.stdout.write(stdout);
      if (error) console.error(stderr || error.message);
      await readBase();
      resolve();
    });
  });

await rebuild();
server.listen(port, '127.0.0.1', () => console.log(`Serving http://127.0.0.1:${port}${base}/  (admin: http://127.0.0.1:${port}${base}/admin/)`));

let timer;
for (const dir of ['src', 'public', 'content', 'scripts']) {
  watch(path.join(root, dir), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(rebuild, 150);
  });
}
