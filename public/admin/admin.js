// Urejevalnik (admin): edits content/site.json in the GitHub repository and shows a live preview.
// There is no server. GitHub checks the token on every request, and every publish is a commit that
// triggers the deploy workflow. Sign-in is with a GitHub token, or with a password that unlocks an
// encrypted token (see access.js).

import { DEPLOY, VERSION } from '../assets/lib/deploy.mjs';
import { ANCHORS, LANG_INFO, pagePath } from '../assets/lib/i18n.mjs';
import { pageForPath, previewPages, renderPage, themeExtras } from '../assets/lib/render.mjs';
import { DEFAULT_SETTINGS, missingTranslations, normalizeSettings } from '../assets/lib/settings.mjs';
import { FONTS, PRESETS, PRESET_KEYS, fontFaces, fontStack, themeCss } from '../assets/lib/themes.mjs';
import { getPath, setPath, slugify } from '../assets/lib/util.mjs';
import { decryptToken, encryptToken, loadAccess } from './access.js';
import { ConflictError, GitHub } from './github.js';
import { LocalRepo, localAvailable } from './local.js';
import { PANELS, panelForPath } from './panels.js';
import { LANG_CODES, confirmDialog, h, icon, toast } from './ui.js';

// Clickjacking protection: GitHub Pages can't send frame-ancestors, and <meta> CSP can't set it.
if (window.top !== window.self) {
  document.documentElement.replaceChildren();
  throw new Error('The admin page refuses to run inside a frame.');
}

const SETTINGS_PATH = 'content/site.json';
const ACCESS_PATH = 'public/admin/access.json';
const TOKEN_KEY = `${DEPLOY.repo}-admin-token`;
const LOCAL_KEY = `${DEPLOY.repo}-admin-local`;
const TOKEN_PATTERN = /^(github_pat_|ghp_|gho_)[A-Za-z0-9_]{20,255}$/;
const DESKTOP_WIDTH = 1280;
const MOBILE_WIDTH = 390;
// Where the site lives, taken from this page's own address: "/otrosko-animiranje-ema" on GitHub Pages.
const SITE_BASE = location.pathname.replace(/\/admin(\/.*)?$/, '');
const SITE_ROOT = `${location.origin}${SITE_BASE}`;
const root = document.getElementById('app');

const serialize = (settings) => JSON.stringify(settings, null, 2) + '\n';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const app = {
  repo: DEPLOY,
  siteRoot: SITE_ROOT,
  siteBase: SITE_BASE,
  gh: null,
  user: null,
  token: '',
  remembered: false,
  access: null,
  settings: null,
  savedJson: '',
  fileSha: '',
  uploads: new Map(),
  blobUrls: new Map(),
  open: new Set(),
  panel: PANELS.some((p) => p.id === location.hash.slice(1)) ? location.hash.slice(1) : 'overview',
  lang: 'sl',
  previewPage: 'home',
  previewSuccess: false,
  // On a phone the preview opens full screen, so show the site as a phone sees it.
  device: window.matchMedia('(max-width: 760px)').matches ? 'mobile' : 'desktop',
  publishing: false,

  get: (path) => getPath(app.settings, path),
  set(path, value) {
    remember(path);
    setPath(app.settings, path, value);
    changed();
  },
  /** Put one setting back to its published value. */
  revert(path) {
    lastEdit = { path: '', time: 0 };
    app.set(path, structuredClone(getPath(savedSettings(), path)));
    lastEdit = { path: '', time: 0 };
    app.rerender();
  },
  normalized: () => normalizeSettings(app.settings),
  rerender: () => renderPanel(),
  goto(id, { follow = true } = {}) {
    app.panel = id;
    history.replaceState(null, '', `#${id}`);
    renderNav();
    renderPanel();
    const panel = PANELS.find((p) => p.id === id);
    if (follow && panel?.page) setPreviewPage(panel.page, panel.anchor ? ANCHORS[panel.anchor]?.[app.lang] : '');
    ui.editor?.focus({ preventScroll: true });
    ui.editor?.scrollTo(0, 0);
  },
  setLang,
  editField,
  setPreviewSuccess(show) {
    app.previewSuccess = show;
    renderPanel();
    pendingAnchor = ANCHORS.contact[app.lang];
    if (app.previewPage !== 'home') setPreviewPage('home', pendingAnchor);
    else renderPreview();
  },
  previewAnchor(section) {
    setPreviewPage('home', ANCHORS[section]?.[app.lang] ?? '');
  },
  isOpen: (key) => app.open.has(key),
  setOpen: (key, open) => (open ? app.open.add(key) : app.open.delete(key)),
  imageSrc: (path) => app.blobUrls.get(path) ?? SITE_BASE + path,
  upload: processUpload,
  applyPreset,
  loadHistory: () => app.gh.history(SETTINGS_PATH),
  loadVersion,
  exportJson,
  importJson,
  resetDefaults,
  saveAccess,
  removeAccess,
};

const ui = {};

// --- undo / redo ---------------------------------------------------------------------------
// Snapshots of the whole draft. Typing in one field within a short pause counts as one step.

const UNDO_LIMIT = 200;
const undoStack = [];
const redoStack = [];
let lastEdit = { path: '', time: 0 };

function remember(path = '') {
  const now = Date.now();
  const sameEdit = path && path === lastEdit.path && now - lastEdit.time < 1000;
  lastEdit = { path, time: now };
  if (sameEdit) return;
  undoStack.push(JSON.stringify(app.settings));
  if (undoStack.length > UNDO_LIMIT) undoStack.shift();
  redoStack.length = 0;
}

