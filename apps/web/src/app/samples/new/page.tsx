'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

const CATEGORIES = [
  { label: 'Bridle',       slug: 'bridles' },
  { label: 'Browband',     slug: 'browbands' },
  { label: 'Halter',       slug: 'halters' },
  { label: 'Reins',        slug: 'reins' },
  { label: 'Girth',        slug: 'girths' },
  { label: 'Saddle Pad',   slug: 'saddle-pads' },
  { label: 'Breastplate',  slug: 'breastplates' },
  { label: 'Other',        slug: 'other' },
];

const MATERIALS = ['Full Grain Leather', 'Biothane', 'Nylon', 'Synthetic', 'Other'];
const HARDWARE  = ['Gold', 'Silver / Stainless', 'Rose Gold', 'Black', 'Antique Brass', 'No Preference'];

export default function NewSampleRequestPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    categorySlug:    '',
    productName:     '',
    quantity:        '1',
    material:        '',
    leatherColor:    '',
    stitchingColor:  '',
    hardware:        '',
    size:            '',
    description:     '',
    clientNotes:     '',
    referenceUrls:   '',   // comma-separated image URLs
  });

  const f = (k: string) => (e: any) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.categorySlug || !form.productName) {
      setError('Category and product name are required.');
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      router.push('/login?redirect=/samples/new');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const referenceFiles = form.referenceUrls
        .split(',')
        .map(u => u.trim())
        .filter(Boolean);

      const configSnapshot: Record<string, string> = {};
      if (form.material)       configSnapshot.material       = form.material;
      if (form.leatherColor)   configSnapshot.color          = form.leatherColor;
      if (form.stitchingColor) configSnapshot.stitching      = form.stitchingColor;
      if (form.hardware)       configSnapshot.hardware       = form.hardware;
      if (form.size)           configSnapshot.size           = form.size;
      if (form.description)    configSnapshot.description    = form.description;

      const res = await fetch(`${API}/samples`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          categorySlug:  form.categorySlug,
          productName:   form.productName,
          description:   form.description,
          configSnapshot,
          quantity:      parseInt(form.quantity) || 1,
          clientNotes:   form.clientNotes || undefined,
          referenceFiles,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Submission failed');
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb',
    borderRadius: 10, fontSize: 14, outline: 'none', background: 'white',
    boxSizing: 'border-box', fontFamily: 'inherit',
  };
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6,
  };

  if (submitted) return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: '48px 40px', maxWidth: 480, textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', marginBottom: 10 }}>Sample Request Submitted!</h2>
        <p style={{ color: '#6b7280', lineHeight: 1.6, marginBottom: 28 }}>
          Our team will review your request and get back to you within <strong>1–2 business days</strong> with a sampling quote and timeline.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/account/samples"
            style={{ background: 'var(--navy)', color: 'white', padding: '11px 24px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>
            Track My Requests
          </Link>
          <Link href="/samples/new"
            style={{ border: '2px solid var(--navy)', color: 'var(--navy)', padding: '11px 24px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: 14 }}
            onClick={() => setSubmitted(false)}>
            New Request
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Header */}
      <div style={{ background: 'var(--navy)', color: 'white', padding: '32px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
            B2B Sampling
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>New Sample Request</h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>
            Describe what you need — our team will produce a physical sample for your approval before bulk production.
          </p>
        </div>
      </div>

      {/* Process strip */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '14px 24px', display: 'flex', gap: 0, overflowX: 'auto' }}>
          {['Submit Request', 'Review (1–2d)', 'Sample Produced', 'Your Approval', 'Bulk Production'].map((step, i, arr) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 110 }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: i === 0 ? 'var(--gold)' : '#e5e7eb', color: i === 0 ? 'white' : '#9ca3af', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px' }}>{i + 1}</div>
                <p style={{ fontSize: 11, color: i === 0 ? 'var(--navy)' : '#9ca3af', fontWeight: i === 0 ? 700 : 400 }}>{step}</p>
              </div>
              {i < arr.length - 1 && <div style={{ width: 16, height: 1.5, background: '#e5e7eb', flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: 20 }}>

            {/* Product basics */}
            <div style={{ background: 'white', borderRadius: 16, padding: 28, border: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #f3f4f6' }}>
                Product Details
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={lbl}>Product Category <span style={{ color: 'var(--gold)' }}>*</span></label>
                  <select required value={form.categorySlug} onChange={f('categorySlug')} style={inp}>
                    <option value="">— Select category —</option>
                    {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Quantity Needed <span style={{ color: 'var(--gold)' }}>*</span></label>
                  <input type="number" min="1" required value={form.quantity} onChange={f('quantity')} style={inp} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={lbl}>Product Name / Working Title <span style={{ color: 'var(--gold)' }}>*</span></label>
                  <input type="text" required placeholder="e.g. Dressage Bridle with Padding — Black/Gold" value={form.productName} onChange={f('productName')} style={inp} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={lbl}>Description</label>
                  <textarea rows={3} placeholder="Describe the product in your own words — style, purpose, key features…" value={form.description} onChange={f('description')} style={{ ...inp, resize: 'vertical' }} />
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div style={{ background: 'white', borderRadius: 16, padding: 28, border: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #f3f4f6' }}>
                Specifications
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={lbl}>Material</label>
                  <select value={form.material} onChange={f('material')} style={inp}>
                    <option value="">— Select or type below —</option>
                    {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Hardware / Buckle Finish</label>
                  <select value={form.hardware} onChange={f('hardware')} style={inp}>
                    <option value="">— Select —</option>
                    {HARDWARE.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Leather / Main Colour</label>
                  <input type="text" placeholder="e.g. Black, Dark Brown, Havana" value={form.leatherColor} onChange={f('leatherColor')} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Stitching Colour</label>
                  <input type="text" placeholder="e.g. White, Black, Contrast" value={form.stitchingColor} onChange={f('stitchingColor')} style={inp} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={lbl}>Size / Measurements</label>
                  <input type="text" placeholder="e.g. Full, Cob, Mini — or exact measurements in cm" value={form.size} onChange={f('size')} style={inp} />
                </div>
              </div>
            </div>

            {/* Notes & References */}
            <div style={{ background: 'white', borderRadius: 16, padding: 28, border: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #f3f4f6' }}>
                Notes & Reference Images
              </h2>
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={lbl}>Special Requirements / Notes</label>
                  <textarea rows={4} placeholder="Any additional details — branding, logo embossing, custom measurements, special stitching pattern, delivery deadline, etc." value={form.clientNotes} onChange={f('clientNotes')} style={{ ...inp, resize: 'vertical' }} />
                </div>
                <div>
                  <label style={lbl}>Reference Image URLs <span style={{ fontSize: 12, fontWeight: 400, color: '#9ca3af' }}>(optional — paste links separated by commas)</span></label>
                  <textarea rows={2} placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg" value={form.referenceUrls} onChange={f('referenceUrls')} style={{ ...inp, resize: 'vertical' }} />
                  <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>
                    You can also email reference photos directly to <strong>samples@blikcart.nl</strong> with your order name in the subject line.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10 }}>
                <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>{error}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
              <Link href="/account/samples" style={{ color: '#6b7280', fontSize: 14, textDecoration: 'none' }}>
                ← My Sample Requests
              </Link>
              <button type="submit" disabled={submitting}
                style={{ padding: '13px 36px', border: 'none', borderRadius: 10, background: submitting ? '#9ca3af' : 'var(--navy)', color: 'white', fontWeight: 800, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                {submitting ? 'Submitting…' : 'Submit Sample Request →'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
