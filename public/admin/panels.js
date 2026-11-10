// The editor's panels. Each panel returns DOM nodes bound to paths in the settings draft.
// `page` is the preview page a panel switches to when it is opened, `anchor` the home page section it scrolls to.

import { FLAGS, HR_FLAG_CHOICES } from '../assets/lib/flags.mjs';
import { LANG_INFO, pagePath } from '../assets/lib/i18n.mjs';
import { PROVIDERS, resolveProvider } from '../assets/lib/providers.mjs';
import {
  BAR_STYLES,
  DAY_OPTIONS,
  FORM_ASK,
  FORM_TOPICS,
  LIMITS,
  LINK_TARGETS,
  SECTION_LABELS,
  SOCIAL_PLATFORMS,
  TERMS_DRAFT,
  enabledLangs,
  isSample,
  missingTranslations,
  OTHER_LANGS,
  termsBlanks,
  setupChecklist,
  tx as t4,
} from '../assets/lib/settings.mjs';
import {
  COLOR_KEYS,
  DECOR_TOGGLES,
  DEFAULT_TEXT_STYLE,
  FONTS,
  PRESET_GROUPS,
  PRESETS,
  RAINBOW,
  TEXT_CASES,
  TEXT_COLORS,
  TEXT_ROLES,
  TEXT_SHADOWS,
  contrastReport,
} from '../assets/lib/themes.mjs';
import { i18nFields, isEmail, isPhone, safeUrl } from '../assets/lib/util.mjs';
import { MIN_PASSWORD, passwordProblem, suggestPassword } from './access.js';
import { card, code, color, confirmDialog, h, icon, iconPicker, image, link, note, range, repeater, sectionList, segmented, select, steps, text, toggle } from './ui.js';

const httpsOnly = (v) => (safeUrl(v, { allowMailto: false, allowRelative: false }).startsWith('https://') ? '' : 'Vpišite celoten naslov, ki se začne s https://.');
const linkCheck = (v) => (safeUrl(v) ? '' : 'Vpišite celoten naslov (https://…), povezavo mailto: ali pot, kot je /zasebnost/.');
const MARKDOWN_HELP = 'Prazna vrstica = nov odstavek. **krepko**, *ležeče*, »- « na začetku vrstice za seznam, [besedilo](https://…) za povezavo.';

/** A text field in the language chosen in the top bar. */
const tx = (app, path, opts = {}) => text(app, path, { ...opts, i18n: true });

function head(title, description) {
  return h('header', { class: 'panel-head' }, h('h2', {}, title), description ? h('p', {}, description) : null);
}

const sectionIndex = (app, id) => app.get('sections').findIndex((s) => s.id === id);

/** On/off, menu, kicker, heading, intro and menu label of one home page section. */
function sectionHead(app, id, { intro = true, title, introHelp } = {}) {
  const i = sectionIndex(app, id);
  const p = `sections.${i}`;
  const enabled = app.get(`${p}.enabled`);
  return card(
    title ?? 'Razdelek na domači strani',
    null,
    toggle(app, `${p}.enabled`, { label: `Pokaži razdelek »${SECTION_LABELS[id]}«`, rerender: true }),
    enabled
      ? [
          tx(app, `${p}.kicker`, { label: 'Majhen napis nad naslovom (neobvezno)', maxlength: 40, placeholder: 'npr. Program' }),
          h('div', { class: 'grid-2' }, tx(app, `${p}.heading`, { label: 'Naslov razdelka', maxlength: 100 }), tx(app, `${p}.menuLabel`, { label: 'Ime v meniju', maxlength: 30, help: 'Kratko, ena ali dve besedi.' })),
          intro ? tx(app, `${p}.intro`, { label: 'Uvodni stavek pod naslovom (neobvezno)', multiline: true, rows: 2, maxlength: 600, help: introHelp }) : null,
          toggle(app, `${p}.inMenu`, { label: 'Pokaži v meniju na vrhu strani' }),
        ]
      : note('Razdelek je izklopljen, zato ga obiskovalci ne vidijo. Vsebino lahko vseeno pripravite.', 'warn')
  );
}

/** Label, destination and (for "other link") the address of one button. */
function buttonFields(app, p, { title, allowNone = false } = {}) {
  const target = app.get(`${p}.target`);
  return [
    title ? h('h4', { class: 'subhead' }, title) : null,
    h(
      'div',
      { class: 'grid-2' },
      tx(app, `${p}.label`, { label: allowNone ? 'Besedilo (prazno = brez gumba)' : 'Besedilo gumba', maxlength: 40 }),
      select(app, `${p}.target`, { label: 'Kam vodi', options: LINK_TARGETS, rerender: true })
    ),
    target === 'url' ? text(app, `${p}.url`, { label: 'Naslov povezave', type: 'url', mono: true, placeholder: 'https://…', validate: linkCheck }) : null,
    ['phone', 'whatsapp', 'viber'].includes(target) && !app.get('contact.phone') ? note('Gumb se prikaže, ko pod Kontakt vpišete telefonsko številko.', 'warn') : null,
    target === 'email' && !app.get('contact.email') ? note('Gumb se prikaže, ko pod Kontakt vpišete e-pošto.', 'warn') : null,
  ];
}

/** Shortest readable name of a { sl, en, hr, sr } text, for list titles. */
const name = (app, value, fallback = '') => (value?.[app.lang] || value?.sl || fallback).slice(0, 70);

// --- overview -------------------------------------------------------------------------

function overview(app) {
  const s = app.normalized();
  const checklist = setupChecklist(s);
  const left = checklist.filter((c) => !c.done && !c.optional).length;
  const base = app.siteRoot;

  const items = checklist.map((c) =>
    h(
      'li',
      { class: `check-item${c.done ? ' done' : ''}${c.optional ? ' optional' : ''}` },
      h('span', { class: 'check-mark' }, icon(c.done ? 'check' : c.optional ? 'plus' : 'alert')),
      h('div', { class: 'check-text' }, h('strong', {}, c.title), h('span', {}, c.detail)),
      c.done ? null : h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => app.goto(c.panel) }, 'Odpri')
    )
  );

  const protections = [
    'Stroga varnostna politika (Content Security Policy) na vsaki strani: izvaja se samo koda te strani.',
    'Brez piškotkov, analitike in skript tretjih oseb, zato pasica za piškotke ni potrebna.',
    'Pisave in slike se nalagajo s te strani; obisk ne pošilja podatkov drugim strežnikom.',
    'Naložene fotografije se v brskalniku pomanjšajo in očistijo skritih podatkov (npr. GPS lokacije).',
    'Obrazec ima zaščito pred roboti (skrito polje, najkrajši čas izpolnjevanja, omejitev poskusov).',
    'Povpraševanja se ne shranjujejo na tej strani: gredo naravnost na vaš e-naslov.',
    'Samodejna politika zasebnosti v treh jezikih, prilagojena nastavitvam.',
    'Vsaka objava je shranjena v zgodovini; vsako starejšo različico lahko obnovite.',
  ];

  const langs = enabledLangs(s);
  return [
    head(`Pozdravljeni${app.user?.name ? `, ${app.user.name.split(' ')[0]}` : ''}!`, 'Tukaj urejate svojo spletno stran. Spremembe takoj vidite v predogledu, obiskovalci pa jih vidijo šele, ko kliknete Objavi.'),
    h(
      'details',
      { class: 'guide-box', open: true },
      h('summary', {}, 'Kako deluje urejanje?'),
      h(
        'ol',
        {},
        h('li', {}, 'Na levi izberite, kaj želite spremeniti: besedila, storitve, slike, barve …'),
        h('li', {}, 'Spremembe takoj vidite v predogledu (desno, na manjših zaslonih gumb Predogled spodaj desno).'),
        h('li', {}, 'Zgoraj izberite jezik (SL, EN, SH), v katerem pišete. Številka pri jeziku pove, koliko besedil še čaka na prevod.'),
        h('li', {}, 'Klik na besedilo v predogledu odpre njegovo polje. Ctrl+Z razveljavi zadnjo spremembo.'),
        h('li', {}, 'Ko ste zadovoljni, kliknite zlati gumb Objavi zgoraj desno. Stran se na spletu posodobi v približno minuti.')
      )
    ),
    card(
      left ? `Še ${left} ${left === 1 ? 'korak' : left === 2 ? 'koraka' : left < 5 ? 'koraki' : 'korakov'} do končane strani` : 'Osnovna nastavitev je končana',
      left ? 'Ti koraki poskrbijo, da vas starši lahko pokličejo in da je stran v skladu z zakonom.' : 'Kontakt, obrazec in podatki o podjetju so izpolnjeni.',
      h('ul', { class: 'checklist' }, items)
    ),
    note('Besedila, program, paketi in vprašanja so vzorčni, fotografije pa brezplačne iz zbirk Pexels in Unsplash. Preglejte in prilagodite jih svoji ponudbi, preden stran pokažete strankam.', 'info'),
    card(
      'Vaša stran',
      null,
      h(
        'div',
        { class: 'link-grid' },
        ...langs.map((l) => link(`${base}${pagePath('home', l)}`, `Domača stran (${LANG_INFO[l].short})`)),
        link(`${base}${pagePath('privacy', 'sl')}`, 'Politika zasebnosti'),
        link(`https://github.com/${app.repo.owner}/${app.repo.repo}/actions`, 'Zgodovina objav')
      )
    ),
    card('Varnost in zasebnost sta vgrajeni', null, h('ul', { class: 'bullet-list' }, protections.map((p) => h('li', {}, p)))),
  ];
}

// --- languages -------------------------------------------------------------------------

/** A round flag (static SVG strings from flags.mjs, clipped to a circle in admin.css). */
function flagIcon(code) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 512 512');
  svg.setAttribute('class', 'flag-icon');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = FLAGS[code].svg;
  return svg;
}

