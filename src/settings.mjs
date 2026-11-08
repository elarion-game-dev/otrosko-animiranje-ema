// Default site settings and the normaliser that every settings object passes through, both when the
// admin edits it and when the build renders it. Unknown keys are dropped, strings are length-limited,
// enums/colours/URLs are validated, so a broken or tampered site.json can never produce unsafe output.
//
// Texts visitors read are stored in all three languages: { sl, en, sh }. Slovenian is the original.

import { SERVICE_ICONS, BRAND_ICONS } from './icons.mjs';
import { formspreeId, PROVIDER_IDS, resolveProvider } from './providers.mjs';
import {
  BUTTON_STYLES,
  CARD_STYLES,
  DECORATIONS,
  DEFAULT_TEXT_STYLE,
  DIVIDERS,
  FONT_IDS,
  PATTERNS,
  PRESETS,
  TEXT_CASES,
  TEXT_COLORS,
  TEXT_ROLES,
  TEXT_SHADOWS,
} from './themes.mjs';
import { clamp, i18nFields, isEmail, isHexColor, isPhone, isPlainObject, LANGS, safeAssetPath, safeUrl } from './util.mjs';

export const SCHEMA_VERSION = 1;

/** Shorthand for a text in all three languages. */
export const t3 = (sl, en = '', sh = '') => ({ sl, en, sh });
const EMPTY = () => t3('', '', '');

export const SECTION_IDS = ['services', 'steps', 'packages', 'schedule', 'about', 'gallery', 'testimonials', 'faq', 'contact'];
export const SECTION_LABELS = {
  services: 'Ponudba',
  steps: 'Kako poteka',
  packages: 'Paketi in cene',
  schedule: 'Urnik',
  about: 'O nas',
  gallery: 'Galerija',
  testimonials: 'Mnenja staršev',
  faq: 'Pogosta vprašanja',
  contact: 'Kontakt in povpraševanje',
};

export const LINK_TARGETS = {
  contact: 'Obrazec za povpraševanje',
  services: 'Razdelek Ponudba',
  packages: 'Razdelek Paketi',
  schedule: 'Razdelek Urnik',
  about: 'Razdelek O nas',
  gallery: 'Razdelek Galerija',
  faq: 'Razdelek Vprašanja',
  phone: 'Klic na telefon',
  whatsapp: 'Sporočilo na WhatsApp',
  viber: 'Sporočilo na Viber',
  email: 'E-pošta',
  url: 'Druga povezava …',
};
export const HERO_LAYOUTS = { split: 'Besedilo levo, slika desno', center: 'Vse na sredini', cover: 'Slika čez celo ozadje' };
export const PHOTO_SHAPES = { blob: 'Mehka packa', circle: 'Krog', rounded: 'Zaobljen pravokotnik', arch: 'Lok' };
export const GALLERY_LAYOUTS = { grid: 'Mreža enakih kvadratov', masonry: 'Zidak (slike ohranijo obliko)' };
export const BAR_STYLES = { accent: 'Glavna barva', accent2: 'Druga barva', accent3: 'Tretja barva', dark: 'Temna' };
export const FLOAT_ACTIONS = { phone: 'Klic', whatsapp: 'WhatsApp', viber: 'Viber', contact: 'Obrazec za povpraševanje' };
export const FLOAT_PLACES = { mobile: 'Samo na telefonih', all: 'Na vseh napravah' };
export const SIDES = { right: 'Desno', left: 'Levo' };
export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const DAY_OPTIONS = { mon: 'ponedeljek', tue: 'torek', wed: 'sreda', thu: 'četrtek', fri: 'petek', sat: 'sobota', sun: 'nedelja', custom: 'Drugo (vpišem besedilo)' };
export const FORM_FIELDS = ['name', 'email', 'phone', 'date', 'time', 'location', 'children', 'age', 'service', 'message'];
export const FORM_FIELD_LABELS = {
  name: 'Ime in priimek',
  email: 'E-pošta',
  phone: 'Telefon',
  date: 'Datum dogodka',
  time: 'Ura',
  location: 'Kraj ali naslov',
  children: 'Število otrok',
  age: 'Starost otrok',
  service: 'Izbira storitve ali paketa',
  message: 'Sporočilo',
};
const EXTRA_PLATFORMS = { email: 'E-pošta', website: 'Spletna stran' };
export const SOCIAL_PLATFORMS = {
  ...Object.fromEntries(['facebook', 'instagram', 'tiktok', 'youtube', 'whatsapp', 'viber', 'messenger', 'threads', 'telegram', 'x'].map((id) => [id, BRAND_ICONS[id]?.title ?? id])),
  ...EXTRA_PLATFORMS,
};
export const LIMITS = { services: 12, steps: 6, packages: 6, schedule: 20, stats: 4, gallery: 60, testimonials: 30, faq: 30, socials: 12 };

const DEFAULT_PRESET = PRESETS.rainbow;
const FIELD_DEFAULTS = {
  name: { show: true, required: true },
  email: { show: true, required: false },
  phone: { show: true, required: false },
  date: { show: true, required: false },
  time: { show: false, required: false },
  location: { show: true, required: false },
  children: { show: true, required: false },
  age: { show: true, required: false },
  service: { show: true, required: false },
  message: { show: true, required: false },
};

const section = (id, enabled, inMenu, heading, menuLabel, intro = EMPTY()) => ({ id, enabled, inMenu, heading, menuLabel, intro });

