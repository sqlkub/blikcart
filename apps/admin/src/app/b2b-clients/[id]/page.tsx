'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, ShoppingBag, FlaskConical, MessageSquare, Package, ExternalLink } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

const STATUS_COLORS: Record<string, string> = {
  draft:         'bg-gray-100 text-gray-600',
  submitted:     'bg-blue-100 text-blue-700',
  quoted:        'bg-yellow-100 text-yellow-700',
  approved:      'bg-green-100 text-green-700',
  in_production: 'bg-purple-100 text-purple-700',
  shipped:       'bg-indigo-100 text-indigo-700',
  cancelled:     'bg-red-100 text-red-700',
};

const SAMPLE_STATUS_COLORS: Record<string, string> = {
  requested:          'bg-blue-100 text-blue-700',
  in_review:          'bg-yellow-100 text-yellow-700',
  sample_sent:        'bg-purple-100 text-purple-700',
  approved:           'bg-green-100 text-green-700',
  rejected:           'bg-red-100 text-red-700',
  revision_requested: 'bg-orange-100 text-orange-700',
};

function token() { return typeof window !== 'undefined' ? localStorage.getItem('adminToken') || '' : ''; }
function authHeaders() { return { Authorization: `Bearer ${token()}` }; }

export default function B2BClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [samples, setSamples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'orders' | 'samples'>('orders');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [usersRes, ordersRes, samplesRes] = await Promise.all([
          fetch(`${API}/auth/users?limit=200`, { headers: authHeaders() }).then(r => r.json()),
          fetch(`${API}/orders/admin/custom-orders?userId=${id}&limit=50`, { headers: authHeaders() }).then(r => r.json()).catch(() => ({ data: [] })),
          fetch(`${API}/samples/admin/all?userId=${id}&limit=50`, { headers: authHeaders() }).then(r => r.json()).catch(() => ({ data: [] })),
        ]);
        const found = (usersRes.data || []).find((u: any) => u.id === id);
        setClient(found || null);
        setOrders(ordersRes.data || []);
        setSamples(samplesRes.data || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center py-24 text-gray-400">Loading…</div>;
  if (!client) return <div className="text-red-500 text-center py-12">Client not found</div>;

  const tierColors: Record<string, string> = {
    bronze: 'bg-orange-100 text-orange-700',
    silver: 'bg-gray-200 text-gray-700',
    gold:   'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="max-w-5xl">
      <Link href="/b2b-clients" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to B2B Clients
      </Link>

      {/* Client header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 flex items-center gap-5">
        <div className="w-14 h-14 rounded-xl bg-[#1A3C5E] text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
          {(client.companyName || client.fullName || '?').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">{client.companyName || client.fullName}</h1>
            {client.wholesaleTier && (
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${tierColors[client.wholesaleTier] || ''}`}>
                {client.wholesaleTier}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{client.email} {client.phone && `· ${client.phone}`}</p>
          {client.vatNumber && <p className="text-xs text-gray-400 mt-0.5">VAT: {client.vatNumber}</p>}
        </div>
        <div className="flex gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            <p className="text-xs text-gray-500">Orders</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{samples.length}</p>
            <p className="text-xs text-gray-500">Samples</p>
          </div>
        </div>
        <Link href={`/customers/${id}`}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline ml-4">
          <ExternalLink className="w-4 h-4" /> Full Profile
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-fit">
        {([['orders', 'Custom Orders', ShoppingBag], ['samples', 'Sample Requests', FlaskConical]] as const).map(([key, label, Icon]) => (
          <button key={key} type="button" onClick={() => setTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <Icon className="w-4 h-4" />
            {label}
            <span className={`text-xs rounded-full px-1.5 py-0.5 ${tab === key ? 'bg-[#1A3C5E] text-white' : 'bg-gray-200 text-gray-600'}`}>
              {key === 'orders' ? orders.length : samples.length}
            </span>
          </button>
        ))}
      </div>

      {/* Orders tab */}
      {tab === 'orders' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2 text-gray-400">
              <ShoppingBag className="w-7 h-7 opacity-30" />
              <p className="text-sm">No custom orders yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Unit Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="w-10 px-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{o.product?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{o.quantity}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>
                        {o.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {o.confirmedUnitPrice ? `€${Number(o.confirmedUnitPrice).toFixed(2)}` : <span className="text-gray-400">TBD</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(o.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-2 py-3">
                      <Link href={`/custom-orders/${o.id}`} className="text-gray-400 hover:text-blue-600 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Samples tab */}
      {tab === 'samples' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {samples.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2 text-gray-400">
              <FlaskConical className="w-7 h-7 opacity-30" />
              <p className="text-sm">No sample requests yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ver.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="w-10 px-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {samples.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{s.productName}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">V{s.version}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${SAMPLE_STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-600'}`}>
                        {s.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {s.samplingFee ? `€${Number(s.samplingFee).toFixed(2)}` : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(s.requestedAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-2 py-3">
                      <Link href={`/samples/${s.id}`} className="text-gray-400 hover:text-blue-600 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
