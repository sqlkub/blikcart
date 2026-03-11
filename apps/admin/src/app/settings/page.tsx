'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

export default function SettingsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get(`${API}/auth/me`, { headers }),
      axios.get(`${API}/auth/users?limit=200`, { headers }),
    ]).then(([meRes, usersRes]) => {
      setMe(meRes.data);
      setAdmins((usersRes.data.data || []).filter((u: any) => u.accountType === 'admin'));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Platform configuration and admin access management</p>
      </div>

      {/* Admin Users */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Admin Users</h2>
          <p className="text-sm text-gray-400 mt-0.5">Users with admin account type have full panel access</p>
        </div>
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(2)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : admins.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No admin accounts found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                {['Name', 'Email', 'Role', 'Joined'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {admins.map(u => (
                <tr key={u.id} className="border-b border-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1A3C5E] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.fullName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{u.fullName}</p>
                        {me?.id === u.id && <p className="text-xs text-gray-400">you</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">{u.email}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold">admin</span>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="p-4 border-t border-gray-50 bg-gray-50 rounded-b-xl">
          <p className="text-xs text-gray-400">To grant admin access, register a user and set their accountType to "admin" in the database, or ask a super admin to update it.</p>
        </div>
      </div>

      {/* Platform Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Platform Configuration</h2>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-0">
          {[
            ['Platform', 'Blikcart B2B E-Commerce'],
            ['Version', '1.0 — March 2026'],
            ['Default Currency', 'EUR'],
            ['Default Locale', 'nl'],
            ['VAT Rate', '21% (Netherlands)'],
            ['Free Shipping Threshold', '€150.00'],
            ['JWT Expiry', '8 hours'],
            ['API Base URL', API],
          ].map(([label, value]) => (
            <div key={label} className="py-3 px-1 border-b border-gray-50 flex justify-between items-center">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-sm font-medium text-gray-900 text-right max-w-xs truncate">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
