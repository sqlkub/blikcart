'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

function authH(json = false) {
  const tok = typeof window !== 'undefined' ? localStorage.getItem('adminToken') || '' : '';
  return { Authorization: `Bearer ${tok}`, ...(json ? { 'Content-Type': 'application/json' } : {}) };
}

const EMPTY_FORM = { name: '', country: '', contactName: '', contactEmail: '', leadTimeDays: '21', notes: '' };

export default function ManufacturersPage() {
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function load() {
    fetch(`${API}/manufacturers`, { headers: authH() })
      .then(r => r.json()).then(d => { setManufacturers(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const f = (k: string) => (e: any) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  function openNew() {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setError('');
    setShowForm(true);
  }

  function openEdit(m: any) {
    setEditId(m.id);
    setForm({
      name: m.name || '', country: m.country || '',
      contactName: m.contactName || '', contactEmail: m.contactEmail || '',
      leadTimeDays: String(m.leadTimeDays || '21'), notes: m.notes || '',
    });
    setError('');
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name) { setError('Name is required.'); return; }
    setSaving(true); setError('');
    try {
      const url = editId ? `${API}/manufacturers/${editId}` : `${API}/manufacturers`;
      const method = editId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method, headers: authH(true),
        body: JSON.stringify({ ...form, leadTimeDays: Number(form.leadTimeDays) || 21 }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to save');
      setShowForm(false);
      load();
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally { setSaving(false); }
  }

  async function handleToggleActive(m: any) {
    await fetch(`${API}/manufacturers/${m.id}`, {
      method: 'PATCH', headers: authH(true),
      body: JSON.stringify({ isActive: !m.isActive }),
    });
    load();
  }

  const inp = { padding: '9px 13px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, width: '100%', outline: 'none', background: 'white', boxSizing: 'border-box' as const };
  const lbl = { display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 5 } as const;

  return (
    <div style={{ padding: 32, maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>Manufacturers</h1>
          <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>Manage production partners and supplier contacts</p>
        </div>
        <button type="button" onClick={openNew}
          style={{ background: '#1A3C5E', color: 'white', padding: '10px 22px', borderRadius: 8, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
          + Add Manufacturer
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total', value: manufacturers.length },
          { label: 'Active', value: manufacturers.filter(m => m.isActive).length },
          { label: 'Inactive', value: manufacturers.filter(m => !m.isActive).length },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 10, padding: '16px 20px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#1A3C5E', margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ background: 'white', borderRadius: 12, padding: 48, textAlign: 'center', color: '#9ca3af' }}>Loading…</div>
      ) : manufacturers.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 12, padding: 48, textAlign: 'center' }}>
          <p style={{ fontWeight: 700, color: '#0f172a' }}>No manufacturers yet</p>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Add your production partners to assign them to client products.</p>
          <button type="button" onClick={openNew}
            style={{ marginTop: 20, background: '#1A3C5E', color: 'white', padding: '10px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
            + Add First Manufacturer
          </button>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Manufacturer', 'Country', 'Contact', 'Lead Time', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {manufacturers.map((m: any) => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9', opacity: m.isActive ? 1 : 0.5 }}>
                  <td style={{ padding: '14px 16px' }}>
                    <p style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>{m.name}</p>
                    {m.notes && <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{m.notes}</p>}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#475569' }}>{m.country || '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    {m.contactName && <p style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>{m.contactName}</p>}
                    {m.contactEmail && <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>{m.contactEmail}</p>}
                    {!m.contactName && !m.contactEmail && <span style={{ color: '#9ca3af' }}>—</span>}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#475569' }}>{m.leadTimeDays} days</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: m.isActive ? '#f0fdf4' : '#f9fafb', color: m.isActive ? '#16a34a' : '#9ca3af' }}>
                      {m.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button type="button" onClick={() => openEdit(m)}
                        style={{ color: '#1A3C5E', fontWeight: 700, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        Edit
                      </button>
                      <button type="button" onClick={() => handleToggleActive(m)}
                        style={{ color: m.isActive ? '#dc2626' : '#16a34a', fontWeight: 700, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        {m.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, width: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>{editId ? 'Edit Manufacturer' : 'Add Manufacturer'}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Name <span style={{ color: '#C8860A' }}>*</span></label>
                <input type="text" placeholder="e.g. Leather Works Pakistan" value={form.name} onChange={f('name')} style={inp} />
              </div>
              <div>
                <label style={lbl}>Country</label>
                <input type="text" placeholder="e.g. Pakistan" value={form.country} onChange={f('country')} style={inp} />
              </div>
              <div>
                <label style={lbl}>Lead Time (days)</label>
                <input type="number" min="1" value={form.leadTimeDays} onChange={f('leadTimeDays')} style={inp} />
              </div>
              <div>
                <label style={lbl}>Contact Name</label>
                <input type="text" placeholder="e.g. Ahmed Khan" value={form.contactName} onChange={f('contactName')} style={inp} />
              </div>
              <div>
                <label style={lbl}>Contact Email</label>
                <input type="email" placeholder="e.g. ahmed@factory.com" value={form.contactEmail} onChange={f('contactEmail')} style={inp} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Notes</label>
                <textarea value={form.notes} onChange={f('notes')} rows={3}
                  placeholder="Specialties, certifications, payment terms…"
                  style={{ ...inp, resize: 'vertical' }}
                />
              </div>
            </div>
            {error && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 12 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: '9px 20px', border: '1.5px solid #e2e8f0', borderRadius: 8, background: 'white', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="button" disabled={saving} onClick={handleSave}
                style={{ padding: '9px 20px', border: 'none', borderRadius: 8, background: '#1A3C5E', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                {saving ? 'Saving…' : editId ? 'Save Changes' : 'Add Manufacturer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
