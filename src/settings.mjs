// Default site settings and the normaliser that every settings object passes through, both when the
// admin edits it and when the build renders it. Unknown keys are dropped, strings are length-limited,
// enums/colours/URLs are validated, so a broken or tampered site.json can never produce unsafe output.
//
// Texts visitors read are stored in all four languages: { sl, en, hr, sr }. Slovenian is the original.
// Serbian may be stored in Latin or Cyrillic; the site shows it in Cyrillic.
// The default texts follow the "Vabilo" design and speak as Ema (first person). They contain no invented
// facts: no prices, schedules, credentials or reviews. Photos marked as samples (SAMPLE_PREFIX) are free stock
// photos that stand in until the owner uploads her own; the admin keeps reminding her to replace them.

import { HR_FLAG_CHOICES } from './flags.mjs';
import { BRAND_ICONS, SERVICE_ICONS } from './icons.mjs';
import { formspreeId, PROVIDER_IDS, resolveProvider } from './providers.mjs';
import { DEFAULT_TEXT_STYLE, FONT_IDS, PRESETS, TEXT_CASES, TEXT_COLORS, TEXT_ROLES, TEXT_SHADOWS } from './themes.mjs';
import { clamp, i18nFields, isEmail, isHexColor, isPhone, isPlainObject, LANGS, safeAssetPath, safeUrl } from './util.mjs';

export const SCHEMA_VERSION = 3;

/** Languages besides Slovenian, in the order the site lists them. */
export const OTHER_LANGS = ['en', 'hr', 'sr'];

/** Shorthand for a text in all four languages. */
export const tx = (sl, en = '', hr = '', sr = '') => ({ sl, en, hr, sr });
const EMPTY = () => tx('');

export const SECTION_IDS = ['steps', 'packages', 'schedule', 'events', 'about', 'gallery', 'testimonials', 'faq', 'contact', 'services'];
export const SECTION_LABELS = {
  steps: 'Program zabave',
  packages: 'Paketi',
  schedule: 'Športne urice',
  events: 'Animacija na dogodkih',
  about: 'O meni',
  gallery: 'Utrinki (galerija)',
  testimonials: 'Mnenja staršev',
  faq: 'Pogosta vprašanja',
  contact: 'Rezervacija (kontakt in obrazec)',
  services: 'Ponudba (dodatne storitve)',
};

export const LINK_TARGETS = {
  contact: 'Obrazec za rezervacijo',
  steps: 'Razdelek Program',
  packages: 'Razdelek Paketi',
  schedule: 'Razdelek Športne urice',
  events: 'Razdelek Dogodki',
  about: 'Razdelek O meni',
  gallery: 'Razdelek Utrinki',
  faq: 'Razdelek Vprašanja',
  services: 'Razdelek Ponudba',
  phone: 'Klic na telefon',
  whatsapp: 'Sporočilo na WhatsApp',
  viber: 'Sporočilo na Viber',
  email: 'E-pošta',
  url: 'Druga povezava …',
};
export const BAR_STYLES = { accent: 'Glavna barva', gold: 'Zlata', coral: 'Koralna', dark: 'Temna' };
export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const DAY_OPTIONS = { mon: 'ponedeljek', tue: 'torek', wed: 'sreda', thu: 'četrtek', fri: 'petek', sat: 'sobota', sun: 'nedelja', custom: 'Drugo (vpišem besedilo)' };
export const FORM_TOPICS = { party: 'Rojstni dan', sport: 'Športne urice', event: 'Drug dogodek' };
export const FORM_ASK = {
  time: 'Okvirna ura (dopoldne ali popoldne)',
  where: 'Kje bo zabava (doma ali v najetem prostoru)',
  town: 'Kraj zabave',
  reply: 'Kako naj odgovorim (klic, sporočilo ali e-pošta)',
};
const EXTRA_PLATFORMS = { email: 'E-pošta', website: 'Spletna stran' };
export const SOCIAL_PLATFORMS = {
  ...Object.fromEntries(['facebook', 'instagram', 'tiktok', 'youtube', 'whatsapp', 'viber', 'messenger', 'threads', 'telegram', 'x'].map((id) => [id, BRAND_ICONS[id]?.title ?? id])),
  ...EXTRA_PLATFORMS,
};
export const LIMITS = { services: 12, steps: 8, packages: 4, schedule: 8, facts: 6, badges: 6, plan: 4, gallery: 60, testimonials: 30, faq: 30, socials: 12 };

/** Free stock photos that come with the site. Each one should be replaced with the owner's own photo. */
export const SAMPLE_PREFIX = '/assets/img/sample/';
export const isSample = (path) => typeof path === 'string' && path.startsWith(SAMPLE_PREFIX);

const DEFAULT_PRESET = PRESETS.vabilo;
const section = (id, enabled, inMenu, heading, menuLabel, intro = EMPTY(), kicker = EMPTY()) => ({ id, enabled, inMenu, kicker, heading, menuLabel, intro });
const sample = (name) => `${SAMPLE_PREFIX}${name}`;

