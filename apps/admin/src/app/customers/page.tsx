'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await axios.get(`${API}/auth/users?limit=100`, { headers: { Authorization: `Bearer ${token}` } });
        setCustomers(res.data.data || []);
      } catch { setCustomers([]); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const filtered = customers.filter(c => !search ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.fullName?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-500 text-sm mt-1">{customers.length} registered customers</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full max-w-sm px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                {['Name','Email','Company','Role','Joined','Orders'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(6)].map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              )) : filtered.length > 0 ? filtered.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/customers/${c.id}`)}>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-900">{c.fullName || '-'}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{c.email}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{c.companyName || '-'}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${c.accountType === 'admin' ? 'bg-purple-100 text-purple-700' : c.accountType === 'wholesale' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {c.accountType || 'retail'}
                    </span>
                    {c.accountType === 'wholesale' && !c.isApproved && (
                      <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">pending</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{c._count?.orders || 0}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400 text-sm">No customers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