export const DEFAULT_SETTINGS = {
  schemaVersion: SCHEMA_VERSION,
  site: {
    name: 'Otroško animiranje Ema',
    url: 'https://elarion-game-dev.github.io/otrosko-animiranje-ema',
  },
  languages: {
    en: { enabled: true, label: 'English', short: 'EN' },
    sh: { enabled: true, label: 'Srpskohrvatski', short: 'SH' },
  },
  announcement: {
    enabled: false,
    text: t3('Termini za praznične zabave se hitro polnijo!', 'Holiday party dates are filling up fast!', 'Termini za praznične zabave brzo se popunjavaju!'),
    linkLabel: t3('Rezervirajte', 'Book now', 'Rezervirajte'),
    target: 'contact',
    url: '',
    style: 'accent2',
  },
  header: {
    logo: '',
    logoHeight: 44,
    showName: true,
    sticky: true,
    cta: { enabled: true, label: t3('Rezerviraj termin', 'Book a date', 'Rezerviraj termin'), target: 'contact', url: '' },
  },
  hero: {
    layout: 'split',
    badge: t3('Animacija za otroke', "Children's entertainment", 'Animacija za djecu'),
    title: t3('Zabava, ki si jo bodo otroci zapomnili', 'Parties the kids will remember', 'Zabava koju će djeca pamtiti'),
    text: t3(
      'Rojstnodnevne zabave, športne urice in animacija na dogodkih. Vi uživate s povabljenimi, za otroke poskrbimo mi.',
      'Birthday parties, sports classes and entertainment at events. You enjoy time with your guests while we look after the kids.',
      'Rođendanske proslave, sportske aktivnosti i animacija na događajima. Vi uživajte s gostima, a mi se brinemo o djeci.'
    ),
    primary: { label: t3('Pošlji povpraševanje', 'Send an inquiry', 'Pošalji upit'), target: 'contact', url: '' },
    secondary: { label: t3('Poglej ponudbo', 'See what we offer', 'Pogledaj ponudu'), target: 'services', url: '' },
    image: '',
    imageAlt: EMPTY(),
    imageShape: 'blob',
    overlay: 45,
  },
  sections: [
    section(
      'services',
      true,
      true,
      t3('Kaj ponujamo', 'What we offer', 'Što nudimo'),
      t3('Ponudba', 'Services', 'Ponuda'),
      t3(
        'Vsak program prilagodimo starosti otrok, prostoru in vašim željam.',
        "We tailor every programme to the children's ages, the venue and your wishes.",
        'Svaki program prilagođavamo dobi djece, prostoru i vašim željama.'
      )
    ),
    section('steps', true, false, t3('Kako poteka', 'How it works', 'Kako to izgleda'), t3('Kako poteka', 'How it works', 'Kako to izgleda')),
    section(
      'packages',
      true,
      true,
      t3('Paketi in cene', 'Packages and prices', 'Paketi i cijene'),
      t3('Cene', 'Prices', 'Cijene'),
      t3(
        'Izberite paket ali nam povejte, kaj si želite, in pripravimo ponudbo po meri.',
        'Pick a package, or tell us what you have in mind and we will put together an offer.',
        'Odaberite paket ili nam recite što želite pa ćemo pripremiti ponudu po mjeri.'
      )
    ),
    section(
      'schedule',
      false,
      true,
      t3('Športne urice', 'Sports classes', 'Sportska igraonica'),
      t3('Urnik', 'Schedule', 'Raspored'),
      t3(
        'Redne vadbe, na katerih se otroci skozi igro naučijo novih gibanj in sodelovanja.',
        'Regular classes where children learn new moves and teamwork through play.',
        'Redovni treninzi na kojima djeca kroz igru uče nove pokrete i timski rad.'
      )
    ),
    section('about', true, true, t3('O nas', 'About us', 'O nama'), t3('O nas', 'About', 'O nama')),
    section('gallery', true, true, t3('Utrinki z zabav', 'Moments from our parties', 'Trenuci s proslava'), t3('Galerija', 'Gallery', 'Galerija')),
    section('testimonials', true, false, t3('Kaj pravijo starši', 'What parents say', 'Što kažu roditelji'), t3('Mnenja', 'Reviews', 'Utisci')),
    section('faq', true, true, t3('Pogosta vprašanja', 'Frequently asked questions', 'Česta pitanja'), t3('Vprašanja', 'FAQ', 'Pitanja')),
    section(
      'contact',
      true,
      true,
      t3('Rezervirajte svoj termin', 'Book your date', 'Rezervirajte svoj termin'),
      t3('Kontakt', 'Contact', 'Kontakt'),
      t3(
        'Pošljite povpraševanje in odgovorimo vam s prostimi termini in ponudbo.',
        "Send us an inquiry and we'll reply with available dates and an offer.",
        'Pošaljite upit i javit ćemo vam slobodne termine i ponudu.'
      )
    ),
  ],
  services: {
    showInquiry: true,
    items: [
      {
        icon: 'cake',
        image: '',
        title: t3('Rojstnodnevne zabave', 'Birthday parties', 'Rođendanske proslave'),
        text: t3(
          'Igre, glasba, smeh in veliko presenečenj za slavljenca in prijatelje – doma, v igralnici ali na prostem.',
          'Games, music, laughter and plenty of surprises for the birthday child and friends – at home, in a play centre or outdoors.',
          'Igre, pjesme, ples i puno iznenađenja za slavljenika i prijatelje – kod kuće, u igraonici ili na otvorenom.'
        ),
      },
      {
        icon: 'ball',
        image: '',
        title: t3('Športne urice', 'Sports classes', 'Sportske aktivnosti'),
        text: t3(
          'Gibalne igre, poligoni in štafete, ki otroke spodbujajo k gibanju in sodelovanju.',
          'Movement games, obstacle courses and relay races that get children moving and playing together.',
          'Igre kretanja, poligoni i štafete koje djecu potiču na kretanje i zajedničku igru.'
        ),
      },
      {
        icon: 'party',
        image: '',
        title: t3('Animacija na dogodkih', 'Entertainment at events', 'Animacija na događajima'),
        text: t3(
          'Poroke, krsti, obhajila in druženja podjetij: otroci se zabavajo, odrasli se sprostijo.',
          'Weddings, christenings, communions and company get-togethers: the children have fun and the adults can relax.',
          'Vjenčanja, krštenja, pričesti i druženja firmi: djeca se zabavljaju, a odrasli se opuštaju.'
        ),
      },
      {
        icon: 'palette',
        image: '',
        title: t3('Poslikava obraza', 'Face painting', 'Oslikavanje lica'),
        text: t3(
          'Metulji, superjunaki in živalice: vsak otrok dobi svojo poslikavo.',
          'Butterflies, superheroes and little animals: every child gets their own design.',
          'Leptiri, superjunaci i životinjice: svako dijete dobije svoj crtež.'
        ),
      },
      {
        icon: 'balloon',
        image: '',
        title: t3('Modeliranje balonov', 'Balloon modelling', 'Modeliranje balona'),
        text: t3(
          'Kužki, meči in krone iz balonov, ki jih otroci odnesejo domov.',
          'Balloon dogs, swords and crowns for the children to take home.',
          'Psići, mačevi i krune od balona koje djeca nose kući.'
        ),
      },
      {
        icon: 'scissors',
        image: '',
        title: t3('Ustvarjalne delavnice', 'Craft workshops', 'Kreativne radionice'),
        text: t3(
          'Izdelki iz papirja, barv in naravnih materialov, prilagojeni starosti otrok.',
          "Crafts with paper, paint and natural materials, suited to the children's age.",
          'Radovi od papira, boja i prirodnih materijala prilagođeni dobi djece.'
        ),
      },
    ],
  },
  steps: {
    items: [
      {
        icon: 'chat',
        title: t3('Pošljite povpraševanje', 'Send an inquiry', 'Pošaljite upit'),
        text: t3('Povejte nam datum, kraj ter število in starost otrok.', 'Tell us the date, the place, and the number and ages of the children.', 'Recite nam datum, mjesto te broj i dob djece.'),
      },
      {
        icon: 'calendar',
        title: t3('Dogovorimo se za program', 'We plan the programme together', 'Dogovorimo program'),
        text: t3('Predlagamo program in ga prilagodimo vašim željam.', 'We suggest a programme and adjust it to your wishes.', 'Predložimo program i prilagodimo ga vašim željama.'),
      },
      {
        icon: 'party',
        title: t3('Zabava se začne', 'Let the party begin', 'Zabava počinje'),
        text: t3('Pripomočke prinesemo s seboj, vi pa uživate z gosti.', 'We bring everything we need; you enjoy time with your guests.', 'Sve potrebno donosimo sa sobom, a vi uživate s gostima.'),
      },
    ],
  },
  packages: {
    buttonLabel: t3('Izberi', 'Choose', 'Odaberi'),
    note: EMPTY(),
    items: [
      {
        name: t3('Mala zabava', 'Small party', 'Mala zabava'),
        price: EMPTY(),
        duration: t3('1 ura', '1 hour', '1 sat'),
        features: t3('Igre in animacija\nGlasba in ples\nDo 10 otrok', 'Games and entertainment\nMusic and dancing\nUp to 10 children', 'Igre i animacija\nPjesme i ples\nDo 10 djece'),
        highlight: false,
        badge: EMPTY(),
      },
      {
        name: t3('Velika zabava', 'Big party', 'Velika zabava'),
        price: EMPTY(),
        duration: t3('2 uri', '2 hours', '2 sata'),
        features: t3(
          'Igre in animacija\nPoslikava obraza\nModeliranje balonov\nDo 20 otrok',
          'Games and entertainment\nFace painting\nBalloon modelling\nUp to 20 children',
          'Igre i animacija\nOslikavanje lica\nModeliranje balona\nDo 20 djece'
        ),
        highlight: true,
        badge: t3('Najbolj priljubljeno', 'Most popular', 'Najpopularnije'),
      },
      {
        name: t3('Po meri', 'Made to measure', 'Po mjeri'),
        price: EMPTY(),
        duration: t3('po dogovoru', 'by arrangement', 'po dogovoru'),
        features: t3(
          'Program po vaših željah\nZa večje skupine in dogodke\nTematske zabave',
          'A programme built around your wishes\nFor larger groups and events\nThemed parties',
          'Program po vašim željama\nZa veće grupe i događaje\nTematske zabave'
        ),
        highlight: false,
        badge: EMPTY(),
      },
    ],
  },
  schedule: {
    note: EMPTY(),
    items: [
      { title: t3('Športne urice, 3–5 let', 'Sports class, ages 3–5', 'Sportska igraonica, 3–5 godina'), day: 'tue', when: EMPTY(), time: '17:00–17:45', place: EMPTY(), note: EMPTY() },
      { title: t3('Športne urice, 6–9 let', 'Sports class, ages 6–9', 'Sportska igraonica, 6–9 godina'), day: 'thu', when: EMPTY(), time: '17:00–18:00', place: EMPTY(), note: EMPTY() },
    ],
  },
  about: {
    text: t3(
      '**Otroško animiranje Ema** poskrbi, da je praznovanje za otroke doživetje, za starše pa brez skrbi.\n\nProgram vedno prilagodimo starosti in številu otrok, prostoru ter vašim željam. Na zabavo prinesemo vse pripomočke, otroke pa vodimo skozi igre, ples in ustvarjanje, dokler ni čas za torto.',
      "**Otroško animiranje Ema** makes every celebration an adventure for the children and stress-free for the parents.\n\nWe always tailor the programme to the children's ages and number, the venue and your wishes. We bring everything we need and keep the children busy with games, dancing and crafts until it is time for cake.",
      '**Otroško animiranje Ema** brine se da proslava bude doživljaj za djecu, a za roditelje bez brige.\n\nProgram uvijek prilagođavamo dobi i broju djece, prostoru i vašim željama. Donosimo sav potreban pribor, a djecu vodimo kroz igre, ples i stvaranje sve dok ne dođe vrijeme za tortu.'
    ),
    photo: '',
    photoAlt: EMPTY(),
    photoShape: 'blob',
    stats: [],
  },
  gallery: { layout: 'grid', images: [] },
  testimonials: { showStars: true, items: [] },
  faq: {
    items: [
      {
        q: t3('Za katero starost so zabave primerne?', 'What ages are the parties for?', 'Za koju su dob zabave prikladne?'),
        a: t3(
          'Program prilagodimo starosti otrok, od malčkov do osnovnošolcev. Ob povpraševanju nam povejte, koliko so stari.',
          "We adapt the programme to the children's ages, from toddlers to primary school children. Just tell us their ages when you get in touch.",
          'Program prilagođavamo dobi djece, od mališana do osnovnoškolaca. U upitu nam samo recite koliko su stari.'
        ),
      },
      {
        q: t3('Kje izvajate zabave?', 'Where do the parties take place?', 'Gdje održavate zabave?'),
        a: t3(
          'Doma, v najetem prostoru, v vrtcu ali na prostem. Za oddaljene kraje se vnaprej dogovorimo o potnih stroških.',
          'At home, in a rented venue, at kindergarten or outdoors. For places further away, we agree on travel costs in advance.',
          'Kod kuće, u iznajmljenom prostoru, u vrtiću ili na otvorenom. Za udaljena mjesta unaprijed dogovaramo putne troškove.'
        ),
      },
      {
        q: t3('Koliko prej moram rezervirati?', 'How far ahead should I book?', 'Koliko unaprijed trebam rezervirati?'),
        a: t3(
          'Čim prej, saj se termini ob vikendih hitro zapolnijo. Pišite nam in preverimo, ali je vaš datum še prost.',
          'As early as you can: weekend dates fill up quickly. Write to us and we will check whether your date is free.',
          'Što prije, jer se termini vikendom brzo popune. Pišite nam i provjerit ćemo je li vaš datum slobodan.'
        ),
      },
      {
        q: t3('Kaj moram pripraviti jaz?', 'What do I need to prepare?', 'Što ja trebam pripremiti?'),
        a: t3('Samo dovolj prostora za igro. Vse pripomočke prinesemo s seboj.', 'Just enough room to play. We bring everything else.', 'Samo dovoljno prostora za igru. Sav pribor donosimo sa sobom.'),
      },
    ],
  },
  contact: {
    phone: '',
    email: '',
    whatsapp: true,
    viber: true,
    address: '',
    area: EMPTY(),
    hours: EMPTY(),
    mapUrl: '',
  },
  form: {
    provider: 'mailto',
    formspree: { formId: '' },
    custom: { action: '', providerName: '', privacyUrl: '', extraName: '', extraValue: '', mode: 'json' },
    fields: Object.fromEntries(FORM_FIELDS.map((id) => [id, { ...FIELD_DEFAULTS[id], label: EMPTY() }])),
    requireContact: true,
    buttonLabel: t3('Pošlji povpraševanje', 'Send inquiry', 'Pošalji upit'),
    privacyNote: t3(
      'Podatke uporabimo samo za odgovor na vaše povpraševanje. Več v {privacy}.',
      'We only use your details to reply to your inquiry. More in our {privacy}.',
      'Vaše podatke koristimo samo za odgovor na upit. Više u {privacy}.'
    ),
    successTitle: t3('Hvala, sporočilo je oddano!', 'Thank you, your message is on its way!', 'Hvala, poruka je poslana!'),
    successBody: t3('Odgovorimo vam v najkrajšem možnem času.', "We'll get back to you as soon as we can.", 'Odgovorit ćemo vam što je prije moguće.'),
  },
  thanks: {
    title: t3('Hvala za povpraševanje!', 'Thank you for your inquiry!', 'Hvala na upitu!'),
    body: t3('Sporočilo smo prejeli in vam odgovorimo v najkrajšem možnem času.', "We've received your message and will reply as soon as we can.", 'Primili smo vašu poruku i odgovorit ćemo vam što prije.'),
  },
  floating: { enabled: true, action: 'phone', label: t3('Pokličite', 'Call us', 'Nazovite'), where: 'mobile', side: 'right' },
  footer: {
    text: t3('Z veseljem poskrbimo za nasmehe na vaši zabavi.', 'Happy to bring smiles to your party.', 'Rado ćemo donijeti osmijehe na vašu zabavu.'),
    showContact: true,
    showSocials: true,
    showBusiness: true,
  },
  socials: ['facebook', 'instagram', 'tiktok', 'youtube'].map((platform) => ({ platform, url: '', label: '' })),
  business: { name: '', address: '', registration: '', taxNumber: '', vatId: '' },
  theme: {
    preset: 'rainbow',
    colors: { ...DEFAULT_PRESET.colors },
    headingFont: DEFAULT_PRESET.headingFont,
    bodyFont: DEFAULT_PRESET.bodyFont,
    baseSize: 18,
    radius: DEFAULT_PRESET.radius,
    buttonStyle: DEFAULT_PRESET.buttonStyle,
    cardStyle: DEFAULT_PRESET.cardStyle,
    divider: DEFAULT_PRESET.divider,
    pattern: DEFAULT_PRESET.pattern,
    patternStrength: 35,
    decoration: DEFAULT_PRESET.decoration,
    alternate: true,
    animations: true,
    favicon: '',
  },
  textStyles: Object.fromEntries(Object.keys(TEXT_ROLES).map((id) => [id, { ...DEFAULT_TEXT_STYLE }])),
  privacy: {
    effectiveDate: '2026-11-08',
    retentionMonths: 12,
    photos: true,
    // Change when the site moves to another host.
    hosting: t3('GitHub Pages (GitHub, Inc., ZDA)', 'GitHub Pages (GitHub, Inc., United States)', 'GitHub Pages (GitHub, Inc., SAD)'),
    outsideEu: true,
    extra: EMPTY(),
  },
  terms: { enabled: false, title: t3('Pogoji poslovanja', 'Terms and conditions', 'Uvjeti poslovanja'), body: EMPTY() },
  seo: {
    title: t3(
      'Otroško animiranje Ema | Rojstnodnevne zabave in animacija za otroke',
      "Otroško animiranje Ema | Children's parties and entertainment",
      'Otroško animiranje Ema | Dječje proslave i animacija'
    ),
    description: t3(
      'Rojstnodnevne zabave, športne urice in animacija za otroke na dogodkih. Pošljite povpraševanje in rezervirajte termin.',
      "Birthday parties, sports classes and children's entertainment at events. Send an inquiry and book your date.",
      'Rođendanske proslave, sportske aktivnosti i animacija za djecu na događajima. Pošaljite upit i rezervirajte termin.'
    ),
    ogImage: '',
    ogImageAlt: EMPTY(),
    // Off until the owner says the site is ready, so search engines don't index the sample texts.
    indexable: false,
    areaServed: '',
    priceRange: '',
  },
};

