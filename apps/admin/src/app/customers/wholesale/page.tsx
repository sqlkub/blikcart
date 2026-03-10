'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

export default function WholesaleApprovalsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API}/auth/users?limit=100`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers((res.data.data || []).filter((u: any) => u.accountType === 'wholesale' && !u.isApproved));
    } catch { setUsers([]); }
    finally { setLoading(false); }
  }

  async function approve(id: string, tier = 'bronze') {
    setProcessing(id);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`${API}/auth/admin/users/${id}/approve`, { tier }, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(u => u.filter(x => x.id !== id));
    } finally { setProcessing(null); }
  }

  async function reject(id: string) {
    setProcessing(id);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`${API}/auth/admin/users/${id}/reject`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(u => u.filter(x => x.id !== id));
    } finally { setProcessing(null); }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Wholesale Approvals</h1>
        <p className="text-gray-500 text-sm mt-1">{users.length} pending B2B accounts awaiting review</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">✓</div>
            <p className="text-gray-500 font-medium">All caught up</p>
            <p className="text-gray-400 text-sm mt-1">No wholesale accounts pending approval</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                {['Name', 'Email', 'Company', 'Registered', 'Approve As', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const busy = processing === u.id;
                return (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900">{u.fullName}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{u.email}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{u.companyName || '—'}</td>
                    <td className="px-5 py-4 text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <select id={`tier-${u.id}`} defaultValue="bronze"
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700">
                        <option value="bronze">Bronze</option>
                        <option value="silver">Silver</option>
                        <option value="gold">Gold</option>
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button type="button" disabled={busy}
                          onClick={() => {
                            const sel = document.getElementById(`tier-${u.id}`) as HTMLSelectElement;
                            approve(u.id, sel?.value || 'bronze');
                          }}
                          className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50">
                          {busy ? '…' : 'Approve'}
                        </button>
                        <button type="button" disabled={busy} onClick={() => reject(u.id)}
                          className="text-xs border border-red-200 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-100 disabled:opacity-50">
                          {busy ? '…' : 'Reject'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
