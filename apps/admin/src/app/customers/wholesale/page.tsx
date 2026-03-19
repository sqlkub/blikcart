'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { CheckCircle, XCircle, MessageSquare, ExternalLink } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : '';
  return { Authorization: `Bearer ${token}` };
}

export default function WholesaleApprovalsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  // Per-row tier selection (keyed by userId)
  const [tiers, setTiers] = useState<Record<string, string>>({});

  // Reject modal
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Request More Info modal
  const [infoTarget, setInfoTarget] = useState<any>(null);
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/auth/admin/wholesale-pending`, {
        headers: authHeaders(),
        params: { limit: 100 },
      });
      const pending = res.data.data || [];
      setUsers(pending);
      // Init tier map
      const initTiers: Record<string, string> = {};
      pending.forEach((u: any) => { initTiers[u.id] = 'bronze'; });
      setTiers(initTiers);
    } catch { setUsers([]); }
    finally { setLoading(false); }
  }

  async function approve(id: string) {
    setProcessing(id);
    try {
      await axios.patch(`${API}/auth/admin/users/${id}/approve`, { tier: tiers[id] || 'bronze' }, { headers: authHeaders() });
      setUsers(u => u.filter(x => x.id !== id));
    } finally { setProcessing(null); }
  }

  async function confirmReject() {
    if (!rejectTarget) return;
    setProcessing(rejectTarget.id);
    try {
      await axios.patch(`${API}/auth/admin/users/${rejectTarget.id}/reject`,
        { reason: rejectReason || undefined },
        { headers: authHeaders() });
      setUsers(u => u.filter(x => x.id !== rejectTarget.id));
      setRejectTarget(null);
      setRejectReason('');
    } finally { setProcessing(null); }
  }

  async function sendInfoRequest() {
    if (!infoTarget || !infoMessage.trim()) return;
    setProcessing(infoTarget.id);
    try {
      await axios.patch(`${API}/auth/admin/users/${infoTarget.id}/request-info`,
        { message: infoMessage },
        { headers: authHeaders() });
      setInfoTarget(null);
      setInfoMessage('');
    } finally { setProcessing(null); }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">B2B Approvals</h1>
        <p className="text-gray-500 text-sm mt-1">
          {loading ? '…' : `${users.length} pending B2B account${users.length === 1 ? '' : 's'} awaiting review`}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-3">✓</div>
            <p className="text-gray-600 font-semibold">All caught up</p>
            <p className="text-gray-400 text-sm mt-1">No B2B accounts pending approval</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                {['Name / Company', 'Email', 'VAT Number', 'Registered', 'Approve As', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const busy = processing === u.id;
                return (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-900">{u.fullName}</p>
                      {u.companyName && <p className="text-xs text-gray-500 mt-0.5">{u.companyName}</p>}
                      <button type="button" onClick={() => router.push(`/customers/${u.id}`)}
                        className="flex items-center gap-1 text-xs text-[#1A3C5E] hover:underline mt-0.5">
                        <ExternalLink size={11} /> View profile
                      </button>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{u.email}</td>
                    <td className="px-5 py-4 text-xs font-mono text-gray-600">{u.vatNumber || '—'}</td>
                    <td className="px-5 py-4 text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <select
                        value={tiers[u.id] || 'bronze'}
                        onChange={e => setTiers(t => ({ ...t, [u.id]: e.target.value }))}
                        title="B2B tier"
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700">
                        <option value="bronze">Bronze</option>
                        <option value="silver">Silver</option>
                        <option value="gold">Gold</option>
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2 flex-wrap">
                        <button type="button" disabled={busy} onClick={() => approve(u.id)}
                          className="flex items-center gap-1.5 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50">
                          <CheckCircle size={13} /> {busy ? '…' : 'Approve'}
                        </button>
                        <button type="button" disabled={busy} onClick={() => { setRejectTarget(u); setRejectReason(''); }}
                          className="flex items-center gap-1.5 text-xs border border-red-200 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-100 disabled:opacity-50">
                          <XCircle size={13} /> Reject
                        </button>
                        <button type="button" disabled={busy} onClick={() => { setInfoTarget(u); setInfoMessage(''); }}
                          className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50">
                          <MessageSquare size={13} /> More Info
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

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setRejectTarget(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-1">Reject Application</h3>
            <p className="text-sm text-gray-500 mb-4">
              <strong>{rejectTarget.fullName}</strong> ({rejectTarget.email}) will be notified.
            </p>
            <label htmlFor="reject-reason" className="block text-xs font-medium text-gray-700 mb-1">Reason (optional — emailed to buyer)</label>
            <textarea
              id="reject-reason"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={4}
              placeholder="e.g. We could not verify your business registration…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button type="button" onClick={() => setRejectTarget(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button type="button" onClick={confirmReject} disabled={!!processing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                {processing ? 'Rejecting…' : 'Reject Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request More Info Modal */}
      {infoTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setInfoTarget(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-1">Request More Information</h3>
            <p className="text-sm text-gray-500 mb-4">
              An email will be sent to <strong>{infoTarget.email}</strong>.
            </p>
            <label htmlFor="info-msg" className="block text-xs font-medium text-gray-700 mb-1">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="info-msg"
              value={infoMessage}
              onChange={e => setInfoMessage(e.target.value)}
              rows={4}
              placeholder="e.g. Please upload your Chamber of Commerce registration and a recent utility bill to complete your application…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1A3C5E] resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button type="button" onClick={() => setInfoTarget(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button type="button" onClick={sendInfoRequest} disabled={!!processing || !infoMessage.trim()}
                className="flex-1 px-4 py-2 bg-[#1A3C5E] text-white rounded-lg text-sm font-semibold hover:bg-[#16324f] disabled:opacity-50">
                {processing ? 'Sending…' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
