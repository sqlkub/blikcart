'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { FlaskConical, Search, Filter, ChevronRight, Clock, CheckCircle, XCircle, RefreshCw, Package, Eye } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  requested:          { label: 'Requested',        color: 'bg-blue-100 text-blue-700' },
  in_review:          { label: 'In Review',         color: 'bg-yellow-100 text-yellow-700' },
  sample_sent:        { label: 'Sample Sent',       color: 'bg-purple-100 text-purple-700' },
  approved:           { label: 'Approved',          color: 'bg-green-100 text-green-700' },
  rejected:           { label: 'Rejected',          color: 'bg-red-100 text-red-700' },
  revision_requested: { label: 'Revision Req.',     color: 'bg-orange-100 text-orange-700' },
};

const STATUS_FILTERS = ['', 'requested', 'in_review', 'sample_sent', 'approved', 'rejected', 'revision_requested'];

function token() { return typeof window !== 'undefined' ? localStorage.getItem('adminToken') || '' : ''; }
function authHeaders() { return { Authorization: `Bearer ${token()}` }; }

export default function SamplesQueuePage() {
  const [samples, setSamples] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', ...(status ? { status } : {}) });
      const res = await fetch(`${API}/samples/admin/all?${params}`, { headers: authHeaders() });
      const json = await res.json();
      setSamples(json.data || []);
      setMeta(json.meta || { total: 0, pages: 1 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [status, page]);

  async function deleteSample(id: string, name: string) {
    if (!window.confirm(`Delete sample "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await axios.delete(`${API}/samples/admin/${id}`, { headers: authHeaders() });
      setSamples(prev => prev.filter(s => s.id !== id));
      setMeta(prev => ({ ...prev, total: prev.total - 1 }));
    } finally { setDeletingId(null); }
  }

  const filtered = search
    ? samples.filter(s =>
        s.productName?.toLowerCase().includes(search.toLowerCase()) ||
        s.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        s.user?.companyName?.toLowerCase().includes(search.toLowerCase())
      )
    : samples;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-blue-600" />
            Sample Requests
          </h1>
          <p className="text-sm text-gray-500 mt-1">{meta.total} total samples</p>
        </div>
        <Link href="/samples/library"
          className="flex items-center gap-2 px-4 py-2 bg-[#1A3C5E] text-white rounded-lg text-sm font-medium hover:bg-[#15304d] transition-colors">
          <Package className="w-4 h-4" />
          Sampling Library
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product, client…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          {STATUS_FILTERS.map(s => (
            <button key={s} type="button" onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                status === s ? 'bg-[#1A3C5E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {s ? STATUS_LABELS[s]?.label : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <FlaskConical className="w-8 h-8 opacity-30" />
            <p>No sample requests found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ver.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sampling Fee</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Requested</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Template</th>
                <th className="w-10 px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(s => {
                const st = STATUS_LABELS[s.status] || { label: s.status, color: 'bg-gray-100 text-gray-600' };
                return (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{s.user?.companyName || s.user?.fullName}</p>
                      <p className="text-xs text-gray-400">{s.user?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{s.productName}</p>
                      <p className="text-xs text-gray-400">{s.categorySlug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">V{s.version}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.quantity}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {s.samplingFee ? (
                        <span className={`text-sm font-semibold ${s.samplingFeeRecovered ? 'text-green-600' : 'text-gray-800'}`}>
                          €{Number(s.samplingFee).toFixed(2)}
                          {s.samplingFeeRecovered && <span className="ml-1 text-xs font-normal text-green-500">recovered</span>}
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(s.requestedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      {s.template ? (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">In Library</span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-1">
                        <button type="button" title="Delete sample" disabled={deletingId === s.id}
                          onClick={() => deleteSample(s.id, s.productName || s.id)}
                          className="p-1.5 rounded text-red-400 hover:text-red-600 disabled:opacity-40 transition-colors text-base leading-none">
                          🗑
                        </button>
                        <Link href={`/samples/${s.id}`}
                          className="p-1.5 rounded text-gray-400 hover:text-[#1A3C5E] hover:bg-blue-50 transition-colors flex items-center">
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {meta.pages > 1 && (
          <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {page} of {meta.pages}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button disabled={page === meta.pages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