export const DEFAULT_SETTINGS = {
  schemaVersion: SCHEMA_VERSION,
  site: {
    name: 'Otroško animiranje Ema',
    url: 'https://elarion-game-dev.github.io/otrosko-animiranje-ema',
  },
  languages: {
    en: { enabled: true, label: 'English', short: 'EN' },
    hr: { enabled: true, label: 'Hrvatski', short: 'HR', flags: ['hr'] },
    sr: { enabled: true, label: 'Српски', short: 'SR' },
  },
  announcement: {
    enabled: false,
    text: tx('Termini za praznične zabave se hitro polnijo!', 'Holiday party dates are filling up fast!', 'Termini za blagdanske zabave brzo se popunjavaju!', 'Termini za praznične zabave brzo se popunjavaju!'),
    linkLabel: tx('Preverite prost termin', 'Check a date', 'Provjerite termin', 'Proverite termin'),
    target: 'contact',
    url: '',
    style: 'gold',
  },
  header: {
    logo: '',
    logoHeight: 44,
    showName: true,
    sticky: true,
    cta: { enabled: true, label: tx('Preverite prost termin', 'Check a date', 'Provjerite termin', 'Proverite termin'), target: 'contact', url: '' },
  },
  // The first screen answers in a few seconds what is offered, by whom and how to book: a line on where, the
  // headline, one sentence on why it is easy, a button and the phone number, three steps, and one big photo
  // with the host's name on it.
  hero: {
    badge: tx('Pridem k vam domov ali v najeti prostor', 'I come to your home or a rented venue', 'Dolazim k vama kući ili u iznajmljeni prostor', 'Dolazim kod vas kući ili u iznajmljeni prostor'),
    title: tx('Rojstnodnevne zabave z *vzgojiteljico Emo*', 'Birthday parties with *Ema, a kindergarten teacher*', 'Rođendanske zabave s *odgojiteljicom Emom*', 'Rođendanske zabave sa *vaspitačicom Emom*'),
    text: tx(
      'Vi pripravite prostor in torto. Za igre, poligon in program za vse otroke poskrbim jaz.',
      'You provide the space and the cake. I take care of the games, an obstacle course and a programme for all the children.',
      'Vi pripremite prostor i tortu. Za igre, poligon i program za svu djecu pobrinem se ja.',
      'Vi pripremite prostor i tortu. Za igre, poligon i program za svu decu pobrinem se ja.'
    ),
    primary: { label: tx('Preverite prost termin', 'Check a date', 'Provjerite termin', 'Proverite termin'), target: 'contact', url: '' },
    secondary: { label: EMPTY(), target: 'steps', url: '' },
    showPhone: true,
    plan: [
      { text: tx('Pišete mi datum', 'Send me the date', 'Javite mi datum', 'Javite mi datum') },
      { text: tx('Dogovoriva program', 'We agree on the programme', 'Dogovorimo program', 'Dogovorimo program') },
      { text: tx('Praznujete', 'You celebrate', 'Slavite', 'Slavite') },
    ],
    photo: sample('hero-play.webp'),
    photoAlt: tx('Otroci s klobučki plešejo v krogu', 'Children in party hats dancing in a circle', 'Djeca sa šeširićima plešu u krugu', 'Deca sa šeširićima plešu u krugu'),
    hostName: 'Ema',
    hostRole: tx('vzgojiteljica v vrtcu', 'kindergarten teacher', 'odgojiteljica u vrtiću', 'vaspitačica u vrtiću'),
  },
  sections: [
    section(
      'steps',
      true,
      true,
      tx('Program zabave', 'The party programme', 'Program zabave', 'Program zabave'),
      tx('Program', 'Programme', 'Program', 'Program'),
      tx(
        'Primer za dve uri. Igre prilagodim starosti in željam slavljenca, tempo pa otrokom.',
        "An example for two hours. I adapt the games to the birthday child's age and wishes, and the pace to the children.",
        'Primjer za dva sata. Igre prilagodim dobi i željama slavljenika, a tempo djeci.',
        'Primer za dva sata. Igre prilagodim uzrastu i željama slavljenika, a tempo deci.'
      ),
      tx('Program', 'Programme', 'Program', 'Program')
    ),
    section(
      'packages',
      true,
      true,
      tx('Izberite svojo zabavo', 'Choose your party', 'Odaberite svoju zabavu', 'Izaberite svoju zabavu'),
      tx('Paketi', 'Packages', 'Paketi', 'Paketi'),
      tx(
        'Točno ceno vam povem vnaprej. Odvisna je od števila otrok in kraja, skritih stroškov ni.',
        'I tell you the exact price in advance. It depends on the number of children and the place, with no hidden costs.',
        'Točnu cijenu kažem vam unaprijed. Ovisi o broju djece i mjestu, skrivenih troškova nema.',
        'Tačnu cenu kažem vam unapred. Zavisi od broja dece i mesta, skrivenih troškova nema.'
      ),
      tx('Paketi', 'Packages', 'Paketi', 'Paketi')
    ),
    section(
      'schedule',
      true,
      true,
      tx('Športne urice', 'Sports classes', 'Sportske aktivnosti', 'Sportske aktivnosti'),
      tx('Športne urice', 'Sports classes', 'Sport', 'Sport'),
      tx(
        'Tedenska vadba skozi igro v majhni skupini. Otroci razvijajo ravnotežje, koordinacijo in samozavest, predvsem pa se radi gibljejo.',
        'Weekly exercise through play in a small group. Children build balance, coordination and confidence, and above all they learn to love moving.',
        'Tjedno vježbanje kroz igru u maloj grupi. Djeca razvijaju ravnotežu, koordinaciju i samopouzdanje, a prije svega zavole kretanje.',
        'Nedeljno vežbanje kroz igru u maloj grupi. Deca razvijaju ravnotežu, koordinaciju i samopouzdanje, a pre svega zavole kretanje.'
      ),
      tx('Tudi med tednom', 'During the week too', 'I tijekom tjedna', 'I tokom nedelje')
    ),
    section(
      'events',
      true,
      false,
      tx('Animacija na dogodkih', 'Entertainment at events', 'Animacija na događajima', 'Animacija na događajima'),
      tx('Dogodki', 'Events', 'Događaji', 'Događaji'),
      tx(
        'Poroka, krst, piknik podjetja ali družinsko praznovanje: otroke zaposlim z igrami, vi pa se v miru posvetite gostom.',
        'A wedding, a christening, a company picnic or a family celebration: I keep the children busy with games while you take time for your guests.',
        'Vjenčanje, krštenje, piknik tvrtke ili obiteljska proslava: djecu zaposlim igrama, a vi se u miru posvetite gostima.',
        'Venčanje, krštenje, piknik firme ili porodična proslava: decu zaposlim igrama, a vi se u miru posvetite gostima.'
      )
    ),
    section('about', true, true, tx('Sem Ema, vzgojiteljica', "I'm Ema, a kindergarten teacher", 'Ja sam Ema, odgojiteljica', 'Ja sam Ema, vaspitačica'), tx('O meni', 'About me', 'O meni', 'O meni'), EMPTY(), tx('O meni', 'About me', 'O meni', 'O meni')),
    section('gallery', true, false, tx('Igra, gibanje in smeh', 'Play, movement and laughter', 'Igra, kretanje i smijeh', 'Igra, kretanje i smeh'), tx('Utrinki', 'Gallery', 'Galerija', 'Galerija'), EMPTY(), tx('Utrinki', 'Snapshots', 'Trenuci', 'Trenuci')),
    section('testimonials', true, false, tx('Kaj pravijo starši', 'What parents say', 'Što kažu roditelji', 'Šta kažu roditelji'), tx('Mnenja', 'Reviews', 'Dojmovi', 'Utisci'), EMPTY(), tx('Mnenja', 'Reviews', 'Dojmovi', 'Utisci')),
    section(
      'faq',
      true,
      true,
      tx('Pogosta vprašanja', 'Questions parents ask', 'Česta pitanja', 'Česta pitanja'),
      tx('Vprašanja', 'FAQ', 'Pitanja', 'Pitanja'),
      tx('Niste našli odgovora? Pokličite me na {phone}.', "Didn't find your answer? Call me on {phone}.", 'Niste pronašli odgovor? Nazovite me na {phone}.', 'Niste pronašli odgovor? Pozovite me na {phone}.'),
      tx('Vprašanja', 'Questions', 'Pitanja', 'Pitanja')
    ),
    section(
      'contact',
      true,
      false,
      tx('Preverite prost termin', 'Check if your date is free', 'Provjerite je li termin slobodan', 'Proverite da li je termin slobodan'),
      tx('Rezervacija', 'Booking', 'Rezervacija', 'Rezervacija'),
      tx(
        'Pošljite datum in nekaj podatkov o zabavi. Odgovorim čim prej, po telefonu ali s sporočilom, kakor vam ustreza.',
        "Send me the date and a few details about the party. I'll reply as soon as I can, by phone or by message, whichever suits you.",
        'Pošaljite datum i nekoliko podataka o zabavi. Odgovorit ću što prije, telefonom ili porukom, kako vam odgovara.',
        'Pošaljite datum i nekoliko podataka o zabavi. Odgovoriću što pre, telefonom ili porukom, kako vam odgovara.'
      ),
      tx('Prosim za odgovor', 'Kindly reply', 'Molim za odgovor', 'Molim za odgovor')
    ),
    section(
      'services',
      false,
      false,
      tx('Kaj še ponujam', 'What else I offer', 'Što još nudim', 'Šta još nudim'),
      tx('Ponudba', 'Services', 'Ponuda', 'Ponuda'),
      tx('Program vedno prilagodim starosti otrok, prostoru in vašim željam.', "I always adapt the programme to the children's ages, the space and your wishes.", 'Program uvijek prilagodim dobi djece, prostoru i vašim željama.', 'Program uvek prilagodim uzrastu dece, prostoru i vašim željama.'),
      tx('Ponudba', 'Services', 'Ponuda', 'Ponuda')
    ),
  ],
  services: {
    showInquiry: true,
    items: [
      {
        icon: 'cake',
        image: '',
        title: tx('Rojstnodnevne zabave', 'Birthday parties', 'Rođendanske zabave', 'Rođendanske zabave'),
        text: tx('Igre, gibanje in smeh za slavljenca in prijatelje, doma ali v najetem prostoru.', 'Games, movement and laughter for the birthday child and friends, at home or in a rented venue.', 'Igre, kretanje i smijeh za slavljenika i prijatelje, kod kuće ili u iznajmljenom prostoru.', 'Igre, kretanje i smeh za slavljenika i prijatelje, kod kuće ili u iznajmljenom prostoru.'),
      },
      {
        icon: 'ball',
        image: '',
        title: tx('Športne urice', 'Sports classes', 'Sportske aktivnosti', 'Sportske aktivnosti'),
        text: tx('Gibalne igre, poligoni in štafete, ki otroke spodbujajo k gibanju in sodelovanju.', 'Movement games, obstacle courses and relays that get children moving and playing together.', 'Igre kretanja, poligoni i štafete koji djecu potiču na kretanje i zajedničku igru.', 'Igre kretanja, poligoni i štafete koji decu potiču na kretanje i zajedničku igru.'),
      },
      {
        icon: 'party',
        image: '',
        title: tx('Animacija na dogodkih', 'Entertainment at events', 'Animacija na događajima', 'Animacija na događajima'),
        text: tx('Poroke, krsti in druženja: otroci se zabavajo, odrasli se sprostijo.', 'Weddings, christenings and get-togethers: the children have fun and the adults can relax.', 'Vjenčanja, krštenja i druženja: djeca se zabavljaju, a odrasli se opuštaju.', 'Venčanja, krštenja i druženja: deca se zabavljaju, a odrasli se opuštaju.'),
      },
    ],
  },
  steps: {
    items: [
      { icon: 'wave', time: '0:00', title: tx('Pozdrav in igre za spoznavanje', 'Hello and getting-to-know-you games', 'Pozdrav i igre upoznavanja', 'Pozdrav i igre upoznavanja'), text: tx('Da se tudi sramežljivi hitro vključijo', 'So even shy children join in quickly', 'Da se i sramežljivi brzo uključe', 'Da se i stidljivi brzo uključe') },
      { icon: 'run', time: '0:15', title: tx('Poligon in gibalne igre', 'Obstacle course and movement games', 'Poligon i igre kretanja', 'Poligon i igre kretanja'), text: tx('Plazenje, skakanje, ravnotežje', 'Crawling, jumping, balancing', 'Puzanje, skakanje, ravnoteža', 'Puzanje, skakanje, ravnoteža') },
      { icon: 'ball', time: '0:45', title: tx('Igre z žogo v ekipah', 'Team ball games', 'Igre s loptom u timovima', 'Igre sa loptom u timovima'), text: tx('Vsak pride na vrsto', 'Everyone gets a turn', 'Svi dođu na red', 'Svi dođu na red') },
      { icon: 'cake', time: '1:15', title: tx('Torta in pesem za slavljenca', 'Cake and a song for the birthday child', 'Torta i pjesma za slavljenika', 'Torta i pesma za slavljenika'), text: tx('Odmor za torto, sok in čestitke', 'A break for cake, juice and wishes', 'Pauza za tortu, sok i čestitke', 'Pauza za tortu, sok i čestitke') },
      { icon: 'camera', time: '1:45', title: tx('Zaključna igra in skupinska fotografija', 'A last game and a group photo', 'Završna igra i zajednička fotografija', 'Završna igra i zajednička fotografija'), text: tx('Za lep spomin na zabavo', 'Something to remember the party by', 'Za lijepu uspomenu na zabavu', 'Za lepu uspomenu na zabavu') },
    ],
  },
  packages: {
    buttonLabel: tx('Izberite', 'Choose', 'Odaberite', 'Izaberite'),
    note: tx(
      '**Vi pripravite:** prostor, torto in pijačo\n**Jaz prinesem:** vse pripomočke za igre',
      '**You provide:** the space, cake and drinks\n**I bring:** everything for the games',
      '**Vi pripremite:** prostor, tortu i piće\n**Ja donosim:** sav pribor za igre',
      '**Vi pripremite:** prostor, tortu i piće\n**Ja donosim:** sav pribor za igre'
    ),
    items: [
      {
        name: tx('Mali paket', 'Small package', 'Mali paket', 'Mali paket'),
        price: EMPTY(),
        duration: tx('do 10 otrok · 1,5 ure', 'up to 10 children · 1.5 hours', 'do 10 djece · 1,5 sat', 'do 10 dece · 1,5 sat'),
        features: tx(
          'Program, prilagojen starosti\nGibalne igre in poligon\nIgre z žogo\nVodenje celotne zabave',
          'A programme suited to their age\nMovement games and an obstacle course\nBall games\nI run the whole party',
          'Program prilagođen dobi djece\nIgre kretanja i poligon\nIgre s loptom\nVodim cijelu zabavu',
          'Program prilagođen uzrastu dece\nIgre kretanja i poligon\nIgre sa loptom\nVodim celu zabavu'
        ),
        highlight: false,
        badge: EMPTY(),
        button: tx('Izberite mali paket', 'Choose the small package', 'Odaberite mali paket', 'Izaberite mali paket'),
      },
      {
        name: tx('Veliki paket', 'Big package', 'Veliki paket', 'Veliki paket'),
        price: EMPTY(),
        duration: tx('do 20 otrok · 2 uri', 'up to 20 children · 2 hours', 'do 20 djece · 2 sata', 'do 20 dece · 2 sata'),
        features: tx(
          'Vse iz malega paketa\nDaljši program z več postajami\nSkupinska fotografija za spomin',
          'Everything in the small package\nA longer programme with more stations\nA group photo to remember the day',
          'Sve iz malog paketa\nDulji program s više postaja\nZajednička fotografija za uspomenu',
          'Sve iz malog paketa\nDulji program sa više stanica\nZajednička fotografija za uspomenu'
        ),
        highlight: true,
        badge: EMPTY(),
        button: tx('Izberite veliki paket', 'Choose the big package', 'Odaberite veliki paket', 'Izaberite veliki paket'),
      },
    ],
  },
  schedule: {
    photo: sample('sport.webp'),
    photoAlt: tx('Deklice skačejo čez kolebnico v telovadnici', 'Girls skipping rope in a school gym', 'Djevojčice preskaču konop u dvorani', 'Devojčice preskaču konopac u sali'),
    facts: [
      { icon: 'users', text: tx('Majhna skupina', 'Small groups', 'Mala grupa', 'Mala grupa') },
      { icon: 'run', text: tx('Gibanje skozi igro', 'Movement through play', 'Kretanje kroz igru', 'Kretanje kroz igru') },
      { icon: 'calendar', text: tx('Enkrat na teden', 'Once a week', 'Jednom tjedno', 'Jednom nedeljno') },
    ],
    note: EMPTY(),
    stubLabel: tx('Vsak teden', 'Every week', 'Svaki tjedan', 'Svake nedelje'),
    buttonLabel: tx('Prijava', 'Sign up', 'Prijava', 'Prijava'),
    items: [],
  },
  events: {
    buttonLabel: tx('Pišite mi', 'Get in touch', 'Javite mi se', 'Javite mi se'),
  },
  about: {
    text: tx(
      'Z otroki delam vsak dan v vrtcu. Vem, kako otroke navdušiti in umiriti, kako v igro povabiti tudi bolj sramežljive in kako poskrbeti, da so vsi varni.',
      'I work with children every day at kindergarten. I know how to get them excited and how to calm them down, how to bring shyer children into the game, and how to keep everyone safe.',
      'S djecom radim svaki dan u vrtiću. Znam kako djecu oduševiti i smiriti, kako u igru uključiti i one sramežljivije i kako se pobrinuti da svi budu sigurni.',
      'Sa decom radim svaki dan u vrtiću. Znam kako da decu oduševim i smirim, kako da u igru uključim i one stidljivije i kako da se pobrinem da svi budu bezbedni.'
    ),
    photo: '',
    photoAlt: EMPTY(),
    badges: [],
    signature: tx('Se vidimo na zabavi! Ema', 'See you at the party! Ema', 'Vidimo se na zabavi! Ema', 'Vidimo se na zabavi! Ema'),
  },
  gallery: {
    note: tx('Fotografije otrok objavljam samo s pisnim soglasjem staršev.', "I only publish photos of children with their parents' written consent.", 'Fotografije djece objavljujem samo uz pisani pristanak roditelja.', 'Fotografije dece objavljujem samo uz pisani pristanak roditelja.'),
    images: [
      { src: sample('gallery-balloons.webp'), alt: tx('Otroci na kavču pod šopkom balonov', 'Children on a sofa under a bunch of balloons', 'Djeca na kauču ispod hrpe balona', 'Deca na kauču ispod gomile balona'), caption: tx('Baloni!', 'Balloons!', 'Baloni!', 'Baloni!') },
      { src: sample('gallery-cake.webp'), alt: tx('Otroci upihujejo svečke na torti', 'Children blowing out the candles on a cake', 'Djeca pušu svjećice na torti', 'Deca pušu svećice na torti'), caption: tx('Torta!', 'Cake time!', 'Torta!', 'Torta!') },
      { src: sample('gallery-ball.webp'), alt: tx('Otroci se igrajo z žogo v parku', 'Children playing ball in a park', 'Djeca se igraju loptom u parku', 'Deca se igraju loptom u parku'), caption: tx('Igre z žogo', 'Ball games', 'Igre s loptom', 'Igre sa loptom') },
      { src: sample('gallery-hats.webp'), alt: tx('Otroci s klobučki se objemajo', 'Children in party hats hugging', 'Djeca sa šeširićima se grle', 'Deca sa šeširićima se grle'), caption: tx('Zabava s klobučki', 'Party hats on', 'Zabava sa šeširićima', 'Zabava sa šeširićima') },
      { src: sample('gallery-group.webp'), alt: tx('Poslikani otroci pod mavričnim padalom', 'Children with painted faces under a rainbow parachute', 'Djeca oslikanih lica ispod šarenog padobrana', 'Deca oslikanih lica ispod šarenog padobrana'), caption: tx('Skupaj je lepše', 'Better together', 'Zajedno je ljepše', 'Zajedno je lepše') },
    ],
  },
  testimonials: { showStars: false, ratingNote: EMPTY(), ratingUrl: '', items: [] },
  faq: {
    items: [
      {
        q: tx('Kaj moramo pripraviti starši?', 'What do we need to prepare?', 'Što trebamo pripremiti mi roditelji?', 'Šta treba da pripremimo mi roditelji?'),
        a: tx('Prostor, torto in pijačo. Za igre in vse pripomočke poskrbim jaz.', 'The space, cake and drinks. I take care of the games and bring everything for them.', 'Prostor, tortu i piće. Za igre i sav pribor pobrinem se ja.', 'Prostor, tortu i piće. Za igre i sav pribor pobrinem se ja.'),
      },
      {
        q: tx('Ali pridete tudi na dom?', 'Do you come to our home?', 'Dolazite li i kući?', 'Dolazite li i kući?'),
        a: tx('Da. Za igre potrebujemo dovolj prostora, na primer večjo dnevno sobo ali vrt.', 'Yes. For the games we need enough room, such as a larger living room or a garden.', 'Da. Za igre trebamo dovoljno prostora, na primjer veći dnevni boravak ili vrt.', 'Da. Za igre nam treba dovoljno prostora, na primer veća dnevna soba ili dvorište.'),
      },
      {
        q: tx('Koliko vnaprej rezerviram termin?', 'How far ahead should I book?', 'Koliko unaprijed trebam rezervirati?', 'Koliko unapred treba da rezervišem?'),
        a: tx('Čim prej, saj se sobote hitro zapolnijo. Pišite mi in preverim, ali je vaš datum še prost.', 'As early as you can, because Saturdays fill up quickly. Write to me and I will check whether your date is free.', 'Što prije, jer se subote brzo popune. Pišite mi i provjerit ću je li vaš datum slobodan.', 'Što pre, jer se subote brzo popune. Pišite mi i proveriću da li je vaš datum slobodan.'),
      },
      {
        q: tx('Kaj, če slavljenec zboli?', 'What if the birthday child gets ill?', 'Što ako se slavljenik razboli?', 'Šta ako se slavljenik razboli?'),
        a: tx('Sporočite mi čim prej in skupaj poiščeva nov termin.', 'Let me know as soon as you can and we will find a new date together.', 'Javite mi što prije pa ćemo zajedno pronaći novi termin.', 'Javite mi što pre pa ćemo zajedno pronaći novi termin.'),
      },
      {
        q: tx('Lahko pridejo otroci različnih starosti?', 'Can children of different ages come?', 'Mogu li doći djeca različite dobi?', 'Mogu li da dođu deca različitog uzrasta?'),
        a: tx('Da. Igre zastavim tako, da se vključijo mlajši in starejši.', 'Yes. I set up the games so that younger and older children can all join in.', 'Da. Igre postavim tako da se uključe i mlađi i stariji.', 'Da. Igre postavim tako da se uključe i mlađi i stariji.'),
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
    topics: { party: true, sport: true, event: true },
    ask: { time: true, where: true, town: true, reply: true },
    buttonLabel: tx('Pošljite povpraševanje', 'Send your enquiry', 'Pošaljite upit', 'Pošaljite upit'),
    privacyNote: tx(
      'Podatke uporabim samo za odgovor na vaše povpraševanje. Več v {privacy}.',
      'I only use your details to reply to your enquiry. More in the {privacy}.',
      'Vaše podatke koristim samo za odgovor na upit. Više u {privacy}.',
      'Vaše podatke koristim samo za odgovor na upit. Više u {privacy}.'
    ),
    successTitle: tx('Hvala! Povpraševanje sem prejela.', "Thank you! I've received your enquiry.", 'Hvala! Primila sam vaš upit.', 'Hvala! Primila sam vaš upit.'),
    successBody: tx('Odgovorim čim prej. Če se vam mudi, me pokličite.', "I'll reply as soon as I can. If it's urgent, give me a call.", 'Odgovorit ću što prije. Ako vam se žuri, nazovite me.', 'Odgovoriću što pre. Ako vam se žuri, pozovite me.'),
  },
  thanks: {
    title: tx('Hvala za povpraševanje!', 'Thank you for your enquiry!', 'Hvala na upitu!', 'Hvala na upitu!'),
    body: tx('Sporočilo sem prejela in vam odgovorim čim prej.', "I've received your message and will reply as soon as I can.", 'Primila sam vašu poruku i odgovorit ću vam što prije.', 'Primila sam vašu poruku i odgovoriću vam što pre.'),
  },
  floating: { enabled: true, label: tx('Preverite prost termin', 'Check a date', 'Provjerite termin', 'Proverite termin') },
  footer: {
    text: tx('Rojstnodnevne zabave in športne urice za otroke.', 'Birthday parties and sports classes for children.', 'Rođendanske zabave i sportske aktivnosti za djecu.', 'Rođendanske zabave i sportske aktivnosti za decu.'),
    showContact: true,
    showSocials: true,
    showBusiness: true,
  },
  socials: ['instagram', 'facebook'].map((platform) => ({ platform, url: '', label: '' })),
  business: { name: '', address: '', registration: '', taxNumber: '', vatId: '' },
  theme: {
    preset: 'vabilo',
    colors: { ...DEFAULT_PRESET.colors },
    headingFont: DEFAULT_PRESET.headingFont,
    bodyFont: DEFAULT_PRESET.bodyFont,
    baseSize: 17,
    garland: true,
    confetti: true,
    scallops: true,
    animations: true,
    favicon: '',
  },
  textStyles: Object.fromEntries(Object.keys(TEXT_ROLES).map((id) => [id, { ...DEFAULT_TEXT_STYLE }])),
  privacy: {
    effectiveDate: '2026-11-08',
    retentionMonths: 12,
    photos: true,
    // Change when the site moves to another host.
    hosting: tx('GitHub Pages (GitHub, Inc., ZDA)', 'GitHub Pages (GitHub, Inc., United States)', 'GitHub Pages (GitHub, Inc., SAD)', 'GitHub Pages (GitHub, Inc., SAD)'),
    outsideEu: true,
    extra: EMPTY(),
  },
  terms: { enabled: false, title: tx('Pogoji poslovanja', 'Terms and conditions', 'Uvjeti poslovanja', 'Uslovi poslovanja'), body: EMPTY() },
  seo: {
    title: tx(
      'Otroško animiranje Ema | Rojstnodnevne zabave in športne urice za otroke',
      "Otroško animiranje Ema | Children's birthday parties and sports classes",
      'Otroško animiranje Ema | Dječje rođendanske zabave i sportske aktivnosti',
      'Otroško animiranje Ema | Dečje rođendanske zabave i sportske aktivnosti'
    ),
    description: tx(
      'Rojstnodnevne zabave za otroke, tedenske športne urice in animacija na dogodkih. Vodi jih vzgojiteljica Ema. Preverite prost termin.',
      "Children's birthday parties, weekly sports classes and entertainment at events, led by Ema, a kindergarten teacher. Check if your date is free.",
      'Rođendanske zabave za djecu, tjedne sportske aktivnosti i animacija na događajima. Vodi ih odgojiteljica Ema. Provjerite slobodan termin.',
      'Rođendanske zabave za decu, nedeljne sportske aktivnosti i animacija na događajima. Vodi ih vaspitačica Ema. Proverite slobodan termin.'
    ),
    ogImage: sample('share.jpg'),
    ogImageAlt: tx('Otroci skačejo na kavču med baloni', 'Children jumping on a sofa among balloons', 'Djeca skaču na kauču među balonima', 'Deca skaču na kauču među balonima'),
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
// Images must be files on this site (uploads or the bundled samples), so pages never load anything from another server.
const image = (value) => safeAssetPath(value);
const icon = (value, fallback = 'star') => oneOf(value, ['', ...Object.keys(SERVICE_ICONS)], fallback);
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
      kicker: i18nLine(s.kicker, 40, d.kicker),
      heading: i18nLine(s.heading, 100, d.heading),
      menuLabel: i18nLine(s.menuLabel, 30, d.menuLabel),
      intro: i18nText(s.intro, 600, d.intro),
    });
  }
  for (const d of defaults) if (!seen.has(d.id)) out.push({ ...structuredClone(d), enabled: false });
  return out;
}