// --- normalising helpers -----------------------------------------------------

function str(value, max, fallback = '') {
  if (typeof value !== 'string') return fallback;
  return value.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').slice(0, max);
}
const line = (value, max, fallback) => str(value, max, fallback).replace(/\n+/g, ' ');
const required = (value, max, fallback) => line(value, max, fallback) || fallback;
const bool = (value, fallback) => (typeof value === 'boolean' ? value : fallback);
const oneOf = (value, options, fallback) => (options.includes(value) ? value : fallback);
const color = (value, fallback) => (isHexColor(value) ? value.toLowerCase() : fallback);
const num = (value, min, max, fallback) => (Number.isFinite(Number(value)) && value !== '' && value !== null ? Math.round(clamp(value, min, max)) : fallback);
// A real calendar day: "2026-02-30" would otherwise show as 2 March.
const date = (value, fallback = '') =>
  /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? '')) && !Number.isNaN(Date.parse(value)) && new Date(`${value}T00:00:00Z`).toISOString().startsWith(value) ? value : fallback;
const list = (value, max, fallback) => (Array.isArray(value) ? value.slice(0, max) : fallback);
const obj = (value) => (isPlainObject(value) ? value : {});
const httpLink = (value) => safeUrl(line(value, 500, ''), { allowMailto: false, allowRelative: false });
const link = (value) => safeUrl(line(value, 500, ''));
// Images must be files uploaded to this site, so pages never load anything from another server.
const image = (value) => safeAssetPath(value);
const phone = (value) => {
  const v = line(value, 30, '').trim();
  return isPhone(v) ? v : '';
};

