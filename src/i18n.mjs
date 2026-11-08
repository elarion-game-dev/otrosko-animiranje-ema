// Languages, page addresses and the fixed texts of the public site (labels, messages, aria labels).
// Texts the owner writes live in the settings; these are the ones that come with the site.
// Slovenian is the main language and lives at the site root; the others under /en/ and /sh/.

import { LANGS } from './util.mjs';

export { LANGS };

export const LANG_INFO = {
  sl: { name: 'Slovenščina', short: 'SL', prefix: '', locale: 'sl-SI', og: 'sl_SI', hreflang: ['sl'] },
  en: { name: 'English', short: 'EN', prefix: 'en', locale: 'en-GB', og: 'en_GB', hreflang: ['en'] },
  // Serbo-Croatian, Latin script. Search engines don't know "sh", so the page is offered for hr, bs and sr too.
  sh: { name: 'Srpskohrvatski', short: 'SH', prefix: 'sh', locale: 'hr', og: 'hr_HR', hreflang: ['hr', 'bs', 'sr-Latn'] },
};

/** Address of each page in each language (without the site's base path). */
export const PAGE_SLUGS = {
  home: { sl: '', en: '', sh: '' },
  privacy: { sl: 'zasebnost', en: 'privacy', sh: 'privatnost' },
  terms: { sl: 'pogoji', en: 'terms', sh: 'uvjeti' },
  thanks: { sl: 'hvala', en: 'thank-you', sh: 'hvala' },
};

export function pagePath(page, lang) {
  const prefix = LANG_INFO[lang]?.prefix ?? '';
  const slug = PAGE_SLUGS[page]?.[lang] ?? '';
  return `/${[prefix, slug].filter(Boolean).join('/')}${prefix || slug ? '/' : ''}`;
}

/** Anchor (#…) of each home page section, so shared links read naturally in every language. */
export const ANCHORS = {
  services: { sl: 'storitve', en: 'services', sh: 'usluge' },
  steps: { sl: 'kako-poteka', en: 'how-it-works', sh: 'kako-funkcionira' },
  packages: { sl: 'paketi', en: 'packages', sh: 'paketi' },
  schedule: { sl: 'urnik', en: 'schedule', sh: 'raspored' },
  about: { sl: 'predstavitev', en: 'about', sh: 'o-nama' },
  gallery: { sl: 'galerija', en: 'gallery', sh: 'galerija' },
  testimonials: { sl: 'mnenja', en: 'reviews', sh: 'utisci' },
  faq: { sl: 'vprasanja', en: 'faq', sh: 'pitanja' },
  contact: { sl: 'kontakt', en: 'contact', sh: 'kontakt' },
};

