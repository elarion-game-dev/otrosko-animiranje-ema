// Where the inquiry form sends its messages. The site is static, so a message goes either to the visitor's
// own email app (mailto, needs no extra service) or straight from the browser to a form service.
// Nothing is ever stored on this website or in its repository.
//
// Each provider describes: the settings the admin fills in, the form's POST URL, extra hidden fields,
// how it answers (json / navigate / mailto) and what the privacy policy says about it.

import { isEmail, safeUrl } from './util.mjs';

export const PROVIDERS = {
  none: {
    label: 'Brez obrazca (samo kontaktni podatki)',
    fields: [],
  },
  mailto: {
    label: 'E-poštni program obiskovalca (brez dodatnih storitev)',
    short: 'e-pošta',
    fields: [],
    responds: 'mailto',
  },
  formspree: {
    label: 'Formspree (sporočila pridejo na vaš e-naslov)',
    short: 'Formspree',
    site: 'https://formspree.io',
    privacyUrl: 'https://formspree.io/legal/privacy-policy',
    region: { sl: 'ZDA', en: 'United States', hr: 'SAD', sr: 'SAD' },
    fields: [
      {
        key: 'formId',
        label: 'ID obrazca',
        pattern: /^[A-Za-z0-9]{6,16}$/,
        placeholder: 'xyzabcde',
        help: 'Na formspree.io odprite obrazec: ID je zadnji del naslova »https://formspree.io/f/xyzabcde«. Lahko prilepite kar cel naslov.',
      },
    ],
    action: (c) => `https://formspree.io/f/${c.formId}`,
    hidden: () => ({}),
    responds: 'json',
  },
  custom: {
    label: 'Druga storitev ali lasten strežnik',
    short: 'Drugo',
    fields: [
      { key: 'action', label: 'Naslov za pošiljanje (action)', pattern: /^https:\/\/\S+$/, placeholder: 'https://…', help: 'Naslov, kamor obrazec pošlje podatke. Začeti se mora s https://.' },
      { key: 'providerName', label: 'Ime storitve (za politiko zasebnosti)', pattern: /^.{1,60}$/, placeholder: 'npr. Web3Forms' },
      { key: 'privacyUrl', label: 'Politika zasebnosti storitve (neobvezno)', pattern: /^https:\/\/\S+$/, placeholder: 'https://…', optional: true },
      { key: 'extraName', label: 'Dodatno skrito polje: ime (neobvezno)', pattern: /^[\w[\]-]{1,64}$/, placeholder: 'access_key', optional: true, help: 'Nekatere storitve zahtevajo ključ v skritem polju, npr. Web3Forms »access_key«.' },
      { key: 'extraValue', label: 'Dodatno skrito polje: vrednost (neobvezno)', pattern: /^[\w.:@-]{1,200}$/, placeholder: 'vaš-ključ', optional: true },
    ],
    action: (c) => safeUrl(c.action, { allowMailto: false, allowRelative: false }),
    hidden: (c) => (c.extraName && c.extraValue ? { [c.extraName]: c.extraValue } : {}),
    // json: the page stays and shows the thank-you message; navigate: the browser goes to the service's own page.
    modes: { json: 'Stran ostane odprta in pokaže zahvalo (storitev odgovori v JSON)', navigate: 'Brskalnik se preusmeri na stran storitve ali na vašo stran /hvala/' },
  },
};

export const PROVIDER_IDS = Object.keys(PROVIDERS);

/** "https://formspree.io/f/abc123" or "abc123" → "abc123". */
export function formspreeId(value) {
  const v = String(value ?? '').trim();
  const match = v.match(/formspree\.io\/f\/([A-Za-z0-9]+)/);
  return match ? match[1] : v;
}

/**
 * Resolve the form settings into everything the form needs. `ready` is false until required settings are valid.
 * `email` is the site's contact address (used by the mailto option).
 */
export function resolveProvider(form, email) {
  const id = PROVIDERS[form?.provider] ? form.provider : 'none';
  const def = PROVIDERS[id];
  if (id === 'none') return { id, ready: false, label: def.label, missing: [] };
  if (id === 'mailto') {
    return isEmail(email)
      ? { id, ready: true, label: def.label, name: '', action: `mailto:${email}`, origin: '', hidden: {}, responds: 'mailto' }
      : { id, ready: false, label: def.label, missing: ['kontaktni e-naslov (Kontakt)'] };
  }

  const config = form?.[id] ?? {};
  const missing = def.fields.filter((f) => !f.optional && !f.pattern.test(String(config[f.key] ?? '')));
  const invalid = def.fields.filter((f) => f.optional && config[f.key] && !f.pattern.test(String(config[f.key])));
  if (missing.length || invalid.length) return { id, ready: false, label: def.label, missing: [...missing, ...invalid].map((f) => f.label) };

  const action = def.action(config);
  let origin = '';
  try {
    origin = new URL(action).origin;
  } catch {
    return { id, ready: false, label: def.label, missing: ['naslov za pošiljanje'] };
  }
  return {
    id,
    ready: true,
    label: def.label,
    name: id === 'custom' ? config.providerName : def.short,
    privacyUrl: id === 'custom' ? safeUrl(config.privacyUrl, { allowMailto: false, allowRelative: false }) : def.privacyUrl,
    region: def.region ?? null,
    action,
    origin,
    hidden: def.hidden(config),
    responds: id === 'custom' ? (config.mode === 'navigate' ? 'navigate' : 'json') : def.responds,
  };
}
