'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

const ORDER_STATUSES = ['pending', 'confirmed', 'in_production', 'shipped', 'delivered', 'cancelled'];
const orderStatusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_production: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};
const customStatusColor: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-yellow-100 text-yellow-700',
  quoted: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  in_production: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};
const quoteStatusColor: Record<string, string> = {
  sent: 'bg-blue-100 text-blue-700',
  revised: 'bg-purple-100 text-purple-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-600',
  expired: 'bg-gray-100 text-gray-500',
};

function Skel({ cols }: { cols: number }) {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="border-b border-gray-50">
          {[...Array(cols)].map((_, j) => (
            <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

function fmtStatus(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── All Orders Tab ───────────────────────────────────────────────────────────

function AllOrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    try {
      const res = await axios.get(`${API}/orders/admin/orders?limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.data || []);
    } catch { setOrders([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdatingId(orderId);
    const token = localStorage.getItem('adminToken');
    try {
      await axios.patch(`${API}/orders/admin/orders/${orderId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } finally { setUpdatingId(null); }
  }

  const filtered = orders.filter(o => {
    if (statusFilter !== 'All' && o.status !== statusFilter) return false;
    if (typeFilter !== 'All' && o.orderType !== typeFilter) return false;
    return true;
  });

  const counts = { total: orders.length, standard: 0, custom: 0, mixed: 0 };
  orders.forEach(o => {
    if (o.orderType === 'standard') counts.standard++;
    else if (o.orderType === 'custom') counts.custom++;
    else if (o.orderType === 'mixed') counts.mixed++;
  });

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Orders', value: counts.total, color: 'text-[#1A3C5E]' },
          { label: 'Standard', value: counts.standard, color: 'text-blue-600' },
          { label: 'Custom', value: counts.custom, color: 'text-purple-600' },
          { label: 'Mixed', value: counts.mixed, color: 'text-orange-600' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{c.label}</p>
            {loading
              ? <div className="h-8 w-16 bg-gray-100 rounded animate-pulse mt-1" />
              : <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>}
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-5 flex-wrap items-center">
        <div className="flex gap-1.5 flex-wrap">
          {['All', ...ORDER_STATUSES].map(s => (
            <button key={s} type="button" onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${statusFilter === s ? 'bg-[#1A3C5E] text-white border-[#1A3C5E]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
              {s === 'All' ? 'All Statuses' : fmtStatus(s)}
            </button>
          ))}
        </div>
        <select
          title="Filter by order type"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="ml-auto text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#1A3C5E]"
        >
          {['All', 'standard', 'custom', 'mixed'].map(t => (
            <option key={t} value={t}>{t === 'All' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
              {['Order #', 'Customer', 'Type', 'Items', 'Total', 'Status', 'Date', 'Update'].map(h => (
                <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <Skel cols={8} /> : filtered.length > 0 ? filtered.map(o => (
              <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-4 text-xs font-mono text-[#1A3C5E] font-semibold">
                  #{o.orderNumber || o.id.slice(0, 8).toUpperCase()}
                </td>
                <td className="px-5 py-4 text-sm">
                  <div className="font-medium text-gray-900">{o.user?.fullName || '—'}</div>
                  <div className="text-xs text-gray-400">{o.user?.email}</div>
                </td>
                <td className="px-5 py-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    o.orderType === 'custom' ? 'bg-purple-100 text-purple-700' :
                    o.orderType === 'mixed' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{o.orderType || 'standard'}</span>
                </td>
                <td className="px-5 py-4 text-sm text-gray-500">{o.items?.length || 0}</td>
                <td className="px-5 py-4 text-sm font-semibold">€{Number(o.total || 0).toFixed(2)}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${orderStatusColor[o.status] || 'bg-gray-100 text-gray-500'}`}>
                    {fmtStatus(o.status)}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-gray-500">
                  {new Date(o.placedAt || o.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-4">
                  <select
                    title="Update order status"
                    value={o.status}
                    disabled={updatingId === o.id}
                    onChange={e => updateStatus(o.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1A3C5E] disabled:opacity-50"
                  >
                    {ORDER_STATUSES.map(s => <option key={s} value={s}>{fmtStatus(s)}</option>)}
                  </select>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-400 text-sm">No orders found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Custom Orders Tab ─────────────────────────────────────────────────────────

const CUSTOM_STATUSES = ['submitted', 'quoted', 'approved', 'in_production', 'shipped', 'delivered', 'cancelled'];

const STATUS_DOT: Record<string, string> = {
  submitted: 'bg-yellow-400',
  quoted: 'bg-blue-400',
  approved: 'bg-green-400',
  in_production: 'bg-purple-500',
  shipped: 'bg-indigo-400',
  delivered: 'bg-green-300',
  cancelled: 'bg-gray-300',
};

const PROD_TEAM = ['— Unassigned —', 'Alice · Production', 'Bob · Production', 'Carlos · Fulfillment', 'Diana · QA', 'Emma · Production'];

type SortKey = 'submittedAt' | 'estimatedValue' | 'leadTimeDays';
type SortDir = 'asc' | 'desc';

function isUrgent(o: any) {
  if (o.status !== 'submitted') return false;
  const ageDays = (Date.now() - new Date(o.submittedAt || 0).getTime()) / 86_400_000;
  return ageDays > 2;
}

function SortTh({ label, sk, current, dir, onClick }: { label: string; sk: SortKey; current: SortKey; dir: SortDir; onClick: () => void }) {
  const active = sk === current;
  return (
    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">
      <button type="button" onClick={onClick}
        className={`flex items-center gap-1 text-xs uppercase tracking-wide transition-colors ${active ? 'text-[#1A3C5E]' : 'text-gray-500 hover:text-gray-700'}`}>
        {label}
        <span className={`text-[10px] ${active ? 'opacity-100' : 'opacity-30'}`}>
          {active ? (dir === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  );
}

function CustomOrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [buyerSearch, setBuyerSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [productFilter, setProductFilter] = useState('All');
  const [urgentOnly, setUrgentOnly] = useState(false);

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>('submittedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Bulk actions
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkAssignee, setBulkAssignee] = useState('');
  const [bulkWorking, setBulkWorking] = useState(false);

  // Individual
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    try {
      const res = await axios.get(`${API}/orders/admin/custom-orders?limit=500`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.data || []);
    } catch { setOrders([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setSelected(new Set()); }, [orders]);

  const productNames = useMemo(
    () => ['All', ...Array.from(new Set(orders.map(o => o.product?.name).filter(Boolean)))],
    [orders]
  );

  const filtered = useMemo(() => {
    let list = orders.filter(o => {
      if (statusFilter !== 'All' && o.status !== statusFilter) return false;
      if (buyerSearch) {
        const q = buyerSearch.toLowerCase();
        if (!o.user?.fullName?.toLowerCase().includes(q) &&
            !o.user?.email?.toLowerCase().includes(q) &&
            !o.user?.companyName?.toLowerCase().includes(q)) return false;
      }
      if (dateFrom && o.submittedAt && new Date(o.submittedAt) < new Date(dateFrom)) return false;
      if (dateTo && o.submittedAt && new Date(o.submittedAt) > new Date(dateTo + 'T23:59:59')) return false;
      if (productFilter !== 'All' && o.product?.name !== productFilter) return false;
      if (urgentOnly && !isUrgent(o)) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      let av = 0, bv = 0;
      if (sortKey === 'submittedAt') {
        av = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        bv = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      } else if (sortKey === 'estimatedValue') {
        av = Number(a.estimatedPriceMin || 0) * (a.quantity || 1);
        bv = Number(b.estimatedPriceMin || 0) * (b.quantity || 1);
      } else {
        av = a.leadTimeDays || 0;
        bv = b.leadTimeDays || 0;
      }
      return sortDir === 'asc' ? av - bv : bv - av;
    });

    return list;
  }, [orders, statusFilter, buyerSearch, dateFrom, dateTo, productFilter, urgentOnly, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const allSelected = filtered.length > 0 && selected.size === filtered.length;
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(filtered.map(o => o.id)));
  }
  function toggleRow(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdatingId(orderId);
    const token = localStorage.getItem('adminToken');
    try {
      await axios.patch(`${API}/quotes/admin/custom-orders/${orderId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } finally { setUpdatingId(null); }
  }

  async function bulkUpdateStatus() {
    if (!bulkStatus || selected.size === 0) return;
    setBulkWorking(true);
    const token = localStorage.getItem('adminToken');
    try {
      await Promise.all(Array.from(selected).map(id =>
        axios.patch(`${API}/quotes/admin/custom-orders/${id}/status`, { status: bulkStatus }, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ));
      setOrders(prev => prev.map(o => selected.has(o.id) ? { ...o, status: bulkStatus } : o));
      setSelected(new Set());
      setBulkStatus('');
    } finally { setBulkWorking(false); }
  }

  async function bulkAssign() {
    if (!bulkAssignee || bulkAssignee === '— Unassigned —' || selected.size === 0) return;
    setBulkWorking(true);
    const token = localStorage.getItem('adminToken');
    const ref = bulkAssignee === '— Unassigned —' ? '' : bulkAssignee;
    try {
      await Promise.all(Array.from(selected).map(id =>
        axios.patch(`${API}/quotes/admin/custom-orders/${id}`, { internalRef: ref }, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ));
      setOrders(prev => prev.map(o => selected.has(o.id) ? { ...o, internalRef: ref } : o));
      setSelected(new Set());
      setBulkAssignee('');
    } finally { setBulkWorking(false); }
  }

  function exportCSV() {
    const toExport = filtered.filter(o => selected.size === 0 || selected.has(o.id));
    const rows = [
      ['Order ID', 'Buyer', 'Company', 'Email', 'Product', 'Qty', 'Est. Min (€)', 'Est. Max (€)', 'Status', 'Lead Time (days)', 'Assigned To', 'Submitted At', 'Urgent'],
      ...toExport.map(o => [
        `CO-${o.id.slice(0, 8).toUpperCase()}`,
        o.user?.fullName || '',
        o.user?.companyName || '',
        o.user?.email || '',
        o.product?.name || '',
        o.quantity || 0,
        o.estimatedPriceMin ? Number(o.estimatedPriceMin).toFixed(2) : '',
        o.estimatedPriceMax ? Number(o.estimatedPriceMax).toFixed(2) : '',
        o.status,
        o.leadTimeDays || '',
        o.internalRef || '',
        o.submittedAt ? new Date(o.submittedAt).toISOString().slice(0, 10) : '',
        isUrgent(o) ? 'YES' : '',
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `custom-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const urgentCount = orders.filter(isUrgent).length;
  const kpis = [
    { label: 'Total', value: orders.length, color: 'text-[#1A3C5E]' },
    { label: 'Awaiting Quote', value: orders.filter(o => o.status === 'submitted').length, color: 'text-yellow-600' },
    { label: 'In Production', value: orders.filter(o => o.status === 'in_production').length, color: 'text-purple-600' },
    { label: 'Urgent (>2d)', value: urgentCount, color: urgentCount > 0 ? 'text-red-600' : 'text-gray-400' },
  ];

  return (
    <div>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map(c => (
          <div key={c.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{c.label}</p>
            {loading
              ? <div className="h-8 w-16 bg-gray-100 rounded animate-pulse mt-1" />
              : <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>}
          </div>
        ))}
      </div>

      {/* Status filter pills */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {['All', ...CUSTOM_STATUSES].map(s => (
          <button key={s} type="button" onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${statusFilter === s ? 'bg-[#1A3C5E] text-white border-[#1A3C5E]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
            {s === 'All' ? 'All Statuses' : fmtStatus(s)}
          </button>
        ))}
      </div>

      {/* Advanced filters row */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Buyer</label>
          <input type="text" placeholder="Name, email or company…" value={buyerSearch}
            onChange={e => setBuyerSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            title="Date from"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            title="Date to"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Product</label>
          <select value={productFilter} onChange={e => setProductFilter(e.target.value)}
            title="Filter by product"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E] bg-white">
            {productNames.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button type="button"
            onClick={() => setUrgentOnly(v => !v)}
            aria-label={urgentOnly ? 'Show all orders' : 'Show urgent only'}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${urgentOnly ? 'bg-red-50 text-red-600 border-red-300' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
            <span>🔥</span> Urgent only
          </button>
        </div>
        {(buyerSearch || dateFrom || dateTo || productFilter !== 'All' || urgentOnly) && (
          <button type="button" onClick={() => { setBuyerSearch(''); setDateFrom(''); setDateTo(''); setProductFilter('All'); setUrgentOnly(false); }}
            className="text-xs text-gray-400 hover:text-gray-600 underline self-end pb-2">
            Clear filters
          </button>
        )}
        <div className="ml-auto text-xs text-gray-400 self-end pb-2">
          {filtered.length} of {orders.length} orders
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="bg-[#1A3C5E] text-white rounded-xl px-5 py-3 mb-4 flex flex-wrap items-center gap-4">
          <span className="text-sm font-semibold">{selected.size} selected</span>
          <div className="flex items-center gap-2">
            <select title="Bulk status" value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
              className="text-xs px-2 py-1.5 rounded-lg bg-white/20 border border-white/30 text-white focus:outline-none">
              <option value="">Set status…</option>
              {CUSTOM_STATUSES.map(s => <option key={s} value={s}>{fmtStatus(s)}</option>)}
            </select>
            <button type="button" onClick={bulkUpdateStatus} disabled={!bulkStatus || bulkWorking}
              className="text-xs px-3 py-1.5 bg-white text-[#1A3C5E] rounded-lg font-semibold hover:bg-gray-100 disabled:opacity-40">
              Apply
            </button>
          </div>
          <div className="flex items-center gap-2">
            <select title="Assign to team" value={bulkAssignee} onChange={e => setBulkAssignee(e.target.value)}
              className="text-xs px-2 py-1.5 rounded-lg bg-white/20 border border-white/30 text-white focus:outline-none">
              {PROD_TEAM.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button type="button" onClick={bulkAssign} disabled={!bulkAssignee || bulkAssignee === '— Unassigned —' || bulkWorking}
              className="text-xs px-3 py-1.5 bg-white text-[#1A3C5E] rounded-lg font-semibold hover:bg-gray-100 disabled:opacity-40">
              Assign
            </button>
          </div>
          <button type="button" onClick={exportCSV}
            className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/15 border border-white/30 rounded-lg font-semibold hover:bg-white/25">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export {selected.size} rows
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <span className="text-xs text-gray-500">{filtered.length} orders</span>
          {selected.size === 0 && (
            <button type="button" onClick={exportCSV}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export all CSV
            </button>
          )}
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
              <th className="pl-5 pr-2 py-3 w-10">
                <input type="checkbox" checked={allSelected} onChange={toggleAll}
                  title="Select all"
                  className="rounded border-gray-300 text-[#1A3C5E] cursor-pointer" />
              </th>
              <th className="px-2 py-3 w-3 sr-only">Urgency</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase">Order ID</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase">Buyer</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase">Product</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase">Qty</th>
              <SortTh label="Est. Value" sk="estimatedValue" current={sortKey} dir={sortDir} onClick={() => toggleSort('estimatedValue')} />
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase">Status</th>
              <SortTh label="Lead Time" sk="leadTimeDays" current={sortKey} dir={sortDir} onClick={() => toggleSort('leadTimeDays')} />
              <SortTh label="Submitted" sk="submittedAt" current={sortKey} dir={sortDir} onClick={() => toggleSort('submittedAt')} />
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase">Assigned</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase">Update</th>
              <th className="px-4 py-3 sr-only">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={13} className="px-5 py-6">
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />)}
                </div>
              </td></tr>
            ) : filtered.length > 0 ? filtered.map(o => {
              const urgent = isUrgent(o);
              const isSelected = selected.has(o.id);
              return (
                <tr key={o.id}
                  className={`border-b border-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : urgent ? 'bg-red-50/40 hover:bg-red-50/60' : 'hover:bg-gray-50'}`}>
                  <td className="pl-5 pr-2 py-4">
                    <input type="checkbox" checked={isSelected} onChange={() => toggleRow(o.id)}
                      title="Select row"
                      className="rounded border-gray-300 text-[#1A3C5E] cursor-pointer" />
                  </td>
                  {/* Status dot */}
                  <td className="px-2 py-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${urgent ? 'bg-red-500 ring-2 ring-red-200' : STATUS_DOT[o.status] || 'bg-gray-300'}`} />
                      {urgent && <span title="Urgent: awaiting quote >2 days" className="text-[10px]">🔥</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-mono font-bold ${urgent ? 'text-red-600' : 'text-[#1A3C5E]'}`}>
                      CO-{o.id.slice(0, 8).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <div className="font-medium text-gray-900">{o.user?.fullName || '—'}</div>
                    <div className="text-xs text-gray-400">{o.user?.companyName || o.user?.email}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">{o.product?.name || '—'}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{o.quantity}</td>
                  <td className="px-4 py-4 text-sm font-semibold">
                    {o.estimatedPriceMin
                      ? `€${(Number(o.estimatedPriceMin) * (o.quantity || 1)).toFixed(0)}`
                      : '—'}
                    {o.estimatedPriceMin && o.quantity > 1 && (
                      <div className="text-xs text-gray-400 font-normal">€{Number(o.estimatedPriceMin).toFixed(2)}/unit</div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold border ${
                      o.status === 'submitted' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      o.status === 'quoted' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      o.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                      o.status === 'in_production' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      o.status === 'shipped' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      o.status === 'delivered' ? 'bg-green-50 text-green-600 border-green-200' :
                      o.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-200' :
                      'bg-gray-50 text-gray-600 border-gray-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[o.status] || 'bg-gray-300'}`} />
                      {fmtStatus(o.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {o.leadTimeDays ? `${o.leadTimeDays}d` : '—'}
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-500">
                    {o.submittedAt ? new Date(o.submittedAt).toLocaleDateString() : '—'}
                    {urgent && (
                      <div className="text-red-500 font-semibold">
                        {Math.floor((Date.now() - new Date(o.submittedAt).getTime()) / 86_400_000)}d ago
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {o.internalRef
                      ? <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">{o.internalRef}</span>
                      : <span className="text-xs text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-4">
                    <select
                      title="Update status"
                      value={o.status}
                      disabled={updatingId === o.id}
                      onChange={e => updateStatus(o.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1A3C5E] disabled:opacity-50">
                      {CUSTOM_STATUSES.map(s => <option key={s} value={s}>{fmtStatus(s)}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <Link href={`/custom-orders/${o.id}`}
                      className="text-xs font-semibold text-[#1A3C5E] hover:underline whitespace-nowrap">
                      {o.status === 'submitted' ? 'Quote →' : 'View →'}
                    </Link>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan={13} className="px-5 py-12 text-center text-gray-400 text-sm">
                No custom orders match your filters
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Quotes Tab ────────────────────────────────────────────────────────────────

const QUOTE_STATUSES = ['sent', 'revised', 'accepted', 'declined', 'expired'];

function QuotesTab() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  const load = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    try {
      const params = statusFilter !== 'All' ? `?status=${statusFilter}&limit=200` : '?limit=200';
      const res = await axios.get(`${API}/quotes/admin/all${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuotes(res.data.data || []);
    } catch { setQuotes([]); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const accepted = quotes.filter(q => q.status === 'accepted').length;
  const declined = quotes.filter(q => q.status === 'declined').length;
  const pending = quotes.filter(q => q.status === 'sent' || q.status === 'revised').length;
  const totalValue = quotes.filter(q => q.status === 'accepted').reduce((s, q) => s + Number(q.totalPrice || 0), 0);

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Accepted Value', value: `€${totalValue.toFixed(2)}`, color: 'text-green-700' },
          { label: 'Awaiting Response', value: pending, color: 'text-[#1A3C5E]' },
          { label: 'Accepted', value: accepted, color: 'text-green-600' },
          { label: 'Declined', value: declined, color: 'text-red-500' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{c.label}</p>
            {loading
              ? <div className="h-8 w-16 bg-gray-100 rounded animate-pulse mt-1" />
              : <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>}
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 mb-5 flex-wrap">
        {['All', ...QUOTE_STATUSES].map(s => (
          <button key={s} type="button" onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${statusFilter === s ? 'bg-[#1A3C5E] text-white border-[#1A3C5E]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
            {s === 'All' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
              {['Custom Order', 'Customer', 'Product', 'Unit Price', 'Total', 'Lead Time', 'Valid Until', 'Status', 'Sent', ''].map(h => (
                <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <Skel cols={10} /> : quotes.length > 0 ? quotes.map(q => {
              const isExpired = q.status !== 'accepted' && q.status !== 'declined' && new Date(q.validUntil) < new Date();
              const displayStatus = isExpired ? 'expired' : q.status;
              return (
                <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-4 text-xs font-mono text-[#1A3C5E] font-semibold">
                    CO-{q.customOrder?.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-5 py-4 text-sm">
                    <div className="font-medium text-gray-900">{q.customOrder?.user?.fullName || '—'}</div>
                    <div className="text-xs text-gray-400">{q.customOrder?.user?.companyName || q.customOrder?.user?.email}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-700">{q.customOrder?.product?.name || '—'}</td>
                  <td className="px-5 py-4 text-sm font-semibold">€{Number(q.unitPrice).toFixed(2)}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-[#1A3C5E]">€{Number(q.totalPrice).toFixed(2)}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{q.leadTimeDays}d</td>
                  <td className="px-5 py-4 text-xs text-gray-500">
                    {new Date(q.validUntil).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${quoteStatusColor[displayStatus] || 'bg-gray-100 text-gray-500'}`}>
                      {displayStatus}
                    </span>
                    {q.revisions?.length > 0 && (
                      <span className="ml-1 text-xs text-gray-400">rev.{q.revisions[0].revisionNumber}</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500">
                    {new Date(q.sentAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/custom-orders/${q.customOrder?.id}`}
                      className="text-xs font-semibold text-[#1A3C5E] hover:underline whitespace-nowrap">
                      {q.status === 'sent' || q.status === 'revised' ? 'Revise →' : 'View →'}
                    </Link>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan={10} className="px-5 py-10 text-center text-gray-400 text-sm">
                {statusFilter === 'All' ? 'No quotes sent yet' : `No ${statusFilter} quotes`}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

const TABS = ['All Orders', 'Custom Orders', 'Quotes'] as const;
type Tab = typeof TABS[number];

export default function OrdersPage() {
  const [tab, setTab] = useState<Tab>('All Orders');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 text-sm mt-1">Standard orders, custom orders, and quote management</p>
      </div>

      <div className="flex gap-1 mb-8 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t ? 'bg-white text-[#1A3C5E] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'All Orders' && <AllOrdersTab />}
      {tab === 'Custom Orders' && <CustomOrdersTab />}
      {tab === 'Quotes' && <QuotesTab />}
    </div>
  );
}
