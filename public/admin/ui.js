// DOM helpers and form controls for the admin page. Everything is built with createElement and
// textContent; innerHTML is only used for the static icon strings below.
//
// Translatable texts are stored as { sl, en, sh }. A control created with `i18n: true` edits the language
// chosen in the top bar (app.lang) and shows the Slovenian original under the field while translating.

import { SERVICE_ICONS } from '../assets/lib/icons.mjs';

export const ICONS = {
  overview: '<path d="M3 12 12 4l9 8"/><path d="M5 10v10h14V10"/>',
  hero: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h6M7 13h10"/><circle cx="17" cy="8.5" r="1.5"/>',
  sections: '<rect x="3" y="4" width="18" height="5" rx="1.5"/><rect x="3" y="11" width="18" height="9" rx="1.5"/>',
  services: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  program: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="18" r="1.2"/>',
  packages: '<path d="M3.5 8.5 12 4l8.5 4.5v7L12 20l-8.5-4.5z"/><path d="M3.5 8.5 12 13l8.5-4.5M12 13v7"/>',
  schedule: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  about: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  gallery: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
  reviews: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8.5 9.5h7M8.5 12.5h4.5"/>',
  faq: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7M12 17h.01"/>',
  contact: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  form: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  languages: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>',
  socials: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"/>',
  appearance: '<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="10" r="1.2"/><circle cx="12" cy="7.5" r="1.2"/><circle cx="15.5" cy="10" r="1.2"/><path d="M12 21a3 3 0 0 1 0-6h1.5a2.5 2.5 0 0 0 0-5"/>',
  type: '<path d="M5 7V4.5h14V7M12 4.5v15M9 19.5h6"/>',
  legal: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3z"/>',
  seo: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l2 2M15 8l2 2"/>',
  up: '<path d="m6 15 6-6 6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  alert: '<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17.5v.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  desktop: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/>',
  mobile: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.9-3.5M4 4v4h4M4 13a8 8 0 0 0 14.9 3.5M20 20v-4h-4"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
};

export function icon(name, cls = 'icon') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', cls);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.innerHTML = ICONS[name] ?? SERVICE_ICONS[name]?.svg ?? '';
  return svg;
}

const PROPS = new Set(['value', 'checked', 'selected', 'disabled', 'hidden', 'indeterminate']);

export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (PROPS.has(key)) el[key] = value;
    else el.setAttribute(key, value === true ? '' : String(value));
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false || child === '') continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

let uid = 0;
export const nextId = (prefix = 'f') => `${prefix}-${++uid}`;

export const LANG_CODES = { sl: 'SL', en: 'EN', sh: 'SH' };

// --- layout pieces ------------------------------------------------------------------

export function card(title, description, ...children) {
  return h(
    'section',
    { class: 'panel-card' },
    title ? h('h3', { class: 'panel-card-title' }, title) : null,
    description ? h('p', { class: 'panel-card-desc' }, description) : null,
    ...children
  );
}

export function note(text, tone = 'info') {
  return h('div', { class: `note note-${tone}` }, icon(tone === 'warn' ? 'alert' : tone === 'ok' ? 'check' : 'info'), h('div', {}, text));
}

export function steps(items) {
  return h('ol', { class: 'steps' }, items.map((item) => h('li', {}, item)));
}

export function code(text) {
  return h('code', { class: 'inline-code' }, text);
}

export function link(href, text) {
  return h('a', { href, target: '_blank', rel: 'noopener noreferrer' }, text, icon('external', 'icon icon-xs'));
}

function labelFor(app, label, id, i18n) {
  if (!label) return null;
  return h('label', { class: 'field-label', for: id }, label, i18n ? h('span', { class: 'lang-chip', title: 'Urejate ta jezik' }, LANG_CODES[app.lang]) : null);
}

function wrap(app, label, control, { help, id, i18n = false } = {}) {
  const error = h('p', { class: 'field-error', hidden: true, id: `${id}-error`, role: 'alert' });
  const el = h('div', { class: 'field' }, labelFor(app, label, id, i18n), control, help ? h('p', { class: 'field-help', id: `${id}-help` }, help) : null, error);
  el.showError = (message) => {
    error.textContent = message || '';
    error.hidden = !message;
    const input = el.querySelector('input, textarea, select');
    if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
  };
  return el;
}