function step(from, to) {
  if (!from.length || app.publishing) return;
  to.push(JSON.stringify(app.settings));
  app.settings = JSON.parse(from.pop());
  lastEdit = { path: '', time: 0 };
  const focused = document.activeElement?.dataset?.path;
  changed();
  renderPanel();
  if (focused) ui.editor.querySelector(`[data-path="${CSS.escape(focused)}"]`)?.focus({ preventScroll: true });
}

const undo = () => step(undoStack, redoStack);
const redo = () => step(redoStack, undoStack);

let savedCache = { json: '', settings: null };
function savedSettings() {
  if (savedCache.json !== app.savedJson) savedCache = { json: app.savedJson, settings: JSON.parse(app.savedJson) };
  return savedCache.settings;
}

/** Show each field's revert button only while its value differs from the published one. */
function updateReverts() {
  if (!ui.editor) return;
  const buttons = ui.editor.querySelectorAll('[data-revert]');
  if (!buttons.length) return;
  const now = app.normalized();
  const saved = savedSettings();
  for (const button of buttons) {
    const path = button.dataset.revert;
    const before = getPath(saved, path);
    const differs = JSON.stringify(getPath(now, path)) !== JSON.stringify(before);
    button.hidden = !differs;
    if (differs) button.title = before === undefined ? 'Odstrani: to še ni bilo objavljeno' : `Nazaj na objavljeno${typeof before === 'object' ? '' : `: ${String(before).slice(0, 60) || '(prazno)'}`}`;
  }
}

// --- token storage ---------------------------------------------------------------------

function storedToken() {
  try {
    const session = sessionStorage.getItem(TOKEN_KEY);
    if (session) return { token: session, remembered: false };
    const local = localStorage.getItem(TOKEN_KEY);
    return local ? { token: local, remembered: true } : null;
  } catch {
    return null;
  }
}

function storeToken(token, keep) {
  try {
    clearToken();
    (keep ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  } catch {
    // storage unavailable (private mode): the session simply won't survive a reload
  }
}

function clearToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

function explain(error) {
  if (error.status === 401) return app.access ? 'Dostop je potekel ali je bil preklican. Prosite skrbnika strani za nov dostop.' : 'GitHub ni sprejel žetona. Morda je napačno prepisan, potekel ali preklican.';
  if (error.status === 404) return `Ta žeton ne vidi repozitorija ${app.repo.owner}/${app.repo.repo}. Pri ustvarjanju izberite »Only select repositories« in ${app.repo.repo}.`;
  if (error.status === 403) return /rate limit/i.test(error.message) ? 'GitHub je začasno omejil število zahtev. Počakajte nekaj minut in poskusite znova.' : `GitHub je zavrnil zahtevo: ${error.message}. Preverite, da ima žeton dovoljenje »Contents: Read and write«.`;
  if (error instanceof TypeError) return 'Povezave z GitHubom ni mogoče vzpostaviti. Preverite internetno povezavo.';
  return error.message || 'Nekaj je šlo narobe.';
}

// --- sign in ---------------------------------------------------------------------------

function tokenUrl() {
  const params = new URLSearchParams({
    name: `${app.repo.repo} admin`.slice(0, 40),
    description: `Urejevalnik na ${SITE_ROOT}/admin/ ureja spletno stran.`,
    target_name: app.repo.owner,
    expires_in: '366',
    contents: 'write',
    actions: 'read',
  });
  return `https://github.com/settings/personal-access-tokens/new?${params}`;
}

function mark() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 64 64');
  svg.setAttribute('class', 'mark');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = '<path fill="currentColor" d="M32 4C19.8 4 11 13.4 11 24.6 11 37.4 21.4 48 32 48s21-10.6 21-23.4C53 13.4 44.2 4 32 4z"/><path fill="currentColor" d="m28 47-2.5 5h13L36 47z"/><path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" d="M32 52c0 4-4 5-4 9"/>';
  return svg;
}

function brandLine(name = '') {
  return h('div', { class: 'login-brand' }, mark(), h('span', {}, name || 'Spletna stran'), h('span', { class: 'login-tag' }, 'urejanje'));
}

function rememberBox() {
  const box = h('input', { type: 'checkbox', id: 'remember' });
  const label = h('label', { class: 'check', for: 'remember' }, box, h('span', {}, 'Ostani prijavljen/-a na tej napravi. Na skupnih računalnikih tega ne vklopite: brez kljukice se odjavite, ko zaprete zavihek.'));
  return { box, label };
}

/** Sign-in with the site password (when an access file is published). */
function showPasswordLogin(message) {
  document.title = 'Prijava · Urejanje';
  const input = h('input', { type: 'password', id: 'password', class: 'input', autocomplete: 'current-password', required: true });
  const keep = rememberBox();
  const error = h('p', { class: 'login-error', role: 'alert', hidden: !message }, message ?? '');
  const button = h('button', { type: 'submit', class: 'btn btn-primary btn-block' }, 'Vstopi');
  const form = h(
    'form',
    {
      class: 'login-card',
      onsubmit: async (event) => {
        event.preventDefault();
        button.disabled = true;
        button.textContent = 'Preverjam …';
        const token = await decryptToken(app.access, input.value);
        if (!token) {
          error.textContent = 'Geslo ni pravilno. Poskusite znova.';
          error.hidden = false;
          button.disabled = false;
          button.textContent = 'Vstopi';
          input.select();
          return;
        }
        try {
          await signIn(token, keep.box.checked);
          storeToken(token, keep.box.checked);
        } catch (e) {
          error.textContent = explain(e);
          error.hidden = false;
          button.disabled = false;
          button.textContent = 'Vstopi';
        }
      },
    },
    brandLine(app.access.label),
    h('h1', {}, 'Urejanje spletne strani'),
    h('p', { class: 'muted' }, 'Vpišite geslo, ki ste ga dobili.'),
    h('label', { class: 'field-label', for: 'password' }, 'Geslo'),
    input,
    keep.label,
    error,
    button,
    h('button', { type: 'button', class: 'login-alt', onclick: () => showTokenLogin() }, 'Prijava z žetonom GitHub (za skrbnika)'),
    localButton()
  );
  root.replaceChildren(h('div', { class: 'login' }, form));
  input.focus();
}

