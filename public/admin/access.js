// Password access: the site owner signs in with a password instead of pasting a GitHub token.
//
// The token is encrypted in the browser (PBKDF2-SHA256, 600 000 rounds → AES-256-GCM) and the result is
// published as admin/access.json. That file is public, so the password is the only thing protecting it:
// a long password makes guessing it offline impractical. The plain token never leaves the browser except
// to api.github.com.

const ITERATIONS = 600000;
export const MIN_PASSWORD = 12;
const enc = new TextEncoder();

const toBase64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const fromBase64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

async function deriveKey(password, salt, iterations) {
  const material = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

/** The JSON to publish. `label` is shown on the sign-in page ("Ema"), never secret. */
export async function encryptToken(token, password, label = '') {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, ITERATIONS);
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(token));
  return { v: 1, kdf: 'PBKDF2-SHA256', iterations: ITERATIONS, salt: toBase64(salt), iv: toBase64(iv), data: toBase64(data), label: String(label).slice(0, 40), created: new Date().toISOString().slice(0, 10) };
}

/** The token, or null when the password is wrong. */
export async function decryptToken(blob, password) {
  try {
    const key = await deriveKey(password, fromBase64(blob.salt), Number(blob.iterations) || ITERATIONS);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(blob.iv) }, key, fromBase64(blob.data));
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

export function isAccessFile(value) {
  return Boolean(value && value.v === 1 && typeof value.salt === 'string' && typeof value.iv === 'string' && typeof value.data === 'string');
}

/** The published access file next to the admin page, or null. */
export async function loadAccess() {
  try {
    const response = await fetch('access.json', { cache: 'no-store', credentials: 'omit' });
    if (!response.ok) return null;
    const data = await response.json();
    return isAccessFile(data) ? data : null;
  } catch {
    return null;
  }
}

/** Rough strength hint for the password field. */
export function passwordProblem(password) {
  if (password.length < MIN_PASSWORD) return `Geslo naj ima vsaj ${MIN_PASSWORD} znakov. Najlažje so tri ali štiri naključne besede, npr. »balon-torta-zmaj-poletje«.`;
  if (/^(.)\1+$/.test(password) || /^(?:0123|1234|abcd|qwer|geslo|password)/i.test(password)) return 'To geslo je preveč predvidljivo.';
  return '';
}
