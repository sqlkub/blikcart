'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { CheckCircle, XCircle, MessageSquare } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : '';
  return { Authorization: `Bearer ${token}` };
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_production: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
  submitted: 'bg-orange-100 text-orange-700',
  quoted: 'bg-cyan-100 text-cyan-700',
  approved: 'bg-teal-100 text-teal-700',
  draft: 'bg-gray-100 text-gray-500',
};

type Tab = 'profile' | 'orders' | 'addresses' | 'custom' | 'notes';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('profile');
  const [working, setWorking] = useState(false);
  const [selectedTier, setSelectedTier] = useState('bronze');

  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Request More Info modal
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

  // Admin notes
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    axios.get(`${API}/auth/users/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { setUser(r.data); setAdminNotes(r.data.adminNotes || ''); })
      .catch(() => router.push('/customers'))
      .finally(() => setLoading(false));
  }, [id]);

  async function approve() {
    setWorking(true);
    try {
      await axios.patch(`${API}/auth/admin/users/${id}/approve`, { tier: selectedTier }, { headers: authHeaders() });
      setUser((u: any) => ({ ...u, isApproved: true, wholesaleTier: selectedTier }));
    } finally { setWorking(false); }
  }

  async function reject() {
    setWorking(true);
    try {
      await axios.patch(`${API}/auth/admin/users/${id}/reject`, { reason: rejectReason || undefined }, { headers: authHeaders() });
      setUser((u: any) => ({ ...u, isApproved: false, accountType: 'retail' }));
      setShowRejectModal(false);
      setRejectReason('');
    } finally { setWorking(false); }
  }

  async function saveNotes() {
    setSavingNotes(true);
    try {
      await axios.patch(`${API}/auth/admin/users/${id}/notes`, { notes: adminNotes }, { headers: authHeaders() });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } finally { setSavingNotes(false); }
  }

  async function requestInfo() {
    if (!infoMessage.trim()) return;
    setWorking(true);
    try {
      await axios.patch(`${API}/auth/admin/users/${id}/request-info`, { message: infoMessage }, { headers: authHeaders() });
      setShowInfoModal(false);
      setInfoMessage('');
    } finally { setWorking(false); }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;
  if (!user) return null;

  const totalSpend = user.orders.reduce((s: number, o: any) => s + Number(o.total || 0), 0);
  const isPendingWholesale = user.accountType === 'wholesale' && !user.isApproved;

  return (
    <div>
      {/* Back */}
      <div className="mb-6">
        <Link href="/customers" className="text-gray-400 hover:text-gray-700 text-sm">← Customers</Link>
      </div>

      {/* Hero card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 flex items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#1A3C5E] flex items-center justify-center text-white font-bold text-xl shrink-0">
            {user.fullName?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user.fullName}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${user.accountType === 'wholesale' ? 'bg-blue-100 text-blue-700' : user.accountType === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                {user.accountType}
              </span>
              {user.wholesaleTier && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">{user.wholesaleTier}</span>}
              {isPendingWholesale && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">pending approval</span>}
            </div>
          </div>
        </div>

        <div className="flex gap-6 text-center shrink-0">
          <div><p className="text-2xl font-bold text-[#1A3C5E]">{user._count.orders}</p><p className="text-xs text-gray-400">Orders</p></div>
          <div><p className="text-2xl font-bold text-green-600">€{totalSpend.toFixed(2)}</p><p className="text-xs text-gray-400">Total Spend</p></div>
          <div><p className="text-2xl font-bold text-amber-600">{user._count.customOrders}</p><p className="text-xs text-gray-400">Custom Orders</p></div>
        </div>
      </div>

      {/* Wholesale approval banner */}
      {isPendingWholesale && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mb-6">
          <p className="text-sm font-semibold text-orange-800 mb-3">Wholesale Application Pending Review</p>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="tier-select" className="text-xs text-gray-600 font-medium">Approve as:</label>
              <select id="tier-select" value={selectedTier} onChange={e => setSelectedTier(e.target.value)}
                title="Wholesale tier"
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
              </select>
              <button type="button" onClick={approve} disabled={working}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50">
                <CheckCircle size={14} /> Approve
              </button>
            </div>
            <button type="button" onClick={() => setShowRejectModal(true)} disabled={working}
              className="flex items-center gap-1.5 px-4 py-1.5 border border-red-200 text-red-600 bg-red-50 text-xs font-semibold rounded-lg hover:bg-red-100 disabled:opacity-50">
              <XCircle size={14} /> Reject
            </button>
            <button type="button" onClick={() => setShowInfoModal(true)} disabled={working}
              className="flex items-center gap-1.5 px-4 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50">
              <MessageSquare size={14} /> Request More Info
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {(['profile', 'orders', 'addresses', 'custom', 'notes'] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'custom' ? 'Custom Orders' : t === 'notes' ? 'Admin Notes' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Profile Information</h2>
          <div className="grid grid-cols-2 gap-4">
            {([
              ['Full Name', user.fullName],
              ['Email', user.email],
              ['Phone', user.phone || '—'],
              ['Company', user.companyName || '—'],
              ['VAT Number', user.vatNumber || '—'],
              ['Account Type', user.accountType],
              ['Wholesale Tier', user.wholesaleTier || '—'],
              ['Approved', user.isApproved ? 'Yes' : 'No'],
              ['Locale', user.locale],
              ['Currency', user.currency],
              ['Registered', new Date(user.createdAt).toLocaleDateString()],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} className="py-3 border-b border-gray-50">
                <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Order History</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                {['Order #', 'Items', 'Total', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {user.orders.length > 0 ? user.orders.map((o: any) => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-4 text-xs font-mono text-[#1A3C5E]">#{o.orderNumber}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{o.items.reduce((s: number, i: any) => s + i.quantity, 0)} items</td>
                  <td className="px-5 py-4 text-sm font-semibold">€{Number(o.total).toFixed(2)}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-500'}`}>{o.status}</span>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500">{new Date(o.placedAt).toLocaleDateString()}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Addresses Tab */}
      {tab === 'addresses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user.addresses.length > 0 ? user.addresses.map((a: any) => (
            <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{a.type}</span>
                {a.isDefault && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Default</span>}
              </div>
              <p className="font-semibold text-gray-900">{a.fullName}</p>
              <p className="text-sm text-gray-500 mt-1">{a.streetLine1}{a.streetLine2 ? `, ${a.streetLine2}` : ''}</p>
              <p className="text-sm text-gray-500">{a.postalCode} {a.city}, {a.countryCode}</p>
            </div>
          )) : (
            <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">No saved addresses</div>
          )}
        </div>
      )}

      {/* Custom Orders Tab */}
      {tab === 'custom' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Custom Orders</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                {['ID', 'Product', 'Qty', 'Est. Price', 'Status', 'Submitted'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {user.customOrders.length > 0 ? user.customOrders.map((o: any) => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-4 text-xs font-mono text-[#1A3C5E]">
                    <Link href={`/custom-orders/${o.id}`} className="hover:underline" onClick={e => e.stopPropagation()}>
                      CO-{o.id.slice(0, 8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-sm">{o.product?.name}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{o.quantity}</td>
                  <td className="px-5 py-4 text-sm">{o.estimatedPriceMin ? `€${o.estimatedPriceMin}–€${o.estimatedPriceMax}` : '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-500'}`}>{o.status}</span>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500">{o.submittedAt ? new Date(o.submittedAt).toLocaleDateString() : '—'}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400 text-sm">No custom orders</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Admin Notes Tab */}
      {tab === 'notes' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-1">Internal Admin Notes</h2>
          <p className="text-sm text-gray-400 mb-4">These notes are only visible to the admin team and are never shown to the customer.</p>
          <label htmlFor="admin-notes" className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Notes</label>
          <textarea
            id="admin-notes"
            value={adminNotes}
            onChange={e => setAdminNotes(e.target.value)}
            rows={8}
            placeholder="Add internal notes about this customer — e.g. preferred carrier, special pricing agreements, account flags…"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A3C5E] resize-none"
          />
          <div className="flex items-center gap-3 mt-3">
            <button type="button" onClick={saveNotes} disabled={savingNotes}
              className="px-5 py-2.5 bg-[#1A3C5E] text-white text-sm font-semibold rounded-lg hover:bg-[#15304e] disabled:opacity-50">
              {savingNotes ? 'Saving…' : 'Save Notes'}
            </button>
            {notesSaved && <span className="text-sm text-green-600 font-medium">✓ Saved</span>}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowRejectModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-2">Reject Wholesale Application</h3>
            <p className="text-sm text-gray-500 mb-4">The buyer will be notified with the reason (if provided).</p>
            <label htmlFor="reject-reason" className="block text-xs font-medium text-gray-700 mb-1">Reason (optional)</label>
            <textarea id="reject-reason" value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              rows={4} placeholder="e.g. Incomplete business documentation…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 resize-none" />
            <div className="flex gap-3 mt-4">
              <button type="button" onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button type="button" onClick={reject} disabled={working}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                {working ? 'Rejecting…' : 'Reject Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request More Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowInfoModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-2">Request More Information</h3>
            <p className="text-sm text-gray-500 mb-4">An email will be sent to <strong>{user.email}</strong> with your message.</p>
            <label htmlFor="info-message" className="block text-xs font-medium text-gray-700 mb-1">Message <span className="text-red-500">*</span></label>
            <textarea id="info-message" value={infoMessage} onChange={e => setInfoMessage(e.target.value)}
              rows={4} placeholder="e.g. Please upload your Chamber of Commerce registration and a recent utility bill…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1A3C5E] resize-none" />
            <div className="flex gap-3 mt-4">
              <button type="button" onClick={() => setShowInfoModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button type="button" onClick={requestInfo} disabled={working || !infoMessage.trim()}
                className="flex-1 px-4 py-2 bg-[#1A3C5E] text-white rounded-lg text-sm font-semibold hover:bg-[#16324f] disabled:opacity-50">
                {working ? 'Sending…' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
