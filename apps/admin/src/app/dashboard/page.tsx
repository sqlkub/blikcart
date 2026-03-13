'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

// ─── SVG Charts ────────────────────────────────────────────────────────────────

function LineChart({ data }: { data: { date: string; standardRevenue: number; customRevenue: number }[] }) {
  if (!data.length) return <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data</div>;

  const W = 520, H = 140, PX = 40, PY = 10;
  const iW = W - PX * 2, iH = H - PY * 2;

  const maxVal = Math.max(...data.map(d => d.standardRevenue + d.customRevenue), 1);
  const xStep = iW / Math.max(data.length - 1, 1);

  function pts(key: 'standardRevenue' | 'customRevenue') {
    return data.map((d, i) => {
      const x = PX + i * xStep;
      const y = PY + iH - (d[key] / maxVal) * iH;
      return `${x},${y}`;
    }).join(' ');
  }

  // filled area under standard line
  const stdPts = data.map((d, i) => ({ x: PX + i * xStep, y: PY + iH - (d.standardRevenue / maxVal) * iH }));
  const areaPath = [
    `M ${stdPts[0].x} ${PY + iH}`,
    ...stdPts.map(p => `L ${p.x} ${p.y}`),
    `L ${stdPts[stdPts.length - 1].x} ${PY + iH}`,
    'Z',
  ].join(' ');

  // x-axis labels: show first, mid, last
  const labelIdxs = [0, Math.floor(data.length / 2), data.length - 1].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40">
      <defs>
        <linearGradient id="stdGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1A3C5E" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#1A3C5E" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const y = PY + iH - t * iH;
        return (
          <g key={t}>
            <line x1={PX} y1={y} x2={W - PX} y2={y} stroke="#f0f0f0" strokeWidth="1" />
            <text x={PX - 4} y={y + 3} textAnchor="end" fontSize="8" fill="#aaa">{`€${(t * maxVal).toFixed(0)}`}</text>
          </g>
        );
      })}
      {/* Area fill */}
      <path d={areaPath} fill="url(#stdGrad)" />
      {/* Standard line */}
      <polyline points={pts('standardRevenue')} fill="none" stroke="#1A3C5E" strokeWidth="2" strokeLinejoin="round" />
      {/* Custom line (dashed amber) */}
      <polyline points={pts('customRevenue')} fill="none" stroke="#C8860A" strokeWidth="2" strokeLinejoin="round" strokeDasharray="5,3" />
      {/* X-axis labels */}
      {labelIdxs.map(i => (
        <text key={i} x={PX + i * xStep} y={H - 2} textAnchor="middle" fontSize="8" fill="#aaa">
          {data[i].date.slice(5)}
        </text>
      ))}
    </svg>
  );
}