export const WEEKDAYS = {
  sl: ['ponedeljek', 'torek', 'sreda', 'četrtek', 'petek', 'sobota', 'nedelja'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  sh: ['ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota', 'nedjelja'],
};

// Plural forms: Slovenian has four (1, 2, 3–4, 5+), the others are simplified to what the site needs.
export const UI = {
  skip: { sl: 'Preskoči na vsebino', en: 'Skip to content', sh: 'Preskoči na sadržaj' },
  menu: { sl: 'Meni', en: 'Menu', sh: 'Meni' },
  closeMenu: { sl: 'Zapri meni', en: 'Close menu', sh: 'Zatvori meni' },
  mainNav: { sl: 'Glavni meni', en: 'Main menu', sh: 'Glavni meni' },
  language: { sl: 'Jezik', en: 'Language', sh: 'Jezik' },
  call: { sl: 'Pokličite', en: 'Call', sh: 'Nazovite' },
  writeEmail: { sl: 'Pišite nam', en: 'Email us', sh: 'Pišite nam' },
  phone: { sl: 'Telefon', en: 'Phone', sh: 'Telefon' },
  email: { sl: 'E-pošta', en: 'Email', sh: 'E-mail' },
  address: { sl: 'Naslov', en: 'Address', sh: 'Adresa' },
  area: { sl: 'Kje delujemo', en: 'Where we work', sh: 'Gdje radimo' },
  hours: { sl: 'Kdaj smo dosegljivi', en: 'When to reach us', sh: 'Kada smo dostupni' },
  map: { sl: 'Odpri zemljevid', en: 'Open the map', sh: 'Otvori kartu' },
  inquire: { sl: 'Povprašaj', en: 'Ask about this', sh: 'Pošalji upit' },
  priceOnRequest: { sl: 'Cena po dogovoru', en: 'Price on request', sh: 'Cijena po dogovoru' },
  rating: { sl: 'Ocena {n} od 5', en: 'Rated {n} out of 5', sh: 'Ocjena {n} od 5' },
  enlarge: { sl: 'Povečaj sliko', en: 'Enlarge photo', sh: 'Uvećaj sliku' },
  close: { sl: 'Zapri', en: 'Close', sh: 'Zatvori' },
  previous: { sl: 'Prejšnja slika', en: 'Previous photo', sh: 'Prethodna slika' },
  next: { sl: 'Naslednja slika', en: 'Next photo', sh: 'Sljedeća slika' },
  privacyPolicy: { sl: 'Politika zasebnosti', en: 'Privacy policy', sh: 'Politika privatnosti' },
  // As it reads inside a sentence: "Več v {privacy}."
  privacyInSentence: { sl: 'politiki zasebnosti', en: 'privacy policy', sh: 'politici privatnosti' },
  backHome: { sl: 'Nazaj na začetno stran', en: 'Back to the home page', sh: 'Natrag na početnu stranicu' },
  social: { sl: 'Družbena omrežja', en: 'Social media', sh: 'Društvene mreže' },
  business: { sl: 'Podatki o podjetju', en: 'Company details', sh: 'Podaci o tvrtki' },
  registration: { sl: 'Matična številka', en: 'Registration no.', sh: 'Matični broj' },
  taxNumber: { sl: 'Davčna številka', en: 'Tax no.', sh: 'Porezni broj' },
  vatId: { sl: 'ID za DDV', en: 'VAT ID', sh: 'PDV ID' },
  effective: { sl: 'Velja od', en: 'Effective', sh: 'Vrijedi od' },
  // Form
  required: { sl: 'obvezno', en: 'required', sh: 'obavezno' },
  chooseService: { sl: 'Izberite …', en: 'Choose …', sh: 'Odaberite …' },
  otherService: { sl: 'Nekaj drugega', en: 'Something else', sh: 'Nešto drugo' },
  honeypot: { sl: 'Tega polja ne izpolnjujte', en: 'Leave this field empty', sh: 'Ne ispunjavajte ovo polje' },
  sending: { sl: 'Pošiljam …', en: 'Sending …', sh: 'Šaljem …' },
  errRequired: { sl: 'Izpolnite to polje.', en: 'Please fill in this field.', sh: 'Ispunite ovo polje.' },
  errEmail: { sl: 'Vpišite veljaven e-poštni naslov.', en: 'Please enter a valid email address.', sh: 'Upišite ispravnu e-mail adresu.' },
  errPhone: { sl: 'Vpišite veljavno telefonsko številko.', en: 'Please enter a valid phone number.', sh: 'Upišite ispravan broj telefona.' },
  errContact: {
    sl: 'Vpišite e-pošto ali telefon, da vam lahko odgovorimo.',
    en: 'Please give an email address or phone number so we can reply.',
    sh: 'Upišite e-mail ili telefon kako bismo vam mogli odgovoriti.',
  },
  errDate: { sl: 'Ta datum je že mimo.', en: 'That date has already passed.', sh: 'Taj datum je već prošao.' },
  errTooMany: {
    sl: 'Preveč poskusov. Počakajte minuto in poskusite znova.',
    en: 'Too many attempts. Please wait a minute and try again.',
    sh: 'Previše pokušaja. Pričekajte minutu i pokušajte ponovno.',
  },
  errNetwork: {
    sl: 'Sporočila ni bilo mogoče poslati. Preverite povezavo ali nas pokličite.',
    en: "The message couldn't be sent. Check your connection or give us a call.",
    sh: 'Poruku nije bilo moguće poslati. Provjerite vezu ili nas nazovite.',
  },
  mailtoNote: {
    sl: 'Ob kliku se odpre vaš e-poštni program s pripravljenim sporočilom.',
    en: 'This opens your email app with the message ready to send.',
    sh: 'Klikom se otvara vaš program za e-poštu s pripremljenom porukom.',
  },
  mailtoSubject: { sl: 'Povpraševanje s spletne strani', en: 'Inquiry from the website', sh: 'Upit s web stranice' },
  mailtoDoneTitle: { sl: 'Še en korak', en: 'One more step', sh: 'Još jedan korak' },
  mailtoDoneBody: {
    sl: 'V e-poštnem programu se je odprlo pripravljeno sporočilo. Pošljite ga in odgovorimo vam v najkrajšem možnem času.',
    en: 'Your email app has opened with the message ready. Send it, and we will reply as soon as we can.',
    sh: 'U programu za e-poštu otvorila se pripremljena poruka. Pošaljite je i odgovorit ćemo vam što prije.',
  },
  formClosed: {
    sl: 'Obrazec trenutno ni na voljo. Pokličite nas ali nam pišite.',
    en: 'The form is not available right now. Please call or email us.',
    sh: 'Obrazac trenutno nije dostupan. Nazovite nas ili nam pišite.',
  },
  notFoundTitle: { sl: 'Te strani ni', en: 'Page not found', sh: 'Ova stranica ne postoji' },
  notFoundText: {
    sl: 'Povezava je morda stara ali pa se je stran preselila.',
    en: 'The link may be old, or the page has moved.',
    sh: 'Poveznica je možda stara ili je stranica premještena.',
  },
};

/** Default labels of the inquiry form fields (the owner can override each one in the admin). */
export const FIELD_LABELS = {
  name: { sl: 'Ime in priimek', en: 'Your name', sh: 'Ime i prezime' },
  email: { sl: 'E-pošta', en: 'Email', sh: 'E-mail' },
  phone: { sl: 'Telefon', en: 'Phone', sh: 'Telefon' },
  date: { sl: 'Datum dogodka', en: 'Date of the event', sh: 'Datum događaja' },
  time: { sl: 'Ura', en: 'Time', sh: 'Vrijeme' },
  location: { sl: 'Kraj ali naslov', en: 'Place or address', sh: 'Mjesto ili adresa' },
  children: { sl: 'Število otrok', en: 'Number of children', sh: 'Broj djece' },
  age: { sl: 'Starost otrok', en: "Children's ages", sh: 'Dob djece' },
  service: { sl: 'Kaj vas zanima?', en: 'What are you interested in?', sh: 'Što vas zanima?' },
  message: { sl: 'Sporočilo', en: 'Message', sh: 'Poruka' },
};

export const FIELD_PLACEHOLDERS = {
  age: { sl: 'npr. 5–7 let', en: 'e.g. 5–7 years', sh: 'npr. 5–7 godina' },
  location: { sl: 'npr. Ljubljana, doma', en: 'e.g. Ljubljana, at home', sh: 'npr. Ljubljana, kod kuće' },
  message: {
    sl: 'Povejte nam kaj več o praznovanju: priložnost, želje, posebnosti …',
    en: 'Tell us a bit more: the occasion, wishes, anything special …',
    sh: 'Recite nam nešto više o proslavi: povod, želje, posebnosti …',
  },
};

/** Field names sent to the form service. Slovenian keys, so the owner's notification emails read naturally. */
export const FIELD_KEYS = {
  name: 'ime',
  email: 'email',
  phone: 'telefon',
  date: 'datum',
  time: 'ura',
  location: 'lokacija',
  children: 'stevilo_otrok',
  age: 'starost',
  service: 'storitev',
  message: 'sporocilo',
};

export const ui = (key, lang, vars = {}) => {
  const text = UI[key]?.[lang] ?? UI[key]?.sl ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ''));
};
