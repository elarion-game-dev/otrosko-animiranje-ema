// Languages, page addresses and the fixed texts of the public site (labels, messages, aria labels).
// Texts the owner writes live in the settings; these are the ones that come with the site.
// Slovenian is the main language and lives at the site root; the others under /en/, /hr/ and /sr/.
// Serbian texts here are written in Latin and shown in Cyrillic (toCyrillic in util.mjs).
// The site speaks as Ema, in the first person singular, and addresses parents formally ("vi").

import { LANGS, toCyrillic } from './util.mjs';

export { LANGS };

export const LANG_INFO = {
  sl: { name: 'Slovenščina', short: 'SL', prefix: '', locale: 'sl-SI', og: 'sl_SI', hreflang: ['sl'], flags: ['si'] },
  en: { name: 'English', short: 'EN', prefix: 'en', locale: 'en-GB', og: 'en_GB', hreflang: ['en'], flags: ['gb'] },
  // Croatian, Latin script, also offered to Bosnian searches. Its flags are chosen in the settings (languages.hr.flags).
  hr: { name: 'Hrvatski', short: 'HR', prefix: 'hr', locale: 'hr-HR', og: 'hr_HR', hreflang: ['hr', 'bs'], flags: [] },
  // Serbian, ekavian, in Cyrillic.
  sr: { name: 'Српски', short: 'SR', prefix: 'sr', locale: 'sr-Cyrl-RS', og: 'sr_RS', hreflang: ['sr'], flags: ['rs'] },
};

/** Address of each page in each language (without the site's base path). */
export const PAGE_SLUGS = {
  home: { sl: '', en: '', hr: '', sr: '' },
  privacy: { sl: 'zasebnost', en: 'privacy', hr: 'privatnost', sr: 'privatnost' },
  terms: { sl: 'pogoji', en: 'terms', hr: 'uvjeti', sr: 'uslovi' },
  thanks: { sl: 'hvala', en: 'thank-you', hr: 'hvala', sr: 'hvala' },
};

export function pagePath(page, lang) {
  const prefix = LANG_INFO[lang]?.prefix ?? '';
  const slug = PAGE_SLUGS[page]?.[lang] ?? '';
  return `/${[prefix, slug].filter(Boolean).join('/')}${prefix || slug ? '/' : ''}`;
}

/** Anchor (#…) of each home page section, so shared links read naturally in every language. */
export const ANCHORS = {
  steps: { sl: 'program', en: 'programme', hr: 'program', sr: 'program' },
  packages: { sl: 'paketi', en: 'packages', hr: 'paketi', sr: 'paketi' },
  schedule: { sl: 'sportne-urice', en: 'sports-classes', hr: 'sportske-aktivnosti', sr: 'sportske-aktivnosti' },
  events: { sl: 'dogodki', en: 'events', hr: 'dogadaji', sr: 'dogadjaji' },
  about: { sl: 'o-meni', en: 'about', hr: 'o-meni', sr: 'o-meni' },
  gallery: { sl: 'utrinki', en: 'gallery', hr: 'galerija', sr: 'galerija' },
  testimonials: { sl: 'mnenja', en: 'reviews', hr: 'dojmovi', sr: 'utisci' },
  faq: { sl: 'vprasanja', en: 'faq', hr: 'pitanja', sr: 'pitanja' },
  contact: { sl: 'rezervacija', en: 'booking', hr: 'rezervacija', sr: 'rezervacija' },
  services: { sl: 'ponudba', en: 'services', hr: 'ponuda', sr: 'ponuda' },
};

