'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

const DEFAULT_CONTENT = {
  hero: {
    eyebrow: 'B2B',
    title: 'Partner With Blikcart',
    subtitle: 'Premium saddlery direct from our workshop. Volume pricing, custom branding, and a dedicated account manager — all in one place.',
  },
  stats: [
    { value: '500+',    label: 'B2B Partners' },
    { value: '21 days', label: 'Standard Lead Time' },
    { value: '30%',     label: 'Max Volume Discount' },
    { value: 'Net-30',  label: 'Payment Terms' },
  ],
  benefits: [
    { icon: '📦', title: 'MOQ from 5 units',   desc: 'Low minimums across all product lines' },
    { icon: '💰', title: 'Volume Discounts',    desc: '10–30% off based on order quantity' },
    { icon: '🏷️', title: 'Custom Branding',    desc: 'White-label and private label available' },
    { icon: '🤝', title: 'Account Manager',     desc: 'Dedicated contact for your business' },
    { icon: '📋', title: 'Net-30 Terms',        desc: 'Flexible payment for approved accounts' },
    { icon: '🚚', title: 'Global Shipping',     desc: 'Express 10-day and standard 21-day' },
  ],
  pricingTiers: [
    { qty: '5 – 19 units',   discount: '10% off', tag: '',          bg: '#f8fafc', border: '#e2e8f0' },
    { qty: '20 – 49 units',  discount: '15% off', tag: 'Popular',   bg: '#fffbeb', border: '#fde68a' },
    { qty: '50 – 99 units',  discount: '20% off', tag: '',          bg: '#eff6ff', border: '#bfdbfe' },
    { qty: '100+ units',     discount: '30% off', tag: 'Best Value',bg: '#f0fdf4', border: '#bbf7d0' },
  ],
  applySection: {
    heading: 'Get B2B Access',
    body: "Apply below and we'll respond within 1 business day with your account details and custom pricing.",
  },
  contact: {
    email: 'info@blikcart.nl',
    phone: '+31 (0)626475215',
    hours: 'Mon–Fri, 09:00–17:00 CET',
  },
};

