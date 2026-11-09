// The privacy policy, generated from the settings in all four languages. It describes what this site
// actually does: an inquiry form (sent by email or through a form service), contact by phone and messengers,
// photos published with parents' consent, no cookies and no analytics.
// A careful template for a small Slovenian business, not legal advice.

import { markdown } from './markdown.mjs';
import { LANG_INFO } from './i18n.mjs';
import { resolveProvider } from './providers.mjs';
import { formQuestions } from './settings.mjs';
import { esc, formatDate, toCyrillic, tr } from './util.mjs';

const FIELD_NAMES = {
  name: { sl: 'vaše ime', en: 'your name', hr: 'vaše ime', sr: 'vaše ime' },
  contact: { sl: 'telefonska številka ali e-poštni naslov', en: 'phone number or email address', hr: 'broj telefona ili e-mail adresa', sr: 'broj telefona ili imejl adresa' },
  topic: { sl: 'kaj vas zanima (rojstni dan, športne urice ali drug dogodek)', en: 'what you are interested in (a birthday party, sports classes or another event)', hr: 'što vas zanima (rođendan, sportske aktivnosti ili drugi događaj)', sr: 'šta vas zanima (rođendan, sportske aktivnosti ili drugi događaj)' },
  date: { sl: 'datum zabave ali dogodka', en: 'date of the party or event', hr: 'datum zabave ili događaja', sr: 'datum zabave ili događaja' },
  age: { sl: 'starost otroka', en: "the child's age", hr: 'dob djeteta', sr: 'uzrast deteta' },
  kids: { sl: 'število otrok', en: 'number of children', hr: 'broj djece', sr: 'broj dece' },
  package: { sl: 'izbrani paket', en: 'the package you chose', hr: 'odabrani paket', sr: 'izabrani paket' },
  time: { sl: 'okvirna ura', en: 'rough time of day', hr: 'okvirno vrijeme', sr: 'okvirno vreme' },
  where: { sl: 'vrsta prostora (doma ali najet prostor)', en: 'type of venue (home or rented)', hr: 'vrsta prostora (kod kuće ili iznajmljeni)', sr: 'vrsta prostora (kod kuće ili iznajmljeni)' },
  town: { sl: 'kraj', en: 'town', hr: 'mjesto', sr: 'mesto' },
  slot: { sl: 'želeni termin športnih uric', en: 'preferred sports class', hr: 'željeni termin sportskih aktivnosti', sr: 'željeni termin sportskih aktivnosti' },
  trial: { sl: 'želja po poskusni urici', en: 'whether you would like a trial class', hr: 'želja za probnim satom', sr: 'želja za probnim časom' },
  eventType: { sl: 'vrsta dogodka', en: 'type of event', hr: 'vrsta događaja', sr: 'vrsta događaja' },
  reply: { sl: 'kako želite odgovor', en: 'how you would like a reply', hr: 'kako želite odgovor', sr: 'kako želite odgovor' },
  message: { sl: 'vaše sporočilo', en: 'your message', hr: 'vaša poruka', sr: 'vaša poruka' },
};

// Serbian is written in Latin here and shown in Cyrillic (tags, links and names stay as they are).
const L = (lang, sl, en, hr, sr) => (lang === 'sr' ? toCyrillic(sr) : { sl, en, hr }[lang]);