// --- bound controls: each reads/writes one settings path via the app ------------------

/**
 * Small button that puts one setting back to its published value. The admin shows it only while the
 * value differs from what is published (see updateReverts in admin.js).
 */
export function revert(app, path) {
  return h(
    'button',
    {
      type: 'button',
      class: 'revert-btn',
      hidden: true,
      dataset: { revert: path },
      onclick: (event) => {
        event.preventDefault();
        app.revert(path);
      },
    },
    icon('undo'),
    h('span', {}, 'Razveljavi')
  );
}

/** Field wrapper plus its revert button. */
function withRevert(app, path, el) {
  el.classList.add('has-revert');
  el.append(revert(app, path));
  return el;
}

/**
 * Text input or textarea. With `i18n`, `path` points at a { sl, en, sh } object and the field edits the
 * current editing language.
 */
export function text(app, path, { label, help, placeholder, maxlength, type = 'text', multiline = false, rows = 3, validate, counter, rerender, mono, onInput, i18n = false } = {}) {
  const id = nextId();
  const valuePath = i18n ? `${path}.${app.lang}` : path;
  const value = app.get(valuePath) ?? '';
  const source = i18n && app.lang !== 'sl' ? app.get(`${path}.sl`) ?? '' : '';
  const attrs = {
    id,
    placeholder: source ? source.split('\n')[0].slice(0, 120) : placeholder,
    maxlength,
    class: `input${mono ? ' mono' : ''}`,
    'aria-describedby': help ? `${id}-help` : null,
    spellcheck: type === 'text' && !mono ? 'true' : 'false',
    lang: i18n ? (app.lang === 'sh' ? 'hr' : app.lang) : null,
    dataset: { path },
  };
  const input = multiline ? h('textarea', { ...attrs, rows, value }) : h('input', { ...attrs, type, value, autocomplete: 'off' });
  const count = counter ? h('span', { class: 'counter' }) : null;
  const el = wrap(app, label, counter ? h('div', { class: 'with-counter' }, input, count) : input, { help, id, i18n });
  if (source) el.insertBefore(h('p', { class: 'source-text' }, h('strong', {}, 'Slovensko: '), source), el.querySelector('.field-help, .field-error'));

  const check = () => {
    if (count) {
      count.textContent = `${input.value.length}/${counter}`;
      count.classList.toggle('over', input.value.length > counter);
    }
    if (validate) el.showError(input.value ? validate(input.value.trim()) : '');
    el.classList.toggle('is-missing', Boolean(source && !input.value.trim()));
  };
  let previous = input.value;
  input.addEventListener('input', () => {
    // A cleared number field keeps the last value instead of saving 0 (which the normaliser would clamp).
    if (type === 'number' && (input.value.trim() === '' || !Number.isFinite(Number(input.value)))) return;
    app.set(valuePath, type === 'number' ? Number(input.value) : input.value);
    onInput?.(input.value, previous);
    previous = input.value;
    check();
  });
  input.addEventListener('change', () => {
    if (type === 'number' && input.value.trim() === '') input.value = app.get(valuePath) ?? '';
    if (rerender) app.rerender();
  });
  check();
  return withRevert(app, valuePath, el);
}

export function toggle(app, path, { label, help, rerender } = {}) {
  const id = nextId();
  const input = h('input', { type: 'checkbox', id, class: 'switch-input', role: 'switch', checked: Boolean(app.get(path)), dataset: { path } });
  input.addEventListener('change', () => {
    app.set(path, input.checked);
    if (rerender) app.rerender();
  });
  return withRevert(
    app,
    path,
    h(
      'div',
      { class: 'field field-toggle', dataset: { path } },
      h('label', { class: 'switch', for: id }, input, h('span', { class: 'switch-track', 'aria-hidden': 'true' }), h('span', { class: 'switch-label' }, label)),
      help ? h('p', { class: 'field-help' }, help) : null
    )
  );
}

