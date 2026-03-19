'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft:          { label: 'Draft',          color: '#9ca3af' },
  in_development: { label: 'In Development', color: '#f59e0b' },
  approved:       { label: 'Approved',       color: '#22c55e' },
  discontinued:   { label: 'Discontinued',   color: '#ef4444' },
};

function authH() {
  if (typeof window === 'undefined') return {};
  return { Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}` };
}

export default function ClientProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState({ status: '', search: '' });

  const load = () => {
    const q = new URLSearchParams();
    if (filter.status) q.set('status', filter.status);
    fetch(`${API}/client-products/admin/all?${q}`, { headers: authH() })
      .then(r => r.json()).then(d => setProducts(Array.isArray(d) ? d : []))
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = products.filter(p =>
    !filter.search ||
    p.name?.toLowerCase().includes(filter.search.toLowerCase()) ||
    p.client?.companyName?.toLowerCase().includes(filter.search.toLowerCase()) ||
    p.client?.fullName?.toLowerCase().includes(filter.search.toLowerCase()),
  );

  return (
    <div style={{ padding: 32, maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>Client Product Lines</h1>
          <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>Manage custom product templates per B2B client</p>
        </div>
        <Link href="/client-products/new"
          style={{ background: '#1A3C5E', color: 'white', padding: '10px 22px', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
          + New Client Product
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <input
          type="text" placeholder="Search by name or client…"
          value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
          style={{ flex: 1, padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' }}
        />
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          style={{ padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, background: 'white' }}>
          <option value="">All Statuses</option>
          {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Products', value: products.length },
          { label: 'Approved', value: products.filter(p => p.status === 'approved').length },
          { label: 'In Development', value: products.filter(p => p.status === 'in_development').length },
          { label: 'Draft', value: products.filter(p => p.status === 'draft').length },
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
      ) : filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 12, padding: 48, textAlign: 'center' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>📦</p>
          <p style={{ fontWeight: 700, color: '#0f172a' }}>No client products yet</p>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Create product lines for your B2B clients.</p>
          <Link href="/client-products/new" style={{ display: 'inline-block', marginTop: 20, background: '#1A3C5E', color: 'white', padding: '10px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            + Create First Product
          </Link>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Product', 'Client', 'Category', 'Version', 'Status', 'Unit Price', 'MOQ', 'Reorders', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const st = STATUS_META[p.status] || { label: p.status, color: '#9ca3af' };
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <p style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>{p.name}</p>
                      {p.manufacturer?.name && <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>via {p.manufacturer.name}</p>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <p style={{ fontWeight: 600, color: '#1e293b', margin: 0 }}>{p.client?.companyName || p.client?.fullName}</p>
                      <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>{p.client?.email}</p>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>{p.category}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontWeight: 700, color: '#1A3C5E' }}>V{p.version}</span>
                      {p.versions?.length > 0 && <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>+{p.versions.length} ver</span>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: `${st.color}18`, color: st.color }}>{st.label}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>€{Number(p.unitPrice).toFixed(2)}</td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>{p.moq} pcs</td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>{p.reorderCount || 0}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <Link href={`/client-products/${p.id}`} style={{ color: '#1A3C5E', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                        Manage →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