export function privacyBody(settings, lang, ctx) {
  const s = settings;
  const p = s.privacy;
  const b = s.business;
  const c = s.contact;
  const prov = resolveProvider(s.form, c.email);
  const owner = b.name || s.site.name;
  const mail = c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : '';
  const contactLine = [mail, c.phone ? esc(c.phone) : ''].filter(Boolean).join(L(lang, ' ali ', ' or ', ' ili ', ' ili '));
  const fields = formQuestions(s).map((f) => (lang === 'sr' ? toCyrillic(FIELD_NAMES[f].sr) : FIELD_NAMES[f][lang]));
  const hosting = esc(tr(p.hosting, lang));
  const providerName = prov.ready && prov.name ? (prov.privacyUrl ? `<a href="${esc(prov.privacyUrl)}" rel="noopener" target="_blank">${esc(prov.name)}</a>` : esc(prov.name)) : '';
  const providerRegion = prov.ready && prov.region ? ` (${esc(lang === 'sr' ? toCyrillic(prov.region.sr) : prov.region[lang])})` : '';
  const formUsed = s.form.provider !== 'none' && s.sections.some((x) => x.id === 'contact' && x.enabled);

  // How a message travels: only said once the form can actually send (until then the site shows it as closed).
  const how = !formUsed || !prov.ready
    ? ''
    : prov.responds === 'mailto'
      ? L(
          lang,
          'Ko pritisnete gumb za pošiljanje, se odpre vaš e-poštni program s pripravljenim sporočilom. Sporočilo pošljete sami, z vašega e-poštnega naslova. Podatki iz obrazca ne gredo skozi to spletno stran.',
          'When you press the send button, your own email app opens with the message ready. You send it yourself, from your own address. The form data does not pass through this website.',
          'Kada pritisnete gumb za slanje, otvara se vaš program za e-poštu s pripremljenom porukom. Poruku šaljete sami, sa svoje adrese. Podaci iz obrasca ne prolaze kroz ovu web stranicu.',
          'Kada pritisnete dugme za slanje, otvara se vaš program za e-poštu sa pripremljenom porukom. Poruku šaljete sami, sa svoje adrese. Podaci iz obrasca ne prolaze kroz ovu veb-stranicu.'
        )
      : L(
          lang,
          `Ko pošljete obrazec, gredo podatki neposredno iz vašega brskalnika k storitvi ${providerName}${providerRegion}, ki nam jih posreduje po e-pošti. Na tej spletni strani se ne shranjujejo.`,
          `When you send the form, the data goes straight from your browser to ${providerName}${providerRegion}, which forwards it to us by email. It is not stored on this website.`,
          `Kada pošaljete obrazac, podaci idu izravno iz vašeg preglednika servisu ${providerName}${providerRegion}, koji nam ih prosljeđuje e-poštom. Ne pohranjuju se na ovoj web stranici.`,
          `Kada pošaljete obrazac, podaci idu direktno iz vašeg pregledača servisu ${providerName}${providerRegion}, koji nam ih prosleđuje e-poštom. Ne čuvaju se na ovoj veb-stranici.`
        );

  const processors = [
    `<li>${hosting}: ${L(lang, 'gostovanje spletne strani', 'hosts this website', 'smještaj web stranice', 'hosting veb-stranice')}.</li>`,
    formUsed && prov.ready && prov.responds !== 'mailto' ? `<li>${providerName}${providerRegion}: ${L(lang, 'posredovanje sporočil iz obrazca', 'forwards the messages sent with the form', 'prosljeđivanje poruka iz obrasca', 'prosleđivanje poruka iz obrasca')}.</li>` : '',
  ].join('');

  const sections = [
    `<div class="callout">
      <h2>${L(lang, 'Na kratko', 'The short version', 'Ukratko', 'Ukratko')}</h2>
      <ul>
        <li>${L(lang, 'Zbiramo samo podatke, ki nam jih pošljete sami: v obrazcu za povpraševanje, po telefonu ali e-pošti.', 'We only collect what you send us yourself: through the inquiry form, by phone or by email.', 'Prikupljamo samo podatke koje nam sami pošaljete: putem obrasca za upit, telefonom ili e-poštom.', 'Prikupljamo samo podatke koje nam sami pošaljete: putem obrasca za upit, telefonom ili e-poštom.')}</li>
        <li>${L(lang, 'Brez piškotkov, brez analitike, brez oglasov.', 'No cookies, no analytics, no ads.', 'Bez kolačića, bez analitike, bez oglasa.', 'Bez kolačića, bez analitike, bez oglasa.')}</li>
        <li>${L(lang, 'Podatke uporabimo samo za odgovor in izvedbo vašega dogodka. Nikoli jih ne prodamo.', 'We use your details only to reply and to run your event. We never sell them.', 'Podatke koristimo samo za odgovor i organizaciju vašeg događaja. Nikada ih ne prodajemo.', 'Podatke koristimo samo za odgovor i organizaciju vašeg događaja. Nikada ih ne prodajemo.')}</li>
        <li>${L(lang, 'Kadar koli lahko zahtevate vpogled ali izbris.', 'You can ask to see or delete your data at any time.', 'U bilo kojem trenutku možete zatražiti uvid ili brisanje.', 'U bilo kom trenutku možete zatražiti uvid ili brisanje.')}</li>
      </ul>
    </div>`,

    `<h2>${L(lang, 'Kdo je upravljavec', 'Who is responsible', 'Tko je voditelj obrade', 'Ko je rukovalac obrade')}</h2>
    <p>${L(lang, 'Upravljavec osebnih podatkov je', 'The data controller is', 'Voditelj obrade osobnih podataka je', 'Rukovalac obrade ličnih podataka je')} <strong>${esc(owner)}</strong>${b.address ? `, ${esc(b.address).replace(/\n/g, ', ')}` : ''}.</p>
    ${contactLine ? `<p>${L(lang, 'Za vsa vprašanja o zasebnosti nam pišite ali nas pokličite:', 'For any privacy question, write to us or call:', 'Za sva pitanja o privatnosti pišite nam ili nas nazovite:', 'Za sva pitanja o privatnosti pišite nam ili nas pozovite:')} ${contactLine}.</p>` : ''}`,

    formUsed
      ? `<h2>${L(lang, 'Obrazec za povpraševanje', 'The inquiry form', 'Obrazac za upit', 'Obrazac za upit')}</h2>
    <p><strong>${L(lang, 'Kaj zbiramo:', 'What we collect:', 'Što prikupljamo:', 'Šta prikupljamo:')}</strong> ${esc(fields.join(', '))}.</p>
    <p><strong>${L(lang, 'Zakaj:', 'Why:', 'Zašto:', 'Zašto:')}</strong> ${L(lang, 'da vam odgovorimo, pripravimo ponudbo in se dogovorimo za dogodek.', 'to reply, prepare an offer and arrange the event with you.', 'kako bismo vam odgovorili, pripremili ponudu i dogovorili događaj.', 'kako bismo vam odgovorili, pripremili ponudu i dogovorili događaj.')}</p>
    <p><strong>${L(lang, 'Pravna podlaga:', 'Legal basis:', 'Pravna osnova:', 'Pravna osnova:')}</strong> ${L(lang, 'ukrepi pred sklenitvijo pogodbe na vašo zahtevo (točka (b) člena 6(1) GDPR).', 'steps taken at your request before entering into a contract (Article 6(1)(b) GDPR).', 'radnje prije sklapanja ugovora na vaš zahtjev (članak 6. stavak 1. točka (b) GDPR-a).', 'radnje pre zaključenja ugovora na vaš zahtev (član 6. stav 1. tačka (b) GDPR-a).')}</p>
    ${how ? `<p>${how}</p>` : ''}`
      : '',

    `<h2>${L(lang, 'Telefon, e-pošta, WhatsApp in Viber', 'Phone, email, WhatsApp and Viber', 'Telefon, e-pošta, WhatsApp i Viber', 'Telefon, e-pošta, WhatsApp i Viber')}</h2>
    <p>${L(
      lang,
      'Če nas pokličete ali nam pišete, uporabimo vaše podatke samo za pogovor o vašem dogodku. Sporočila prek WhatsAppa ali Vibra potujejo prek teh storitev, ki podatke obdelujejo v skladu s svojimi pogoji.',
      'If you call or message us, we use your details only to talk about your event. Messages sent with WhatsApp or Viber go through those services, which handle data under their own terms.',
      'Ako nas nazovete ili nam pišete, vaše podatke koristimo samo za razgovor o vašem događaju. Poruke poslane putem WhatsAppa ili Vibera prolaze kroz te servise, koji podatke obrađuju prema vlastitim uvjetima.',
      'Ako nas pozovete ili nam pišete, vaše podatke koristimo samo za razgovor o vašem događaju. Poruke poslate putem WhatsAppa ili Vibera prolaze kroz te servise, koji podatke obrađuju prema sopstvenim uslovima.'
    )}</p>`,

    `<h2>${L(lang, 'Otroci', 'Children', 'Djeca', 'Deca')}</h2>
    <p>${L(
      lang,
      'Obrazec je namenjen staršem in skrbnikom. Od otrok podatkov ne zbiramo. Sprašujemo samo za število in starost otrok, da lahko prilagodimo program, nikoli pa za njihova imena.',
      'The form is meant for parents and guardians. We do not collect data from children. We only ask for the number and ages of the children, to plan the programme, and never for their names.',
      'Obrazac je namijenjen roditeljima i skrbnicima. Od djece ne prikupljamo podatke. Pitamo samo za broj i dob djece, kako bismo prilagodili program, a nikada za njihova imena.',
      'Obrazac je namenjen roditeljima i starateljima. Od dece ne prikupljamo podatke. Pitamo samo za broj i uzrast dece, kako bismo prilagodili program, a nikada za njihova imena.'
    )}</p>`,

    p.photos
      ? `<h2>${L(lang, 'Fotografije', 'Photos', 'Fotografije', 'Fotografije')}</h2>
    <p>${L(
      lang,
      'Fotografije z dogodkov objavimo samo s soglasjem staršev (točka (a) člena 6(1) GDPR). Soglasje lahko kadar koli prekličete in fotografijo nemudoma odstranimo s strani.',
      "We only publish photos from events with the parents' consent (Article 6(1)(a) GDPR). You can withdraw consent at any time, and we will promptly remove the photo from the site.",
      'Fotografije s događaja objavljujemo samo uz privolu roditelja (članak 6. stavak 1. točka (a) GDPR-a). Privolu možete povući u bilo kojem trenutku i fotografiju ćemo odmah ukloniti sa stranice.',
      'Fotografije sa događaja objavljujemo samo uz pristanak roditelja (član 6. stav 1. tačka (a) GDPR-a). Pristanak možete povući u bilo kom trenutku i fotografiju ćemo odmah ukloniti sa stranice.'
    )}</p>`
      : '',

    `<h2>${L(lang, 'Obisk spletne strani', 'Visiting this website', 'Posjet web stranici', 'Poseta veb-stranici')}</h2>
    <p>${L(
      lang,
      `Stran gostuje pri ponudniku ${hosting}. Kot vsak strežnik ta obdeluje tehnične podatke, kot sta IP-naslov in vrsta brskalnika, da stran dostavi in jo zaščiti. Pravna podlaga je zakoniti interes za varno delovanje strani (točka (f) člena 6(1) GDPR). Do teh dnevnikov nimamo dostopa in ne uporabljamo analitike.`,
      `The site is hosted by ${hosting}. Like any web server, it processes technical data such as your IP address and browser type to deliver and protect the site. The legal basis is our legitimate interest in running a secure website (Article 6(1)(f) GDPR). We have no access to these logs and use no analytics.`,
      `Stranica se nalazi kod pružatelja ${hosting}. Kao svaki poslužitelj, obrađuje tehničke podatke poput IP adrese i vrste preglednika kako bi isporučio i zaštitio stranicu. Pravna osnova je legitimni interes za sigurno funkcioniranje stranice (članak 6. stavak 1. točka (f) GDPR-a). Nemamo pristup tim zapisima i ne koristimo analitiku.`,
      `Stranica se nalazi kod pružaoca usluge ${hosting}. Kao svaki server, obrađuje tehničke podatke poput IP adrese i vrste pregledača kako bi isporučio i zaštitio stranicu. Pravna osnova je legitimni interes za bezbedno funkcionisanje stranice (član 6. stav 1. tačka (f) GDPR-a). Nemamo pristup tim zapisima i ne koristimo analitiku.`
    )}</p>
    <p>${L(
      lang,
      'Pisave in slike se nalagajo s te strani. Strani ne nalagajo vsebin drugih ponudnikov, oglasov ali sledilnikov. Stran ne uporablja piškotkov in v vaš brskalnik ne shranjuje ničesar, zato ni pasice za piškotke.',
      'Fonts and images load from this site. No content, ads or trackers load from other companies. The site sets no cookies and stores nothing in your browser, which is why there is no cookie banner.',
      'Fontovi i slike učitavaju se s ove stranice. Ne učitavaju se sadržaji drugih pružatelja, oglasi ni alati za praćenje. Stranica ne koristi kolačiće i ništa ne sprema u vaš preglednik, zato nema obavijesti o kolačićima.',
      'Fontovi i slike učitavaju se sa ove stranice. Ne učitavaju se sadržaji drugih pružalaca, oglasi ni alati za praćenje. Stranica ne koristi kolačiće i ništa ne čuva u vašem pregledaču, zato nema obaveštenja o kolačićima.'
    )}</p>`,

    `<h2>${L(lang, 'Obdelovalci', 'Service providers', 'Izvršitelji obrade', 'Obrađivači podataka')}</h2>
    <ul>${processors}</ul>
    ${
      p.outsideEu
        ? `<p>${L(
            lang,
            'Nekateri od teh ponudnikov podatke obdelujejo izven EU/EGP. Prenos je zaščiten z ustreznimi zaščitnimi ukrepi, kot sta okvir EU-ZDA za zasebnost podatkov ali standardne pogodbene klavzule Evropske komisije.',
            "Some of these providers process data outside the EU/EEA. Such transfers are protected by appropriate safeguards, such as the EU-U.S. Data Privacy Framework or the European Commission's Standard Contractual Clauses.",
            'Neki od tih pružatelja obrađuju podatke izvan EU/EGP-a. Prijenos je zaštićen odgovarajućim zaštitnim mjerama, poput Okvira za privatnost podataka EU-a i SAD-a ili standardnih ugovornih klauzula Europske komisije.',
            'Neki od tih pružalaca obrađuju podatke izvan EU/EEP-a. Prenos je zaštićen odgovarajućim zaštitnim merama, poput Okvira za privatnost podataka EU-a i SAD-a ili standardnih ugovornih klauzula Evropske komisije.'
          )}</p>`
        : ''
    }`,

    `<h2>${L(lang, 'Koliko časa hranimo podatke', 'How long we keep your data', 'Koliko dugo čuvamo podatke', 'Koliko dugo čuvamo podatke')}</h2>
    <p>${L(
      lang,
      `Povpraševanja hranimo največ ${p.retentionMonths} mesecev po zadnjem stiku, če iz njih ne nastane naročilo. Podatke o naročilih in računih hranimo toliko časa, kot to zahtevajo davčni in računovodski predpisi.`,
      `We keep inquiries for at most ${p.retentionMonths} months after our last contact, unless they lead to a booking. Booking and invoice data is kept for as long as tax and accounting rules require.`,
      `Upite čuvamo najviše ${p.retentionMonths} mjeseci nakon posljednjeg kontakta, osim ako ne dovedu do narudžbe. Podatke o narudžbama i računima čuvamo onoliko dugo koliko to zahtijevaju porezni i računovodstveni propisi.`,
      `Upite čuvamo najviše ${p.retentionMonths} meseci nakon poslednjeg kontakta, osim ako ne dovedu do porudžbine. Podatke o porudžbinama i računima čuvamo onoliko dugo koliko to zahtevaju porezni i računovodstveni propisi.`
    )}</p>`,

    `<h2>${L(lang, 'Vaše pravice', 'Your rights', 'Vaša prava', 'Vaša prava')}</h2>
    <p>${L(lang, 'Imate pravico:', 'You have the right to:', 'Imate pravo:', 'Imate pravo:')}</p>
    <ul>
      <li>${L(lang, 'do vpogleda v podatke, ki jih hranimo o vas, in do njihove kopije;', 'access the data we hold about you and get a copy;', 'na uvid u podatke koje čuvamo o vama i na njihovu kopiju;', 'na uvid u podatke koje čuvamo o vama i na njihovu kopiju;')}</li>
      <li>${L(lang, 'do popravka ali izbrisa;', 'have it corrected or deleted;', 'na ispravak ili brisanje;', 'na ispravku ili brisanje;')}</li>
      <li>${L(lang, 'do omejitve obdelave in ugovora;', 'restrict or object to its processing;', 'na ograničenje obrade i prigovor;', 'na ograničenje obrade i prigovor;')}</li>
      <li>${L(lang, 'do prenosljivosti podatkov;', 'data portability;', 'na prenosivost podataka;', 'na prenosivost podataka;')}</li>
      <li>${L(lang, 'do preklica soglasja, kadar obdelava temelji na soglasju;', 'withdraw consent where processing is based on consent;', 'na povlačenje privole kada se obrada temelji na privoli;', 'na povlačenje pristanka kada se obrada zasniva na pristanku;')}</li>
      <li>${L(
        lang,
        'do pritožbe pri Informacijskem pooblaščencu RS, Dunajska cesta 22, 1000 Ljubljana (<a href="https://www.ip-rs.si" rel="noopener" target="_blank">www.ip-rs.si</a>).',
        'complain to the Slovenian Information Commissioner, Dunajska cesta 22, 1000 Ljubljana (<a href="https://www.ip-rs.si/en/" rel="noopener" target="_blank">www.ip-rs.si</a>), or to the authority where you live.',
        'na pritužbu Informacijskom povjereniku Republike Slovenije, Dunajska cesta 22, 1000 Ljubljana (<a href="https://www.ip-rs.si" rel="noopener" target="_blank">www.ip-rs.si</a>).',
        'na pritužbu Informacionom povereniku Republike Slovenije, Dunajska cesta 22, 1000 Ljubljana (<a href="https://www.ip-rs.si" rel="noopener" target="_blank">www.ip-rs.si</a>).'
      )}</li>
    </ul>
    ${contactLine ? `<p>${L(lang, 'Za uveljavljanje pravic nam pišite na', 'To use any of these rights, contact us at', 'Za ostvarivanje prava javite nam se na', 'Za ostvarivanje prava javite nam se na')} ${contactLine}. ${L(lang, 'Odgovorimo v enem mesecu.', 'We reply within one month.', 'Odgovaramo u roku od mjesec dana.', 'Odgovaramo u roku od mesec dana.')}</p>` : ''}`,

    `<h2>${L(lang, 'Spremembe', 'Changes', 'Izmjene', 'Izmene')}</h2>
    <p>${L(lang, 'Če se politika spremeni, bo nova različica objavljena na tej strani z novim datumom veljavnosti.', 'If this policy changes, the new version will be posted here with a new effective date.', 'Ako se politika promijeni, nova verzija bit će objavljena na ovoj stranici s novim datumom.', 'Ako se politika promeni, nova verzija biće objavljena na ovoj stranici sa novim datumom.')}</p>`,

    tr(p.extra, lang) ? `<h2>${L(lang, 'Dodatne informacije', 'More information', 'Dodatne informacije', 'Dodatne informacije')}</h2>\n${markdown(tr(p.extra, lang), { base: ctx.base })}` : '',
  ];

  return `<p class="page-meta">${esc(L(lang, 'Velja od', 'Effective', 'Vrijedi od', 'Važi od'))} ${esc(formatDate(p.effectiveDate, LANG_INFO[lang].locale))}</p>
<div class="prose">
${sections.filter(Boolean).join('\n')}
</div>`;
}
