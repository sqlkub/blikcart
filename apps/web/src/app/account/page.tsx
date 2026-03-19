'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Draft',     color: '#9ca3af' },
  submitted: { label: 'Submitted', color: '#3b82f6' },
  quoted:    { label: 'Quoted',    color: '#f59e0b' },
  approved:  { label: 'Approved',  color: '#22c55e' },
  declined:  { label: 'Declined',  color: '#ef4444' },
};

const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pending',    color: '#f59e0b' },
  confirmed:  { label: 'Confirmed',  color: '#3b82f6' },
  processing: { label: 'Processing', color: '#8b5cf6' },
  shipped:    { label: 'Shipped',    color: '#06b6d4' },
  delivered:  { label: 'Delivered',  color: '#22c55e' },
  cancelled:  { label: 'Cancelled',  color: '#ef4444' },
};

const SAMPLE_STATUS: Record<string, { label: string; color: string; icon: string }> = {
  requested:          { label: 'Requested',      color: '#3b82f6', icon: '📬' },
  in_review:          { label: 'In Review',       color: '#f59e0b', icon: '🔍' },
  sample_sent:        { label: 'Sample Sent',     color: '#8b5cf6', icon: '📦' },
  approved:           { label: 'Approved',        color: '#22c55e', icon: '✅' },
  rejected:           { label: 'Rejected',        color: '#ef4444', icon: '❌' },
  revision_requested: { label: 'Revision Needed', color: '#f97316', icon: '🔄' },
};

// ── Dutch Excel column mapping ─────────────────────────────────────────────────
const DUTCH_MAP: Record<string, string> = {
  wat: 'productType', naam: 'productName', kleur: 'color',
  'kleur gesp/buckle': 'buckleColor', 'kleur gesp': 'buckleColor', maat: 'size',
  aantal: 'quantity', sku: 'sku', prijs: 'unitPrice', totaal: 'total',
};

function detectDelimiter(line: string): string {
  const semicolons = (line.match(/;/g) || []).length;
  const commas = (line.match(/,/g) || []).length;
  return semicolons >= commas ? ';' : ',';
}

function splitCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text: string): any[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // Find header row (first row that has column keywords)
  let headerIdx = 0;
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes('sku') || lower.includes('aantal') || lower.includes('naam')) {
      headerIdx = i;
      break;
    }
  }

  // Auto-detect delimiter from header row (Dutch Excel uses ; by default)
  const delimiter = detectDelimiter(lines[headerIdx]);

  const rawHeaders = splitCSVLine(lines[headerIdx], delimiter).map(h => h.replace(/^"|"$/g, '').toLowerCase());
  const headers = rawHeaders.map(h => DUTCH_MAP[h] || h);

  const rows: any[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cells = splitCSVLine(line, delimiter).map(c => c.replace(/^"|"$/g, ''));
    if (cells.every(c => !c)) continue;

    const row: any = {};
    headers.forEach((h, idx) => { row[h] = cells[idx] || ''; });

    // Skip group header rows (no SKU, no quantity)
    if (!row.sku && !row.quantity) continue;

    // Parse numeric fields — handle both . and , as decimal separator
    row.quantity = parseInt(row.quantity) || 0;
    row.unitPrice = parseFloat((row.unitPrice || '0').replace('€', '').replace(/\./g, '').replace(',', '.')) || 0;
    row.total = parseFloat((row.total || '0').replace('€', '').replace(/\./g, '').replace(',', '.')) || 0;

    if (row.quantity > 0) rows.push(row);
  }
  return rows;
}

const PROFORMA_STATUS: Record<string, { label: string; color: string }> = {
  draft:    { label: 'Draft',    color: '#9ca3af' },
  sent:     { label: 'Sent',     color: '#d97706' },
  approved: { label: 'Approved', color: '#16a34a' },
  rejected: { label: 'Rejected', color: '#dc2626' },
};

// ── Tab types ─────────────────────────────────────────────────────────────────
type Tab = 'orders' | 'quotes' | 'samples' | 'bulk' | 'products' | 'invoices';

