'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft, FileText, MessageSquare, Settings, Package, Send, Clock, User, Building2, Calendar, Hash, ExternalLink, ChevronRight, CreditCard } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

// ─── Status helpers ─────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  draft:         { bg: 'bg-gray-100',   text: 'text-gray-600',   border: 'border-gray-200',   dot: 'bg-gray-400' },
  submitted:     { bg: 'bg-yellow-50',  text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-400' },
  quoted:        { bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-400' },
  approved:      { bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-500' },
  in_production: { bg: 'bg-purple-50',  text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  shipped:       { bg: 'bg-indigo-50',  text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  cancelled:     { bg: 'bg-red-50',     text: 'text-red-600',    border: 'border-red-200',    dot: 'bg-red-400' },
};

const STATUS_FLOW = ['submitted', 'quoted', 'approved', 'in_production', 'shipped'];

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// ─── Quote Preview Modal ─────────────────────────────────────────────────────

function QuotePreview({ order, form, onClose, onSend, sending }: {
  order: any;
  form: { unitPrice: string; leadTimeDays: string; message: string; validDays: string };
  onClose: () => void;
  onSend: () => void;
  sending: boolean;
}) {
  const unitPrice = parseFloat(form.unitPrice) || 0;
  const total = unitPrice * (order.quantity || 1);
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + (parseInt(form.validDays) || 14));
  const isRevision = !!order.quote;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Quote Preview</h3>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg">
              Close
            </button>
            <button type="button" onClick={onSend} disabled={sending} className="text-sm bg-[#C8860A] text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50 flex items-center gap-1.5">
              <Send size={13} />
              {sending ? 'Sending…' : isRevision ? 'Send Revision' : 'Send Quote'}
            </button>
          </div>
        </div>

        {/* Quote document */}
        <div className="p-8 font-[system-ui]">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-2xl font-black text-[#1A3C5E] tracking-tight">BLIKCART</p>
              <p className="text-xs text-gray-400 mt-0.5">Custom Order Quote</p>
            </div>
            <div className="text-right text-sm text-gray-600">
              <p className="font-bold text-gray-900 text-base">
                {isRevision ? `Revision #${(order.quote?.revisions?.length ?? 0) + 1}` : 'Quote'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="text-xs text-gray-400 mt-0.5">Valid until: <strong>{validUntil.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-0.5 bg-[#1A3C5E]/10 mb-6" />

          {/* Buyer + Order ref */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Prepared for</p>
              <p className="font-semibold text-gray-900">{order.user?.fullName}</p>
              {order.user?.companyName && <p className="text-sm text-gray-600">{order.user.companyName}</p>}
              <p className="text-sm text-gray-500">{order.user?.email}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Order Reference</p>
              <p className="font-mono text-sm text-[#1A3C5E] font-semibold">CO-{order.id?.slice(0, 8).toUpperCase()}</p>
              {order.internalRef && <p className="text-xs text-gray-400 mt-0.5">Internal: {order.internalRef}</p>}
              <p className="text-sm text-gray-600 mt-1">{order.product?.name}</p>
            </div>
          </div>

          {/* Line items table */}
          <table className="w-full mb-6 text-sm">
            <thead>
              <tr className="bg-[#1A3C5E] text-white text-xs">
                <th className="px-4 py-3 text-left font-semibold rounded-tl-lg">Description</th>
                <th className="px-4 py-3 text-right font-semibold">Qty</th>
                <th className="px-4 py-3 text-right font-semibold">Unit Price</th>
                <th className="px-4 py-3 text-right font-semibold rounded-tr-lg">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{order.product?.name}</p>
                  <p className="text-xs text-gray-400">Custom production · Lead time {form.leadTimeDays} business days</p>
                </td>
                <td className="px-4 py-3 text-right text-gray-700">{order.quantity}</td>
                <td className="px-4 py-3 text-right text-gray-700">€{unitPrice.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">€{total.toFixed(2)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-700">Total (excl. VAT)</td>
                <td className="px-4 py-3 text-right font-bold text-[#C8860A] text-base">€{total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Lead time callout */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
            <Clock size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-blue-700">Estimated lead time: {form.leadTimeDays} business days</p>
              <p className="text-blue-600 text-xs mt-0.5">Production begins upon receipt of payment and approved artwork.</p>
            </div>
          </div>

          {/* Message */}
          {form.message && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Note from our team</p>
              <p className="text-sm text-gray-700">{form.message}</p>
            </div>
          )}

          {/* Actions callout */}
          <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500">
            <p className="font-semibold text-gray-700 mb-1">Your next steps</p>
            <p>You will receive this quote by email with three options: <strong>Accept</strong> (generates payment link), <strong>Request Revision</strong>, or <strong>Decline</strong>.</p>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">
            BLIKCART B.V. · Amsterdam, NL · info@blikcart.com
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'overview',       label: 'Overview',       icon: Package },
  { key: 'configuration',  label: 'Configuration',  icon: Settings },
  { key: 'files',          label: 'Files',          icon: FileText },
  { key: 'quote',          label: 'Quote',          icon: ChevronRight },
  { key: 'messages',       label: 'Messages',       icon: MessageSquare },
  { key: 'timeline',       label: 'Timeline',       icon: Clock },
  { key: 'buyer',          label: 'Buyer Info',     icon: User },
] as const;
type TabKey = typeof TABS[number]['key'];

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function CustomOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('overview');

  // Overview tab state
  const [internalRef, setInternalRef] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [savingMeta, setSavingMeta] = useState(false);
  const [statusOverride, setStatusOverride] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  // Quote tab state
  const [quoteForm, setQuoteForm] = useState({ unitPrice: '', leadTimeDays: '21', message: '', validDays: '14' });
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [quoteSent, setQuoteSent] = useState(false);

  // Messages tab state
  const [msgBody, setMsgBody] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const token = () => localStorage.getItem('adminToken') || '';
  const headers = () => ({ Authorization: `Bearer ${token()}` });

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/quotes/custom-orders/${id}`, { headers: headers() });
      const data = res.data;
      setOrder(data);
      setInternalRef(data.internalRef || '');
      setInternalNotes(data.notes || '');
      setStatusOverride(data.status);
      if (data.quote?.unitPrice) {
        setQuoteForm(f => ({ ...f, unitPrice: String(Number(data.quote.unitPrice)), leadTimeDays: String(data.quote.leadTimeDays || 21) }));
      } else if (data.estimatedPriceMin) {
        setQuoteForm(f => ({ ...f, unitPrice: String(data.estimatedPriceMin) }));
      }
    } catch { /* silently */ } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (tab === 'messages') {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [tab, order?.messages]);

  async function saveMetadata() {
    setSavingMeta(true);
    try {
      await axios.patch(`${API}/quotes/admin/custom-orders/${id}`, { internalRef, notes: internalNotes }, { headers: headers() });
      setOrder((o: any) => ({ ...o, internalRef, notes: internalNotes }));
    } catch { } finally { setSavingMeta(false); }
  }

  async function saveStatus() {
    setSavingStatus(true);
    try {
      await axios.patch(`${API}/quotes/admin/custom-orders/${id}/status`, { status: statusOverride }, { headers: headers() });
      setOrder((o: any) => ({ ...o, status: statusOverride }));
    } catch { } finally { setSavingStatus(false); }
  }

  async function sendQuote() {
    setSending(true);
    try {
      await axios.post(`${API}/quotes/send`, {
        customOrderId: id,
        unitPrice: parseFloat(quoteForm.unitPrice),
        leadTimeDays: parseInt(quoteForm.leadTimeDays),
        message: quoteForm.message,
        validDays: parseInt(quoteForm.validDays),
      }, { headers: headers() });
      setQuoteSent(true);
      setShowPreview(false);
      await load();
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || 'Unknown error';
      if (status === 401) {
        alert('Session expired. Please log out and log back in, then try again.');
      } else {
        alert(`Failed to send quote (${status ?? 'network error'}): ${msg}`);
      }
    } finally { setSending(false); }
  }

  async function sendMessage() {
    if (!msgBody.trim()) return;
    setSendingMsg(true);
    try {
      const res = await axios.post(`${API}/quotes/custom-orders/${id}/messages`, { body: msgBody }, { headers: headers() });
      setOrder((o: any) => ({ ...o, messages: [...(o.messages || []), res.data] }));
      setMsgBody('');
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch { } finally { setSendingMsg(false); }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="h-12 w-full bg-gray-100 rounded animate-pulse" />
        <div className="h-64 w-full bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return <div className="text-red-500 p-8">Order not found</div>;
  }

  const steps: any[] = order.schemaVersion?.steps || [];
  const snapshot = order.configSnapshot || {};
  const quote = order.quote;
  const messages: any[] = order.messages || [];
  const currentIdx = STATUS_FLOW.indexOf(order.status);
  const nextStatus = STATUS_FLOW[currentIdx + 1] ?? null;

  return (
    <>
      {showPreview && (
        <QuotePreview order={order} form={quoteForm} onClose={() => setShowPreview(false)} onSend={sendQuote} sending={sending} />
      )}

      <div className="space-y-5">
        {/* ── Page header ── */}
        <div>
          <button type="button" onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1A3C5E] mb-3 group">
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Custom Orders
          </button>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">CO-{order.id.slice(0, 8).toUpperCase()}</h1>
                <StatusBadge status={order.status} />
                {order.internalRef && (
                  <span className="text-xs bg-[#1A3C5E]/10 text-[#1A3C5E] px-2 py-1 rounded-full font-medium">{order.internalRef}</span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {order.product?.name} · {order.quantity} units ·{' '}
                Submitted {order.submittedAt ? new Date(order.submittedAt).toLocaleDateString('nl-NL') : '—'}
              </p>
            </div>
            {order.status === 'submitted' && (
              <button type="button" onClick={() => { setTab('quote'); setShowPreview(false); }}
                className="bg-[#C8860A] text-white text-sm px-4 py-2 rounded-lg font-semibold hover:bg-amber-700 flex items-center gap-2">
                <Send size={13} /> Send Quote
              </button>
            )}
          </div>
        </div>

        {/* ── Status pipeline ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 overflow-x-auto">
          <div className="flex items-center gap-0 min-w-max">
            {STATUS_FLOW.map((s, i) => {
              const done = i <= currentIdx;
              const active = s === order.status;
              const sty = STATUS_STYLE[s] ?? STATUS_STYLE.draft;
              return (
                <div key={s} className="flex items-center">
                  <div className={`flex flex-col items-center px-3 py-1 rounded-lg transition-colors ${active ? `${sty.bg} ${sty.border} border` : ''}`}>
                    <div className={`w-2 h-2 rounded-full mb-1 ${done ? sty.dot : 'bg-gray-200'}`} />
                    <span className={`text-xs font-medium whitespace-nowrap ${active ? sty.text : done ? 'text-gray-500' : 'text-gray-300'}`}>
                      {s.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {i < STATUS_FLOW.length - 1 && (
                    <div className={`w-8 h-px ${i < currentIdx ? 'bg-gray-400' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {TABS.map(t => {
              const Icon = t.icon;
              const unread = t.key === 'messages' && messages.some((m: any) => !m.isRead && m.sender?.accountType !== 'admin');
              return (
                <button key={t.key} type="button" onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors relative ${
                    tab === t.key ? 'border-[#1A3C5E] text-[#1A3C5E]' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}>
                  <Icon size={14} />
                  {t.label}
                  {unread && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute top-3 right-3" />}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {/* ── OVERVIEW TAB ── */}
            {tab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: buyer + order info */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Buyer card */}
                  <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Buyer</h3>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#1A3C5E]/10 flex items-center justify-center flex-shrink-0">
                        <User size={14} className="text-[#1A3C5E]" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{order.user?.fullName}</p>
                        <p className="text-sm text-gray-500">{order.user?.email}</p>
                        {order.user?.companyName && (
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                            <Building2 size={11} /> {order.user.companyName}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order meta */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Product', value: order.product?.name, icon: Package },
                      { label: 'Quantity', value: `${order.quantity} units`, icon: Hash },
                      { label: 'Est. Price', value: order.estimatedPriceMin ? `€${order.estimatedPriceMin} – €${order.estimatedPriceMax}` : '—', icon: ChevronRight },
                      { label: 'Submitted', value: order.submittedAt ? new Date(order.submittedAt).toLocaleDateString('nl-NL') : '—', icon: Calendar },
                    ].map(item => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                            <Icon size={11} />{item.label}
                          </div>
                          <p className="text-sm font-semibold text-gray-900 truncate">{item.value}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Buyer notes */}
                  {order.notes && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Buyer Notes</p>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{order.notes}</p>
                    </div>
                  )}

                  {/* Quote summary if exists */}
                  {quote && (
                    <div className="border border-blue-100 bg-blue-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Current Quote</p>
                        <StatusBadge status={quote.status} />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div><p className="text-xs text-gray-400">Unit Price</p><p className="font-semibold">€{Number(quote.unitPrice).toFixed(2)}</p></div>
                        <div><p className="text-xs text-gray-400">Total</p><p className="font-semibold">€{Number(quote.totalPrice).toFixed(2)}</p></div>
                        <div><p className="text-xs text-gray-400">Lead Time</p><p className="font-semibold">{quote.leadTimeDays}d</p></div>
                      </div>
                      {quote.validUntil && (
                        <p className="text-xs text-gray-400 mt-2">Valid until {new Date(quote.validUntil).toLocaleDateString('nl-NL')}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: internal controls */}
                <div className="space-y-4">
                  {/* Status control */}
                  <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</h3>
                    <div className="flex items-center gap-2">
                      <select
                        title="Order status"
                        value={statusOverride}
                        onChange={e => setStatusOverride(e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1A3C5E]"
                      >
                        {['submitted','quoted','approved','in_production','shipped','cancelled'].map(s => (
                          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                      <button type="button" onClick={saveStatus} disabled={savingStatus || statusOverride === order.status}
                        className="text-sm bg-[#1A3C5E] text-white px-3 py-2 rounded-lg font-semibold hover:bg-[#15304e] disabled:opacity-50">
                        {savingStatus ? '…' : 'Save'}
                      </button>
                    </div>
                    {nextStatus && (
                      <button type="button" onClick={() => { setStatusOverride(nextStatus); }}
                        className="w-full text-xs text-[#1A3C5E] border border-[#1A3C5E]/20 bg-[#1A3C5E]/5 rounded-lg py-2 font-medium hover:bg-[#1A3C5E]/10">
                        Advance → {nextStatus.replace(/_/g, ' ')}
                      </button>
                    )}
                  </div>

                  {/* Internal ref + notes */}
                  <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Internal</h3>
                    <div>
                      <label className="text-xs text-gray-500 font-medium block mb-1">Production Team / Ref</label>
                      <input
                        value={internalRef}
                        onChange={e => setInternalRef(e.target.value)}
                        placeholder="e.g. Team Alpha · PROD-2024-001"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1A3C5E]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium block mb-1">Internal Notes</label>
                      <textarea
                        value={internalNotes}
                        onChange={e => setInternalNotes(e.target.value)}
                        placeholder="Notes visible only to admin team…"
                        rows={3}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1A3C5E] resize-none"
                      />
                    </div>
                    <button type="button" onClick={saveMetadata} disabled={savingMeta}
                      className="w-full text-sm bg-[#1A3C5E] text-white py-2 rounded-lg font-semibold hover:bg-[#15304e] disabled:opacity-50">
                      {savingMeta ? 'Saving…' : 'Save Internal Notes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── CONFIGURATION TAB ── */}
            {tab === 'configuration' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Configurator Snapshot</h3>
                  {order.schemaVersion && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Schema v{order.schemaVersion.versionNumber}</span>
                  )}
                </div>

                {steps.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {steps.map((step: any) => {
                      const selectedId = snapshot[step.id];
                      const opt = step.options?.find((o: any) => o.id === selectedId);
                      const hasValue = selectedId !== undefined;
                      return (
                        <div key={step.id} className={`rounded-xl border p-4 ${hasValue ? 'border-[#1A3C5E]/20 bg-[#1A3C5E]/5' : 'border-gray-100 bg-gray-50'}`}>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{step.title}</p>
                          {opt ? (
                            <>
                              <p className="font-semibold text-[#1A3C5E] text-sm">{opt.label}</p>
                              {opt.price_modifier > 0 && (
                                <p className="text-xs text-[#C8860A] mt-0.5">+€{opt.price_modifier}</p>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-gray-400 italic">{hasValue ? String(selectedId) : 'Not selected'}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* No schema steps — render raw snapshot as key-value pairs */
                  Object.keys(snapshot).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(snapshot).map(([key, val]) => (
                        <div key={key} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{key.replace(/_/g, ' ')}</p>
                          <p className="font-semibold text-gray-900 text-sm">{String(val)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400 text-sm">No configuration data available</div>
                  )
                )}

                {/* Quantity + buyer notes summary */}
                <div className="mt-2 flex gap-4 text-sm pt-4 border-t border-gray-100">
                  <div className="bg-[#1A3C5E] text-white rounded-xl px-4 py-3 text-center">
                    <p className="text-xs opacity-70">Quantity</p>
                    <p className="text-xl font-bold">{order.quantity}</p>
                  </div>
                  {order.estimatedPriceMin && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-center">
                      <p className="text-xs text-amber-600">Est. Range</p>
                      <p className="text-sm font-bold text-amber-700">€{order.estimatedPriceMin} – €{order.estimatedPriceMax}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── FILES TAB ── */}
            {tab === 'files' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Reference Files <span className="text-gray-400 font-normal text-sm">({order.referenceFiles?.length ?? 0} files)</span></h3>
                {order.referenceFiles?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {order.referenceFiles.map((url: string, i: number) => {
                      const filename = url.split('/').pop() || `file-${i + 1}`;
                      const ext = filename.split('.').pop()?.toLowerCase() ?? '';
                      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
                      const isPdf = ext === 'pdf';
                      return (
                        <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 border border-gray-100 rounded-xl p-4 hover:border-[#1A3C5E]/30 hover:bg-[#1A3C5E]/5 transition-colors group">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold uppercase ${isPdf ? 'bg-red-100 text-red-600' : isImage ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                            {ext || 'file'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[#1A3C5E]">{filename}</p>
                            <p className="text-xs text-gray-400">Click to open</p>
                          </div>
                          <ExternalLink size={14} className="text-gray-300 group-hover:text-[#1A3C5E] flex-shrink-0 ml-auto" />
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
                    <FileText size={32} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-gray-400 text-sm">No reference files uploaded by buyer</p>
                  </div>
                )}
              </div>
            )}

            {/* ── QUOTE TAB ── */}
            {tab === 'quote' && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Send / Revise Quote form */}
                <div className="lg:col-span-3 space-y-4">
                  {quoteSent && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <Send size={14} className="text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-700 text-sm">Quote sent successfully</p>
                        <p className="text-xs text-green-600">Buyer has been notified by email. Quote status: <strong>{order.quote?.status}</strong></p>
                      </div>
                    </div>
                  )}

                  <div className="border border-gray-100 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{quote ? 'Revise Quote' : 'Send Quote'}</h3>
                      {quote && <StatusBadge status={quote.status} />}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Unit Price (€) <span className="text-red-400">*</span></label>
                        <input
                          type="number" step="0.01" min="0"
                          value={quoteForm.unitPrice}
                          onChange={e => setQuoteForm(f => ({ ...f, unitPrice: e.target.value }))}
                          placeholder="0.00"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1A3C5E]"
                        />
                      </div>
                      <div>
                        <label htmlFor="q-lead" className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Lead Time (days) <span className="text-red-400">*</span></label>
                        <input
                          id="q-lead"
                          type="number" min="1"
                          value={quoteForm.leadTimeDays}
                          onChange={e => setQuoteForm(f => ({ ...f, leadTimeDays: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1A3C5E]"
                        />
                      </div>
                      <div>
                        <label htmlFor="q-valid" className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Valid for (days)</label>
                        <input
                          id="q-valid"
                          type="number" min="1"
                          value={quoteForm.validDays}
                          onChange={e => setQuoteForm(f => ({ ...f, validDays: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1A3C5E]"
                        />
                      </div>
                      <div className="flex flex-col justify-end">
                        {quoteForm.unitPrice && (
                          <div className="bg-[#1A3C5E] text-white rounded-lg px-3 py-2 text-sm text-center">
                            <p className="text-xs opacity-70">Total ({order.quantity} units)</p>
                            <p className="font-bold text-[#C8860A]">€{(parseFloat(quoteForm.unitPrice) * order.quantity).toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Note to Buyer (optional)</label>
                      <textarea
                        value={quoteForm.message}
                        onChange={e => setQuoteForm(f => ({ ...f, message: e.target.value }))}
                        rows={3}
                        placeholder="Any notes about materials, production, timing…"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1A3C5E] resize-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={() => setShowPreview(true)} disabled={!quoteForm.unitPrice}
                        className="flex-1 border border-[#1A3C5E] text-[#1A3C5E] py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1A3C5E]/5 disabled:opacity-40">
                        Preview Quote
                      </button>
                      <button type="button" onClick={() => { setShowPreview(true); }} disabled={!quoteForm.unitPrice}
                        className="flex-1 bg-[#C8860A] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-amber-700 disabled:opacity-40 flex items-center justify-center gap-2">
                        <Send size={13} /> {quote ? 'Send Revision' : 'Send Quote'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quote history */}
                <div className="lg:col-span-2 space-y-3">
                  <h3 className="font-semibold text-gray-900 text-sm">Quote History</h3>
                  {quote ? (
                    <>
                      <div className="border border-blue-100 bg-blue-50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold text-blue-700">Current Quote</p>
                          <StatusBadge status={quote.status} />
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between"><span className="text-gray-500">Unit Price</span><span className="font-semibold">€{Number(quote.unitPrice).toFixed(2)}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-semibold text-[#C8860A]">€{Number(quote.totalPrice).toFixed(2)}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Lead Time</span><span className="font-semibold">{quote.leadTimeDays}d</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Valid Until</span><span className="font-semibold text-xs">{new Date(quote.validUntil).toLocaleDateString('nl-NL')}</span></div>
                        </div>
                        {quote.message && <p className="text-xs text-gray-500 mt-2 italic border-t border-blue-100 pt-2">"{quote.message}"</p>}
                      </div>

                      {quote.revisions?.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Previous Revisions</p>
                          {[...quote.revisions].sort((a: any, b: any) => b.revisionNumber - a.revisionNumber).map((rev: any) => (
                            <div key={rev.id} className="border border-gray-100 rounded-xl p-3">
                              <div className="flex justify-between text-xs text-gray-500">
                                <span className="font-semibold">Rev. #{rev.revisionNumber}</span>
                                <span>{new Date(rev.createdAt).toLocaleDateString('nl-NL')}</span>
                              </div>
                              <p className="text-sm font-semibold text-gray-700 mt-0.5">€{Number(rev.unitPrice).toFixed(2)}/unit</p>
                              {rev.message && <p className="text-xs text-gray-400 mt-0.5 italic">{rev.message}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400">
                      No quote sent yet
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TIMELINE TAB ── */}
            {tab === 'timeline' && (() => {
              type TimelineEvent = { date: Date; label: string; detail?: string; color: string };
              const events: TimelineEvent[] = [];
              if (order.createdAt) events.push({ date: new Date(order.createdAt), label: 'Order draft created', color: 'bg-gray-400' });
              if (order.submittedAt) events.push({ date: new Date(order.submittedAt), label: 'Order submitted by buyer', color: 'bg-yellow-400' });
              if (order.quote?.sentAt) events.push({ date: new Date(order.quote.sentAt), label: 'Quote sent to buyer', detail: `€${Number(order.quote.unitPrice).toFixed(2)}/unit · ${order.quote.leadTimeDays}d lead time`, color: 'bg-blue-400' });
              if (order.quote?.revisions) {
                order.quote.revisions.forEach((rev: any) => {
                  if (rev.createdAt) events.push({ date: new Date(rev.createdAt), label: `Quote revision #${rev.revisionNumber} sent`, detail: `€${Number(rev.unitPrice).toFixed(2)}/unit`, color: 'bg-indigo-400' });
                });
              }
              if (order.quote?.respondedAt) events.push({ date: new Date(order.quote.respondedAt), label: `Buyer ${order.quote.status === 'accepted' ? 'accepted' : 'responded to'} the quote`, color: order.quote.status === 'accepted' ? 'bg-green-500' : 'bg-orange-400' });
              (order.messages || []).forEach((msg: any) => {
                if (msg.createdAt) {
                  const isAdmin = msg.sender?.accountType === 'admin';
                  events.push({ date: new Date(msg.createdAt), label: isAdmin ? 'Admin sent a message' : 'Buyer sent a message', detail: msg.body?.slice(0, 80) + (msg.body?.length > 80 ? '…' : ''), color: isAdmin ? 'bg-[#1A3C5E]' : 'bg-amber-400' });
                }
              });
              events.sort((a, b) => a.date.getTime() - b.date.getTime());
              return (
                <div className="space-y-0">
                  {events.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-sm">
                      <Clock size={28} className="mx-auto mb-2 text-gray-200" />
                      No timeline events yet
                    </div>
                  ) : events.map((ev, i) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${ev.color}`} />
                        {i < events.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                      </div>
                      <div className="pb-5 flex-1">
                        <p className="text-sm font-medium text-gray-900">{ev.label}</p>
                        {ev.detail && <p className="text-xs text-gray-500 mt-0.5 italic">{ev.detail}</p>}
                        <p className="text-xs text-gray-400 mt-1">{ev.date.toLocaleString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* ── BUYER INFO TAB ── */}
            {tab === 'buyer' && (
              <div className="space-y-4">
                {/* Buyer profile */}
                <div className="border border-gray-100 rounded-xl p-5">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Buyer Profile</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-[#1A3C5E]/10 flex items-center justify-center flex-shrink-0">
                      <User size={18} className="text-[#1A3C5E]" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{order.user?.fullName}</p>
                      <p className="text-sm text-gray-500">{order.user?.email}</p>
                      {order.user?.companyName && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Building2 size={11} /> {order.user.companyName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['Account Type', order.user?.accountType || '—'],
                      ['Wholesale Tier', order.user?.wholesaleTier || '—'],
                      ['VAT Number', order.user?.vatNumber || '—'],
                      ['Approved', order.user?.isApproved ? 'Yes' : 'No'],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                        <p className="text-sm font-semibold text-gray-900">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Buyer's order history */}
                <div className="border border-gray-100 rounded-xl p-5">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Custom Order History for this Buyer</h3>
                  <p className="text-xs text-gray-500 mb-2">
                    <span className="font-semibold text-gray-900">{order.user?.email}</span> has submitted custom orders to Blikcart.
                    View their full profile for complete order history.
                  </p>
                  <a href={`/customers/${order.userId}`}
                    className="inline-flex items-center gap-1.5 text-xs text-[#1A3C5E] font-semibold bg-[#1A3C5E]/5 hover:bg-[#1A3C5E]/10 px-3 py-2 rounded-lg transition-colors">
                    <CreditCard size={12} /> View full customer profile
                  </a>
                </div>
              </div>
            )}

            {/* ── MESSAGES TAB ── */}
            {tab === 'messages' && (
              <div className="flex flex-col gap-4">
                {/* Message thread */}
                <div className="space-y-3 min-h-[200px] max-h-[480px] overflow-y-auto pr-1">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-sm">
                      <MessageSquare size={28} className="mx-auto mb-2 text-gray-200" />
                      No messages yet
                    </div>
                  ) : messages.map((msg: any) => {
                    const isAdmin = msg.sender?.accountType === 'admin';
                    return (
                      <div key={msg.id} className={`flex gap-3 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isAdmin ? 'bg-[#1A3C5E] text-white' : 'bg-amber-100 text-amber-700'}`}>
                          {(msg.sender?.fullName?.[0] ?? '?').toUpperCase()}
                        </div>
                        <div className={`max-w-[70%] ${isAdmin ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm ${isAdmin ? 'bg-[#1A3C5E] text-white rounded-tr-sm' : 'bg-gray-100 text-gray-900 rounded-tl-sm'}`}>
                            {msg.body}
                          </div>
                          <p className="text-xs text-gray-400 px-1">
                            {isAdmin ? 'Admin' : msg.sender?.fullName} · {new Date(msg.createdAt).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply box */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex gap-2">
                    <textarea
                      value={msgBody}
                      onChange={e => setMsgBody(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendMessage(); }}
                      rows={2}
                      placeholder="Type a message to the buyer… (⌘+Enter to send)"
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1A3C5E] resize-none"
                    />
                    <button type="button" onClick={sendMessage} disabled={!msgBody.trim() || sendingMsg}
                      className="self-end bg-[#1A3C5E] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#15304e] disabled:opacity-40 flex items-center gap-1.5">
                      <Send size={13} />{sendingMsg ? '…' : 'Send'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
