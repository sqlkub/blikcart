'use client';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Download, Printer, Send, RefreshCw } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : '';
  return { Authorization: `Bearer ${token}` };
}

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
            <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ── Invoice PDF printer ───────────────────────────────────────────────────────

function printInvoice(inv: any) {
  const isB2B = !!(inv.customer?.companyName || inv.customer?.vatNumber);
  const invoiceDate = inv.paidAt ? new Date(inv.paidAt).toLocaleDateString('en-GB') : '—';

  const itemRows = (inv.items || []).map((item: any) => `
    <tr>
      <td class="item-name">${item.name}${item.sku ? `<br><small>${item.sku}</small>` : ''}</td>
      <td class="center">${item.quantity}</td>
      <td class="right">€${Number(item.unitPrice).toFixed(2)}</td>
      <td class="right">€${Number(item.total).toFixed(2)}</td>
    </tr>`).join('');

  const vatRate = inv.subtotal > 0 ? ((inv.taxAmount / inv.subtotal) * 100).toFixed(0) : '21';

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Invoice ${inv.invoiceNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #333; padding: 48px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .brand { font-size: 22px; font-weight: 900; color: #1A3C5E; letter-spacing: -0.5px; }
  .brand span { color: #F59E0B; }
  .invoice-label { text-align: right; }
  .invoice-label h1 { font-size: 28px; font-weight: 700; color: #1A3C5E; }
  .invoice-label p { font-size: 12px; color: #888; margin-top: 4px; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 36px; }
  .bill-to h3, .invoice-details h3 { font-size: 10px; text-transform: uppercase; color: #999; letter-spacing: 1px; margin-bottom: 8px; }
  .bill-to p, .invoice-details p { font-size: 13px; line-height: 1.6; color: #333; }
  .bill-to .company { font-weight: 700; font-size: 14px; }
  .vat-number { font-size: 11px; color: #666; margin-top: 2px; }
  .invoice-details { text-align: right; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead tr { background: #1A3C5E; color: white; }
  thead th { padding: 10px 14px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  thead th.right { text-align: right; }
  tbody tr { border-bottom: 1px solid #f0f0f0; }
  tbody tr:hover { background: #fafafa; }
  td { padding: 10px 14px; font-size: 13px; }
  td.center { text-align: center; }
  td.right { text-align: right; }
  td.item-name small { color: #999; font-size: 11px; }
  .totals { margin-left: auto; width: 280px; }
  .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
  .totals-row.total { font-weight: 700; font-size: 16px; color: #1A3C5E; border-top: 2px solid #1A3C5E; padding-top: 10px; margin-top: 4px; }
  .totals-label { color: #666; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #eee; display: flex; justify-content: space-between; font-size: 11px; color: #aaa; }
  .paid-stamp { display: inline-block; border: 3px solid #16a34a; color: #16a34a; padding: 4px 16px; font-weight: 900; font-size: 18px; letter-spacing: 3px; transform: rotate(-12deg); opacity: 0.6; margin-top: 8px; }
  @media print { body { padding: 24px; } }
</style></head>
<body>
  <div class="header">
    <div>
      <div class="brand">BLIK<span>CART</span></div>
      <p style="font-size:11px;color:#888;margin-top:4px;">blikcart.com</p>
    </div>
    <div class="invoice-label">
      <h1>INVOICE</h1>
      <p>${inv.invoiceNumber}</p>
      <div class="paid-stamp">PAID</div>
    </div>
  </div>

  <div class="meta">
    <div class="bill-to">
      <h3>Bill To</h3>
      ${isB2B && inv.customer?.companyName ? `<p class="company">${inv.customer.companyName}</p>` : ''}
      <p>${inv.customer?.fullName || '—'}</p>
      <p>${inv.customer?.email || ''}</p>
      ${inv.customer?.vatNumber ? `<p class="vat-number">VAT: ${inv.customer.vatNumber}</p>` : ''}
    </div>
    <div class="invoice-details">
      <h3>Invoice Details</h3>
      <p><strong>Invoice Date:</strong> ${invoiceDate}</p>
      <p><strong>Order:</strong> #${inv.orderNumber}</p>
      <p><strong>Payment:</strong> ${(inv.method || '').toUpperCase() || '—'}</p>
      <p><strong>Provider:</strong> ${(inv.provider || '').charAt(0).toUpperCase() + (inv.provider || '').slice(1)}</p>
      <p><strong>Currency:</strong> EUR</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="center">Qty</th>
        <th class="right">Unit Price</th>
        <th class="right">Amount</th>
      </tr>
    </thead>
    <tbody>${itemRows || `<tr><td colspan="4" style="text-align:center;color:#999;padding:20px">No line items</td></tr>`}</tbody>
  </table>

  <div class="totals">
    <div class="totals-row"><span class="totals-label">Subtotal</span><span>€${Number(inv.subtotal || 0).toFixed(2)}</span></div>
    <div class="totals-row"><span class="totals-label">Shipping</span><span>€${Number(inv.shippingCost || 0).toFixed(2)}</span></div>
    ${isB2B ? `<div class="totals-row"><span class="totals-label">VAT (${vatRate}%) <small style="color:#999">incl.</small></span><span>€${Number(inv.taxAmount || 0).toFixed(2)}</span></div>` : `<div class="totals-row"><span class="totals-label">VAT (${vatRate}%)</span><span>€${Number(inv.taxAmount || 0).toFixed(2)}</span></div>`}
    <div class="totals-row total"><span>Total</span><span>€${Number(inv.amount || 0).toFixed(2)}</span></div>
  </div>

  <div class="footer">
    <span>Thank you for your business.</span>
    <span>Generated by BLIKCART Admin · ${new Date().toLocaleDateString('en-GB')}</span>
  </div>

  <script>window.onload = function() { window.print(); }<\/script>
</body></html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

// ── Transactions Tab ──────────────────────────────────────────────────────────

const TX_STATUSES = ['All', 'pending', 'paid', 'failed', 'refunded', 'partially_refunded'];
const PAGE_SIZE = 25;

function TransactionsTab() {
  const [payments, setPayments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState({ volume: 0, paid: 0, failed: 0, refunded: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: PAGE_SIZE };
      if (status !== 'All') params.status = status;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await axios.get(`${API}/orders/admin/payments`, { headers: authHeaders(), params });
      const data: any[] = res.data.data || [];
      setPayments(data);
      setTotal(res.data.meta?.total || 0);
      // summary only on first unfiltered load
      if (status === 'All' && !dateFrom && !dateTo && page === 1) {
        setSummary({
          volume: data.reduce((s, p) => s + Number(p.amount || 0), 0),
          paid: data.filter(p => p.status === 'paid').length,
          failed: data.filter(p => p.status === 'failed').length,
          refunded: data.filter(p => ['refunded', 'partially_refunded'].includes(p.status)).length,
        });
      }
    } catch { setPayments([]); }
    finally { setLoading(false); }
  }, [status, dateFrom, dateTo, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [status, dateFrom, dateTo]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Volume', value: `€${summary.volume.toFixed(2)}`, color: 'text-[#1A3C5E]' },
          { label: 'Paid', value: String(summary.paid), color: 'text-green-600' },
          { label: 'Failed', value: String(summary.failed), color: 'text-red-500' },
          { label: 'Refunded', value: String(summary.refunded), color: 'text-gray-500' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{c.label}</p>
            {loading ? <div className="h-8 w-16 bg-gray-100 rounded animate-pulse mt-1" />
              : <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center mb-5">
        <div className="flex gap-1 flex-wrap">
          {TX_STATUSES.map(s => (
            <button key={s} type="button" onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${status === s ? 'bg-[#1A3C5E] text-white border-[#1A3C5E]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
              {s === 'partially_refunded' ? 'Partial Refund' : s === 'All' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center ml-auto">
          <label htmlFor="tx-from" className="text-xs text-gray-500">From</label>
          <input id="tx-from" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-[#1A3C5E]" />
          <label htmlFor="tx-to" className="text-xs text-gray-500">To</label>
          <input id="tx-to" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-[#1A3C5E]" />
        </div>
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
            {loading ? <Skel cols={8} /> : payments.length > 0 ? payments.map(p => (
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
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-500'}`}>
                    {p.status === 'partially_refunded' ? 'partial refund' : p.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
              </tr>
            )) : (
              <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-400 text-sm">No payments found</td></tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex gap-1">
              <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">← Prev</button>
              <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Invoices Tab ──────────────────────────────────────────────────────────────

function InvoicesTab() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [resendId, setResendId] = useState<string | null>(null);
  const LIMIT = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: LIMIT };
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await axios.get(`${API}/orders/admin/invoices`, { headers: authHeaders(), params });
      setInvoices(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch { setInvoices([]); }
    finally { setLoading(false); }
  }, [page, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [dateFrom, dateTo]);

  const q = search.toLowerCase();
  const filtered = invoices.filter(inv =>
    !q ||
    inv.invoiceNumber?.toLowerCase().includes(q) ||
    inv.orderNumber?.toLowerCase().includes(q) ||
    inv.customer?.fullName?.toLowerCase().includes(q) ||
    inv.customer?.email?.toLowerCase().includes(q) ||
    inv.customer?.companyName?.toLowerCase().includes(q)
  );

  async function resend(inv: any) {
    setResendId(inv.orderId);
    // Simulate email sending — real implementation would call a mailer service
    await new Promise(r => setTimeout(r, 800));
    setResendId(null);
  }

  function exportCSV() {
    const headers = ['Invoice #', 'Order #', 'Customer', 'Company', 'VAT', 'Amount (€)', 'VAT Amount (€)', 'Method', 'Paid At'];
    const rows = filtered.map(inv => [
      inv.invoiceNumber,
      inv.orderNumber,
      inv.customer?.fullName || '',
      inv.customer?.companyName || '',
      inv.customer?.vatNumber || '',
      Number(inv.amount).toFixed(2),
      Number(inv.taxAmount || 0).toFixed(2),
      inv.method || '',
      inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const range = dateFrom && dateTo ? `_${dateFrom}_${dateTo}` : '';
    a.href = url; a.download = `invoices${range}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center mb-5">
        <input type="text" placeholder="Search invoice / order / customer…" value={search} onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1A3C5E] w-64" />
        <div className="flex gap-2 items-center">
          <label htmlFor="inv-from" className="text-xs text-gray-500">From</label>
          <input id="inv-from" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-[#1A3C5E]" />
          <label htmlFor="inv-to" className="text-xs text-gray-500">To</label>
          <input id="inv-to" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-[#1A3C5E]" />
        </div>
        <button type="button" onClick={exportCSV}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
          <Download size={13} /> Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
              {['Invoice #', 'Order #', 'Customer', 'Amount', 'VAT', 'Method', 'Paid At', 'Actions'].map(h => (
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
                  {inv.customer?.companyName && <div className="text-xs text-gray-400">{inv.customer.companyName}</div>}
                  {inv.customer?.vatNumber && <div className="text-xs text-gray-300 font-mono">VAT: {inv.customer.vatNumber}</div>}
                </td>
                <td className="px-5 py-4 text-sm font-semibold text-green-700">€{Number(inv.amount).toFixed(2)}</td>
                <td className="px-5 py-4 text-xs text-gray-500">€{Number(inv.taxAmount || 0).toFixed(2)}</td>
                <td className="px-5 py-4 text-sm text-gray-500">{inv.method || '—'}</td>
                <td className="px-5 py-4 text-xs text-gray-500">{inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : '—'}</td>
                <td className="px-5 py-4">
                  <div className="flex gap-1.5">
                    <button type="button" title="Print / Save as PDF" onClick={() => printInvoice(inv)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                      <Printer size={12} /> PDF
                    </button>
                    <button type="button" title="Re-send invoice email" onClick={() => resend(inv)}
                      disabled={resendId === inv.orderId}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-50">
                      {resendId === inv.orderId ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                      {resendId === inv.orderId ? '…' : 'Send'}
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-400 text-sm">
                {search ? 'No invoices match your search' : 'No paid invoices yet'}
              </td></tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">{Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)} of {total}</p>
            <div className="flex gap-1">
              <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">← Prev</button>
              <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next →</button>
            </div>
          </div>
        )}
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
  const [refundReason, setRefundReason] = useState('');
  const [refunding, setRefunding] = useState(false);
  const [refundError, setRefundError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [refundsRes, paymentsRes] = await Promise.all([
        axios.get(`${API}/orders/admin/refunds?limit=100`, { headers: authHeaders() }),
        axios.get(`${API}/orders/admin/payments?limit=200`, { headers: authHeaders() }),
      ]);
      setRefunds(refundsRes.data.data || []);
      const all: any[] = paymentsRes.data.data || [];
      setPaidPayments(all.filter(p => p.status === 'paid' || p.status === 'partially_refunded'));
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
    try {
      await axios.post(`${API}/orders/admin/payments/${refundModal.payment.id}/refund`,
        { amount, reason: refundReason || undefined },
        { headers: authHeaders() });
      setRefundModal(null);
      setRefundAmount('');
      setRefundReason('');
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
            {loading ? <div className="h-8 w-16 bg-gray-100 rounded animate-pulse mt-1" />
              : <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>}
          </div>
        ))}
      </div>

      {/* Initiate Refund */}
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
                    <td className="px-5 py-4 text-sm text-orange-600">{refundedAmt > 0 ? `€${refundedAmt.toFixed(2)}` : '—'}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-green-700">€{remaining.toFixed(2)}</td>
                    <td className="px-5 py-4">
                      <button type="button" title="Initiate refund"
                        onClick={() => { setRefundModal({ payment: p }); setRefundAmount(''); setRefundReason(''); setRefundError(''); }}
                        className="text-xs px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100">
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setRefundModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-1">Issue Refund</h3>
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

            <div className="mb-3">
              <label htmlFor="refund-amount" className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                Refund Amount (€)
              </label>
              <div className="flex gap-2">
                <input id="refund-amount" type="number" step="0.01" min="0.01"
                  value={refundAmount} onChange={e => { setRefundAmount(e.target.value); setRefundError(''); }}
                  placeholder="0.00"
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1A3C5E]" />
                <button type="button"
                  onClick={() => {
                    const max = Number(refundModal.payment.amount) - Number(refundModal.payment.refundedAmount || 0);
                    setRefundAmount(max.toFixed(2));
                  }}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 whitespace-nowrap">
                  Full
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="refund-reason" className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                Reason (optional — included in buyer email)
              </label>
              <textarea id="refund-reason" value={refundReason} onChange={e => setRefundReason(e.target.value)}
                rows={2} placeholder="e.g. Item out of stock, duplicate order…"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1A3C5E] resize-none" />
            </div>

            {refundError && <p className="text-red-500 text-xs mb-3">{refundError}</p>}

            <div className="flex gap-3">
              <button type="button" onClick={() => setRefundModal(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button type="button" onClick={submitRefund} disabled={refunding}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                {refunding ? 'Processing…' : 'Process Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS = ['Transactions', 'Invoices', 'Refunds'] as const;
type Tab = typeof TABS[number];

export default function PaymentsPage() {
  const [tab, setTab] = useState<Tab>('Transactions');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payments & Finance</h1>
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
