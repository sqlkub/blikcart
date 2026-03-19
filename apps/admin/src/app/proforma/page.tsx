'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

function authH(json = false) {
  const tok = typeof window !== 'undefined' ? localStorage.getItem('accessToken') || '' : '';
  return { Authorization: `Bearer ${tok}`, ...(json ? { 'Content-Type': 'application/json' } : {}) };
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  draft:    { label: 'Draft',    color: '#9ca3af', bg: '#f9fafb' },
  sent:     { label: 'Sent',     color: '#d97706', bg: '#fffbeb' },
  approved: { label: 'Approved', color: '#16a34a', bg: '#f0fdf4' },
  rejected: { label: 'Rejected', color: '#dc2626', bg: '#fef2f2' },
};

export default function ProformaAdminPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '' });
  const [selected, setSelected] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');

  function load() {
    const q = new URLSearchParams();
    if (filter.status) q.set('status', filter.status);
    fetch(`${API}/proforma/admin/all?${q}`, { headers: authH() })
      .then(r => r.json()).then(d => { setInvoices(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, [filter.status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleStatusChange(id: string, status: string) {
    setSaving(true);
    await fetch(`${API}/proforma/admin/${id}/status`, {
      method: 'PATCH', headers: authH(true),
      body: JSON.stringify({ status }),
    });
    setSaving(false);
    if (selected?.id === id) setSelected((s: any) => ({ ...s, status }));
    load();
  }

  async function handleSaveNotes(id: string) {
    setSaving(true);
    await fetch(`${API}/proforma/admin/${id}/notes`, {
      method: 'PATCH', headers: authH(true),
      body: JSON.stringify({ notes }),
    });
    setSaving(false);
    load();
  }

  function openDetail(inv: any) {
    setSelected(inv);
    setNotes(inv.adminNotes || '');
  }

  return (
    <div style={{ padding: 32, maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>Proforma Invoices</h1>
          <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>Auto-generated invoices for B2B client reorders</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total', value: invoices.length },
          { label: 'Sent', value: invoices.filter(i => i.status === 'sent').length },
          { label: 'Approved', value: invoices.filter(i => i.status === 'approved').length },
          { label: 'Draft', value: invoices.filter(i => i.status === 'draft').length },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 10, padding: '16px 20px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#1A3C5E', margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 20 }}>
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          style={{ padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, background: 'white' }}>
          <option value="">All Statuses</option>
          {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20, alignItems: 'start' }}>
        {/* Table */}
        {loading ? (
          <div style={{ background: 'white', borderRadius: 12, padding: 48, textAlign: 'center', color: '#9ca3af' }}>Loading…</div>
        ) : invoices.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 12, padding: 48, textAlign: 'center' }}>
            <p style={{ fontWeight: 700, color: '#0f172a' }}>No proforma invoices yet</p>
            <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Invoices are auto-generated when clients place reorders.</p>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Invoice #', 'Client', 'Amount', 'Status', 'Date', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: any) => {
                  const sm = STATUS_META[inv.status] || STATUS_META.draft;
                  return (
                    <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9', background: selected?.id === inv.id ? '#f8fafc' : 'white' }}>
                      <td style={{ padding: '13px 16px' }}>
                        <p style={{ fontWeight: 700, color: '#1A3C5E', margin: 0, fontFamily: 'monospace' }}>{inv.invoiceNumber}</p>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <p style={{ fontWeight: 600, color: '#1e293b', margin: 0 }}>{inv.client?.companyName || inv.client?.fullName || '—'}</p>
                        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>{inv.client?.email}</p>
                      </td>
                      <td style={{ padding: '13px 16px', fontWeight: 700, color: '#0f172a' }}>
                        {inv.currency || '€'}{Number(inv.total).toFixed(2)}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: sm.bg, color: sm.color }}>{sm.label}</span>
                      </td>
                      <td style={{ padding: '13px 16px', color: '#64748b', fontSize: 13 }}>
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <button type="button" onClick={() => openDetail(inv)}
                          style={{ color: '#1A3C5E', fontWeight: 700, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>
                          View →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail Panel */}
        {selected && (
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, position: 'sticky', top: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0, fontFamily: 'monospace' }}>{selected.invoiceNumber}</h2>
              <button type="button" onClick={() => setSelected(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 2px' }}>CLIENT</p>
              <p style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>{selected.client?.companyName || selected.client?.fullName}</p>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{selected.client?.email}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px' }}>
                <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 2px' }}>SUBTOTAL</p>
                <p style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>€{Number(selected.subtotal).toFixed(2)}</p>
              </div>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px' }}>
                <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 2px' }}>VAT (21%)</p>
                <p style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>€{Number(selected.taxAmount).toFixed(2)}</p>
              </div>
              <div style={{ background: '#1A3C5E', borderRadius: 8, padding: '10px 14px', gridColumn: '1 / -1' }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: '0 0 2px' }}>TOTAL</p>
                <p style={{ fontWeight: 800, color: 'white', margin: 0, fontSize: 18 }}>€{Number(selected.total).toFixed(2)}</p>
              </div>
            </div>

            {/* Order Lines */}
            {Array.isArray(selected.lines) && selected.lines.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>ORDER LINES</p>
                {selected.lines.map((line: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                    <div>
                      <p style={{ fontWeight: 600, color: '#1e293b', margin: 0 }}>{line.productName}</p>
                      <p style={{ color: '#94a3b8', margin: 0 }}>{line.quantity} × €{Number(line.unitPrice).toFixed(2)}</p>
                    </div>
                    <p style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>€{Number(line.totalPrice).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Status Actions */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>UPDATE STATUS</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(STATUS_META).filter(([k]) => k !== selected.status).map(([k, v]) => (
                  <button key={k} type="button" disabled={saving} onClick={() => handleStatusChange(selected.id, k)}
                    style={{ padding: '5px 12px', border: `1.5px solid ${v.color}`, borderRadius: 16, background: v.bg, color: v.color, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                    → {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>ADMIN NOTES</p>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="Internal notes…"
                style={{ padding: '9px 13px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, width: '100%', outline: 'none', background: 'white', boxSizing: 'border-box', resize: 'vertical' as const }}
              />
              <button type="button" disabled={saving} onClick={() => handleSaveNotes(selected.id)}
                style={{ marginTop: 8, padding: '8px 16px', border: 'none', borderRadius: 8, background: '#1A3C5E', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', width: '100%' }}>
                {saving ? 'Saving…' : 'Save Notes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
