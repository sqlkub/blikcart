'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// ── Lifecycle steps ────────────────────────────────────────────────────────────

const LIFECYCLE = [
  {
    phase: 'You',
    step: 1,
    icon: '🎯',
    title: 'Choose a Category',
    desc: 'Pick the product type you want — bridle, browband, saddle pad, rug, and more.',
    color: '#C8860A',
    bg: '#fff8ec',
    border: '#f0d080',
  },
  {
    phase: 'You',
    step: 2,
    icon: '🎨',
    title: 'Configure Your Design',
    desc: 'Walk through our guided step-by-step configurator. Choose material, colour, hardware, padding, stitching, size, and delivery speed.',
    color: '#C8860A',
    bg: '#fff8ec',
    border: '#f0d080',
  },
  {
    phase: 'You',
    step: 3,
    icon: '💰',
    title: 'Review Live Pricing',
    desc: 'Your price updates in real time as you configure. Quantity discounts apply automatically from 5 units.',
    color: '#C8860A',
    bg: '#fff8ec',
    border: '#f0d080',
  },
  {
    phase: 'You',
    step: 4,
    icon: '📋',
    title: 'Submit Your Quote',
    desc: 'Send your configuration to us — no payment yet. We\'ll review your spec and confirm the final price within 24 hours.',
    color: '#C8860A',
    bg: '#fff8ec',
    border: '#f0d080',
  },
  {
    phase: 'Blikcart',
    step: 5,
    icon: '✅',
    title: 'Quote Confirmed',
    desc: 'Our team reviews your configuration and sends you a final quote. You approve and confirm the order with payment.',
    color: '#1a1a1a',
    bg: '#f5f5f5',
    border: '#d1d5db',
  },
  {
    phase: 'Blikcart',
    step: 6,
    icon: '🏭',
    title: 'In Production',
    desc: 'Your bespoke order enters our workshop. Skilled craftspeople handmake every item to your exact specification.',
    color: '#1a1a1a',
    bg: '#f5f5f5',
    border: '#d1d5db',
  },
  {
    phase: 'Blikcart',
    step: 7,
    icon: '🔍',
    title: 'Quality Control',
    desc: 'Every piece passes our 12-point QC checklist — stitching, hardware, fit, and finish — before it leaves the workshop.',
    color: '#1a1a1a',
    bg: '#f5f5f5',
    border: '#d1d5db',
  },
  {
    phase: 'Delivered',
    step: 8,
    icon: '📦',
    title: 'Shipped to You',
    desc: 'Your order is carefully packed and dispatched direct to your door with full tracking and delivery notification.',
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
  },
];

// ── Categories ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    slug: 'bridles',
    name: 'Bridles',
    description: 'Custom-fitted bridles from premium leather. Choose hardware, padding, and personalisation.',
    icon: '🐴',
    leadTime: '10–14 days',
    minOrder: 1,
    steps: 9,
  },
  {
    slug: 'browbands',
    name: 'Browbands',
    description: 'Crystal, leather, or embroidered detailing. Choose width, colours, and hardware.',
    icon: '💎',
    leadTime: '7–10 days',
    minOrder: 1,
    steps: 7,
  },
  {
    slug: 'saddle-pads',
    name: 'Saddle Pads',
    description: 'Shape, piping colours, logo embroidery, and fabrics — exactly as you need.',
    icon: '🪡',
    leadTime: '7–10 days',
    minOrder: 5,
    steps: 8,
  },
  {
    slug: 'rugs',
    name: 'Horse Rugs',
    description: 'Fill weight, shell material, and custom trim built to order.',
    icon: '🧥',
    leadTime: '14–21 days',
    minOrder: 3,
    steps: 8,
  },
  {
    slug: 'head-collars',
    name: 'Head Collars',
    description: 'Bespoke leather or nylon with name plates, colour choices, and fittings.',
    icon: '🔖',
    leadTime: '7–12 days',
    minOrder: 1,
    steps: 6,
  },
  {
    slug: 'numnahs',
    name: 'Numnahs',
    description: 'Quilting pattern, binding, and branding options to your specification.',
    icon: '🪢',
    leadTime: '7–10 days',
    minOrder: 5,
    steps: 7,
  },
  {
    slug: 'boots',
    name: 'Leg Boots',
    description: 'Shell, lining, fastenings, and colours tailored by discipline.',
    icon: '🥾',
    leadTime: '10–14 days',
    minOrder: 4,
    steps: 7,
  },
];

