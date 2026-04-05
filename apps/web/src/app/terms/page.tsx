import Link from 'next/link';
import { fetchPageContent } from '@/lib/fetchPageContent';

interface PolicySection {
  title: string;
  body: string;
}

interface TermsContent {
  hero: { eyebrow: string; title: string; subtitle: string; version: string };
  sections: PolicySection[];
  company: { name: string; kvk: string; vat: string; eori?: string; email: string };
}

const DEFAULT: TermsContent = {
  hero: {
    eyebrow: 'Legal',
    title: 'Terms & Conditions',
    subtitle: 'Applicable to all agreements with Blikcart, for both consumers (B2C) and business customers (B2B), governed by Dutch law.',
    version: 'Version April 2026 · Filed with the Dutch Chamber of Commerce',
  },
  sections: [
    {
      title: '1. Definitions',
      body: `"Blikcart": Blikcart, KvK 81325357, registered in the Netherlands.
"Customer" / "Buyer": the natural person or legal entity entering into an agreement with Blikcart.
"Consumer": a Customer acting outside the scope of a profession or business (B2C).
"Business Customer" / "B2B": a Customer acting in the exercise of a profession or business.
"Custom Product": a product manufactured to the Customer's specification via our configurator.
"Catalogue Product": a standard product without custom modifications.
"Website": www.blikcart.nl and all associated subdomains.`,
    },
    {
      title: '2. Applicability',
      body: `These terms apply to all offers, quotations, agreements, and deliveries by Blikcart, for both B2C and B2B, unless expressly agreed otherwise in writing.

For business customers, we expressly exclude the applicability of any purchasing or other terms of the Customer, unless Blikcart has accepted them in writing.

Deviations from these terms are only valid if expressly agreed in writing.`,
    },
    {
      title: '3. Offer and formation of agreement',
      body: `All offers on the Website are non-binding and may be withdrawn, even after acceptance, unless an acceptance deadline is stated.

An agreement is concluded at the moment Blikcart confirms the order or quote request in writing (by email), or when Blikcart commences performance.

For custom products, the agreement is only final once the Customer has approved the configuration specification in writing.`,
    },
    {
      title: '4. Prices and payment',
      body: `All prices are in euros (€), exclusive of VAT (21%), unless expressly stated otherwise. VAT is shown separately for consumers and itemised on invoices for business customers.

Prices may change. The price in force at the time the agreement is concluded is binding.

Consumers pay in advance via the available payment methods (iDEAL, credit card, etc.).

Business customers with an approved B2B account may pay by invoice within 14 days of the invoice date, unless Net-30 has been agreed in writing.

In the event of late payment, the Customer is in default by operation of law. Blikcart reserves the right to charge statutory commercial interest (Dutch Civil Code Art. 6:119a) for B2B customers, and statutory interest (Art. 6:119) for consumers, as well as extrajudicial collection costs under the Dutch Extrajudicial Collection Costs Decree.

In the event of non-payment, Blikcart is entitled to suspend further deliveries.`,
    },
    {
      title: '5. Custom products — specific provisions',
      body: `Custom products are only manufactured on the basis of a configuration specification approved by the Customer. After approval, changes are no longer possible without additional costs and a possible extension of the delivery time.

• Custom products are exempt from the right of withdrawal (Dutch Civil Code Art. 6:230p(f)) because they are manufactured specifically for the Customer.
• Blikcart reserves the right to require a deposit of 30–50% before commencing production.
• The Customer is responsible for the accuracy of the specified details (dimensions, colours, hardware). Blikcart is not liable for errors resulting from incorrect specifications provided by the Customer.`,
    },
    {
      title: '6. Delivery times and delivery',
      body: `Stated delivery times are indicative and do not constitute a firm deadline, unless expressly agreed otherwise in writing. For consumers, if the delivery time is exceeded by more than 30 days, Blikcart will inform the consumer and offer the option to dissolve the agreement.

• Catalogue products: 3–7 business days (NL), 7–14 business days (EU)
• Custom products: 15–45 business days depending on the product (see configurator)
• Free delivery on orders over €150 to EU destinations. Below €150, shipping costs are charged separately.
• Risk of loss or damage passes to the Customer upon delivery (consumer) or upon handover to the carrier (business customer, Dutch Civil Code Art. 7:10).`,
    },
    {
      title: '7. Right of withdrawal (consumers only)',
      body: `Consumers have the right to cancel an agreement for catalogue products within 14 calendar days of receipt, without giving reasons, under the Distance Selling Act (implementing EU Directive 2011/83/EU).

• The right of withdrawal does NOT apply to custom products (Dutch Civil Code Art. 6:230p(f)).
• The right of withdrawal does NOT apply to business customers (B2B).
• To exercise the right of withdrawal, the consumer must notify us in writing within 14 days via info@blikcart.nl or by completing the model withdrawal form.
• The product must be returned within 14 days of withdrawal, unused and in its original packaging.
• Return shipping costs are borne by the consumer, unless the product is defective or incorrectly delivered.
• Refunds are processed within 14 days of receiving the return, via the original payment method.`,
    },
    {
      title: '8. Retention of title',
      body: `All delivered products remain the property of Blikcart until the Customer has fully paid all amounts owed — including any interest and costs (Dutch Civil Code Art. 3:92).

Business customers may not transfer, pledge, or otherwise encumber the products while the retention of title is in effect.`,
    },
    {
      title: '9. Warranty and conformity',
      body: `Blikcart warrants that products conform to the agreement, the specifications stated in the offer, and the reasonable standards of quality and usability.

• Consumers: in the event of non-conformity, the consumer has the right to repair or replacement (Dutch Civil Code Art. 7:21). For 2 years after delivery, a defect is presumed to have existed at the time of delivery.
• Business customers: defects must be reported in writing within 14 days of receipt. Blikcart will, at its discretion, offer repair, replacement, or a credit note.
• Wear and tear from normal use, misuse, or modifications by the Customer are not covered by warranty.`,
    },
    {
      title: '10. Liability',
      body: `Blikcart's liability is — to the extent permitted by law — limited to the amount paid for the relevant order. Blikcart is never liable for:

• Indirect damage, consequential damage, loss of profit or revenue
• Damage resulting from incorrect specifications by the Customer
• Damage caused by force majeure (Dutch Civil Code Art. 6:75), including pandemics, strikes, government measures, raw material supply problems

This limitation of liability does not apply to damage resulting from Blikcart's wilful misconduct or deliberate recklessness, or to personal injury.`,
    },
    {
      title: '11. Intellectual property',
      body: `All intellectual property rights in the Website, configurator tool, product designs, photographs, and marketing materials belong to Blikcart or its licensors. Nothing on the Website may be reproduced, stored, or made public without prior written permission from Blikcart.

Separate licence agreements are made for private-label and white-label orders.`,
    },
    {
      title: '12. Complaints',
      body: `Complaints about products or services must be reported in writing as soon as possible, but no later than 14 days after discovery of the defect, via info@blikcart.nl, stating the order number and, if applicable, photographs of the defect.

Blikcart aims to resolve complaints within 5 business days.

Consumers may also submit a complaint to the competent court or — where applicable — to an accredited disputes committee. EU consumers may use the ODR platform: ec.europa.eu/consumers/odr.`,
    },
    {
      title: '13. Governing law and jurisdiction',
      body: `All agreements with Blikcart are governed exclusively by Dutch law, to the exclusion of the Vienna Sales Convention (CISG).

For consumers: any disputes shall be submitted to the competent court in the district of the consumer's place of residence, unless the consumer chooses the court in the district of Blikcart's registered office.

For business customers: all disputes shall be submitted exclusively to the competent court in the district of Blikcart's registered office.`,
    },
    {
      title: '14. Miscellaneous',
      body: `If any provision of these terms is void or voidable, the validity of the remaining provisions is unaffected. The parties shall replace the void provision with a legally valid provision with as similar a scope as possible.

Blikcart reserves the right to amend these terms. The amended terms apply to all agreements concluded after the date of amendment.`,
    },
  ],
  company: {
    name: 'Blikcart',
    kvk: '81325357',
    vat: 'NL003553343B13',
    eori: 'NL3943578360',
    email: 'info@blikcart.nl',
  },
};

