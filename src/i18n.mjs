// Languages, page addresses and the fixed texts of the public site (labels, messages, aria labels).
// Texts the owner writes live in the settings; these are the ones that come with the site.
// Slovenian is the main language and lives at the site root; the others under /en/ and /sh/.
// The site speaks as Ema, in the first person singular, and addresses parents formally ("vi").

import { LANGS } from './util.mjs';

export { LANGS };

export const LANG_INFO = {
  sl: { name: 'Slovenščina', short: 'SL', prefix: '', locale: 'sl-SI', og: 'sl_SI', hreflang: ['sl'], flags: ['si'] },
  en: { name: 'English', short: 'EN', prefix: 'en', locale: 'en-GB', og: 'en_GB', hreflang: ['en'], flags: ['gb'] },
  // Serbo-Croatian, Latin script. Search engines don't know "sh", so the page is offered for hr, bs and sr too.
  // Its flags are chosen in the settings (languages.sh.flags).
  sh: { name: 'Srpskohrvatski', short: 'SH', prefix: 'sh', locale: 'hr', og: 'hr_HR', hreflang: ['hr', 'bs', 'sr-Latn'], flags: [] },
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
  steps: { sl: 'program', en: 'programme', sh: 'program' },
  packages: { sl: 'paketi', en: 'packages', sh: 'paketi' },
  schedule: { sl: 'sportne-urice', en: 'sports-classes', sh: 'sportske-aktivnosti' },
  events: { sl: 'dogodki', en: 'events', sh: 'dogadaji' },
  about: { sl: 'o-meni', en: 'about', sh: 'o-meni' },
  gallery: { sl: 'utrinki', en: 'gallery', sh: 'galerija' },
  testimonials: { sl: 'mnenja', en: 'reviews', sh: 'utisci' },
  faq: { sl: 'vprasanja', en: 'faq', sh: 'pitanja' },
  contact: { sl: 'rezervacija', en: 'booking', sh: 'rezervacija' },
  services: { sl: 'ponudba', en: 'services', sh: 'ponuda' },
};

