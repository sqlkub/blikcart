'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

function authH(json = false) {
  const tok = typeof window !== 'undefined' ? localStorage.getItem('accessToken') || '' : '';
  return { Authorization: `Bearer ${tok}`, ...(json ? { 'Content-Type': 'application/json' } : {}) };
}

const STATUS_FLOW = ['draft', 'in_development', 'approved', 'discontinued'] as const;
const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  draft:          { label: 'Draft',          color: '#9ca3af', bg: '#f3f4f6' },
  in_development: { label: 'In Development', color: '#d97706', bg: '#fffbeb' },
  approved:       { label: 'Approved',       color: '#16a34a', bg: '#f0fdf4' },
  discontinued:   { label: 'Discontinued',   color: '#dc2626', bg: '#fef2f2' },
};

const CATEGORIES = ['Bridles', 'Browbands', 'Halters', 'Reins', 'Girths', 'Saddle Pads', 'Breastplates', 'Other'];

export default function ClientProductDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [product, setProduct] = useState<any>(null);
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'reorders' | 'versions'>('details');
  const [showNewVersion, setShowNewVersion] = useState(false);
  const [newVersionNotes, setNewVersionNotes] = useState('');

  const [form, setForm] = useState({
    name: '', category: '', basePrice: '', unitPrice: '',
    moq: '', leadTimeDays: '', manufacturerId: '', backupManufacturerId: '',
    adminNotes: '', specifications: '',
  });

  function loadProduct() {
    fetch(`${API}/client-products/admin/${id}`, { headers: authH() })
      .then(r => r.json())
      .then(d => {
        setProduct(d);
        setForm({
          name: d.name || '',
          category: d.category || '',
          basePrice: String(d.basePrice || ''),
          unitPrice: String(d.unitPrice || ''),
          moq: String(d.moq || '1'),
          leadTimeDays: String(d.leadTimeDays || '21'),
          manufacturerId: d.manufacturerId || '',
          backupManufacturerId: d.backupManufacturerId || '',
          adminNotes: d.adminNotes || '',
          specifications: JSON.stringify(d.specifications || {}, null, 2),
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    loadProduct();
    fetch(`${API}/manufacturers`, { headers: authH() })
      .then(r => r.json()).then(d => setManufacturers(Array.isArray(d) ? d : [])).catch(() => {});
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const f = (k: string) => (e: any) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  async function handleSave() {
    let specs: any = {};
    try { specs = JSON.parse(form.specifications); } catch { setError('Specifications must be valid JSON.'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch(`${API}/client-products/admin/${id}`, {
        method: 'PATCH', headers: authH(true),
        body: JSON.stringify({
          name: form.name, category: form.category,
          specifications: specs,
          basePrice: Number(form.basePrice), unitPrice: Number(form.unitPrice),
          moq: Number(form.moq) || 1, leadTimeDays: Number(form.leadTimeDays) || 21,
          manufacturerId: form.manufacturerId || null,
          backupManufacturerId: form.backupManufacturerId || null,
          adminNotes: form.adminNotes || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to save');
      loadProduct();
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally { setSaving(false); }
  }

  async function handleStatusChange(newStatus: string) {
    setSaving(true); setError('');
    try {
      const res = await fetch(`${API}/client-products/admin/${id}`, {
        method: 'PATCH', headers: authH(true),
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to update status');
      loadProduct();
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally { setSaving(false); }
  }

  async function handleNewVersion() {
    setSaving(true); setError('');
    try {
      const res = await fetch(`${API}/client-products/admin/${id}/new-version`, {
        method: 'POST', headers: authH(true),
        body: JSON.stringify({ adminNotes: newVersionNotes }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to create version');
      const newProd = await res.json();
      router.push(`/client-products/${newProd.id}`);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally { setSaving(false); setShowNewVersion(false); }
  }

  const inp = { padding: '9px 13px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, width: '100%', outline: 'none', background: 'white', boxSizing: 'border-box' as const };
  const lbl = { display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 5 } as const;

  if (loading) return <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>Loading…</div>;
  if (!product) return <div style={{ padding: 48, textAlign: 'center', color: '#dc2626' }}>Product not found.</div>;

  const st = STATUS_META[product.status] || STATUS_META.draft;

  return (
    <div style={{ padding: 32, maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/client-products" style={{ color: '#64748b', fontSize: 13, textDecoration: 'none' }}>← Client Products</Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>{product.name}</h1>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#1A3C5E', background: '#e8f0f7', padding: '3px 10px', borderRadius: 12 }}>V{product.version}</span>
              <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
            </div>
            <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>
              {product.client?.companyName || product.client?.fullName} · {product.category}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => setShowNewVersion(true)}
              style={{ padding: '9px 18px', border: '1.5px solid #1A3C5E', borderRadius: 8, background: 'white', color: '#1A3C5E', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              + New Version
            </button>
          </div>
        </div>
      </div>

      {/* Status Actions */}
      <div style={{ background: 'white', borderRadius: 12, padding: '16px 24px', border: '1px solid #e2e8f0', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Move to:</span>
        {STATUS_FLOW.filter(s => s !== product.status).map(s => {
          const sm = STATUS_META[s];
          return (
            <button key={s} type="button" disabled={saving} onClick={() => handleStatusChange(s)}
              style={{ padding: '6px 14px', border: `1.5px solid ${sm.color}`, borderRadius: 20, background: sm.bg, color: sm.color, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              {sm.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 16 }}>
          <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #e2e8f0', marginBottom: 24 }}>
        {(['details', 'reorders', 'versions'] as const).map(tab => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)}
            style={{ padding: '10px 20px', border: 'none', background: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: activeTab === tab ? '#1A3C5E' : '#94a3b8', borderBottom: `2px solid ${activeTab === tab ? '#1A3C5E' : 'transparent'}`, marginBottom: -2, textTransform: 'capitalize' }}>
            {tab === 'reorders' ? `Reorders (${product.reorders?.length || 0})` : tab === 'versions' ? `Versions (${(product.versions?.length || 0) + 1})` : tab}
          </button>
        ))}
      </div>

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div style={{ display: 'grid', gap: 20 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 28, border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>Product Info</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Product Name</label>
                <input type="text" value={form.name} onChange={f('name')} style={inp} />
              </div>
              <div>
                <label style={lbl}>Category</label>
                <select value={form.category} onChange={f('category')} style={inp}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div />
              <div>
                <label style={lbl}>Base Price (€)</label>
                <input type="number" step="0.01" min="0" value={form.basePrice} onChange={f('basePrice')} style={inp} />
              </div>
              <div>
                <label style={lbl}>Unit Price for Client (€)</label>
                <input type="number" step="0.01" min="0" value={form.unitPrice} onChange={f('unitPrice')} style={inp} />
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

          <div style={{ background: 'white', borderRadius: 12, padding: 28, border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 8, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>Specifications (JSON)</h2>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>Technical specs: material, color, hardware, measurements, etc.</p>
            <textarea
              value={form.specifications} onChange={f('specifications')} rows={10}
              spellCheck={false}
              style={{ ...inp, fontFamily: 'monospace', fontSize: 13, resize: 'vertical' }}
            />
          </div>

          <div style={{ background: 'white', borderRadius: 12, padding: 28, border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>Internal Notes</h2>
            <textarea value={form.adminNotes} onChange={f('adminNotes')} rows={3}
              placeholder="Internal notes (not visible to client)…"
              style={{ ...inp, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" onClick={() => router.back()}
              style={{ padding: '10px 24px', border: '1.5px solid #e2e8f0', borderRadius: 8, background: 'white', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="button" disabled={saving} onClick={handleSave}
              style={{ padding: '10px 28px', border: 'none', borderRadius: 8, background: '#1A3C5E', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Reorders Tab */}
      {activeTab === 'reorders' && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {!product.reorders?.length ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>No reorders yet for this product.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Date', 'Quantity', 'Unit Price', 'Total', 'Status', 'Proforma', 'Notes'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {product.reorders.map((r: any) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700 }}>{r.quantity} pcs</td>
                    <td style={{ padding: '12px 16px' }}>€{Number(r.unitPrice).toFixed(2)}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700 }}>€{Number(r.totalPrice).toFixed(2)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: '#f1f5f9', color: '#475569' }}>{r.status}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {r.proformaId ? (
                        <Link href={`/proforma/${r.proformaId}`} style={{ color: '#1A3C5E', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>View →</Link>
                      ) : <span style={{ color: '#9ca3af' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 13 }}>{r.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Versions Tab */}
      {activeTab === 'versions' && (
        <div style={{ display: 'grid', gap: 12 }}>
          {/* Current version */}
          <div style={{ background: '#1A3C5E', borderRadius: 12, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ color: 'white', fontWeight: 800, fontSize: 15 }}>V{product.version} — Current</span>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '2px 0 0' }}>{product.name}</p>
            </div>
            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: STATUS_META[product.status]?.bg || '#f1f5f9', color: STATUS_META[product.status]?.color || '#475569' }}>
              {STATUS_META[product.status]?.label || product.status}
            </span>
          </div>
          {/* Prior versions */}
          {product.versions?.length ? product.versions.map((v: any) => (
            <div key={v.id} style={{ background: 'white', borderRadius: 12, padding: '16px 24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#374151' }}>V{v.version}</span>
                <p style={{ color: '#64748b', fontSize: 13, margin: '2px 0 0' }}>{v.adminNotes || 'No notes'}</p>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: STATUS_META[v.status]?.bg || '#f1f5f9', color: STATUS_META[v.status]?.color || '#475569' }}>
                  {STATUS_META[v.status]?.label || v.status}
                </span>
                <Link href={`/client-products/${v.id}`} style={{ color: '#1A3C5E', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>View →</Link>
              </div>
            </div>
          )) : (
            <p style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', padding: 20 }}>No prior versions.</p>
          )}
        </div>
      )}

      {/* New Version Modal */}
      {showNewVersion && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, width: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Create New Version</h2>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
              This will create V{product.version + 1} as a copy of the current product. The current version will become a historical record.
            </p>
            <label style={lbl}>Version Notes (optional)</label>
            <textarea
              value={newVersionNotes} onChange={e => setNewVersionNotes(e.target.value)}
              rows={3} placeholder="e.g. Updated hardware colour, new stitching style…"
              style={{ ...inp, resize: 'vertical', marginBottom: 20 }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowNewVersion(false)}
                style={{ padding: '9px 20px', border: '1.5px solid #e2e8f0', borderRadius: 8, background: 'white', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="button" disabled={saving} onClick={handleNewVersion}
                style={{ padding: '9px 20px', border: 'none', borderRadius: 8, background: '#1A3C5E', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                {saving ? 'Creating…' : `Create V${product.version + 1}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