export default async function TermsPage() {
  const content = await fetchPageContent<TermsContent>('terms', DEFAULT);

  return (
    <main style={{ minHeight: '100vh', background: '#faf9f7' }}>
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2017 100%)', color: '#fff', padding: 'clamp(56px, 7vw, 88px) 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: '#C8860A', fontWeight: 700, marginBottom: 14 }}>{content.hero.eyebrow}</p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.02em' }}>{content.hero.title}</h1>
        <p style={{ fontSize: 16, color: '#aaa', maxWidth: 580, margin: '0 auto', lineHeight: 1.7 }}>{content.hero.subtitle}</p>
        <p style={{ fontSize: 13, color: '#666', marginTop: 16 }}>{content.hero.version}</p>
      </section>

      {/* Summary bar */}
      <section style={{ background: '#fff', borderBottom: '1px solid #e8e4de' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          {[
            { label: 'Governing law', sub: 'Dutch law' },
            { label: 'Right of withdrawal', sub: '14 days (B2C, no custom goods)' },
            { label: 'Consumer warranty', sub: '2 years statutory' },
            { label: 'B2B payment term', sub: '14 days (or Net-30)' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '22px 16px', textAlign: 'center', borderRight: i < 3 ? '1px solid #e8e4de' : 'none' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 2 }}>{s.label}</p>
              <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Content */}
      <section style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(40px, 5vw, 64px) 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {content.sections.map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '28px 32px', border: '1px solid #e8e4de' }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 14, paddingBottom: 10, borderBottom: '2px solid #C8860A', display: 'inline-block' }}>{s.title}</h2>
              <div style={{ color: '#444', lineHeight: 1.9, fontSize: 14, whiteSpace: 'pre-line' }}>{s.body}</div>
            </div>
          ))}
        </div>

        {/* Company footer */}
        <div style={{ marginTop: 32, background: '#fff', borderRadius: 12, padding: '20px 32px', border: '1px solid #e8e4de', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#888', lineHeight: 1.8 }}>
            {content.company.name} · KvK {content.company.kvk} · VAT {content.company.vat}{content.company.eori ? ` · EORI ${content.company.eori}` : ''}<br />
            Questions? <a href={`mailto:${content.company.email}`} style={{ color: '#C8860A' }}>{content.company.email}</a>
          </p>
        </div>

        <div style={{ marginTop: 32, textAlign: 'center', display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/privacy" style={{ color: '#C8860A', fontSize: 14, textDecoration: 'underline' }}>Privacy Policy</Link>
          <Link href="/returns" style={{ color: '#C8860A', fontSize: 14, textDecoration: 'underline' }}>Returns Policy</Link>
          <Link href="/contact" style={{ color: '#C8860A', fontSize: 14, textDecoration: 'underline' }}>Contact Us</Link>
        </div>
      </section>
    </main>
  );
}
