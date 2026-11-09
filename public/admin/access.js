// Password access: the site owner signs in with a password instead of pasting a GitHub token.
//
// The token is encrypted in the browser (PBKDF2-SHA256, 600 000 rounds → AES-256-GCM) and the result is
// published as admin/access.json. That file is public, so the password is the only thing protecting it:
// a long password makes guessing it offline impractical. The plain token never leaves the browser except
// to api.github.com.

const ITERATIONS = 600000;
// NIST SP 800-63B-4: at least 15 characters for a password that is the only factor.
export const MIN_PASSWORD = 15;
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

// What an attacker tries first: the site's own name, the owner's name at the start of a word, a year
// (birthdays, "2026"), and the usual suspects.
const GUESSABLE = /geslo|password|passw|admin|login|qwert|asdf|12345|abcde|otro[sš]ko|animir|elarion|github|(?:^|[^a-zčšž])ema|(?:19|20)\d\d/i;

/** Rough strength check for the password field: '' when it is fine, otherwise what is wrong. */
export function passwordProblem(password) {
  if (password.length < MIN_PASSWORD) return `Geslo naj ima vsaj ${MIN_PASSWORD} znakov. Najvarnejše je predlagano geslo iz naključnih besed (gumb »Predlagaj geslo«).`;
  if (new Set(password.toLowerCase()).size < 8) return 'Geslo ima premalo različnih znakov.';
  if (GUESSABLE.test(password)) return 'Geslo vsebuje nekaj, kar napadalci preizkusijo najprej (ime strani ali lastnice, letnico, »geslo«, »admin«, 12345 …). Izberite drugo.';
  return '';
}

// Plain words without č/š/ž, so the password is easy to type on any keyboard.
export const WORDS = (
  'balon torta zmaj sonce lisica medved zajec miska ptica riba metulj polz jez veverica sova orel ' +
  'labod raca kokos jagoda banana limona hruska jabolko sliva malina borovnica ananas melona kivi breskev ' +
  'oblak mavrica zvezda luna planet raketa letalo ladja vlak avto kolo skiro tramvaj traktor balonar ' +
  'gora reka jezero morje otok plaza gozd travnik polje vrt cvet roza tulipan marjetica soncnica ' +
  'drevo hrast lipa bukev smreka list veja korenina seme goba storz kamen pesek skala biser ' +
  'kapa sal rokavica copat sandal majica hlace krilo obleka gumb zadrga pas torba nahrbtnik deznik ' +
  'miza stol postelja blazina odeja omara polica okno vrata lestev stopnica streha dimnik balkon ' +
  'boben kitara flavta violina klavir trobenta harmonika pesem ples ritem nota zvonec piscal ' +
  'kocka zoga lok puscica kegelj frizbi kolebnica obroc tobogan gugalnica vrtiljak peskovnik ' +
  'krona grad vitez zmajcek princesa carovnik vila palcek velikan pirat zaklad mapa kompas ' +
  'svincnik barvica radirka zvezek knjiga pravljica slika okvir cevlji lepilo skarje papir ' +
  'pica testenine juha palacinka keks bonbon sladoled puding kruh sir maslo med marmelada ' +
  'jesen zima pomlad poletje jutro vecer noc dan teden praznik zabava darilo presenecenje ' +
  'tiger lev zebra zirafa slon nosorog kamela pingvin tjulenj kit delfin morski konj hobotnica ' +
  'pajek cebela mravlja kobilica ' +
  'kresnicka polh krt jazbec srna jelen volk ris kuna vidra bober hrcek zelva kuza muca ' +
  'konj krava ovca koza prasic petelin kokos puran gos osel ponij lama alpaka papiga ' +
  'kanarcek golob vrabec lastovka strk caplja cmrlj sinica kos tascica ' +
  'rumena modra zelena rdeca vijolicna oranzna roza siva bela crna zlata srebrna ' +
  'kroglica kristal magnet lupa teleskop mikroskop baterija svetilka sveca lucka ogenj voda ' +
  'veter dez sneg toca megla rosa led mavrica strela grom'
)
  .split(/\s+/)
  .filter((w, i, all) => /^[a-z]{3,12}$/.test(w) && all.indexOf(w) === i);

/** A uniformly random integer in [0, n), without modulo bias. */
function randomBelow(n) {
  const limit = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return buf[0] % n;
}

/** Five random words and a number, e.g. "zebra-kompas-hruska-boben-lipa-47": about 45 bits from the word list alone. */
export function suggestPassword(words = 5) {
  const out = Array.from({ length: words }, () => WORDS[randomBelow(WORDS.length)]);
  return `${out.join('-')}-${10 + randomBelow(90)}`;
}