/** options: { value: label } or, for grouped lists, { 'Group': { value: label } }. */
export function select(app, path, { label, help, options, rerender, onChange } = {}) {
  const id = nextId();
  const current = app.get(path);
  const option = ([value, text]) => h('option', { value, selected: value === current }, text);
  const input = h(
    'select',
    { id, class: 'input', dataset: { path } },
    Object.entries(options).map(([key, value]) => (typeof value === 'object' ? h('optgroup', { label: key }, Object.entries(value).map(option)) : option([key, value])))
  );
  input.addEventListener('change', () => {
    app.set(path, input.value);
    onChange?.(input.value);
    if (rerender) app.rerender();
  });
  return withRevert(app, path, wrap(app, label, input, { help, id }));
}

/** A row of pill buttons for a short list of choices (Urban & Monika style). */
export function segmented(app, path, { label, help, options, rerender = true } = {}) {
  const current = app.get(path);
  const buttons = Object.entries(options).map(([value, text]) =>
    h(
      'button',
      {
        type: 'button',
        class: 'seg-btn',
        'aria-pressed': String(value === current),
        onclick: () => {
          app.set(path, value);
          if (rerender) app.rerender();
        },
      },
      text
    )
  );
  return withRevert(app, path, h('div', { class: 'field', dataset: { path } }, label ? h('span', { class: 'field-label' }, label) : null, h('div', { class: 'seg', role: 'group', 'aria-label': label }, buttons), help ? h('p', { class: 'field-help' }, help) : null));
}

/** format(value) can replace the shown value, e.g. "Privzeto" for 0. */
export function range(app, path, { label, help, min, max, step = 1, unit = '', format } = {}) {
  const id = nextId();
  const output = h('output', { class: 'range-value', for: id });
  const input = h('input', { type: 'range', id, min, max, step, value: app.get(path), class: 'range', dataset: { path } });
  const show = () => (output.textContent = format?.(Number(input.value)) ?? `${input.value}${unit}`);
  input.addEventListener('input', () => {
    app.set(path, Number(input.value));
    show();
  });
  show();
  return withRevert(app, path, wrap(app, label, h('div', { class: 'range-row' }, input, output), { help, id }));
}

export function color(app, path, { label, onChange } = {}) {
  const id = nextId();
  const value = app.get(path);
  const picker = h('input', { type: 'color', id, value, class: 'color-swatch', 'aria-label': `${label}: izbira barve` });
  const hex = h('input', { type: 'text', value, class: 'input mono color-hex', maxlength: 7, 'aria-label': `${label}: koda barve`, spellcheck: 'false' });
  const commit = (v) => {
    app.set(path, v.toLowerCase());
    onChange?.();
  };
  picker.addEventListener('input', () => {
    hex.value = picker.value;
    commit(picker.value);
  });
  hex.addEventListener('input', () => {
    const v = hex.value.trim();
    const ok = /^#[0-9a-f]{6}$/i.test(v);
    hex.setAttribute('aria-invalid', ok ? 'false' : 'true');
    if (ok) {
      picker.value = v;
      commit(v);
    }
  });
  return withRevert(app, path, h('div', { class: 'field field-color', dataset: { path } }, h('label', { class: 'field-label', for: id }, label), h('div', { class: 'color-row' }, picker, hex)));
}

/** Grid of the site's line icons to choose from. */
export function iconPicker(app, path, { label = 'Ikona', allowNone = true } = {}) {
  const current = app.get(path);
  const choose = (id) => {
    app.set(path, id);
    app.rerender();
  };
  const choice = (id, title, content) => h('button', { type: 'button', class: 'icon-choice', title, 'aria-label': title, 'aria-pressed': String(current === id), onclick: () => choose(id) }, content);
  return withRevert(
    app,
    path,
    h(
      'div',
      { class: 'field', dataset: { path } },
      h('span', { class: 'field-label' }, label),
      h('div', { class: 'service-icons' }, Object.entries(SERVICE_ICONS).map(([id, i]) => choice(id, i.label, icon(id))), allowNone ? choice('', 'Brez ikone', '–') : null)
    )
  );
}