function showTokenLogin(message) {
  document.title = 'Prijava · Urejanje';
  const input = h('input', { type: 'password', id: 'token', class: 'input mono', autocomplete: 'off', spellcheck: 'false', placeholder: 'github_pat_…', required: true });
  const keep = rememberBox();
  const error = h('p', { class: 'login-error', role: 'alert', hidden: !message }, message ?? '');
  const button = h('button', { type: 'submit', class: 'btn btn-primary btn-block' }, 'Prijava');

  const form = h(
    'form',
    {
      class: 'login-card',
      onsubmit: async (event) => {
        event.preventDefault();
        const token = input.value.trim();
        if (!TOKEN_PATTERN.test(token)) {
          error.textContent = 'To ni videti kot žeton GitHub. Žetoni se začnejo z »github_pat_«.';
          error.hidden = false;
          return;
        }
        button.disabled = true;
        button.textContent = 'Preverjam pri GitHubu …';
        try {
          await signIn(token, keep.box.checked);
          storeToken(token, keep.box.checked);
        } catch (e) {
          error.textContent = explain(e);
          error.hidden = false;
          button.disabled = false;
          button.textContent = 'Prijava';
        }
      },
    },
    brandLine(),
    h('h1', {}, 'Prijava z žetonom GitHub'),
    h('p', { class: 'muted' }, 'Urejevalnik shranjuje spremembe v repozitorij ', h('strong', {}, `${app.repo.owner}/${app.repo.repo}`), '. Žeton preverja GitHub; nikamor drugam se ne pošilja.'),
    h(
      'ol',
      { class: 'steps' },
      h(
        'li',
        {},
        h('a', { href: tokenUrl(), target: '_blank', rel: 'noopener noreferrer' }, 'Ustvarite žeton na GitHubu', icon('external', 'icon icon-xs')),
        '. Ime in dovoljenja so že izpolnjeni (Contents: read & write, Actions: read). Pod ',
        h('strong', {}, 'Repository access'),
        ' izberite ',
        h('strong', {}, 'Only select repositories'),
        ` → ${app.repo.repo}.`
      ),
      h('li', {}, 'Prilepite žeton sem.')
    ),
    h('label', { class: 'field-label', for: 'token' }, 'Žeton'),
    input,
    keep.label,
    error,
    button,
    app.access ? h('button', { type: 'button', class: 'login-alt', onclick: () => showPasswordLogin() }, 'Nazaj na prijavo z geslom') : null,
    localButton(),
    h('p', { class: 'login-foot muted' }, icon('lock', 'icon icon-xs'), 'Izgubljena naprava? Žeton prekličete na github.com/settings/personal-access-tokens.')
  );

  root.replaceChildren(h('div', { class: 'login' }, form));
  input.focus();
}

const showLogin = (message) => (app.access ? showPasswordLogin(message) : showTokenLogin(message));

async function signIn(token, remembered) {
  await open(new GitHub({ token, ...DEPLOY }), { token, remembered });
}

/** Local mode (npm run dev only): saves into the project folder instead of GitHub. */
async function signInLocal() {
  await open(new LocalRepo(SITE_BASE), { token: '', remembered: false });
  try {
    sessionStorage.setItem(LOCAL_KEY, '1');
  } catch {
    // ignore
  }
}

async function open(gh, { token, remembered }) {
  const [user] = await Promise.all([gh.user(), gh.repository()]);
  const file = await gh.readFile(SETTINGS_PATH);
  const settings = normalizeSettings(JSON.parse(file.text));
  Object.assign(app, { gh, user, token, remembered, local: Boolean(gh.local), fileSha: file.sha, savedJson: serialize(settings), settings: structuredClone(settings) });
  showWorkspace();
  refreshDeployStatus();
}

function localButton() {
  return app.localAvailable
    ? h('button', { type: 'button', class: 'login-alt', onclick: () => signInLocal().catch((e) => toast(explain(e), 'error')) }, 'Lokalni način: shrani v mapo projekta (samo npm run dev)')
    : null;
}

function signOut() {
  clearToken();
  try {
    sessionStorage.removeItem(LOCAL_KEY);
  } catch {
    // ignore
  }
  for (const url of app.blobUrls.values()) URL.revokeObjectURL(url);
  Object.assign(app, { gh: null, user: null, token: '', settings: null, savedJson: '', fileSha: '' });
  app.uploads.clear();
  app.blobUrls.clear();
  undoStack.length = 0;
  redoStack.length = 0;
  showLogin('Odjavljeni ste.');
}

// --- workspace --------------------------------------------------------------------------

