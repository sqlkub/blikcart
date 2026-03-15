'use client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

const DEFAULT = {
  hero: {
    eyebrow: 'Business Accounts',
    title: 'B2B Portal',
    subtitle: 'Unlock wholesale pricing, private-label options, Net-30 terms, and a dedicated account manager — all through one login.',
  },
  stats: [
    { value: '500+',   label: 'Wholesale Partners' },
    { value: '24h',    label: 'Quote Response' },
    { value: '30%',    label: 'Max Volume Discount' },
    { value: 'Net-30', label: 'Payment Terms (approved)' },
  ],
  features: [
    { title: 'Dedicated Account Manager', desc: 'One named contact for all your orders, quotes, and questions. Available Mon–Fri 09:00–17:00 CET.' },
    { title: 'Volume Pricing',            desc: 'Automatic discounts from 5 units. Custom pricing available for regular high-volume partners.' },
    { title: 'Private Label & White Label', desc: 'Custom branding, swing tags, and packaging with your logo. Apply for branding requirements at time of ordering.' },
    { title: 'Net-30 Payment Terms',      desc: 'Approved accounts receive Net-30 invoicing after 3 completed orders. Apply after your first order.' },
    { title: 'Order Management Portal',   desc: 'Your account dashboard tracks every quote, order, and shipment across your entire purchase history.' },
    { title: 'Priority Production',       desc: 'B2B accounts get priority scheduling in our production queue during peak seasons.' },
  ],
  steps: [
    { step: '01', title: 'Apply for Wholesale Access', desc: 'Complete the form on our Wholesale page. We review and respond within 1 business day.', link: '/wholesale', linkText: 'Apply now' },
    { step: '02', title: 'Get Your Account Activated', desc: "Once approved, you receive your B2B login, custom pricing tier, and your account manager's direct contact details.", link: '', linkText: '' },
    { step: '03', title: 'Place Orders via Configurator', desc: 'Log in and use the same step-by-step configurator — your wholesale prices are applied automatically.', link: '', linkText: '' },
    { step: '04', title: 'Manage Everything in One Place', desc: 'All quotes, orders, shipments, and invoices are accessible from your account dashboard.', link: '', linkText: '' },
  ],
  volumeTiers: [
    { range: '5 – 19 units',  pct: '10%', note: '' },
    { range: '20 – 49 units', pct: '15%', note: 'Popular' },
    { range: '50 – 99 units', pct: '20%', note: '' },
    { range: '100+ units',    pct: '30%', note: 'Best Value' },
  ],
  cta: {
    title: 'Ready to Partner?',
    body: 'Apply for a wholesale account in 2 minutes. We approve and respond within 1 business day.',
    email: 'wholesale@blikcart.nl',
  },
};

export default function B2BPage() {
  const [content, setContent] = useState(DEFAULT);

  useEffect(() => {
    fetch(`${API}/content/pages/b2b`)
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
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/wholesale" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#C8860A', color: '#fff', padding: '13px 28px', borderRadius: 8, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
            Apply for Wholesale <ArrowRight size={16} />
          </Link>
          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.9)', padding: '12px 24px', borderRadius: 8, fontWeight: 600, fontSize: 15, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.14)' }}>
            Log in to Account
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: '#fff', borderBottom: '1px solid #e8e4de' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          {content.stats.map((s: any, i: number) => (
            <div key={s.label} style={{ padding: '24px 16px', textAlign: 'center', borderRight: i < content.stats.length - 1 ? '1px solid #e8e4de' : 'none' }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#C8860A', margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1060, margin: '0 auto', padding: 'clamp(48px, 6vw, 72px) 24px' }}>

        {/* Features */}
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', textAlign: 'center', marginBottom: 32 }}>B2B Account Benefits</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 56 }}>
          {content.features.map((f: any) => (
            <div key={f.title} style={{ background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 14, padding: '24px 20px' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>{f.title}</h3>
              <p style={{ fontSize: 13.5, color: '#666', margin: 0, lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* How to access */}
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', textAlign: 'center', marginBottom: 32 }}>How to Get B2B Access</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 56 }}>
          {content.steps.map((s: any) => (
            <div key={s.step} style={{ background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 14, padding: '24px 20px' }}>
              <p style={{ fontSize: 32, fontWeight: 800, color: '#f0d3a0', margin: '0 0 12px', lineHeight: 1 }}>{s.step}</p>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: '#666', lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
              {s.link && (
                <Link href={s.link} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 12, fontSize: 13, fontWeight: 700, color: '#C8860A', textDecoration: 'none' }}>
                  {s.linkText} <ArrowRight size={12} />
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Volume tiers */}
        <div style={{ background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 16, padding: 'clamp(24px, 3vw, 36px)', marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', marginBottom: 20, textAlign: 'center' }}>Volume Pricing Tiers</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {content.volumeTiers.map((t: any) => (
              <div key={t.range} style={{ background: t.note ? '#fff8ec' : '#f9f8f6', border: `1.5px solid ${t.note ? '#C8860A' : '#e8e4de'}`, borderRadius: 10, padding: '18px 14px', textAlign: 'center', position: 'relative' }}>
                {t.note && <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#C8860A', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>{t.note}</span>}
                <p style={{ fontSize: 12, color: '#777', fontWeight: 600, marginBottom: 6 }}>{t.range}</p>
                <p style={{ fontSize: 26, fontWeight: 800, color: t.note ? '#C8860A' : '#1a1a1a' }}>{t.pct} off</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: '#1a1a1a', borderRadius: 16, padding: 'clamp(28px, 4vw, 44px)', textAlign: 'center', color: '#fff' }}>
          <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>{content.cta.title}</h3>
          <p style={{ color: '#888', fontSize: 15, marginBottom: 24, maxWidth: 420, margin: '0 auto 24px' }}>{content.cta.body}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/wholesale" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#C8860A', color: '#fff', padding: '13px 28px', borderRadius: 8, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
              Apply for Wholesale <ArrowRight size={16} />
            </Link>
            <a href={`mailto:${content.cta.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', padding: '12px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)' }}>
              {content.cta.email}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