function rowButtons(app, path, index, length, { removable = true, confirmRemove } = {}) {
  const move = (delta) => {
    const list = [...app.get(path)];
    const [item] = list.splice(index, 1);
    list.splice(index + delta, 0, item);
    app.set(path, list);
    app.rerender();
  };
  const remove = async (event) => {
    event.preventDefault();
    if (confirmRemove && !(await confirmRemove())) return;
    const list = [...app.get(path)];
    list.splice(index, 1);
    app.set(path, list);
    app.rerender();
  };
  const stop = (fn) => (event) => {
    event.preventDefault();
    fn(event);
  };
  return h(
    'div',
    { class: 'row-buttons' },
    h('button', { type: 'button', class: 'icon-btn', title: 'Premakni gor', 'aria-label': 'Premakni gor', disabled: index === 0, onclick: stop(() => move(-1)) }, icon('up')),
    h('button', { type: 'button', class: 'icon-btn', title: 'Premakni dol', 'aria-label': 'Premakni dol', disabled: index === length - 1, onclick: stop(() => move(1)) }, icon('down')),
    removable ? h('button', { type: 'button', class: 'icon-btn danger', title: 'Odstrani', 'aria-label': 'Odstrani', onclick: remove }, icon('trash')) : null
  );
}

/**
 * Home page sections: on/off switch, in-menu tick, heading in the editing language, up/down buttons.
 * labels: { id: 'Ponudba' }.
 */
export function sectionList(app, path, { labels } = {}) {
  const sections = app.get(path) ?? [];
  const rows = sections.map((section, i) => {
    const toggleId = nextId('section');
    const input = h('input', { type: 'checkbox', class: 'switch-input', role: 'switch', checked: section.enabled, id: toggleId, 'aria-label': `Pokaži razdelek ${labels[section.id]}` });
    input.addEventListener('change', () => {
      app.set(`${path}.${i}.enabled`, input.checked);
      app.rerender();
    });
    const menu = h('input', { type: 'checkbox', checked: section.inMenu, disabled: !section.enabled });
    menu.addEventListener('change', () => app.set(`${path}.${i}.inMenu`, menu.checked));
    const heading = h('input', { type: 'text', class: 'input input-sm', value: section.heading[app.lang] ?? '', placeholder: section.heading.sl, maxlength: 100, 'aria-label': `${labels[section.id]}: naslov`, dataset: { path: `${path}.${i}.heading` } });
    heading.addEventListener('input', () => app.set(`${path}.${i}.heading.${app.lang}`, heading.value));
    return h(
      'li',
      { class: 'section-row' },
      h('label', { class: 'switch', for: toggleId }, input, h('span', { class: 'switch-track', 'aria-hidden': 'true' })),
      h('div', { class: 'section-main' }, h('span', { class: 'section-name' }, labels[section.id], h('span', { class: 'lang-chip' }, LANG_CODES[app.lang])), heading),
      h('div', { class: 'section-flags' }, h('label', { class: 'mini-check' }, menu, 'v meniju'), rowButtons(app, path, i, sections.length, { removable: false }))
    );
  });
  return withRevert(app, path, h('div', { class: 'field', dataset: { path } }, h('ul', { class: 'section-list' }, rows)));
}

/** List of objects, each edited with its own set of fields. onOpen(index) runs when an item is expanded. */
export function repeater(app, path, { title, itemTitle, fields, newItem, max = 24, addLabel = 'Dodaj', empty, onOpen, confirmRemove, extraActions } = {}) {
  const items = app.get(path) ?? [];
  const blocks = items.map((item, i) =>
    h(
      'details',
      { class: 'repeat-item', open: app.isOpen(`${path}.${i}`) },
      h('summary', { class: 'repeat-summary' }, h('span', { class: 'repeat-title' }, itemTitle(item, i) || `${i + 1}.`), rowButtons(app, path, i, items.length, { confirmRemove })),
      h('div', { class: 'repeat-body' }, fields(`${path}.${i}`, item, i))
    )
  );
  for (const [i, block] of blocks.entries()) {
    block.addEventListener('toggle', () => {
      app.setOpen(`${path}.${i}`, block.open);
      if (block.open) onOpen?.(i);
    });
  }
  const add =
    items.length < max
      ? h(
          'button',
          {
            type: 'button',
            class: 'btn btn-ghost btn-sm',
            onclick: () => {
              app.set(path, [...items, newItem(items)]);
              app.setOpen(`${path}.${items.length}`, true);
              app.rerender();
              onOpen?.(items.length);
            },
          },
          icon('plus'),
          addLabel
        )
      : h('p', { class: 'field-help' }, `Doseženo je največje število (${max}).`);
  return h(
    'div',
    { class: 'repeater', dataset: { path } },
    title ? h('span', { class: 'field-label' }, title) : null,
    !items.length && empty ? h('p', { class: 'field-help' }, empty) : null,
    blocks,
    h('div', { class: 'repeater-actions' }, add, extraActions ?? null, revert(app, path))
  );
}