/** Which flags stand next to Croatian: one to three, in a fixed order. */
function flagPicker(app) {
  const path = 'languages.hr.flags';
  const current = app.get(path) ?? [];
  const choice = (code) =>
    h(
      'label',
      { class: 'flag-choice' },
      h('input', {
        type: 'checkbox',
        checked: current.includes(code),
        onchange: (event) => {
          const next = event.target.checked ? [...current, code] : current.filter((c) => c !== code);
          if (!next.length || next.length > 3) {
            event.target.checked = !event.target.checked;
            return;
          }
          app.set(path, HR_FLAG_CHOICES.filter((c) => next.includes(c)));
          app.rerender();
        },
      }),
      flagIcon(code),
      h('span', {}, FLAGS[code].label)
    );
  return h(
    'div',
    { class: 'field', dataset: { path } },
    h('span', { class: 'field-label' }, 'Zastavice v izbirniku jezika'),
    h('div', { class: 'flag-choices' }, HR_FLAG_CHOICES.map(choice)),
    h('p', { class: 'field-help' }, 'Ena do tri. Več zastavic se prikaže ena čez drugo. Slovenščina ima slovensko, angleščina britansko, srbščina srbsko zastavico.')
  );
}

/** Human name of a settings path, for the list of missing translations. */
function placeOf(app, path) {
  const panel = PANELS.find((p) => p.id === panelForPath(path, app.settings));
  return panel?.label ?? '';
}

function languages(app) {
  const s = app.normalized();
  const total = i18nFields(s).filter(({ value }) => value.sl.trim()).length;
  const progress = OTHER_LANGS.map((lang) => {
    const missing = missingTranslations(s, lang);
    const done = total - missing.length;
    const bar = h('div', { class: 'progress' }, h('span', {}));
    bar.firstChild.style.width = `${Math.round((done / Math.max(total, 1)) * 100)}%`;
    return h(
      'div',
      { class: 'progress-row' },
      h('header', {}, h('span', {}, s.languages[lang].label), h('span', { class: 'muted' }, `${done} / ${total}`)),
      bar,
      missing.length
        ? h(
            'details',
            { class: 'guide' },
            h('summary', {}, `Neprevedeno (${missing.length})`),
            h(
              'ul',
              { class: 'missing-list' },
              missing.map(({ path, value }) =>
                h(
                  'li',
                  {},
                  h(
                    'button',
                    {
                      type: 'button',
                      onclick: () => {
                        app.setLang(lang);
                        app.editField(path);
                      },
                    },
                    h('span', {}, value.sl.replace(/\s+/g, ' ').slice(0, 70)),
                    h('span', { class: 'muted' }, placeOf(app, path))
                  )
                )
              )
            )
          )
        : note('Vse je prevedeno.', 'ok')
    );
  });

  const langCard = (id) =>
    h(
      'div',
      { class: 'menu-row' },
      toggle(app, `languages.${id}.enabled`, { label: `Objavi stran v jeziku: ${LANG_INFO[id].name}`, rerender: true }),
      h(
        'div',
        { class: 'grid-2' },
        text(app, `languages.${id}.label`, { label: 'Ime jezika (v izbirniku)', maxlength: 30 }),
        text(app, `languages.${id}.short`, { label: 'Kratica na gumbu', maxlength: 6, help: id === 'hr' ? 'Npr. HR ali BHS.' : null })
      ),
      id === 'hr' ? flagPicker(app) : null,
      id === 'sr' ? note('Srbska besedila lahko pišete v latinici (npr. »Proverite termin«): na strani se samodejno prikažejo v cirilici. Kar še ni prevedeno v srbščino, se pokaže hrvaško besedilo v cirilici.', 'info') : null,
      h('p', { class: 'field-help' }, `Naslov: ${app.siteRoot}${pagePath('home', id)}`)
    );

  return [
    head('Jeziki in prevodi', 'Stran je v slovenščini, z angleško, hrvaško in srbsko (cirilica) različico. Obiskovalci jezik zamenjajo z gumbi v glavi strani.'),
    note('Za prevajanje zgoraj izberite EN, HR ali SR. Pod vsakim poljem vidite slovensko besedilo, ki ga prevajate. Kar ostane neprevedeno, se pokaže v sorodnem jeziku (hrvaško ↔ srbsko) ali v slovenščini.', 'info'),
    card('Jeziki na spletni strani', 'Slovenščina je vedno vklopljena. Druge jezike lahko izklopite, dokler prevodi niso pripravljeni.', h('div', { class: 'menu-rows' }, ...OTHER_LANGS.map(langCard))),
    card('Napredek prevodov', 'Klik na besedilo odpre njegovo polje v izbranem jeziku.', progress),
  ];
}

// --- hero --------------------------------------------------------------------------------

function hero(app) {
  const photo = app.get('hero.photo');
  return [
    head('Vrh strani', 'Prvo, kar obiskovalec vidi. V nekaj sekundah naj izve, kaj ponujate, kdo ste in kako vas dobi. Namig: klik na besedilo v predogledu odpre njegovo polje.'),
    card(
      'Besedilo',
      null,
      tx(app, 'hero.badge', { label: 'Vrstica nad naslovom', maxlength: 60, placeholder: 'npr. Pridem k vam domov ali v najeti prostor', help: 'Kratko, npr. kje delate. Prazno = brez vrstice.' }),
      tx(app, 'hero.title', { label: 'Glavni naslov', maxlength: 140, counter: 60, help: 'Povejte, kaj ponujate in kdo ste. Besedo med zvezdicama, npr. *vzgojiteljico Emo*, izpišemo poševno v glavni barvi.' }),
      tx(app, 'hero.text', { label: 'Stavek pod naslovom', multiline: true, rows: 3, maxlength: 500, help: `Zakaj je z vami staršem lažje. ${MARKDOWN_HELP}` })
    ),
    card(
      'Gumbi',
      'Glavni gumb je poudarjen, drugi obrobljen. Gumb brez besedila se ne prikaže.',
      buttonFields(app, 'hero.primary', { title: 'Glavni gumb', allowNone: true }),
      buttonFields(app, 'hero.secondary', { title: 'Drugi gumb (neobvezno)', allowNone: true }),
      toggle(app, 'hero.showPhone', {
        label: 'Telefonska številka ob gumbu',
        help: app.get('contact.phone') ? 'Na telefonu se ob dotiku začne klic.' : 'Prikaže se, ko pod Kontakt vpišete telefonsko številko.',
      })
    ),
    card(
      'Koraki',
      'Kratko, kako pride do zabave, npr. »Pišete mi datum«. Na telefonu so skriti, da je vrh strani krajši.',
      repeater(app, 'hero.plan', {
        max: LIMITS.plan,
        addLabel: 'Dodaj korak',
        empty: 'Ni korakov.',
        itemTitle: (x, i) => `${i + 1}. ${name(app, x.text, 'Nov korak')}`,
        onOpen: () => app.previewAnchor('hero'),
        newItem: () => ({ text: t4('') }),
        fields: (p) => [tx(app, `${p}.text`, { label: 'Besedilo', maxlength: 40, placeholder: 'npr. Praznujete' })],
      })
    ),
    card(
      'Fotografija in vaše ime',
      'Velika fotografija ob besedilu. Na njej je oznaka z vašim imenom in fotografijo iz razdelka O meni (dokler je ni, začetnica imena).',
      image(app, 'hero.photo', {
        label: 'Fotografija',
        help: isSample(photo)
          ? 'To je vzorčna fotografija iz zbirke Pexels. Zamenjajte jo s svojo, najbolje z vami med otroki, za katero imate soglasje staršev.'
          : 'Pokončna je najboljša. Na telefonu je prikazan le vodoraven pas fotografije. Objavite le fotografije otrok, za katere imate soglasje staršev.',
        upload: { maxWidth: 1200, maxHeight: 1400, name: 'vrh-strani' },
      }),
      photo ? tx(app, 'hero.photoAlt', { label: 'Opis slike (za slabovidne in iskalnike)', maxlength: 200, placeholder: 'npr. Otroci plešejo v krogu' }) : null,
      h(
        'div',
        { class: 'grid-2' },
        text(app, 'hero.hostName', { label: 'Ime na oznaki', maxlength: 40, placeholder: 'npr. Ema', help: 'Prazno = brez oznake.' }),
        tx(app, 'hero.hostRole', { label: 'Pod imenom', maxlength: 60, placeholder: 'npr. vzgojiteljica v vrtcu' })
      )
    ),
  ];
}

/** A list of stamps (short lines with an icon), used by the sports classes and "About me". */
function stampList(app, path, { max, empty, placeholder, onOpen }) {
  return repeater(app, path, {
    max,
    addLabel: 'Dodaj značko',
    empty,
    itemTitle: (x) => name(app, x.text, 'Nova značka'),
    onOpen,
    newItem: () => ({ icon: 'check', text: t4('') }),
    fields: (p) => [tx(app, `${p}.text`, { label: 'Besedilo', maxlength: 60, placeholder }), iconPicker(app, `${p}.icon`)],
  });
}

// --- sections, header, announcement ---------------------------------------------------------

