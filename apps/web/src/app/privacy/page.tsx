import Link from 'next/link';
import { fetchPageContent } from '@/lib/fetchPageContent';

interface PolicySection {
  title: string;
  body: string;
}

interface PrivacyContent {
  hero: { eyebrow: string; title: string; subtitle: string; lastUpdated: string };
  intro: string;
  sections: PolicySection[];
  contact: { email: string; address: string; phone: string };
}

const DEFAULT: PrivacyContent = {
  hero: {
    eyebrow: 'Legal',
    title: 'Privacy Policy',
    subtitle: 'Blikcart B.V. processes personal data in accordance with the GDPR (EU 2016/679) and the Dutch GDPR Implementation Act (UAVG).',
    lastUpdated: 'April 2026',
  },
  intro: 'Blikcart B.V. is a Dutch private limited company registered with the Dutch Chamber of Commerce (KvK) under number 81325357 ("Blikcart", "we", "us"). We act as data controller within the meaning of the General Data Protection Regulation (GDPR).',
  sections: [
    {
      title: '1. What data do we collect?',
      body: `We collect the following categories of personal data:
• Identity data: name, job title, company name
• Contact data: email address, phone number, billing and delivery address
• Account data: login credentials (passwords stored as hashed values), preferences
• Order data: product configurations, order history, quote requests
• Payment data: invoice details (no full card data — payments processed via certified payment providers)
• Communication data: email correspondence, support tickets
• Technical data: IP address, browser type, device info, session ID (via cookies)
• B2B-specific data: Chamber of Commerce number, VAT number, credit limit, Net-30 payment term requests`,
    },
    {
      title: '2. Legal basis and purpose of processing',
      body: `We process personal data only on one of the following legal bases (Art. 6 GDPR):

Performance of contract (Art. 6(1)(b)): Processing and delivering (custom) orders, invoicing, warranty handling.

Legitimate interest (Art. 6(1)(f)): Fraud prevention, IT security, service improvement, B2B relationship management.

Legal obligation (Art. 6(1)(c)): Tax record retention (7 years, Dutch Tax Law art. 52 AWR), export customs documentation.

Consent (Art. 6(1)(a)): Newsletter, marketing emails, non-essential cookies — you may withdraw consent at any time.`,
    },
    {
      title: '3. How long do we retain your data?',
      body: `We apply the following retention periods:
• Order data & invoices: 7 years (statutory fiscal retention obligation)
• Account data: for as long as your account is active; upon deletion request, data is removed within 30 days unless legally required
• Marketing consent: until withdrawal of consent
• Support communication: 2 years after closure
• Web analytics (anonymised): maximum 26 months`,
    },
    {
      title: '4. Who do we share your data with?',
      body: `We share personal data with third parties only to the extent necessary and under a data processing agreement (Art. 28 GDPR):
• Payment providers (e.g. Mollie, Stripe) — for payment processing
• Logistics partners (e.g. PostNL, DHL, DPD) — for shipping and tracking
• Cloud hosting providers (AWS EU-West-1, Dublin) — for storage and processing within the EU/EEA
• Email providers (transactional email) — for order confirmations and notifications
• Accounting platforms — for invoice processing

We never sell your personal data to third parties. All external processors are located in the EU/EEA or have appropriate safeguards in place (e.g. Standard Contractual Clauses).`,
    },
    {
      title: '5. Your rights as a data subject',
      body: `Under the GDPR you have the following rights. Exercise them via privacy@blikcart.nl:
• Right of access (Art. 15) — request a copy of your personal data
• Right to rectification (Art. 16) — have inaccurate data corrected
• Right to erasure (Art. 17) — "right to be forgotten"
• Right to restriction of processing (Art. 18)
• Right to data portability (Art. 20) — receive your data in machine-readable format
• Right to object (Art. 21) — object to processing based on legitimate interest or direct marketing
• Right to withdraw consent — at any time, without affecting the lawfulness of processing before withdrawal

We respond to your request within 30 days. You also have the right to lodge a complaint with the Dutch Data Protection Authority (Autoriteit Persoonsgegevens — autoriteitpersoonsgegevens.nl).`,
    },
    {
      title: '6. Cookies',
      body: `We use the following categories of cookies:
• Necessary cookies — session, cart, authentication (no consent required)
• Analytical cookies — anonymised website statistics (consent required)
• Marketing cookies — retargeting and advertising platforms (consent required)

You can change your cookie preferences at any time via the cookie banner or your browser settings.`,
    },
    {
      title: '7. Security',
      body: `We implement appropriate technical and organisational measures to protect your personal data, including TLS/HTTPS encryption, hashed passwords, role-based access controls, and regular security audits.

In the event of a data breach with likely high risks to data subjects, we will notify the Dutch Data Protection Authority within 72 hours (Art. 33 GDPR) and inform you without undue delay (Art. 34 GDPR).`,
    },
    {
      title: '8. Changes to this policy',
      body: `We may update this privacy policy from time to time. The most recent version is always available on this page. For material changes, we will notify you by email or through a prominent notice on the website.`,
    },
  ],
  contact: {
    email: 'privacy@blikcart.nl',
    address: 'Blikcart., Livingstonelaan 262, 3526 HV Utrecht, The Netherlands',
    phone: '+31 (0)626475215',
  },
};

