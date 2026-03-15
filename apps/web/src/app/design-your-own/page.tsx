'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

const PHASE_STYLES: Record<string, { bg: string; border: string; color: string; label: string }> = {
  'You':       { bg: '#fff8ec', border: '#f0d080', color: '#C8860A',  label: 'You' },
  'Blikcart':  { bg: '#f0f0f0', border: '#d0d0d0', color: '#1a1a1a',  label: 'Blikcart' },
  'Delivered': { bg: '#f0fdf4', border: '#86efac', color: '#166534',  label: 'Delivered' },
};

const DEFAULT = {
  hero: {
    eyebrow: 'Bespoke Manufacturing',
    title: 'Design Your Own',
    subtitle: "From first click to your door — here's exactly how the Blikcart custom order process works.",
  },
  stats: [
    { num: '7',    label: 'Product Categories' },
    { num: '24h',  label: 'Quote Turnaround' },
    { num: '7–21', label: 'Days Lead Time' },
    { num: '30%',  label: 'Max Volume Discount' },
  ],
  lifecycle: [
    { phase: 'You',      step: 1, title: 'Choose a Category',    desc: 'Pick the product you want to customise. Each category has its own guided configurator tailored to that product.' },
    { phase: 'You',      step: 2, title: 'Configure Your Design', desc: 'Step through material, colour, hardware, stitching, sizing, and delivery options. A live price updates with every choice.' },
    { phase: 'You',      step: 3, title: 'Submit for Quote',      desc: 'No payment required yet. Your full specification is sent to our team for review and final pricing.' },
    { phase: 'You',      step: 4, title: 'Approve & Pay',         desc: 'We confirm the final price within 24 hours. You review, approve, and pay to release your order into production.' },
    { phase: 'Blikcart', step: 5, title: 'Production Starts',     desc: 'Your order enters our manufacturing queue. Our craftspeople begin production to your exact specification.' },
    { phase: 'Blikcart', step: 6, title: '12-Point Quality Check',desc: 'Every finished item is inspected against your original specification before it leaves our workshop.' },
    { phase: 'Blikcart', step: 7, title: 'Packed & Dispatched',   desc: 'Your order is carefully packed and handed to our courier. You receive a tracking link by email.' },
    { phase: 'Delivered',step: 8, title: 'Delivered to You',      desc: 'Your custom order arrives at your door. EU delivery typically takes 2–5 business days after dispatch.' },
  ],
  categories: [
    { slug: 'bridles',      name: 'Bridles',      description: 'Custom-fitted leather bridles in 4 styles, 3 materials, 8 colours, and 4 hardware finishes.',   leadTime: '10–14 days', minOrder: 1, steps: 9 },
    { slug: 'browbands',    name: 'Browbands',    description: 'Plain leather, crystal-set, or embroidered. Your colours, your pattern.',                        leadTime: '7–10 days',  minOrder: 1, steps: 7 },
    { slug: 'saddle-pads',  name: 'Saddle Pads',  description: 'GP, dressage, or jumping cut. Choose fabric, colour, piping, and embroidery.',                  leadTime: '7–10 days',  minOrder: 5, steps: 8 },
    { slug: 'rugs',         name: 'Horse Rugs',   description: 'Turnout and stable rugs. Select weight, lining, colour, and custom fit.',                       leadTime: '14–21 days', minOrder: 3, steps: 8 },
    { slug: 'head-collars', name: 'Head Collars', description: 'Leather or nylon with optional name plate. Multiple colour combinations.',                      leadTime: '7–12 days',  minOrder: 1, steps: 6 },
    { slug: 'numnahs',      name: 'Numnahs',      description: 'Quilted and fleece-lined. Match your saddle pad or create a contrast.',                         leadTime: '7–10 days',  minOrder: 5, steps: 7 },
    { slug: 'boots',        name: 'Leg Boots',    description: 'Brushing, tendon, and over-reach styles. Choose colour, fastening, and lining.',                leadTime: '10–14 days', minOrder: 4, steps: 7 },
  ],
  whyBlikcart: [
    { title: 'Direct from Workshop',  desc: 'No middlemen. We manufacture everything in-house at our Amsterdam workshop.' },
    { title: 'Live Price Preview',    desc: 'See the exact price as you configure. No surprises at checkout.' },
    { title: '24h Quote Confirmation',desc: 'We review every order and confirm within one business day.' },
    { title: '12-Point QC',           desc: "Every item is inspected before dispatch. We won't ship anything we wouldn't use ourselves." },
    { title: 'Wholesale Pricing',     desc: 'Volume discounts from 5 units. Up to 30% off for orders of 100+.' },
    { title: 'EU-Wide Delivery',      desc: 'Free shipping over €150. Standard EU delivery in 2–5 days after dispatch.' },
  ],
  faqs: [
    { q: 'Do I need to pay before the quote is confirmed?', a: 'No. You configure and submit for free. Payment is only requested after you approve the final quote.' },
    { q: 'Can I make changes after submitting?',            a: 'Yes — before you approve the quote you can request any revisions. Once payment is made and production starts, changes may incur additional charges.' },
    { q: 'Is there a minimum order quantity?',              a: 'Bridles, browbands, and head collars start at 1 unit. Other products have MOQs of 3–5 units. MOQ is shown on each category card.' },
    { q: 'How accurate is the live price?',                 a: 'The configurator price is typically within 5% of the final confirmed quote. Any difference is explained in the quote email.' },
  ],
  finalCta: {
    title: 'Ready to Start?',
    body: 'Pick a category above, or jump straight into our most popular configurator — bridles.',
  },
};