function sections(app) {
  return [
    head('Razdelki in meni', 'Vrstni red in vklop razdelkov domače strani, glava strani z menijem ter obvestilo na vrhu.'),
    card(
      'Razdelki domače strani',
      'S puščicami spremenite vrstni red. Prazni razdelki (npr. galerija brez slik) se na spletu samodejno skrijejo.',
      sectionList(app, 'sections', { labels: SECTION_LABELS })
    ),
    card(
      'Glava strani',
      null,
      image(app, 'header.logo', { label: 'Logotip (neobvezno)', help: 'PNG s prozornim ozadjem je najboljši. Brez logotipa je prikazano ime strani.', upload: { maxWidth: 600, maxHeight: 300, format: 'image/png', name: 'logotip' } }),
      app.get('header.logo')
        ? h('div', { class: 'grid-2' }, range(app, 'header.logoHeight', { label: 'Višina logotipa', min: 24, max: 96, unit: ' px' }), toggle(app, 'header.showName', { label: 'Ob logotipu pokaži tudi ime' }))
        : null,
      toggle(app, 'header.sticky', { label: 'Glava ostane vidna ob pomikanju po strani' }),
      toggle(app, 'header.cta.enabled', { label: 'Gumb v glavi (npr. »Rezerviraj termin«)', rerender: true }),
      app.get('header.cta.enabled') ? buttonFields(app, 'header.cta') : null
    ),
    card(
      'Obvestilo na vrhu',
      'Barvni trak nad glavo za novice, npr. proste termine ali akcije.',
      toggle(app, 'announcement.enabled', { label: 'Pokaži obvestilo', rerender: true }),
      app.get('announcement.enabled')
        ? [
            tx(app, 'announcement.text', { label: 'Besedilo', maxlength: 160 }),
            h('div', { class: 'grid-2' }, tx(app, 'announcement.linkLabel', { label: 'Besedilo povezave (neobvezno)', maxlength: 40 }), select(app, 'announcement.target', { label: 'Kam vodi', options: LINK_TARGETS, rerender: true })),
            app.get('announcement.target') === 'url' ? text(app, 'announcement.url', { label: 'Naslov povezave', type: 'url', mono: true, validate: linkCheck }) : null,
            segmented(app, 'announcement.style', { label: 'Barva traku', options: BAR_STYLES }),
          ]
        : null
    ),
  ];
}

// --- content sections ------------------------------------------------------------------------

function program(app) {
  return [
    head('Program zabave', 'Potek zabave kot jedilnik: ura, kaj se dogaja in kratek opis. Na velikem zaslonu se do ure nariše pikčasta črta.'),
    sectionHead(app, 'steps'),
    card(
      'Točke programa',
      'Ure so okvirne, od začetka zabave (0:00, 0:15 …). Brez ure je vrstica brez nje.',
      repeater(app, 'steps.items', {
        max: LIMITS.steps,
        addLabel: 'Dodaj točko',
        itemTitle: (s) => `${s.time ? `${s.time} · ` : ''}${name(app, s.title, 'Nova točka')}`,
        onOpen: () => app.previewAnchor('steps'),
        newItem: () => ({ icon: 'star', time: '', title: t4('Nova točka'), text: t4('') }),
        fields: (p) => [
          h('div', { class: 'grid-2' }, tx(app, `${p}.title`, { label: 'Naslov', maxlength: 80 }), text(app, `${p}.time`, { label: 'Ura', maxlength: 12, placeholder: '0:15' })),
          tx(app, `${p}.text`, { label: 'Kratek opis', maxlength: 300 }),
          iconPicker(app, `${p}.icon`),
        ],
      })
    ),
  ];
}

function services(app) {
  return [
    head('Ponudba (dodatno)', 'Dodaten razdelek s karticami storitev, npr. poslikava obraza ali delavnice. Privzeto je izklopljen, ker ima stran za glavne storitve svoje razdelke.'),
    sectionHead(app, 'services'),
    card(
      'Storitve',
      'Odprite storitev za urejanje. Če dodate sliko, ta zamenja ikono.',
      toggle(app, 'services.showInquiry', { label: 'Pod vsako storitvijo povezava »Povprašajte«', help: 'Odpre obrazec za povpraševanje.' }),
      repeater(app, 'services.items', {
        max: LIMITS.services,
        addLabel: 'Dodaj storitev',
        empty: 'Ni še storitev.',
        itemTitle: (s) => name(app, s.title, 'Nova storitev'),
        onOpen: () => app.previewAnchor('services'),
        newItem: () => ({ icon: 'star', image: '', title: t4('Nova storitev'), text: t4('') }),
        fields: (p) => [
          tx(app, `${p}.title`, { label: 'Naslov', maxlength: 80 }),
          tx(app, `${p}.text`, { label: 'Kratek opis', multiline: true, rows: 3, maxlength: 600 }),
          iconPicker(app, `${p}.icon`),
          image(app, `${p}.image`, { label: 'Slika namesto ikone (neobvezno)', upload: { maxWidth: 900, maxHeight: 700, name: 'storitev' } }),
        ],
      })
    ),
  ];
}

function packages(app) {
  return [
    head('Paketi', 'Paketi kot kartice za mizo: ime, za koga in koliko časa, cena in kaj vključujejo. Gumb odpre obrazec z že izbranim paketom.'),
    sectionHead(app, 'packages'),
    card(
      'Paketi',
      'Brez vpisane cene piše »Cena po dogovoru«. Poudarjen paket ima polni gumb. Najlepše sta dva paketa, lahko pa jih je do štiri.',
      repeater(app, 'packages.items', {
        max: LIMITS.packages,
        addLabel: 'Dodaj paket',
        itemTitle: (p) => `${name(app, p.name, 'Nov paket')}${p.price?.sl ? ` · ${p.price.sl}` : ''}${p.highlight ? ' ★' : ''}`,
        onOpen: () => app.previewAnchor('packages'),
        newItem: () => ({ name: t4('Nov paket'), price: t4(''), duration: t4(''), features: t4(''), highlight: false, badge: t4(''), button: t4('') }),
        fields: (p) => [
          tx(app, `${p}.name`, { label: 'Ime paketa', maxlength: 60 }),
          h('div', { class: 'grid-2' }, tx(app, `${p}.duration`, { label: 'Za koga in koliko časa', maxlength: 60, placeholder: 'npr. do 10 otrok · 1,5 ure' }), tx(app, `${p}.price`, { label: 'Cena', maxlength: 40, placeholder: 'npr. od 150 €', help: '»od« na začetku je izpisan manjše.' })),
          tx(app, `${p}.features`, { label: 'Kaj vključuje', multiline: true, rows: 5, maxlength: 800, help: 'Vsaka vrstica je ena točka s kljukico.' }),
          tx(app, `${p}.button`, { label: 'Besedilo gumba (neobvezno)', maxlength: 40, placeholder: 'npr. Izberite mali paket', help: 'Prazno = skupno besedilo spodaj.' }),
          toggle(app, `${p}.highlight`, { label: 'Poudari ta paket', rerender: true }),
          app.get(`${p}.highlight`) ? tx(app, `${p}.badge`, { label: 'Trak na poudarjenem paketu (neobvezno)', maxlength: 40, placeholder: 'npr. Najbolj priljubljen' }) : null,
        ],
      }),
      tx(app, 'packages.buttonLabel', { label: 'Skupno besedilo gumbov', maxlength: 40 }),
      tx(app, 'packages.note', { label: 'Značke pod paketi (neobvezno)', multiline: true, rows: 3, maxlength: 500, placeholder: '**Vi pripravite:** prostor, torto in pijačo', help: 'Vsaka vrstica je ena značka. **Krepko** za poudarek.' })
    ),
  ];
}

function schedule(app) {
  const items = app.get('schedule.items') ?? [];
  return [
    head('Športne urice in dogodki', 'Športne urice so vstopnica: besedilo in značke levo, termini na odtrgljivem delu desno. Pod njimi je pas »Animacija na dogodkih«.'),
    sectionHead(app, 'schedule'),
    card(
      'Fotografija',
      null,
      image(app, 'schedule.photo', { label: 'Fotografija ob vstopnici (neobvezno)', help: isSample(app.get('schedule.photo')) ? 'To je vzorčna fotografija. Zamenjajte jo s svojo s športnih uric.' : 'Pokončna je najboljša.', upload: { maxWidth: 1000, maxHeight: 1250, name: 'sportne-urice' } }),
      app.get('schedule.photo') ? tx(app, 'schedule.photoAlt', { label: 'Opis slike', maxlength: 200 }) : null
    ),
    card('Značke', 'Kratka dejstva z ikono, npr. starost, kraj, cena ali sezona. Vpišite le, kar drži.', stampList(app, 'schedule.facts', { max: LIMITS.facts, empty: 'Ni značk.', placeholder: 'npr. 4–6 let, do 10 otrok', onOpen: () => app.previewAnchor('schedule') })),
    card(
      'Termini na vstopnici',
      items.length ? 'Termini so tudi izbira v obrazcu za prijavo.' : 'Brez terminov na vstopnici piše »Po dogovoru«.',
      h('div', { class: 'grid-2' }, tx(app, 'schedule.stubLabel', { label: 'Napis nad termini', maxlength: 30 }), tx(app, 'schedule.buttonLabel', { label: 'Gumb na vstopnici', maxlength: 30, help: 'Odpre obrazec s temo Športne urice.' })),
      repeater(app, 'schedule.items', {
        max: LIMITS.schedule,
        addLabel: 'Dodaj termin',
        empty: 'Ni terminov.',
        itemTitle: (s) => `${s.day === 'custom' ? s.when?.sl || '…' : DAY_OPTIONS[s.day]} ${s.time}${s.title?.sl ? ` · ${name(app, s.title)}` : ''}`,
        onOpen: () => app.previewAnchor('schedule'),
        newItem: () => ({ title: t4(''), day: 'tue', when: t4(''), time: '17.00', place: t4(''), note: t4('') }),
        fields: (p) => [
          h('div', { class: 'grid-2' }, select(app, `${p}.day`, { label: 'Dan', options: DAY_OPTIONS, rerender: true }), text(app, `${p}.time`, { label: 'Ura', maxlength: 30, placeholder: '17.00' })),
          app.get(`${p}.day`) === 'custom' ? tx(app, `${p}.when`, { label: 'Kdaj', maxlength: 60, placeholder: 'npr. Vsako drugo soboto' }) : null,
          tx(app, `${p}.title`, { label: 'Skupina (neobvezno)', maxlength: 60, placeholder: 'npr. 4–6 let' }),
          tx(app, `${p}.place`, { label: 'Kraj (neobvezno)', maxlength: 120, placeholder: 'npr. Telovadnica OŠ …' }),
          tx(app, `${p}.note`, { label: 'Opomba (neobvezno)', maxlength: 160 }),
        ],
      }),
      tx(app, 'schedule.note', { label: 'Opomba pod značkami (neobvezno)', multiline: true, rows: 2, maxlength: 500, placeholder: 'npr. Prva urica je poskusna.', help: MARKDOWN_HELP })
    ),
    sectionHead(app, 'events', { title: 'Pas »Animacija na dogodkih«' }),
    card('Gumb v pasu', null, tx(app, 'events.buttonLabel', { label: 'Besedilo gumba', maxlength: 40, help: 'Odpre obrazec s temo »Drug dogodek«.' })),
  ];
}

