'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

export default function Dashboard() {
  const [stats, setStats] = useState({ ordersToday: 0, revenueToday: 0, customOrdersPending: 0, wholesalePending: 0, quotesExpiring: 0 });
  const [customOrders, setCustomOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const [statsRes, coRes] = await Promise.all([
          axios.get(`${API}/auth/admin/stats`, { headers }),
          axios.get(`${API}/orders/admin/custom-orders?status=submitted&limit=5`, { headers }),
        ]);
        setStats(statsRes.data);
        setCustomOrders(coRes.data.data || []);
      } catch { /* silently fail */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const kpis = [
    { label: 'Revenue Today', value: `€${stats.revenueToday.toFixed(2)}`, sub: 'From completed orders', color: 'text-green-600' },
    { label: 'Orders Today', value: String(stats.ordersToday), sub: 'New orders placed', color: 'text-[#1A3C5E]' },
    { label: 'Custom Orders Pending', value: String(stats.customOrdersPending), sub: 'Awaiting quote', color: 'text-amber-600', href: '/custom-orders' },
    { label: 'Wholesale Approvals', value: String(stats.wholesalePending), sub: 'Pending review', color: stats.wholesalePending > 0 ? 'text-red-500' : 'text-gray-400', href: '/customers/wholesale' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleDateString('en-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map(kpi => (
          <div key={kpi.label} className={`bg-white rounded-xl p-5 shadow-sm border border-gray-100 ${kpi.href ? 'cursor-pointer hover:border-gray-300 transition-colors' : ''}`}
            onClick={() => kpi.href && (window.location.href = kpi.href)}>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{kpi.label}</p>
            {loading ? <div className="h-8 w-16 bg-gray-100 rounded animate-pulse mt-1" /> : <p className={`text-3xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>}
            <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Action queues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Custom Orders action queue */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-bold text-gray-900">Custom Orders — Awaiting Quote</h2>
            <Link href="/custom-orders" className="text-sm text-amber-600 font-semibold hover:underline">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                  {['Order ID', 'Buyer', 'Product', 'Submitted', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      {[...Array(5)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                    </tr>
                  ))
                ) : customOrders.length > 0 ? customOrders.map((order: any) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-mono text-[#1A3C5E]">CO-{order.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-4 py-3 text-sm">{order.user?.fullName || order.user?.email}</td>
                    <td className="px-4 py-3 text-sm">{order.product?.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {order.submittedAt ? new Date(order.submittedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/custom-orders/${order.id}`} className="bg-amber-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-amber-700 transition-colors">
                        Send Quote
                      </Link>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400 text-sm">No pending custom orders</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Wholesale approvals queue */}
        <WholesaleQueue token={typeof window !== 'undefined' ? localStorage.getItem('adminToken') || '' : ''} />
      </div>
    </div>
  );
}

function WholesaleQueue({ token }: { token: string }) {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/auth/users?limit=5`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => {
      const wholesale = (res.data.data || []).filter((u: any) => u.accountType === 'wholesale' && !u.isApproved);
      setPending(wholesale);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function approve(id: string) {
    await axios.patch(`${API}/auth/admin/users/${id}/approve`, { tier: 'bronze' }, { headers: { Authorization: `Bearer ${token}` } });
    setPending(p => p.filter(u => u.id !== id));
  }

  async function reject(id: string) {
    await axios.patch(`${API}/auth/admin/users/${id}/reject`, {}, { headers: { Authorization: `Bearer ${token}` } });
    setPending(p => p.filter(u => u.id !== id));
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-5 border-b border-gray-100 flex justify-between items-center">
        <h2 className="font-bold text-gray-900">Wholesale Approvals Pending</h2>
        <Link href="/customers/wholesale" className="text-sm text-amber-600 font-semibold hover:underline">View all →</Link>
      </div>
      {loading ? (
        <div className="p-4 space-y-3">
          {[...Array(2)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
        </div>
      ) : pending.length > 0 ? (
        <div className="divide-y divide-gray-50">
          {pending.map((u: any) => (
            <div key={u.id} className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{u.fullName}</p>
                <p className="text-xs text-gray-400">{u.email} {u.companyName ? `· ${u.companyName}` : ''}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => approve(u.id)} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-green-700">Approve</button>
                <button type="button" onClick={() => reject(u.id)} className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-100">Reject</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-5 py-8 text-center text-gray-400 text-sm">No pending wholesale approvals</div>
      )}
    </div>
  );
}