export const WEEKDAYS = {
  sl: ['ponedeljek', 'torek', 'sreda', 'četrtek', 'petek', 'sobota', 'nedelja'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  sh: ['ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota', 'nedjelja'],
};

/** "On Tuesdays": how a weekly class is announced. */
export const WEEKDAYS_ON = {
  sl: ['ob ponedeljkih', 'ob torkih', 'ob sredah', 'ob četrtkih', 'ob petkih', 'ob sobotah', 'ob nedeljah'],
  en: ['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays'],
  sh: ['ponedjeljkom', 'utorkom', 'srijedom', 'četvrtkom', 'petkom', 'subotom', 'nedjeljom'],
};

export const UI = {
  skip: { sl: 'Preskoči na vsebino', en: 'Skip to content', sh: 'Preskoči na sadržaj' },
  home: { sl: 'na začetno stran', en: 'home page', sh: 'na početnu stranicu' },
  menu: { sl: 'Meni', en: 'Menu', sh: 'Meni' },
  closeMenu: { sl: 'Zapri meni', en: 'Close menu', sh: 'Zatvori meni' },
  mainNav: { sl: 'Glavni meni', en: 'Main menu', sh: 'Glavni meni' },
  language: { sl: 'Jezik', en: 'Language', sh: 'Jezik' },
  languageNow: { sl: 'jezik: {name}', en: 'language: {name}', sh: 'jezik: {name}' },
  call: { sl: 'Pokličite', en: 'Call', sh: 'Nazovite' },
  callNumber: { sl: 'Pokličite {phone}', en: 'Call {phone}', sh: 'Nazovite {phone}' },
  sameNumber: { sl: 'Na isto številko', en: 'Same number', sh: 'Na isti broj' },
  writeViber: { sl: 'Pišite na Viber', en: 'Message me on Viber', sh: 'Pišite na Viber' },
  writeWhatsapp: { sl: 'Pišite na WhatsApp', en: 'Message me on WhatsApp', sh: 'Pišite na WhatsApp' },
  phone: { sl: 'Telefon', en: 'Phone', sh: 'Telefon' },
  email: { sl: 'E-pošta', en: 'Email', sh: 'E-mail' },
  address: { sl: 'Naslov', en: 'Address', sh: 'Adresa' },
  area: { sl: 'Kje delujem', en: 'Where I work', sh: 'Gdje radim' },
  hours: { sl: 'Kdaj sem dosegljiva', en: 'When to reach me', sh: 'Kada sam dostupna' },
  map: { sl: 'Odpri zemljevid', en: 'Open the map', sh: 'Otvori kartu' },
  contactDirect: { sl: 'Neposreden kontakt', en: 'Contact me directly', sh: 'Izravan kontakt' },
  orForm: { sl: 'ali izpolnite obrazec', en: 'or fill in the form', sh: 'ili ispunite obrazac' },
  quickBar: { sl: 'Hitri kontakt', en: 'Quick contact', sh: 'Brzi kontakt' },
  inquire: { sl: 'Povprašajte', en: 'Ask about this', sh: 'Pošaljite upit' },
  priceOnRequest: { sl: 'Cena po dogovoru', en: 'Price on request', sh: 'Cijena po dogovoru' },
  byArrangement: { sl: 'Po dogovoru', en: 'By arrangement', sh: 'Po dogovoru' },
  at: { sl: 'ob', en: 'at', sh: 'u' },
  when: { sl: 'Kdaj', en: 'When', sh: 'Kada' },
  whenHint: { sl: 'Datum bo prenesen v obrazec za povpraševanje.', en: 'The date will be copied into the enquiry form.', sh: 'Datum će biti prenesen u obrazac za upit.' },
  thanksNote: { sl: 'Hvala!', en: 'Thank you!', sh: 'Hvala!' },
  rating: { sl: 'Ocena {n} od 5', en: 'Rated {n} out of 5', sh: 'Ocjena {n} od 5' },
  gallery: { sl: 'Galerija fotografij', en: 'Photo gallery', sh: 'Galerija fotografija' },
  swipe: { sl: 'Podrsajte', en: 'Swipe', sh: 'Povucite' },
  photo: { sl: 'Fotografija', en: 'Photo', sh: 'Fotografija' },
  enlarge: { sl: 'Povečaj sliko', en: 'Enlarge photo', sh: 'Uvećaj sliku' },
  close: { sl: 'Zapri', en: 'Close', sh: 'Zatvori' },
  previous: { sl: 'Prejšnja slika', en: 'Previous photo', sh: 'Prethodna slika' },
  next: { sl: 'Naslednja slika', en: 'Next photo', sh: 'Sljedeća slika' },
  privacyPolicy: { sl: 'Politika zasebnosti', en: 'Privacy policy', sh: 'Politika privatnosti' },
  // As it reads inside a sentence: "Več v {privacy}."
  privacyInSentence: { sl: 'politiki zasebnosti', en: 'privacy policy', sh: 'politici privatnosti' },
  backHome: { sl: 'Nazaj na začetno stran', en: 'Back to the home page', sh: 'Natrag na početnu stranicu' },
  footContact: { sl: 'Kontakt', en: 'Contact', sh: 'Kontakt' },
  footPages: { sl: 'Stran', en: 'On this site', sh: 'Stranica' },
  footFollow: { sl: 'Sledite', en: 'Follow', sh: 'Pratite' },
  social: { sl: 'Družbena omrežja', en: 'Social media', sh: 'Društvene mreže' },
  business: { sl: 'Podatki o podjetju', en: 'Company details', sh: 'Podaci o tvrtki' },
  registration: { sl: 'Matična številka', en: 'Registration no.', sh: 'Matični broj' },
  taxNumber: { sl: 'Davčna številka', en: 'Tax no.', sh: 'Porezni broj' },
  vatId: { sl: 'ID za DDV', en: 'VAT ID', sh: 'PDV ID' },
  effective: { sl: 'Velja od', en: 'Effective', sh: 'Vrijedi od' },
  // Form
  honeypot: { sl: 'Tega polja ne izpolnjujte', en: 'Leave this field empty', sh: 'Ne ispunjavajte ovo polje' },
  sending: { sl: 'Pošiljam …', en: 'Sending …', sh: 'Šaljem …' },
  errTooMany: {
    sl: 'Preveč poskusov. Počakajte minuto in poskusite znova.',
    en: 'Too many attempts. Please wait a minute and try again.',
    sh: 'Previše pokušaja. Pričekajte minutu i pokušajte ponovno.',
  },
  errNetwork: {
    sl: 'Sporočila ni bilo mogoče poslati. Preverite povezavo ali me pokličite.',
    en: "The message couldn't be sent. Check your connection or give me a call.",
    sh: 'Poruku nije bilo moguće poslati. Provjerite vezu ili me nazovite.',
  },
  mailtoNote: {
    sl: 'Ob kliku se odpre vaš e-poštni program s pripravljenim sporočilom.',
    en: 'This opens your email app with the message ready to send.',
    sh: 'Klikom se otvara vaš program za e-poštu s pripremljenom porukom.',
  },
  mailtoSubject: { sl: 'Povpraševanje s spletne strani', en: 'Enquiry from the website', sh: 'Upit s web stranice' },
  mailtoDoneTitle: { sl: 'Še en korak', en: 'One more step', sh: 'Još jedan korak' },
  mailtoDoneBody: {
    sl: 'V e-poštnem programu se je odprlo pripravljeno sporočilo. Pošljite ga in odgovorim vam čim prej.',
    en: 'Your email app has opened with the message ready. Send it, and I will reply as soon as I can.',
    sh: 'U programu za e-poštu otvorila se pripremljena poruka. Pošaljite je i odgovorit ću vam što prije.',
  },
  formClosed: {
    sl: 'Obrazec trenutno ni na voljo. Pokličite me ali mi pišite.',
    en: 'The form is not available right now. Please call or email me.',
    sh: 'Obrazac trenutno nije dostupan. Nazovite me ili mi pišite.',
  },
  notFoundTitle: { sl: 'Te strani ni', en: 'Page not found', sh: 'Ova stranica ne postoji' },
  notFoundText: {
    sl: 'Povezava je morda stara ali pa se je stran preselila.',
    en: 'The link may be old, or the page has moved.',
    sh: 'Poveznica je možda stara ili je stranica premještena.',
  },
};

/** Texts of the booking form. Labels follow the design; the owner chooses which optional questions are asked. */
export const FORM_TEXT = {
  topic: { sl: 'Kaj vas zanima?', en: 'What are you interested in?', sh: 'Što vas zanima?' },
  topicParty: { sl: 'Rojstni dan', en: 'Birthday party', sh: 'Rođendan' },
  topicSport: { sl: 'Športne urice', en: 'Sports classes', sh: 'Sportske aktivnosti' },
  topicEvent: { sl: 'Drug dogodek', en: 'Another event', sh: 'Drugi događaj' },
  partyDate: { sl: 'Datum zabave', en: 'Date of the party', sh: 'Datum zabave' },
  partyAge: { sl: 'Starost slavljenca', en: "Birthday child's age", sh: 'Dob slavljenika' },
  kids: { sl: 'Število otrok', en: 'Number of children', sh: 'Broj djece' },
  kidsPlaceholder: { sl: 'npr. 12', en: 'e.g. 12', sh: 'npr. 12' },
  package: { sl: 'Paket', en: 'Package', sh: 'Paket' },
  notSure: { sl: 'Še ne vem', en: 'Not sure yet', sh: 'Još ne znam' },
  choose: { sl: 'Izberite', en: 'Choose', sh: 'Odaberite' },
  time: { sl: 'Okvirna ura', en: 'Rough time of day', sh: 'Okvirno vrijeme' },
  morning: { sl: 'Dopoldne', en: 'Morning', sh: 'Prijepodne' },
  afternoon: { sl: 'Popoldne', en: 'Afternoon', sh: 'Poslijepodne' },
  where: { sl: 'Kje bo zabava?', en: 'Where will the party be?', sh: 'Gdje će biti zabava?' },
  whereHome: { sl: 'Pri nas doma', en: 'At our home', sh: 'Kod nas doma' },
  whereVenue: { sl: 'V najetem prostoru', en: 'In a rented venue', sh: 'U iznajmljenom prostoru' },
  town: { sl: 'Kraj', en: 'Town', sh: 'Mjesto' },
  townHint: { sl: '(neobvezno, za izračun potnih stroškov)', en: '(optional, to work out travel costs)', sh: '(neobavezno, za izračun putnih troškova)' },
  townPlaceholder: { sl: 'npr. Domžale', en: 'e.g. Ljubljana', sh: 'npr. Ljubljana' },
  sportAge: { sl: 'Starost otroka', en: "Child's age", sh: 'Dob djeteta' },
  slot: { sl: 'Kateri termin vam ustreza?', en: 'Which class suits you?', sh: 'Koji termin vam odgovara?' },
  slotOther: { sl: 'Zanima me drug termin', en: "I'd like a different time", sh: 'Zanima me drugi termin' },
  trial: { sl: 'Najprej bi radi prišli na poskusno urico', en: "We'd like to come to a trial class first", sh: 'Najprije bismo došli na probni sat' },
  eventType: { sl: 'Kakšen dogodek?', en: 'What kind of event?', sh: 'Kakav događaj?' },
  eventTypePlaceholder: { sl: 'npr. poroka, krst', en: 'e.g. a wedding, a christening', sh: 'npr. vjenčanje, krštenje' },
  eventDate: { sl: 'Datum', en: 'Date', sh: 'Datum' },
  eventKids: { sl: 'Približno število otrok', en: 'Roughly how many children', sh: 'Približan broj djece' },
  optional: { sl: '(neobvezno)', en: '(optional)', sh: '(neobavezno)' },
  name: { sl: 'Vaše ime', en: 'Your name', sh: 'Vaše ime' },
  contact: { sl: 'Telefon ali e-pošta', en: 'Phone or email', sh: 'Telefon ili e-mail' },
  reply: { sl: 'Kako naj vam odgovorim?', en: 'How should I reply?', sh: 'Kako da vam odgovorim?' },
  replyCall: { sl: 'Pokličite me', en: 'Call me', sh: 'Nazovite me' },
  replyText: { sl: 'SMS, Viber ali WhatsApp', en: 'SMS, Viber or WhatsApp', sh: 'SMS, Viber ili WhatsApp' },
  replyEmail: { sl: 'E-pošta', en: 'Email', sh: 'E-mail' },
  message: { sl: 'Sporočilo', en: 'Message', sh: 'Poruka' },
  messageHint: { sl: 'Želje, tema zabave ali vprašanja', en: 'Wishes, a party theme or questions', sh: 'Želje, tema zabave ili pitanja' },
  dateAdded: { sl: 'Datum {d} je dodan v povpraševanje.', en: 'The date {d} has been added to your enquiry.', sh: 'Datum {d} dodan je u upit.' },
  errRequired: { sl: 'Izpolnite to polje.', en: 'Please fill in this field.', sh: 'Ispunite ovo polje.' },
  errChoose: { sl: 'Izberite eno možnost.', en: 'Please choose one option.', sh: 'Odaberite jednu mogućnost.' },
  errContact: { sl: 'Vpišite telefon ali e-pošto, da vam lahko odgovorim.', en: 'Please give a phone number or email so I can reply.', sh: 'Upišite telefon ili e-mail kako bih vam mogla odgovoriti.' },
  errContactInvalid: { sl: 'Vpišite veljavno telefonsko številko ali e-poštni naslov.', en: 'Please enter a valid phone number or email address.', sh: 'Upišite ispravan broj telefona ili e-mail adresu.' },
  errNeedMail: { sl: 'Za odgovor po e-pošti vpišite e-poštni naslov.', en: 'To get a reply by email, please enter an email address.', sh: 'Za odgovor e-poštom upišite e-mail adresu.' },
  errPast: { sl: 'Izberite današnji ali poznejši datum.', en: 'Please choose today or a later date.', sh: 'Odaberite današnji ili kasniji datum.' },
  errKidsMax: { sl: 'Za več kot {n} otrok me raje pokličite.', en: 'For more than {n} children, please give me a call.', sh: 'Za više od {n} djece radije me nazovite.' },
  errKidsMin: { sl: 'Vpišite vsaj enega otroka.', en: 'Please enter at least one child.', sh: 'Upišite barem jedno dijete.' },
};

/** Ages offered in the form's age selects. */
export const AGES = {
  sl: ['2 leti', '3 leta', '4 leta', '5 let', '6 let', '7 let', '8 let', '9 let', '10 let ali več'],
  en: ['2 years', '3 years', '4 years', '5 years', '6 years', '7 years', '8 years', '9 years', '10 years or older'],
  sh: ['2 godine', '3 godine', '4 godine', '5 godina', '6 godina', '7 godina', '8 godina', '9 godina', '10 godina ili više'],
};

/**
 * Field names sent to the form service. Slovenian keys, so the owner's notification emails read naturally
 * whatever language the parent used.
 */
export const FORM_KEYS = {
  topic: 'zanima',
  date: 'datum',
  age: 'starost',
  kids: 'stevilo_otrok',
  package: 'paket',
  time: 'cas',
  where: 'kje',
  town: 'kraj',
  slot: 'termin',
  trial: 'poskusna_urica',
  eventType: 'dogodek',
  name: 'ime',
  contact: 'kontakt',
  reply: 'odgovor',
  message: 'sporocilo',
};

export const ui = (key, lang, vars = {}) => {
  const text = UI[key]?.[lang] ?? UI[key]?.sl ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ''));
};

export const ft = (key, lang, vars = {}) => {
  const text = FORM_TEXT[key]?.[lang] ?? FORM_TEXT[key]?.sl ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ''));
};
