'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_production: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
  submitted: 'bg-orange-100 text-orange-700',
  quoted: 'bg-cyan-100 text-cyan-700',
  approved: 'bg-teal-100 text-teal-700',
  draft: 'bg-gray-100 text-gray-500',
};

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'profile' | 'orders' | 'addresses' | 'custom'>('profile');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    axios.get(`${API}/auth/users/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setUser(r.data))
      .catch(() => router.push('/customers'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;
  if (!user) return null;

  const totalSpend = user.orders.reduce((s: number, o: any) => s + Number(o.total || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link href="/customers" className="text-gray-400 hover:text-gray-700 text-sm">← Customers</Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#1A3C5E] flex items-center justify-center text-white font-bold text-xl">
            {user.fullName?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user.fullName}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
            <div className="flex gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${user.accountType === 'wholesale' ? 'bg-blue-100 text-blue-700' : user.accountType === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                {user.accountType}
              </span>
              {user.wholesaleTier && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">{user.wholesaleTier}</span>}
              {!user.isApproved && user.accountType === 'wholesale' && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">pending</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-6 text-center">
          <div><p className="text-2xl font-bold text-[#1A3C5E]">{user._count.orders}</p><p className="text-xs text-gray-400">Orders</p></div>
          <div><p className="text-2xl font-bold text-green-600">€{totalSpend.toFixed(2)}</p><p className="text-xs text-gray-400">Total Spend</p></div>
          <div><p className="text-2xl font-bold text-amber-600">{user._count.customOrders}</p><p className="text-xs text-gray-400">Custom Orders</p></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {(['profile', 'orders', 'addresses', 'custom'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'custom' ? 'Custom Orders' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Profile Information</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Full Name', user.fullName],
              ['Email', user.email],
              ['Phone', user.phone || '—'],
              ['Company', user.companyName || '—'],
              ['VAT Number', user.vatNumber || '—'],
              ['Account Type', user.accountType],
              ['Wholesale Tier', user.wholesaleTier || '—'],
              ['Approved', user.isApproved ? 'Yes' : 'No'],
              ['Locale', user.locale],
              ['Currency', user.currency],
              ['Registered', new Date(user.createdAt).toLocaleDateString()],
            ].map(([label, value]) => (
              <div key={label} className="py-3 border-b border-gray-50">
                <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Order History</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                {['Order #', 'Items', 'Total', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {user.orders.length > 0 ? user.orders.map((o: any) => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-4 text-xs font-mono text-[#1A3C5E]">#{o.orderNumber}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{o.items.reduce((s: number, i: any) => s + i.quantity, 0)} items</td>
                  <td className="px-5 py-4 text-sm font-semibold">€{Number(o.total).toFixed(2)}</td>
                  <td className="px-5 py-4"><span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-500'}`}>{o.status}</span></td>
                  <td className="px-5 py-4 text-xs text-gray-500">{new Date(o.placedAt).toLocaleDateString()}</td>
                </tr>
              )) : <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">No orders yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Addresses Tab */}
      {tab === 'addresses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user.addresses.length > 0 ? user.addresses.map((a: any) => (
            <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{a.type}</span>
                {a.isDefault && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Default</span>}
              </div>
              <p className="font-semibold text-gray-900">{a.fullName}</p>
              <p className="text-sm text-gray-500 mt-1">{a.streetLine1}{a.streetLine2 ? `, ${a.streetLine2}` : ''}</p>
              <p className="text-sm text-gray-500">{a.postalCode} {a.city}, {a.countryCode}</p>
            </div>
          )) : <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">No saved addresses</div>}
        </div>
      )}

      {/* Custom Orders Tab */}
      {tab === 'custom' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Custom Orders</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                {['ID', 'Product', 'Qty', 'Est. Price', 'Status', 'Submitted'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {user.customOrders.length > 0 ? user.customOrders.map((o: any) => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-4 text-xs font-mono text-[#1A3C5E]">
                    <Link href={`/custom-orders/${o.id}`} className="hover:underline">CO-{o.id.slice(0, 8).toUpperCase()}</Link>
                  </td>
                  <td className="px-5 py-4 text-sm">{o.product?.name}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{o.quantity}</td>
                  <td className="px-5 py-4 text-sm">{o.estimatedPriceMin ? `€${o.estimatedPriceMin}–€${o.estimatedPriceMax}` : '—'}</td>
                  <td className="px-5 py-4"><span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-500'}`}>{o.status}</span></td>
                  <td className="px-5 py-4 text-xs text-gray-500">{o.submittedAt ? new Date(o.submittedAt).toLocaleDateString() : '—'}</td>
                </tr>
              )) : <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400 text-sm">No custom orders</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
