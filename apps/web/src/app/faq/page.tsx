'use client';
import { useState } from 'react';
import Link from 'next/link';

const FAQS = [
  {
    category: 'Custom Orders',
    items: [
      { q: 'How does the custom order process work?', a: 'Use our guided configurator to choose your product options step by step. When done, submit your configuration as a quote request — no payment upfront. We review and confirm within 24 hours, then you approve and pay.' },
      { q: 'Can I see the price before committing?', a: 'Yes. Our configurator shows a live price estimate that updates as you make each selection. The final confirmed price is sent with your quote approval, and is always within 5% of the estimate.' },
      { q: 'Can I request changes after submitting?', a: 'Yes — before you approve and pay the quote, you can request any revisions. Once payment is received and production starts, changes may incur additional charges.' },
      { q: 'Is there a minimum order quantity?', a: 'MOQ varies by product: Bridles, browbands, and head collars start at 1 unit. Saddle pads and numnahs require 5 units minimum. Rugs require 3 units and leg boots 4 units.' },
      { q: 'Can I upload reference images or files?', a: "The configurator's Notes & References step lets you upload images, PDFs, or other files (up to 20 MB each). Useful for colour references, logo artwork, or measurements." },
    ],
  },
  {
    category: 'Pricing & Payment',
    items: [
      { q: 'What payment methods do you accept?', a: 'We accept all major credit/debit cards, bank transfer, and iDEAL (Netherlands). Approved wholesale accounts can use Net-30 terms.' },
      { q: 'Are prices inclusive of VAT?', a: 'Prices shown are exclusive of VAT. Dutch VAT (21%) is added at checkout for EU customers. Non-EU business buyers can apply for VAT exemption at checkout.' },
      { q: 'Do you offer volume discounts?', a: 'Yes. Automatic discounts apply: 5–19 units: 10% off · 20–49 units: 15% off · 50–99 units: 20% off · 100+ units: 30% off. These apply to both catalogue and custom orders.' },
    ],
  },
  {
    category: 'Production & Lead Times',
    items: [
      { q: 'How long does production take?', a: 'Lead times depend on the product. Browbands and head collars: 7–12 days. Bridles and leg boots: 10–14 days. Rugs: 14–21 days. Express production (typically halved lead time) is available on most lines at a 25% price premium.' },
      { q: 'Does my order go into production immediately?', a: "Production starts after you approve the quote and complete payment. You'll receive a production start confirmation email." },
      { q: 'Can I track my order during production?', a: "Yes. Your order page in My Account shows status updates: Draft → Confirmed → In Production → Quality Check → Dispatched. You'll also receive email notifications at each stage." },
    ],
  },
  {
    category: 'Shipping & Delivery',
    items: [
      { q: 'Where do you ship?', a: 'We ship worldwide. Standard delivery to most EU countries takes 2–5 business days after dispatch. Non-EU destinations take 5–10 business days. Express courier options are available at checkout.' },
      { q: 'How much does shipping cost?', a: 'Shipping is free on orders over €150 to EU destinations. Below €150, standard EU shipping is €9.95. Non-EU rates are calculated at checkout based on weight and destination.' },
      { q: 'Do I get a tracking number?', a: 'Yes. A tracking link is emailed to you as soon as your parcel is handed to the carrier.' },
    ],
  },
  {
    category: 'Returns & Refunds',
    items: [
      { q: 'Can I return a custom order?', a: "Custom-made items are non-returnable unless they arrive defective or materially different from the approved specification. We take quality control seriously — every item is inspected before dispatch." },
      { q: 'What if my order arrives damaged or incorrect?', a: 'Contact us within 48 hours of delivery at support@blikcart.nl with photos. We will arrange a replacement or full refund at no cost to you.' },
      { q: 'How do I return a standard (non-custom) product?', a: 'Standard catalogue products can be returned within 14 days of delivery, unused and in original packaging. Initiate a return from your account order page. Return shipping is at your cost unless the item was faulty.' },
    ],
  },
  {
    category: 'Wholesale & B2B',
    items: [
      { q: 'How do I apply for a wholesale account?', a: "Visit our Wholesale page and complete the application form. We'll respond within 1 business day. Approved accounts receive a dedicated portal login, custom pricing, and a named account manager." },
      { q: 'What are the Net-30 payment terms?', a: 'Approved accounts with a trading history of 3+ orders can apply for Net-30 invoicing. This means payment is due 30 days after invoice date.' },
      { q: 'Can I get private-label or white-label products?', a: 'Yes. We offer custom branding (embossed logo, branded packaging, custom labels) on most product lines. Minimum orders apply. Contact wholesale@blikcart.nl for more details.' },
    ],
  },
];

export default function FaqPage() {
  const [open, setOpen] = useState<string | null>(null);

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
      <section style={{ background: '#fff', borderBottom: '1px solid #e8e4de' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '16px 24px', display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {FAQS.map(cat => (
            <a key={cat.category} href={`#${cat.category.replace(/\s+&\s+|\s+/g, '-').toLowerCase()}`}
              style={{ fontSize: 13, fontWeight: 600, color: '#555', padding: '6px 14px', borderRadius: 20, background: '#f5f5f5', textDecoration: 'none', border: '1px solid #e8e4de' }}>
              {cat.category}
            </a>
          ))}
        </div>
      </section>

      {/* FAQ sections */}
      <section style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(40px, 5vw, 64px) 24px' }}>
        {FAQS.map(cat => (
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
        ))}

        {/* Still need help */}
        <div style={{ background: '#1a1a1a', borderRadius: 16, padding: 'clamp(28px, 4vw, 40px)', textAlign: 'center', color: '#fff' }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>Still have questions?</h3>
          <p style={{ color: '#888', fontSize: 14, marginBottom: 24 }}>Our team responds within one business day.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/contact" style={{ background: '#C8860A', color: '#fff', fontWeight: 700, padding: '11px 24px', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}>
              Contact Us
            </Link>
            <a href="mailto:support@blikcart.nl" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', fontWeight: 600, padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontSize: 14, border: '1px solid rgba(255,255,255,0.12)' }}>
              support@blikcart.nl
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
