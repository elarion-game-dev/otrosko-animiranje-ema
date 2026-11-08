# Otroško animiranje Ema – spletna stran

Spletna stran za otroške zabave, športne urice in animacijo na dogodkih, v slovenščini, angleščini in
srbohrvaščini, z urejevalnikom, v katerem lastnica sama ureja vsebino in videz.

- **Stran:** https://elarion-game-dev.github.io/otrosko-animiranje-ema/
- **Urejevalnik:** https://elarion-game-dev.github.io/otrosko-animiranje-ema/admin/

Zgrajena enako kot spletna stran Elarion: statične strani, brez strežnika in brez odvisnosti npm. Urejevalnik
shrani vsako spremembo kot commit v ta repozitorij, GitHub Actions pa stran zgradi in objavi na GitHub Pages.

## Kaj je na strani

| Pot (SL / EN / SH)                          | Kaj                                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------------------- |
| `/` · `/en/` · `/sh/`                       | domača stran: vrh, ponudba, kako poteka, paketi, urnik, o nas, galerija, mnenja, vprašanja, kontakt z obrazcem |
| `/zasebnost/` · `/en/privacy/` · `/sh/privatnost/` | politika zasebnosti, sestavljena iz nastavitev                                  |
| `/pogoji/` · `/en/terms/` · `/sh/uvjeti/`   | pogoji poslovanja (neobvezno, privzeto izklopljeno)                                    |
| `/hvala/` · `/en/thank-you/` · `/sh/hvala/` | zahvala po povpraševanju (za storitve, ki preusmerijo)                                 |
| `/404.html`                                 | stran ne obstaja, v vseh jezikih                                                       |
| `/admin/`                                   | urejevalnik                                                                            |

Razdelke domače strani lahko vklopite, izklopite in premikate. Prazni razdelki (galerija brez slik, mnenja brez
mnenj) se na spletu ne prikažejo.

## Urejevalnik

V slogu urejevalnikov Elarion in Urban & Monika: meni na levi, nastavitve na sredini, predogled v živo na desni
(na telefonu gumb *Predogled*). Svetla tema je topla, papirnata (Urban & Monika), temna je Elarionova.

- Vse besedilo, slike, cene, urnik, vprašanja, kontakt, obrazec, barve, pisave, oblika gumbov in kartic, okraski.
- **Jezik urejanja** (SL / EN / SH) zgoraj: polja pokažejo izbrani jezik, pod vsakim je slovenski izvirnik.
  Številka pri jeziku pove, koliko besedil še ni prevedenih; seznam je pod *Jeziki in prevodi*. Neprevedeno
  besedilo se na tisti jezikovni različici pokaže v slovenščini.
- Klik na besedilo v predogledu odpre njegovo polje.
- *Razveljavi* pri vsakem spremenjenem polju, Ctrl+Z / Ctrl+Shift+Z, *Zavrzi*, Ctrl+S za objavo.
- *Objavi* naredi en commit (`content/site.json` in naložene slike). Stran je na spletu približno minuto kasneje;
  urejevalnik pokaže stanje objave.
- *Zgodovina* naloži katero koli prejšnjo objavo; *Varnostna kopija* prenese ali uvozi vse nastavitve.

### Prijava

Urejevalnik se z GitHubom pogovarja z žetonom (fine-grained personal access token), omejenim na ta repozitorij.

1. Na računu `elarion-game-dev` ustvarite žeton (povezava na prijavni strani ga predizpolni):
   - Resource owner: `elarion-game-dev`
   - Repository access: **Only select repositories** → `otrosko-animiranje-ema`
   - Permissions: **Contents: Read and write**, **Actions: Read** (za stanje objave)
   - Expiration: do enega leta
2. Prijavite se z njim na `/admin/`.
3. Za stranko: pod **Sistem → Dostop** nastavite geslo (vsaj 12 znakov; najlažje tri ali štiri naključne besede).
   Priporočeno je, da za stranko ustvarite ločen žeton in ga prilepite tam, da ga lahko prekličete posebej.
   Stranka potem dobi samo naslov `/admin/` in geslo.

Kako deluje geslo: žeton se v brskalniku zaklene z geslom (PBKDF2-SHA256, 600 000 krogov → AES-256-GCM) in objavi
kot `admin/access.json`. Datoteka je javna, zato je varnost odvisna od dolžine gesla. Kdor pozna geslo, lahko ureja
stran (ne more pa spreminjati workflowov ali drugih repozitorijev). Ko žeton poteče, ustvarite novega in geslo
nastavite znova. Dostop odvzamete tako, da žeton prekličete na https://github.com/settings/personal-access-tokens.

## Obrazec za povpraševanje

Stran je statična, zato obrazec pošilja na enega od teh načinov (nastavi se v urejevalniku pod *Obrazec*):

| Način                         | Kako deluje                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------------- |
| E-poštni program obiskovalca  | Privzeto. Odpre obiskovalčev e-poštni program s pripravljenim sporočilom. Brez registracije. |
| **Formspree** (priporočeno)   | Sporočilo gre iz brskalnika na Formspree, ta ga pošlje na vaš e-naslov. Brezplačni paket ima mesečno omejitev. |
| Druga storitev / lasten strežnik | Poljuben naslov `https://` (npr. Web3Forms ali PHP skripta po selitvi), z enim skritim poljem za ključ. |
| Brez obrazca                  | Samo telefon, WhatsApp, Viber in e-pošta.                                                     |

