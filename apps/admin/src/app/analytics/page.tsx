'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', confirmed: '#3b82f6', in_production: '#8b5cf6',
  shipped: '#6366f1', delivered: '#10b981', cancelled: '#ef4444',
};

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    setLoading(true);
    axios.get(`${API}/orders/admin/analytics?days=${days}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  const maxRevenue = data?.revenueByDay?.length > 0
    ? Math.max(...data.revenueByDay.map((d: any) => Number(d.revenue)))
    : 1;

  const maxProductRevenue = data?.topProducts?.length > 0
    ? Math.max(...data.topProducts.map((p: any) => p.revenue))
    : 1;

  const totalStatusCount = data?.ordersByStatus?.reduce((s: number, x: any) => s + x.count, 0) || 1;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Revenue and order performance overview</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${days === d ? 'bg-[#1A3C5E] text-white border-[#1A3C5E]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? [...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-2" />
            <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
          </div>
        )) : [
          { label: 'Total Revenue', value: `€${(data?.summary?.totalRevenue || 0).toFixed(2)}`, color: 'text-green-600' },
          { label: 'Total Orders', value: String(data?.summary?.totalOrders || 0), color: 'text-[#1A3C5E]' },
          { label: 'Avg Order Value', value: `€${(data?.summary?.avgOrderValue || 0).toFixed(2)}`, color: 'text-amber-600' },
          { label: 'Custom Revenue', value: `€${(data?.summary?.customRevenue || 0).toFixed(2)}`, color: 'text-purple-600' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{kpi.label}</p>
            <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Revenue — Last {days} Days</h2>
          {loading ? <div className="h-48 bg-gray-50 rounded-lg animate-pulse" /> : (
            <div className="flex items-end gap-1 h-48">
              {data?.revenueByDay?.length > 0 ? data.revenueByDay.map((d: any, i: number) => {
                const height = maxRevenue > 0 ? (Number(d.revenue) / maxRevenue) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                      {d.date}: €{Number(d.revenue).toFixed(2)} ({d.orders} orders)
                    </div>
                    <div className="w-full bg-[#1A3C5E] rounded-t transition-all hover:bg-[#C8860A]" style={{ height: `${Math.max(height, 2)}%` }} />
                  </div>
                );
              }) : <div className="w-full flex items-center justify-center text-gray-400 text-sm">No revenue data for this period</div>}
            </div>
          )}
          {!loading && data?.revenueByDay?.length > 0 && (
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>{data.revenueByDay[0]?.date}</span>
              <span>{data.revenueByDay[data.revenueByDay.length - 1]?.date}</span>
            </div>
          )}
        </div>

        {/* Order status donut */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Orders by Status</h2>
          {loading ? <div className="h-48 bg-gray-50 rounded-lg animate-pulse" /> : (
            <div className="space-y-3">
              {data?.ordersByStatus?.map((s: any) => (
                <div key={s.status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 capitalize">{s.status.replace('_', ' ')}</span>
                    <span className="font-semibold text-gray-900">{s.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{
                      width: `${(s.count / totalStatusCount) * 100}%`,
                      backgroundColor: STATUS_COLORS[s.status] || '#9ca3af',
                    }} />
                  </div>
                </div>
              ))}
              {(!data?.ordersByStatus || data.ordersByStatus.length === 0) && (
                <p className="text-center text-gray-400 text-sm py-8">No order data</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">Top Products by Revenue</h2>
        {loading ? <div className="h-32 bg-gray-50 rounded-lg animate-pulse" /> : (
          <div className="space-y-4">
            {data?.topProducts?.length > 0 ? data.topProducts.map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-900">{p.name}</span>
                    <span className="text-gray-500">€{p.revenue.toFixed(2)} · {p.orders} orders</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full bg-[#C8860A]" style={{ width: `${(p.revenue / maxProductRevenue) * 100}%` }} />
                  </div>
                </div>
              </div>
            )) : <p className="text-center text-gray-400 text-sm py-4">No product data</p>}
          </div>
        )}
      </div>

      {/* Custom Order Funnel + Revenue by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Custom Order Funnel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Custom Order Funnel</h2>
          {loading ? <div className="h-40 bg-gray-50 rounded-lg animate-pulse" /> : (() => {
            const funnel: any[] = data?.customOrderFunnel || [];
            const maxCount = Math.max(...funnel.map((f: any) => f.count), 1);
            const colors: Record<string, string> = { draft: '#9ca3af', submitted: '#f59e0b', quoted: '#3b82f6', approved: '#10b981', in_production: '#8b5cf6', shipped: '#6366f1' };
            return (
              <div className="space-y-2">
                {funnel.map((f: any) => (
                  <div key={f.status}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 capitalize font-medium">{f.status.replace('_', ' ')}</span>
                      <span className="font-bold text-gray-900">{f.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      {/* eslint-disable-next-line react/forbid-component-props */}
                      <div className="h-3 rounded-full transition-all" style={{ width: `${(f.count / maxCount) * 100}%`, backgroundColor: colors[f.status] || '#9ca3af' }} />
                    </div>
                  </div>
                ))}
                {funnel.length === 0 && <p className="text-center text-gray-400 text-sm py-6">No custom order data</p>}
              </div>
            );
          })()}
        </div>

        {/* Revenue by Category */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Revenue by Category</h2>
          {loading ? <div className="h-40 bg-gray-50 rounded-lg animate-pulse" /> : (() => {
            const cats: any[] = data?.revenueByCategory || [];
            const maxCatRev = Math.max(...cats.map((c: any) => c.revenue), 1);
            return (
              <div className="space-y-3">
                {cats.length > 0 ? cats.map((c: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-gray-900">{c.category}</span>
                        <span className="text-gray-500">€{Number(c.revenue).toFixed(2)} · {c.orders} orders</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        {/* eslint-disable-next-line react/forbid-component-props */}
                        <div className="h-2 rounded-full bg-[#1A3C5E]" style={{ width: `${(c.revenue / maxCatRev) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                )) : <p className="text-center text-gray-400 text-sm py-6">No category data for this period</p>}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Geographic Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-bold text-gray-900 mb-4">Revenue by Country</h2>
        {loading ? <div className="h-32 bg-gray-50 rounded-lg animate-pulse" /> : (() => {
          const geo: any[] = data?.geoBreakdown || [];
          const maxGeoRev = Math.max(...geo.map((g: any) => g.revenue), 1);
          return (
            <div className="space-y-3">
              {geo.length > 0 ? geo.map((g: any, i: number) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-sm font-bold text-gray-700 w-10 uppercase">{g.country}</span>
                  <div className="flex-1">
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      {/* eslint-disable-next-line react/forbid-component-props */}
                      <div className="h-3 rounded-full bg-[#C8860A]" style={{ width: `${(g.revenue / maxGeoRev) * 100}%` }} />
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-600 w-36 shrink-0">
                    <span className="font-semibold text-gray-900">€{Number(g.revenue).toFixed(2)}</span>
                    <span className="text-gray-400"> · {g.orders} orders</span>
                  </div>
                </div>
              )) : <p className="text-center text-gray-400 text-sm py-4">No geographic data for this period</p>}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
