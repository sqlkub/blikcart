'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Download, Search } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : '';
  return { Authorization: `Bearer ${token}` };
}

const TYPE_PILLS = [
  { label: 'All Types', value: '' },
  { label: 'Retail', value: 'retail' },
  { label: 'Wholesale', value: 'wholesale' },
  { label: 'Admin', value: 'admin' },
];

const STATUS_PILLS = [
  { label: 'All Status', value: '' },
  { label: 'Approved', value: 'true' },
  { label: 'Pending', value: 'false' },
];

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: LIMIT };
      if (search) params.search = search;
      if (typeFilter) params.accountType = typeFilter;
      if (statusFilter !== '') params.isApproved = statusFilter;
      const res = await axios.get(`${API}/auth/users`, { headers: authHeaders(), params });
      setCustomers(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch { setCustomers([]); }
    finally { setLoading(false); }
  }, [page, search, typeFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, typeFilter, statusFilter]);

  function exportCSV() {
    const headers = ['Name', 'Email', 'Company', 'VAT', 'Type', 'Tier', 'Approved', 'Orders', 'Total Spend (€)', 'Registered'];
    const rows = customers.map(c => [
      c.fullName || '',
      c.email,
      c.companyName || '',
      c.vatNumber || '',
      c.accountType,
      c.wholesaleTier || '',
      c.isApproved ? 'Yes' : 'No',
      c._count?.orders || 0,
      (c.totalSpend || 0).toFixed(2),
      new Date(c.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'customers.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteCustomer(id: string, name: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm(`Delete customer "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await axios.delete(`${API}/auth/admin/users/${id}`, { headers: authHeaders() });
      setCustomers(prev => prev.filter(c => c.id !== id));
      setTotal(prev => prev - 1);
    } finally { setDeletingId(null); }
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 text-sm mt-1">{total} registered customers</p>
        </div>
        <button type="button" onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Name, email, company or VAT…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1A3C5E]"
            />
          </div>

          {/* Account type pills */}
          <div className="flex gap-1">
            {TYPE_PILLS.map(p => (
              <button key={p.value} type="button" onClick={() => setTypeFilter(p.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${typeFilter === p.value ? 'bg-[#1A3C5E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Approval status pills */}
          <div className="flex gap-1">
            {STATUS_PILLS.map(p => (
              <button key={p.value} type="button" onClick={() => setStatusFilter(p.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === p.value ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                {['Name', 'Email', 'Type / Tier', 'VAT', 'Orders', 'Total Spend', 'Registered', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
                : customers.length > 0
                  ? customers.map(c => (
                    <tr key={c.id}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/customers/${c.id}`)}>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900">{c.fullName || '—'}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">{c.email}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            c.accountType === 'admin' ? 'bg-purple-100 text-purple-700'
                              : c.accountType === 'wholesale' ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600'}`}>
                            {c.accountType}
                          </span>
                          {c.wholesaleTier && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">{c.wholesaleTier}</span>
                          )}
                          {c.accountType === 'wholesale' && !c.isApproved && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">pending</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500 font-mono">{c.vatNumber || '—'}</td>
                      <td className="px-5 py-4 text-sm text-gray-700">{c._count?.orders ?? 0}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                        {c.totalSpend > 0 ? `€${c.totalSpend.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-4" onClick={e => e.stopPropagation()}>
                        <button type="button" title="Delete customer" disabled={deletingId === c.id}
                          onClick={e => deleteCustomer(c.id, c.fullName || c.email, e)}
                          className="text-red-400 hover:text-red-600 disabled:opacity-40 text-base leading-none">
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))
                  : (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-gray-400 text-sm">No customers found</td>
                    </tr>
                  )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Showing {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)} of {total}
            </p>
            <div className="flex gap-1">
              <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                ← Prev
              </button>
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                const pg = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
                return (
                  <button key={pg} type="button" onClick={() => setPage(pg)}
                    className={`px-3 py-1.5 text-xs rounded-lg border ${pg === page ? 'bg-[#1A3C5E] text-white border-[#1A3C5E]' : 'border-gray-200 hover:bg-gray-50'}`}>
                    {pg}
                  </button>
                );
              })}
              <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
