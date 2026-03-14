'use client';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Truck, Search, Package, MapPin, ExternalLink, Edit2, X, Check } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : '';
  return { Authorization: `Bearer ${token}` };
}

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  shipped:   'bg-blue-100 text-blue-700',
  in_transit:'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  failed:    'bg-red-100 text-red-600',
};

type EditForm = {
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
  status: string;
  estimatedDelivery: string;
  shippedAt: string;
  deliveredAt: string;
};

export default function ShippingPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  // Add shipment modal
  const [showAdd, setShowAdd] = useState(false);
  const [addOrderNum, setAddOrderNum] = useState('');
  const [addOrderId, setAddOrderId] = useState('');
  const [addForm, setAddForm] = useState({ carrier: '', trackingNumber: '', trackingUrl: '', estimatedDelivery: '' });
  const [saving, setSaving] = useState(false);
  const [orderSearchLoading, setOrderSearchLoading] = useState(false);

  // Edit shipment
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ carrier: '', trackingNumber: '', trackingUrl: '', status: '', estimatedDelivery: '', shippedAt: '', deliveredAt: '' });
  const [editSaving, setEditSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/orders/admin/shipments`, {
        params: { page, limit: 20, search: search || undefined },
        headers: authHeaders(),
      });
      setShipments(res.data.data || []);
      setMeta(res.data.meta || { total: 0, page: 1, limit: 20 });
    } catch { /* silent */ } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  async function searchOrder() {
    if (!addOrderNum.trim()) return;
    setOrderSearchLoading(true);
    try {
      const res = await axios.get(`${API}/orders/admin/orders`, {
        params: { limit: 50 },
        headers: authHeaders(),
      });
      const found = (res.data.data || []).find((o: any) => o.orderNumber === addOrderNum.trim());
      if (found) setAddOrderId(found.id);
      else alert('Order not found. Check the order number.');
    } catch { /* silent */ } finally { setOrderSearchLoading(false); }
  }

  async function createShipment() {
    if (!addOrderId) return;
    setSaving(true);
    try {
      await axios.post(`${API}/orders/admin/orders/${addOrderId}/shipments`, addForm, { headers: authHeaders() });
      setShowAdd(false);
      setAddOrderNum('');
      setAddOrderId('');
      setAddForm({ carrier: '', trackingNumber: '', trackingUrl: '', estimatedDelivery: '' });
      await load();
    } catch { /* silent */ } finally { setSaving(false); }
  }

  function startEdit(s: any) {
    setEditId(s.id);
    setEditForm({
      carrier: s.carrier || '',
      trackingNumber: s.trackingNumber || '',
      trackingUrl: s.trackingUrl || '',
      status: s.status || 'pending',
      estimatedDelivery: s.estimatedDelivery ? s.estimatedDelivery.slice(0, 10) : '',
      shippedAt: s.shippedAt ? s.shippedAt.slice(0, 10) : '',
      deliveredAt: s.deliveredAt ? s.deliveredAt.slice(0, 10) : '',
    });
  }

  async function saveEdit() {
    if (!editId) return;
    setEditSaving(true);
    try {
      await axios.patch(`${API}/orders/admin/shipments/${editId}`, editForm, { headers: authHeaders() });
      setEditId(null);
      await load();
    } catch { /* silent */ } finally { setEditSaving(false); }
  }

  const totalPages = Math.ceil(meta.total / meta.limit) || 1;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and manage shipments</p>
        </div>
        <button type="button" onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[#C8860A] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-700">
          <Truck size={14} /> Add Shipment
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by tracking number, order number, or customer…"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-[#1A3C5E] text-white text-sm font-semibold rounded-lg hover:bg-[#15304e]">Search</button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
              className="px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">Clear</button>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b border-gray-100 bg-gray-50">
              {['Order', 'Customer', 'Carrier / Tracking', 'Status', 'Ship Date', 'Est. Delivery', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(7)].map((__, j) => (
                    <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : shipments.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-gray-400">
                  <Truck size={32} className="mx-auto mb-2 text-gray-200" />
                  No shipments found
                </td>
              </tr>
            ) : shipments.map(s => (
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="text-xs font-mono text-[#1A3C5E] font-semibold">#{s.order?.orderNumber}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">{s.order?.user?.fullName}</p>
                  <p className="text-xs text-gray-400">{s.order?.user?.email}</p>
                  {s.order?.shippingAddress && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} /> {s.order.shippingAddress.city}, {s.order.shippingAddress.countryCode}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editId === s.id ? (
                    <div className="space-y-1">
                      <input value={editForm.carrier} onChange={e => setEditForm(f => ({ ...f, carrier: e.target.value }))}
                        placeholder="Carrier" className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#1A3C5E]" />
                      <input value={editForm.trackingNumber} onChange={e => setEditForm(f => ({ ...f, trackingNumber: e.target.value }))}
                        placeholder="Tracking #" className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#1A3C5E]" />
                      <input value={editForm.trackingUrl} onChange={e => setEditForm(f => ({ ...f, trackingUrl: e.target.value }))}
                        placeholder="Tracking URL" className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#1A3C5E]" />
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.carrier || <span className="text-gray-300">—</span>}</p>
                      {s.trackingNumber ? (
                        <div className="flex items-center gap-1">
                          <p className="text-xs text-gray-500 font-mono">{s.trackingNumber}</p>
                          {s.trackingUrl && (
                            <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer" title="Track package">
                              <ExternalLink size={10} className="text-[#1A3C5E] hover:text-[#C8860A]" />
                            </a>
                          )}
                        </div>
                      ) : <p className="text-xs text-gray-300">No tracking</p>}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editId === s.id ? (
                    <select title="Shipment status" value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                      className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#1A3C5E]">
                      {['pending','shipped','in_transit','delivered','failed'].map(st => (
                        <option key={st} value={st}>{st.replace('_', ' ')}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-500'}`}>
                      {s.status?.replace('_', ' ')}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {editId === s.id ? (
                    <input type="date" value={editForm.shippedAt} onChange={e => setEditForm(f => ({ ...f, shippedAt: e.target.value }))}
                      className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#1A3C5E]" />
                  ) : (
                    s.shippedAt ? new Date(s.shippedAt).toLocaleDateString('nl-NL') : '—'
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {editId === s.id ? (
                    <input type="date" value={editForm.estimatedDelivery} onChange={e => setEditForm(f => ({ ...f, estimatedDelivery: e.target.value }))}
                      className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#1A3C5E]" />
                  ) : (
                    s.estimatedDelivery ? new Date(s.estimatedDelivery).toLocaleDateString('nl-NL') : '—'
                  )}
                </td>
                <td className="px-4 py-3">
                  {editId === s.id ? (
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={saveEdit} disabled={editSaving} title="Save"
                        className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
                        <Check size={12} />
                      </button>
                      <button type="button" onClick={() => setEditId(null)} title="Cancel"
                        className="p-1.5 bg-gray-100 text-gray-500 rounded hover:bg-gray-200">
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => startEdit(s)} title="Edit shipment"
                      className="p-1.5 text-gray-400 hover:text-[#1A3C5E] hover:bg-gray-100 rounded">
                      <Edit2 size={13} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {meta.total > meta.limit && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>Showing {((page - 1) * meta.limit) + 1}–{Math.min(page * meta.limit, meta.total)} of {meta.total}</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs hover:bg-gray-50 disabled:opacity-40">Prev</button>
              <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs hover:bg-gray-50 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Add Shipment Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Add Shipment</h3>
              <button type="button" onClick={() => setShowAdd(false)} title="Close" className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="add-order-num" className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Order Number</label>
                <div className="flex gap-2">
                  <input id="add-order-num" value={addOrderNum} onChange={e => setAddOrderNum(e.target.value)}
                    placeholder="e.g. BK-20240001"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1A3C5E]" />
                  <button type="button" onClick={searchOrder} disabled={orderSearchLoading}
                    className="px-3 py-2 bg-[#1A3C5E] text-white text-sm rounded-lg hover:bg-[#15304e] disabled:opacity-50">
                    {orderSearchLoading ? '…' : 'Find'}
                  </button>
                </div>
                {addOrderId && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><Check size={11} /> Order found</p>
                )}
              </div>
              <div>
                <label htmlFor="add-carrier" className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Carrier</label>
                <input id="add-carrier" value={addForm.carrier} onChange={e => setAddForm(f => ({ ...f, carrier: e.target.value }))}
                  placeholder="DHL, PostNL, FedEx…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1A3C5E]" />
              </div>
              <div>
                <label htmlFor="add-tracking" className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Tracking Number</label>
                <input id="add-tracking" value={addForm.trackingNumber} onChange={e => setAddForm(f => ({ ...f, trackingNumber: e.target.value }))}
                  placeholder="1Z9999999999999999"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1A3C5E]" />
              </div>
              <div>
                <label htmlFor="add-url" className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Tracking URL</label>
                <input id="add-url" value={addForm.trackingUrl} onChange={e => setAddForm(f => ({ ...f, trackingUrl: e.target.value }))}
                  placeholder="https://track.dhl.com/…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1A3C5E]" />
              </div>
              <div>
                <label htmlFor="add-est" className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Estimated Delivery</label>
                <input id="add-est" type="date" value={addForm.estimatedDelivery} onChange={e => setAddForm(f => ({ ...f, estimatedDelivery: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1A3C5E]" />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button type="button" onClick={() => setShowAdd(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={createShipment} disabled={!addOrderId || saving}
                className="flex-1 bg-[#C8860A] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2">
                <Package size={13} /> {saving ? 'Creating…' : 'Create Shipment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