function showWorkspace() {
  ui.status = h('span', { class: 'status-text' });
  ui.dot = h('span', { class: 'status-dot' });
  ui.deploy = h('a', { class: 'deploy-pill', target: '_blank', rel: 'noopener noreferrer', dataset: { state: 'idle' } }, h('span', { class: 'deploy-dot' }), h('span', { class: 'deploy-text' }, ''));
  ui.publish = h('button', { type: 'button', class: 'btn btn-primary', onclick: () => publish() }, 'Objavi');
  ui.undo = h('button', { type: 'button', class: 'icon-btn', title: 'Razveljavi (Ctrl+Z)', 'aria-label': 'Razveljavi', onclick: undo }, icon('undo'));
  ui.redo = h('button', { type: 'button', class: 'icon-btn', title: 'Uveljavi znova (Ctrl+Shift+Z)', 'aria-label': 'Uveljavi znova', onclick: redo }, icon('redo'));
  ui.discard = h('button', { type: 'button', class: 'btn btn-ghost', onclick: discard }, 'Zavrzi');
  ui.nav = h('nav', { class: 'sidebar', 'aria-label': 'Kaj želite urediti' });
  ui.editor = h('main', { class: 'editor', id: 'editor', tabindex: '-1' });
  ui.langTabs = h('div', { class: 'lang-tabs', role: 'group', 'aria-label': 'Jezik urejanja' });

  const account = h(
    'details',
    { class: 'account' },
    h('summary', { 'aria-label': 'Račun' }, app.user.avatar_url ? h('img', { src: app.user.avatar_url, alt: '', width: 28, height: 28 }) : icon('about')),
    h(
      'div',
      { class: 'account-menu' },
      h('p', {}, 'Prijavljeni kot ', h('strong', {}, app.user.login)),
      h('p', { class: 'muted' }, app.remembered ? 'Prijava je shranjena na tej napravi.' : 'Prijava velja samo za ta zavihek.'),
      h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: confirmSignOut }, icon('logout'), 'Odjava')
    )
  );

  const pageSelect = h('select', { class: 'input input-sm preview-select', 'aria-label': 'Stran v predogledu' });
  pageSelect.addEventListener('change', () => setPreviewPage(pageSelect.value));
  ui.pageSelect = pageSelect;
  ui.hiddenBadge = h('span', { class: 'preview-hidden', hidden: true, title: 'Izklopljeno: obiskovalci te strani ne vidijo' }, icon('eye'), 'Ni na spletu');

  const deviceButton = (device, label) =>
    h('button', { type: 'button', class: 'icon-btn', 'aria-label': label, title: label, 'aria-pressed': String(app.device === device), dataset: { device }, onclick: () => setDevice(device) }, icon(device));
  ui.devices = [deviceButton('desktop', 'Računalnik'), deviceButton('mobile', 'Telefon')];

  ui.frames = [0, 1].map(() => h('iframe', { class: 'preview-frame', title: 'Predogled spletne strani', sandbox: 'allow-same-origin', hidden: true }));
  ui.stage = h('div', { class: 'preview-stage', dataset: { device: app.device } }, ui.frames);
  ui.liveLink = h('a', { class: 'icon-btn', target: '_blank', rel: 'noopener noreferrer', title: 'Odpri objavljeno stran', 'aria-label': 'Odpri objavljeno stran' }, icon('external'));
  ui.previewPane = h(
    'aside',
    { class: 'preview-pane', 'aria-label': 'Predogled' },
    h(
      'div',
      { class: 'preview-toolbar' },
      h('span', { class: 'preview-label' }, icon('eye'), 'Predogled'),
      ui.hiddenBadge,
      pageSelect,
      h('div', { class: 'device-toggle' }, ui.devices),
      ui.liveLink,
      h('button', { type: 'button', class: 'btn btn-primary btn-sm preview-close', onclick: () => togglePreview(false) }, 'Zapri predogled')
    ),
    ui.stage
  );

  const topbar = h(
    'header',
    { class: 'topbar' },
    h('a', { class: 'topbar-brand', href: `${SITE_ROOT}/`, target: '_blank', rel: 'noopener noreferrer' }, mark(), h('span', {}, app.settings.site.name), h('span', { class: 'login-tag' }, 'urejanje')),
    h('div', { class: 'topbar-status', 'aria-live': 'polite' }, ui.dot, ui.status),
    ui.deploy,
    h('div', { class: 'topbar-actions' }, ui.langTabs, h('div', { class: 'undo-group' }, ui.undo, ui.redo), ui.discard, ui.publish, account)
  );

  const fab = h('button', { type: 'button', class: 'btn btn-primary preview-fab', onclick: () => togglePreview(true) }, icon('eye'), 'Predogled');
  ui.shell = h('div', { class: 'shell' }, topbar, h('div', { class: 'workspace' }, ui.nav, ui.editor, ui.previewPane), fab);
  root.replaceChildren(ui.shell);

  new ResizeObserver(fitPreview).observe(ui.stage);
  const panel = PANELS.find((p) => p.id === app.panel);
  app.previewPage = panel?.page ?? 'home';
  pendingAnchor = panel?.anchor ? ANCHORS[panel.anchor][app.lang] : '';
  renderNav();
  renderLangTabs();
  renderPanel();
  updateStatus();
  renderPreview();
}

async function confirmSignOut() {
  if (isDirty()) {
    const choice = await confirmDialog({ title: 'Odjava z neobjavljenimi spremembami?', body: 'Neobjavljene spremembe se bodo izgubile.', confirm: 'Odjava', danger: true });
    if (choice !== 'ok') return;
  }
  signOut();
}

function renderNav() {
  const items = [];
  let group = '';
  for (const p of PANELS) {
    if (p.group && p.group !== group) {
      group = p.group;
      items.push(h('p', { class: 'nav-group' }, group));
    }
    items.push(h('button', { type: 'button', class: `nav-item${app.panel === p.id ? ' active' : ''}`, 'aria-current': app.panel === p.id ? 'page' : null, onclick: () => app.goto(p.id) }, icon(p.icon), h('span', {}, p.label)));
  }
  ui.nav.replaceChildren(...items);
}

