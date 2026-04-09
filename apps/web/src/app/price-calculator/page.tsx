'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

// ─── Volume discount tiers ────────────────────────────────────────────────────

const B2C_TIERS = [
  { min: 1,   max: 4,   label: '1–4 units',    pct: 0  },
  { min: 5,   max: 19,  label: '5–19 units',   pct: 5  },
  { min: 20,  max: 49,  label: '20–49 units',  pct: 10 },
  { min: 50,  max: 99,  label: '50–99 units',  pct: 15 },
  { min: 100, max: Infinity, label: '100+ units', pct: 18 },
];

const B2B_TIERS = [
  { min: 1,   max: 4,   label: '1–4 units',    pct: 10 },
  { min: 5,   max: 19,  label: '5–19 units',   pct: 20 },
  { min: 20,  max: 49,  label: '20–49 units',  pct: 25 },
  { min: 50,  max: 99,  label: '50–99 units',  pct: 30 },
  { min: 100, max: Infinity, label: '100+ units', pct: 35 },
];

function getDiscount(qty: number, tiers: typeof B2C_TIERS) {
  return tiers.find(t => qty >= t.min && qty <= t.max)?.pct ?? 0;
}

function fmt(n: number) {
  return n.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PriceCalculatorPage() {
  const [mode, setMode] = useState<'b2c' | 'b2b'>('b2c');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [express, setExpress] = useState(false);
  const [includeVat, setIncludeVat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{ product: any; qty: number; unitPrice: number; total: number; mode: string }[]>([]);

  useEffect(() => {
    fetch(`${API}/products?limit=200`)
      .then(r => r.json())
      .then(d => {
        const prods: any[] = d.data || [];
        setProducts(prods);
        const cats = [...new Set(prods.map((p: any) => p.category?.name).filter(Boolean))].sort();
        setCategories(cats as string[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(() =>
    selectedCategory ? products.filter(p => p.category?.name === selectedCategory) : products,
    [products, selectedCategory]
  );

  const tiers = mode === 'b2b' ? B2B_TIERS : B2C_TIERS;
  const discountPct = getDiscount(qty, tiers);
  const basePriceUnit = selectedProduct ? parseFloat(selectedProduct.basePrice) : 0;
  const afterDiscount = basePriceUnit * (1 - discountPct / 100);
  const afterExpress = express ? afterDiscount * 1.25 : afterDiscount;
  const vatMultiplier = includeVat ? 1.21 : 1;
  const unitPrice = afterExpress * vatMultiplier;
  const totalPrice = unitPrice * qty;
  const savings = (basePriceUnit * qty) - (afterExpress * qty);

  function addToQuote() {
    if (!selectedProduct || qty < 1) return;
    setCart(c => [...c, {
      product: selectedProduct,
      qty,
      unitPrice: afterExpress,
      total: afterExpress * qty,
      mode,
    }]);
  }

  function removeFromCart(i: number) {
    setCart(c => c.filter((_, idx) => idx !== i));
  }

  const cartTotal = cart.reduce((s, item) => s + item.total, 0);
  const cartTotalVat = cartTotal * 1.21;

  return (
    <main style={{ minHeight: '100vh', background: '#faf9f7' }}>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2017 100%)', color: '#fff', padding: 'clamp(48px,6vw,80px) 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: '#C8860A', fontWeight: 700, marginBottom: 14 }}>Pricing Tool</p>
        <h1 style={{ fontSize: 'clamp(26px,4vw,44px)', fontWeight: 800, marginBottom: 14, letterSpacing: '-0.02em' }}>Price Calculator</h1>
        <p style={{ fontSize: 16, color: '#aaa', maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>
          Instantly calculate unit and total prices for any quantity — for private customers (B2C) and business buyers (B2B).
        </p>
      </section>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(32px,4vw,56px) 24px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>

        {/* ── Left: calculator ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Mode toggle */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e8e4de' }}>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', marginBottom: 12 }}>Customer type</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {([['b2c', '🛒 Consumer (B2C)', 'Standard prices + volume discounts, incl. VAT option'], ['b2b', '🏢 Business (B2B)', 'Wholesale rates, deeper volume discounts, ex-VAT']] as const).map(([val, label, sub]) => (
                <button key={val} type="button" onClick={() => setMode(val as 'b2c'|'b2b')}
                  style={{ padding: '14px 16px', border: `2px solid ${mode === val ? '#C8860A' : '#e8e4de'}`, borderRadius: 10, background: mode === val ? 'rgba(200,134,10,0.06)' : '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: mode === val ? '#C8860A' : '#1a1a1a' }}>{label}</p>
                  <p style={{ fontSize: 12, color: '#888', marginTop: 3 }}>{sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Product selection */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e8e4de' }}>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', marginBottom: 12 }}>Select product</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6 }}>Category</label>
                <select
                  aria-label="Product category"
                  value={selectedCategory}
                  onChange={e => { setSelectedCategory(e.target.value); setSelectedProduct(null); }}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e8e4de', borderRadius: 8, fontSize: 14, background: '#faf9f7', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="">All categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6 }}>Product</label>
                <select
                  aria-label="Product"
                  value={selectedProduct?.id || ''}
                  onChange={e => setSelectedProduct(filteredProducts.find(p => p.id === e.target.value) || null)}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e8e4de', borderRadius: 8, fontSize: 14, background: '#faf9f7', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="">Choose a product…</option>
                  {filteredProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — €{parseFloat(p.basePrice).toFixed(2)}</option>
                  ))}
                </select>
              </div>
            </div>
            {selectedProduct && (
              <div style={{ padding: '12px 14px', background: '#f5f0e8', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{selectedProduct.name}</p>
                  <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{selectedProduct.category?.name} · Base price: €{fmt(basePriceUnit)}</p>
                </div>
                {selectedProduct.isCustomizable && (
                  <Link href={`/customize/${selectedProduct.category?.slug}?productId=${selectedProduct.id}`}
                    style={{ fontSize: 12, color: '#C8860A', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Configure →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Quantity */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e8e4de' }}>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', marginBottom: 12 }}>Quantity</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))}
                style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #1a1a1a', fontSize: 20, fontWeight: 700, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <input type="number" aria-label="Quantity" min={1} value={qty}
                onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ width: 90, textAlign: 'center', padding: '10px', border: '1.5px solid #e8e4de', borderRadius: 8, fontSize: 18, fontWeight: 700, color: '#1a1a1a', outline: 'none' }} />
              <button type="button" onClick={() => setQty(q => q + 1)}
                style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #1a1a1a', fontSize: 20, fontWeight: 700, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              <span style={{ fontSize: 14, color: '#888' }}>units</span>
            </div>

            {/* Tier pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {tiers.map(t => {
                const active = qty >= t.min && qty <= t.max;
                return (
                  <button key={t.label} type="button" onClick={() => setQty(t.min)}
                    style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: `1.5px solid ${active ? '#C8860A' : '#e8e4de'}`, background: active ? '#C8860A' : '#fff', color: active ? '#fff' : '#555', cursor: 'pointer', transition: 'all 0.2s' }}>
                    {t.label} {t.pct > 0 ? `— ${t.pct}% off` : '— base price'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Options */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e8e4de' }}>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', marginBottom: 12 }}>Options</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <ToggleSwitch value={express} onChange={setExpress} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>Express production</p>
                  <p style={{ fontSize: 12, color: '#888' }}>Approx. half the standard lead time · +25% surcharge</p>
                </div>
              </label>
              {mode === 'b2c' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <ToggleSwitch value={includeVat} onChange={setIncludeVat} />
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>Show prices incl. 21% VAT</p>
                    <p style={{ fontSize: 12, color: '#888' }}>B2B prices are always shown ex-VAT</p>
                  </div>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: summary + quote ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 24 }}>

          {/* Price breakdown */}
          <div style={{ background: '#1a1a1a', borderRadius: 16, padding: 24, color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888' }}>Price summary</p>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: mode === 'b2b' ? '#C8860A' : '#2a5f9e', color: '#fff', fontWeight: 700 }}>
                {mode === 'b2b' ? 'B2B' : 'B2C'}
              </span>
            </div>

            {selectedProduct ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  <Row label="Base price / unit" value={`€${fmt(basePriceUnit)}`} />
                  {discountPct > 0 && <Row label={`Volume discount (${discountPct}%)`} value={`−€${fmt(basePriceUnit * discountPct / 100)}`} color="#4ade80" />}
                  {express && <Row label="Express surcharge (+25%)" value={`+€${fmt(afterDiscount * 0.25)}`} color="#fbbf24" />}
                  {includeVat && mode === 'b2c' && <Row label="VAT (21%)" value={`+€${fmt(afterExpress * 0.21)}`} color="#9ca3af" />}
                  <div style={{ borderTop: '1px solid #333', paddingTop: 10 }}>
                    <Row label={`Unit price${includeVat && mode === 'b2c' ? ' (incl. VAT)' : ' (ex-VAT)'}`} value={`€${fmt(unitPrice)}`} large />
                  </div>
                  <div style={{ borderTop: '1px solid #333', paddingTop: 10 }}>
                    <Row label={`Total for ${qty} unit${qty > 1 ? 's' : ''}`} value={`€${fmt(totalPrice)}`} large gold />
                  </div>
                  {savings > 0 && (
                    <div style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, padding: '10px 14px', marginTop: 4 }}>
                      <p style={{ fontSize: 13, color: '#4ade80', fontWeight: 600 }}>You save €{fmt(savings)} vs. base price</p>
                    </div>
                  )}
                  {mode === 'b2b' && (
                    <p style={{ fontSize: 11, color: '#555', marginTop: 4 }}>All prices ex-VAT (21%). VAT invoiced separately.</p>
                  )}
                </div>

                <button type="button" onClick={addToQuote}
                  style={{ width: '100%', padding: '14px', background: '#C8860A', color: '#fff', fontWeight: 700, fontSize: 15, borderRadius: 10, border: 'none', cursor: 'pointer', marginBottom: 10 }}>
                  + Add to Quote
                </button>
                {selectedProduct.isCustomizable && (
                  <Link href={`/customize/${selectedProduct.category?.slug}?productId=${selectedProduct.id}`}
                    style={{ display: 'block', width: '100%', padding: '12px', background: 'transparent', color: '#C8860A', fontWeight: 600, fontSize: 14, borderRadius: 10, border: '1.5px solid #C8860A', textAlign: 'center', textDecoration: 'none' }}>
                    Configure & Order →
                  </Link>
                )}
              </>
            ) : (
              <p style={{ color: '#555', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>Select a product to see pricing</p>
            )}
          </div>

          {/* Discount table */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e8e4de' }}>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', marginBottom: 12 }}>
              {mode === 'b2b' ? 'B2B' : 'B2C'} discount tiers
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #f0ece6' }}>
                  <th style={{ textAlign: 'left', padding: '6px 0', color: '#888', fontWeight: 600 }}>Quantity</th>
                  <th style={{ textAlign: 'right', padding: '6px 0', color: '#888', fontWeight: 600 }}>Discount</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map(t => {
                  const active = qty >= t.min && qty <= t.max;
                  return (
                    <tr key={t.label} style={{ borderBottom: '1px solid #f5f0e8', background: active ? 'rgba(200,134,10,0.06)' : 'transparent' }}>
                      <td style={{ padding: '8px 0', fontWeight: active ? 700 : 400, color: active ? '#C8860A' : '#555' }}>{t.label}</td>
                      <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: active ? 700 : 400, color: active ? '#C8860A' : '#555' }}>
                        {t.pct > 0 ? `${t.pct}% off` : 'Base price'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Info */}
          <div style={{ background: '#f5f0e8', borderRadius: 12, padding: '14px 18px', fontSize: 12, color: '#666', lineHeight: 1.7 }}>
            <p><strong>B2B accounts</strong> require approval. <Link href="/wholesale" style={{ color: '#C8860A' }}>Apply here →</Link></p>
            <p style={{ marginTop: 4 }}>Final prices confirmed at quote stage. Shipping calculated at checkout.</p>
          </div>
        </div>
      </div>

      {/* ── Quote basket ─────────────────────────────────────────────────────── */}
      {cart.length > 0 && (
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 56px' }}>
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8e4de', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e8e4de', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Quote Summary ({cart.length} line{cart.length > 1 ? 's' : ''})</h2>
              <button type="button" onClick={() => setCart([])}
                style={{ fontSize: 12, color: '#999', background: 'none', border: 'none', cursor: 'pointer' }}>Clear all</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#faf9f7' }}>
                    {['Product', 'Type', 'Qty', 'Unit price (ex-VAT)', 'Total (ex-VAT)', ''].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: h === '' ? 'center' : 'left', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #f0ece6' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1a1a1a' }}>{item.product.name}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: item.mode === 'b2b' ? '#fef3c7' : '#dbeafe', color: item.mode === 'b2b' ? '#92400e' : '#1e40af', fontWeight: 700 }}>
                          {item.mode.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#555' }}>{item.qty}</td>
                      <td style={{ padding: '12px 16px', color: '#555' }}>€{fmt(item.unitPrice)}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1a1a1a' }}>€{fmt(item.total)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button type="button" onClick={() => removeFromCart(i)}
                          style={{ color: '#d1d5db', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid #e8e4de', background: '#faf9f7' }}>
                    <td colSpan={4} style={{ padding: '14px 16px', fontWeight: 700, color: '#1a1a1a' }}>Total ex-VAT</td>
                    <td style={{ padding: '14px 16px', fontWeight: 800, fontSize: 16, color: '#1a1a1a' }}>€{fmt(cartTotal)}</td>
                    <td />
                  </tr>
                  <tr style={{ background: '#faf9f7' }}>
                    <td colSpan={4} style={{ padding: '4px 16px 14px', fontSize: 12, color: '#888' }}>incl. 21% VAT</td>
                    <td style={{ padding: '4px 16px 14px', fontSize: 13, color: '#888' }}>€{fmt(cartTotalVat)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e8e4de', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Link href="/contact" style={{ padding: '12px 24px', border: '1.5px solid #1a1a1a', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#1a1a1a', textDecoration: 'none' }}>
                Request Quote by Email
              </Link>
              <Link href="/wholesale" style={{ padding: '12px 24px', background: '#C8860A', borderRadius: 8, fontSize: 14, fontWeight: 700, color: '#fff', textDecoration: 'none' }}>
                Apply for B2B Account →
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

// ─── Small helpers ─────────────────────────────────────────────────────────────

function Row({ label, value, large, gold, color }: { label: string; value: string; large?: boolean; gold?: boolean; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: large ? 14 : 13, color: '#888' }}>{label}</span>
      <span style={{ fontSize: large ? 16 : 13, fontWeight: large ? 700 : 500, color: gold ? '#C8860A' : color || '#fff' }}>{value}</span>
    </div>
  );
}

function ToggleSwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={value} onClick={() => onChange(!value)}
      style={{ width: 44, height: 24, borderRadius: 12, background: value ? '#C8860A' : '#d1d5db', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
      <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: value ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', display: 'block' }} />
    </button>
  );
}
