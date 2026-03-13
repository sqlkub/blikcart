'use client';
import { useEffect, useState, useCallback } from 'react';
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

function CustomOrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async (status?: string) => {
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    try {
      const params = status && status !== 'All' ? `?status=${status}&limit=200` : '?limit=200';
      const res = await axios.get(`${API}/orders/admin/custom-orders${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.data || []);
    } catch { setOrders([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(statusFilter); }, [load, statusFilter]);

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

  const submitted = orders.filter(o => o.status === 'submitted').length;
  const approved = orders.filter(o => o.status === 'approved').length;
  const inProd = orders.filter(o => o.status === 'in_production').length;

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: orders.length, color: 'text-[#1A3C5E]' },
          { label: 'Awaiting Quote', value: submitted, color: 'text-yellow-600' },
          { label: 'Approved', value: approved, color: 'text-green-600' },
          { label: 'In Production', value: inProd, color: 'text-purple-600' },
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
        {['All', ...CUSTOM_STATUSES].map(s => (
          <button key={s} type="button" onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${statusFilter === s ? 'bg-[#1A3C5E] text-white border-[#1A3C5E]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
            {s === 'All' ? 'All' : fmtStatus(s)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
              {['Order ID', 'Buyer', 'Product', 'Qty', 'Est. Value', 'Status', 'Submitted', 'Update', ''].map(h => (
                <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <Skel cols={9} /> : orders.length > 0 ? orders.map(o => (
              <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-4 text-xs font-mono text-[#1A3C5E] font-semibold">
                  CO-{o.id.slice(0, 8).toUpperCase()}
                </td>
                <td className="px-5 py-4 text-sm">
                  <div className="font-medium text-gray-900">{o.user?.fullName || '—'}</div>
                  <div className="text-xs text-gray-400">{o.user?.companyName || o.user?.email}</div>
                </td>
                <td className="px-5 py-4 text-sm text-gray-700">{o.product?.name || '—'}</td>
                <td className="px-5 py-4 text-sm text-gray-500">{o.quantity}</td>
                <td className="px-5 py-4 text-sm font-semibold">
                  {o.estimatedPriceMin ? `€${Number(o.estimatedPriceMin).toFixed(2)}` : '—'}
                </td>
                <td className="px-5 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${customStatusColor[o.status] || 'bg-gray-100 text-gray-600'}`}>
                    {fmtStatus(o.status)}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-gray-500">
                  {o.submittedAt ? new Date(o.submittedAt).toLocaleDateString() : '—'}
                </td>
                <td className="px-5 py-4">
                  <select
                    title="Update custom order status"
                    value={o.status}
                    disabled={updatingId === o.id}
                    onChange={e => updateStatus(o.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1A3C5E] disabled:opacity-50"
                  >
                    {CUSTOM_STATUSES.map(s => <option key={s} value={s}>{fmtStatus(s)}</option>)}
                  </select>
                </td>
                <td className="px-5 py-4">
                  <Link href={`/custom-orders/${o.id}`}
                    className="text-xs font-semibold text-[#1A3C5E] hover:underline whitespace-nowrap">
                    {o.status === 'submitted' ? 'Send Quote →' : 'View →'}
                  </Link>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={9} className="px-5 py-10 text-center text-gray-400 text-sm">
                {statusFilter === 'All' ? 'No custom orders yet' : `No orders with status "${statusFilter}"`}
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
