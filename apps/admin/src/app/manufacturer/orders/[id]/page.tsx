'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

function authH(json = false): Record<string, string> {
  const tok = typeof window !== 'undefined' ? localStorage.getItem('adminToken') || '' : '';
  return { Authorization: `Bearer ${tok}`, ...(json ? { 'Content-Type': 'application/json' } : {}) };
}

const PRODUCTION_STATUSES = ['confirmed', 'in_production', 'shipped', 'delivered'];
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:       { bg: '#fef9c3', color: '#854d0e' },
  confirmed:     { bg: '#dbeafe', color: '#1e40af' },
  in_production: { bg: '#f3e8ff', color: '#6b21a8' },
  shipped:       { bg: '#e0e7ff', color: '#3730a3' },
  delivered:     { bg: '#dcfce7', color: '#166534' },
  cancelled:     { bg: '#fee2e2', color: '#991b1b' },
};

function fmtStatus(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function ManufacturerOrderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    status: '',
    productionNotes: '',
    estimatedLeadDays: '',
    trackingNumber: '',
    carrier: '',
  });

  useEffect(() => {
    // Load order from the manufacturer's own orders list
    fetch(`${API}/orders/manufacturer/my-orders`, { headers: authH() })
      .then(r => {
        if (r.status === 401) { router.push('/login'); return null; }
        return r.json();
      })
      .then((d: any) => {
        if (!d) return;
        const found = (d.orders || []).find((o: any) => o.id === id);
        if (!found) { setError('Order not found or not assigned to you.'); return; }
        setOrder(found);
        const existingShipment = found.shipments?.[0];
        setForm({
          status: found.status,
          productionNotes: '',
          estimatedLeadDays: '',
          trackingNumber: existingShipment?.trackingNumber || '',
          carrier: existingShipment?.carrier || '',
        });
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleSave() {
    setSaving(true); setSaved(false); setError('');
    try {
      const body: any = { status: form.status };
      if (form.productionNotes) body.productionNotes = form.productionNotes;
      if (form.estimatedLeadDays) body.estimatedLeadDays = parseInt(form.estimatedLeadDays);
      if (form.trackingNumber) body.trackingNumber = form.trackingNumber;
      if (form.carrier) body.carrier = form.carrier;

      const res = await fetch(`${API}/orders/manufacturer/orders/${id}`, {
        method: 'PATCH', headers: authH(true),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to update');
      setOrder((prev: any) => ({ ...prev, status: form.status }));
      setSaved(true);
      setForm(f => ({ ...f, productionNotes: '', estimatedLeadDays: '' }));
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally { setSaving(false); }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#64748b' }}>Loading…</p>
    </div>
  );

  if (error && !order) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 12, padding: 32, textAlign: 'center', border: '1px solid #e2e8f0' }}>
        <p style={{ color: '#ef4444', marginBottom: 16 }}>{error}</p>
        <Link href="/manufacturer" style={{ color: '#1A3C5E', fontWeight: 700 }}>← Back to My Orders</Link>
      </div>
    </div>
  );

  const st = STATUS_COLORS[order.status] || { bg: '#f3f4f6', color: '#374151' };
  const manualSkus = order.notes?.match(/Manual review needed for SKUs: (.+)/)?.[1]?.split(', ') || [];
  const inp = { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, background: 'white' };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <div style={{ background: '#1A3C5E', color: 'white', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/manufacturer" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, textDecoration: 'none' }}>← My Orders</Link>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
          <span style={{ fontSize: 14, fontWeight: 700 }}>#{order.orderNumber}</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 20, background: st.bg, color: st.color }}>
          {fmtStatus(order.status)}
        </span>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
        {/* Manual review warning */}
        {manualSkus.length > 0 && (
          <div style={{ background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>⚠️ Manual Review Required</p>
            <p style={{ fontSize: 13, color: '#78350f', margin: '0 0 8px' }}>These SKUs need manual matching — please check with the admin:</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {manualSkus.map((sku: string) => (
                <span key={sku} style={{ fontFamily: 'monospace', fontSize: 12, background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 6, padding: '2px 8px', color: '#92400e' }}>{sku}</span>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
          {/* Line items */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>Order Lines ({order.items?.length || 0})</h2>
              <div>
                <span style={{ fontSize: 12, color: '#64748b' }}>Client: </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{order.user?.companyName || order.user?.fullName}</span>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['SKU', 'Product', 'Qty', 'Unit Price', 'Total'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item: any) => (
                  <tr key={item.id} style={{ borderTop: '1px solid #f1f5f9', background: !item.productId ? '#fffbeb' : 'white' }}>
                    <td style={{ padding: '11px 14px', fontFamily: 'monospace', color: '#475569', fontSize: 12 }}>{item.sku || '—'}</td>
                    <td style={{ padding: '11px 14px', fontWeight: 600, color: '#0f172a' }}>
                      {item.productName}
                      {!item.productId && <span style={{ marginLeft: 6, fontSize: 10, background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: 4 }}>⚠</span>}
                    </td>
                    <td style={{ padding: '11px 14px', color: '#475569' }}>{item.quantity}</td>
                    <td style={{ padding: '11px 14px', color: '#475569' }}>€{Number(item.unitPrice).toFixed(2)}</td>
                    <td style={{ padding: '11px 14px', fontWeight: 700, color: '#0f172a' }}>€{Number(item.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid #e2e8f0', background: '#f8fafc' }}>
                  <td colSpan={3} style={{ padding: '10px 14px', fontSize: 12, color: '#64748b', textAlign: 'right', fontWeight: 700 }}>ORDER TOTAL</td>
                  <td colSpan={2} style={{ padding: '10px 14px', fontWeight: 800, color: '#1A3C5E', fontSize: 15 }}>€{Number(order.total).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Update form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Status */}
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Production Status</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {PRODUCTION_STATUSES.map(s => {
                  const sc = STATUS_COLORS[s] || { bg: '#f3f4f6', color: '#374151' };
                  const isActive = form.status === s;
                  return (
                    <button key={s} type="button"
                      onClick={() => setForm(f => ({ ...f, status: s }))}
                      style={{ padding: '9px 14px', borderRadius: 8, border: isActive ? `2px solid ${sc.color}` : '1.5px solid #e2e8f0', background: isActive ? sc.bg : 'white', color: isActive ? sc.color : '#475569', fontWeight: isActive ? 700 : 500, fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
                      {isActive ? '● ' : '○ '}{fmtStatus(s)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lead time */}
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Production Update</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 5 }}>Estimated Lead Time (days)</label>
                  <input type="number" min="1" placeholder="e.g. 14" value={form.estimatedLeadDays}
                    onChange={e => setForm(f => ({ ...f, estimatedLeadDays: e.target.value }))}
                    style={inp} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 5 }}>Production Notes</label>
                  <textarea rows={3} placeholder="Material sourced, production started, issues, ETA…"
                    value={form.productionNotes}
                    onChange={e => setForm(f => ({ ...f, productionNotes: e.target.value }))}
                    style={{ ...inp, resize: 'vertical' }} />
                </div>
              </div>
            </div>

            {/* Shipment */}
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Shipment Info</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 5 }}>Carrier</label>
                  <input type="text" placeholder="e.g. DHL, FedEx, UPS" value={form.carrier}
                    onChange={e => setForm(f => ({ ...f, carrier: e.target.value }))}
                    style={inp} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 5 }}>Tracking Number</label>
                  <input type="text" placeholder="e.g. 1Z999AA10123456784" value={form.trackingNumber}
                    onChange={e => setForm(f => ({ ...f, trackingNumber: e.target.value }))}
                    style={inp} />
                </div>
              </div>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px' }}>
                <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>{error}</p>
              </div>
            )}

            <button type="button" onClick={handleSave} disabled={saving}
              style={{ padding: '12px', border: 'none', borderRadius: 10, background: saved ? '#16a34a' : '#1A3C5E', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'background 0.2s' }}>
              {saving ? 'Saving…' : saved ? '✓ Updated' : 'Save Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
