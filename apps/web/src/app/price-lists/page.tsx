'use client';
import { useState } from 'react';
import Link from 'next/link';

const BASE_PRICES = [
  { category: 'Bridles',       from: 38,  to: 140, moq: 1, note: 'Full leather, padded, or simple strap styles',     leadTime: '10–14 days' },
  { category: 'Browbands',     from: 18,  to: 85,  moq: 1, note: 'Plain leather, crystal-set, or embroidered',        leadTime: '7–10 days'  },
  { category: 'Saddle Pads',   from: 24,  to: 110, moq: 5, note: 'GP, dressage, or jumping cut',                      leadTime: '7–10 days'  },
  { category: 'Horse Rugs',    from: 65,  to: 210, moq: 3, note: 'Turnout (lightweight to 400g) and stable',          leadTime: '14–21 days' },
  { category: 'Head Collars',  from: 16,  to: 60,  moq: 1, note: 'Leather or nylon with name plate option',           leadTime: '7–12 days'  },
  { category: 'Numnahs',       from: 20,  to: 75,  moq: 5, note: 'Quilted and fleece-lined options',                  leadTime: '7–10 days'  },
  { category: 'Leg Boots',     from: 28,  to: 95,  moq: 4, note: 'Brushing, tendon, and over-reach styles',           leadTime: '10–14 days' },
];

const VOLUME_TIERS = [
  { range: '1 – 4 units',   discount: 'Base price', highlight: false },
  { range: '5 – 19 units',  discount: '10% off',    highlight: false },
  { range: '20 – 49 units', discount: '15% off',    highlight: true  },
  { range: '50 – 99 units', discount: '20% off',    highlight: false },
  { range: '100+ units',    discount: '30% off',    highlight: false },
];

const inputStyle = { width: '100%', padding: '11px 14px', border: '1.5px solid #e8e4de', borderRadius: 8, fontSize: 14, outline: 'none', background: '#faf9f7', color: '#1a1a1a', boxSizing: 'border-box' as const, fontFamily: 'inherit' };

export default function PriceListsPage() {
  const [form, setForm] = useState({ name: '', email: '', company: '' });
  const [sent, setSent] = useState(false);

  return (
    <main style={{ minHeight: '100vh', background: '#faf9f7' }}>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2017 100%)', color: '#fff', padding: 'clamp(56px, 7vw, 88px) 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: '#C8860A', fontWeight: 700, marginBottom: 14 }}>Transparency</p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.02em' }}>Price Lists</h1>
        <p style={{ fontSize: 16, color: '#aaa', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
          Starting prices, volume discount tiers, and lead times for every product category. Live prices with all options are shown in the configurator.
        </p>
      </section>

      <section style={{ maxWidth: 1060, margin: '0 auto', padding: 'clamp(40px, 5vw, 64px) 24px' }}>

        {/* Base price table */}
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>Base Prices by Category</h2>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
          Prices shown are base prices before option modifiers (hardware, material, embroidery, etc.) and exclude VAT. Final price is always shown live in the configurator before you submit.
        </p>
        <div style={{ background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 14, overflow: 'hidden', marginBottom: 48 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Category', 'Base from', 'Base to', 'MOQ', 'Lead time', 'Notes'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#f5f3ef', borderBottom: '1px solid #e8e4de' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BASE_PRICES.map((r, i) => (
                <tr key={r.category} style={{ background: i % 2 === 1 ? '#faf9f7' : '#fff' }}>
                  <td style={{ padding: '13px 16px', fontWeight: 700, color: '#1a1a1a', fontSize: 14 }}>{r.category}</td>
                  <td style={{ padding: '13px 16px', fontSize: 14, color: '#C8860A', fontWeight: 700 }}>€{r.from}</td>
                  <td style={{ padding: '13px 16px', fontSize: 14, color: '#555' }}>€{r.to}</td>
                  <td style={{ padding: '13px 16px', fontSize: 14, color: '#555' }}>{r.moq}</td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: '#777' }}>{r.leadTime}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#999' }}>{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Volume tiers */}
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>Volume Discount Tiers</h2>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
          Discounts apply automatically in the configurator and at checkout based on quantity ordered.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 48 }}>
          {VOLUME_TIERS.map(t => (
            <div key={t.range} style={{ background: t.highlight ? '#fff8ec' : '#fff', border: `1.5px solid ${t.highlight ? '#C8860A' : '#e8e4de'}`, borderRadius: 12, padding: '20px 16px', textAlign: 'center', position: 'relative' }}>
              {t.highlight && <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#C8860A', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>Most Popular</span>}
              <p style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 8 }}>{t.range}</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: t.highlight ? '#C8860A' : '#1a1a1a' }}>{t.discount}</p>
            </div>
          ))}
        </div>

        {/* Express */}
        <div style={{ background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 14, padding: 'clamp(20px, 3vw, 32px)', marginBottom: 48 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Express Production</h3>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.75 }}>
            Express production (approximately half the standard lead time) is available on all categories except Horse Rugs.
            A <strong>25% price premium</strong> applies and is calculated automatically when you select Express delivery in the configurator.
            Express lead times: Browbands 4–5 days · Bridles 5–7 days · Saddle pads 4–5 days · Head collars 4–6 days.
          </p>
        </div>

        {/* Wholesale price list request */}
        <div style={{ background: '#1a1a1a', borderRadius: 16, padding: 'clamp(28px, 4vw, 44px)', color: '#fff' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 40, alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Full Wholesale Price List</h2>
              <p style={{ color: '#888', fontSize: 14, lineHeight: 1.75, marginBottom: 16 }}>
                Our full PDF price list includes per-unit pricing for every option combination across all 7 categories, with wholesale discount tiers applied. Available to approved wholesale partners and verified businesses.
              </p>
              <p style={{ color: '#C8860A', fontSize: 13, fontWeight: 600 }}>Alternatively, use our live configurator for instant per-unit pricing.</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 28 }}>
              {sent ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <p style={{ fontWeight: 700, fontSize: 15 }}>Request received!</p>
                  <p style={{ color: '#888', fontSize: 13, marginTop: 6 }}>We'll email the price list within 1 business day.</p>
                </div>
              ) : (
                <form onSubmit={e => { e.preventDefault(); setSent(true); }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Request Wholesale Price List</p>
                  <input required placeholder="Full name"        value={form.name}    onChange={e => setForm({ ...form, name: e.target.value })}    style={{ ...inputStyle, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} />
                  <input required type="email" placeholder="Business email"  value={form.email}   onChange={e => setForm({ ...form, email: e.target.value })}   style={{ ...inputStyle, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} />
                  <input required placeholder="Company name"    value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} style={{ ...inputStyle, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} />
                  <button type="submit" style={{ background: '#C8860A', color: '#fff', fontWeight: 700, padding: '12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14 }}>
                    Send me the price list
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

      </section>
    </main>
  );
}
