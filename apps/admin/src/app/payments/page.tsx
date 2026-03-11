'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
const STATUSES = ['All', 'pending', 'paid', 'failed', 'refunded'];
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-600',
  refunded: 'bg-gray-100 text-gray-500',
  partially_refunded: 'bg-orange-100 text-orange-700',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('All');
  const [summary, setSummary] = useState({ total: 0, paid: 0, failed: 0, refunded: 0 });

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('adminToken');
      try {
        const res = await axios.get(`${API}/orders/admin/payments?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data: any[] = res.data.data || [];
        setPayments(data);
        setSummary({
          total: data.reduce((s, p) => s + Number(p.amount || 0), 0),
          paid: data.filter(p => p.status === 'paid').length,
          failed: data.filter(p => p.status === 'failed').length,
          refunded: data.filter(p => ['refunded', 'partially_refunded'].includes(p.status)).length,
        });
      } catch { setPayments([]); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const filtered = status === 'All' ? payments : payments.filter(p => p.status === status);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500 text-sm mt-1">Transaction history and payment status</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Volume', value: `€${summary.total.toFixed(2)}`, color: 'text-[#1A3C5E]' },
          { label: 'Paid', value: String(summary.paid), color: 'text-green-600' },
          { label: 'Failed', value: String(summary.failed), color: 'text-red-500' },
          { label: 'Refunded', value: String(summary.refunded), color: 'text-gray-500' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{c.label}</p>
            {loading ? <div className="h-8 w-16 bg-gray-100 rounded animate-pulse mt-1" /> : (
              <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${status === s ? 'bg-[#1A3C5E] text-white border-[#1A3C5E]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                {['Transaction ID', 'Order', 'Customer', 'Amount', 'Method', 'Provider', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(8)].map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              )) : filtered.length > 0 ? filtered.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-4 text-xs font-mono text-gray-400">{(p.providerPaymentId || p.id).slice(0, 16)}…</td>
                  <td className="px-5 py-4 text-xs font-mono text-[#1A3C5E]">#{p.order?.orderNumber || '—'}</td>
                  <td className="px-5 py-4 text-sm">
                    <div className="font-medium text-gray-900">{p.order?.user?.fullName || '—'}</div>
                    <div className="text-xs text-gray-400">{p.order?.user?.email}</div>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold">€{Number(p.amount).toFixed(2)}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{p.method || '—'}</td>
                  <td className="px-5 py-4 text-sm text-gray-500 capitalize">{p.provider}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-500'}`}>{p.status}</span>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              )) : (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-400 text-sm">
                  {status === 'All' ? 'No payment transactions yet' : `No ${status} payments`}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