/** A short line with an icon, shown as a stamp (facts about the sports classes, badges in "About me"). */
const stamp = (raw) => ({ icon: icon(obj(raw).icon, 'check'), text: i18nLine(obj(raw).text, 60, EMPTY()) });

/** Flags shown for Croatian: one to three of the offered countries, in the chosen order. */
function hrFlags(value, fallback) {
  const chosen = Array.isArray(value) ? [...new Set(value.filter((c) => HR_FLAG_CHOICES.includes(c)))].slice(0, 3) : [];
  return chosen.length ? chosen : [...fallback];
}

/**
 * Files from before schema 3 had one Serbo-Croatian language, "sh" (Latin, ijekavian). Its texts are Croatian, so they
 * move to "hr"; Serbian starts empty and shows the Croatian text in Cyrillic until it is translated.
 */
function migrate(input) {
  if (Number(input.schemaVersion) >= 3) return input;
  const walk = (value) => {
    if (Array.isArray(value)) return value.map(walk);
    if (!isPlainObject(value)) return value;
    const text = 'sl' in value && 'sh' in value;
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [text && k === 'sh' ? 'hr' : k, walk(v)]));
  };
  const out = walk(input);
  const languages = { ...obj(out.languages) };
  const sh = obj(languages.sh);
  if (languages.sh) {
    delete languages.sh;
    // The old label ("Hrvatski / Srpski", "HR/SR") named both languages, so the new ones start from their defaults.
    languages.hr = { enabled: sh.enabled, flags: Array.isArray(sh.flags) ? sh.flags.filter((c) => c !== 'rs') : undefined };
    languages.sr = { enabled: sh.enabled };
    out.languages = languages;
  }
  return out;
}

