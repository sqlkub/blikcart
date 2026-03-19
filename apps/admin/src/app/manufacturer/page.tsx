'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

function authH(): Record<string, string> {
  const tok = typeof window !== 'undefined' ? localStorage.getItem('adminToken') || '' : '';
  return { Authorization: `Bearer ${tok}` };
}

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

export default function ManufacturerPortalPage() {
  const router = useRouter();
  const [data, setData] = useState<{ manufacturer: any; orders: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/orders/manufacturer/my-orders`, { headers: authH() })
      .then(r => {
        if (r.status === 401) { router.push('/login'); return null; }
        return r.json();
      })
      .then(d => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, [router]);

  function handleLogout() {
    localStorage.removeItem('adminToken');
    router.push('/login');
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <p style={{ color: '#64748b' }}>Loading your orders…</p>
    </div>
  );

  const mfr = data?.manufacturer;
  const orders = data?.orders || [];

  if (!mfr) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 40, maxWidth: 440, textAlign: 'center', border: '1px solid #e2e8f0' }}>
        <p style={{ fontSize: 40, marginBottom: 12 }}>🏭</p>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>No Manufacturer Record Found</h2>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>
          Your account email doesn't match any manufacturer contact. Please ask admin to set your email as the contact email for your manufacturer record.
        </p>
        <button type="button" onClick={handleLogout}
          style={{ padding: '9px 20px', background: '#1A3C5E', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
          Sign Out
        </button>
      </div>
    </div>
  );

  const inProduction = orders.filter(o => o.status === 'in_production').length;
  const pending = orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <div style={{ background: '#1A3C5E', color: 'white', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Manufacturer Portal</p>
          <h1 style={{ fontSize: 18, fontWeight: 800, margin: '2px 0 0' }}>{mfr.name}</h1>
        </div>
        <button type="button" onClick={handleLogout}
          style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', background: 'none', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer' }}>
          Sign Out
        </button>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Orders', value: orders.length, color: '#1A3C5E' },
            { label: 'In Production', value: inProduction, color: '#7c3aed' },
            { label: 'Awaiting Start', value: pending, color: '#d97706' },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: 12, padding: '20px 24px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: 26, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Orders list */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Assigned Orders</h2>
          </div>
          {orders.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>
              <p style={{ fontSize: 36, marginBottom: 12 }}>📦</p>
              <p style={{ fontWeight: 600, color: '#374151' }}>No orders assigned yet</p>
              <p style={{ fontSize: 14, marginTop: 4 }}>Orders assigned to you by the admin will appear here.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Order #', 'Client', 'Items', 'Total', 'Status', 'Date', ''].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(o => {
                  const st = STATUS_COLORS[o.status] || { bg: '#f3f4f6', color: '#374151' };
                  const hasReview = o.notes?.includes('Manual review');
                  return (
                    <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#1A3C5E', fontSize: 12 }}>
                        #{o.orderNumber}
                        {hasReview && <span style={{ marginLeft: 6, fontSize: 10, background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: 4, fontFamily: 'sans-serif' }}>⚠</span>}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <p style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>{o.user?.companyName || o.user?.fullName || '—'}</p>
                        <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>{o.user?.email}</p>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#475569' }}>{o.items?.length || 0} lines</td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>€{Number(o.total).toFixed(2)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color }}>
                          {fmtStatus(o.status)}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 12, color: '#64748b' }}>
                        {new Date(o.placedAt).toLocaleDateString('en-GB')}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <Link href={`/manufacturer/orders/${o.id}`}
                          style={{ fontSize: 13, fontWeight: 700, color: '#1A3C5E', textDecoration: 'none' }}>
                          Update →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
