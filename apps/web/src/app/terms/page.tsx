import Link from 'next/link';

const SECTIONS = [
  {
    title: '1. Definities',
    paragraphs: [
      '"Blikcart": Blikcart B.V., KvK 12345678, gevestigd te Nederland.',
      '"Klant" / "Koper": de natuurlijke persoon of rechtspersoon die een overeenkomst sluit met Blikcart.',
      '"Consument": een Klant die handelt buiten zijn beroep of bedrijf (B2C).',
      '"Zakelijke klant" / "B2B": een Klant die handelt in de uitoefening van zijn beroep of bedrijf.',
      '"Maatwerk product": een product dat op specificatie van de Klant wordt vervaardigd via onze configurator.',
      '"Catalogusproduct": een standaard product zonder maatwerkaanpassingen.',
      '"Website": www.blikcart.nl en alle bijbehorende subdomeinen.',
    ],
  },
  {
    title: '2. Toepasselijkheid',
    paragraphs: [
      'Deze algemene voorwaarden zijn van toepassing op alle aanbiedingen, offertes, overeenkomsten en leveringen van Blikcart, zowel B2C als B2B, tenzij schriftelijk anders overeengekomen.',
      'Voor zakelijke klanten sluiten wij de toepasselijkheid van eventuele inkoop- of andere voorwaarden van de Klant uitdrukkelijk uit, tenzij Blikcart deze schriftelijk heeft aanvaard.',
      'Afwijkingen van deze voorwaarden zijn slechts geldig indien uitdrukkelijk schriftelijk overeengekomen.',
    ],
  },
  {
    title: '3. Aanbod en totstandkoming overeenkomst',
    paragraphs: [
      'Alle aanbiedingen op de Website zijn vrijblijvend en kunnen worden ingetrokken, ook na aanvaarding, tenzij een aanvaardingstermijn is vermeld.',
      'Een overeenkomst komt tot stand op het moment dat Blikcart de bestelling of offerteaanvraag schriftelijk (per e-mail) bevestigt, of wanneer Blikcart aanvangt met de uitvoering.',
      'Voor maatwerk producten is de overeenkomst pas definitief nadat de Klant de configuratiespecificatie schriftelijk heeft geaccordeerd.',
    ],
  },
  {
    title: '4. Prijzen en betaling',
    paragraphs: [],
    bullets: [
      'Alle prijzen zijn in euro\'s (€), exclusief BTW (21%), tenzij uitdrukkelijk anders vermeld. BTW wordt bij consumenten separaat getoond en bij zakelijke klanten op de factuur gespecificeerd.',
      'Prijzen kunnen worden gewijzigd. De op het moment van totstandkoming van de overeenkomst geldende prijs is bindend.',
      'Consumenten betalen vooraf via de aangeboden betaalmethoden (iDEAL, creditcard, etc.).',
      'Zakelijke klanten met goedgekeurd B2B-account kunnen betalen op factuur met een betalingstermijn van 14 dagen na factuurdatum, tenzij Net-30 schriftelijk is overeengekomen.',
      'Bij te late betaling is de Klant van rechtswege in verzuim. Blikcart behoudt zich het recht voor de wettelijke handelsrente (art. 6:119a BW) in rekening te brengen bij B2B, en de wettelijke rente (art. 6:119 BW) bij consumenten, alsmede buitengerechtelijke incassokosten conform het Besluit vergoeding voor buitengerechtelijke incassokosten.',
      'Bij niet-tijdige betaling is Blikcart gerechtigd verdere leveringen op te schorten.',
    ],
  },
  {
    title: '5. Maatwerk producten — specifieke bepalingen',
    paragraphs: [
      'Maatwerk producten worden uitsluitend vervaardigd op basis van een door de Klant geaccordeerde configuratiespecificatie. Na accordering zijn wijzigingen niet meer mogelijk zonder meerkosten en mogelijke verlenging van de levertijd.',
    ],
    bullets: [
      'Maatwerk producten zijn uitgezonderd van het herroepingsrecht (art. 6:230p sub f BW) omdat zij specifiek voor de Klant worden vervaardigd.',
      'Blikcart behoudt het recht een aanbetaling van 30–50% te verlangen vóór aanvang van de productie.',
      'De Klant is verantwoordelijk voor de juistheid van de opgegeven specificaties (maten, kleuren, hardware). Blikcart is niet aansprakelijk voor fouten die voortvloeien uit onjuiste specificaties van de Klant.',
    ],
  },
  {
    title: '6. Levertijden en levering',
    paragraphs: [
      'Opgegeven levertijden zijn indicatief en gelden niet als fatale termijn, tenzij uitdrukkelijk schriftelijk anders overeengekomen. Bij consumenten geldt dat Blikcart bij overschrijding van de levertijd met meer dan 30 dagen de consument informeert en de mogelijkheid biedt de overeenkomst te ontbinden.',
    ],
    bullets: [
      'Catalogusproducten: 3–7 werkdagen (NL), 7–14 werkdagen (EU)',
      'Maatwerk producten: 15–45 werkdagen afhankelijk van het product (zie configurator)',
      'Levering geschiedt franco huis bij bestellingen boven €150 (EU). Onder €150 worden verzendkosten apart in rekening gebracht.',
      'Het risico van verlies of beschadiging gaat over op de Klant bij aflevering (consument) of bij overdracht aan de vervoerder (zakelijke klant, art. 7:10 BW).',
    ],
  },
  {
    title: '7. Herroepingsrecht (uitsluitend consumenten)',
    paragraphs: [
      'Consumenten hebben op grond van de Wet Koop op Afstand (implementatie Richtlijn 2011/83/EU) het recht om een overeenkomst voor catalogusproducten binnen 14 kalenderdagen na ontvangst te herroepen, zonder opgave van redenen.',
    ],
    bullets: [
      'Het herroepingsrecht geldt NIET voor maatwerk producten (art. 6:230p sub f BW).',
      'Het herroepingsrecht geldt NIET voor zakelijke klanten (B2B).',
      'Om gebruik te maken van het herroepingsrecht dient de consument dit binnen 14 dagen schriftelijk te melden via info@blikcart.nl of het modelformulier voor herroeping in te vullen.',
      'Het product dient binnen 14 dagen na herroeping geretourneerd te worden, ongebruikt en in originele verpakking.',
      'Retourkosten zijn voor rekening van de consument, tenzij het product defect of onjuist is geleverd.',
      'Terugbetaling vindt plaats binnen 14 dagen na ontvangst van het retour, via dezelfde betaalmethode.',
    ],
  },
  {
    title: '8. Eigendomsvoorbehoud',
    paragraphs: [
      'Alle geleverde producten blijven eigendom van Blikcart totdat de Klant alle verschuldigde bedragen — inclusief eventuele rente en kosten — volledig heeft voldaan (art. 3:92 BW).',
      'Zakelijke klanten zijn niet gerechtigd de producten te vervreemden, verpanden of anderszins te bezwaren zolang het eigendomsvoorbehoud van kracht is.',
    ],
  },
  {
    title: '9. Garantie en conformiteit',
    paragraphs: [
      'Blikcart garandeert dat producten voldoen aan de overeenkomst, de in het aanbod vermelde specificaties en de redelijke eisen van deugdelijkheid en bruikbaarheid.',
    ],
    bullets: [
      'Consumenten: bij non-conformiteit heeft de consument recht op herstel of vervanging (art. 7:21 BW). Gedurende 2 jaar na levering wordt vermoed dat een gebrek bestond bij aflevering.',
      'Zakelijke klanten: defecten dienen binnen 14 dagen na ontvangst schriftelijk te worden gemeld. Blikcart biedt naar eigen keuze herstel, vervanging of creditering.',
      'Slijtage door normaal gebruik, onjuist gebruik of wijzigingen door de Klant vallen niet onder de garantie.',
    ],
  },
  {
    title: '10. Aansprakelijkheid',
    paragraphs: [
      'De aansprakelijkheid van Blikcart is — voor zover wettelijk toegestaan — beperkt tot het bedrag dat voor de betreffende bestelling is betaald. Blikcart is nooit aansprakelijk voor:',
    ],
    bullets: [
      'Indirecte schade, gevolgschade, gederfde winst of omzetderving',
      'Schade als gevolg van onjuiste specificaties door de Klant',
      'Schade veroorzaakt door overmacht (art. 6:75 BW), waaronder pandemieën, stakingen, overheidsmaatregelen, leveringsproblemen van grondstoffen',
    ],
    footer: 'Deze beperking van aansprakelijkheid geldt niet voor schade als gevolg van opzet of bewuste roekeloosheid van Blikcart, of voor schade aan personen.',
  },
  {
    title: '11. Intellectueel eigendom',
    paragraphs: [
      'Alle intellectuele eigendomsrechten op de Website, configuratietool, product designs, foto\'s en marketingmaterialen berusten bij Blikcart of haar licentiegevers. Niets op de Website mag worden verveelvoudigd, opgeslagen of openbaar gemaakt zonder voorafgaande schriftelijke toestemming van Blikcart.',
      'Voor private-label en white-label bestellingen worden afzonderlijke licentieafspraken gemaakt.',
    ],
  },
  {
    title: '12. Klachten',
    paragraphs: [
      'Klachten over producten of diensten dienen zo spoedig mogelijk, doch uiterlijk binnen 14 dagen na ontdekking van het gebrek, schriftelijk te worden gemeld via info@blikcart.nl met vermelding van het ordernummer en, indien van toepassing, foto\'s van het gebrek.',
      'Blikcart streeft ernaar klachten binnen 5 werkdagen af te handelen.',
      'Consumenten kunnen ook een klacht indienen bij de bevoegde rechter of — voor zover van toepassing — bij een erkende geschillencommissie. EU-consumenten kunnen gebruik maken van het ODR-platform: ec.europa.eu/consumers/odr.',
    ],
  },
  {
    title: '13. Toepasselijk recht en bevoegde rechter',
    paragraphs: [
      'Op alle overeenkomsten met Blikcart is uitsluitend Nederlands recht van toepassing, met uitsluiting van het Weens Koopverdrag (CISG).',
      'Voor consumenten: eventuele geschillen worden voorgelegd aan de bevoegde rechter in het arrondissement van de woonplaats van de consument, tenzij de consument kiest voor de rechter in het arrondissement van de vestigingsplaats van Blikcart.',
      'Voor zakelijke klanten: alle geschillen worden bij uitsluiting voorgelegd aan de bevoegde rechter in het arrondissement van de vestigingsplaats van Blikcart.',
    ],
  },
  {
    title: '14. Overige bepalingen',
    paragraphs: [
      'Indien een bepaling van deze voorwaarden nietig of vernietigbaar is, laat dit de geldigheid van de overige bepalingen onverlet. Partijen zullen de nietige bepaling vervangen door een rechtsgeldige bepaling met zoveel mogelijk dezelfde strekking.',
      'Blikcart behoudt zich het recht voor deze voorwaarden te wijzigen. De gewijzigde voorwaarden zijn van toepassing op alle na de wijzigingsdatum gesloten overeenkomsten.',
    ],
  },
];