/**
 * A text in all three languages. A plain string (older files, hand edits) counts as Slovenian.
 * `fallback` fills empty Slovenian text only when `keepEmpty` is false.
 */
function i18n(value, max, fallback = EMPTY(), { multiline = false, keepEmpty = true } = {}) {
  const source = typeof value === 'string' ? { sl: value } : obj(value);
  const clean = multiline ? (v, f) => str(v, max, f) : (v, f) => line(v, max, f);
  const out = Object.fromEntries(LANGS.map((l) => [l, clean(source[l], typeof value === 'undefined' ? fallback[l] : '')]));
  if (!keepEmpty && !out.sl.trim()) return { ...fallback };
  return out;
}
const i18nLine = (value, max, fallback) => i18n(value, max, fallback);
const i18nText = (value, max, fallback) => i18n(value, max, fallback, { multiline: true });
const i18nRequired = (value, max, fallback) => i18n(value, max, fallback, { keepEmpty: false });

function target(value, fallback) {
  return oneOf(value, Object.keys(LINK_TARGETS), fallback);
}

function button(raw, d) {
  const b = obj(raw);
  return { label: i18nLine(b.label, 40, d.label), target: target(b.target, d.target), url: link(b.url) };
}

/** Ordered sections: keeps the given order, drops unknown ids, appends missing ones (switched off). */
function sections(value) {
  const defaults = DEFAULT_SETTINGS.sections;
  const seen = new Set();
  const out = [];
  for (const raw of list(value, 40, defaults)) {
    const s = obj(raw);
    if (!SECTION_IDS.includes(s.id) || seen.has(s.id)) continue;
    seen.add(s.id);
    const d = defaults.find((x) => x.id === s.id);
    out.push({
      id: s.id,
      enabled: bool(s.enabled, d.enabled),
      inMenu: bool(s.inMenu, d.inMenu),
      heading: i18nLine(s.heading, 100, d.heading),
      menuLabel: i18nLine(s.menuLabel, 30, d.menuLabel),
      intro: i18nText(s.intro, 600, d.intro),
    });
  }
  for (const d of defaults) if (!seen.has(d.id)) out.push({ ...structuredClone(d), enabled: false });
  return out;
}