export default function DesignYourOwnPage() {
  const router = useRouter();
  const [content, setContent] = useState(DEFAULT);

  useEffect(() => {
    fetch(`${API}/content/pages/design-your-own`)
      .then(r => r.ok ? r.json() : null)
      .then(p => { if (p?.content) try { setContent(JSON.parse(p.content)); } catch {} })
      .catch(() => {});
  }, []);

  return (
    <main style={{ minHeight: '100vh', background: '#faf9f7' }}>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2017 100%)', color: '#fff', padding: 'clamp(56px, 8vw, 96px) 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', border: '1px solid rgba(200,134,10,0.12)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>
          <p style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: '#C8860A', marginBottom: 18, fontWeight: 700 }}>{content.hero.eyebrow}</p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, margin: '0 0 20px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>{content.hero.title}</h1>
          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: '#aaa', margin: '0 auto 32px', lineHeight: 1.75, maxWidth: 560 }}>
            {content.hero.subtitle}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#start" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#C8860A', color: 'white', padding: '13px 28px', borderRadius: 8, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
              Start Designing <ArrowRight size={16} />
            </a>
            <a href="#how-it-works" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.9)', padding: '12px 24px', borderRadius: 8, fontWeight: 600, fontSize: 15, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)' }}>
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ background: '#fff', borderBottom: '1px solid #e8e4de' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 24px', display: 'flex', justifyContent: 'center', gap: 'clamp(24px, 5vw, 72px)', flexWrap: 'wrap' }}>
          {content.stats.map((s: any) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#C8860A', lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Process Lifecycle */}
      <section id="how-it-works" style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(48px, 6vw, 80px) 24px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: '#C8860A', fontWeight: 700, marginBottom: 12 }}>The Process</p>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800, color: '#1a1a1a', margin: '0 0 12px' }}>From Idea to Doorstep</h2>
          <p style={{ fontSize: 15, color: '#777', maxWidth: 520, margin: '0 auto' }}>Eight clear stages. The first four are yours — the rest is on us.</p>
        </div>

        {/* Phase legend */}
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 40, flexWrap: 'wrap' }}>
          {[
            { label: 'Your steps',     dot: '#C8860A' },
            { label: 'Blikcart steps', dot: '#374151' },
            { label: 'Delivery',       dot: '#059669' },
          ].map(p => (
            <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#555', fontWeight: 500 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.dot, display: 'inline-block', flexShrink: 0 }} />
              {p.label}
            </div>
          ))}
        </div>

        {/* Steps grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {content.lifecycle.map((item: any) => {
            const ps = PHASE_STYLES[item.phase] || PHASE_STYLES['Blikcart'];
            return (
              <div key={item.step} style={{ background: ps.bg, border: `1.5px solid ${ps.border}`, borderRadius: 16, padding: '24px 20px', position: 'relative', transition: 'transform 0.15s, box-shadow 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: ps.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                    {item.step}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: ps.color, background: 'rgba(0,0,0,0.06)', padding: '3px 9px', borderRadius: 20, letterSpacing: '0.04em' }}>
                    {item.phase}
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: '0 0 8px' }}>{item.title}</h3>
                <p style={{ fontSize: 13.5, color: '#666', margin: 0, lineHeight: 1.65 }}>{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Timeline at a glance */}
      <section style={{ maxWidth: 1000, margin: '56px auto 0', padding: '0 24px' }}>
        <div style={{ background: '#1a1a1a', borderRadius: 20, padding: 'clamp(32px, 4vw, 48px)', color: 'white' }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 28, textAlign: 'center', color: '#fff' }}>Timeline at a Glance</h3>
          <div style={{ display: 'flex', gap: 0, alignItems: 'stretch', overflowX: 'auto', paddingBottom: 4 }}>
            {[
              { label: 'Configure', time: '~15 min',   color: '#C8860A' },
              { label: 'Submit',    time: 'Instant',   color: '#C8860A' },
              { label: 'Quote',     time: '< 24h',     color: '#9ca3af' },
              { label: 'Production',time: '7–21 days', color: '#9ca3af' },
              { label: 'QC',        time: '1–2 days',  color: '#9ca3af' },
              { label: 'Delivery',  time: '2–5 days',  color: '#34d399' },
            ].map((t, i, arr) => (
              <div key={t.label} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 80 }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: t.color, marginBottom: 3 }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{t.time}</div>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ color: '#374151', fontSize: 14, margin: '0 2px', flexShrink: 0 }}>—</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category picker */}
      <section id="start" style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(56px, 7vw, 80px) 24px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: '#C8860A', fontWeight: 700, marginBottom: 12 }}>Step 1</p>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: '#1a1a1a', margin: '0 0 10px' }}>Choose Your Product Category</h2>
          <p style={{ fontSize: 15, color: '#777', maxWidth: 480, margin: '0 auto' }}>Select below to open the guided configurator for that product type.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 20 }}>
          {content.categories.map((cat: any) => (
            <button key={cat.slug} type="button" onClick={() => router.push(`/customize/${cat.slug}`)}
              style={{ background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 16, padding: '28px 24px', textAlign: 'left', cursor: 'pointer', transition: 'box-shadow 0.18s, border-color 0.18s, transform 0.15s', display: 'flex', flexDirection: 'column', gap: 10 }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.09)'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#C8860A'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#e8e4de'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{cat.name}</h3>
              <p style={{ fontSize: 13, color: '#666', margin: 0, lineHeight: 1.6 }}>{cat.description}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#666', background: '#f3f0eb', borderRadius: 20, padding: '3px 10px' }}>{cat.leadTime}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#666', background: '#f3f0eb', borderRadius: 20, padding: '3px 10px' }}>MOQ {cat.minOrder}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#666', background: '#f3f0eb', borderRadius: 20, padding: '3px 10px' }}>{cat.steps} steps</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#C8860A', marginTop: 4 }}>
                Configure now <ArrowRight size={13} />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Why Blikcart */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(56px, 6vw, 72px) 24px 0' }}>
        <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #e8e4de', padding: 'clamp(32px, 4vw, 48px)' }}>
          <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 800, color: '#1a1a1a', textAlign: 'center', marginBottom: 36 }}>Why Design with Blikcart?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 28 }}>
            {content.whyBlikcart.map((f: any) => (
              <div key={f.title} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{f.title}</h4>
                <p style={{ fontSize: 13, color: '#666', margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(48px, 6vw, 72px) 24px 0' }}>
        <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 800, color: '#1a1a1a', textAlign: 'center', marginBottom: 32 }}>Common Questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {content.faqs.map((faq: any) => (
            <details key={faq.q} style={{ background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 12 }}>
              <summary style={{ padding: '16px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#1a1a1a', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, userSelect: 'none' }}>
                {faq.q}
                <span style={{ color: '#C8860A', flexShrink: 0, fontSize: 18, fontWeight: 400 }}>+</span>
              </summary>
              <p style={{ padding: '0 20px 16px', margin: 0, fontSize: 13.5, color: '#555', lineHeight: 1.7 }}>{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ maxWidth: 800, margin: 'clamp(56px, 6vw, 80px) auto 0', padding: '0 24px clamp(56px, 6vw, 80px)' }}>
        <div style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2017 100%)', borderRadius: 20, padding: 'clamp(36px, 5vw, 56px)', textAlign: 'center', color: '#fff' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, marginBottom: 12 }}>{content.finalCta.title}</h2>
          <p style={{ color: '#888', marginBottom: 28, fontSize: 15, maxWidth: 440, margin: '0 auto 28px', lineHeight: 1.7 }}>
            {content.finalCta.body}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/customize/bridles" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#C8860A', color: 'white', padding: '13px 28px', borderRadius: 8, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
              Design a Bridle <ArrowRight size={16} />
            </Link>
            <a href="#start" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.9)', padding: '12px 24px', borderRadius: 8, fontWeight: 600, fontSize: 15, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.14)' }}>
              Browse All Categories
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}