export const WEEKDAYS = {
  sl: ['ponedeljek', 'torek', 'sreda', 'četrtek', 'petek', 'sobota', 'nedelja'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  hr: ['ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota', 'nedjelja'],
  sr: ['понедељак', 'уторак', 'среда', 'четвртак', 'петак', 'субота', 'недеља'],
};

/** "On Tuesdays": how a weekly class is announced. */
export const WEEKDAYS_ON = {
  sl: ['ob ponedeljkih', 'ob torkih', 'ob sredah', 'ob četrtkih', 'ob petkih', 'ob sobotah', 'ob nedeljah'],
  en: ['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays'],
  hr: ['ponedjeljkom', 'utorkom', 'srijedom', 'četvrtkom', 'petkom', 'subotom', 'nedjeljom'],
  sr: ['понедељком', 'уторком', 'средом', 'четвртком', 'петком', 'суботом', 'недељом'],
};

export const UI = {
  skip: { sl: 'Preskoči na vsebino', en: 'Skip to content', hr: 'Preskoči na sadržaj', sr: 'Preskoči na sadržaj' },
  home: { sl: 'na začetno stran', en: 'home page', hr: 'na početnu stranicu', sr: 'na početnu stranicu' },
  menu: { sl: 'Meni', en: 'Menu', hr: 'Meni', sr: 'Meni' },
  closeMenu: { sl: 'Zapri meni', en: 'Close menu', hr: 'Zatvori meni', sr: 'Zatvori meni' },
  mainNav: { sl: 'Glavni meni', en: 'Main menu', hr: 'Glavni meni', sr: 'Glavni meni' },
  language: { sl: 'Jezik', en: 'Language', hr: 'Jezik', sr: 'Jezik' },
  languageNow: { sl: 'jezik: {name}', en: 'language: {name}', hr: 'jezik: {name}', sr: 'jezik: {name}' },
  call: { sl: 'Pokličite', en: 'Call', hr: 'Nazovite', sr: 'Pozovite' },
  callNumber: { sl: 'Pokličite {phone}', en: 'Call {phone}', hr: 'Nazovite {phone}', sr: 'Pozovite {phone}' },
  sameNumber: { sl: 'Na isto številko', en: 'Same number', hr: 'Na isti broj', sr: 'Na isti broj' },
  writeViber: { sl: 'Pišite na Viber', en: 'Message me on Viber', hr: 'Pišite na Viber', sr: 'Pišite na Viber' },
  writeWhatsapp: { sl: 'Pišite na WhatsApp', en: 'Message me on WhatsApp', hr: 'Pišite na WhatsApp', sr: 'Pišite na WhatsApp' },
  phone: { sl: 'Telefon', en: 'Phone', hr: 'Telefon', sr: 'Telefon' },
  email: { sl: 'E-pošta', en: 'Email', hr: 'E-mail', sr: 'Imejl' },
  address: { sl: 'Naslov', en: 'Address', hr: 'Adresa', sr: 'Adresa' },
  area: { sl: 'Kje delujem', en: 'Where I work', hr: 'Gdje radim', sr: 'Gde radim' },
  hours: { sl: 'Kdaj sem dosegljiva', en: 'When to reach me', hr: 'Kada sam dostupna', sr: 'Kada sam dostupna' },
  map: { sl: 'Odpri zemljevid', en: 'Open the map', hr: 'Otvori kartu', sr: 'Otvori mapu' },
  contactDirect: { sl: 'Neposreden kontakt', en: 'Contact me directly', hr: 'Izravan kontakt', sr: 'Direktan kontakt' },
  orForm: { sl: 'ali izpolnite obrazec', en: 'or fill in the form', hr: 'ili ispunite obrazac', sr: 'ili popunite obrazac' },
  quickBar: { sl: 'Hitri kontakt', en: 'Quick contact', hr: 'Brzi kontakt', sr: 'Brzi kontakt' },
  inquire: { sl: 'Povprašajte', en: 'Ask about this', hr: 'Pošaljite upit', sr: 'Pošaljite upit' },
  priceOnRequest: { sl: 'Cena po dogovoru', en: 'Price on request', hr: 'Cijena po dogovoru', sr: 'Cena po dogovoru' },
  byArrangement: { sl: 'Po dogovoru', en: 'By arrangement', hr: 'Po dogovoru', sr: 'Po dogovoru' },
  at: { sl: 'ob', en: 'at', hr: 'u', sr: 'u' },
  when: { sl: 'Kdaj', en: 'When', hr: 'Kada', sr: 'Kada' },
  whenHint: { sl: 'Datum bo prenesen v obrazec za povpraševanje.', en: 'The date will be copied into the enquiry form.', hr: 'Datum će biti prenesen u obrazac za upit.', sr: 'Datum će biti prenet u obrazac za upit.' },
  thanksNote: { sl: 'Hvala!', en: 'Thank you!', hr: 'Hvala!', sr: 'Hvala!' },
  rating: { sl: 'Ocena {n} od 5', en: 'Rated {n} out of 5', hr: 'Ocjena {n} od 5', sr: 'Ocena {n} od 5' },
  gallery: { sl: 'Galerija fotografij', en: 'Photo gallery', hr: 'Galerija fotografija', sr: 'Galerija fotografija' },
  swipe: { sl: 'Podrsajte', en: 'Swipe', hr: 'Povucite', sr: 'Povucite' },
  photo: { sl: 'Fotografija', en: 'Photo', hr: 'Fotografija', sr: 'Fotografija' },
  enlarge: { sl: 'Povečaj sliko', en: 'Enlarge photo', hr: 'Uvećaj sliku', sr: 'Uvećaj sliku' },
  close: { sl: 'Zapri', en: 'Close', hr: 'Zatvori', sr: 'Zatvori' },
  previous: { sl: 'Prejšnja slika', en: 'Previous photo', hr: 'Prethodna slika', sr: 'Prethodna slika' },
  next: { sl: 'Naslednja slika', en: 'Next photo', hr: 'Sljedeća slika', sr: 'Sledeća slika' },
  privacyPolicy: { sl: 'Politika zasebnosti', en: 'Privacy policy', hr: 'Politika privatnosti', sr: 'Politika privatnosti' },
  // As it reads inside a sentence: "Več v {privacy}."
  privacyInSentence: { sl: 'politiki zasebnosti', en: 'privacy policy', hr: 'politici privatnosti', sr: 'politici privatnosti' },
  backHome: { sl: 'Nazaj na začetno stran', en: 'Back to the home page', hr: 'Natrag na početnu stranicu', sr: 'Nazad na početnu stranicu' },
  footContact: { sl: 'Kontakt', en: 'Contact', hr: 'Kontakt', sr: 'Kontakt' },
  footPages: { sl: 'Stran', en: 'On this site', hr: 'Stranica', sr: 'Stranica' },
  footFollow: { sl: 'Sledite', en: 'Follow', hr: 'Pratite', sr: 'Pratite' },
  social: { sl: 'Družbena omrežja', en: 'Social media', hr: 'Društvene mreže', sr: 'Društvene mreže' },
  business: { sl: 'Podatki o podjetju', en: 'Company details', hr: 'Podaci o tvrtki', sr: 'Podaci o firmi' },
  registration: { sl: 'Matična številka', en: 'Registration no.', hr: 'Matični broj', sr: 'Matični broj' },
  taxNumber: { sl: 'Davčna številka', en: 'Tax no.', hr: 'Porezni broj', sr: 'Porezni broj' },
  vatId: { sl: 'ID za DDV', en: 'VAT ID', hr: 'PDV ID', sr: 'PDV ID' },
  effective: { sl: 'Velja od', en: 'Effective', hr: 'Vrijedi od', sr: 'Važi od' },
  // Form
  honeypot: { sl: 'Tega polja ne izpolnjujte', en: 'Leave this field empty', hr: 'Ne ispunjavajte ovo polje', sr: 'Ne popunjavajte ovo polje' },
  sending: { sl: 'Pošiljam …', en: 'Sending …', hr: 'Šaljem …', sr: 'Šaljem …' },
  errTooMany: {
    sl: 'Preveč poskusov. Počakajte minuto in poskusite znova.',
    en: 'Too many attempts. Please wait a minute and try again.',
    hr: 'Previše pokušaja. Pričekajte minutu i pokušajte ponovno.', sr: 'Previše pokušaja. Sačekajte minut i pokušajte ponovo.',
  },
  errNetwork: {
    sl: 'Sporočila ni bilo mogoče poslati. Preverite povezavo ali me pokličite.',
    en: "The message couldn't be sent. Check your connection or give me a call.",
    hr: 'Poruku nije bilo moguće poslati. Provjerite vezu ili me nazovite.', sr: 'Poruka nije mogla biti poslata. Proverite vezu ili me pozovite.',
  },
  mailtoNote: {
    sl: 'Ob kliku se odpre vaš e-poštni program s pripravljenim sporočilom.',
    en: 'This opens your email app with the message ready to send.',
    hr: 'Klikom se otvara vaš program za e-poštu s pripremljenom porukom.', sr: 'Klikom se otvara vaš program za e-poštu sa pripremljenom porukom.',
  },
  mailtoSubject: { sl: 'Povpraševanje s spletne strani', en: 'Enquiry from the website', hr: 'Upit s web stranice', sr: 'Upit sa veb-sajta' },
  mailtoDoneTitle: { sl: 'Še en korak', en: 'One more step', hr: 'Još jedan korak', sr: 'Još jedan korak' },
  mailtoDoneBody: {
    sl: 'V e-poštnem programu se je odprlo pripravljeno sporočilo. Pošljite ga in odgovorim vam čim prej.',
    en: 'Your email app has opened with the message ready. Send it, and I will reply as soon as I can.',
    hr: 'U programu za e-poštu otvorila se pripremljena poruka. Pošaljite je i odgovorit ću vam što prije.', sr: 'U programu za e-poštu otvorila se pripremljena poruka. Pošaljite je i odgovoriću vam što pre.',
  },
  formClosed: {
    sl: 'Obrazec trenutno ni na voljo. Pokličite me ali mi pišite.',
    en: 'The form is not available right now. Please call or email me.',
    hr: 'Obrazac trenutno nije dostupan. Nazovite me ili mi pišite.', sr: 'Obrazac trenutno nije dostupan. Pozovite me ili mi pišite.',
  },
  notFoundTitle: { sl: 'Te strani ni', en: 'Page not found', hr: 'Ova stranica ne postoji', sr: 'Ova stranica ne postoji' },
  notFoundText: {
    sl: 'Povezava je morda stara ali pa se je stran preselila.',
    en: 'The link may be old, or the page has moved.',
    hr: 'Poveznica je možda stara ili je stranica premještena.', sr: 'Link je možda zastareo ili je stranica premeštena.',
  },
};

/** Texts of the booking form. Labels follow the design; the owner chooses which optional questions are asked. */
export const FORM_TEXT = {
  topic: { sl: 'Kaj vas zanima?', en: 'What are you interested in?', hr: 'Što vas zanima?', sr: 'Šta vas zanima?' },
  topicParty: { sl: 'Rojstni dan', en: 'Birthday party', hr: 'Rođendan', sr: 'Rođendan' },
  topicSport: { sl: 'Športne urice', en: 'Sports classes', hr: 'Sportske aktivnosti', sr: 'Sportske aktivnosti' },
  topicEvent: { sl: 'Drug dogodek', en: 'Another event', hr: 'Drugi događaj', sr: 'Drugi događaj' },
  partyDate: { sl: 'Datum zabave', en: 'Date of the party', hr: 'Datum zabave', sr: 'Datum zabave' },
  partyAge: { sl: 'Starost slavljenca', en: "Birthday child's age", hr: 'Dob slavljenika', sr: 'Uzrast slavljenika' },
  kids: { sl: 'Število otrok', en: 'Number of children', hr: 'Broj djece', sr: 'Broj dece' },
  kidsPlaceholder: { sl: 'npr. 12', en: 'e.g. 12', hr: 'npr. 12', sr: 'npr. 12' },
  package: { sl: 'Paket', en: 'Package', hr: 'Paket', sr: 'Paket' },
  notSure: { sl: 'Še ne vem', en: 'Not sure yet', hr: 'Još ne znam', sr: 'Još ne znam' },
  choose: { sl: 'Izberite', en: 'Choose', hr: 'Odaberite', sr: 'Izaberite' },
  time: { sl: 'Okvirna ura', en: 'Rough time of day', hr: 'Okvirno vrijeme', sr: 'Okvirno vreme' },
  morning: { sl: 'Dopoldne', en: 'Morning', hr: 'Prijepodne', sr: 'Pre podne' },
  afternoon: { sl: 'Popoldne', en: 'Afternoon', hr: 'Poslijepodne', sr: 'Posle podne' },
  where: { sl: 'Kje bo zabava?', en: 'Where will the party be?', hr: 'Gdje će biti zabava?', sr: 'Gde će biti zabava?' },
  whereHome: { sl: 'Pri nas doma', en: 'At our home', hr: 'Kod nas doma', sr: 'Kod nas kući' },
  whereVenue: { sl: 'V najetem prostoru', en: 'In a rented venue', hr: 'U iznajmljenom prostoru', sr: 'U iznajmljenom prostoru' },
  town: { sl: 'Kraj', en: 'Town', hr: 'Mjesto', sr: 'Mesto' },
  townHint: { sl: '(neobvezno, za izračun potnih stroškov)', en: '(optional, to work out travel costs)', hr: '(neobavezno, za izračun putnih troškova)', sr: '(neobavezno, za obračun putnih troškova)' },
  townPlaceholder: { sl: 'npr. Domžale', en: 'e.g. Ljubljana', hr: 'npr. Ljubljana', sr: 'npr. Ljubljana' },
  sportAge: { sl: 'Starost otroka', en: "Child's age", hr: 'Dob djeteta', sr: 'Uzrast deteta' },
  slot: { sl: 'Kateri termin vam ustreza?', en: 'Which class suits you?', hr: 'Koji termin vam odgovara?', sr: 'Koji termin vam odgovara?' },
  slotOther: { sl: 'Zanima me drug termin', en: "I'd like a different time", hr: 'Zanima me drugi termin', sr: 'Zanima me drugi termin' },
  trial: { sl: 'Najprej bi radi prišli na poskusno urico', en: "We'd like to come to a trial class first", hr: 'Najprije bismo došli na probni sat', sr: 'Prvo bismo došli na probni čas' },
  eventType: { sl: 'Kakšen dogodek?', en: 'What kind of event?', hr: 'Kakav događaj?', sr: 'Kakav događaj?' },
  eventTypePlaceholder: { sl: 'npr. poroka, krst', en: 'e.g. a wedding, a christening', hr: 'npr. vjenčanje, krštenje', sr: 'npr. venčanje, krštenje' },
  eventDate: { sl: 'Datum', en: 'Date', hr: 'Datum', sr: 'Datum' },
  eventKids: { sl: 'Približno število otrok', en: 'Roughly how many children', hr: 'Približan broj djece', sr: 'Približan broj dece' },
  optional: { sl: '(neobvezno)', en: '(optional)', hr: '(neobavezno)', sr: '(neobavezno)' },
  name: { sl: 'Vaše ime', en: 'Your name', hr: 'Vaše ime', sr: 'Vaše ime' },
  contact: { sl: 'Telefon ali e-pošta', en: 'Phone or email', hr: 'Telefon ili e-mail', sr: 'Telefon ili imejl' },
  reply: { sl: 'Kako naj vam odgovorim?', en: 'How should I reply?', hr: 'Kako da vam odgovorim?', sr: 'Kako da vam odgovorim?' },
  replyCall: { sl: 'Pokličite me', en: 'Call me', hr: 'Nazovite me', sr: 'Pozovite me' },
  replyText: { sl: 'SMS, Viber ali WhatsApp', en: 'SMS, Viber or WhatsApp', hr: 'SMS, Viber ili WhatsApp', sr: 'SMS, Viber ili WhatsApp' },
  replyEmail: { sl: 'E-pošta', en: 'Email', hr: 'E-mail', sr: 'Imejl' },
  message: { sl: 'Sporočilo', en: 'Message', hr: 'Poruka', sr: 'Poruka' },
  messageHint: { sl: 'Želje, tema zabave ali vprašanja', en: 'Wishes, a party theme or questions', hr: 'Želje, tema zabave ili pitanja', sr: 'Želje, tema zabave ili pitanja' },
  dateAdded: { sl: 'Datum {d} je dodan v povpraševanje.', en: 'The date {d} has been added to your enquiry.', hr: 'Datum {d} dodan je u upit.', sr: 'Datum {d} je dodat u upit.' },
  errRequired: { sl: 'Izpolnite to polje.', en: 'Please fill in this field.', hr: 'Ispunite ovo polje.', sr: 'Popunite ovo polje.' },
  errChoose: { sl: 'Izberite eno možnost.', en: 'Please choose one option.', hr: 'Odaberite jednu mogućnost.', sr: 'Izaberite jednu mogućnost.' },
  errContact: { sl: 'Vpišite telefon ali e-pošto, da vam lahko odgovorim.', en: 'Please give a phone number or email so I can reply.', hr: 'Upišite telefon ili e-mail kako bih vam mogla odgovoriti.', sr: 'Upišite telefon ili imejl da bih mogla da vam odgovorim.' },
  errContactInvalid: { sl: 'Vpišite veljavno telefonsko številko ali e-poštni naslov.', en: 'Please enter a valid phone number or email address.', hr: 'Upišite ispravan broj telefona ili e-mail adresu.', sr: 'Upišite ispravan broj telefona ili imejl adresu.' },
  errNeedMail: { sl: 'Za odgovor po e-pošti vpišite e-poštni naslov.', en: 'To get a reply by email, please enter an email address.', hr: 'Za odgovor e-poštom upišite e-mail adresu.', sr: 'Za odgovor e-poštom upišite imejl adresu.' },
  errPast: { sl: 'Izberite današnji ali poznejši datum.', en: 'Please choose today or a later date.', hr: 'Odaberite današnji ili kasniji datum.', sr: 'Izaberite današnji ili kasniji datum.' },
  errKidsMax: { sl: 'Za več kot {n} otrok me raje pokličite.', en: 'For more than {n} children, please give me a call.', hr: 'Za više od {n} djece radije me nazovite.', sr: 'Za više od {n} dece radije me pozovite.' },
  errKidsMin: { sl: 'Vpišite vsaj enega otroka.', en: 'Please enter at least one child.', hr: 'Upišite barem jedno dijete.', sr: 'Upišite bar jedno dete.' },
};

/** Ages offered in the form's age selects. */
export const AGES = {
  sl: ['2 leti', '3 leta', '4 leta', '5 let', '6 let', '7 let', '8 let', '9 let', '10 let ali več'],
  en: ['2 years', '3 years', '4 years', '5 years', '6 years', '7 years', '8 years', '9 years', '10 years or older'],
  hr: ['2 godine', '3 godine', '4 godine', '5 godina', '6 godina', '7 godina', '8 godina', '9 godina', '10 godina ili više'],
  sr: ['2 године', '3 године', '4 године', '5 година', '6 година', '7 година', '8 година', '9 година', '10 година или више'],
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

// A placeholder without a value stays as it is, so site.js can fill it in the browser ({n}, {d} in form messages).
const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (match, name) => String(vars[name] ?? match));

const pick = (table, key, lang) => {
  const text = table[key]?.[lang] || table[key]?.sl || key;
  return lang === 'sr' ? toCyrillic(text) : text;
};

export const ui = (key, lang, vars = {}) => fill(pick(UI, key, lang), vars);

export const ft = (key, lang, vars = {}) => fill(pick(FORM_TEXT, key, lang), vars);
