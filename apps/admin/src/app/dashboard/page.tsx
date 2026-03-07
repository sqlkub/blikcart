'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

const kpis = [
  { label: 'Revenue Today', value: '€3,840', sub: '+12% vs yesterday', color: 'text-green-600' },
  { label: 'Orders Today', value: '18', sub: '4 pending', color: 'text-navy' },
  { label: 'Custom Orders', value: '7', sub: 'awaiting quote', color: 'text-gold' },
  { label: 'Quotes Expiring', value: '3', sub: 'within 48h', color: 'text-red-500' },
];

export default function Dashboard() {
  const [customOrders, setCustomOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await axios.get(`${API}/orders/admin/custom-orders?status=submitted&limit=5`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCustomOrders(res.data.data);
      } catch { setCustomOrders([]); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleDateString('en-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{kpi.label}</p>
            <p className={`text-3xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Custom orders action queue */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-bold text-gray-900">Custom Orders — Awaiting Quote</h2>
          <Link href="/custom-orders" className="text-sm text-gold font-semibold hover:underline">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                {['Order ID', 'Buyer', 'Product', 'Est. Value', 'Submitted', 'Action'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {[...Array(6)].map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                  </tr>
                ))
              ) : customOrders.length > 0 ? customOrders.map((order: any) => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-4 text-xs font-mono text-navy">CO-{order.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-5 py-4 text-sm">{order.user?.fullName || order.user?.email}</td>
                  <td className="px-5 py-4 text-sm">{order.product?.name}</td>
                  <td className="px-5 py-4 text-sm font-semibold">
                    {order.estimatedPriceMin ? `€${order.estimatedPriceMin}–€${order.estimatedPriceMax}` : '—'}
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500">
                    {order.submittedAt ? new Date(order.submittedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/custom-orders/${order.id}`} className="bg-gold text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-amber-600 transition-colors">
                      Send Quote
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400 text-sm">No pending custom orders</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