function DonutChart({ segments }: { segments: { label: string; value: number; color: string; bgClass: string }[] }) {
  const total = segments.reduce((s, g) => s + g.value, 0);
  if (!total) return <div className="flex items-center justify-center h-36 text-gray-400 text-sm">No data</div>;

  const R = 44, CX = 60, CY = 60, stroke = 20;
  const circ = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="w-28 h-28 flex-shrink-0">
        {segments.map(seg => {
          const dash = (seg.value / total) * circ;
          const gap = circ - dash;
          const el = (
            <circle
              key={seg.label}
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 60 60)"
            />
          );
          offset += dash;
          return el;
        })}
        <text x={CX} y={CY + 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1A3C5E">{total}</text>
        <text x={CX} y={CY + 14} textAnchor="middle" fontSize="7" fill="#aaa">orders</text>
      </svg>
      <div className="space-y-1.5 text-xs">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${seg.bgClass}`} />
            <span className="text-gray-600">{seg.label}</span>
            <span className="ml-auto font-semibold text-gray-900 pl-2">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HBarChart({ items }: { items: { label: string; revenue: number }[] }) {
  if (!items.length) return <div className="flex items-center justify-center h-24 text-gray-400 text-sm">No data</div>;
  const max = Math.max(...items.map(i => i.revenue), 1);
  return (
    <div className="space-y-2.5">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-2 text-xs">
          <span className="w-28 text-gray-600 truncate flex-shrink-0">{item.label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-2.5">
            {/* eslint-disable-next-line react/forbid-component-props */}
            <div className="bg-[#1A3C5E] h-2.5 rounded-full" style={{ width: `${(item.revenue / max) * 100}%` }} />
          </div>
          <span className="w-16 text-right font-semibold text-gray-900">€{item.revenue.toFixed(0)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color, href, loading, alert }: {
  label: string; value: string; sub: string; color: string; href?: string; loading: boolean; alert?: boolean;
}) {
  const inner = (
    <div className={`bg-white rounded-xl p-5 shadow-sm border transition-colors ${alert ? 'border-red-200 bg-red-50' : 'border-gray-100'} ${href ? 'cursor-pointer hover:border-gray-300' : ''}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      {loading
        ? <div className="h-8 w-20 bg-gray-100 rounded animate-pulse mt-1" />
        : <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      }
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ─── Queue Card wrapper ────────────────────────────────────────────────────────

function QueueCard({ title, href, linkLabel, children }: { title: string; href: string; linkLabel: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
        <h2 className="font-bold text-gray-900 text-sm">{title}</h2>
        <Link href={href} className="text-xs text-amber-600 font-semibold hover:underline">{linkLabel} →</Link>
      </div>
      {children}
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { color: string; bgClass: string }> = {
  pending:       { color: '#94a3b8', bgClass: 'bg-slate-400' },
  confirmed:     { color: '#60a5fa', bgClass: 'bg-blue-400' },
  in_production: { color: '#f59e0b', bgClass: 'bg-amber-400' },
  shipped:       { color: '#a78bfa', bgClass: 'bg-violet-400' },
  delivered:     { color: '#22c55e', bgClass: 'bg-green-500' },
  cancelled:     { color: '#f87171', bgClass: 'bg-red-400' },
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    ordersToday: 0, revenueToday: 0, revenueMonth: 0,
    customOrdersPending: 0, wholesalePending: 0, quotesExpiring: 0, failedPayments24h: 0,
  });
  const [customOrders, setCustomOrders] = useState<any[]>([]);
  const [expiringQuotes, setExpiringQuotes] = useState<any[]>([]);
  const [failedPayments, setFailedPayments] = useState<any[]>([]);
  const [wholesaleUsers, setWholesaleUsers] = useState<any[]>([]);
  const [revenueSplit, setRevenueSplit] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<{ statusBreakdown?: any[]; topProducts?: any[] } | null>(null);

  const load = useCallback(async () => {
    const token = localStorage.getItem('adminToken');
    const h = { Authorization: `Bearer ${token}` };
    try {
      const [statsRes, coRes, paymentsRes, usersRes, splitRes, analyticsRes] = await Promise.all([
        axios.get(`${API}/auth/admin/stats`, { headers: h }),
        axios.get(`${API}/orders/admin/custom-orders?status=submitted&limit=5`, { headers: h }),
        axios.get(`${API}/orders/admin/payments?status=failed&limit=5`, { headers: h }),
        axios.get(`${API}/auth/users?limit=100`, { headers: h }),
        axios.get(`${API}/orders/admin/revenue-split?days=30`, { headers: h }),
        axios.get(`${API}/orders/admin/analytics?days=30`, { headers: h }),
      ]);
      setStats(statsRes.data);
      setCustomOrders(coRes.data.data || []);
      setFailedPayments(paymentsRes.data.data || []);
      const wUsers = (usersRes.data.data || []).filter((u: any) => u.accountType === 'wholesale' && !u.isApproved);
      setWholesaleUsers(wUsers);
      setRevenueSplit(splitRes.data || []);
      setAnalytics(analyticsRes.data || null);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function approveWholesale(id: string) {
    const token = localStorage.getItem('adminToken');
    await axios.patch(`${API}/auth/admin/users/${id}/approve`, { tier: 'bronze' }, { headers: { Authorization: `Bearer ${token}` } });
    setWholesaleUsers(u => u.filter(x => x.id !== id));
    setStats(s => ({ ...s, wholesalePending: Math.max(0, s.wholesalePending - 1) }));
  }

  async function rejectWholesale(id: string) {
    const token = localStorage.getItem('adminToken');
    await axios.patch(`${API}/auth/admin/users/${id}/reject`, {}, { headers: { Authorization: `Bearer ${token}` } });
    setWholesaleUsers(u => u.filter(x => x.id !== id));
    setStats(s => ({ ...s, wholesalePending: Math.max(0, s.wholesalePending - 1) }));
  }

  const kpis = [
    { label: 'Revenue Today', value: `€${stats.revenueToday.toFixed(2)}`, sub: 'Completed orders', color: 'text-green-600' },
    { label: 'Revenue (30d)', value: `€${(stats.revenueMonth / 1000).toFixed(1)}k`, sub: 'Rolling 30 days', color: 'text-green-700' },
    { label: 'Orders Today', value: String(stats.ordersToday), sub: 'New orders placed', color: 'text-[#1A3C5E]' },
    { label: 'Custom Orders', value: String(stats.customOrdersPending), sub: 'Awaiting quote', color: 'text-amber-600', href: '/orders', alert: stats.customOrdersPending > 0 },
    { label: 'Quotes Expiring', value: String(stats.quotesExpiring), sub: 'Within 48 hours', color: 'text-orange-500', href: '/orders', alert: stats.quotesExpiring > 0 },
    { label: 'Failed Payments', value: String(stats.failedPayments24h), sub: 'Last 24 hours', color: 'text-red-500', href: '/payments', alert: stats.failedPayments24h > 0 },
  ];

  // Build donut segments from analytics
  const donutSegments = analytics?.statusBreakdown?.map((s: any) => ({
    label: s.status.replace(/_/g, ' '),
    value: Number(s._count ?? s.count ?? 0),
    color: STATUS_META[s.status]?.color ?? '#cbd5e1',
    bgClass: STATUS_META[s.status]?.bgClass ?? 'bg-slate-300',
  })) ?? [];

  // Top products for bar chart
  const topProducts = (analytics?.topProducts || []).slice(0, 5).map((p: any) => ({
    label: p.name || p.productName || p.product?.name || 'Unknown',
    revenue: Number(p.revenue ?? p._sum?.unitPrice ?? 0),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {new Date().toLocaleDateString('en-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map(k => (
          <KpiCard key={k.label} loading={loading} {...k} />
        ))}
      </div>

      {/* ── Action Queues ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* New Custom Orders */}
        <QueueCard title="New Custom Orders — Awaiting Quote" href="/orders" linkLabel="View all">
          {loading ? (
            <div className="p-4 space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : customOrders.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {customOrders.map(o => (
                <div key={o.id} className="px-5 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{o.product?.name || 'Custom product'}</p>
                    <p className="text-xs text-gray-400">{o.user?.fullName || o.user?.email} · {o.submittedAt ? new Date(o.submittedAt).toLocaleDateString() : '—'}</p>
                  </div>
                  <Link href="/orders" className="flex-shrink-0 text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-amber-700">
                    Quote
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No pending custom orders</div>
          )}
        </QueueCard>

        {/* Wholesale Approvals */}
        <QueueCard title="Wholesale Approvals Pending" href="/customers/wholesale" linkLabel="View all">
          {loading ? (
            <div className="p-4 space-y-2">{[...Array(2)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : wholesaleUsers.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {wholesaleUsers.map(u => (
                <div key={u.id} className="px-5 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{u.fullName}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}{u.companyName ? ` · ${u.companyName}` : ''}</p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button type="button" onClick={() => approveWholesale(u.id)} className="text-xs bg-green-600 text-white px-2.5 py-1.5 rounded-lg font-semibold hover:bg-green-700">Approve</button>
                    <button type="button" onClick={() => rejectWholesale(u.id)} className="text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1.5 rounded-lg font-semibold hover:bg-red-100">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No pending wholesale approvals</div>
          )}
        </QueueCard>

        {/* Failed Payments */}
        <QueueCard title="Failed Payments — Last 24h" href="/payments" linkLabel="View all">
          {loading ? (
            <div className="p-4 space-y-2">{[...Array(2)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : failedPayments.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {failedPayments.map(p => (
                <div key={p.id} className="px-5 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">€{Number(p.amount).toFixed(2)}</p>
                    <p className="text-xs text-gray-400">{p.provider} · {p.order?.orderNumber || p.orderId?.slice(0, 8)} · {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</p>
                  </div>
                  <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded-full flex-shrink-0">failed</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No failed payments in last 24h</div>
          )}
        </QueueCard>

        {/* Expiring Quotes placeholder — links to orders */}
        <QueueCard title="Quotes Expiring Soon (48h)" href="/orders" linkLabel="Manage quotes">
          <div className="px-5 py-4">
            {stats.quotesExpiring > 0 ? (
              <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-lg p-3">
                <span className="text-2xl font-bold text-orange-500">{stats.quotesExpiring}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">quotes expiring within 48 hours</p>
                  <p className="text-xs text-gray-500 mt-0.5">Review and extend or follow up with customers</p>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-gray-400 text-sm">No quotes expiring soon</div>
            )}
          </div>
        </QueueCard>
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Revenue line chart — spans 2 cols */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 text-sm">Revenue — Last 30 Days</h2>
            <div className="flex gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="inline-block w-6 h-0.5 bg-[#1A3C5E]" /> Standard</span>
              <span className="flex items-center gap-1"><span className="inline-block w-6 border-t-2 border-dashed border-[#C8860A]" /> Custom</span>
            </div>
          </div>
          {loading
            ? <div className="h-40 bg-gray-50 rounded animate-pulse" />
            : <LineChart data={revenueSplit} />
          }
        </div>

        {/* Order status donut */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 text-sm mb-3">Order Status Breakdown</h2>
          {loading
            ? <div className="h-36 bg-gray-50 rounded animate-pulse" />
            : <DonutChart segments={donutSegments} />
          }
        </div>

        {/* Top 5 products */}
        <div className="xl:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 text-sm mb-3">Top 5 Products This Month (by Revenue)</h2>
          {loading
            ? <div className="h-24 bg-gray-50 rounded animate-pulse" />
            : <HBarChart items={topProducts} />
          }
        </div>
      </div>
    </div>
  );
}
