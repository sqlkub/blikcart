import Link from 'next/link';
import { fetchPageContent } from '@/lib/fetchPageContent';

const DEFAULT = {
  hero: { eyebrow: 'Policies', title: 'Returns & Refunds', subtitle: 'Custom-made items are non-returnable unless defective. Standard products have a 14-day return window.' },
  summaryCards: [
    { label: 'Custom items', sub: 'Non-returnable (unless defective)' },
    { label: 'Catalogue items', sub: '14-day return window' },
    { label: 'Refund speed', sub: 'Within 5 business days' },
    { label: 'Start a return', sub: 'support@blikcart.nl' },
  ],
  sections: [
    { title: 'Custom-Made Items', paragraphs: ['All products made to your specification through our configurator are custom-made and are therefore exempt from standard distance-selling return rights under EU consumer law.', 'Custom items cannot be returned or exchanged unless they:'], bullets: ['Arrive materially different from your confirmed, approved specification', 'Are defective due to a manufacturing fault', 'Are damaged in transit'], footer: 'If any of the above apply, please contact us within 48 hours of delivery. We will arrange a free replacement or full refund.' },
    { title: 'Standard Catalogue Products', paragraphs: ['Ready-made products ordered from our standard catalogue may be returned within 14 days of delivery, provided:'], bullets: ['The item is unused and in its original, undamaged packaging', 'A return request is initiated from your account order page before the 14-day window closes', 'The item was not a sale/clearance item (marked "Final Sale" at time of purchase)'], footer: "Return shipping is at the customer's expense unless the item arrived faulty. Once received and inspected, refunds are processed within 5 business days to the original payment method." },
    { title: 'Damaged or Incorrect Items', paragraphs: ['If your order arrives damaged or does not match your approved specification:'], bullets: ['Email support@blikcart.nl within 48 hours of delivery', 'Include your order number and clear photos of the issue', 'We will review and respond within one business day', 'Approved claims receive a free replacement or full refund — your choice'], footer: '' },
    { title: 'How to Initiate a Return', paragraphs: ['For eligible standard-product returns:'], bullets: ['Log in to your account and open the relevant order', 'Click "Request Return" and select your reason', "We'll email you a return shipping label (cost deducted from refund for non-faulty items)", 'Pack the item securely and drop it off at any PostNL, DPD, or DHL point', 'Refund is processed within 5 business days of receipt'], footer: '' },
  ],
  cta: { title: 'Need to Report a Problem?', body: 'Contact us within 48 hours of delivery with your order number and photos.', email: 'support@blikcart.nl', lastUpdated: 'March 2026' },
};

export default async function ReturnsPage() {
  const content = await fetchPageContent('returns', DEFAULT);
  return (
    <main style={{ minHeight: '100vh', background: '#faf9f7' }}>
      <section style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2017 100%)', color: '#fff', padding: 'clamp(56px, 7vw, 88px) 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: '#C8860A', fontWeight: 700, marginBottom: 14 }}>{content.hero.eyebrow}</p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.02em' }}>{content.hero.title}</h1>
        <p style={{ fontSize: 16, color: '#aaa', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>{content.hero.subtitle}</p>
      </section>
      <section style={{ background: '#fff', borderBottom: '1px solid #e8e4de' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          {content.summaryCards.map((s: any, i: number) => (
            <div key={i} style={{ padding: '22px 16px', textAlign: 'center', borderRight: i < content.summaryCards.length - 1 ? '1px solid #e8e4de' : 'none' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 2 }}>{s.label}</p>
              <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </section>
      <section style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(40px, 5vw, 64px) 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {content.sections.map((s: any, i: number) => (
            <div key={i} style={{ background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 16, padding: 'clamp(24px, 3vw, 36px)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', marginBottom: 14 }}>{s.title}</h2>
              {(s.paragraphs || []).map((p: string, j: number) => (
                <p key={j} style={{ fontSize: 14, color: '#444', lineHeight: 1.75, marginBottom: 10 }}>{p}</p>
              ))}
              {s.bullets?.length > 0 && (
                <ul style={{ margin: '8px 0 12px 0', paddingLeft: 20 }}>
                  {s.bullets.map((b: string, k: number) => (
                    <li key={k} style={{ fontSize: 14, color: '#555', lineHeight: 1.75, marginBottom: 4 }}>{b}</li>
                  ))}
                </ul>
              )}
              {s.footer && <p style={{ fontSize: 14, color: '#444', lineHeight: 1.75, borderTop: '1px solid #f0ece7', paddingTop: 14, marginTop: 8 }}>{s.footer}</p>}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 32, background: '#1a1a1a', borderRadius: 16, padding: 'clamp(24px, 3vw, 36px)', textAlign: 'center', color: '#fff' }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>{content.cta.title}</h3>
          <p style={{ color: '#888', fontSize: 14, marginBottom: 20 }}>{content.cta.body}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={`mailto:${content.cta.email}`} style={{ background: '#C8860A', color: '#fff', fontWeight: 700, padding: '11px 24px', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}>{content.cta.email}</a>
            <Link href="/contact" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', fontWeight: 600, padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontSize: 14, border: '1px solid rgba(255,255,255,0.12)' }}>Contact Form</Link>
          </div>
          {content.cta.lastUpdated && <p style={{ fontSize: 12, color: '#555', marginTop: 14 }}>Last updated: {content.cta.lastUpdated} · Governed by Dutch law (Burgerlijk Wetboek)</p>}
        </div>
      </section>
    </main>
  );
}
