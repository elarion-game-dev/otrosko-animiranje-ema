// Local mode: with `npm run dev`, the editor can save straight into the project folder instead of GitHub.
// Same interface as the GitHub client in github.js. Only offered on 127.0.0.1 / localhost, and the dev
// server only accepts these requests from its own page (see scripts/dev.mjs).

import { ConflictError, GitHubError } from './github.js';

const HEADERS = { 'X-Local-Admin': '1' };

export const isLocalHost = () => ['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname);

export async function localAvailable(base) {
  if (!isLocalHost()) return false;
  try {
    const response = await fetch(`${base}/__local/ping`, { headers: HEADERS, cache: 'no-store' });
    return response.ok;
  } catch {
    return false;
  }
}

export class LocalRepo {
  constructor(base) {
    this.base = base;
    this.local = true;
  }

  async request(path, options = {}) {
    const response = await fetch(`${this.base}/__local/${path}`, { ...options, headers: { ...HEADERS, ...(options.body ? { 'Content-Type': 'application/json' } : {}) }, cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (response.status === 409) throw new ConflictError(data.error || 'Datoteka se je medtem spremenila.');
    if (!response.ok) throw new GitHubError(response.status, data.error || response.statusText);
    return data;
  }

  async user() {
    return { login: 'lokalno', name: '' };
  }

  async repository() {
    return {};
  }

  readFile(path) {
    return this.request(`file?path=${encodeURIComponent(path)}`);
  }

  commit({ files, expect }) {
    return this.request('commit', { method: 'POST', body: JSON.stringify({ files, expect }) });
  }

  // Versions live in git here: `git log content/site.json`.
  async history() {
    return [];
  }

  async latestRun() {
    return null;
  }
}