/** SL | EN | SH in the top bar, each with the number of texts still to translate. */
function renderLangTabs() {
  const s = app.normalized();
  ui.langTabs.replaceChildren(
    ...['sl', 'en', 'sh'].map((lang) => {
      const missing = missingTranslations(s, lang).length;
      const off = lang !== 'sl' && !s.languages[lang].enabled;
      return h(
        'button',
        {
          type: 'button',
          class: 'lang-tab',
          'aria-pressed': String(app.lang === lang),
          title: `Urejate: ${LANG_INFO[lang].name}${off ? ' (na spletu izklopljeno)' : ''}${missing ? ` · neprevedenih besedil: ${missing}` : ''}`,
          onclick: () => setLang(lang),
        },
        LANG_CODES[lang],
        missing ? h('span', { class: 'lang-count' }, missing > 99 ? '99+' : String(missing)) : null
      );
    })
  );
}

function setLang(lang) {
  if (app.lang === lang) return;
  app.lang = lang;
  renderLangTabs();
  renderPanel();
  renderPreview();
}

function renderPanel() {
  const panel = PANELS.find((p) => p.id === app.panel) ?? PANELS[0];
  const scroll = ui.editor.scrollTop;
  ui.editor.replaceChildren(h('div', { class: 'panel' }, panel.render(app)));
  ui.editor.scrollTop = scroll;
  updateReverts();
}

function togglePreview(show) {
  ui.shell.classList.toggle('show-preview', show);
  fitPreview();
}

// --- change tracking -----------------------------------------------------------------------

// Uploads only count once the settings point at them; publish() commits just those.
function isDirty() {
  return serialize(app.normalized()) !== app.savedJson;
}

let previewTimer;
let tabsTimer;
function changed() {
  updateStatus();
  updateReverts();
  clearTimeout(previewTimer);
  previewTimer = setTimeout(renderPreview, 120);
  clearTimeout(tabsTimer);
  tabsTimer = setTimeout(renderLangTabs, 400);
}

function updateStatus() {
  const dirty = isDirty();
  ui.dot.dataset.state = app.publishing ? 'busy' : dirty ? 'dirty' : 'clean';
  ui.status.textContent = app.publishing ? 'Objavljam …' : dirty ? 'Imate neobjavljene spremembe' : 'Vse je objavljeno';
  ui.publish.disabled = app.publishing || !dirty;
  ui.discard.hidden = !dirty || app.publishing;
  ui.undo.disabled = app.publishing || !undoStack.length;
  ui.redo.disabled = app.publishing || !redoStack.length;
  document.title = `${dirty ? '• ' : ''}${app.settings.site.name || 'Stran'} · Urejanje`;
}

window.addEventListener('beforeunload', (event) => {
  if (app.settings && isDirty()) event.preventDefault();
});

window.addEventListener('keydown', (event) => {
  if (!(event.ctrlKey || event.metaKey) || !app.settings || !ui.editor) return;
  const key = event.key.toLowerCase();
  if (key === 's') {
    event.preventDefault();
    publish();
  } else if (key === 'z' || key === 'y') {
    // The admin's own history replaces the browser's per-field undo, so every kind of control behaves the same.
    event.preventDefault();
    if (key === 'y' || event.shiftKey) redo();
    else undo();
  }
});

async function discard() {
  const choice = await confirmDialog({ title: 'Zavržem neobjavljene spremembe?', body: 'Urejevalnik se vrne na objavljeno različico. S Ctrl+Z spremembe vrnete.', confirm: 'Zavrzi', danger: true });
  if (choice !== 'ok') return;
  remember();
  // Pending uploads are kept: Undo can bring back the settings that use them.
  app.settings = JSON.parse(app.savedJson);
  changed();
  renderPanel();
}

// --- live preview -------------------------------------------------------------------------

let activeFrame = 0;
let themeUrl = null;
let pendingAnchor = '';
let fontCss = '';

// URLs inside a blob: stylesheet can't be relative (a blob URL has no path to resolve against).
const FONT_BASE = `${SITE_ROOT}/assets/fonts/`;

function syncPageSelect(settings) {
  const pages = previewPages(settings);
  if (!pages.some((p) => p.id === app.previewPage)) app.previewPage = 'home';
  ui.pageSelect.replaceChildren(...pages.map((p) => h('option', { value: p.id, selected: p.id === app.previewPage }, p.hidden ? `${p.label} (izklopljeno)` : p.label)));
  const langOff = app.lang !== 'sl' && !settings.languages[app.lang].enabled;
  const pageOff = pages.find((p) => p.id === app.previewPage)?.hidden;
  ui.hiddenBadge.hidden = !(langOff || pageOff);
  ui.liveLink.href = `${SITE_ROOT}${app.previewPage === 'notfound' ? '/404.html' : pagePath(app.previewPage, app.lang)}`;
}

function renderPreview() {
  if (!ui.frames) return;
  const settings = app.normalized();
  syncPageSelect(settings);
  const css = themeCss(settings.theme, { fontBase: FONT_BASE, ...themeExtras(settings) });
  const nextThemeUrl = URL.createObjectURL(new Blob([css], { type: 'text/css' }));
  const html = renderPage(settings, app.previewPage, app.lang, {
    preview: true,
    previewSuccess: app.previewSuccess,
    themeHref: nextThemeUrl,
    resolveImage: app.imageSrc,
    base: SITE_BASE,
    version: VERSION,
  });

  const current = ui.frames[activeFrame];
  const next = ui.frames[1 - activeFrame];
  const scrollY = current.contentWindow?.scrollY ?? 0;
  next.onload = () => {
    const doc = next.contentDocument;
    wirePreview(doc);
    const anchor = pendingAnchor && doc.getElementById(pendingAnchor);
    if (anchor) anchor.scrollIntoView();
    else next.contentWindow.scrollTo(0, scrollY);
    pendingAnchor = '';
    next.hidden = false;
    current.hidden = true;
    activeFrame = 1 - activeFrame;
    if (themeUrl) URL.revokeObjectURL(themeUrl);
    themeUrl = nextThemeUrl;
  };
  next.srcdoc = html;
}