Povpraševanja se nikoli ne shranjujejo na tej strani ali v repozitoriju. Obrazec sprašuje samo za število in
starost otrok, nikoli za imena. Zaščita pred roboti: skrito polje, najkrajši čas izpolnjevanja, največ trije
poskusi na minuto.

## Zasebnost in varnost

| | |
|---|---|
| Content Security Policy | Stroga na vsaki strani: `default-src 'none'`, skripte, slogi, pisave in slike samo s te strani, povezava samo do izbrane storitve za obrazec. Brez `unsafe-inline` in brez slogov v vrstici. |
| Sledenje | Brez piškotkov, analitike, oglasov in skript tretjih oseb, zato pasica za piškotke ni potrebna. |
| Tretje osebe | Pisave in slike so na tej strani (slike je treba naložiti; zunanji naslovi slik se zavrnejo). |
| Fotografije | Naložene slike se v brskalniku pomanjšajo in ponovno kodirajo, kar odstrani EXIF/GPS. SVG ni dovoljen. Urejevalnik opozarja na soglasje staršev. |
| Politika zasebnosti | Samodejno v treh jezikih: upravljavec, obrazec, otroci, fotografije, gostovanje, obdelovalci, prenosi izven EU, hramba, pravice, Informacijski pooblaščenec. Predloga, ne pravni nasvet. |
| Podatki o podjetju | Polja za naziv, naslov, matično, davčno številko in ID za DDV (ZEPT); prikažejo se v nogi. |
| Iskalniki | Privzeto `noindex`, dokler lastnica ne potrdi, da so besedila končana (*SEO in deljenje*). |
| Vhodni podatki | Vse nastavitve gredo skozi en normalizator (dolžine, barve, URL-ji, izbire), ves izpis je ubežen. `npm test` vsako polje napade z zlonamernim vnosom. |
| Urejevalnik | Brez baze gesel. Dostop je žeton, omejen na ta repozitorij; urejevalnik se pogovarja samo z `api.github.com`, ne deluje v okvirju (iframe) in je `noindex`. |
| Dobavna veriga | Brez odvisnosti npm. GitHub Actions so pripeti na commit SHA, posodablja jih Dependabot. |

Vzorčna vsebina ne vsebuje izmišljenih mnenj, fotografij, cen ali številk: tisto vpiše lastnica sama.

## Lokalni razvoj

Potreben je Node.js 20+. `npm install` ni potreben.

```sh
npm run dev    # zgradi, streže na http://127.0.0.1:4321/otrosko-animiranje-ema/ in ob spremembah zgradi znova
npm test       # varnostni in vsebinski preizkusi
npm run build  # rezultat v dist/
```

Lokalni urejevalnik (`/otrosko-animiranje-ema/admin/`) ponudi **lokalni način**: shranjuje naravnost v
`content/site.json` in `public/assets/uploads/`, brez GitHuba. Spremembe nato objavite z `git commit` in `git push`.
Lokalni način deluje samo z `npm run dev` na 127.0.0.1.

## Selitev na drugo gostovanje

Vse povezave izhajajo iz naslova strani (*SEO in deljenje → Naslov spletne strani*), zato je selitev preprosta:

1. **Lastna domena na GitHub Pages:** v repozitoriju *Settings → Pages → Custom domain*, nastavite DNS, nato v
   urejevalniku spremenite naslov strani na `https://www.vasa-domena.si` in objavite.
2. **Drugo gostovanje (statično ali s FTP):** v `.github/workflows/deploy.yml` zamenjajte zadnji korak
   (`deploy-pages`) z nalaganjem mape `dist/` na novo gostovanje (npr. FTP/SFTP akcija s skrivnostmi v
   repozitoriju). Urejevalnik deluje naprej enako: shrani v GitHub, workflow pa objavi na novo gostovanje.
   Pri tem spremenite naslov strani in pod *Podjetje in zasebnost* besedilo o gostovanju (in izklopite »izven
   EU«, če je ponudnik v EU).
3. **Gostovanje s PHP:** obrazec lahko pošilja na lastno skripto (*Obrazec → Druga storitev ali lasten strežnik*).

## Kje je kaj

```
content/site.json        vse nastavitve strani (to ureja urejevalnik)
src/                     skupno za gradnjo in predogled v urejevalniku
  settings.mjs           privzete vrednosti (v treh jezikih) + normalizator
  render.mjs             vse strani, sitemap, robots.txt, manifest
  i18n.mjs               jeziki, naslovi strani, fiksna besedila strani
  policy.mjs             politika zasebnosti v treh jezikih
  themes.mjs             kombinacije barv, pisave, theme.css, preverjanje kontrasta
  providers.mjs          načini pošiljanja obrazca
  icons.mjs              ikone storitev in znamk
public/                  kopirano, kot je (CSS, skripta strani, pisave, urejevalnik)
public/assets/uploads/   slike, naložene v urejevalniku
scripts/                 gradnja, razvojni strežnik, preizkusi
```

Ko pride končni grafični dizajn, se večina sprememb zgodi v `public/assets/css/site.css` (oblika),
`src/themes.mjs` (barve, pisave, kombinacije) in po potrebi `src/render.mjs` (zgradba strani).

Pisave so z licenco SIL Open Font License (glej `public/assets/fonts/LICENSES.txt`), vse imajo č, š, ž, ć in đ.
Ikone znamk so iz Simple Icons (CC0).