function about(app) {
  return [
    head('O meni', 'Predstavitev s fotografijo, kratkim besedilom, značkami in podpisom v ročni pisavi.'),
    sectionHead(app, 'about', { intro: false }),
    card(
      'Besedilo',
      null,
      tx(app, 'about.text', { label: 'Predstavitev', multiline: true, rows: 7, maxlength: 4000, help: MARKDOWN_HELP }),
      tx(app, 'about.signature', { label: 'Podpis v ročni pisavi', maxlength: 60, placeholder: 'npr. Se vidimo na zabavi! Ema' })
    ),
    card(
      'Fotografija',
      'Brez fotografije je na njenem mestu začetnica imena strani.',
      image(app, 'about.photo', { label: 'Vaša fotografija (neobvezno)', help: 'Pokončna je najboljša (4 : 5).', upload: { maxWidth: 1000, maxHeight: 1250, name: 'o-meni' } }),
      app.get('about.photo') ? tx(app, 'about.photoAlt', { label: 'Opis slike', maxlength: 200, placeholder: 'npr. Ema z žogo v telovadnici' }) : null
    ),
    card('Značke', 'Do šest kratkih poudarkov z ikono, npr. »8 let v vrtcu« ali »Tečaj prve pomoči«. Vpišite le resnične podatke.', stampList(app, 'about.badges', { max: LIMITS.badges, empty: 'Ni značk.', placeholder: 'npr. Tečaj prve pomoči', onOpen: () => app.previewAnchor('about') })),
  ];
}

function gallery(app) {
  const files = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif', multiple: true, class: 'visually-hidden', id: 'gallery-files' });
  const status = h('span', { class: 'image-status' });
  const images = app.get('gallery.images') ?? [];
  const samples = images.filter((i) => isSample(i.src)).length;
  files.addEventListener('change', async () => {
    const chosen = [...(files.files ?? [])];
    files.value = '';
    if (!chosen.length) return;
    const room = LIMITS.gallery - app.get('gallery.images').length;
    const list = [...app.get('gallery.images')];
    let n = 0;
    for (const file of chosen.slice(0, room)) {
      status.textContent = `Obdelujem ${++n} od ${Math.min(chosen.length, room)} …`;
      try {
        list.push({ src: await app.upload(file, { maxWidth: 1800, maxHeight: 1800, name: 'galerija' }), alt: t4(''), caption: t4('') });
      } catch (error) {
        status.textContent = error.message;
      }
    }
    app.set('gallery.images', list);
    app.rerender();
  });
  return [
    head('Utrinki (galerija)', 'Fotografije kot polaroidke na steni, s pripisom v ročni pisavi. Na spletu se odprejo v velikem pogledu.'),
    samples
      ? note(`${samples === 1 ? 'Ena fotografija je vzorčna' : `${samples} fotografije so vzorčne`} (brezplačne iz zbirk Pexels in Unsplash). Niso z vaših zabav, zato jih zamenjajte s svojimi, preden stran pokažete strankam.`, 'warn')
      : note('Objavite samo fotografije, za katere imate soglasje staršev. Če kdo soglasje prekliče, sliko odstranite in objavite.', 'warn'),
    sectionHead(app, 'gallery'),
    card(
      'Slike',
      'Slike se pred nalaganjem pomanjšajo in očistijo skritih podatkov (npr. GPS lokacije). Najlepše so kvadratne.',
      h('div', { class: 'button-row' }, h('label', { class: 'btn btn-ghost', for: 'gallery-files' }, icon('upload'), 'Dodaj več slik naenkrat'), files, status),
      repeater(app, 'gallery.images', {
        max: LIMITS.gallery,
        addLabel: 'Dodaj eno sliko',
        empty: 'Galerija je prazna, zato se na spletu ne prikaže.',
        itemTitle: (x, i) => `${name(app, x.caption, '') || name(app, x.alt, `Slika ${i + 1}`)}${isSample(x.src) ? ' · vzorčna' : ''}`,
        onOpen: () => app.previewAnchor('gallery'),
        newItem: () => ({ src: '', alt: t4(''), caption: t4('') }),
        fields: (p) => [
          image(app, `${p}.src`, { label: 'Slika', upload: { maxWidth: 1800, maxHeight: 1800, name: 'galerija' } }),
          tx(app, `${p}.caption`, { label: 'Pripis v ročni pisavi (neobvezno)', maxlength: 40, placeholder: 'npr. Torta!' }),
          tx(app, `${p}.alt`, { label: 'Opis slike', maxlength: 200, placeholder: 'npr. Poslikava obraza: metulj' }),
        ],
      }),
      tx(app, 'gallery.note', { label: 'Opomba pod galerijo', maxlength: 200 })
    ),
  ];
}

function reviews(app) {
  return [
    head('Mnenja staršev', 'Mnenja kot zahvalne kartice. Razdelek se prikaže, ko dodate prvo mnenje.'),
    note('Objavite samo resnična mnenja, za katera imate dovoljenje avtorja. Izmišljena ali prirejena mnenja so po zakonu prepovedana.', 'warn'),
    sectionHead(app, 'testimonials', { intro: false }),
    card(
      'Ocena (neobvezno)',
      'Npr. povprečna ocena na Googlu. Prikaže se pod naslovom mnenj in v obrazcu za rezervacijo.',
      tx(app, 'testimonials.ratingNote', { label: 'Besedilo ocene', maxlength: 100, placeholder: 'npr. Ocena na Googlu 4,9 od 5 (23 mnenj)' }),
      text(app, 'testimonials.ratingUrl', { label: 'Povezava do mnenj (neobvezno)', type: 'url', mono: true, placeholder: 'https://…', validate: httpsOnly })
    ),
    card(
      'Mnenja',
      null,
      toggle(app, 'testimonials.showStars', { label: 'Pokaži zvezdice pod mnenji' }),
      repeater(app, 'testimonials.items', {
        max: LIMITS.testimonials,
        addLabel: 'Dodaj mnenje',
        empty: 'Ni še mnenj.',
        itemTitle: (x) => [x.name, name(app, x.quote).slice(0, 40)].filter(Boolean).join(' · ') || 'Novo mnenje',
        onOpen: () => app.previewAnchor('testimonials'),
        newItem: () => ({ quote: t4(''), name: '', detail: t4(''), rating: 5 }),
        fields: (p) => [
          tx(app, `${p}.quote`, { label: 'Mnenje', multiline: true, rows: 4, maxlength: 800 }),
          h('div', { class: 'grid-2' }, text(app, `${p}.name`, { label: 'Ime', maxlength: 60, placeholder: 'npr. Maja' }), tx(app, `${p}.detail`, { label: 'Pripis (neobvezno)', maxlength: 80, placeholder: 'npr. mama 6-letne Zale' })),
          app.get('testimonials.showStars') ? range(app, `${p}.rating`, { label: 'Zvezdice', min: 0, max: 5, format: (v) => (v ? '★'.repeat(v) : 'brez') }) : null,
        ],
      })
    ),
  ];
}

function faq(app) {
  return [
    head('Pogosta vprašanja', 'Kratki odgovori na vprašanja, ki jih starši najpogosteje zastavijo. Prihranijo vam klice.'),
    sectionHead(app, 'faq', { introHelp: 'Kjer napišete {phone}, bo vaša telefonska številka kot povezava za klic. Dokler številke ni, se stavek ne prikaže.' }),
    card(
      'Vprašanja',
      null,
      repeater(app, 'faq.items', {
        max: LIMITS.faq,
        addLabel: 'Dodaj vprašanje',
        itemTitle: (x) => name(app, x.q, 'Novo vprašanje'),
        onOpen: () => app.previewAnchor('faq'),
        newItem: () => ({ q: t4('Novo vprašanje?'), a: t4('') }),
        fields: (p) => [tx(app, `${p}.q`, { label: 'Vprašanje', maxlength: 200 }), tx(app, `${p}.a`, { label: 'Odgovor', multiline: true, rows: 4, maxlength: 2000, help: MARKDOWN_HELP })],
      })
    ),
  ];
}

// --- contact & form ------------------------------------------------------------------------

function contact(app) {
  const phone = app.get('contact.phone');
  return [
    head('Kontakt', 'Telefon, Viber, WhatsApp in e-pošta. Prikažejo se na kartici za rezervacijo, v nogi strani in na gumbih.'),
    sectionHead(app, 'contact'),
    card(
      'Kontaktni podatki',
      null,
      text(app, 'contact.phone', { label: 'Telefon', type: 'tel', maxlength: 30, placeholder: '041 123 456', validate: (v) => (isPhone(v) ? '' : 'Vpišite telefonsko številko, npr. 041 123 456 ali +386 41 123 456.'), rerender: true }),
      phone
        ? h('div', { class: 'grid-2' }, toggle(app, 'contact.whatsapp', { label: 'Na tej številki sem dosegljiva na WhatsAppu' }), toggle(app, 'contact.viber', { label: 'Na tej številki sem dosegljiva na Vibru' }))
        : null,
      text(app, 'contact.email', { label: 'E-pošta', type: 'email', maxlength: 254, placeholder: 'ime@primer.si', validate: (v) => (isEmail(v) ? '' : 'Vpišite veljaven e-poštni naslov.'), rerender: true, help: 'Javno vidna. Nanjo prihajajo tudi povpraševanja.' }),
      tx(app, 'contact.area', { label: 'Kje delujete (neobvezno)', maxlength: 160, placeholder: 'npr. Ljubljana z okolico in Gorenjska' }),
      tx(app, 'contact.hours', { label: 'Kdaj ste dosegljivi (neobvezno)', multiline: true, rows: 2, maxlength: 300, placeholder: 'npr. Pon–pet 9.00–19.00' }),
      text(app, 'contact.address', { label: 'Naslov (neobvezno)', multiline: true, rows: 2, maxlength: 200, help: 'Le če imate prostor, kamor lahko pridejo stranke. Prikaže se v nogi strani.' }),
      text(app, 'contact.mapUrl', { label: 'Povezava do zemljevida (neobvezno)', type: 'url', mono: true, placeholder: 'https://maps.app.goo.gl/…', validate: httpsOnly })
    ),
    card(
      'Hitri gumbi na telefonu',
      'Pas na dnu zaslona telefona s klicem, Vibrom in gumbom za rezervacijo. Pokaže se, ko obiskovalec podrsa mimo vabila.',
      toggle(app, 'floating.enabled', { label: 'Pokaži hitre gumbe na telefonih', rerender: true }),
      app.get('floating.enabled') ? tx(app, 'floating.label', { label: 'Besedilo glavnega gumba', maxlength: 30 }) : null,
      app.get('floating.enabled') && !phone ? note('Gumba za klic in Viber se prikažeta, ko vpišete telefonsko številko.', 'info') : null
    ),
  ];
}

