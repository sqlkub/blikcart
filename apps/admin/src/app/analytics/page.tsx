'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const [prodRes, catRes] = await Promise.all([
          axios.get(`${API}/products?limit=1`),
          axios.get(`${API}/products/categories`),
        ]);
        setStats({ totalProducts: prodRes.data.meta?.total || 0, totalCategories: catRes.data?.length || 0 });
      } catch {}
    }
    load();
  }, []);

  const kpis = [
    { label: 'Total Revenue', value: '€24,380', sub: 'This month', color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Orders', value: '142', sub: 'This month', color: 'text-[#1A3C5E]', bg: 'bg-blue-50' },
    { label: 'Avg Order Value', value: '€171', sub: '+8% vs last month', color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Total Products', value: stats?.totalProducts || '...', sub: `${stats?.totalCategories || 0} categories`, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Custom Orders', value: '38', sub: 'This month', color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'New Customers', value: '24', sub: 'This month', color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Conversion Rate', value: '3.2%', sub: '+0.4% vs last month', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Wholesale Orders', value: '19', sub: '13% of total', color: 'text-pink-600', bg: 'bg-pink-50' },
  ];

  const topProducts = [
    { name: 'Dressage Bridle - Full Custom', orders: 28, revenue: '€4,200', growth: '+12%' },
    { name: 'Padded Browband', orders: 22, revenue: '€2,640', growth: '+8%' },
    { name: 'Leather Halter', orders: 19, revenue: '€1,900', growth: '+5%' },
    { name: 'Competition Girth', orders: 17, revenue: '€2,040', growth: '+18%' },
    { name: 'Horse Reins - Custom', orders: 14, revenue: '€1,680', growth: '+3%' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Overview — {new Date().toLocaleDateString('en-NL', { month: 'long', year: 'numeric' })}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map(k => (
          <div key={k.label} className={`${k.bg} rounded-xl p-5`}>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{k.label}</p>
            <p className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</p>
            <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100"><h2 className="font-bold text-gray-900">Top Products</h2></div>
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                {['Product','Orders','Revenue','Growth'].map(h => <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3 text-sm font-medium text-gray-800">{p.name}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{p.orders}</td>
                  <td className="px-5 py-3 text-sm font-semibold">{p.revenue}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-green-600">{p.growth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100"><h2 className="font-bold text-gray-900">Revenue by Category</h2></div>
          <div className="p-5 space-y-4">
            {[
              { name: 'Bridles', pct: 38, color: 'bg-[#1A3C5E]' },
              { name: 'Browbands', pct: 22, color: 'bg-[#C8860A]' },
              { name: 'Halters', pct: 16, color: 'bg-purple-500' },
              { name: 'Girths', pct: 14, color: 'bg-green-500' },
              { name: 'Other', pct: 10, color: 'bg-gray-300' },
            ].map(c => (
              <div key={c.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{c.name}</span>
                  <span className="text-gray-500">{c.pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
