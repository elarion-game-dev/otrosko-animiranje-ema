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
// A translatable text is stored as { sl, en, sh }. Slovenian is the original; the others fall back to it.

export const LANGS = ['sl', 'en', 'sh'];

export function isI18n(value) {
  return isPlainObject(value) && LANGS.every((l) => typeof value[l] === 'string') && Object.keys(value).length === LANGS.length;
}

/** The text in this language, or the Slovenian original when it hasn't been translated. */
export function tr(value, lang) {
  if (typeof value === 'string') return value;
  if (!isPlainObject(value)) return '';
  return value[lang] || value.sl || '';
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