const PROVIDER_GUIDES = {
  mailto: (app) => [
    'Ko obiskovalec pritisne Pošlji, se mu odpre e-poštni program (Gmail, Outlook, Pošta na telefonu …) s pripravljenim sporočilom na vaš naslov. Nobena registracija ni potrebna.',
    'Slabost: sporočilo mora obiskovalec poslati sam, na računalnikih brez nastavljene e-pošte pa ne deluje. Za zanesljivejše prejemanje izberite Formspree.',
    app.get('contact.email') ? `Povpraševanja bodo prišla na ${app.get('contact.email')}.` : 'Najprej pod Kontakt vpišite svojo e-pošto.',
  ],
  formspree: (app) => [
    h('span', {}, 'Ustvarite brezplačen račun na ', link('https://formspree.io', 'formspree.io'), ' z e-naslovom, na katerega želite prejemati povpraševanja.'),
    h('span', {}, 'Kliknite ', h('strong', {}, '+ New Form'), ' in ga poimenujte, npr. »Spletna stran«.'),
    h('span', {}, 'Skopirajte naslov obrazca (', code('https://formspree.io/f/…'), ') in ga prilepite spodaj.'),
    'Objavite, nato pošljite poskusno povpraševanje. Prvo sporočilo morate potrditi v e-pošti, ki jo pošlje Formspree.',
    'Če Formspree sporočil ne sprejme, v nastavitvah obrazca izklopite reCAPTCHA. Stran ne nalaga Googlovih skript in ima lastno zaščito pred roboti.',
    h('span', {}, 'Zaščita pred neželeno pošto: v nastavitvah projekta na Formspree vklopite ', h('strong', {}, 'Restrict to Domain'), ' in vpišite ', code(new URL(app.normalized().site.url).hostname), ' (po selitvi na lastno domeno vpišite njo). Sporočila, ki niso poslana s te strani, potem končajo med neželeno pošto.'),
    'Brezplačni paket ima mesečno omejitev števila sporočil; trenutno omejitev preverite na formspree.io.',
  ],
  custom: () => [
    h('span', {}, 'Web3Forms: naslov ', code('https://api.web3forms.com/submit'), ', dodatno skrito polje ', code('access_key'), ' z vašim ključem, način »Stran ostane odprta«.'),
    'Lasten strežnik (po selitvi na gostovanje): naslov skripte, ki sprejme obrazec in pošlje e-pošto. Če skripta po pošiljanju preusmeri, izberite drugi način in jo preusmerite na stran za zahvalo (naslov je spodaj).',
  ],
};

function form(app) {
  const s = app.normalized();
  const id = app.get('form.provider');
  const provider = resolveProvider(s.form, s.contact.email);
  const def = PROVIDERS[id] ?? PROVIDERS.none;
  const options = Object.fromEntries(Object.entries(PROVIDERS).map(([key, p]) => [key, p.label]));
  const scheduleOn = s.sections.some((x) => x.id === 'schedule' && x.enabled);
  const topicCount = Object.keys(FORM_TOPICS).filter((k) => app.get(`form.topics.${k}`)).length;

  return [
    head('Obrazec za povpraševanje', 'Kartica »Prosim za odgovor« na dnu strani. Starši izberejo, kaj jih zanima, in vidijo samo vprašanja za to temo.'),
    card(
      'Kam pridejo povpraševanja',
      null,
      select(app, 'form.provider', { label: 'Način pošiljanja', options, rerender: true }),
      ...def.fields.map((f) =>
        text(app, `form.${id}.${f.key}`, {
          label: f.label,
          help: f.help,
          placeholder: f.placeholder,
          mono: true,
          validate: (v) => (f.pattern.test(v) || (id === 'formspree' && /formspree\.io\/f\/[A-Za-z0-9]+/.test(v)) ? '' : 'To ni videti prav. Preverite vrednost pri ponudniku.'),
          rerender: true,
        })
      ),
      id === 'custom' ? segmented(app, 'form.custom.mode', { label: 'Kaj se zgodi po pošiljanju', options: PROVIDERS.custom.modes }) : null,
      id === 'none'
        ? note('Obrazec je izklopljen. Na kartici za rezervacijo so samo telefon, Viber, WhatsApp in e-pošta.', 'info')
        : provider.ready
          ? note(`Pripravljeno. ${id === 'mailto' ? 'Obrazec odpre e-poštni program obiskovalca.' : `Povpraševanja pošilja ${provider.name}.`} Objavite in pošljite poskusno povpraševanje.`, 'ok')
          : note(`Še manjka: ${provider.missing.join(', ')}. Do takrat je namesto obrazca obvestilo.`, 'warn'),
      PROVIDER_GUIDES[id] ? h('details', { class: 'guide', open: !provider.ready }, h('summary', {}, 'Navodila'), steps(PROVIDER_GUIDES[id](app))) : null
    ),
    card(
      'Vprašanja v obrazcu',
      'Ime ter telefon ali e-pošta so vedno obvezni. Za otroke obrazec sprašuje le starost in število, nikoli imen.',
      h('h4', { class: 'subhead' }, 'Teme (Kaj vas zanima?)'),
      ...Object.entries(FORM_TOPICS).map(([key, label]) =>
        toggle(app, `form.topics.${key}`, {
          label,
          rerender: true,
          help: key === 'sport' && !scheduleOn ? 'Prikaže se, ko vklopite razdelek Športne urice.' : key === 'party' ? 'Datum, starost slavljenca, število otrok in paket.' : key === 'event' ? 'Vrsta dogodka, datum, število otrok in kraj.' : 'Starost otroka, termin in želja po poskusni urici.',
        })
      ),
      topicCount === 1 ? note('Z eno samo temo izbira teme odpade in obrazec takoj pokaže njena vprašanja.', 'info') : null,
      h('h4', { class: 'subhead' }, 'Neobvezna vprašanja'),
      ...Object.entries(FORM_ASK).map(([key, label]) => toggle(app, `form.ask.${key}`, { label }))
    ),
    card(
      'Besedila obrazca',
      null,
      tx(app, 'form.buttonLabel', { label: 'Gumb za pošiljanje', maxlength: 40 }),
      tx(app, 'form.privacyNote', {
        label: 'Opomba o zasebnosti pod obrazcem',
        maxlength: 300,
        help: 'Kjer napišete {privacy}, bo povezava na politiko zasebnosti.',
        validate: (v) => (!v || v.includes('{privacy}') ? '' : 'Namig: dodajte {privacy}, da lahko obiskovalec prebere politiko.'),
      }),
      h(
        'div',
        { class: 'button-row' },
        h('button', { type: 'button', class: 'btn btn-ghost btn-sm', 'aria-pressed': String(app.previewSuccess), onclick: () => app.setPreviewSuccess(!app.previewSuccess) }, icon('eye'), app.previewSuccess ? 'Skrij zahvalo v predogledu' : 'Pokaži zahvalo v predogledu')
      ),
      tx(app, 'form.successTitle', { label: 'Zahvala po pošiljanju: naslov', maxlength: 100 }),
      tx(app, 'form.successBody', { label: 'Zahvala po pošiljanju: besedilo', multiline: true, rows: 2, maxlength: 500 })
    ),
    card(
      'Stran za zahvalo',
      'Samostojna stran, na katero lahko preusmeri storitev za obrazce. Iskalniki je ne prikazujejo.',
      h('p', { class: 'field-help' }, 'Naslov: ', code(`${app.siteRoot}${pagePath('thanks', 'sl')}`)),
      tx(app, 'thanks.title', { label: 'Naslov', maxlength: 100 }),
      tx(app, 'thanks.body', { label: 'Besedilo', multiline: true, rows: 3, maxlength: 800 })
    ),
  ];
}

// --- socials & footer ---------------------------------------------------------------------------

const URL_HINTS = {
  facebook: 'https://facebook.com/…',
  instagram: 'https://instagram.com/…',
  tiktok: 'https://tiktok.com/@…',
  youtube: 'https://youtube.com/@…',
  whatsapp: 'https://wa.me/38641123456',
  messenger: 'https://m.me/…',
  email: 'mailto:ime@primer.si',
};

