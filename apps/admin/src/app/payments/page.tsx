'use client';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-600',
  refunded: 'bg-gray-100 text-gray-500',
  partially_refunded: 'bg-orange-100 text-orange-700',
};

function Skel({ cols }: { cols: number }) {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="border-b border-gray-50">
          {[...Array(cols)].map((_, j) => (
            <td key={j} className="px-5 py-4">
              <div className="h-4 bg-gray-100 rounded animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ── Transactions Tab ─────────────────────────────────────────────────────────

const TX_STATUSES = ['All', 'pending', 'paid', 'failed', 'refunded', 'partially_refunded'];

function TransactionsTab() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('All');
  const [summary, setSummary] = useState({ total: 0, paid: 0, failed: 0, refunded: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    try {
      const res = await axios.get(`${API}/orders/admin/payments?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: any[] = res.data.data || [];
      setPayments(data);
      setSummary({
        total: data.reduce((s, p) => s + Number(p.amount || 0), 0),
        paid: data.filter(p => p.status === 'paid').length,
        failed: data.filter(p => p.status === 'failed').length,
        refunded: data.filter(p => ['refunded', 'partially_refunded'].includes(p.status)).length,
      });
    } catch { setPayments([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = status === 'All' ? payments : payments.filter(p => p.status === status);

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Volume', value: `€${summary.total.toFixed(2)}`, color: 'text-[#1A3C5E]' },
          { label: 'Paid', value: String(summary.paid), color: 'text-green-600' },
          { label: 'Failed', value: String(summary.failed), color: 'text-red-500' },
          { label: 'Refunded', value: String(summary.refunded), color: 'text-gray-500' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{c.label}</p>
            {loading
              ? <div className="h-8 w-16 bg-gray-100 rounded animate-pulse mt-1" />
              : <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {TX_STATUSES.map(s => (
          <button key={s} type="button" onClick={() => setStatus(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${status === s ? 'bg-[#1A3C5E] text-white border-[#1A3C5E]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
            {s === 'partially_refunded' ? 'Partial Refund' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
              {['Transaction ID', 'Order', 'Customer', 'Amount', 'Method', 'Provider', 'Status', 'Date'].map(h => (
                <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <Skel cols={8} /> : filtered.length > 0 ? filtered.map(p => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-4 text-xs font-mono text-gray-400">{(p.providerPaymentId || p.id).slice(0, 16)}…</td>
                <td className="px-5 py-4 text-xs font-mono text-[#1A3C5E]">#{p.order?.orderNumber || '—'}</td>
                <td className="px-5 py-4 text-sm">
                  <div className="font-medium text-gray-900">{p.order?.user?.fullName || '—'}</div>
                  <div className="text-xs text-gray-400">{p.order?.user?.email}</div>
                </td>
                <td className="px-5 py-4 text-sm font-semibold">€{Number(p.amount).toFixed(2)}</td>
                <td className="px-5 py-4 text-sm text-gray-500">{p.method || '—'}</td>
                <td className="px-5 py-4 text-sm text-gray-500 capitalize">{p.provider}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-500'}`}>{p.status}</span>
                </td>
                <td className="px-5 py-4 text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
              </tr>
            )) : (
              <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-400 text-sm">
                {status === 'All' ? 'No payment transactions yet' : `No ${status} payments`}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Invoices Tab ─────────────────────────────────────────────────────────────

function InvoicesTab() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    try {
      const res = await axios.get(`${API}/orders/admin/invoices?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInvoices(res.data.data || []);
    } catch { setInvoices([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const q = search.toLowerCase();
  const filtered = invoices.filter(inv =>
    !q ||
    inv.invoiceNumber?.toLowerCase().includes(q) ||
    inv.orderNumber?.toLowerCase().includes(q) ||
    inv.customer?.fullName?.toLowerCase().includes(q) ||
    inv.customer?.email?.toLowerCase().includes(q)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">{loading ? '…' : `${invoices.length} invoices`}</p>
        <input
          type="text"
          placeholder="Search invoice / order / customer…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1A3C5E] w-72"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
              {['Invoice #', 'Order #', 'Customer', 'Amount', 'Method', 'Provider', 'Paid At', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <Skel cols={8} /> : filtered.length > 0 ? filtered.map(inv => (
              <tr key={inv.orderId} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-4 text-xs font-mono font-semibold text-[#1A3C5E]">{inv.invoiceNumber}</td>
                <td className="px-5 py-4 text-xs font-mono text-gray-600">#{inv.orderNumber}</td>
                <td className="px-5 py-4 text-sm">
                  <div className="font-medium text-gray-900">{inv.customer?.fullName || '—'}</div>
                  <div className="text-xs text-gray-400">{inv.customer?.email}</div>
                  {inv.customer?.companyName && (
                    <div className="text-xs text-gray-400">{inv.customer.companyName}</div>
                  )}
                </td>
                <td className="px-5 py-4 text-sm font-semibold text-green-700">€{Number(inv.amount).toFixed(2)}</td>
                <td className="px-5 py-4 text-sm text-gray-500">{inv.method || '—'}</td>
                <td className="px-5 py-4 text-sm text-gray-500 capitalize">{inv.provider || '—'}</td>
                <td className="px-5 py-4 text-xs text-gray-500">
                  {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : '—'}
                </td>
                <td className="px-5 py-4">
                  <button
                    type="button"
                    title="Download invoice PDF (coming soon)"
                    onClick={() => alert(`Invoice PDF for ${inv.invoiceNumber} — export coming soon`)}
                    className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    PDF
                  </button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-400 text-sm">
                {search ? 'No invoices match your search' : 'No paid invoices yet'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Refunds Tab ───────────────────────────────────────────────────────────────

function RefundsTab() {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [paidPayments, setPaidPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundModal, setRefundModal] = useState<{ payment: any } | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refunding, setRefunding] = useState(false);
  const [refundError, setRefundError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    try {
      const [refundsRes, paymentsRes] = await Promise.all([
        axios.get(`${API}/orders/admin/refunds?limit=100`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/orders/admin/payments?limit=100`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setRefunds(refundsRes.data.data || []);
      const allPayments: any[] = paymentsRes.data.data || [];
      setPaidPayments(allPayments.filter(p => p.status === 'paid' || p.status === 'partially_refunded'));
    } catch { setRefunds([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submitRefund() {
    if (!refundModal) return;
    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0) { setRefundError('Enter a valid amount'); return; }
    const maxRefund = Number(refundModal.payment.amount) - Number(refundModal.payment.refundedAmount || 0);
    if (amount > maxRefund) { setRefundError(`Max refundable: €${maxRefund.toFixed(2)}`); return; }

    setRefunding(true);
    setRefundError('');
    const token = localStorage.getItem('adminToken');
    try {
      await axios.post(`${API}/orders/admin/payments/${refundModal.payment.id}/refund`, { amount }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRefundModal(null);
      setRefundAmount('');
      load();
    } catch (e: any) {
      setRefundError(e.response?.data?.message || 'Refund failed');
    } finally { setRefunding(false); }
  }

  const totalRefunded = refunds.reduce((s, r) => s + Number(r.refundedAmount || 0), 0);

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Refunded', value: `€${totalRefunded.toFixed(2)}`, color: 'text-gray-700' },
          { label: 'Refund Records', value: String(refunds.length), color: 'text-[#1A3C5E]' },
          { label: 'Eligible for Refund', value: String(paidPayments.length), color: 'text-orange-600' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{c.label}</p>
            {loading
              ? <div className="h-8 w-16 bg-gray-100 rounded animate-pulse mt-1" />
              : <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>}
          </div>
        ))}
      </div>

      {/* Initiate Refund section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">Initiate Refund</h3>
          <p className="text-xs text-gray-400 mt-0.5">Paid transactions eligible for full or partial refund</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                {['Transaction', 'Order', 'Customer', 'Paid', 'Already Refunded', 'Remaining', 'Action'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <Skel cols={7} /> : paidPayments.length > 0 ? paidPayments.map(p => {
                const refundedAmt = Number(p.refundedAmount || 0);
                const remaining = Number(p.amount) - refundedAmt;
                return (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-4 text-xs font-mono text-gray-400">{(p.providerPaymentId || p.id).slice(0, 14)}…</td>
                    <td className="px-5 py-4 text-xs font-mono text-[#1A3C5E]">#{p.order?.orderNumber || '—'}</td>
                    <td className="px-5 py-4 text-sm">
                      <div className="font-medium text-gray-900">{p.order?.user?.fullName || '—'}</div>
                      <div className="text-xs text-gray-400">{p.order?.user?.email}</div>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold">€{Number(p.amount).toFixed(2)}</td>
                    <td className="px-5 py-4 text-sm text-orange-600">
                      {refundedAmt > 0 ? `€${refundedAmt.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-green-700">€{remaining.toFixed(2)}</td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        title="Initiate refund"
                        onClick={() => { setRefundModal({ payment: p }); setRefundAmount(''); setRefundError(''); }}
                        className="text-xs px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100"
                      >
                        Refund
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400 text-sm">No paid transactions eligible for refund</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refund history */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">Refund History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                {['Transaction ID', 'Order', 'Customer', 'Original', 'Refunded', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <Skel cols={7} /> : refunds.length > 0 ? refunds.map(r => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-4 text-xs font-mono text-gray-400">{(r.providerPaymentId || r.id).slice(0, 16)}…</td>
                  <td className="px-5 py-4 text-xs font-mono text-[#1A3C5E]">#{r.order?.orderNumber || '—'}</td>
                  <td className="px-5 py-4 text-sm">
                    <div className="font-medium text-gray-900">{r.order?.user?.fullName || '—'}</div>
                    <div className="text-xs text-gray-400">{r.order?.user?.email}</div>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold">€{Number(r.amount).toFixed(2)}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-orange-600">€{Number(r.refundedAmount || 0).toFixed(2)}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-500'}`}>{r.status}</span>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400 text-sm">No refunds processed yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refund modal */}
      {refundModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-bold text-gray-900 mb-1">Initiate Refund</h3>
            <p className="text-xs text-gray-400 mb-5">Order #{refundModal.payment.order?.orderNumber}</p>

            <div className="space-y-3 mb-5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Customer</span>
                <span className="font-medium">{refundModal.payment.order?.user?.fullName || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Original amount</span>
                <span className="font-semibold">€{Number(refundModal.payment.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Already refunded</span>
                <span className="text-orange-600">€{Number(refundModal.payment.refundedAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-gray-500">Max refundable</span>
                <span className="font-bold text-green-700">
                  €{(Number(refundModal.payment.amount) - Number(refundModal.payment.refundedAmount || 0)).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Refund Amount (€)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={refundAmount}
                onChange={e => { setRefundAmount(e.target.value); setRefundError(''); }}
                placeholder="0.00"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1A3C5E]"
              />
              {refundError && <p className="text-red-500 text-xs mt-1">{refundError}</p>}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRefundModal(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRefund}
                disabled={refunding}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {refunding ? 'Processing…' : 'Process Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

const TABS = ['Transactions', 'Invoices', 'Refunds'] as const;
type Tab = typeof TABS[number];

export default function PaymentsPage() {
  const [tab, setTab] = useState<Tab>('Transactions');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500 text-sm mt-1">Transactions, invoices and refund management</p>
      </div>

      <div className="flex gap-1 mb-8 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t ? 'bg-white text-[#1A3C5E] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Transactions' && <TransactionsTab />}
      {tab === 'Invoices' && <InvoicesTab />}
      {tab === 'Refunds' && <RefundsTab />}
    </div>
  );
}
