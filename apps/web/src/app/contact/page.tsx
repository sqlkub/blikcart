'use client';
import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

const DEFAULT = {
  hero: {
    eyebrow: 'Get in Touch',
    title: 'Contact Us',
    subtitle: "Questions about an order, a custom quote, or just want to say hello — we're here.",
  },
  contactCards: [
    { label: 'General Support', value: 'support@blikcart.nl',   sub: 'Mon – Fri, replies within 4 hours', link: 'mailto:support@blikcart.nl' },
    { label: 'Wholesale & B2B', value: 'wholesale@blikcart.nl', sub: 'Account & pricing enquiries',        link: 'mailto:wholesale@blikcart.nl' },
    { label: 'Phone',           value: '+31 (0)20 123 4567',     sub: 'Mon – Fri, 09:00 – 17:00 CET',     link: 'tel:+31201234567' },
    { label: 'Workshop',        value: 'Amsterdam, NL',           sub: 'Not open to walk-ins',             link: '' },
  ],
  formSection: {
    title: 'Send a Message',
    body: "Fill in the form and we'll get back to you within one business day.",
    topics: [
      'General enquiry', 'Custom order / quote', 'Existing order',
      'Wholesale / B2B', 'Returns & refunds', 'Product information', 'Technical / website issue',
    ],
  },
  responseTimes: [
    'General enquiries — same day',
    'Custom quotes — within 24 hours',
    'Order updates — within 4 hours',
  ],
};

const inputStyle = {
  width: '100%', padding: '11px 14px', border: '1.5px solid #e8e4de', borderRadius: 8,
  fontSize: 14, outline: 'none', background: '#faf9f7', color: '#1a1a1a',
  boxSizing: 'border-box' as const, transition: 'border-color 0.15s', fontFamily: 'inherit',
};

export default function ContactPage() {
  const [content, setContent] = useState(DEFAULT);
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`${API}/content/pages/contact`)
      .then(r => r.ok ? r.json() : null)
      .then(p => { if (p?.content) try { setContent(JSON.parse(p.content)); } catch {} })
      .catch(() => {});
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <main style={{ minHeight: '100vh', background: '#faf9f7' }}>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2017 100%)', color: '#fff', padding: 'clamp(56px, 7vw, 88px) 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: '#C8860A', fontWeight: 700, marginBottom: 14 }}>{content.hero.eyebrow}</p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.02em' }}>{content.hero.title}</h1>
        <p style={{ fontSize: 16, color: '#aaa', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
          {content.hero.subtitle}
        </p>
      </section>

      {/* Contact cards */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(40px, 5vw, 64px) 24px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 48 }}>
          {content.contactCards.map((c: any) => (
            <div key={c.label} style={{ background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 14, padding: '22px 20px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#C8860A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{c.label}</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>{c.value}</p>
              <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 40, alignItems: 'start' }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 12 }}>{content.formSection.title}</h2>
            <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, marginBottom: 24 }}>
              {content.formSection.body} For urgent order issues, email us directly.
            </p>
            <div style={{ background: '#1a1a1a', borderRadius: 12, padding: 24, color: 'white' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#C8860A', marginBottom: 8 }}>Response Times</p>
              <ul style={{ fontSize: 13, color: '#888', lineHeight: 2, paddingLeft: 0, listStyle: 'none', margin: 0 }}>
                {content.responseTimes.map((t: string) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e8e4de', padding: 'clamp(24px, 4vw, 36px)' }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <h3 style={{ fontWeight: 800, color: '#1a1a1a', fontSize: 20, marginBottom: 8 }}>Message Sent</h3>
                <p style={{ color: '#666', fontSize: 14 }}>We'll reply to {form.email} within one business day.</p>
                <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', topic: '', message: '' }); }}
                  style={{ marginTop: 24, color: '#C8860A', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name *</label>
                    <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email *</label>
                    <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Topic *</label>
                  <select required title="Topic" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} style={{ ...inputStyle, appearance: 'auto' }}>
                    <option value="">Select a topic…</option>
                    {content.formSection.topics.map((t: string) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Message *</label>
                  <textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us how we can help…" style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <button type="submit" style={{ background: '#C8860A', color: '#fff', fontWeight: 700, fontSize: 15, padding: '13px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <div style={{ height: 'clamp(48px, 6vw, 80px)' }} />
    </main>
  );
}