export default function AccountPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const isB2B = user?.accountType === 'wholesale';

  const [tab, setTab] = useState<Tab>('orders');
  const [orders, setOrders]           = useState<any[]>([]);
  const [quotes, setQuotes]           = useState<any[]>([]);
  const [samples, setSamples]         = useState<any[]>([]);
  const [myProducts, setMyProducts]   = useState<any[]>([]);
  const [invoices, setInvoices]       = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);

  // Reorder state
  const [reorderQty, setReorderQty]       = useState<Record<string, string>>({});
  const [reorderNotes, setReorderNotes]   = useState<Record<string, string>>({});
  const [reordering, setReordering]       = useState<string | null>(null);
  const [reorderDone, setReorderDone]     = useState<string | null>(null);
  const [reorderError, setReorderError]   = useState('');

  // Bulk import state
  const fileRef = useRef<HTMLInputElement>(null);
  const [bulkRows, setBulkRows]       = useState<any[]>([]);
  const [bulkFile, setBulkFile]       = useState('');
  const [bulkError, setBulkError]     = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkResult, setBulkResult]   = useState<any>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) { router.push('/login'); return; }

    const h = { Authorization: `Bearer ${token}` };
    const fetches: Promise<any>[] = [
      fetch(`${API}/orders`, { headers: h }).then(r => r.ok ? r.json() : { data: [] }).then(d => setOrders(d.data || [])),
      fetch(`${API}/quotes/custom-orders`, { headers: h }).then(r => r.ok ? r.json() : []).then(d => setQuotes(Array.isArray(d) ? d : [])),
    ];
    if (isB2B) {
      fetches.push(
        fetch(`${API}/samples`, { headers: h }).then(r => r.ok ? r.json() : []).then(d => setSamples(Array.isArray(d) ? d : [])),
        fetch(`${API}/client-products/mine`, { headers: h }).then(r => r.ok ? r.json() : []).then(d => setMyProducts(Array.isArray(d) ? d : [])),
        fetch(`${API}/proforma/mine`, { headers: h }).then(r => r.ok ? r.json() : []).then(d => setInvoices(Array.isArray(d) ? d : [])),
      );
    }
    Promise.all(fetches).catch(() => {}).finally(() => setLoading(false));
  }, [router, isB2B]);

  async function handleReorder(productId: string) {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    const qty = parseInt(reorderQty[productId] || '0');
    if (!qty || qty < 1) { setReorderError('Please enter a valid quantity.'); return; }
    setReordering(productId); setReorderError('');
    try {
      const res = await fetch(`${API}/client-products/${productId}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quantity: qty, notes: reorderNotes[productId] || undefined }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Reorder failed');
      setReorderDone(productId);
      // Refresh invoices
      const fresh = await fetch(`${API}/proforma/mine`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
      setInvoices(Array.isArray(fresh) ? fresh : []);
    } catch (e: any) {
      setReorderError(e.message || 'Something went wrong');
    } finally { setReordering(null); }
  }

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkError('');
    setBulkResult(null);
    setBulkFile(file.name);
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const text = ev.target?.result as string;
        const rows = parseCSV(text);
        if (!rows.length) { setBulkError('No valid rows found. Make sure your file has headers: SKU, Naam, Kleur, Maat, Aantal, Prijs'); return; }
        setBulkRows(rows);
      } catch {
        setBulkError('Could not parse file. Please export as CSV from Excel.');
      }
    };
    reader.readAsText(file, 'utf-8');
  }

  async function handleBulkSubmit() {
    const token = localStorage.getItem('accessToken');
    if (!token || !bulkRows.length) return;
    setBulkSubmitting(true);
    setBulkError('');
    try {
      const res = await fetch(`${API}/orders/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lines: bulkRows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed');
      setBulkResult(data);
      setBulkRows([]);
      setBulkFile('');
      // Refresh orders
      const fresh = await fetch(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
      setOrders(fresh.data || []);
    } catch (e: any) {
      setBulkError(e.message || 'Something went wrong');
    } finally {
      setBulkSubmitting(false);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'orders', label: `Orders (${orders.length})` },
    { key: 'quotes', label: `Quote Requests (${quotes.length})` },
    ...(isB2B ? [
      { key: 'products' as Tab, label: `My Products (${myProducts.length})` },
      { key: 'invoices' as Tab, label: `Invoices (${invoices.length})` },
      { key: 'samples' as Tab, label: `Samples (${samples.length})` },
      { key: 'bulk' as Tab, label: '📦 Bulk Import' },
    ] : []),
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Header */}
      <div style={{ background: 'var(--navy)', color: 'white', padding: '40px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
              {isB2B ? 'B2B Account' : 'My Account'}
            </p>
            <h1 style={{ fontSize: 26, fontWeight: 800 }}>{user?.fullName || 'Welcome back'}</h1>
            <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 4 }}>{user?.email}</p>
            {isB2B && (
              <span style={{ display: 'inline-block', marginTop: 8, background: 'rgba(200,134,10,0.2)', color: 'var(--gold)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(200,134,10,0.4)' }}>
                B2B Partner
              </span>
            )}
          </div>
          <button type="button" onClick={handleLogout}
            style={{ padding: '10px 22px', border: '2px solid rgba(255,255,255,0.3)', borderRadius: 8, background: 'transparent', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '2px solid #e5e7eb', overflowX: 'auto' }}>
          {tabs.map(t => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              style={{ padding: '10px 20px', background: 'none', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap', color: tab === t.key ? 'var(--navy)' : '#9ca3af', borderBottom: tab === t.key ? '3px solid var(--navy)' : '3px solid transparent', marginBottom: -2 }}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ background: 'white', borderRadius: 12, padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading…</div>
        ) : tab === 'orders' ? (
          // ── Orders ────────────────────────────────────────────────────────────
          orders.length === 0 ? (
            <div style={{ background: 'white', borderRadius: 12, padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
              <h3 style={{ color: 'var(--navy)', fontWeight: 700, marginBottom: 8 }}>No orders yet</h3>
              <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>Browse our products and place your first order.</p>
              <Link href="/" style={{ background: 'var(--navy)', color: 'white', padding: '10px 28px', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>
                Browse Products
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {orders.map((order: any) => {
                const st = ORDER_STATUS[order.status] || { label: order.status, color: '#6b7280' };
                return (
                  <div key={order.id} style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div>
                        <p style={{ fontWeight: 800, color: 'var(--navy)', fontSize: 15 }}>{order.orderNumber}</p>
                        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                          {new Date(order.placedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {' · '}{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>€{Number(order.total).toFixed(2)}</span>
                        <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: `${st.color}18`, color: st.color }}>{st.label}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {order.items?.map((item: any) => (
                        <div key={item.id} style={{ fontSize: 13, color: '#6b7280', background: '#f9fafb', padding: '4px 10px', borderRadius: 6 }}>
                          {item.productName || item.product?.name || 'Item'} × {item.quantity}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : tab === 'quotes' ? (
          // ── Quote Requests ────────────────────────────────────────────────────
          quotes.length === 0 ? (
            <div style={{ background: 'white', borderRadius: 12, padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
              <h3 style={{ color: 'var(--navy)', fontWeight: 700, marginBottom: 8 }}>No quote requests yet</h3>
              <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>Customise a product and submit a quote to get started.</p>
              <Link href="/" style={{ background: 'var(--gold)', color: 'white', padding: '10px 28px', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>
                Browse Products
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {quotes.map((order: any) => {
                const st = STATUS_LABEL[order.status] || { label: order.status, color: '#6b7280' };
                const image = order.product?.images?.[0];
                return (
                  <div key={order.id} style={{ background: 'white', borderRadius: 12, padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--cream)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, overflow: 'hidden' }}>
                      {image ? <img src={image.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🐴'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div>
                          <p style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 15 }}>{order.product?.name || 'Custom Product'}</p>
                          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                            Qty {order.quantity} · {new Date(order.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: `${st.color}18`, color: st.color }}>{st.label}</span>
                      </div>
                      {order.quote && (
                        <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--cream)', borderRadius: 8, display: 'flex', gap: 24 }}>
                          <div>
                            <p style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Unit price</p>
                            <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--gold)' }}>€{Number(order.quote.unitPrice).toFixed(2)}</p>
                          </div>
                          <div>
                            <p style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</p>
                            <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)' }}>€{Number(order.quote.totalPrice).toFixed(2)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : tab === 'products' ? (
          // ── My Products (B2B only) ────────────────────────────────────────────
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)', margin: '0 0 6px' }}>My Product Lines</h2>
              <p style={{ fontSize: 14, color: '#6b7280' }}>Your approved custom products. Place a reorder in seconds — no re-specification needed.</p>
            </div>
            {myProducts.length === 0 ? (
              <div style={{ background: 'white', borderRadius: 12, padding: 48, textAlign: 'center', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
                <h3 style={{ color: 'var(--navy)', fontWeight: 700, marginBottom: 8 }}>No product lines yet</h3>
                <p style={{ color: '#6b7280', fontSize: 14 }}>Your account manager will set up your custom product lines. Contact us to get started.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {reorderError && (
                  <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10 }}>
                    <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>{reorderError}</p>
                  </div>
                )}
                {myProducts.map((p: any) => (
                  <div key={p.id} style={{ background: 'white', borderRadius: 14, border: '1px solid #e5e7eb', padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>{p.name}</h3>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: '#e8f0f7', color: 'var(--navy)' }}>V{p.version}</span>
                        </div>
                        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 10px' }}>{p.category} · MOQ: {p.moq} pcs · Lead time: {p.leadTimeDays} days</p>
                        <div style={{ display: 'flex', gap: 20 }}>
                          <div>
                            <p style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.06em', margin: '0 0 2px' }}>Unit Price</p>
                            <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--gold)', margin: 0 }}>€{Number(p.unitPrice).toFixed(2)}</p>
                          </div>
                          {p.reorderCount > 0 && (
                            <div>
                              <p style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.06em', margin: '0 0 2px' }}>Reorders</p>
                              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>{p.reorderCount}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      {reorderDone === p.id ? (
                        <div style={{ textAlign: 'center', padding: '12px 20px', background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                          <p style={{ fontSize: 18, margin: '0 0 4px' }}>✅</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', margin: 0 }}>Reorder submitted!</p>
                          <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>Check your Invoices tab</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200 }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              type="number" min={p.moq || 1} placeholder={`Min ${p.moq || 1}`}
                              value={reorderQty[p.id] || ''}
                              onChange={e => setReorderQty(prev => ({ ...prev, [p.id]: e.target.value }))}
                              style={{ flex: 1, padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', width: 80 }}
                            />
                            <button type="button"
                              disabled={reordering === p.id}
                              onClick={() => handleReorder(p.id)}
                              style={{ padding: '9px 18px', background: reordering === p.id ? '#9ca3af' : 'var(--navy)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                              {reordering === p.id ? '…' : 'Reorder →'}
                            </button>
                          </div>
                          <input
                            type="text" placeholder="Notes (optional)"
                            value={reorderNotes[p.id] || ''}
                            onChange={e => setReorderNotes(prev => ({ ...prev, [p.id]: e.target.value }))}
                            style={{ padding: '7px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        ) : tab === 'invoices' ? (
          // ── Proforma Invoices (B2B only) ──────────────────────────────────────
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)', margin: '0 0 6px' }}>Proforma Invoices</h2>
              <p style={{ fontSize: 14, color: '#6b7280' }}>Auto-generated invoices for your reorders, including 21% VAT.</p>
            </div>
            {invoices.length === 0 ? (
              <div style={{ background: 'white', borderRadius: 12, padding: 48, textAlign: 'center', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🧾</div>
                <h3 style={{ color: 'var(--navy)', fontWeight: 700, marginBottom: 8 }}>No invoices yet</h3>
                <p style={{ color: '#6b7280', fontSize: 14 }}>Invoices are automatically created when you place a reorder.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {invoices.map((inv: any) => {
                  const st = PROFORMA_STATUS[inv.status] || { label: inv.status, color: '#9ca3af' };
                  return (
                    <div key={inv.id} style={{ background: 'white', borderRadius: 14, border: '1px solid #e5e7eb', padding: '20px 24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                        <div>
                          <p style={{ fontWeight: 800, color: 'var(--navy)', margin: '0 0 4px', fontFamily: 'monospace', fontSize: 15 }}>{inv.invoiceNumber}</p>
                          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                            {new Date(inv.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {inv.estimatedDelivery && ` · Est. delivery: ${new Date(inv.estimatedDelivery).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                          <div style={{ textAlign: 'right' as const }}>
                            <p style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.06em', margin: '0 0 2px' }}>Total incl. VAT</p>
                            <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>€{Number(inv.total).toFixed(2)}</p>
                          </div>
                          <span style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: `${st.color}18`, color: st.color }}>{st.label}</span>
                        </div>
                      </div>
                      {Array.isArray(inv.lines) && inv.lines.length > 0 && (
                        <div style={{ marginTop: 14, borderTop: '1px solid #f3f4f6', paddingTop: 14 }}>
                          {inv.lines.map((line: any, i: number) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#374151', padding: '3px 0' }}>
                              <span>{line.productName} × {line.quantity}</span>
                              <span style={{ fontWeight: 600 }}>€{Number(line.totalPrice).toFixed(2)}</span>
                            </div>
                          ))}
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9ca3af', marginTop: 6, paddingTop: 6, borderTop: '1px dashed #e5e7eb' }}>
                            <span>Subtotal</span><span>€{Number(inv.subtotal).toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9ca3af' }}>
                            <span>VAT (21%)</span><span>€{Number(inv.taxAmount).toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        ) : tab === 'samples' ? (
          // ── Samples (B2B only) ────────────────────────────────────────────────
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>Sample Requests</h2>
                <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Track your samples from request to approved design</p>
              </div>
              <Link href="/samples/library"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'var(--navy)', color: 'white', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                📚 Browse Library
              </Link>
            </div>
            {samples.length === 0 ? (
              <div style={{ background: 'white', borderRadius: 14, padding: '48px 24px', textAlign: 'center', border: '2px dashed #e5e7eb' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🧵</div>
                <h3 style={{ color: 'var(--navy)', fontWeight: 700, marginBottom: 8 }}>No sample requests yet</h3>
                <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>Configure a product and request a physical sample before bulk ordering.</p>
                <Link href="/samples/new"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 24px', background: 'var(--gold)', color: 'white', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                  + New Sample Request
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {samples.map((s: any) => {
                  const st = SAMPLE_STATUS[s.status] || { label: s.status, color: '#6b7280', icon: '•' };
                  return (
                    <div key={s.id} style={{ background: 'white', borderRadius: 14, border: '1px solid #e5e7eb', padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <span style={{ fontSize: 18 }}>{st.icon}</span>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>{s.productName}</h3>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#e5e7eb', color: '#374151' }}>V{s.version}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: `${st.color}18`, color: st.color }}>{st.label}</span>
                            <span style={{ fontSize: 13, color: '#6b7280' }}>{s.quantity} units</span>
                            {s.samplingFee && <span style={{ fontSize: 12, color: '#6b7280' }}>Fee: €{Number(s.samplingFee).toFixed(2)}</span>}
                          </div>
                          {s.adminNotes && (
                            <div style={{ marginTop: 10, padding: '10px 14px', background: '#f9fafb', borderRadius: 8 }}>
                              <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 2 }}>Note from our team:</p>
                              <p style={{ fontSize: 13, color: '#374151' }}>{s.adminNotes}</p>
                            </div>
                          )}
                        </div>
                        {s.status === 'approved' && (
                          <Link href={`/customize/${s.categorySlug || 'products'}?revise=${s.id}`}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'var(--gold)', color: 'white', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                            🔄 Reorder
                          </Link>
                        )}
                        {(s.status === 'revision_requested' || s.status === 'rejected') && (
                          <Link href={`/customize/${s.categorySlug}?revise=${s.id}`}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#f59e0b', color: 'white', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                            Submit Revision
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          // ── Bulk Order Import (B2B only) ───────────────────────────────────────
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)', margin: '0 0 6px' }}>Bulk Order Import</h2>
              <p style={{ fontSize: 14, color: '#6b7280' }}>Upload your Excel order sheet (exported as CSV). Supports Dutch column headers: Wat, Naam, Kleur, Maat, Aantal, SKU, Prijs.</p>
            </div>

            {bulkResult ? (
              // ── Success ────────────────────────────────────────────────────────
              <div style={{ background: 'white', borderRadius: 14, padding: 40, textAlign: 'center', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>Order Submitted!</h3>
                <p style={{ color: '#6b7280', marginBottom: 8 }}>Order <strong>{bulkResult.order?.orderNumber}</strong> has been created with {bulkResult.order?.items?.length} line item(s).</p>
                {bulkResult.unresolvedSkus?.length > 0 && (
                  <p style={{ color: '#f59e0b', fontSize: 13, marginBottom: 16 }}>
                    ⚠️ These SKUs were not found and need manual review: {bulkResult.unresolvedSkus.join(', ')}
                  </p>
                )}
                <button type="button" onClick={() => setBulkResult(null)}
                  style={{ marginTop: 8, padding: '10px 24px', background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                  Import Another File
                </button>
              </div>
            ) : bulkRows.length === 0 ? (
              // ── Upload area ────────────────────────────────────────────────────
              <div>
                <input ref={fileRef} type="file" accept=".csv,.txt" title="Upload order CSV file" aria-label="Upload order CSV file" style={{ display: 'none' }} onChange={handleFileChange} />
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--gold)'; }}
                  onDragLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; }}
                  onDrop={e => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = '#d1d5db';
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      const fakeEvent = { target: { files: [file] } } as any;
                      handleFileChange(fakeEvent);
                    }
                  }}
                  style={{ border: '2px dashed #d1d5db', borderRadius: 14, padding: '56px 24px', textAlign: 'center', cursor: 'pointer', background: 'white', transition: 'border-color 0.2s' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
                  <p style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 16, marginBottom: 6 }}>Drop your Excel/CSV file here</p>
                  <p style={{ color: '#9ca3af', fontSize: 14 }}>or click to browse · CSV format · max 5 MB</p>
                </div>

                {bulkError && (
                  <div style={{ marginTop: 16, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10 }}>
                    <p style={{ color: '#dc2626', fontSize: 13 }}>{bulkError}</p>
                  </div>
                )}

                {/* Instructions */}
                <div style={{ marginTop: 24, background: 'white', borderRadius: 14, padding: 24, border: '1px solid #e5e7eb' }}>
                  <p style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 12, fontSize: 14 }}>How to prepare your file:</p>
                  <ol style={{ margin: 0, paddingLeft: 20, color: '#6b7280', fontSize: 13, lineHeight: 1.8 }}>
                    <li>Open your Excel order sheet</li>
                    <li>Go to <strong>File → Save As → CSV (Comma delimited)</strong></li>
                    <li>Make sure your columns include: <strong>SKU, Naam, Kleur, Maat, Aantal, Prijs</strong></li>
                    <li>Upload the saved .csv file here</li>
                  </ol>
                  <div style={{ marginTop: 16, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, fontFamily: 'monospace', fontSize: 12, color: '#475569' }}>
                    Wat,Naam,Kleur,Kleur gesp/buckle,Maat,Aantal,SKU,Prijs,Totaal<br />
                    Halter,Bunga,Zwart,zilver,Mini,5,HBUN-ZWZ-M,15.75,78.75
                  </div>
                </div>
              </div>
            ) : (
              // ── Preview ────────────────────────────────────────────────────────
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <p style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 15 }}>Preview — {bulkFile}</p>
                    <p style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{bulkRows.length} line item{bulkRows.length !== 1 ? 's' : ''} ready to import</p>
                  </div>
                  <button type="button" onClick={() => { setBulkRows([]); setBulkFile(''); setBulkError(''); }}
                    style={{ padding: '8px 16px', border: '2px solid #e5e7eb', borderRadius: 8, background: 'white', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    ← Change File
                  </button>
                </div>

                <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 20 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: 'var(--navy)', color: 'white' }}>
                          {['Product', 'Color', 'Size', 'SKU', 'Qty', 'Unit Price', 'Total'].map(h => (
                            <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bulkRows.map((row, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#f9fafb' }}>
                            <td style={{ padding: '10px 14px', color: 'var(--navy)', fontWeight: 600 }}>{row.productName || row.productType || '—'}</td>
                            <td style={{ padding: '10px 14px', color: '#6b7280' }}>{[row.color, row.buckleColor].filter(Boolean).join(' / ') || '—'}</td>
                            <td style={{ padding: '10px 14px', color: '#6b7280' }}>{row.size || '—'}</td>
                            <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#374151' }}>{row.sku || '—'}</td>
                            <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--navy)', textAlign: 'right' }}>{row.quantity}</td>
                            <td style={{ padding: '10px 14px', color: '#6b7280', textAlign: 'right' }}>€{Number(row.unitPrice).toFixed(2)}</td>
                            <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--navy)', textAlign: 'right' }}>
                              €{(row.total || row.quantity * row.unitPrice).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ borderTop: '2px solid var(--navy)', background: '#f8fafc' }}>
                          <td colSpan={4} style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--navy)' }}>Total</td>
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--navy)', textAlign: 'right' }}>
                            {bulkRows.reduce((s, r) => s + r.quantity, 0)}
                          </td>
                          <td />
                          <td style={{ padding: '10px 14px', fontWeight: 800, color: 'var(--gold)', textAlign: 'right', fontSize: 15 }}>
                            €{bulkRows.reduce((s, r) => s + (r.total || r.quantity * r.unitPrice), 0).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {bulkError && (
                  <div style={{ marginBottom: 16, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10 }}>
                    <p style={{ color: '#dc2626', fontSize: 13 }}>{bulkError}</p>
                  </div>
                )}

                <button type="button" onClick={handleBulkSubmit} disabled={bulkSubmitting}
                  style={{ width: '100%', padding: '14px', background: bulkSubmitting ? '#9ca3af' : 'var(--navy)', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: bulkSubmitting ? 'not-allowed' : 'pointer' }}>
                  {bulkSubmitting ? 'Submitting…' : `Submit Bulk Order (${bulkRows.length} lines) →`}
                </button>
                <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 10 }}>
                  Our team will review and confirm pricing within 1 business day.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