function wirePreview(doc) {
  doc.addEventListener('submit', (event) => event.preventDefault());
  doc.addEventListener('click', (event) => {
    const anchor = event.target.closest('a[href]');
    // Clicking a text opens its field, unless the click was on a link inside that text.
    const editable = event.target.closest('[data-edit]');
    if (editable && !(anchor && editable.contains(anchor))) {
      event.preventDefault();
      editField(editable.dataset.edit);
      return;
    }
    if (event.target.closest('summary')) return; // FAQ answers open and close as usual
    if (!anchor) return;
    event.preventDefault();
    // The phone menu opens with :target on the live site; the preview toggles it directly.
    if (anchor.matches('.menu-toggle, .menu-close')) {
      doc.getElementById('site-menu')?.classList.toggle('is-open', anchor.matches('.menu-toggle'));
      return;
    }
    const href = anchor.getAttribute('href');
    if (href.startsWith('#')) {
      doc.getElementById('site-menu')?.classList.remove('is-open');
      doc.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const url = new URL(href, location.href);
    if (url.origin === location.origin && url.pathname.startsWith(`${SITE_BASE}/`)) {
      const target = pageForPath(url.pathname.slice(SITE_BASE.length));
      if (target) {
        if (target.lang !== app.lang) setLang(target.lang);
        setPreviewPage(target.id, url.hash.slice(1));
      }
      return;
    }
    if (/^https?:/.test(url.protocol)) window.open(url.href, '_blank', 'noopener,noreferrer');
  });
}

/** Open the panel with this settings path, then scroll to its field and focus it. */
function editField(path) {
  const panel = panelForPath(path, app.settings);
  if (!panel) return;
  // Open the list item the field belongs to (a service, a question …).
  const item = path.match(/^(.*?\.(?:items|images|photos|details|facts|badges)\.\d+|socials\.\d+)(\.|$)/);
  if (item) app.setOpen(item[1], true);
  app.goto(panel, { follow: false });
  const field = ui.editor.querySelector(`[data-path="${CSS.escape(path)}"]`) ?? (item && ui.editor.querySelector(`[data-path^="${CSS.escape(item[1])}."]`));
  togglePreview(false);
  if (!field) return;
  const target = field.closest('.field, .repeater, .section-row') ?? field;
  const input = field.matches('input, textarea, select') ? field : field.querySelector('input, textarea, select');
  target.scrollIntoView({ block: 'center', behavior: 'smooth' });
  input?.focus({ preventScroll: true });
  target.classList.remove('flash');
  void target.offsetWidth; // restart the animation
  target.classList.add('flash');
}

function setPreviewPage(page, anchor = '') {
  if (!ui.frames) return;
  if (page === app.previewPage) {
    if (anchor) ui.frames[activeFrame].contentDocument?.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  app.previewPage = page;
  pendingAnchor = anchor;
  ui.frames[activeFrame].contentWindow?.scrollTo(0, 0);
  renderPreview();
}

function setDevice(device) {
  app.device = device;
  ui.stage.dataset.device = device;
  for (const button of ui.devices) button.setAttribute('aria-pressed', String(button.dataset.device === device));
  fitPreview();
}

function fitPreview() {
  if (!ui.stage) return;
  const width = app.device === 'mobile' ? MOBILE_WIDTH : DESKTOP_WIDTH;
  const available = ui.stage.clientWidth - (app.device === 'mobile' ? 32 : 0);
  const scale = Math.min(1, available / width);
  const height = (ui.stage.clientHeight - (app.device === 'mobile' ? 32 : 0)) / scale;
  for (const frame of ui.frames) {
    frame.style.width = `${width}px`;
    frame.style.height = `${height}px`;
    frame.style.transform = `scale(${scale})`;
  }
}

// --- uploads ---------------------------------------------------------------------------------

const UPLOAD_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Re-encodes the image in the browser: resizes it and strips metadata such as GPS location (important for
 * photos taken at children's parties). SVG is not accepted, because an SVG file can contain scripts.
 */
async function processUpload(file, { maxWidth = 1600, maxHeight = 1600, format = 'image/webp', quality = 0.84, name = 'slika' } = {}) {
  if (!UPLOAD_TYPES.includes(file.type)) throw new Error('Uporabite sliko PNG, JPEG, WebP ali GIF.');
  if (file.size > 25 * 1024 * 1024) throw new Error('Slika je večja od 25 MB.');

  let blob = file;
  if (file.type === 'image/gif') {
    if (file.size > 3 * 1024 * 1024) throw new Error('GIF mora biti manjši od 3 MB.');
  } else {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
    const canvas = h('canvas', { width: Math.round(bitmap.width * scale), height: Math.round(bitmap.height * scale) });
    const context = canvas.getContext('2d');
    context.imageSmoothingQuality = 'high';
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    blob = await new Promise((resolve) => canvas.toBlob(resolve, format, quality));
    if (!blob) throw new Error('Brskalnik slike ni mogel obdelati.');
  }

  const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' }[blob.type] ?? 'png';
  const sitePath = `/assets/uploads/${slugify(name, 'slika')}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}.${ext}`;
  app.uploads.set(sitePath, { repoPath: `public${sitePath}`, base64: await blobToBase64(blob) });
  app.blobUrls.set(sitePath, URL.createObjectURL(blob));
  return sitePath;
}

// --- publishing ---------------------------------------------------------------------------------

const AREA_NAMES = {
  site: 'ime in naslov strani',
  languages: 'jeziki',
  announcement: 'obvestilo',
  header: 'glava',
  hero: 'vrh strani',
  sections: 'razdelki',
  services: 'ponudba',
  steps: 'kako poteka',
  packages: 'paketi',
  schedule: 'urnik',
  about: 'o nas',
  gallery: 'galerija',
  testimonials: 'mnenja',
  faq: 'vprašanja',
  contact: 'kontakt',
  form: 'obrazec',
  thanks: 'zahvala',
  floating: 'plavajoči gumb',
  footer: 'noga',
  socials: 'družbena omrežja',
  business: 'podatki o podjetju',
  theme: 'videz',
  textStyles: 'pisave',
  privacy: 'zasebnost',
  terms: 'pogoji',
  seo: 'SEO',
};

function commitMessage(before, after, uploads) {
  let changedAreas = [];
  try {
    const a = JSON.parse(before);
    const b = JSON.parse(after);
    changedAreas = Object.keys(AREA_NAMES).filter((key) => JSON.stringify(a[key]) !== JSON.stringify(b[key]));
  } catch {
    // first publish or unreadable old file
  }
  const what = changedAreas.length ? changedAreas.map((k) => AREA_NAMES[k]).join(', ') : 'nastavitve';
  return `Urejanje: ${what}${uploads ? ` (+${uploads} ${uploads === 1 ? 'slika' : uploads === 2 ? 'sliki' : uploads < 5 ? 'slike' : 'slik'})` : ''}`;
}

async function publish({ force = false } = {}) {
  if (app.publishing || !isDirty()) return;
  const normalized = app.normalized();
  const json = serialize(normalized);
  const uploads = [...app.uploads].filter(([sitePath]) => json.includes(JSON.stringify(sitePath)));
  const files = [{ path: SETTINGS_PATH, content: json, encoding: 'utf-8' }, ...uploads.map(([, u]) => ({ path: u.repoPath, content: u.base64, encoding: 'base64' }))];

  let conflict = false;
  app.publishing = true;
  ui.publish.classList.add('is-loading');
  updateStatus();
  try {
    const { commit, blobs } = await app.gh.commit({
      message: commitMessage(app.savedJson, json, uploads.length),
      files,
      expect: force ? null : { path: SETTINGS_PATH, sha: app.fileSha },
    });
    app.fileSha = blobs[SETTINGS_PATH];
    app.savedJson = json;
    for (const [sitePath] of uploads) app.uploads.delete(sitePath);
    // Edits made while publishing stay in the editor as unpublished changes.
    if (serialize(app.normalized()) === json) {
      app.settings = structuredClone(normalized);
      renderPanel();
    } else {
      updateReverts();
    }
    toast(app.local ? 'Shranjeno v mapo projekta. Na splet gre, ko spremembe potisnete na GitHub (git push).' : 'Objavljeno! Spletna stran se posodobi v približno minuti.');
    // Local mode only writes into the project folder: there is no GitHub run to wait for.
    if (app.local) setDeploy('idle', '');
    else watchDeploy(commit.sha);
  } catch (error) {
    if (error instanceof ConflictError) conflict = true;
    else toast(explain(error), 'error');
  } finally {
    app.publishing = false;
    ui.publish.classList.remove('is-loading');
    updateStatus();
  }

  if (conflict) {
    const choice = await confirmDialog({
      title: 'Nastavitve so se medtem spremenile',
      body: 'Nekdo (ali drug zavihek) je objavil, odkar ste odprli urejevalnik. Njihovo različico lahko prepišete s svojo ali naložite njihovo in izgubite svoje neobjavljene spremembe.',
      confirm: 'Prepiši z mojo',
      extra: 'Naloži njihovo',
      danger: true,
    });
    if (choice === 'ok') await publish({ force: true });
    if (choice === 'extra') await reloadFromGitHub();
  }
}

async function reloadFromGitHub() {
  const file = await app.gh.readFile(SETTINGS_PATH);
  const settings = normalizeSettings(JSON.parse(file.text));
  remember();
  Object.assign(app, { fileSha: file.sha, savedJson: serialize(settings), settings: structuredClone(settings) });
  changed();
  renderPanel();
  toast('Naložena je zadnja objavljena različica.');
}

function setDeploy(state, text, url) {
  ui.deploy.dataset.state = state;
  ui.deploy.querySelector('.deploy-text').textContent = text;
  if (url) ui.deploy.href = url;
  else ui.deploy.removeAttribute('href');
}

let deployWatch = 0;
async function watchDeploy(sha) {
  const watchId = ++deployWatch;
  setDeploy('pending', 'Objavljam na splet …');
  const started = Date.now();
  while (Date.now() - started < 8 * 60 * 1000 && watchId === deployWatch) {
    await wait(5000);
    let run;
    try {
      run = await app.gh.latestRun(sha);
    } catch (error) {
      if (error.status === 403 || error.status === 404) return setDeploy('unknown', 'Objavljeno · na spletu v ~1 min');
      continue;
    }
    if (!run || watchId !== deployWatch) continue;
    if (run.status === 'completed') {
      return run.conclusion === 'success' ? setDeploy('live', 'Na spletu', run.html_url) : setDeploy('failed', 'Objava ni uspela', run.html_url);
    }
    setDeploy('pending', run.status === 'queued' ? 'V vrsti …' : 'Objavljam na splet …', run.html_url);
  }
  if (watchId === deployWatch) setDeploy('unknown', 'Objava še teče', `https://github.com/${app.repo.owner}/${app.repo.repo}/actions`);
}

async function refreshDeployStatus() {
  try {
    const run = await app.gh.latestRun();
    if (!run) return setDeploy('idle', '');
    if (run.status !== 'completed') return watchDeploy(run.head_sha);
    setDeploy(run.conclusion === 'success' ? 'live' : 'failed', run.conclusion === 'success' ? 'Na spletu' : 'Zadnja objava ni uspela', run.html_url);
  } catch {
    setDeploy('idle', '');
  }
}

// --- password access ------------------------------------------------------------------------------

/** Encrypt a token (the one in use, or another one) with a password and publish admin/access.json. */
async function saveAccess(password, { token, label } = {}) {
  const useToken = token || app.token;
  if (!useToken) throw new Error('V lokalnem načinu ni prijavnega žetona: vpišite žeton, ki naj ga geslo zaklene.');
  if (token) {
    // Make sure the pasted token works for this repository before locking it behind a password.
    await new GitHub({ token, ...DEPLOY }).readFile(SETTINGS_PATH);
  }
  const blob = await encryptToken(useToken, password, label);
  await app.gh.commit({ message: app.access ? 'Novo geslo za urejanje' : 'Vklop prijave z geslom', files: [{ path: ACCESS_PATH, content: JSON.stringify(blob, null, 2) + '\n', encoding: 'utf-8' }] });
  app.access = blob;
  toast('Geslo je shranjeno. Prijava z geslom deluje, ko se stran posodobi (približno minuta).');
  renderPanel();
}

async function removeAccess() {
  const choice = await confirmDialog({
    title: 'Izklopim prijavo z geslom?',
    body: 'Datoteka z zaščitenim žetonom se odstrani s strani. Žeton samega prekličite tudi na GitHubu, če ga nihče več ne potrebuje.',
    confirm: 'Izklopi',
    danger: true,
  });
  if (choice !== 'ok') return;
  await app.gh.commit({ message: 'Izklop prijave z geslom', files: [{ path: ACCESS_PATH, delete: true }] });
  app.access = null;
  toast('Prijava z geslom je izklopljena.');
  renderPanel();
}

// --- presets, history, backup -------------------------------------------------------------------

function applyPreset(id) {
  const preset = PRESETS[id];
  const theme = app.settings.theme;
  remember();
  theme.preset = id;
  theme.colors = { ...preset.colors };
  for (const key of PRESET_KEYS) theme[key] = preset[key];
  changed();
  renderPanel();
}

async function loadVersion(sha) {
  if (isDirty()) {
    const choice = await confirmDialog({ title: 'Zamenjam neobjavljene spremembe?', body: 'Starejša različica zamenja, kar je zdaj v urejevalniku.', confirm: 'Naloži različico', danger: true });
    if (choice !== 'ok') return;
  }
  try {
    const file = await app.gh.readFile(SETTINGS_PATH, sha);
    remember();
    app.settings = normalizeSettings(JSON.parse(file.text));
    changed();
    toast('Starejša različica je naložena. Preverite predogled, nato jo obnovite z gumbom Objavi.');
    app.goto('overview');
  } catch (error) {
    toast(explain(error), 'error');
  }
}

function exportJson() {
  const blob = new Blob([serialize(app.normalized())], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: `nastavitve-strani-${new Date().toISOString().slice(0, 10)}.json` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function importJson(file) {
  try {
    if (file.size > 2 * 1024 * 1024) throw new Error('Datoteka je prevelika za varnostno kopijo nastavitev.');
    const data = JSON.parse(await file.text());
    const choice = await confirmDialog({ title: 'Uvozim te nastavitve?', body: 'Zamenjajo, kar je v urejevalniku. Na spletu se nič ne spremeni, dokler ne objavite.', confirm: 'Uvozi' });
    if (choice !== 'ok') return;
    remember();
    app.settings = normalizeSettings(data);
    changed();
    renderPanel();
    toast('Nastavitve so uvožene. Preverite predogled in objavite.');
  } catch (error) {
    toast(error instanceof SyntaxError ? 'To ni veljavna datoteka JSON.' : error.message, 'error');
  }
}

async function resetDefaults() {
  const choice = await confirmDialog({
    title: 'Ponastavim vse na začetno predlogo?',
    body: 'Vsa besedila, storitve, paketi, slike, barve in nastavitve v urejevalniku se vrnejo na začetno predlogo. Na spletu se nič ne spremeni, dokler ne objavite, starejše različice pa ostanejo v zgodovini.',
    confirm: 'Ponastavi',
    danger: true,
  });
  if (choice !== 'ok') return;
  remember();
  app.settings = structuredClone(DEFAULT_SETTINGS);
  changed();
  renderPanel();
}

// --- start --------------------------------------------------------------------------------------

function loadFonts() {
  const css = [
    ...Object.keys(FONTS).map((id) => fontFaces(id, FONT_BASE)),
    ...Object.keys(FONTS).map((id) => `.font-sample[data-font="${id}"] { font-family: ${fontStack(id)}; }`),
  ].join('\n');
  fontCss = URL.createObjectURL(new Blob([css], { type: 'text/css' }));
  document.head.append(h('link', { rel: 'stylesheet', href: fontCss }));
}

async function start() {
  loadFonts();
  [app.access, app.localAvailable] = await Promise.all([loadAccess(), localAvailable(SITE_BASE)]);
  let local = false;
  try {
    local = app.localAvailable && sessionStorage.getItem(LOCAL_KEY) === '1';
  } catch {
    // ignore
  }
  if (local) return signInLocal().catch((error) => showLogin(explain(error)));
  const saved = storedToken();
  if (!saved) return showLogin();
  root.replaceChildren(h('div', { class: 'login' }, h('p', { class: 'muted' }, 'Prijavljam …')));
  try {
    await signIn(saved.token, saved.remembered);
  } catch (error) {
    // Forget the token only when GitHub rejects it, not on a dropped connection or a rate limit.
    if (error.status === 401 || error.status === 404 || (error.status === 403 && !/rate limit/i.test(error.message))) clearToken();
    showLogin(explain(error));
  }
}

start();