export default function WholesalePage() {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [form, setForm] = useState({ company: '', name: '', email: '', password: '', phone: '', vatNumber: '', country: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/content/pages/wholesale`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.content) return;
        try {
          const parsed = JSON.parse(data.content);
          setContent(c => ({ ...c, ...parsed }));
        } catch { /* use defaults */ }
      })
      .catch(() => { /* use defaults */ });
  }, []);

  async function handleSubmit(e: any) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.name,
          email: form.email,
          password: form.password,
          accountType: 'wholesale',
          companyName: form.company,
          vatNumber: form.vatNumber || undefined,
          phone: form.phone || undefined,
          locale: 'en',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || 'Something went wrong. Please try again.');
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 8,
    fontSize: 14, outline: 'none', background: '#f8fafc', color: '#1e293b',
    boxSizing: 'border-box' as const, transition: 'border-color 0.15s',
  };

  const c = content;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)', color: 'white', padding: '80px 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <span style={{ display: 'inline-block', background: 'rgba(200,134,10,0.15)', color: '#C8860A', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.15em', padding: '6px 16px', borderRadius: 20, marginBottom: 20, border: '1px solid rgba(200,134,10,0.3)' }}>
            {c.hero.eyebrow}
          </span>
          <h1 style={{ fontSize: 48, fontWeight: 800, marginBottom: 18, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{c.hero.title}</h1>
          <p style={{ color: '#94a3b8', fontSize: 18, maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>{c.hero.subtitle}</p>
        </div>
      </div>

      {/* Stats bar */}
      {c.stats?.length > 0 && (
        <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: `repeat(${c.stats.length}, 1fr)` }}>
            {c.stats.map((s: any, i: number) => (
              <div key={i} style={{ padding: '24px 16px', textAlign: 'center', borderRight: i < c.stats.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                <p style={{ fontSize: 28, fontWeight: 800, color: '#1A3C5E' }}>{s.value}</p>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 24px' }}>

        {/* Benefits */}
        {c.benefits?.length > 0 && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 24, textAlign: 'center' }}>Everything You Need to Scale</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 56 }}>
              {c.benefits.map((b: any, i: number) => (
                <div key={i} style={{ background: 'white', borderRadius: 10, padding: '22px 20px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{b.icon}</div>
                  <h3 style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, marginBottom: 5 }}>{b.title}</h3>
                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{b.desc}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Volume pricing */}
        {c.pricingTiers?.length > 0 && (
          <div style={{ background: 'white', borderRadius: 14, padding: '36px 40px', border: '1px solid #e2e8f0', marginBottom: 56 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 8, textAlign: 'center' }}>Volume Pricing Tiers</h2>
            <p style={{ fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 28 }}>Discounts applied automatically at checkout for approved B2B accounts</p>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${c.pricingTiers.length}, 1fr)`, gap: 16 }}>
              {c.pricingTiers.map((t: any, i: number) => (
                <div key={i} style={{ background: t.bg || '#f8fafc', border: `1px solid ${t.border || '#e2e8f0'}`, borderRadius: 10, padding: '20px 16px', textAlign: 'center', position: 'relative' }}>
                  {t.tag && <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#C8860A', color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>{t.tag}</span>}
                  <p style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>{t.qty}</p>
                  <p style={{ fontSize: 26, fontWeight: 800, color: '#1A3C5E', marginTop: 8 }}>{t.discount}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form + contact */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 40, alignItems: 'start' }}>

          {/* Left */}
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>{c.applySection.heading}</h2>
            <p style={{ color: '#64748b', lineHeight: 1.7, marginBottom: 28, fontSize: 15 }}>{c.applySection.body}</p>
            <div style={{ background: '#1A3C5E', borderRadius: 12, padding: 24, color: 'white', marginBottom: 16 }}>
              <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>📧 Email Us Directly</p>
              <p style={{ fontSize: 14, color: '#94a3b8' }}>{c.contact.email}</p>
              <p style={{ fontWeight: 700, fontSize: 14, marginTop: 16, marginBottom: 4 }}>📞 Call Us</p>
              <p style={{ fontSize: 14, color: '#94a3b8' }}>{c.contact.phone}</p>
              <p style={{ fontWeight: 700, fontSize: 14, marginTop: 16, marginBottom: 4 }}>🕐 Office Hours</p>
              <p style={{ fontSize: 14, color: '#94a3b8' }}>{c.contact.hours}</p>
            </div>
          </div>

          {/* Form */}
          <div style={{ background: 'white', borderRadius: 14, padding: 36, border: '1px solid #e2e8f0' }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
                <h3 style={{ fontWeight: 700, color: '#0f172a', fontSize: 20, marginBottom: 8 }}>Application Received!</h3>
                <p style={{ color: '#64748b' }}>We'll be in touch within 1 business day.</p>
                <Link href="/" style={{ display: 'inline-block', marginTop: 24, color: '#C8860A', fontWeight: 600 }}>← Back to Home</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { key: 'company',   label: 'Company Name',   type: 'text',     required: true,  full: true },
                    { key: 'name',      label: 'Contact Name',   type: 'text',     required: true,  full: false },
                    { key: 'email',     label: 'Business Email', type: 'email',    required: true,  full: false },
                    { key: 'password',  label: 'Password',       type: 'password', required: true,  full: false },
                    { key: 'phone',     label: 'Phone Number',   type: 'tel',      required: false, full: false },
                    { key: 'vatNumber', label: 'VAT Number',     type: 'text',     required: false, full: false },
                    { key: 'country',   label: 'Country',        type: 'text',     required: true,  full: false },
                  ].map(f => (
                    <div key={f.key} style={{ gridColumn: f.full ? '1 / -1' : 'auto' }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                        {f.label}{f.required && <span style={{ color: '#C8860A' }}> *</span>}
                      </label>
                      <input type={f.type} required={f.required} value={(form as any)[f.key]}
                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                        style={inputStyle} />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Message</label>
                  <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                    rows={3} placeholder="Tell us about your business and expected order volumes..."
                    style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                {error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
                    <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>{error}</p>
                  </div>
                )}
                <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? '#a0896d' : '#C8860A', color: 'white', fontWeight: 700, fontSize: 15, padding: '13px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.01em' }}>
                  {loading ? 'Submitting…' : 'Submit Application →'}
                </button>
                <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 12 }}>We'll respond within 1 business day</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