// ── FAQs ──────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'Do I need to pay before the quote is confirmed?',
    a: 'No. You configure and submit for free. Payment is only required after we confirm the final quote and you approve it.',
  },
  {
    q: 'How long does the whole process take?',
    a: 'Quote confirmation within 24 hours. Production lead time is 7–21 days depending on the product. Express options are available on most categories.',
  },
  {
    q: 'Can I make changes after submitting a quote?',
    a: 'Yes — before you approve the quote, you can request revisions. We\'ll update the spec and re-confirm pricing.',
  },
  {
    q: 'What is the minimum order quantity (MOQ)?',
    a: 'MOQ varies by product — as low as 1 unit for bridles and head collars, up to 5 units for saddle pads and numnahs.',
  },
  {
    q: 'Do I get a dedicated account manager?',
    a: 'Yes. Every wholesale and custom order account gets a dedicated contact who handles your project from quote to delivery.',
  },
];

export default function DesignYourOwnPage() {
  const router = useRouter();

  return (
    <main style={{ minHeight: '100vh', background: '#faf9f7' }}>

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2017 100%)',
        color: '#fff',
        padding: 'clamp(56px, 8vw, 96px) 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative ring */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 600, height: 600,
          borderRadius: '50%',
          border: '1px solid rgba(200,134,10,0.12)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>
          <p style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: '#C8860A', marginBottom: 18, fontWeight: 700 }}>
            Bespoke Manufacturing
          </p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, margin: '0 0 20px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            Design Your Own
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: '#aaa', margin: '0 auto 32px', lineHeight: 1.75, maxWidth: 560 }}>
            From first click to your door — here's exactly how the Blikcart custom order process works.
            Transparent, step-by-step, no surprises.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#start" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#C8860A', color: 'white',
              padding: '13px 28px', borderRadius: 8,
              fontWeight: 700, fontSize: 15, textDecoration: 'none',
            }}>
              Start Designing <ArrowRight size={16} />
            </a>
            <a href="#how-it-works" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.9)',
              padding: '12px 24px', borderRadius: 8,
              fontWeight: 600, fontSize: 15, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.12)',
            }}>
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────────── */}
      <section style={{ background: '#fff', borderBottom: '1px solid #e8e4de' }}>
        <div style={{
          maxWidth: 900, margin: '0 auto', padding: '24px 24px',
          display: 'flex', justifyContent: 'center', gap: 'clamp(24px, 5vw, 72px)', flexWrap: 'wrap',
        }}>
          {[
            { num: '7', label: 'Product Categories' },
            { num: '24h', label: 'Quote Turnaround' },
            { num: '7–21', label: 'Days to Production' },
            { num: '1', label: 'Dedicated Account Manager' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#C8860A', lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Process Lifecycle ─────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(48px, 6vw, 80px) 24px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: '#C8860A', fontWeight: 700, marginBottom: 12 }}>
            The Process
          </p>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800, color: '#1a1a1a', margin: '0 0 12px' }}>
            From Idea to Doorstep
          </h2>
          <p style={{ fontSize: 15, color: '#777', maxWidth: 520, margin: '0 auto' }}>
            Eight clear stages. The first four are yours — the rest is on us.
          </p>
        </div>

        {/* Phase legend */}
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 40, flexWrap: 'wrap' }}>
          {[
            { label: 'Your steps', dot: '#C8860A' },
            { label: 'Blikcart steps', dot: '#374151' },
            { label: 'Delivery', dot: '#059669' },
          ].map(p => (
            <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#555', fontWeight: 500 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.dot, display: 'inline-block', flexShrink: 0 }} />
              {p.label}
            </div>
          ))}
        </div>

        {/* Steps grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 0,
          position: 'relative',
        }}>
          {LIFECYCLE.map((item, idx) => (
            <div key={item.step} style={{ position: 'relative', padding: '0 12px 12px' }}>
              {/* Connector line between steps */}
              {idx < LIFECYCLE.length - 1 && (
                <div style={{
                  display: 'none', // hidden on mobile, shown via media query alternative (we'll handle inline)
                }} />
              )}

              <div style={{
                background: item.bg,
                border: `1.5px solid ${item.border}`,
                borderRadius: 16,
                padding: '24px 20px',
                height: '100%',
                position: 'relative',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}>
                {/* Step number + phase badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: item.color, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 15, flexShrink: 0,
                  }}>
                    {item.step}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: item.color,
                    background: 'rgba(0,0,0,0.06)',
                    padding: '3px 9px', borderRadius: 20,
                    letterSpacing: '0.04em',
                  }}>
                    {item.phase}
                  </span>
                </div>

                {/* Icon */}
                <div style={{ fontSize: 36, marginBottom: 12, lineHeight: 1 }}>{item.icon}</div>

                {/* Content */}
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: '0 0 8px' }}>{item.title}</h3>
                <p style={{ fontSize: 13.5, color: '#666', margin: 0, lineHeight: 1.65 }}>{item.desc}</p>

                {/* Arrow connector (right side, except last in row logic) */}
                {idx < LIFECYCLE.length - 1 && (
                  <div style={{
                    position: 'absolute', right: -14, top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 18, color: '#d1d5db', fontWeight: 300,
                    zIndex: 2, pointerEvents: 'none',
                    // Only visible when items are side by side — simplified approach
                  }}>
                    →
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Timeline visual summary ────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1000, margin: '56px auto 0', padding: '0 24px' }}>
        <div style={{
          background: '#1a1a1a',
          borderRadius: 20,
          padding: 'clamp(32px, 4vw, 48px)',
          color: 'white',
        }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 28, textAlign: 'center', color: '#fff' }}>
            Timeline at a Glance
          </h3>
          <div style={{ display: 'flex', gap: 0, alignItems: 'stretch', overflowX: 'auto', paddingBottom: 4 }}>
            {[
              { label: 'Configure', time: '~15 min', color: '#C8860A', icon: '🎨' },
              { label: 'Submit', time: 'Instant', color: '#C8860A', icon: '📋' },
              { label: 'Quote', time: '< 24h', color: '#6b7280', icon: '✅' },
              { label: 'Production', time: '7–21 days', color: '#6b7280', icon: '🏭' },
              { label: 'QC', time: '1–2 days', color: '#6b7280', icon: '🔍' },
              { label: 'Delivery', time: '2–5 days', color: '#059669', icon: '📦' },
            ].map((t, i, arr) => (
              <div key={t.label} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 90 }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{t.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: t.color, marginBottom: 3 }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{t.time}</div>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ color: '#374151', fontSize: 16, margin: '0 2px', flexShrink: 0, paddingBottom: 20 }}>—</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Start: Category picker ─────────────────────────────────────────────── */}
      <section id="start" style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(56px, 7vw, 80px) 24px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: '#C8860A', fontWeight: 700, marginBottom: 12 }}>
            Step 1
          </p>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: '#1a1a1a', margin: '0 0 10px' }}>
            Choose Your Product Category
          </h2>
          <p style={{ fontSize: 15, color: '#777', maxWidth: 480, margin: '0 auto' }}>
            Select below to open the guided configurator for that product type.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: 20,
        }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => router.push(`/customize/${cat.slug}`)}
              style={{
                background: '#fff',
                border: '1.5px solid #e8e4de',
                borderRadius: 16,
                padding: '28px 24px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'box-shadow 0.18s, border-color 0.18s, transform 0.15s',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.09)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#C8860A';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#e8e4de';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              }}
            >
              <span style={{ fontSize: 34, lineHeight: 1 }}>{cat.icon}</span>

              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: '0 0 5px' }}>{cat.name}</h3>
                <p style={{ fontSize: 13, color: '#666', margin: 0, lineHeight: 1.6 }}>{cat.description}</p>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#666', background: '#f3f0eb', borderRadius: 20, padding: '3px 10px' }}>
                  ⏱ {cat.leadTime}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#666', background: '#f3f0eb', borderRadius: 20, padding: '3px 10px' }}>
                  MOQ {cat.minOrder}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#666', background: '#f3f0eb', borderRadius: 20, padding: '3px 10px' }}>
                  {cat.steps} steps
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: '#C8860A', marginTop: 4 }}>
                Configure now <span style={{ fontSize: 15 }}>→</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── What makes it different ────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(56px, 6vw, 72px) 24px 0' }}>
        <div style={{
          background: '#fff',
          borderRadius: 20,
          border: '1.5px solid #e8e4de',
          padding: 'clamp(32px, 4vw, 48px)',
        }}>
          <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 800, color: '#1a1a1a', textAlign: 'center', marginBottom: 36 }}>
            Why Design with Blikcart?
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 28,
          }}>
            {[
              { icon: '🏭', title: 'Direct from Workshop', desc: 'No middlemen. We manufacture everything in-house for better quality and pricing.' },
              { icon: '⚡', title: 'Live Price Preview', desc: 'See your total cost update as you configure. No hidden fees, no surprises on invoice.' },
              { icon: '🔄', title: 'Revision-Friendly', desc: 'Request changes before approving your quote. We refine until the spec is exactly right.' },
              { icon: '📐', title: 'Spec Accuracy', desc: 'Backend-driven configurator prevents invalid combinations — what you design is what we can build.' },
              { icon: '💬', title: 'Dedicated Contact', desc: 'A real account manager handles every step from quote to delivery for your orders.' },
              { icon: '🌿', title: 'Sustainable Options', desc: 'Bio-certified leather tanning and sustainable packaging available on selected products.' },
            ].map(f => (
              <div key={f.title} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 28 }}>{f.icon}</span>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{f.title}</h4>
                <p style={{ fontSize: 13, color: '#666', margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(48px, 6vw, 72px) 24px 0' }}>
        <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 800, color: '#1a1a1a', textAlign: 'center', marginBottom: 32 }}>
          Common Questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FAQS.map(faq => (
            <details key={faq.q} style={{ background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 12 }}>
              <summary style={{
                padding: '16px 20px',
                cursor: 'pointer',
                fontSize: 14, fontWeight: 600, color: '#1a1a1a',
                listStyle: 'none',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                userSelect: 'none',
              }}>
                {faq.q}
                <span style={{ color: '#C8860A', flexShrink: 0, fontSize: 18, fontWeight: 400 }}>+</span>
              </summary>
              <p style={{ padding: '0 20px 16px', margin: 0, fontSize: 13.5, color: '#555', lineHeight: 1.7 }}>{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 800, margin: 'clamp(56px, 6vw, 80px) auto 0', padding: '0 24px clamp(56px, 6vw, 80px)' }}>
        <div style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2017 100%)',
          borderRadius: 20,
          padding: 'clamp(36px, 5vw, 56px)',
          textAlign: 'center',
          color: '#fff',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, marginBottom: 12 }}>
            Ready to Start?
          </h2>
          <p style={{ color: '#888', marginBottom: 28, fontSize: 15, maxWidth: 440, margin: '0 auto 28px', lineHeight: 1.7 }}>
            Pick a category above, or jump straight into our most popular configurator — bridles.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/customize/bridles" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#C8860A', color: 'white',
              padding: '13px 28px', borderRadius: 8,
              fontWeight: 700, fontSize: 15, textDecoration: 'none',
            }}>
              Design a Bridle <ArrowRight size={16} />
            </Link>
            <a href="#start" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.9)',
              padding: '12px 24px', borderRadius: 8,
              fontWeight: 600, fontSize: 15, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.14)',
            }}>
              Browse All Categories
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}
