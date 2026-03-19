'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Search, ChevronRight, ShoppingBag, FlaskConical, TrendingUp, Clock } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

const TIER_COLORS: Record<string, string> = {
  bronze: 'bg-orange-100 text-orange-700',
  silver: 'bg-gray-200 text-gray-700',
  gold:   'bg-yellow-100 text-yellow-700',
};

function token() { return typeof window !== 'undefined' ? localStorage.getItem('adminToken') || '' : ''; }
function authHeaders() { return { Authorization: `Bearer ${token()}` }; }

export default function B2BClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'spend' | 'orders' | 'name'>('spend');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Fetch all approved wholesale users
        const res = await fetch(`${API}/auth/users?limit=200`, { headers: authHeaders() });
        const json = await res.json();
        const wholesale = (json.data || []).filter((u: any) => u.accountType === 'wholesale' && u.isApproved);

        // For each client, fetch their order/sample summary in parallel (batched)
        const enriched = await Promise.all(
          wholesale.map(async (u: any) => {
            const [ordersRes, samplesRes] = await Promise.all([
              fetch(`${API}/orders/admin/all?userId=${u.id}&limit=1`, { headers: authHeaders() }).then(r => r.json()).catch(() => null),
              fetch(`${API}/samples/admin/all?userId=${u.id}&limit=1`, { headers: authHeaders() }).then(r => r.json()).catch(() => null),
            ]);
            return {
              ...u,
              totalOrders: ordersRes?.meta?.total ?? 0,
              totalSamples: samplesRes?.meta?.total ?? 0,
            };
          })
        );

        setClients(enriched);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = clients
    .filter(c =>
      !search ||
      c.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      c.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'orders') return b.totalOrders - a.totalOrders;
      if (sortBy === 'spend') return b.totalOrders - a.totalOrders; // proxy until revenue data
      return a.companyName?.localeCompare(b.companyName || '') || 0;
    });

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-[#1A3C5E]" />
          B2B Clients
        </h1>
        <p className="text-sm text-gray-500 mt-1">{clients.length} approved wholesale accounts</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Clients', value: clients.length, icon: Building2, color: 'text-blue-600' },
          { label: 'Total Orders', value: clients.reduce((s, c) => s + c.totalOrders, 0), icon: ShoppingBag, color: 'text-green-600' },
          { label: 'Total Samples', value: clients.reduce((s, c) => s + c.totalSamples, 0), icon: FlaskConical, color: 'text-purple-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className={`p-2.5 rounded-lg bg-gray-50 ${stat.color}`}><stat.icon className="w-5 h-5" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients by company, name, email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <span className="text-sm text-gray-500">Sort:</span>
        {(['spend', 'orders', 'name'] as const).map(s => (
          <button key={s} type="button" onClick={() => setSortBy(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
              sortBy === s ? 'bg-[#1A3C5E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {s}
          </button>
        ))}
      </div>

      {/* Client table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
            <Building2 className="w-8 h-8 opacity-30" />
            <p>No wholesale clients found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company / Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tier</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Orders</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Samples</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="w-10 px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#1A3C5E] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {(c.companyName || c.fullName || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{c.companyName || c.fullName}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                        {c.vatNumber && <p className="text-xs text-gray-400">VAT: {c.vatNumber}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {c.wholesaleTier ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${TIER_COLORS[c.wholesaleTier] || 'bg-gray-100 text-gray-600'}`}>
                        {c.wholesaleTier}
                      </span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-800">{c.totalOrders}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-800">{c.totalSamples}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-2 py-3">
                    <Link href={`/b2b-clients/${c.id}`}
                      className="p-1.5 rounded text-gray-400 hover:text-[#1A3C5E] hover:bg-blue-50 transition-colors flex items-center">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