/**
 * Returns a complete, valid settings object. Missing values fall back to defaults only where a fallback makes
 * sense; lists (services, photos, questions…) keep exactly what the owner entered.
 */
export function normalizeSettings(input) {
  const raw = migrate(obj(input));
  const d = DEFAULT_SETTINGS;
  const site = obj(raw.site);
  const langs = obj(raw.languages);
  const bar = obj(raw.announcement);
  const header = obj(raw.header);
  const hero = obj(raw.hero);
  // Until November 2026 the hero was an invitation card with up to two photos; the first one carries over.
  const heroPhoto = hero.photo === undefined && Array.isArray(hero.photos) ? obj(hero.photos[0]) : null;
  const services = obj(raw.services);
  const steps = obj(raw.steps);
  const packages = obj(raw.packages);
  const schedule = obj(raw.schedule);
  const events = obj(raw.events);
  const about = obj(raw.about);
  const gallery = obj(raw.gallery);
  const reviews = obj(raw.testimonials);
  const faq = obj(raw.faq);
  const contact = obj(raw.contact);
  const form = obj(raw.form);
  const topics = obj(form.topics);
  const ask = obj(form.ask);
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

  const topicsOut = Object.fromEntries(Object.keys(FORM_TOPICS).map((k) => [k, bool(topics[k], d.form.topics[k])]));
  if (!Object.values(topicsOut).some(Boolean)) topicsOut.party = true; // the form always asks about something

  return {
    schemaVersion: SCHEMA_VERSION,
    site: {
      name: required(site.name, 80, d.site.name),
      url: httpLink(site.url).replace(/\/+$/, '') || d.site.url,
    },
    languages: {
      en: (() => {
        const l = obj(langs.en);
        const dl = d.languages.en;
        return { enabled: bool(l.enabled, dl.enabled), label: required(l.label, 30, dl.label), short: required(l.short, 6, dl.short) };
      })(),
      hr: (() => {
        const l = obj(langs.hr);
        const dl = d.languages.hr;
        return { enabled: bool(l.enabled, dl.enabled), label: required(l.label, 30, dl.label), short: required(l.short, 6, dl.short), flags: hrFlags(l.flags, dl.flags) };
      })(),
      sr: (() => {
        const l = obj(langs.sr);
        const dl = d.languages.sr;
        return { enabled: bool(l.enabled, dl.enabled), label: required(l.label, 30, dl.label), short: required(l.short, 6, dl.short) };
      })(),
    },
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
      badge: i18nLine(hero.badge, 60, d.hero.badge),
      title: i18nRequired(hero.title, 140, d.hero.title),
      text: i18nText(hero.text, 500, d.hero.text),
      primary: button(hero.primary, d.hero.primary),
      secondary: button(hero.secondary, d.hero.secondary),
      showPhone: bool(hero.showPhone, d.hero.showPhone),
      plan: list(hero.plan, LIMITS.plan, d.hero.plan).map((r) => ({ text: i18nLine(obj(r).text, 40, EMPTY()) })),
      photo: image(heroPhoto ? heroPhoto.src : hero.photo === undefined ? d.hero.photo : hero.photo),
      photoAlt: i18nLine(heroPhoto ? (heroPhoto.alt ?? '') : hero.photoAlt, 200, d.hero.photoAlt),
      hostName: line(hero.hostName, 40, d.hero.hostName).trim(),
      hostRole: i18nLine(hero.hostRole, 60, d.hero.hostRole),
    },
    sections: sections(raw.sections),
    services: {
      showInquiry: bool(services.showInquiry, d.services.showInquiry),
      items: list(services.items, LIMITS.services, d.services.items).map((r) => {
        const s = obj(r);
        return { icon: icon(s.icon), image: image(s.image), title: i18nLine(s.title, 80, EMPTY()), text: i18nText(s.text, 600, EMPTY()) };
      }),
    },
    steps: {
      items: list(steps.items, LIMITS.steps, d.steps.items).map((r) => {
        const s = obj(r);
        return { icon: icon(s.icon), time: line(s.time, 12, '').trim(), title: i18nLine(s.title, 80, EMPTY()), text: i18nText(s.text, 300, EMPTY()) };
      }),
    },
    packages: {
      buttonLabel: i18nLine(packages.buttonLabel, 40, d.packages.buttonLabel),
      note: i18nText(packages.note, 500, d.packages.note),
      items: list(packages.items, LIMITS.packages, d.packages.items).map((r) => {
        const p = obj(r);
        return {
          name: i18nLine(p.name, 60, EMPTY()),
          price: i18nLine(p.price, 40, EMPTY()),
          duration: i18nLine(p.duration, 60, EMPTY()),
          features: i18nText(p.features, 800, EMPTY()),
          highlight: bool(p.highlight, false),
          badge: i18nLine(p.badge, 40, EMPTY()),
          button: i18nLine(p.button, 40, EMPTY()),
        };
      }),
    },
    schedule: {
      photo: image(schedule.photo === undefined ? d.schedule.photo : schedule.photo),
      photoAlt: i18nLine(schedule.photoAlt, 200, d.schedule.photoAlt),
      facts: list(schedule.facts, LIMITS.facts, d.schedule.facts).map(stamp),
      note: i18nText(schedule.note, 500, d.schedule.note),
      stubLabel: i18nLine(schedule.stubLabel, 30, d.schedule.stubLabel),
      buttonLabel: i18nLine(schedule.buttonLabel, 30, d.schedule.buttonLabel),
      items: list(schedule.items, LIMITS.schedule, d.schedule.items).map((r) => {
        const s = obj(r);
        return {
          title: i18nLine(s.title, 60, EMPTY()),
          day: oneOf(s.day, [...DAYS, 'custom'], 'mon'),
          when: i18nLine(s.when, 60, EMPTY()),
          time: line(s.time, 30, ''),
          place: i18nLine(s.place, 120, EMPTY()),
          note: i18nLine(s.note, 160, EMPTY()),
        };
      }),
    },
    events: { buttonLabel: i18nLine(events.buttonLabel, 40, d.events.buttonLabel) },
    about: {
      text: i18nText(about.text, 4000, d.about.text),
      photo: image(about.photo),
      photoAlt: i18nLine(about.photoAlt, 200, EMPTY()),
      badges: list(about.badges, LIMITS.badges, d.about.badges).map(stamp),
      signature: i18nLine(about.signature, 60, d.about.signature),
    },
    gallery: {
      note: i18nLine(gallery.note, 200, d.gallery.note),
      images: list(gallery.images, LIMITS.gallery, d.gallery.images).map((r) => ({ src: image(obj(r).src), alt: i18nLine(obj(r).alt, 200, EMPTY()), caption: i18nLine(obj(r).caption, 40, EMPTY()) })),
    },
    testimonials: {
      showStars: bool(reviews.showStars, d.testimonials.showStars),
      ratingNote: i18nLine(reviews.ratingNote, 100, d.testimonials.ratingNote),
      ratingUrl: httpLink(reviews.ratingUrl),
      items: list(reviews.items, LIMITS.testimonials, d.testimonials.items).map((r) => {
        const x = obj(r);
        return { quote: i18nText(x.quote, 800, EMPTY()), name: line(x.name, 60, ''), detail: i18nLine(x.detail, 80, EMPTY()), rating: num(x.rating, 0, 5, 5) };
      }),
    },
    faq: {
      items: list(faq.items, LIMITS.faq, d.faq.items).map((r) => ({ q: i18nLine(obj(r).q, 200, EMPTY()), a: i18nText(obj(r).a, 2000, EMPTY()) })),
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
      topics: topicsOut,
      ask: Object.fromEntries(Object.keys(FORM_ASK).map((k) => [k, bool(ask[k], d.form.ask[k])])),
      buttonLabel: i18nRequired(form.buttonLabel, 40, d.form.buttonLabel),
      privacyNote: i18nLine(form.privacyNote, 300, d.form.privacyNote),
      successTitle: i18nRequired(form.successTitle, 100, d.form.successTitle),
      successBody: i18nText(form.successBody, 500, d.form.successBody),
    },
    thanks: { title: i18nRequired(thanks.title, 100, d.thanks.title), body: i18nText(thanks.body, 800, d.thanks.body) },
    floating: {
      enabled: bool(float.enabled, d.floating.enabled),
      label: i18nRequired(float.label, 30, d.floating.label),
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
      baseSize: num(theme.baseSize, 15, 21, d.theme.baseSize),
      garland: bool(theme.garland, d.theme.garland),
      confetti: bool(theme.confetti, d.theme.confetti),
      scallops: bool(theme.scallops, d.theme.scallops),
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
      ogImage: image(seo.ogImage === undefined ? d.seo.ogImage : seo.ogImage),
      ogImageAlt: i18nLine(seo.ogImageAlt, 200, d.seo.ogImageAlt),
      indexable: bool(seo.indexable, d.seo.indexable),
      areaServed: line(seo.areaServed, 160, ''),
      priceRange: line(seo.priceRange, 20, ''),
    },
  };
}