function socials(app) {
  const list = app.get('socials') ?? [];
  const filled = list.filter((s) => s.url).length;
  return [
    head('Družbena omrežja in noga', 'Povezave na Facebook, Instagram … in vsebina noge strani.'),
    card(
      'Družbena omrežja',
      filled ? `${filled} od ${list.length} ima vpisano povezavo. Povezave brez naslova so na spletu skrite (v predogledu so bledejše).` : 'Vpišite naslove profilov, ki jih uporabljate, ostale odstranite. Povezave brez naslova so na spletu skrite.',
      repeater(app, 'socials', {
        max: LIMITS.socials,
        addLabel: 'Dodaj povezavo',
        empty: 'Ni povezav.',
        itemTitle: (s) => `${SOCIAL_PLATFORMS[s.platform] ?? s.platform}${s.url ? '' : ' · ni še povezave'}`,
        newItem: () => ({ platform: 'instagram', url: '', label: '' }),
        fields: (p) => [
          h('div', { class: 'grid-2' }, select(app, `${p}.platform`, { label: 'Omrežje', options: SOCIAL_PLATFORMS, rerender: true }), text(app, `${p}.label`, { label: 'Ime (neobvezno)', maxlength: 40, placeholder: 'Ime omrežja' })),
          text(app, `${p}.url`, { label: 'Naslov profila', type: 'url', placeholder: URL_HINTS[app.get(`${p}.platform`)] ?? 'https://…', validate: linkCheck, mono: true, rerender: true }),
        ],
      })
    ),
    card(
      'Noga strani',
      'Temen pas na dnu vsake strani.',
      tx(app, 'footer.text', { label: 'Kratek stavek pod imenom', multiline: true, rows: 2, maxlength: 300 }),
      toggle(app, 'footer.showContact', { label: 'Pokaži telefon, e-pošto in območje' }),
      toggle(app, 'footer.showSocials', { label: 'Pokaži družbena omrežja' }),
      toggle(app, 'footer.showBusiness', { label: 'Pokaži podatke o podjetju', help: 'Uredite jih pod Podjetje in zasebnost.' })
    ),
  ];
}

// --- appearance -------------------------------------------------------------------------------

function appearance(app) {
  const theme = app.get('theme');
  // Each card is a tiny top of the page in that scheme: band, bunting, heading font and button.
  const presetCard = (id, preset) => {
    const c = preset.colors;
    const mini = h(
      'span',
      { class: 'preset-mini', 'aria-hidden': 'true' },
      h('span', { class: 'pm-flags' }, RAINBOW.map((k) => h('span', { class: 'pm-flag' }))),
      h('span', { class: 'pm-title', 'data-font': preset.headingFont }, 'Zabava'),
      h('span', { class: 'pm-btn' })
    );
    for (const [name, value] of Object.entries({ '--pm-band': c.alt, '--pm-text': c.text, '--pm-accent': c.accent, '--pm-rule': c.border })) mini.style.setProperty(name, value);
    mini.querySelectorAll('.pm-flag').forEach((flag, i) => (flag.style.background = c[RAINBOW[i]]));
    mini.querySelector('.pm-title').style.fontWeight = FONTS[preset.headingFont].heading.weight;
    const active = theme.preset === id;
    return h(
      'button',
      { type: 'button', class: `preset${active ? ' active' : ''}`, 'aria-pressed': active ? 'true' : 'false', onclick: () => app.applyPreset(id) },
      mini,
      h('span', { class: 'preset-name' }, preset.label),
      h('span', { class: 'preset-note' }, preset.note)
    );
  };
  const presetGroups = Object.entries(PRESET_GROUPS).map(([group, label]) => [
    h('h4', { class: 'subhead' }, label),
    h(
      'div',
      { class: 'presets' },
      Object.entries(PRESETS)
        .filter(([, preset]) => preset.group === group)
        .map(([id, preset]) => presetCard(id, preset))
    ),
  ]);

  const report = h('ul', { class: 'contrast' });
  const updateReport = () => {
    report.replaceChildren(
      ...contrastReport(app.get('theme.colors')).map((c) =>
        h('li', { class: c.pass ? 'pass' : 'fail' }, icon(c.pass ? 'check' : 'alert'), h('span', {}, c.label), h('strong', {}, `${c.ratio.toFixed(1)}:1`), h('span', { class: 'contrast-need' }, c.pass ? 'V redu' : `potrebno ${c.min}:1`))
      )
    );
  };
  updateReport();

  const colorField = ([key, label]) =>
    color(app, `theme.colors.${key}`, {
      label,
      onChange: () => {
        app.set('theme.preset', 'custom');
        updateReport();
      },
    });
  const rainbowKeys = new Set(RAINBOW);

  const fontOptions = Object.fromEntries(Object.entries(FONTS).map(([id, f]) => [id, f.label]));
  const fontSample = (path) => {
    const sample = h('p', { class: 'font-sample' }, 'Čarobna zabava ščuka žirafa 123');
    sample.update = () => (sample.dataset.font = app.get(path));
    sample.update();
    return sample;
  };
  const headingSample = fontSample('theme.headingFont');
  const bodySample = fontSample('theme.bodyFont');

  return [
    head('Barve in oblika', 'Stran je oblikovana kot vabilo. Izberite barvno različico, nato po želji prilagodite barve in pisave.'),
    card(
      'Barvne različice',
      'Različica zamenja barve in pisave, postavitev ostane enaka. Kliknite in poglejte predogled: obiskovalci jo vidijo šele, ko kliknete Objavi. Barve, ki ste jih spremenili sami, se pri tem zamenjajo; vrnete jih z Razveljavi.',
      ...presetGroups.flat()
    ),
    card(
      'Barve',
      'Iz teh barv se samodejno izračunajo svetlejši odtenki (ozadja kartic) in temnejši (besedilo v barvi), da ostane vse berljivo.',
      h('div', { class: 'grid-2' }, COLOR_KEYS.filter(([k]) => !rainbowKeys.has(k)).map(colorField)),
      h('h4', { class: 'subhead' }, 'Mavrica (logotip, zastavice, konfeti, kartice)'),
      h('div', { class: 'grid-2' }, COLOR_KEYS.filter(([k]) => rainbowKeys.has(k)).map(colorField)),
      h('h4', { class: 'subhead' }, 'Berljivost (WCAG AA)'),
      report
    ),
    card(
      'Pisave',
      'Vse pisave so naložene s te strani in imajo vse šumnike (č, š, ž, ć, đ). Pripisi pod fotografijami in podpis so vedno v ročni pisavi Caveat.',
      h(
        'div',
        { class: 'grid-2' },
        h('div', {}, select(app, 'theme.headingFont', { label: 'Naslovi', options: fontOptions, onChange: () => headingSample.update() }), headingSample),
        h('div', {}, select(app, 'theme.bodyFont', { label: 'Besedilo', options: fontOptions, onChange: () => bodySample.update() }), bodySample)
      ),
      range(app, 'theme.baseSize', { label: 'Velikost besedila', min: 15, max: 21, unit: ' px' }),
      h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => app.goto('text') }, icon('type'), 'Pisave po posameznih delih strani')
    ),
    card(
      'Okraski in gibanje',
      null,
      ...Object.entries(DECOR_TOGGLES).map(([key, label]) => toggle(app, `theme.${key}`, { label })),
      toggle(app, 'theme.animations', {
        label: 'Animacije (zastavice, vabilo, kartice, konfeti po pošiljanju)',
        help: 'Obiskovalcem, ki imajo v sistemu vklopljeno zmanjšano gibanje, so vedno izklopljene. V predogledu so izklopljene, da ne motijo med urejanjem; poglejte jih na spletni strani.',
      })
    ),
    card(
      'Ikona v zavihku brskalnika',
      null,
      image(app, 'theme.favicon', { label: 'Ikona (neobvezno)', help: 'Kvadratna slika, vsaj 180 × 180 px. Brez nje je prikazana mavrica v barvah strani.', upload: { maxWidth: 256, maxHeight: 256, format: 'image/png', name: 'ikona' } })
    ),
  ];
}

// --- text styles -------------------------------------------------------------------------------

const BOLD = { weight: 800, shadow: 'none' };

function textStyles(app) {
  const fontOptions = { '': 'Privzeta iz teme', ...Object.fromEntries(Object.entries(FONTS).map(([id, f]) => [id, f.label])) };
  const isDefault = (t) => Object.entries(DEFAULT_TEXT_STYLE).every(([k, v]) => t[k] === v);
  const set = (p, values) => {
    app.set(p, { ...app.get(p), ...values });
    app.rerender();
  };

  const blocks = Object.entries(TEXT_ROLES).map(([id, role]) => {
    const p = `textStyles.${id}`;
    const t = app.get(p);
    const block = h(
      'details',
      { class: 'repeat-item', open: app.isOpen(p) },
      h('summary', { class: 'repeat-summary' }, h('span', { class: 'repeat-title' }, `${role.label}${isDefault(t) ? '' : ' · prilagojeno'}`)),
      h(
        'div',
        { class: 'repeat-body' },
        h('div', { class: 'grid-2' }, select(app, `${p}.font`, { label: 'Pisava', options: fontOptions }), range(app, `${p}.weight`, { label: 'Debelina', min: 0, max: 900, step: 100, format: (v) => (v ? String(v) : 'Privzeta') })),
        h('div', { class: 'grid-2' }, range(app, `${p}.size`, { label: 'Velikost', min: 50, max: 250, step: 5, unit: ' %' }), range(app, `${p}.tracking`, { label: 'Razmik med črkami', min: -10, max: 40, format: (v) => (v ? `${(v / 100).toFixed(2)} em` : 'Privzet') })),
        h('div', { class: 'grid-2' }, select(app, `${p}.case`, { label: 'Črke', options: TEXT_CASES }), select(app, `${p}.color`, { label: 'Barva', options: TEXT_COLORS, rerender: true })),
        t.color === 'custom' ? color(app, `${p}.customColor`, { label: 'Barva po izbiri' }) : null,
        select(app, `${p}.shadow`, { label: 'Senca', options: TEXT_SHADOWS }),
        h(
          'div',
          { class: 'style-actions' },
          h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => set(p, BOLD) }, 'Krepko'),
          h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => set(p, DEFAULT_TEXT_STYLE) }, icon('refresh'), 'Ponastavi')
        )
      )
    );
    block.addEventListener('toggle', () => app.setOpen(p, block.open));
    return block;
  });

  return [head('Pisave po delih strani', 'Natančne nastavitve za posamezne dele strani, poleg pisav iz teme.'), card(null, null, h('div', { class: 'repeater' }, blocks))];
}

