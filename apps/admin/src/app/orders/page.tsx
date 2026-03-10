'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
const STATUSES = ['All','pending','confirmed','in_production','shipped','delivered','cancelled'];
const ORDER_STATUSES = ['pending','confirmed','in_production','shipped','delivered','cancelled'];
const statusColor: Record<string,string> = {
  pending:'bg-yellow-100 text-yellow-700', confirmed:'bg-blue-100 text-blue-700',
  in_production:'bg-purple-100 text-purple-700', shipped:'bg-indigo-100 text-indigo-700',
  delivered:'bg-green-100 text-green-700', cancelled:'bg-red-100 text-red-600',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('All');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdatingId(orderId);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`${API}/orders/admin/orders/${orderId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } finally {
      setUpdatingId(null);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await axios.get(`${API}/orders/admin/orders?limit=100`, { headers: { Authorization: `Bearer ${token}` } });
        setOrders(res.data.data || []);
      } catch { setOrders([]); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const filtered = status === 'All' ? orders : orders.filter(o => o.status === status);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 text-sm mt-1">{orders.length} total orders</p>
      </div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${status === s ? 'bg-[#1A3C5E] text-white border-[#1A3C5E]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
            {s === 'All' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                {['Order ID','Customer','Items','Total','Status','Date','Action'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(7)].map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              )) : filtered.length > 0 ? filtered.map(o => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-4 text-xs font-mono text-[#1A3C5E]">#{o.orderNumber || o.id.slice(0,8).toUpperCase()}</td>
                  <td className="px-5 py-4 text-sm">
                    <div className="font-medium">{o.user?.fullName || '-'}</div>
                    <div className="text-xs text-gray-400">{o.user?.email}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">{o.items?.length || 0} items</td>
                  <td className="px-5 py-4 text-sm font-semibold">€{Number(o.total || o.totalAmount || 0).toFixed(2)}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusColor[o.status] || 'bg-gray-100 text-gray-500'}`}>{o.status}</span>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500">{new Date(o.placedAt || o.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    <select
                      title="Update order status"
                      value={o.status}
                      disabled={updatingId === o.id}
                      onChange={e => updateStatus(o.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1A3C5E]"
                    >
                      {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                    </select>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400 text-sm">No orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
