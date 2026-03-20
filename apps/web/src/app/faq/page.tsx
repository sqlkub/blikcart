'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

// Fallback shown when the CMS has no FAQs yet
const FALLBACK_FAQS = [
  {
    category: 'Custom Orders',
    items: [
      { q: 'How does the custom order process work?', a: 'Use our guided configurator to choose your product options step by step. When done, submit your configuration as a quote request — no payment upfront. We review and confirm within 24 hours, then you approve and pay.' },
      { q: 'Can I see the price before committing?', a: 'Yes. Our configurator shows a live price estimate that updates as you make each selection. The final confirmed price is sent with your quote approval, and is always within 5% of the estimate.' },
      { q: 'Is there a minimum order quantity?', a: 'MOQ varies by product: Bridles, browbands, and head collars start at 1 unit. Saddle pads and numnahs require 5 units minimum. Rugs require 3 units and leg boots 4 units.' },
    ],
  },
  {
    category: 'Pricing & Payment',
    items: [
      { q: 'What payment methods do you accept?', a: 'We accept all major credit/debit cards, bank transfer, and iDEAL (Netherlands). Approved wholesale accounts can use Net-30 terms.' },
      { q: 'Are prices inclusive of VAT?', a: 'Prices shown are exclusive of VAT. Dutch VAT (21%) is added at checkout for EU customers. Non-EU business buyers can apply for VAT exemption at checkout.' },
      { q: 'Do you offer volume discounts?', a: 'Yes. Automatic discounts apply: 5–19 units: 2% off · 20–49 units: 5% off · 50–99 units: 10% off · 100+ units: 15% off.' },
    ],
  },
  {
    category: 'Production & Lead Times',
    items: [
      { q: 'How long does production take?', a: 'Lead times depend on the product. Browbands and head collars: 15–20 days. Bridles and Halters: 30–45 days. Rugs: 25–30 days. Express production is available on most lines at a 25% price premium.' },
      { q: 'Can I track my order during production?', a: "Yes. Your order page in My Account shows status updates: Draft → Confirmed → In Production → Quality Check → Dispatched. You'll also receive email notifications at each stage." },
    ],
  },
  {
    category: 'Shipping & Delivery',
    items: [
      { q: 'Where do you ship?', a: 'We ship worldwide. Standard delivery to most EU countries takes 10–15 business days after dispatch.' },
      { q: 'How much does shipping cost?', a: 'Shipping is free on orders over €150 to EU destinations. Below €150, standard EU shipping is €9.95. Non-EU rates are calculated at checkout.' },
    ],
  },
  {
    category: 'Returns & Refunds',
    items: [
      { q: 'Can I return a custom order?', a: "Custom-made items are non-returnable unless they arrive defective or materially different from the approved specification." },
      { q: 'What if my order arrives damaged or incorrect?', a: 'Contact us within 48 hours of delivery at info@blikcart.nl with photos. We will arrange a replacement or full refund at no cost to you.' },
    ],
  },
  {
    category: 'Wholesale & B2B',
    items: [
      { q: 'How do I apply for a wholesale account?', a: "Visit our Wholesale page and complete the application form. We'll respond within 1 business day." },
      { q: 'Can I get private-label or white-label products?', a: 'Yes. We offer custom branding on most product lines. Contact info@blikcart.nl for details.' },
    ],
  },
];

type FaqItem = { q: string; a: string };
type FaqGroup = { category: string; items: FaqItem[] };

export default function FaqPage() {
  const [groups, setGroups] = useState<FaqGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/content/faqs`)
      .then(r => r.ok ? r.json() : [])
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const map: Record<string, FaqItem[]> = {};
          data
            .filter(f => f.isActive !== false)
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .forEach(f => {
              const cat = f.categorySlug || 'General';
              if (!map[cat]) map[cat] = [];
              map[cat].push({ q: f.question, a: f.answer });
            });
          const grouped = Object.entries(map).map(([category, items]) => ({ category, items }));
          setGroups(grouped.length > 0 ? grouped : FALLBACK_FAQS);
        } else {
          setGroups(FALLBACK_FAQS);
        }
      })
      .catch(() => setGroups(FALLBACK_FAQS))
      .finally(() => setLoading(false));
  }, []);

  function toggle(key: string) {
    setOpen(prev => prev === key ? null : key);
  }

  return (
    <main style={{ minHeight: '100vh', background: '#faf9f7' }}>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2017 100%)', color: '#fff', padding: 'clamp(56px, 7vw, 88px) 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: '#C8860A', fontWeight: 700, marginBottom: 14 }}>Help Centre</p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.02em' }}>Frequently Asked Questions</h1>
        <p style={{ fontSize: 16, color: '#aaa', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
          Everything you need to know about custom orders, shipping, pricing, and more.
        </p>
      </section>

      {/* Jump links */}
      {!loading && (
        <section style={{ background: '#fff', borderBottom: '1px solid #e8e4de' }}>
          <div style={{ maxWidth: 860, margin: '0 auto', padding: '16px 24px', display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {groups.map(cat => (
              <a key={cat.category} href={`#${cat.category.replace(/\s+&\s+|\s+/g, '-').toLowerCase()}`}
                style={{ fontSize: 13, fontWeight: 600, color: '#555', padding: '6px 14px', borderRadius: 20, background: '#f5f5f5', textDecoration: 'none', border: '1px solid #e8e4de' }}>
                {cat.category}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* FAQ sections */}
      <section style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(40px, 5vw, 64px) 24px' }}>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 12, padding: '18px 20px', height: 56 }} />
            ))}
          </div>
        ) : (
          groups.map(cat => (
            <div key={cat.category} id={cat.category.replace(/\s+&\s+|\s+/g, '-').toLowerCase()} style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', marginBottom: 16 }}>{cat.category}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cat.items.map((item, idx) => {
                  const key = `${cat.category}-${idx}`;
                  const isOpen = open === key;
                  return (
                    <div key={key} style={{ background: '#fff', border: `1.5px solid ${isOpen ? '#C8860A' : '#e8e4de'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.15s' }}>
                      <button onClick={() => toggle(key)} style={{ width: '100%', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', flex: 1 }}>{item.q}</span>
                        <span style={{ color: '#C8860A', flexShrink: 0, fontSize: 18, fontWeight: 300, transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>+</span>
                      </button>
                      {isOpen && (
                        <div style={{ padding: '0 20px 18px' }}>
                          <p style={{ margin: 0, fontSize: 13.5, color: '#555', lineHeight: 1.75 }}>{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* Still need help */}
        <div style={{ background: '#1a1a1a', borderRadius: 16, padding: 'clamp(28px, 4vw, 40px)', textAlign: 'center', color: '#fff' }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>Still have questions?</h3>
          <p style={{ color: '#888', fontSize: 14, marginBottom: 24 }}>Our team responds within one business day.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/contact" style={{ background: '#C8860A', color: '#fff', fontWeight: 700, padding: '11px 24px', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}>
              Contact Us
            </Link>
            <a href="mailto:info@blikcart.nl" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', fontWeight: 600, padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontSize: 14, border: '1px solid rgba(255,255,255,0.12)' }}>
              info@blikcart.nl
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
