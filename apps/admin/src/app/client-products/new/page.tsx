'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

function authH(json = false) {
  const tok = typeof window !== 'undefined' ? localStorage.getItem('accessToken') || '' : '';
  return { Authorization: `Bearer ${tok}`, ...(json ? { 'Content-Type': 'application/json' } : {}) };
}

const CATEGORIES = ['Bridles', 'Browbands', 'Halters', 'Reins', 'Girths', 'Saddle Pads', 'Breastplates', 'Other'];

export default function NewClientProductPage() {
  const router = useRouter();
  const [clients, setClients]           = useState<any[]>([]);
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');

  const [form, setForm] = useState({
    clientId: '', name: '', category: '', basePrice: '', unitPrice: '',
    moq: '1', leadTimeDays: '21', manufacturerId: '', backupManufacturerId: '',
    adminNotes: '',
    specifications: '{\n  "material": "",\n  "color": "",\n  "hardware": "",\n  "size": "",\n  "stitching": ""\n}',
  });

  useEffect(() => {
    fetch(`${API}/auth/admin/wholesale-pending?limit=200`, { headers: authH() })
      .then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : d.data || [])).catch(() => {});
    fetch(`${API}/manufacturers`, { headers: authH() })
      .then(r => r.json()).then(d => setManufacturers(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const f = (k: string) => (e: any) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  async function handleSave(status: 'draft' | 'in_development') {
    if (!form.clientId || !form.name || !form.category || !form.basePrice || !form.unitPrice) {
      setError('Please fill in all required fields.'); return;
    }
    let specs: any = {};
    try { specs = JSON.parse(form.specifications); } catch { setError('Specifications must be valid JSON.'); return; }

    setSaving(true); setError('');
    try {
      const res = await fetch(`${API}/client-products/admin`, {
        method: 'POST', headers: authH(true),
        body: JSON.stringify({
          clientId: form.clientId, name: form.name, category: form.category,
          specifications: specs,
          basePrice: Number(form.basePrice), unitPrice: Number(form.unitPrice),
          moq: Number(form.moq) || 1, leadTimeDays: Number(form.leadTimeDays) || 21,
          manufacturerId: form.manufacturerId || undefined,
          backupManufacturerId: form.backupManufacturerId || undefined,
          adminNotes: form.adminNotes || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to create');
      const prod = await res.json();
      // Update status if not draft
      if (status !== 'draft') {
        await fetch(`${API}/client-products/admin/${prod.id}`, {
          method: 'PATCH', headers: authH(true), body: JSON.stringify({ status }),
        });
      }
      router.push('/client-products');
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally { setSaving(false); }
  }

  const inp = { padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, width: '100%', outline: 'none', background: 'white', boxSizing: 'border-box' as const };
  const lbl = { display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 } as const;

  return (
    <div style={{ padding: 32, maxWidth: 860 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>New Client Product</h1>
        <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>Create a custom product template for a specific B2B client</p>
      </div>

      <div style={{ display: 'grid', gap: 20 }}>
        {/* Client + Basic Info */}
        <div style={{ background: 'white', borderRadius: 12, padding: 28, border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>Client & Product Info</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Client <span style={{ color: '#C8860A' }}>*</span></label>
              <select value={form.clientId} onChange={f('clientId')} style={inp}>
                <option value="">— Select B2B Client —</option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.companyName || c.fullName} ({c.email})</option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Product Name <span style={{ color: '#C8860A' }}>*</span></label>
              <input type="text" placeholder="e.g. Dressage Bridle Premium V1" value={form.name} onChange={f('name')} style={inp} />
            </div>
            <div>
              <label style={lbl}>Category <span style={{ color: '#C8860A' }}>*</span></label>
              <select value={form.category} onChange={f('category')} style={inp}>
                <option value="">— Select —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div />
            <div>
              <label style={lbl}>Base Price (€) <span style={{ color: '#C8860A' }}>*</span></label>
              <input type="number" step="0.01" min="0" placeholder="0.00" value={form.basePrice} onChange={f('basePrice')} style={inp} />
            </div>
            <div>
              <label style={lbl}>Unit Price for Client (€) <span style={{ color: '#C8860A' }}>*</span></label>
              <input type="number" step="0.01" min="0" placeholder="0.00" value={form.unitPrice} onChange={f('unitPrice')} style={inp} />
            </div>
            <div>
              <label style={lbl}>MOQ (units)</label>
              <input type="number" min="1" value={form.moq} onChange={f('moq')} style={inp} />
            </div>
            <div>
              <label style={lbl}>Lead Time (days)</label>
              <input type="number" min="1" value={form.leadTimeDays} onChange={f('leadTimeDays')} style={inp} />
            </div>
          </div>
        </div>

        {/* Manufacturers */}
        <div style={{ background: 'white', borderRadius: 12, padding: 28, border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>Manufacturer Assignment</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={lbl}>Preferred Manufacturer</label>
              <select value={form.manufacturerId} onChange={f('manufacturerId')} style={inp}>
                <option value="">— None —</option>
                {manufacturers.map((m: any) => <option key={m.id} value={m.id}>{m.name} ({m.country || 'N/A'})</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Backup Manufacturer</label>
              <select value={form.backupManufacturerId} onChange={f('backupManufacturerId')} style={inp}>
                <option value="">— None —</option>
                {manufacturers.map((m: any) => <option key={m.id} value={m.id}>{m.name} ({m.country || 'N/A'})</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div style={{ background: 'white', borderRadius: 12, padding: 28, border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 8, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>Product Specifications (JSON)</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>Store full technical specs: material, color, hardware, measurements, etc.</p>
          <textarea
            value={form.specifications} onChange={f('specifications')} rows={8}
            spellCheck={false}
            style={{ ...inp, fontFamily: 'monospace', fontSize: 13, resize: 'vertical' }}
          />
        </div>

        {/* Notes */}
        <div style={{ background: 'white', borderRadius: 12, padding: 28, border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>Internal Notes</h2>
          <textarea value={form.adminNotes} onChange={f('adminNotes')} rows={3}
            placeholder="Internal notes about this product (not visible to client)…"
            style={{ ...inp, resize: 'vertical' }}
          />
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
            <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => router.back()}
            style={{ padding: '11px 24px', border: '1.5px solid #e2e8f0', borderRadius: 8, background: 'white', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            Cancel
          </button>
          <button type="button" disabled={saving} onClick={() => handleSave('draft')}
            style={{ padding: '11px 24px', border: '1.5px solid #1A3C5E', borderRadius: 8, background: 'white', color: '#1A3C5E', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            Save as Draft
          </button>
          <button type="button" disabled={saving} onClick={() => handleSave('in_development')}
            style={{ padding: '11px 28px', border: 'none', borderRadius: 8, background: '#1A3C5E', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            {saving ? 'Saving…' : 'Create & Start Development →'}
          </button>
        </div>
      </div>
    </div>
  );
}