export default function TermsPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#faf9f7' }}>
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2017 100%)', color: '#fff', padding: 'clamp(56px, 7vw, 88px) 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: '#C8860A', fontWeight: 700, marginBottom: 14 }}>Juridisch</p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.02em' }}>Algemene Voorwaarden</h1>
        <p style={{ fontSize: 16, color: '#aaa', maxWidth: 580, margin: '0 auto', lineHeight: 1.7 }}>
          Van toepassing op alle overeenkomsten gesloten met Blikcart B.V., zowel voor consumenten (B2C) als zakelijke klanten (B2B), conform Nederlands recht.
        </p>
        <p style={{ fontSize: 13, color: '#666', marginTop: 16 }}>Versie april 2026 · Gedeponeerd bij de Kamer van Koophandel</p>
      </section>

      {/* Summary bar */}
      <section style={{ background: '#fff', borderBottom: '1px solid #e8e4de' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          {[
            { label: 'Toepasselijk recht', sub: 'Nederlands recht' },
            { label: 'Herroeping', sub: '14 dagen (B2C, geen maatwerk)' },
            { label: 'Garantie consument', sub: '2 jaar wettelijk' },
            { label: 'Betalingstermijn B2B', sub: '14 dagen (of Net-30)' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '22px 16px', textAlign: 'center', borderRight: i < 3 ? '1px solid #e8e4de' : 'none' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 2 }}>{s.label}</p>
              <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick nav */}
      <section style={{ background: '#f5f0e8', borderBottom: '1px solid #e8e4de', padding: '0 24px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '0 20px', padding: '14px 0' }}>
          {SECTIONS.map((s, i) => (
            <a key={i} href={`#s${i}`} style={{ fontSize: 12, color: '#C8860A', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              {s.title}
            </a>
          ))}
        </div>
      </section>

      {/* Content */}
      <section style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(40px, 5vw, 64px) 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {SECTIONS.map((s, i) => (
            <div key={i} id={`s${i}`} style={{ background: '#fff', borderRadius: 12, padding: '28px 32px', border: '1px solid #e8e4de' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 14, borderBottom: '2px solid #C8860A', paddingBottom: 10, display: 'inline-block' }}>{s.title}</h2>
              {s.paragraphs?.map((p, j) => (
                <p key={j} style={{ color: '#444', lineHeight: 1.8, marginBottom: 10, fontSize: 15 }}>{p}</p>
              ))}
              {s.bullets && (
                <ul style={{ paddingLeft: 20, margin: '8px 0 12px' }}>
                  {s.bullets.map((b, j) => (
                    <li key={j} style={{ color: '#444', lineHeight: 1.8, fontSize: 14, marginBottom: 5 }}>{b}</li>
                  ))}
                </ul>
              )}
              {s.footer && (
                <p style={{ color: '#666', fontSize: 13, lineHeight: 1.7, marginTop: 12, padding: '10px 14px', background: '#f5f0e8', borderRadius: 8, borderLeft: '3px solid #C8860A' }}>{s.footer}</p>
              )}
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div style={{ marginTop: 40, padding: '20px 24px', background: '#fff', borderRadius: 12, border: '1px solid #e8e4de', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#888', lineHeight: 1.7 }}>
            Blikcart B.V. · KvK 12345678 · BTW NL123456789B01<br />
            Vragen? <a href="mailto:info@blikcart.nl" style={{ color: '#C8860A' }}>info@blikcart.nl</a>
          </p>
        </div>

        <div style={{ marginTop: 32, textAlign: 'center', display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/privacy" style={{ color: '#C8860A', fontSize: 14, textDecoration: 'underline' }}>Privacybeleid</Link>
          <Link href="/returns" style={{ color: '#C8860A', fontSize: 14, textDecoration: 'underline' }}>Retourbeleid</Link>
          <Link href="/contact" style={{ color: '#C8860A', fontSize: 14, textDecoration: 'underline' }}>Contact</Link>
        </div>
      </section>
    </main>
  );
}