// --- business, privacy, SEO -------------------------------------------------------------------------

function legal(app) {
  const body = app.get('terms.body');
  // What is still missing in the terms; refreshed as the owner types, not only when the panel opens.
  const termsWarning = h('div', {});
  const updateTermsWarning = () => {
    const s = app.normalized();
    const blanks = termsBlanks(s);
    const others = Object.keys(blanks)
      .filter((l) => l !== 'sl')
      .map((l) => s.languages[l].label);
    const missing = [blanks.sl?.join(', '), others.length ? `${blanks.sl ? 'tudi ' : ''}v prevodih (${others.join(', ')})` : ''].filter(Boolean).join('; ');
    const text = !s.terms.body.sl.trim()
      ? s.terms.enabled
        ? 'Stran s pogoji je vklopljena, a nima besedila, zato se ne objavi. Vstavite osnutek ali napišite svoje pogoje.'
        : ''
      : missing
        ? `Še za dopolnitev: ${missing}.${s.terms.enabled ? ' Stran s pogoji je vklopljena, zato jih dopolnite pred objavo.' : ' Stran vklopite, ko jih dopolnite.'}`
        : '';
    termsWarning.replaceChildren(...(text ? [note(text, 'warn')] : []));
  };
  updateTermsWarning();
  const insertDraft = h('button', { type: 'button', class: 'btn btn-ghost' }, icon('plus'), 'Vstavi osnutek pogojev');
  insertDraft.addEventListener('click', async () => {
    if (Object.values(body).some((t) => t.trim())) {
      const choice = await confirmDialog({ title: 'Zamenjam besedilo pogojev?', body: 'Vaše trenutno besedilo pogojev se zamenja z osnutkom v vseh jezikih. S Ctrl+Z ga vrnete.', confirm: 'Zamenjaj', danger: true });
      if (choice !== 'ok') return;
    }
    app.set('terms.body', structuredClone(TERMS_DRAFT));
    app.rerender();
  });
  return [
    head('Podjetje in zasebnost', 'Podatki o podjetju, politika zasebnosti in pogoji poslovanja.'),
    card(
      'Podatki o podjetju',
      'Zakon o elektronskem poslovanju na trgu (ZEPT) zahteva, da spletna stran navaja vsaj naziv, naslov in e-pošto ponudnika ter podatke o vpisu v register. Prikažejo se v nogi strani in v politiki zasebnosti.',
      text(app, 'business.name', { label: 'Naziv podjetja', maxlength: 120, placeholder: 'npr. Ema Novak s.p.' }),
      text(app, 'business.address', { label: 'Naslov sedeža', multiline: true, rows: 2, maxlength: 300, placeholder: 'Ulica 1, 1000 Ljubljana' }),
      h('div', { class: 'grid-3' }, text(app, 'business.registration', { label: 'Matična številka', maxlength: 20, mono: true }), text(app, 'business.taxNumber', { label: 'Davčna številka', maxlength: 20, mono: true }), text(app, 'business.vatId', { label: 'ID za DDV (neobvezno)', maxlength: 20, mono: true, placeholder: 'SI…' }))
    ),
    note('Politika zasebnosti je skrbno pripravljena predloga za manjše podjetje z obrazcem za povpraševanje, ni pa pravni nasvet. Če dodate spletno trgovino, oglase ali analitiko, naj jo pregleda strokovnjak.', 'info'),
    card(
      'Politika zasebnosti',
      'Stran se ustvari samodejno v vseh jezikih, iz podatkov o podjetju, kontakta in nastavitev obrazca.',
      h('div', { class: 'grid-2' }, text(app, 'privacy.effectiveDate', { label: 'Velja od', type: 'date' }), text(app, 'privacy.retentionMonths', { label: 'Povpraševanja hranim (mesecev)', type: 'number', help: 'Po tem času jih izbrišete, če ni prišlo do naročila.' })),
      toggle(app, 'privacy.photos', { label: 'Na strani objavljam fotografije z dogodkov', help: 'Doda poglavje o soglasju staršev za fotografije.' }),
      tx(app, 'privacy.hosting', { label: 'Gostovanje strani', maxlength: 160, help: 'Spremenite ob selitvi na drugo gostovanje.' }),
      toggle(app, 'privacy.outsideEu', { label: 'Gostovanje ali storitev za obrazce je izven EU', help: 'GitHub in Formspree sta v ZDA. Izklopite, če se preselite k ponudniku v EU.' }),
      tx(app, 'privacy.extra', { label: 'Dodatno poglavje (neobvezno)', multiline: true, rows: 4, maxlength: 6000, help: MARKDOWN_HELP })
    ),
    card(
      'Pogoji poslovanja',
      'Neobvezna stran, npr. o rezervaciji, ari in odpovedi termina. Povezava je v nogi strani.',
      note('Osnutek pokriva rezervacijo, aro, odpoved, alergije, fotografije in športne urice. Besedilo v oglatih oklepajih [ ] zamenjajte s svojimi podatki, vrstice, ki za vas ne veljajo, pa izbrišite. Osnutek ni pravni nasvet.', 'info'),
      h('div', { class: 'button-row' }, insertDraft),
      termsWarning,
      toggle(app, 'terms.enabled', { label: 'Objavi stran s pogoji', rerender: true }),
      tx(app, 'terms.title', { label: 'Naslov strani', maxlength: 80 }),
      tx(app, 'terms.body', { label: 'Besedilo', multiline: true, rows: 10, maxlength: 12000, help: `${MARKDOWN_HELP} »## « na začetku vrstice za podnaslov.`, onInput: updateTermsWarning })
    ),
  ];
}

function seo(app) {
  return [
    head('SEO in deljenje', 'Kako je stran videti v Googlu in ko jo kdo deli na Facebooku, Vibru ali WhatsAppu.'),
    card(
      'Iskalniki',
      null,
      toggle(app, 'seo.indexable', {
        label: 'Pokaži stran iskalnikom (Google, Bing …)',
        help: 'Vklopite, ko so besedila končana. Dokler je izklopljeno, stran deluje, a se ne pojavi v iskanju.',
      }),
      text(app, 'site.name', { label: 'Ime strani', maxlength: 80, help: 'V glavi strani, v nogi in v zavihku brskalnika.' }),
      tx(app, 'seo.title', { label: 'Naslov v Googlu', maxlength: 120, counter: 60 }),
      tx(app, 'seo.description', { label: 'Opis v Googlu', multiline: true, rows: 2, maxlength: 300, counter: 160 })
    ),
    card(
      'Deljenje povezave',
      'Slika, ki se pokaže, ko kdo pošlje povezavo do strani.',
      image(app, 'seo.ogImage', { label: 'Slika za deljenje', help: '1200 × 630 px.', upload: { maxWidth: 1200, maxHeight: 630, format: 'image/jpeg', name: 'deljenje' } }),
      app.get('seo.ogImage') ? tx(app, 'seo.ogImageAlt', { label: 'Opis slike', maxlength: 200 }) : null
    ),
    card(
      'Lokalno iskanje',
      'Podatki za Google o vašem podjetju (schema.org). Pomagajo pri iskanju, kot je »otroške zabave Ljubljana«.',
      text(app, 'seo.areaServed', { label: 'Območje delovanja', maxlength: 160, placeholder: 'npr. Ljubljana, Kranj, Domžale' }),
      text(app, 'seo.priceRange', { label: 'Cenovni razred (neobvezno)', maxlength: 20, placeholder: '€€' })
    ),
    card(
      'Naslov spletne strani',
      null,
      text(app, 'site.url', { label: 'Naslov', type: 'url', validate: httpsOnly, mono: true, help: 'Spremenite ob selitvi na lastno domeno (npr. https://www.ema-animacije.si). Vse povezave na strani se prilagodijo same.' })
    ),
  ];
}

// --- history & access -----------------------------------------------------------------------------

function history(app) {
  const list = h('div', { class: 'history' }, h('p', { class: 'muted' }, 'Nalagam različice …'));
  app
    .loadHistory()
    .then((commits) => {
      if (!commits.length) return list.replaceChildren(note(app.local ? 'V lokalnem načinu so različice v gitu (git log content/site.json).' : 'Ni še objav.', 'info'));
      list.replaceChildren(
        ...commits.map((c, i) =>
          h(
            'div',
            { class: 'history-row' },
            h('div', { class: 'history-text' }, h('strong', {}, c.commit.message.split('\n')[0]), h('span', { class: 'muted' }, `${new Date(c.commit.author.date).toLocaleString('sl-SI')} · ${c.author?.login ?? c.commit.author.name}`)),
            i === 0 ? h('span', { class: 'pill' }, 'Trenutna') : h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => app.loadVersion(c.sha) }, 'Naloži v urejevalnik')
          )
        )
      );
    })
    .catch((error) => list.replaceChildren(note(`Zgodovine ni bilo mogoče naložiti: ${error.message}`, 'warn')));

  const importInput = h('input', { type: 'file', accept: 'application/json,.json', class: 'visually-hidden', id: 'import-file' });
  importInput.addEventListener('change', () => {
    const file = importInput.files?.[0];
    importInput.value = '';
    if (file) app.importJson(file);
  });

  return [
    head('Zgodovina in varnostna kopija', 'Vsaka objava je shranjena. Starejšo različico naložite v urejevalnik, jo preverite v predogledu in z Objavi obnovite.'),
    card('Različice', null, list),
    card(
      'Varnostna kopija',
      null,
      h(
        'div',
        { class: 'button-row' },
        h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => app.exportJson() }, icon('download'), 'Prenesi nastavitve (.json)'),
        h('label', { class: 'btn btn-ghost', for: 'import-file' }, icon('upload'), 'Uvozi nastavitve'),
        importInput,
        h('button', { type: 'button', class: 'btn btn-ghost danger-text', onclick: () => app.resetDefaults() }, icon('refresh'), 'Ponastavi na začetno predlogo')
      )
    ),
  ];
}