/**
 * Returns a complete, valid settings object. Missing values fall back to defaults only where a fallback makes
 * sense; lists (services, photos, questions…) keep exactly what the owner entered.
 */
export function normalizeSettings(input) {
  const raw = obj(input);
  const d = DEFAULT_SETTINGS;
  const site = obj(raw.site);
  const langs = obj(raw.languages);
  const bar = obj(raw.announcement);
  const header = obj(raw.header);
  const hero = obj(raw.hero);
  const services = obj(raw.services);
  const steps = obj(raw.steps);
  const packages = obj(raw.packages);
  const schedule = obj(raw.schedule);
  const about = obj(raw.about);
  const gallery = obj(raw.gallery);
  const reviews = obj(raw.testimonials);
  const faq = obj(raw.faq);
  const contact = obj(raw.contact);
  const form = obj(raw.form);
  const fields = obj(form.fields);
  const float = obj(raw.floating);
  const footer = obj(raw.footer);
  const business = obj(raw.business);
  const theme = obj(raw.theme);
  const colors = obj(theme.colors);
  const privacy = obj(raw.privacy);
  const terms = obj(raw.terms);
  const thanks = obj(raw.thanks);
  const seo = obj(raw.seo);
  const email = line(contact.email, 254, '').trim();

  return {
    schemaVersion: SCHEMA_VERSION,
    site: {
      name: required(site.name, 80, d.site.name),
      url: httpLink(site.url).replace(/\/+$/, '') || d.site.url,
    },
    languages: Object.fromEntries(
      ['en', 'sh'].map((id) => {
        const l = obj(langs[id]);
        const dl = d.languages[id];
        return [id, { enabled: bool(l.enabled, dl.enabled), label: required(l.label, 30, dl.label), short: required(l.short, 6, dl.short) }];
      })
    ),
    announcement: {
      enabled: bool(bar.enabled, d.announcement.enabled),
      text: i18nLine(bar.text, 160, d.announcement.text),
      linkLabel: i18nLine(bar.linkLabel, 40, d.announcement.linkLabel),
      target: target(bar.target, d.announcement.target),
      url: link(bar.url),
      style: oneOf(bar.style, Object.keys(BAR_STYLES), d.announcement.style),
    },
    header: {
      logo: image(header.logo),
      logoHeight: num(header.logoHeight, 24, 96, d.header.logoHeight),
      showName: bool(header.showName, d.header.showName),
      sticky: bool(header.sticky, d.header.sticky),
      cta: { enabled: bool(obj(header.cta).enabled, d.header.cta.enabled), ...button(header.cta, d.header.cta) },
    },
    hero: {
      layout: oneOf(hero.layout, Object.keys(HERO_LAYOUTS), d.hero.layout),
      badge: i18nLine(hero.badge, 80, d.hero.badge),
      title: i18nRequired(hero.title, 140, d.hero.title),
      text: i18nText(hero.text, 500, d.hero.text),
      primary: button(hero.primary, d.hero.primary),
      secondary: button(hero.secondary, d.hero.secondary),
      image: image(hero.image),
      imageAlt: i18nLine(hero.imageAlt, 200, EMPTY()),
      imageShape: oneOf(hero.imageShape, Object.keys(PHOTO_SHAPES), d.hero.imageShape),
      overlay: num(hero.overlay, 0, 90, d.hero.overlay),
    },
    sections: sections(raw.sections),
    services: {
      showInquiry: bool(services.showInquiry, d.services.showInquiry),
      items: list(services.items, LIMITS.services, d.services.items).map((raw) => {
        const s = obj(raw);
        return { icon: oneOf(s.icon, ['', ...Object.keys(SERVICE_ICONS)], 'star'), image: image(s.image), title: i18nLine(s.title, 80, EMPTY()), text: i18nText(s.text, 600, EMPTY()) };
      }),
    },
    steps: {
      items: list(steps.items, LIMITS.steps, d.steps.items).map((raw) => {
        const s = obj(raw);
        return { icon: oneOf(s.icon, ['', ...Object.keys(SERVICE_ICONS)], 'star'), title: i18nLine(s.title, 80, EMPTY()), text: i18nText(s.text, 300, EMPTY()) };
      }),
    },
    packages: {
      buttonLabel: i18nLine(packages.buttonLabel, 40, d.packages.buttonLabel),
      note: i18nText(packages.note, 500, d.packages.note),
      items: list(packages.items, LIMITS.packages, d.packages.items).map((raw) => {
        const p = obj(raw);
        return {
          name: i18nLine(p.name, 60, EMPTY()),
          price: i18nLine(p.price, 40, EMPTY()),
          duration: i18nLine(p.duration, 40, EMPTY()),
          features: i18nText(p.features, 800, EMPTY()),
          highlight: bool(p.highlight, false),
          badge: i18nLine(p.badge, 40, EMPTY()),
        };
      }),
    },
    schedule: {
      note: i18nText(schedule.note, 500, d.schedule.note),
      items: list(schedule.items, LIMITS.schedule, d.schedule.items).map((raw) => {
        const s = obj(raw);
        return {
          title: i18nLine(s.title, 80, EMPTY()),
          day: oneOf(s.day, [...DAYS, 'custom'], 'mon'),
          when: i18nLine(s.when, 60, EMPTY()),
          time: line(s.time, 30, ''),
          place: i18nLine(s.place, 120, EMPTY()),
          note: i18nLine(s.note, 160, EMPTY()),
        };
      }),
    },
    about: {
      text: i18nText(about.text, 4000, d.about.text),
      photo: image(about.photo),
      photoAlt: i18nLine(about.photoAlt, 200, EMPTY()),
      photoShape: oneOf(about.photoShape, Object.keys(PHOTO_SHAPES), d.about.photoShape),
      stats: list(about.stats, LIMITS.stats, d.about.stats).map((raw) => ({ value: line(obj(raw).value, 12, ''), label: i18nLine(obj(raw).label, 40, EMPTY()) })),
    },
    gallery: {
      layout: oneOf(gallery.layout, Object.keys(GALLERY_LAYOUTS), d.gallery.layout),
      images: list(gallery.images, LIMITS.gallery, d.gallery.images).map((raw) => ({ src: image(obj(raw).src), alt: i18nLine(obj(raw).alt, 200, EMPTY()) })),
    },
    testimonials: {
      showStars: bool(reviews.showStars, d.testimonials.showStars),
      items: list(reviews.items, LIMITS.testimonials, d.testimonials.items).map((raw) => {
        const r = obj(raw);
        return { quote: i18nText(r.quote, 800, EMPTY()), name: line(r.name, 60, ''), detail: i18nLine(r.detail, 80, EMPTY()), rating: num(r.rating, 0, 5, 5) };
      }),
    },
    faq: {
      items: list(faq.items, LIMITS.faq, d.faq.items).map((raw) => ({ q: i18nLine(obj(raw).q, 200, EMPTY()), a: i18nText(obj(raw).a, 2000, EMPTY()) })),
    },
    contact: {
      phone: phone(contact.phone),
      email: isEmail(email) ? email : '',
      whatsapp: bool(contact.whatsapp, d.contact.whatsapp),
      viber: bool(contact.viber, d.contact.viber),
      address: str(contact.address, 200, '').trim(),
      area: i18nLine(contact.area, 160, EMPTY()),
      hours: i18nText(contact.hours, 300, EMPTY()),
      mapUrl: httpLink(contact.mapUrl),
    },
    form: {
      provider: oneOf(form.provider, PROVIDER_IDS, d.form.provider),
      formspree: { formId: line(formspreeId(obj(form.formspree).formId), 40, '').trim() },
      custom: (() => {
        const c = obj(form.custom);
        return {
          action: httpLink(c.action),
          providerName: line(c.providerName, 60, '').trim(),
          privacyUrl: httpLink(c.privacyUrl),
          extraName: line(c.extraName, 64, '').trim(),
          extraValue: line(c.extraValue, 200, '').trim(),
          mode: oneOf(c.mode, ['json', 'navigate'], 'json'),
        };
      })(),
      fields: Object.fromEntries(
        FORM_FIELDS.map((id) => {
          const f = obj(fields[id]);
          const df = FIELD_DEFAULTS[id];
          const show = id === 'name' ? true : bool(f.show, df.show);
          return [id, { show, required: show && bool(f.required, df.required), label: i18nLine(f.label, 60, EMPTY()) }];
        })
      ),
      requireContact: bool(form.requireContact, d.form.requireContact),
      buttonLabel: i18nRequired(form.buttonLabel, 40, d.form.buttonLabel),
      privacyNote: i18nLine(form.privacyNote, 300, d.form.privacyNote),
      successTitle: i18nRequired(form.successTitle, 100, d.form.successTitle),
      successBody: i18nText(form.successBody, 500, d.form.successBody),
    },
    thanks: { title: i18nRequired(thanks.title, 100, d.thanks.title), body: i18nText(thanks.body, 800, d.thanks.body) },
    floating: {
      enabled: bool(float.enabled, d.floating.enabled),
      action: oneOf(float.action, Object.keys(FLOAT_ACTIONS), d.floating.action),
      label: i18nLine(float.label, 30, d.floating.label),
      where: oneOf(float.where, Object.keys(FLOAT_PLACES), d.floating.where),
      side: oneOf(float.side, Object.keys(SIDES), d.floating.side),
    },
    footer: {
      text: i18nText(footer.text, 300, d.footer.text),
      showContact: bool(footer.showContact, d.footer.showContact),
      showSocials: bool(footer.showSocials, d.footer.showSocials),
      showBusiness: bool(footer.showBusiness, d.footer.showBusiness),
    },
    // Entries without a URL are kept so the admin can offer them ready to fill in; pages skip them.
    socials: list(raw.socials, LIMITS.socials, d.socials).map((s) => {
      const item = obj(s);
      return { platform: oneOf(item.platform, Object.keys(SOCIAL_PLATFORMS), 'website'), url: link(item.url), label: line(item.label, 40, '') };
    }),
    business: {
      name: line(business.name, 120, ''),
      address: str(business.address, 300, ''),
      registration: line(business.registration, 20, '').trim(),
      taxNumber: line(business.taxNumber, 20, '').trim(),
      vatId: line(business.vatId, 20, '').trim(),
    },
    theme: {
      preset: oneOf(theme.preset, [...Object.keys(PRESETS), 'custom'], 'custom'),
      colors: Object.fromEntries(Object.entries(d.theme.colors).map(([k, v]) => [k, color(colors[k], v)])),
      headingFont: oneOf(theme.headingFont, FONT_IDS, d.theme.headingFont),
      bodyFont: oneOf(theme.bodyFont, FONT_IDS, d.theme.bodyFont),
      baseSize: num(theme.baseSize, 15, 22, d.theme.baseSize),
      radius: num(theme.radius, 0, 40, d.theme.radius),
      buttonStyle: oneOf(theme.buttonStyle, Object.keys(BUTTON_STYLES), d.theme.buttonStyle),
      cardStyle: oneOf(theme.cardStyle, Object.keys(CARD_STYLES), d.theme.cardStyle),
      divider: oneOf(theme.divider, Object.keys(DIVIDERS), d.theme.divider),
      pattern: oneOf(theme.pattern, Object.keys(PATTERNS), d.theme.pattern),
      patternStrength: num(theme.patternStrength, 5, 100, d.theme.patternStrength),
      decoration: oneOf(theme.decoration, Object.keys(DECORATIONS), d.theme.decoration),
      alternate: bool(theme.alternate, d.theme.alternate),
      animations: bool(theme.animations, d.theme.animations),
      favicon: image(theme.favicon),
    },
    textStyles: Object.fromEntries(
      Object.keys(TEXT_ROLES).map((id) => {
        const t = obj(obj(raw.textStyles)[id]);
        const dt = DEFAULT_TEXT_STYLE;
        return [
          id,
          {
            font: t.font === '' ? '' : oneOf(t.font, FONT_IDS, dt.font),
            weight: t.weight === 0 ? 0 : Math.round(num(t.weight, 100, 900, dt.weight) / 100) * 100,
            size: num(t.size, 50, 250, dt.size),
            case: oneOf(t.case, Object.keys(TEXT_CASES), dt.case),
            color: oneOf(t.color, Object.keys(TEXT_COLORS), dt.color),
            customColor: color(t.customColor, dt.customColor),
            tracking: num(t.tracking, -10, 40, dt.tracking),
            shadow: oneOf(t.shadow, Object.keys(TEXT_SHADOWS), dt.shadow),
          },
        ];
      })
    ),
    privacy: {
      effectiveDate: date(privacy.effectiveDate, d.privacy.effectiveDate),
      retentionMonths: num(privacy.retentionMonths, 1, 120, d.privacy.retentionMonths),
      photos: bool(privacy.photos, d.privacy.photos),
      hosting: i18nRequired(privacy.hosting, 160, d.privacy.hosting),
      outsideEu: bool(privacy.outsideEu, d.privacy.outsideEu),
      extra: i18nText(privacy.extra, 6000, EMPTY()),
    },
    terms: { enabled: bool(terms.enabled, d.terms.enabled), title: i18nRequired(terms.title, 80, d.terms.title), body: i18nText(terms.body, 12000, EMPTY()) },
    seo: {
      title: i18nRequired(seo.title, 120, d.seo.title),
      description: i18nLine(seo.description, 300, d.seo.description),
      ogImage: image(seo.ogImage),
      ogImageAlt: i18nLine(seo.ogImageAlt, 200, EMPTY()),
      indexable: bool(seo.indexable, d.seo.indexable),
      areaServed: line(seo.areaServed, 160, ''),
      priceRange: line(seo.priceRange, 20, ''),
    },
  };
}

