import Link from 'next/link';

const SECTIONS = [
  {
    title: '1. Wie zijn wij?',
    paragraphs: [
      'Blikcart B.V. is een besloten vennootschap geregistreerd in Nederland, ingeschreven bij de Kamer van Koophandel onder nummer 12345678 (hierna: "Blikcart", "wij", "ons"). Wij zijn te bereiken via:',
    ],
    contact: [
      'E-mail: privacy@blikcart.nl',
      'Adres: [Straat + nummer], [Postcode] [Stad], Nederland',
      'Telefoonnummer: +31 (0)xx xxx xxxx',
    ],
    footer: 'Blikcart B.V. treedt op als verwerkingsverantwoordelijke in de zin van de Algemene Verordening Gegevensbescherming (AVG / GDPR).',
  },
  {
    title: '2. Welke persoonsgegevens verwerken wij?',
    paragraphs: ['Wij verwerken de volgende categorieën persoonsgegevens:'],
    bullets: [
      'Identiteitsgegevens: naam, functietitel, bedrijfsnaam',
      'Contactgegevens: e-mailadres, telefoonnummer, factuur- en leveringsadres',
      'Accountgegevens: inloggegevens (wachtwoord opgeslagen als gehashte waarde), voorkeuren',
      'Bestelgegevens: productconfiguraties, orderhistorie, offerteaanvragen',
      'Betalingsgegevens: factuurgegevens (geen volledige betaalkaartgegevens — betaling verloopt via gecertificeerde betalingsproviders)',
      'Communicatiegegevens: e-mailcorrespondentie, supporttickets',
      'Technische gegevens: IP-adres, browsertype, apparaatinformatie, sessie-ID (via cookies)',
      'B2B-specifieke gegevens: KvK-nummer, BTW-nummer, kredietlimiet, Net-30-termijnenverzoeken',
    ],
  },
  {
    title: '3. Op welke grondslag en voor welk doel verwerken wij uw gegevens?',
    paragraphs: ['Wij verwerken persoonsgegevens uitsluitend op een van de volgende wettelijke grondslagen:'],
    table: [
      { grondslag: 'Uitvoering overeenkomst (art. 6 lid 1 sub b AVG)', doel: 'Verwerken en leveren van (custom) bestellingen, facturatie, garantieafhandeling' },
      { grondslag: 'Gerechtvaardigd belang (art. 6 lid 1 sub f AVG)', doel: 'Fraudepreventie, IT-beveiliging, verbetering van onze diensten, B2B-relatiebeheer' },
      { grondslag: 'Wettelijke verplichting (art. 6 lid 1 sub c AVG)', doel: 'Bewaarplicht belastingdocumenten (7 jaar, art. 52 AWR), douanedocumenten bij export' },
      { grondslag: 'Toestemming (art. 6 lid 1 sub a AVG)', doel: 'Nieuwsbrief, marketing-e-mails, niet-essentiële cookies — u kunt deze toestemming te allen tijde intrekken' },
    ],
  },
  {
    title: '4. Hoe lang bewaren wij uw gegevens?',
    paragraphs: ['Wij hanteren de volgende bewaartermijnen:'],
    bullets: [
      'Ordergegevens & facturen: 7 jaar (fiscale bewaarplicht ex art. 52 AWR)',
      'Accountgegevens: zolang uw account actief is; na verwijderverzoek worden gegevens binnen 30 dagen gewist, tenzij wettelijk vereist',
      'Marketingtoestemming: tot intrekking van toestemming',
      'Supportcommunicatie: 2 jaar na afsluiting',
      'Webanalytics (geanonimiseerd): maximaal 26 maanden',
    ],
  },
  {
    title: '5. Met wie delen wij uw gegevens?',
    paragraphs: ['Wij delen persoonsgegevens uitsluitend met derden voor zover noodzakelijk en op basis van een verwerkersovereenkomst (art. 28 AVG):'],
    bullets: [
      'Betalingsproviders (bijv. Mollie, Stripe) — voor verwerking van betalingen',
      'Logistieke partners (bijv. PostNL, DHL, DPD) — voor verzending en tracking',
      'Cloud-hostingproviders (AWS EU-West-1, Dublin) — voor opslag en verwerking van gegevens binnen de EU/EER',
      'E-mailproviders (transactionele e-mail) — voor orderbevestigingen en notificaties',
      'Boekhoudplatformen — voor facturatieverwerking',
    ],
    footer: 'Wij verkopen uw persoonsgegevens nooit aan derden. Alle externe verwerkers zijn gevestigd in de EU/EER of beschikken over passende waarborgen (bijv. Standard Contractual Clauses).',
  },
  {
    title: '6. Uw rechten als betrokkene',
    paragraphs: ['Op grond van de AVG heeft u de volgende rechten. U kunt deze uitoefenen via privacy@blikcart.nl:'],
    bullets: [
      'Recht op inzage (art. 15 AVG) — een kopie van uw persoonsgegevens opvragen',
      'Recht op rectificatie (art. 16 AVG) — onjuiste gegevens laten corrigeren',
      'Recht op gegevenswissing (art. 17 AVG) — "recht om vergeten te worden"',
      'Recht op beperking van verwerking (art. 18 AVG)',
      'Recht op dataportabiliteit (art. 20 AVG) — uw gegevens in machineleesbaar formaat ontvangen',
      'Recht van bezwaar (art. 21 AVG) — bezwaar maken tegen verwerking op basis van gerechtvaardigd belang of direct marketing',
      'Recht om toestemming in te trekken — te allen tijde, zonder gevolgen voor de rechtmatigheid van de verwerking vóór intrekking',
    ],
    footer: 'Wij reageren binnen 30 dagen op uw verzoek. U heeft ook het recht om een klacht in te dienen bij de Autoriteit Persoonsgegevens (autoriteitpersoonsgegevens.nl).',
  },
  {
    title: '7. Cookies',
    paragraphs: ['Wij gebruiken de volgende categorieën cookies:'],
    bullets: [
      'Noodzakelijke cookies — sessie, winkelwagen, authenticatie (geen toestemming vereist)',
      'Analytische cookies — geanonimiseerde websitestatistieken (toestemming vereist)',
      'Marketingcookies — retargeting en advertentieplatformen (toestemming vereist)',
    ],
    footer: 'U kunt uw cookievoorkeuren te allen tijde wijzigen via de cookiebanner of uw browserinstellingen.',
  },
  {
    title: '8. Beveiliging',
    paragraphs: [
      'Wij treffen passende technische en organisatorische maatregelen om uw persoonsgegevens te beschermen, waaronder TLS/HTTPS-versleuteling, gehashte wachtwoorden, toegangscontrole op rolbasis en regelmatige beveiligingsaudits.',
      'Bij een datalek met waarschijnlijk hoge risico\'s voor betrokkenen melden wij dit binnen 72 uur aan de Autoriteit Persoonsgegevens (art. 33 AVG) en informeren wij u zonder onnodige vertraging (art. 34 AVG).',
    ],
  },
  {
    title: '9. Wijzigingen in dit beleid',
    paragraphs: [
      'Wij kunnen dit privacybeleid van tijd tot tijd aanpassen. De meest recente versie is altijd beschikbaar op deze pagina. Bij materiële wijzigingen informeren wij u via e-mail of een duidelijke melding op de website.',
    ],
  },
  {
    title: '10. Contact',
    paragraphs: [
      'Voor vragen over dit privacybeleid of de verwerking van uw persoonsgegevens kunt u contact opnemen met onze functionaris voor gegevensbescherming (FG) via:',
    ],
    contact: [
      'E-mail: privacy@blikcart.nl',
      'Post: Blikcart B.V., t.a.v. Privacy, [Adres], Nederland',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#faf9f7' }}>
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2017 100%)', color: '#fff', padding: 'clamp(56px, 7vw, 88px) 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: '#C8860A', fontWeight: 700, marginBottom: 14 }}>Juridisch</p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.02em' }}>Privacybeleid</h1>
        <p style={{ fontSize: 16, color: '#aaa', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
          Blikcart B.V. verwerkt persoonsgegevens conform de AVG (GDPR) en de Nederlandse Uitvoeringswet AVG (UAVG).
        </p>
        <p style={{ fontSize: 13, color: '#666', marginTop: 16 }}>Laatste update: april 2026</p>
      </section>

      {/* Quick nav */}
      <section style={{ background: '#fff', borderBottom: '1px solid #e8e4de', padding: '0 24px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '0 24px', padding: '16px 0' }}>
          {SECTIONS.map((s, i) => (
            <a key={i} href={`#s${i}`} style={{ fontSize: 12, color: '#C8860A', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              {s.title}
            </a>
          ))}
        </div>
      </section>

      {/* Content */}
      <section style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(40px, 5vw, 64px) 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {SECTIONS.map((s, i) => (
            <div key={i} id={`s${i}`} style={{ background: '#fff', borderRadius: 12, padding: '28px 32px', border: '1px solid #e8e4de' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 14, borderBottom: '2px solid #C8860A', paddingBottom: 10, display: 'inline-block' }}>{s.title}</h2>
              {s.paragraphs?.map((p, j) => (
                <p key={j} style={{ color: '#444', lineHeight: 1.8, marginBottom: 12, fontSize: 15 }}>{p}</p>
              ))}
              {s.contact && (
                <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 12px' }}>
                  {s.contact.map((c, j) => (
                    <li key={j} style={{ fontSize: 14, color: '#555', padding: '4px 0', borderBottom: '1px solid #f0ece6' }}>{c}</li>
                  ))}
                </ul>
              )}
              {s.bullets && (
                <ul style={{ paddingLeft: 20, margin: '8px 0 12px' }}>
                  {s.bullets.map((b, j) => (
                    <li key={j} style={{ color: '#444', lineHeight: 1.8, fontSize: 14, marginBottom: 4 }}>{b}</li>
                  ))}
                </ul>
              )}
              {s.table && (
                <div style={{ overflowX: 'auto', marginTop: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: '#f5f0e8' }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#1a1a1a', borderBottom: '2px solid #e8e4de' }}>Grondslag</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#1a1a1a', borderBottom: '2px solid #e8e4de' }}>Doel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.table.map((row, j) => (
                        <tr key={j} style={{ borderBottom: '1px solid #f0ece6', background: j % 2 === 0 ? '#fff' : '#faf9f7' }}>
                          <td style={{ padding: '10px 14px', color: '#555', verticalAlign: 'top', fontWeight: 600 }}>{row.grondslag}</td>
                          <td style={{ padding: '10px 14px', color: '#555', verticalAlign: 'top' }}>{row.doel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {s.footer && (
                <p style={{ color: '#666', fontSize: 13, lineHeight: 1.7, marginTop: 12, padding: '10px 14px', background: '#f5f0e8', borderRadius: 8, borderLeft: '3px solid #C8860A' }}>{s.footer}</p>
              )}
            </div>
          ))}
        </div>

        {/* Footer nav */}
        <div style={{ marginTop: 48, textAlign: 'center', display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/terms" style={{ color: '#C8860A', fontSize: 14, textDecoration: 'underline' }}>Algemene Voorwaarden</Link>
          <Link href="/returns" style={{ color: '#C8860A', fontSize: 14, textDecoration: 'underline' }}>Retourbeleid</Link>
          <Link href="/contact" style={{ color: '#C8860A', fontSize: 14, textDecoration: 'underline' }}>Contact</Link>
        </div>
      </section>
    </main>
  );
}
