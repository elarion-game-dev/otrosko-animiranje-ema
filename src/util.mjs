// Small helpers shared by the build (Node) and the admin page (browser).
// Everything that ends up in HTML goes through esc() or attr(); every URL goes through safeUrl().

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

export const attr = esc;

/**
 * Returns the URL if it is safe to put in an href/src, otherwise ''.
 * Allows https:, http:, mailto:, tel: and site paths ("/zasebnost/", "#kontakt"). Blocks javascript:, data:, etc.
 */
export function safeUrl(value, { allowMailto = true, allowRelative = true } = {}) {
  const url = String(value ?? '').trim();
  if (!url) return '';
  if (allowRelative && /^\/(?!\/)[^\s"'<>\\]*$/.test(url)) return url;
  if (allowRelative && /^#[\w-]*$/.test(url)) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return parsed.href;
    if (allowMailto && (parsed.protocol === 'mailto:' || parsed.protocol === 'tel:')) return parsed.href;
  } catch {
    // not a URL
  }
  return '';
}

/** Path to a file inside the site, e.g. "/assets/uploads/hero-k3j2.webp". Only plain characters, so it is safe in CSS url(). */
export function safeAssetPath(value) {
  const path = String(value ?? '').trim();
  return /^\/[A-Za-z0-9/_.-]+$/.test(path) && !path.includes('..') ? path : '';
}

// Smaller copies of a photo ("renditions") sit next to it as "name-480w.webp". The editor makes them when a photo
// is uploaded, the build finds them on disk, and the pages offer them with srcset, so a phone downloads a photo
// the size of its frame instead of the full upload (which the gallery's lightbox still shows).
export const RENDITION_WIDTHS = [320, 480, 800];

/** The rendition widths worth making for a photo this wide: none within 15% of the photo itself. */
export const renditionWidths = (width) => RENDITION_WIDTHS.filter((w) => w <= width * 0.85);

/** "/assets/uploads/hero-k3j2.webp" → "/assets/uploads/hero-k3j2-480w.webp" */
export const renditionPath = (path, width) => path.replace(/(\.[A-Za-z0-9]+)$/, `-${width}w$1`);

/**
 * The path part of the site address, without a trailing slash: "/otrosko-animiranje-ema" on GitHub Pages,
 * "" on a domain of its own. Every link and file on the site starts with it.
 */
export function basePath(siteUrl) {
  try {
    const path = new URL(siteUrl).pathname.replace(/\/+$/, '');
    return /^(\/[A-Za-z0-9._~-]+)*$/.test(path) ? path : '';
  } catch {
    return '';
  }
}

export function isEmail(value) {
  const email = String(value ?? '').trim();
  return email.length <= 254 && /^[^\s@<>()"',;:]+@[^\s@<>()"',;:]+\.[^\s@<>()"',;:]{2,}$/.test(email);
}

/** A phone number as typed ("041 123 456", "+386 41 123 456"). */
export function isPhone(value) {
  const v = String(value ?? '').trim();
  return /^\+?[\d\s/().-]{6,24}$/.test(v) && v.replace(/\D/g, '').length >= 6;
}

/**
 * International digits for tel:, WhatsApp and Viber links. Slovenian numbers written without a country
 * code ("041 123 456") get +386.
 */
export function phoneDigits(value, defaultCountry = '386') {
  const v = String(value ?? '').trim();
  if (!isPhone(v)) return '';
  const digits = v.replace(/\D/g, '');
  if (v.startsWith('+')) return digits;
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0')) return defaultCountry + digits.slice(1);
  return digits;
}

export function isHexColor(value) {
  return /^#[0-9a-f]{6}$/i.test(String(value ?? ''));
}

export function slugify(value, fallback = 'file') {
  const slug = String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/đ/g, 'd')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40)
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

export function clamp(n, min, max) {
  const num = Number(n);
  if (!Number.isFinite(num)) return min;
  return Math.min(max, Math.max(min, num));
}

export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Read "a.b.c" from an object. */
export function getPath(obj, path) {
  return path.split('.').reduce((o, key) => (o == null ? undefined : o[key]), obj);
}

/** Write "a.b.c" into an object, creating objects along the way. */
export function setPath(obj, path, value) {
  const keys = path.split('.');
  let target = obj;
  for (const key of keys.slice(0, -1)) {
    if (!isPlainObject(target[key]) && !Array.isArray(target[key])) target[key] = {};
    target = target[key];
  }
  target[keys[keys.length - 1]] = value;
}

// --- translations ------------------------------------------------------------------------
// A translatable text is stored as { sl, en, hr, sr }. Slovenian is the original; the others fall back to it.
// Croatian and Serbian are close enough that an untranslated text falls back to the other one first.
// Serbian is shown in Cyrillic. The owner may write it in Latin (easier on a Slovenian keyboard): the page
// converts it, so the stored text can be in either script.

export const LANGS = ['sl', 'en', 'hr', 'sr'];

export function isI18n(value) {
  return isPlainObject(value) && LANGS.every((l) => typeof value[l] === 'string') && Object.keys(value).length === LANGS.length;
}

const FALLBACK = { hr: ['sr'], sr: ['hr'] };

/**
 * The text in this language (Serbian in Cyrillic), or the closest available one when it hasn't been translated.
 * `keep`: names that stay as written in Serbian too (the site's own name).
 */
export function tr(value, lang, keep = []) {
  if (typeof value === 'string') return lang === 'sr' ? toCyrillic(value, keep) : value;
  if (!isPlainObject(value)) return '';
  const text = [lang, ...(FALLBACK[lang] ?? []), 'sl'].map((l) => value[l]).find((v) => typeof v === 'string' && v.trim()) || '';
  return lang === 'sr' ? toCyrillic(text, keep) : text;
}

// --- Serbian Latin → Cyrillic ---------------------------------------------------------------------------
// Serbian has an exact letter-for-letter mapping (lj, nj and dž are single letters). Left alone: HTML tags and
// entities, Markdown link targets, {placeholders}, addresses, and foreign names (brands, words with w/q/x/y or a
// capital inside, like WhatsApp), which Serbian texts keep in Latin.

const CYR = {
  a: 'а', b: 'б', c: 'ц', č: 'ч', ć: 'ћ', d: 'д', đ: 'ђ', e: 'е', f: 'ф', g: 'г', h: 'х', i: 'и', j: 'ј', k: 'к', l: 'л', m: 'м',
  n: 'н', o: 'о', p: 'п', r: 'р', s: 'с', š: 'ш', t: 'т', u: 'у', v: 'в', z: 'з', ž: 'ж', lj: 'љ', nj: 'њ', dž: 'џ',
};
const KEEP_LATIN = new Set(['viber', 'facebook', 'instagram', 'google', 'formspree', 'messenger', 'telegram', 'threads', 'github', 'gmail', 'web3forms', 'netlify', 'pages', 'inc', 'gdpr', 'ip']);
const PROTECTED = /(<[^>]*>|&[#a-z0-9]+;|\]\([^)]*\)|\{\w+\}|https?:\/\/\S+|www\.\S+|[^\s@<>()]+@[^\s@<>()]+\.[a-z]{2,})/gi;
const LATIN_WORD = /[A-Za-zČčĆćĐđŠšŽž]+/g;

function wordToCyrillic(word) {
  const lower = word.toLowerCase();
  if (/[wqxy]/i.test(word) || /[a-zčćđšž][A-ZČĆĐŠŽ]/.test(word) || KEEP_LATIN.has(lower)) return word;
  let out = '';
  for (let i = 0; i < word.length; i++) {
    const pair = lower.slice(i, i + 2);
    const two = pair === 'lj' || pair === 'nj' || pair === 'dž';
    const key = two ? pair : lower[i];
    let cyr = CYR[key] ?? word[i];
    // Uppercase when the source letter is (Lj, LJ, Nj → Љ, Њ).
    if (word[i] !== lower[i]) cyr = cyr.toUpperCase();
    out += cyr;
    if (two) i++;
  }
  return out;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Serbian Latin text as Cyrillic; `keep` lists names left in Latin. Text that is already Cyrillic stays as it is. */
export function toCyrillic(text, keep = []) {
  const names = keep.map((k) => String(k ?? '').trim()).filter((k) => k.length > 1);
  const pattern = names.length ? new RegExp(`(${names.map(escapeRe).join('|')}|${PROTECTED.source.slice(1, -1)})`, 'gi') : PROTECTED;
  return String(text ?? '')
    .split(pattern)
    .map((part, i) => (i % 2 ? part : part.replace(LATIN_WORD, wordToCyrillic)))
    .join('');
}

/** Every translatable text in an object, with its path: [{ path, value }]. */
export function i18nFields(obj, prefix = '') {
  const out = [];
  if (isI18n(obj)) return [{ path: prefix, value: obj }];
  if (Array.isArray(obj)) obj.forEach((item, i) => out.push(...i18nFields(item, prefix ? `${prefix}.${i}` : String(i))));
  else if (isPlainObject(obj)) for (const [key, item] of Object.entries(obj)) out.push(...i18nFields(item, prefix ? `${prefix}.${key}` : key));
  return out;
}

export function formatDate(iso, locale = 'sl-SI') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso ?? ''))) return '';
  const date = new Date(`${iso}T12:00:00Z`);
  try {
    return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
  } catch {
    return iso;
  }
}