// --- helpers for the renderer and the admin ----------------------------------------------

/** Languages shown on the live site, Slovenian first. */
export function enabledLangs(settings) {
  return ['sl', ...OTHER_LANGS.filter((l) => settings.languages[l].enabled)];
}

/** Whether a home page section is switched on. */
export function isVisible(settings, id) {
  return settings.sections.some((s) => s.id === id && s.enabled);
}

/** Booking form topics that are offered: sports classes only while their section is on. */
export function formTopics(settings) {
  const t = settings.form.topics;
  const out = Object.keys(FORM_TOPICS).filter((k) => t[k] && (k !== 'sport' || isVisible(settings, 'schedule')));
  return out.length ? out : ['party'];
}

/** Every question the booking form can ask with these settings (for the privacy policy). */
export function formQuestions(settings) {
  const topics = formTopics(settings);
  const ask = settings.form.ask;
  const party = topics.includes('party');
  const sport = topics.includes('sport');
  const event = topics.includes('event');
  return [
    'name',
    'contact',
    topics.length > 1 ? 'topic' : '',
    party || event ? 'date' : '',
    party || sport ? 'age' : '',
    party || event ? 'kids' : '',
    party && isVisible(settings, 'packages') && settings.packages.items.some((p) => p.name.sl.trim()) ? 'package' : '',
    party && ask.time ? 'time' : '',
    party && ask.where ? 'where' : '',
    (party && ask.town) || event ? 'town' : '',
    sport && settings.schedule.items.length ? 'slot' : '',
    sport ? 'trial' : '',
    event ? 'eventType' : '',
    ask.reply ? 'reply' : '',
    'message',
  ].filter(Boolean);
}