/**
 * Image field. Images are always uploaded to the site (re-encoded in the browser, metadata such as GPS
 * location stripped), so pages never load images from other servers.
 */
export function image(app, path, { label, help, upload = {} } = {}) {
  const id = nextId();
  const value = app.get(path) ?? '';
  const preview = h('div', { class: 'image-preview' });
  const showPreview = (src) => {
    preview.replaceChildren(src ? h('img', { src: app.imageSrc(src), alt: '' }) : h('span', { class: 'image-empty' }, 'Ni slike'));
  };
  showPreview(value);

  const file = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif', class: 'visually-hidden', id: `${id}-file` });
  const status = h('span', { class: 'image-status' });

  file.addEventListener('change', async () => {
    const chosen = file.files?.[0];
    file.value = '';
    if (!chosen) return;
    status.textContent = 'Obdelujem …';
    try {
      const sitePath = await app.upload(chosen, { ...upload, name: upload.name ?? label });
      app.set(path, sitePath);
      showPreview(sitePath);
      status.textContent = 'Pripravljeno (naloži se ob objavi)';
      app.rerender();
    } catch (error) {
      status.textContent = error.message;
    }
  });

  const remove = h(
    'button',
    {
      type: 'button',
      class: 'btn btn-ghost btn-sm',
      onclick: () => {
        app.set(path, '');
        showPreview('');
        status.textContent = '';
        app.rerender();
      },
    },
    'Odstrani'
  );

  return withRevert(
    app,
    path,
    h(
      'div',
      { class: 'field field-image', dataset: { path } },
      h('span', { class: 'field-label' }, label),
      h(
        'div',
        { class: 'image-row' },
        preview,
        h(
          'div',
          { class: 'image-controls' },
          h('div', { class: 'image-buttons' }, h('label', { class: 'btn btn-ghost btn-sm', for: `${id}-file` }, icon('upload'), value ? 'Zamenjaj' : 'Naloži'), value ? remove : null, file),
          status
        )
      ),
      help ? h('p', { class: 'field-help' }, help) : null
    )
  );
}

// --- dialogs and toasts ---------------------------------------------------------------

export function confirmDialog({ title, body, confirm = 'Nadaljuj', cancel = 'Prekliči', danger = false, extra }) {
  return new Promise((resolve) => {
    const dialog = h(
      'dialog',
      { class: 'dialog' },
      h(
        'form',
        { method: 'dialog' },
        h('h2', { class: 'dialog-title' }, title),
        h('div', { class: 'dialog-body' }, body),
        h(
          'div',
          { class: 'dialog-actions' },
          h('button', { value: 'cancel', class: 'btn btn-ghost' }, cancel),
          extra ? h('button', { value: 'extra', class: 'btn btn-ghost' }, extra) : null,
          h('button', { value: 'ok', class: `btn ${danger ? 'btn-danger' : 'btn-primary'}` }, confirm)
        )
      )
    );
    dialog.addEventListener('close', () => {
      resolve(dialog.returnValue || 'cancel');
      dialog.remove();
    });
    document.body.append(dialog);
    dialog.showModal();
  });
}

export function toast(message, tone = 'info') {
  let region = document.querySelector('.toasts');
  if (!region) {
    region = h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' });
    document.body.append(region);
  }
  const el = h('div', { class: `toast toast-${tone}` }, icon(tone === 'error' ? 'alert' : 'check'), h('span', {}, message));
  region.append(el);
  setTimeout(() => el.classList.add('leaving'), tone === 'error' ? 7600 : 4200);
  setTimeout(() => el.remove(), tone === 'error' ? 8000 : 4600);
}