// --- helpers for the renderer and the admin ----------------------------------------------

/** Languages shown on the live site, Slovenian first. */
export function enabledLangs(settings) {
  return ['sl', ...['en', 'sh'].filter((l) => settings.languages[l].enabled)];
}

/** Translatable texts that have Slovenian text but nothing in this language: [{ path, value }]. */
export function missingTranslations(settings, lang) {
  if (lang === 'sl') return [];
  return i18nFields(settings).filter(({ value }) => value.sl.trim() && !value[lang].trim());
}

/** Things the site owner still needs to do; shown on the admin overview. */
export function setupChecklist(settings) {
  const s = settings;
  const provider = resolveProvider(s.form, s.contact.email);
  const missing = ['en', 'sh'].filter((l) => s.languages[l].enabled).map((l) => [l, missingTranslations(s, l).length]);
  const untranslated = missing.reduce((sum, [, n]) => sum + n, 0);
  return [
    {
      id: 'contact',
      done: Boolean(s.contact.phone || s.contact.email),
      title: 'Vpišite telefon in e-pošto',
      detail: 'Brez njih vas starši ne morejo poklicati in gumbi za klic se ne prikažejo.',
      panel: 'contact',
    },
    {
      id: 'form',
      done: provider.ready || s.form.provider === 'none',
      title: 'Nastavite obrazec za povpraševanje',
      detail: provider.ready ? `Povpraševanja pošilja: ${provider.label}.` : 'Izberite, kam naj prihajajo povpraševanja.',
      panel: 'form',
    },
    {
      id: 'business',
      done: Boolean(s.business.name && s.business.address),
      title: 'Vpišite podatke o podjetju',
      detail: 'Zakon o elektronskem poslovanju zahteva naziv in naslov ponudnika na spletni strani. Uporabijo se tudi v politiki zasebnosti.',
      panel: 'legal',
    },
    {
      id: 'translations',
      done: untranslated === 0,
      title: untranslated ? `Prevedite še ${untranslated} besedil` : 'Prevodi so popolni',
      detail: missing.map(([l, n]) => `${s.languages[l].label}: ${n ? `manjka ${n}` : 'vse prevedeno'}`).join(' · ') || 'Drugi jeziki so izklopljeni.',
      panel: 'languages',
    },
    {
      id: 'photos',
      done: Boolean(s.hero.image || s.about.photo || s.gallery.images.some((i) => i.src)),
      optional: true,
      title: 'Dodajte fotografije (neobvezno)',
      detail: 'Fotografija na vrhu, predstavitvena slika in galerija. Objavite le slike otrok, za katere imate soglasje staršev.',
      panel: 'hero',
    },
    {
      id: 'socials',
      done: s.socials.some((x) => x.url),
      optional: true,
      title: 'Dodajte družbena omrežja (neobvezno)',
      detail: 'Facebook, Instagram, TikTok … se prikažejo v nogi strani.',
      panel: 'socials',
    },
    {
      id: 'index',
      done: s.seo.indexable,
      optional: true,
      title: 'Ko je stran pripravljena, jo pokažite iskalnikom',
      detail: 'Zdaj je skrita pred Googlom, da ne bi indeksiral vzorčnih besedil. Vklopite pod SEO in deljenje.',
      panel: 'seo',
    },
  ];
}