export default async function PrivacyPage() {
  const content = await fetchPageContent<PrivacyContent>('privacy', DEFAULT);

  return (
    <main style={{ minHeight: '100vh', background: '#faf9f7' }}>
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2017 100%)', color: '#fff', padding: 'clamp(56px, 7vw, 88px) 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: '#C8860A', fontWeight: 700, marginBottom: 14 }}>{content.hero.eyebrow}</p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.02em' }}>{content.hero.title}</h1>
        <p style={{ fontSize: 16, color: '#aaa', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>{content.hero.subtitle}</p>
        <p style={{ fontSize: 13, color: '#666', marginTop: 16 }}>Last updated: {content.hero.lastUpdated}</p>
      </section>

      {/* Content */}
      <section style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(40px, 5vw, 64px) 24px' }}>

        {/* Intro */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '24px 32px', border: '1px solid #e8e4de', marginBottom: 32 }}>
          <p style={{ color: '#444', lineHeight: 1.8, fontSize: 15, margin: 0 }}>{content.intro}</p>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {content.sections.map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '28px 32px', border: '1px solid #e8e4de' }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 14, paddingBottom: 10, borderBottom: '2px solid #C8860A', display: 'inline-block' }}>{s.title}</h2>
              <div style={{ color: '#444', lineHeight: 1.9, fontSize: 14, whiteSpace: 'pre-line' }}>{s.body}</div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '24px 32px', border: '1px solid #e8e4de', marginTop: 24 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 14, paddingBottom: 10, borderBottom: '2px solid #C8860A', display: 'inline-block' }}>Contact</h2>
          <p style={{ color: '#444', fontSize: 14, marginBottom: 12 }}>For questions about this policy or the processing of your personal data:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ fontSize: 14, color: '#555' }}>Email: <a href={`mailto:${content.contact.email}`} style={{ color: '#C8860A' }}>{content.contact.email}</a></p>
            <p style={{ fontSize: 14, color: '#555' }}>Post: {content.contact.address}</p>
            {content.contact.phone && <p style={{ fontSize: 14, color: '#555' }}>Phone: {content.contact.phone}</p>}
          </div>
        </div>

        {/* Footer nav */}
        <div style={{ marginTop: 40, textAlign: 'center', display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/terms" style={{ color: '#C8860A', fontSize: 14, textDecoration: 'underline' }}>Terms & Conditions</Link>
          <Link href="/returns" style={{ color: '#C8860A', fontSize: 14, textDecoration: 'underline' }}>Returns Policy</Link>
          <Link href="/contact" style={{ color: '#C8860A', fontSize: 14, textDecoration: 'underline' }}>Contact Us</Link>
        </div>
      </section>
    </main>
  );
}