/** Paths of the bundled sample photos that are still in use. */
export function samplePhotosInUse(settings) {
  const s = settings;
  return [
    s.hero.photo,
    s.schedule.photo,
    s.about.photo,
    ...s.gallery.images.map((i) => i.src),
    ...s.services.items.map((i) => i.image),
    s.seo.ogImage,
  ].filter(isSample);
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
  const missing = OTHER_LANGS.filter((l) => s.languages[l].enabled).map((l) => [l, missingTranslations(s, l).length]);
  const untranslated = missing.reduce((sum, [, n]) => sum + n, 0);
  const samples = samplePhotosInUse(s).length;
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
      id: 'samples',
      done: samples === 0,
      title: samples ? `Zamenjajte ${samples} ${samples === 1 ? 'vzorčno fotografijo' : samples === 2 ? 'vzorčni fotografiji' : samples < 5 ? 'vzorčne fotografije' : 'vzorčnih fotografij'}` : 'Vse fotografije so vaše',
      detail: 'Stran ima brezplačne fotografije iz zbirk Pexels in Unsplash, da je videti dokončana. Zamenjajte jih s svojimi (na vrhu, pri športnih uricah, v galeriji in za deljenje), za katere imate soglasje staršev.',
      panel: 'gallery',
    },
    {
      id: 'translations',
      done: untranslated === 0,
      title: untranslated ? `Prevedite še ${untranslated} besedil` : 'Prevodi so popolni',
      detail: missing.map(([l, n]) => `${s.languages[l].label}: ${n ? `manjka ${n}` : 'vse prevedeno'}`).join(' · ') || 'Drugi jeziki so izklopljeni.',
      panel: 'languages',
    },
    {
      id: 'terms',
      done: termsLive(s) && !Object.keys(termsBlanks(s)).length,
      optional: true,
      title: s.terms.enabled ? 'Dopolnite pogoje poslovanja' : 'Objavite pogoje poslovanja (neobvezno)',
      detail: 'Starši pred rezervacijo radi preberejo, kako je z aro, odpovedjo in alergijami. V urejevalniku lahko vstavite osnutek in ga dopolnite.',
      panel: 'legal',
    },
    {
      id: 'portrait',
      done: Boolean(s.about.photo),
      optional: true,
      title: 'Dodajte svojo fotografijo (neobvezno)',
      detail: 'V razdelku O meni je zdaj začetnica imena. Starši radi vidijo, kdo bo vodil zabavo.',
      panel: 'about',
    },
    {
      id: 'socials',
      done: s.socials.some((x) => x.url),
      optional: true,
      title: 'Dodajte družbena omrežja (neobvezno)',
      detail: 'Instagram, Facebook … se prikažejo v nogi strani.',
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

// A starting point for the optional terms page, inserted from the admin on request and never published by
// itself. Words in [square brackets] are decisions only the owner can make; the admin warns until they are gone.
const TERMS_SL = `## Rezervacija

- Termin je rezerviran, ko ga pisno potrdim po e-pošti ali s sporočilom.
- Ob potrditvi plačate aro v višini [znesek] €, ki se upošteva pri končnem plačilu.

## Plačilo

- Preostanek plačate [na dan zabave, z gotovino ali nakazilom].
- Za plačilo prejmete račun.

## Odpoved in sprememba termina

- Če termin odpoveste vsaj [število] dni prej, vam aro vrnem ali jo prenesem na nov termin.
- Ob kasnejši odpovedi ara zapade.
- Če zbolim ali zabave iz drugega nujnega razloga ne morem izvesti, vam takoj sporočim. Dogovorimo se za nov termin ali vam vrnem vse vplačano.

## Med zabavo

- Vodim program, igre in animacijo. Starši oziroma skrbniki ostanejo dosegljivi in so odgovorni za svoje otroke.
- O alergijah, zdravstvenih posebnostih in posebnih potrebah otrok me obvestite vnaprej.
- Za hrano, pijačo in torto poskrbite sami.
- Za igre v zaprtem prostoru potrebujem vsaj [velikost] m² praznega prostora.

## Fotografije

- Fotografiram samo, če se s tem strinjate. Fotografijo objavim samo s pisnim soglasjem staršev vseh otrok na njej.

## Športne urice

- Vpis velja za [mesec ali sezono], plačilo [mesečno vnaprej].
- Urice, ki odpadejo zaradi moje odsotnosti, nadomestim.

## Vprašanja in pritožbe

Pišite mi ali me pokličite. Odgovorim čim prej.`;

const TERMS_EN = `## Booking

- Your date is booked once I confirm it in writing, by email or message.
- When I confirm, you pay a deposit of €[amount], which counts towards the final payment.

## Payment

- You pay the rest [on the day of the party, in cash or by bank transfer].
- You get an invoice for every payment.

## Cancelling or moving a date

- If you cancel at least [number] days ahead, I refund the deposit or move it to a new date.
- If you cancel later, the deposit is not refunded.
- If I fall ill or cannot run the party for another urgent reason, I let you know straight away. We agree on a new date, or I refund everything you paid.

## During the party

- I run the programme, the games and the entertainment. Parents or guardians stay within reach and remain responsible for their children.
- Please tell me in advance about allergies, health conditions and any special needs.
- Food, drinks and the cake are up to you.
- For indoor games I need at least [size] m² of clear space.

## Photos

- I only take photos if you agree. I only publish a photo with written consent from the parents of every child in it.

## Sports classes

- Enrolment is for [a month or a season], paid [monthly in advance].
- Classes cancelled because I am away are made up.

## Questions and complaints

Write to me or call. I reply as soon as I can.`;

const TERMS_HR = `## Rezervacija

- Termin je rezerviran kada ga pisano potvrdim e-poštom ili porukom.
- Prilikom potvrde plaćate kaparu u iznosu od [iznos] €, koja se uračunava u konačno plaćanje.

## Plaćanje

- Ostatak plaćate [na dan zabave, gotovinom ili uplatom na račun].
- Za plaćanje dobivate račun.

## Otkazivanje i promjena termina

- Ako termin otkažete najmanje [broj] dana ranije, kaparu vam vraćam ili je prenosim na novi termin.
- Kod kasnijeg otkazivanja kapara se ne vraća.
- Ako se razbolim ili zabavu iz drugog hitnog razloga ne mogu održati, odmah vam javljam. Dogovaramo novi termin ili vam vraćam sve uplaćeno.

## Tijekom zabave

- Vodim program, igre i animaciju. Roditelji odnosno skrbnici ostaju dostupni i odgovorni su za svoju djecu.
- O alergijama, zdravstvenim posebnostima i posebnim potrebama djece obavijestite me unaprijed.
- Za hranu, piće i tortu pobrinite se sami.
- Za igre u zatvorenom prostoru trebam najmanje [veličina] m² praznog prostora.

## Fotografije

- Fotografiram samo ako se s tim slažete. Fotografiju objavljujem samo uz pisanu privolu roditelja sve djece na njoj.

## Sportske aktivnosti

- Upis vrijedi za [mjesec ili sezonu], plaćanje [mjesečno unaprijed].
- Termine koji otpadnu zbog moje odsutnosti nadoknađujem.

## Pitanja i pritužbe

Pišite mi ili me nazovite. Odgovaram što prije.`;

const TERMS_SR = `## Rezervacija

- Termin je rezervisan kada ga pismeno potvrdim imejlom ili porukom.
- Prilikom potvrde plaćate kaparu u iznosu od [iznos] €, koja se uračunava u konačnu uplatu.

## Plaćanje

- Ostatak plaćate [na dan proslave, gotovinom ili uplatom na račun].
- Za uplatu dobijate račun.

## Otkazivanje i promena termina

- Ako termin otkažete najmanje [broj] dana ranije, kaparu vam vraćam ili je prenosim na novi termin.
- Kod kasnijeg otkazivanja kapara se ne vraća.
- Ako se razbolim ili iz drugog hitnog razloga ne mogu da održim zabavu, odmah vam javljam. Dogovaramo novi termin ili vam vraćam sve što ste uplatili.

## Tokom zabave

- Vodim program, igre i animaciju. Roditelji odnosno staratelji ostaju dostupni i odgovorni su za svoju decu.
- O alergijama, zdravstvenim posebnostima i posebnim potrebama dece obavestite me unapred.
- Za hranu, piće i tortu pobrinite se sami.
- Za igre u zatvorenom prostoru potrebno mi je najmanje [veličina] m² praznog prostora.

## Fotografije

- Fotografišem samo ako se sa tim slažete. Fotografiju objavljujem samo uz pismeni pristanak roditelja sve dece na njoj.

## Sportske aktivnosti

- Upis važi za [mesec ili sezonu], plaćanje [mesečno unapred].
- Termine koji otpadnu zbog mog odsustva nadoknađujem.

## Pitanja i pritužbe

Pišite mi ili me pozovite. Odgovaram što pre.`;

export const TERMS_DRAFT = { sl: TERMS_SL, en: TERMS_EN, hr: TERMS_HR, sr: TERMS_SR };

/** Placeholders left in a text: "[like this]", but not markdown links "[text](https://…)". */
export const placeholders = (text) => String(text ?? '').match(/\[[^\]\n]+\](?!\()/g) ?? [];

/** The terms page goes live only when it is switched on and has a text; a heading alone is not published. */
export const termsLive = (settings) => settings.terms.enabled && Boolean(String(settings.terms.body.sl ?? '').trim());

/** Placeholders still in the terms, per published language: { sl: ['[znesek]'], en: [...] }. */
export function termsBlanks(settings) {
  return Object.fromEntries(
    enabledLangs(settings)
      .map((l) => [l, [...new Set(placeholders(settings.terms.body[l]))]])
      .filter(([, list]) => list.length)
  );
}
