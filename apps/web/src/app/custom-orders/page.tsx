'use client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

const DEFAULT = {
  hero: {
    eyebrow: 'Bespoke Manufacturing',
    title: 'Custom Orders',
    subtitle: 'Every Blikcart product can be made to your exact specification. Use our step-by-step configurator to design, price, and order — all in one place.',
  },
  processSteps: [
    { step: 1, title: 'Choose a Category',        desc: 'Pick the product type below. Each category has its own guided configurator.' },
    { step: 2, title: 'Configure Your Design',     desc: 'Step through material, colour, hardware, sizing, and delivery options. Live price shown throughout.' },
    { step: 3, title: 'Submit for Quote',          desc: 'No payment needed yet. Your spec is sent to our team for review.' },
    { step: 4, title: 'Quote Approval',            desc: 'We confirm the final price within 24 hours. You approve and pay to start production.' },
    { step: 5, title: 'Handmade in Workshop',      desc: 'Your order is manufactured by our craftspeople to your exact specification.' },
    { step: 6, title: 'Quality Check & Dispatch',  desc: 'Every item passes a 12-point QC check before being packed and shipped directly to you.' },
  ],
  categories: [
    { slug: 'bridles',      name: 'Bridles',      from: 38, leadTime: '10–14 days', moq: 1 },
    { slug: 'browbands',    name: 'Browbands',    from: 18, leadTime: '7–10 days',  moq: 1 },
    { slug: 'saddle-pads',  name: 'Saddle Pads',  from: 24, leadTime: '7–10 days',  moq: 5 },
    { slug: 'rugs',         name: 'Horse Rugs',   from: 65, leadTime: '14–21 days', moq: 3 },
    { slug: 'head-collars', name: 'Head Collars', from: 16, leadTime: '7–12 days',  moq: 1 },
    { slug: 'numnahs',      name: 'Numnahs',      from: 20, leadTime: '7–10 days',  moq: 5 },
    { slug: 'boots',        name: 'Leg Boots',    from: 28, leadTime: '10–14 days', moq: 4 },
  ],
  capabilities: [
    { label: 'Colours',     desc: '20+ leather and fabric colour options per category' },
    { label: 'Hardware',    desc: 'Stainless, brass, antique brass, and rose gold finishes' },
    { label: 'Stitching',   desc: 'Contrast or matching thread, multiple stitch patterns' },
    { label: 'Branding',    desc: 'Logo embossing, name plates, custom labels' },
    { label: 'Sizing',      desc: 'Standard sizes plus custom measurements on request' },
    { label: 'Eco Options', desc: 'Bio-certified leather tanning and recycled fill on rugs' },
  ],
};

export default function CustomOrdersPage() {
  const [content, setContent] = useState(DEFAULT);

  useEffect(() => {
    fetch(`${API}/content/pages/custom-orders`)
      .then(r => r.ok ? r.json() : null)
      .then(p => { if (p?.content) try { setContent(JSON.parse(p.content)); } catch {} })
      .catch(() => {});
  }, []);

  return (
    <main style={{ minHeight: '100vh', background: '#faf9f7' }}>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2017 100%)', color: '#fff', padding: 'clamp(56px, 7vw, 88px) 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: '#C8860A', fontWeight: 700, marginBottom: 14 }}>{content.hero.eyebrow}</p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.02em' }}>{content.hero.title}</h1>
        <p style={{ fontSize: 16, color: '#aaa', maxWidth: 540, margin: '0 auto 28px', lineHeight: 1.7 }}>
          {content.hero.subtitle}
        </p>
        <Link href="/design-your-own" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#C8860A', color: '#fff', padding: '13px 28px', borderRadius: 8, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
          Start Designing <ArrowRight size={16} />
        </Link>
      </section>

      {/* Process steps */}
      <section style={{ maxWidth: 1060, margin: '0 auto', padding: 'clamp(48px, 6vw, 72px) 24px 0' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', textAlign: 'center', marginBottom: 36 }}>How It Works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {content.processSteps.map((p: any) => (
            <div key={p.step} style={{ background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 14, padding: '24px 20px', display: 'flex', gap: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#C8860A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                {p.step}
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 5 }}>{p.title}</h3>
                <p style={{ fontSize: 13, color: '#666', lineHeight: 1.65, margin: 0 }}>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Category grid */}
      <section style={{ maxWidth: 1060, margin: '0 auto', padding: 'clamp(48px, 6vw, 72px) 24px 0' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', textAlign: 'center', marginBottom: 8 }}>Choose a Category</h2>
        <p style={{ fontSize: 14, color: '#777', textAlign: 'center', marginBottom: 32 }}>Each category opens its own step-by-step configurator with live pricing.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {content.categories.map((cat: any) => (
            <Link key={cat.slug} href={`/customize/${cat.slug}`} style={{ background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 14, padding: '24px 20px', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#C8860A'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#e8e4de'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none'; }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px' }}>{cat.name}</h3>
                <p style={{ fontSize: 13, color: '#C8860A', fontWeight: 700, margin: 0 }}>From €{cat.from}</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#666', background: '#f3f0eb', borderRadius: 20, padding: '3px 9px' }}>{cat.leadTime}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#666', background: '#f3f0eb', borderRadius: 20, padding: '3px 9px' }}>MOQ {cat.moq}</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: '#C8860A' }}>
                Configure <ArrowRight size={13} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section style={{ maxWidth: 1060, margin: '0 auto', padding: 'clamp(48px, 6vw, 72px) 24px' }}>
        <div style={{ background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 16, padding: 'clamp(28px, 4vw, 44px)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', marginBottom: 24, textAlign: 'center' }}>What You Can Customise</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {content.capabilities.map((c: any) => (
              <div key={c.label} style={{ padding: '14px 12px' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>{c.label}</p>
                <p style={{ fontSize: 12, color: '#888', lineHeight: 1.6, margin: 0 }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
