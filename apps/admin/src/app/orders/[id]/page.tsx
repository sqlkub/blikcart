'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

function authH(json = false): Record<string, string> {
  const tok = typeof window !== 'undefined' ? localStorage.getItem('adminToken') || '' : '';
  return { Authorization: `Bearer ${tok}`, ...(json ? { 'Content-Type': 'application/json' } : {}) };
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:       { bg: '#fef9c3', color: '#854d0e' },
  confirmed:     { bg: '#dbeafe', color: '#1e40af' },
  in_production: { bg: '#f3e8ff', color: '#6b21a8' },
  shipped:       { bg: '#e0e7ff', color: '#3730a3' },
  delivered:     { bg: '#dcfce7', color: '#166534' },
  cancelled:     { bg: '#fee2e2', color: '#991b1b' },
};
const ORDER_STATUSES = ['pending', 'confirmed', 'in_production', 'shipped', 'delivered', 'cancelled'];

function fmtStatus(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [selectedManufacturer, setSelectedManufacturer] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`${API}/orders/admin/orders/${id}`, { headers: authH() }).then(r => r.json()),
      fetch(`${API}/manufacturers`, { headers: authH() }).then(r => r.json()),
    ]).then(([ord, mfrs]) => {
      setOrder(ord);
      setSelectedManufacturer(ord.manufacturerId || '');
      setNotes(ord.notes || '');
      setManufacturers(Array.isArray(mfrs) ? mfrs : []);
    }).finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setSaving(true); setSaved(false);
    try {
      await fetch(`${API}/orders/admin/orders/${id}`, {
        method: 'PATCH', headers: authH(true),
        body: JSON.stringify({ manufacturerId: selectedManufacturer || null, notes }),
      });
      setOrder((prev: any) => ({ ...prev, manufacturerId: selectedManufacturer || null, notes }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  }

  async function handleStatus(newStatus: string) {
    setStatusSaving(true);
    try {
      await fetch(`${API}/orders/admin/orders/${id}/status`, {
        method: 'PATCH', headers: authH(true),
        body: JSON.stringify({ status: newStatus }),
      });
      setOrder((prev: any) => ({ ...prev, status: newStatus }));
    } finally { setStatusSaving(false); }
  }

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading order…</div>
  );
  if (!order || order.message) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>Order not found.</div>
  );

  const st = STATUS_COLORS[order.status] || { bg: '#f3f4f6', color: '#374151' };
  const assignedMfr = manufacturers.find(m => m.id === (selectedManufacturer || order.manufacturerId));

  // Parse "Manual review needed" SKUs from notes
  const manualSkus = order.notes?.match(/Manual review needed for SKUs: (.+)/)?.[1]?.split(', ') || [];

  return (
    <div style={{ padding: 32, maxWidth: 1000 }}>
      {/* Back */}
      <Link href="/orders" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
        ← Back to Orders
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>
            #{order.orderNumber}
          </h1>
          <div style={{ marginTop: 6, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color }}>
              {fmtStatus(order.status)}
            </span>
            <span style={{ fontSize: 13, color: '#64748b' }}>
              {order.user?.fullName || '—'} · {order.user?.email}
            </span>
            <span style={{ fontSize: 13, color: '#64748b' }}>
              {new Date(order.placedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Status control */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <select
            value={order.status}
            disabled={statusSaving}
            onChange={e => handleStatus(e.target.value)}
            title="Update order status"
            style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'white', cursor: 'pointer', outline: 'none' }}
          >
            {ORDER_STATUSES.map(s => <option key={s} value={s}>{fmtStatus(s)}</option>)}
          </select>
        </div>
      </div>

      {/* Manual review warning */}
      {manualSkus.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>⚠️ Manual Review Required</p>
          <p style={{ fontSize: 13, color: '#78350f', margin: 0 }}>
            These client SKUs could not be matched to catalog products and need manual processing:
          </p>
          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {manualSkus.map((sku: string) => (
              <span key={sku} style={{ fontFamily: 'monospace', fontSize: 12, background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 6, padding: '2px 8px', color: '#92400e' }}>
                {sku}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
        {/* Left: Line Items */}
        <div>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Line Items ({order.items?.length || 0})
              </h2>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['SKU', 'Product', 'Qty', 'Unit Price', 'Total', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item: any) => {
                  const isUnresolved = !item.productId;
                  return (
                    <tr key={item.id} style={{ borderTop: '1px solid #f1f5f9', background: isUnresolved ? '#fffbeb' : 'white' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#475569', fontSize: 12 }}>
                        {item.sku || '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.productName}</span>
                        {item.product?.name && item.product.name !== item.productName && (
                          <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>({item.product.name})</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>{item.quantity}</td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>€{Number(item.unitPrice).toFixed(2)}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>€{Number(item.total).toFixed(2)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {isUnresolved ? (
                          <span style={{ fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 10 }}>
                            ⚠ Needs Review
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 10 }}>
                            ✓ Matched
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid #e2e8f0', background: '#f8fafc' }}>
                  <td colSpan={4} style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: 12, textAlign: 'right' }}>Subtotal</td>
                  <td colSpan={2} style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>€{Number(order.subtotal).toFixed(2)}</td>
                </tr>
                {Number(order.shippingCost) > 0 && (
                  <tr style={{ background: '#f8fafc' }}>
                    <td colSpan={4} style={{ padding: '4px 16px', color: '#64748b', fontSize: 12, textAlign: 'right' }}>Shipping</td>
                    <td colSpan={2} style={{ padding: '4px 16px', color: '#475569' }}>€{Number(order.shippingCost).toFixed(2)}</td>
                  </tr>
                )}
                <tr style={{ background: '#f8fafc' }}>
                  <td colSpan={4} style={{ padding: '4px 16px 12px', color: '#64748b', fontSize: 12, textAlign: 'right' }}>VAT (21%)</td>
                  <td colSpan={2} style={{ padding: '4px 16px 12px', color: '#475569' }}>€{Number(order.taxAmount).toFixed(2)}</td>
                </tr>
                <tr style={{ borderTop: '1px solid #e2e8f0', background: '#f0f9ff' }}>
                  <td colSpan={4} style={{ padding: '12px 16px', fontWeight: 800, color: '#0f172a', textAlign: 'right' }}>TOTAL</td>
                  <td colSpan={2} style={{ padding: '12px 16px', fontWeight: 800, color: '#1A3C5E', fontSize: 16 }}>€{Number(order.total).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Right: Manufacturer + Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Manufacturer assignment */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Manufacturer</h2>
            <select
              value={selectedManufacturer}
              onChange={e => setSelectedManufacturer(e.target.value)}
              title="Assign manufacturer"
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: 'white', outline: 'none', marginBottom: 10 }}
            >
              <option value="">— Unassigned —</option>
              {manufacturers.map(m => (
                <option key={m.id} value={m.id}>{m.name}{m.country ? ` (${m.country})` : ''}</option>
              ))}
            </select>
            {assignedMfr && (
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#475569', marginBottom: 10 }}>
                {assignedMfr.contactName && <p style={{ margin: '0 0 2px' }}>👤 {assignedMfr.contactName}</p>}
                {assignedMfr.contactEmail && <p style={{ margin: 0 }}>✉️ {assignedMfr.contactEmail}</p>}
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Notes</h2>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={5}
              placeholder="Internal notes about this order…"
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>

          {/* Save */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '11px', border: 'none', borderRadius: 10, background: saved ? '#16a34a' : '#1A3C5E', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'background 0.2s' }}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
          </button>

          {/* Order meta */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Order Info</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Type</span>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{order.orderType}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Items</span>
                <span style={{ fontWeight: 600 }}>{order.items?.length || 0} lines</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Placed</span>
                <span style={{ fontWeight: 600 }}>{new Date(order.placedAt).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Customer</span>
                <span style={{ fontWeight: 600 }}>{order.user?.companyName || order.user?.fullName || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
