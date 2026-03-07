'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-yellow-100 text-yellow-700',
  quoted: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  in_production: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
};

export default function CustomOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('adminToken');
        const params = status ? `?status=${status}` : '';
        const res = await axios.get(`${API}/orders/admin/custom-orders${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data.data);
      } catch { setOrders([]); }
      finally { setLoading(false); }
    }
    load();
  }, [status]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Custom Orders</h1>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">All statuses</option>
          {['submitted', 'quoted', 'approved', 'in_production', 'shipped'].map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
              {['Order ID', 'Buyer', 'Product', 'Qty', 'Est. Value', 'Status', 'Submitted', ''].map(h => (
                <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(8)].map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              ))
            ) : orders.map(order => (
              <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-4 text-xs font-mono text-navy">CO-{order.id.slice(0, 8).toUpperCase()}</td>
                <td className="px-5 py-4 text-sm">
                  <div>{order.user?.fullName}</div>
                  <div className="text-xs text-gray-400">{order.user?.companyName}</div>
                </td>
                <td className="px-5 py-4 text-sm">{order.product?.name}</td>
                <td className="px-5 py-4 text-sm">{order.quantity}</td>
                <td className="px-5 py-4 text-sm font-semibold">
                  {order.estimatedPriceMin ? `€${order.estimatedPriceMin}` : '—'}
                </td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-gray-500">
                  {order.submittedAt ? new Date(order.submittedAt).toLocaleDateString('nl-NL') : '—'}
                </td>
                <td className="px-5 py-4">
                  <Link href={`/custom-orders/${order.id}`} className="text-gold text-sm font-semibold hover:underline">
                    {order.status === 'submitted' ? 'Send Quote →' : 'View →'}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && orders.length === 0 && (
          <div className="text-center py-12 text-gray-400">No custom orders found</div>
        )}
      </div>
    </div>
  );
}