function access(app) {
  const a = app.access;
  const label = h('input', { type: 'text', class: 'input', id: 'acc-label', maxlength: 40, value: a?.label ?? '', placeholder: 'npr. Ema' });
  const pass = h('input', { type: 'password', class: 'input', id: 'acc-pass', autocomplete: 'new-password', minlength: MIN_PASSWORD });
  const pass2 = h('input', { type: 'password', class: 'input', id: 'acc-pass2', autocomplete: 'new-password' });
  const other = h('input', { type: 'password', class: 'input mono', id: 'acc-token', autocomplete: 'off', placeholder: 'github_pat_… (neobvezno)' });
  const error = h('p', { class: 'field-error', role: 'alert', hidden: true });
  const save = h('button', { type: 'submit', class: 'btn btn-primary' }, a ? 'Zamenjaj geslo' : 'Vklopi prijavo z geslom');
  // Shown in plain text so it can be written down; the browser's password manager offers to save it at sign-in.
  const suggest = h('button', {
    type: 'button',
    class: 'btn btn-ghost',
    onclick: () => {
      pass.value = pass2.value = suggestPassword();
      pass.type = 'text';
      fail('');
    },
  }, icon('key'), 'Predlagaj geslo');
  const fail = (message) => {
    error.textContent = message;
    error.hidden = !message;
  };

  const formEl = h(
    'form',
    {
      class: 'field',
      onsubmit: async (event) => {
        event.preventDefault();
        fail('');
        const problem = passwordProblem(pass.value);
        if (problem) return fail(problem);
        if (pass.value !== pass2.value) return fail('Gesli se ne ujemata.');
        const token = other.value.trim();
        if (token && !/^(github_pat_|ghp_)[A-Za-z0-9_]{20,255}$/.test(token)) return fail('To ni videti kot žeton GitHub.');
        save.disabled = true;
        save.classList.add('is-loading');
        try {
          await app.saveAccess(pass.value, { token, label: label.value.trim() });
        } catch (e) {
          fail(e.status === 401 || e.status === 404 ? 'Vpisani žeton nima dostopa do tega repozitorija.' : e.message || 'Shranjevanje ni uspelo.');
          save.disabled = false;
          save.classList.remove('is-loading');
        }
      },
    },
    h('div', { class: 'field' }, h('label', { class: 'field-label', for: 'acc-label' }, 'Ime za pozdrav na prijavni strani (neobvezno)'), label),
    h('div', { class: 'grid-2' }, h('div', { class: 'field' }, h('label', { class: 'field-label', for: 'acc-pass' }, 'Novo geslo'), pass), h('div', { class: 'field' }, h('label', { class: 'field-label', for: 'acc-pass2' }, 'Ponovite geslo'), pass2)),
    h('p', { class: 'field-help' }, `Vsaj ${MIN_PASSWORD} znakov. Najvarnejše je predlagano geslo iz petih naključnih besed: zapišite si ga ali ga shranite v brskalnik.`),
    h('div', { class: 'button-row' }, suggest),
    h(
      'div',
      { class: 'field' },
      h('label', { class: 'field-label', for: 'acc-token' }, 'Ločen žeton za stranko (priporočeno, neobvezno)'),
      other,
      h('p', { class: 'field-help' }, 'Prazno pomeni, da se uporabi žeton, s katerim ste zdaj prijavljeni. Ločen žeton lahko kadar koli prekličete, ne da bi to vplivalo na vaš dostop.')
    ),
    error,
    h('div', { class: 'button-row' }, save, a ? h('button', { type: 'button', class: 'btn btn-ghost danger-text', onclick: () => app.removeAccess() }, 'Izklopi prijavo z geslom') : null)
  );

  return [
    head('Dostop', 'Kdo lahko ureja stran in kako se prijavi.'),
    card(
      'Prijava z geslom',
      a ? `Vklopljeno od ${a.created}. Urejevalnik na ${app.siteRoot}/admin/ vpraša samo za geslo.` : 'Stranka se lahko namesto z žetonom GitHub prijavi s preprostim geslom.',
      a ? note('Prijava z geslom je vklopljena.', 'ok') : null,
      note(
        'Kako deluje: žeton GitHub se v brskalniku zaklene z geslom in objavi kot datoteka admin/access.json. Datoteka je javna, zato je varnost odvisna od dolžine gesla. Kdor pozna geslo, lahko ureja stran. Ko žeton poteče, ga ustvarite znova in tukaj nastavite geslo še enkrat.',
        'info'
      ),
      a
        ? note(
            'Prejšnje datoteke z gesli ostanejo v javni zgodovini repozitorija in staro geslo še vedno odklene isti žeton. Če geslo menjate, ker ga morda pozna kdo drug, zato ustvarite nov žeton, ga prilepite spodaj in starega prekličite na GitHubu.',
            'warn'
          )
        : null,
      formEl
    ),
    card(
      'Prijava z žetonom GitHub',
      'Žeton dovoljuje urejanje samo tega repozitorija. Prekličete ga na GitHubu, če izgubite napravo ali želite komu odvzeti dostop.',
      h('div', { class: 'link-grid' }, link('https://github.com/settings/personal-access-tokens', 'Žetoni na GitHubu'), link(`https://github.com/${app.repo.owner}/${app.repo.repo}`, 'Repozitorij'))
    ),
  ];
}

// --- panel list ------------------------------------------------------------------------------------

export const PANELS = [
  { id: 'overview', label: 'Pregled', icon: 'overview', render: overview, page: 'home' },
  { id: 'hero', label: 'Vrh strani', icon: 'hero', render: hero, group: 'Vsebina', page: 'home' },
  { id: 'sections', label: 'Razdelki in meni', icon: 'sections', render: sections, group: 'Vsebina', page: 'home' },
  { id: 'program', label: 'Program zabave', icon: 'program', render: program, group: 'Vsebina', page: 'home', anchor: 'steps' },
  { id: 'packages', label: 'Paketi', icon: 'packages', render: packages, group: 'Vsebina', page: 'home', anchor: 'packages' },
  { id: 'schedule', label: 'Športne urice in dogodki', icon: 'schedule', render: schedule, group: 'Vsebina', page: 'home', anchor: 'schedule' },
  { id: 'about', label: 'O meni', icon: 'about', render: about, group: 'Vsebina', page: 'home', anchor: 'about' },
  { id: 'gallery', label: 'Utrinki (galerija)', icon: 'gallery', render: gallery, group: 'Vsebina', page: 'home', anchor: 'gallery' },
  { id: 'reviews', label: 'Mnenja staršev', icon: 'reviews', render: reviews, group: 'Vsebina', page: 'home', anchor: 'testimonials' },
  { id: 'faq', label: 'Vprašanja', icon: 'faq', render: faq, group: 'Vsebina', page: 'home', anchor: 'faq' },
  { id: 'contact', label: 'Kontakt', icon: 'contact', render: contact, group: 'Vsebina', page: 'home', anchor: 'contact' },
  { id: 'form', label: 'Obrazec', icon: 'form', render: form, group: 'Vsebina', page: 'home', anchor: 'contact' },
  { id: 'services', label: 'Ponudba (dodatno)', icon: 'services', render: services, group: 'Vsebina', page: 'home', anchor: 'services' },
  { id: 'appearance', label: 'Barve in oblika', icon: 'appearance', render: appearance, group: 'Videz', page: 'home' },
  { id: 'text', label: 'Pisave po delih', icon: 'type', render: textStyles, group: 'Videz', page: 'home' },
  { id: 'languages', label: 'Jeziki in prevodi', icon: 'languages', render: languages, group: 'Nastavitve', page: 'home' },
  { id: 'socials', label: 'Omrežja in noga', icon: 'socials', render: socials, group: 'Nastavitve', page: 'home' },
  { id: 'legal', label: 'Podjetje in zasebnost', icon: 'legal', render: legal, group: 'Nastavitve', page: 'privacy' },
  { id: 'seo', label: 'SEO in deljenje', icon: 'seo', render: seo, group: 'Nastavitve' },
  { id: 'history', label: 'Zgodovina', icon: 'history', render: history, group: 'Sistem' },
  { id: 'access', label: 'Dostop', icon: 'key', render: access, group: 'Sistem' },
];

// Which panel holds the field for a settings path (first matching prefix wins).
const PATH_PANELS = [
  ['hero.', 'hero'],
  ['announcement.', 'sections'],
  ['header.', 'sections'],
  ['steps.', 'program'],
  ['services.', 'services'],
  ['packages.', 'packages'],
  ['schedule.', 'schedule'],
  ['events.', 'schedule'],
  ['about.', 'about'],
  ['gallery.', 'gallery'],
  ['testimonials.', 'reviews'],
  ['faq.', 'faq'],
  ['contact.', 'contact'],
  ['floating.', 'contact'],
  ['form.', 'form'],
  ['thanks.', 'form'],
  ['footer.', 'socials'],
  ['socials', 'socials'],
  ['business.', 'legal'],
  ['privacy.', 'legal'],
  ['terms.', 'legal'],
  ['seo.', 'seo'],
  ['site.', 'seo'],
  ['languages.', 'languages'],
  ['textStyles.', 'text'],
  ['theme.', 'appearance'],
];

const SECTION_PANELS = { steps: 'program', packages: 'packages', schedule: 'schedule', events: 'schedule', about: 'about', gallery: 'gallery', testimonials: 'reviews', faq: 'faq', contact: 'contact', services: 'services' };

/** Panel id for a settings path. Section headings open the panel of their section. */
export function panelForPath(path, settings) {
  const section = path.match(/^sections\.(\d+)\./);
  if (section) {
    const id = settings?.sections?.[Number(section[1])]?.id;
    return SECTION_PANELS[id] ?? 'sections';
  }
  return PATH_PANELS.find(([prefix]) => path.startsWith(prefix))?.[1] ?? null;
}
