'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, Trash2, Printer, Save, Check, Copy, RefreshCw, Send, X, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineItem {
  id: string;
  product: string;
  description: string;
  qty: number;
  unitCost: number;       // manufacturer price (cost)
  margin: number;         // % markup over cost
  vatPct: number;         // % VAT for this line
  unit: string;
}

interface QuoteHeader {
  quoteNumber: string;
  date: string;
  validUntil: string;
  // Client
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientAddress: string;
  clientVat: string;
  // Our details
  ourCompany: string;
  ourAddress: string;
  ourEmail: string;
  ourVat: string;
  ourKvk: string;
  ourEori: string;
  // Payment
  paymentTerms: string;
  currency: string;
  notes: string;
  internalNotes: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return `l_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`; }

function fmt(n: number, cur = '€') {
  return `${cur}${n.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function quoteNum() {
  const now = new Date();
  return `BK-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`;
}

function todayStr() { return new Date().toISOString().slice(0, 10); }
function futureStr(days: number) {
  const d = new Date(); d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function newLine(): LineItem {
  return { id: uid(), product: '', description: '', qty: 1, unitCost: 0, margin: 30, vatPct: 21, unit: 'pcs' };
}

// Derived per-line calcs
function calcLine(l: LineItem) {
  const sellUnit = l.unitCost * (1 + l.margin / 100);
  const lineEx = sellUnit * l.qty;
  const lineVat = lineEx * (l.vatPct / 100);
  const lineInc = lineEx + lineVat;
  return { sellUnit, lineEx, lineVat, lineInc };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E] bg-white';
const ta  = `${inp} resize-y`;

function Field({ label, value, onChange, type = 'text', placeholder = '', small = false }: {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string; small?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inp} ${small ? 'text-xs' : ''}`}
      />
    </div>
  );
}

// Number input that lets user type freely — commits on blur
function NumInput({ value, onChange, placeholder = '0', className = '', title = '' }: {
  value: number; onChange: (n: number) => void; placeholder?: string; className?: string; title?: string;
}) {
  const [raw, setRaw] = useState(value === 0 ? '' : String(value));
  // Sync if parent changes value (e.g. duplicate line)
  useEffect(() => { setRaw(value === 0 ? '' : String(value)); }, [value]);
  return (
    <input
      type="text"
      inputMode="decimal"
      title={title}
      placeholder={placeholder}
      value={raw}
      onChange={e => setRaw(e.target.value)}
      onBlur={() => {
        const n = parseFloat(raw.replace(',', '.'));
        const safe = isNaN(n) ? 0 : Math.max(0, n);
        onChange(safe);
        setRaw(safe === 0 ? '' : String(safe));
      }}
      className={className}
    />
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function QuoteCalculatorPage() {
  const printRef = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState(false);

  const [header, setHeader] = useState<QuoteHeader>({
    quoteNumber:  quoteNum(),
    date:         todayStr(),
    validUntil:   futureStr(30),
    clientName:   '',
    clientCompany:'',
    clientEmail:  '',
    clientAddress:'',
    clientVat:    '',
    ourCompany:   'Blikcart',
    ourAddress:   'Livingstonelaan 262, 3526 HV Utrecht, Netherlands',
    ourEmail:     'info@blikcart.nl',
    ourVat:       'NL003553343B13',
    ourKvk:       '81325357',
    ourEori:      'NL3943578360',
    paymentTerms: 'Net 14 days',
    currency:     '€',
    notes:        '',
    internalNotes:'',
  });

  const [lines, setLines] = useState<LineItem[]>([newLine()]);

  const setH = useCallback((patch: Partial<QuoteHeader>) => {
    setHeader(h => ({ ...h, ...patch }));
  }, []);

  function updateLine(id: string, patch: Partial<LineItem>) {
    setLines(ls => ls.map(l => l.id === id ? { ...l, ...patch } : l));
  }

  function removeLine(id: string) {
    setLines(ls => ls.filter(l => l.id !== id));
  }

  function duplicateLine(id: string) {
    setLines(ls => {
      const idx = ls.findIndex(l => l.id === id);
      const copy = { ...ls[idx], id: uid() };
      return [...ls.slice(0, idx + 1), copy, ...ls.slice(idx + 1)];
    });
  }

  // Totals
  const totals = lines.reduce((acc, l) => {
    const { lineEx, lineVat, lineInc } = calcLine(l);
    return { ex: acc.ex + lineEx, vat: acc.vat + lineVat, inc: acc.inc + lineInc };
  }, { ex: 0, vat: 0, inc: 0 });

  // Group VAT by rate for summary
  const vatGroups = lines.reduce<Record<number, number>>((acc, l) => {
    const { lineEx } = calcLine(l);
    const vatAmt = lineEx * (l.vatPct / 100);
    acc[l.vatPct] = (acc[l.vatPct] || 0) + vatAmt;
    return acc;
  }, {});

  function handlePrint() {
    window.print();
  }

  function resetQuote() {
    if (!confirm('Start a new quote? Current data will be lost.')) return;
    setHeader(h => ({ ...h, quoteNumber: quoteNum(), date: todayStr(), validUntil: futureStr(30), clientName: '', clientCompany: '', clientEmail: '', clientAddress: '', clientVat: '', notes: '', internalNotes: '' }));
    setLines([newLine()]);
  }

  function fakesSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // ── Email modal ──────────────────────────────────────────────────────────────
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState<'sent' | 'error' | null>(null);
  const [emailDraft, setEmailDraft] = useState({ to: '', cc: '', subject: '', body: '' });

  function buildEmailHtml() {
    const rowsBg = ['#ffffff', '#faf9f7'];
    const lineRows = lines.map((l, i) => {
      const { sellUnit, lineEx, lineVat } = calcLine(l);
      return `<tr style="background:${rowsBg[i % 2]};border-bottom:1px solid #e8e4de">
        <td style="padding:7px 10px;text-align:center;color:#888;font-size:12px">${i + 1}</td>
        <td style="padding:7px 10px;font-weight:600">${l.product}</td>
        <td style="padding:7px 10px;color:#555">${l.description}</td>
        <td style="padding:7px 10px;text-align:center">${l.qty}</td>
        <td style="padding:7px 10px;color:#888">${l.unit}</td>
        <td style="padding:7px 10px;font-weight:600">${fmt(sellUnit, header.currency)}</td>
        <td style="padding:7px 10px;font-weight:600">${fmt(lineEx, header.currency)}</td>
        <td style="padding:7px 10px;text-align:center;color:#888">${l.vatPct}%</td>
        <td style="padding:7px 10px;color:#888">${fmt(lineVat, header.currency)}</td>
      </tr>`;
    }).join('');

    const vatRows = Object.entries(vatGroups).map(([rate, amt]) =>
      `<tr><td style="color:#555;padding:5px 0">VAT ${rate}%</td><td style="font-weight:600;padding:5px 0;text-align:right">${fmt(amt, header.currency)}</td></tr>`
    ).join('');

    return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;color:#1a1a1a;max-width:800px;margin:0 auto;padding:24px">
      <div style="display:flex;justify-content:space-between;border-bottom:3px solid #1A3C5E;padding-bottom:16px;margin-bottom:24px">
        <div>
          <h1 style="font-size:24px;font-weight:800;color:#1A3C5E;margin:0">${header.ourCompany}</h1>
          <p style="font-size:12px;color:#666;margin:4px 0">${header.ourAddress}</p>
          <p style="font-size:12px;color:#666;margin:0">${header.ourEmail}</p>
          <p style="font-size:11px;color:#999;margin:4px 0">KvK: ${header.ourKvk} · VAT: ${header.ourVat}</p>
        </div>
        <div style="text-align:right">
          <p style="font-size:22px;font-weight:800;color:#C8860A;margin:0">QUOTATION</p>
          <p style="font-size:13px;color:#555;margin:4px 0">#${header.quoteNumber}</p>
          <p style="font-size:12px;color:#888;margin:2px 0">Date: ${header.date}</p>
          <p style="font-size:12px;color:#888;margin:0">Valid until: ${header.validUntil}</p>
        </div>
      </div>
      <div style="margin-bottom:20px">
        <p style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px">Bill To</p>
        <p style="font-size:14px;font-weight:700;margin:0">${header.clientCompany || header.clientName}</p>
        ${header.clientCompany && header.clientName ? `<p style="font-size:13px;color:#555;margin:2px 0">Attn: ${header.clientName}</p>` : ''}
        ${header.clientAddress ? `<p style="font-size:13px;color:#555;margin:2px 0">${header.clientAddress.replace(/\n/g, '<br>')}</p>` : ''}
        ${header.clientEmail ? `<p style="font-size:13px;color:#555;margin:2px 0">${header.clientEmail}</p>` : ''}
        ${header.clientVat ? `<p style="font-size:12px;color:#999;margin:2px 0">VAT: ${header.clientVat}</p>` : ''}
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
        <thead><tr style="background:#1A3C5E;color:#fff">
          ${['#','Product','Description','Qty','Unit','Unit Price','Subtotal (ex-VAT)','VAT %','VAT Amount'].map(h => `<th style="padding:8px 10px;text-align:left;font-size:11px">${h}</th>`).join('')}
        </tr></thead>
        <tbody>${lineRows}</tbody>
      </table>
      <div style="display:flex;justify-content:flex-end;margin-bottom:20px">
        <table style="width:280px;font-size:13px">
          <tr><td style="color:#555;padding:5px 0">Subtotal (ex-VAT)</td><td style="font-weight:600;padding:5px 0;text-align:right">${fmt(totals.ex, header.currency)}</td></tr>
          ${vatRows}
          <tr style="background:#1A3C5E;color:#fff"><td style="padding:8px 12px;font-weight:700">Total incl. VAT</td><td style="padding:8px 12px;font-weight:800;font-size:15px;color:#C8860A;text-align:right">${fmt(totals.inc, header.currency)}</td></tr>
        </table>
      </div>
      ${header.paymentTerms ? `<p style="font-size:12px"><strong>Payment terms:</strong> ${header.paymentTerms}</p>` : ''}
      ${header.notes ? `<p style="font-size:12px;color:#555">${header.notes.replace(/\n/g, '<br>')}</p>` : ''}
      <div style="margin-top:32px;border-top:1px solid #e8e4de;padding-top:10px;font-size:11px;color:#aaa;display:flex;justify-content:space-between">
        <span>${header.ourCompany} · ${header.ourEmail}</span>
        <span>Quote #${header.quoteNumber} · ${header.date}</span>
      </div>
    </body></html>`;
  }

  function openEmailModal() {
    setEmailResult(null);
    setEmailDraft({
      to: header.clientEmail,
      cc: '',
      subject: `Quotation #${header.quoteNumber} – ${header.ourCompany}`,
      body: `Dear ${header.clientName || header.clientCompany || 'Sir/Madam'},\n\nPlease find attached our quotation #${header.quoteNumber} dated ${header.date}, valid until ${header.validUntil}.\n\nTotal amount: ${fmt(totals.inc, header.currency)} (incl. VAT)\n\nPlease don't hesitate to contact us if you have any questions.\n\nKind regards,\n${header.ourCompany}\n${header.ourEmail}`,
    });
    setEmailOpen(true);
  }

  async function sendEmail() {
    if (!emailDraft.to) return;
    setEmailSending(true);
    setEmailResult(null);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API}/mail/send-quote`, {
        to: emailDraft.to,
        cc: emailDraft.cc || undefined,
        subject: emailDraft.subject,
        bodyText: emailDraft.body,
        bodyHtml: buildEmailHtml(),
        replyTo: header.ourEmail,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setEmailResult('sent');
    } catch {
      setEmailResult('error');
    } finally {
      setEmailSending(false);
    }
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: fixed; inset: 0; padding: 32px; font-size: 12px; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
        }
        .print-only { display: none; }
      `}</style>

      <div className="space-y-6 max-w-6xl">

        {/* Header bar */}
        <div className="flex items-center justify-between no-print">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quote Calculator</h1>
            <p className="text-sm text-gray-500 mt-1">Internal tool — fill in manufacturer cost, margin & VAT per line. Generate a client-ready quotation.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={resetQuote} title="New quote"
              className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50">
              <RefreshCw size={15} />
            </button>
            <button type="button" onClick={fakesSave}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
              {saved ? <><Check size={14} className="text-green-500" /> Saved</> : <><Save size={14} /> Save draft</>}
            </button>
            <button type="button" onClick={openEmailModal}
              className="flex items-center gap-2 px-4 py-2 bg-[#C8860A] text-white text-sm font-semibold rounded-lg hover:bg-[#b37509]">
              <Send size={14} /> Send Email
            </button>
            <button type="button" onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-[#1A3C5E] text-white text-sm font-semibold rounded-lg hover:bg-[#112E4D]">
              <Printer size={14} /> Print / PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 no-print">
          {/* ── Quote & client info ─────────────────────────────────────────── */}
          <div className="col-span-2 space-y-5">

            {/* Quote meta */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Quote Details</h2>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Quote number" value={header.quoteNumber} onChange={v => setH({ quoteNumber: v })} />
                <Field label="Date" type="date" value={header.date} onChange={v => setH({ date: v })} />
                <Field label="Valid until" type="date" value={header.validUntil} onChange={v => setH({ validUntil: v })} />
                <Field label="Currency" value={header.currency} onChange={v => setH({ currency: v })} placeholder="€" />
                <Field label="Payment terms" value={header.paymentTerms} onChange={v => setH({ paymentTerms: v })} placeholder="Net 14 days" />
              </div>
            </div>

            {/* Client info */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Bill To (Client)</h2>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Contact name" value={header.clientName} onChange={v => setH({ clientName: v })} placeholder="John Smith" />
                <Field label="Company name" value={header.clientCompany} onChange={v => setH({ clientCompany: v })} placeholder="Acme Equestrian BV" />
                <Field label="Email" value={header.clientEmail} onChange={v => setH({ clientEmail: v })} placeholder="john@acme.nl" />
                <Field label="VAT / BTW number" value={header.clientVat} onChange={v => setH({ clientVat: v })} placeholder="NL000000000B01" />
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Address</label>
                  <textarea value={header.clientAddress} onChange={e => setH({ clientAddress: e.target.value })}
                    rows={2} placeholder="Street, City, Country"
                    className={ta} />
                </div>
              </div>
            </div>

            {/* Our company */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">From (Our Company)</h2>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Company" value={header.ourCompany} onChange={v => setH({ ourCompany: v })} />
                <Field label="Email" value={header.ourEmail} onChange={v => setH({ ourEmail: v })} />
                <Field label="KvK" value={header.ourKvk} onChange={v => setH({ ourKvk: v })} />
                <Field label="VAT number" value={header.ourVat} onChange={v => setH({ ourVat: v })} />
                <Field label="EORI" value={header.ourEori} onChange={v => setH({ ourEori: v })} />
                <div className="col-span-3">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Address</label>
                  <input value={header.ourAddress} onChange={e => setH({ ourAddress: e.target.value })}
                    className={inp} placeholder="Street, City, Country" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Live totals panel ──────────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="bg-[#1A3C5E] rounded-xl p-5 text-white sticky top-6">
              <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-4">Live Totals</p>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Subtotal (ex-VAT)</span>
                  <span className="font-semibold">{fmt(totals.ex, header.currency)}</span>
                </div>
                {Object.entries(vatGroups).map(([rate, amt]) => (
                  <div key={rate} className="flex justify-between text-sm">
                    <span className="text-white/60">VAT {rate}%</span>
                    <span className="font-semibold">{fmt(amt, header.currency)}</span>
                  </div>
                ))}
                <div className="border-t border-white/20 pt-2 flex justify-between">
                  <span className="font-bold">Total incl. VAT</span>
                  <span className="font-bold text-[#C8860A] text-lg">{fmt(totals.inc, header.currency)}</span>
                </div>
              </div>

              {/* Per-line margin summary */}
              <div className="border-t border-white/10 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">Cost vs. Revenue (internal)</p>
                <div className="space-y-1">
                  {lines.filter(l => l.product).map(l => {
                    const cost = l.unitCost * l.qty;
                    const { lineEx } = calcLine(l);
                    const profit = lineEx - cost;
                    return (
                      <div key={l.id} className="flex justify-between text-xs">
                        <span className="text-white/50 truncate max-w-[120px]">{l.product || '—'}</span>
                        <span className="text-green-400 font-semibold">+{fmt(profit, header.currency)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-white/10 mt-2 pt-2 flex justify-between text-sm">
                  <span className="text-white/50">Total profit</span>
                  <span className="text-green-400 font-bold">{fmt(totals.ex - lines.reduce((s, l) => s + l.unitCost * l.qty, 0), header.currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Line items ──────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden no-print">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Line Items</h2>
            <span className="text-xs text-gray-400">Cost = manufacturer price · Margin = your markup · VAT per line</span>
          </div>

          <div className="overflow-x-auto">
          {/* Column headers */}
          <div className="grid text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-2 border-b border-gray-100 bg-gray-50 min-w-[1000px]"
            style={{ gridTemplateColumns: '180px 180px 60px 60px 120px 90px 110px 120px 100px 110px 64px' }}>
            <span>Product</span>
            <span>Description</span>
            <span>Qty</span>
            <span>Unit</span>
            <span>Mfr. Cost/Unit</span>
            <span>Margin %</span>
            <span>Sell Price/Unit</span>
            <span>Subtotal (ex)</span>
            <span>VAT %</span>
            <span>VAT Amount</span>
            <span className="text-right">Actions</span>
          </div>

          {lines.map((l, idx) => {
            const { sellUnit, lineEx, lineVat } = calcLine(l);
            return (
              <div key={l.id} className={`grid items-center gap-2 px-4 py-2.5 border-b border-gray-50 min-w-[1000px] ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
                style={{ gridTemplateColumns: '180px 180px 60px 60px 120px 90px 110px 120px 100px 110px 64px' }}>

                <input value={l.product} onChange={e => updateLine(l.id, { product: e.target.value })}
                  placeholder="Product name" title="Product name"
                  className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#1A3C5E]" />

                <input value={l.description} onChange={e => updateLine(l.id, { description: e.target.value })}
                  placeholder="Details / variant" title="Description"
                  className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#1A3C5E]" />

                <NumInput
                  value={l.qty}
                  onChange={n => updateLine(l.id, { qty: Math.max(1, n) })}
                  placeholder="1"
                  title="Quantity"
                  className="px-2 py-1.5 border border-gray-200 rounded text-sm text-center focus:outline-none focus:border-[#1A3C5E] w-full" />

                <input value={l.unit} onChange={e => updateLine(l.id, { unit: e.target.value })}
                  placeholder="pcs" title="Unit"
                  className="px-2 py-1.5 border border-gray-200 rounded text-sm text-center focus:outline-none focus:border-[#1A3C5E] w-full" />

                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400 flex-shrink-0">{header.currency}</span>
                  <NumInput
                    value={l.unitCost}
                    onChange={n => updateLine(l.id, { unitCost: n })}
                    placeholder="0.00"
                    title="Manufacturer cost per unit"
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#1A3C5E]" />
                </div>

                <div className="flex items-center gap-1">
                  <NumInput
                    value={l.margin}
                    onChange={n => updateLine(l.id, { margin: n })}
                    placeholder="30"
                    title="Margin percentage"
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm text-center focus:outline-none focus:border-[#1A3C5E]" />
                  <span className="text-xs text-gray-400 flex-shrink-0">%</span>
                </div>

                <div className="text-sm font-semibold text-[#1A3C5E] text-right pr-1">
                  {fmt(sellUnit, header.currency)}
                </div>

                <div className="text-sm font-semibold text-right pr-1">
                  {fmt(lineEx, header.currency)}
                </div>

                <div className="flex items-center gap-1">
                  <NumInput
                    value={l.vatPct}
                    onChange={n => updateLine(l.id, { vatPct: n })}
                    placeholder="21"
                    title="VAT percentage"
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm text-center focus:outline-none focus:border-[#1A3C5E]" />
                  <span className="text-xs text-gray-400 flex-shrink-0">%</span>
                </div>

                <div className="text-sm text-gray-500 text-right pr-1">
                  {fmt(lineVat, header.currency)}
                </div>

                <div className="flex items-center justify-end gap-1">
                  <button type="button" onClick={() => duplicateLine(l.id)} title="Duplicate line"
                    className="p-1 text-gray-300 hover:text-[#1A3C5E]">
                    <Copy size={13} />
                  </button>
                  <button type="button" onClick={() => removeLine(l.id)} title="Remove line"
                    className="p-1 text-gray-300 hover:text-red-500"
                    disabled={lines.length === 1}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}

          </div>{/* end overflow-x-auto */}

          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <button type="button" onClick={() => setLines(ls => [...ls, newLine()])}
              className="flex items-center gap-2 text-sm font-semibold text-[#1A3C5E] hover:underline">
              <Plus size={14} /> Add line
            </button>
            <div className="flex items-center gap-6 text-sm">
              <span className="text-gray-500">Subtotal ex-VAT: <strong className="text-gray-900">{fmt(totals.ex, header.currency)}</strong></span>
              <span className="text-gray-500">Total VAT: <strong className="text-gray-900">{fmt(totals.vat, header.currency)}</strong></span>
              <span className="text-gray-700 font-bold text-base">Total incl. VAT: <strong className="text-[#C8860A]">{fmt(totals.inc, header.currency)}</strong></span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="grid grid-cols-2 gap-5 no-print">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Client Notes (printed on quote)</label>
            <textarea value={header.notes} onChange={e => setH({ notes: e.target.value })}
              rows={4} placeholder="Payment terms, delivery notes, special conditions..."
              className={ta} />
          </div>
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
            <label className="block text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">Internal Notes (NOT printed)</label>
            <textarea value={header.internalNotes} onChange={e => setH({ internalNotes: e.target.value })}
              rows={4} placeholder="Cost breakdown notes, supplier info, negotiation context..."
              className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:border-amber-400 bg-white resize-y" />
          </div>
        </div>

        {/* ── PRINT AREA ──────────────────────────────────────────────────────── */}
        <div id="print-area" ref={printRef} style={{ fontFamily: 'system-ui, sans-serif', color: '#1a1a1a' }}>
          {/* Letterhead */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, borderBottom: '3px solid #1A3C5E', paddingBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1A3C5E', margin: 0 }}>{header.ourCompany}</h1>
              <p style={{ fontSize: 12, color: '#666', marginTop: 4, whiteSpace: 'pre-line' }}>{header.ourAddress}</p>
              <p style={{ fontSize: 12, color: '#666' }}>{header.ourEmail}</p>
              <p style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                KvK: {header.ourKvk} · VAT: {header.ourVat}{header.ourEori ? ` · EORI: ${header.ourEori}` : ''}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: '#C8860A', margin: 0 }}>QUOTATION</p>
              <p style={{ fontSize: 13, color: '#555', marginTop: 4 }}>#{header.quoteNumber}</p>
              <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Date: {header.date}</p>
              <p style={{ fontSize: 12, color: '#888' }}>Valid until: {header.validUntil}</p>
            </div>
          </div>

          {/* Bill to */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Bill To</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{header.clientCompany || header.clientName}</p>
            {header.clientCompany && header.clientName && <p style={{ fontSize: 13, color: '#555' }}>Attn: {header.clientName}</p>}
            {header.clientAddress && <p style={{ fontSize: 13, color: '#555', whiteSpace: 'pre-line' }}>{header.clientAddress}</p>}
            {header.clientEmail && <p style={{ fontSize: 13, color: '#555' }}>{header.clientEmail}</p>}
            {header.clientVat && <p style={{ fontSize: 12, color: '#999' }}>VAT: {header.clientVat}</p>}
          </div>

          {/* Line items table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 24 }}>
            <thead>
              <tr style={{ background: '#1A3C5E', color: '#fff' }}>
                {['#', 'Product', 'Description', 'Qty', 'Unit', 'Unit Price', 'Subtotal (ex-VAT)', 'VAT %', 'VAT Amount'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: h === '#' || h === 'Qty' ? 'center' : 'left', fontSize: 11, fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => {
                const { sellUnit, lineEx, lineVat } = calcLine(l);
                return (
                  <tr key={l.id} style={{ borderBottom: '1px solid #e8e4de', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                    <td style={{ padding: '8px 10px', textAlign: 'center', color: '#888', fontSize: 12 }}>{i + 1}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{l.product}</td>
                    <td style={{ padding: '8px 10px', color: '#555' }}>{l.description}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>{l.qty}</td>
                    <td style={{ padding: '8px 10px', color: '#888' }}>{l.unit}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{fmt(sellUnit, header.currency)}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{fmt(lineEx, header.currency)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', color: '#888' }}>{l.vatPct}%</td>
                    <td style={{ padding: '8px 10px', color: '#888' }}>{fmt(lineVat, header.currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
            <div style={{ width: 300 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e8e4de', fontSize: 13 }}>
                <span style={{ color: '#555' }}>Subtotal (ex-VAT)</span>
                <span style={{ fontWeight: 600 }}>{fmt(totals.ex, header.currency)}</span>
              </div>
              {Object.entries(vatGroups).map(([rate, amt]) => (
                <div key={rate} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e8e4de', fontSize: 13 }}>
                  <span style={{ color: '#555' }}>VAT {rate}%</span>
                  <span style={{ fontWeight: 600 }}>{fmt(amt, header.currency)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', background: '#1A3C5E', color: '#fff', marginTop: 4, borderRadius: 6, paddingLeft: 12, paddingRight: 12 }}>
                <span style={{ fontWeight: 700 }}>Total incl. VAT</span>
                <span style={{ fontWeight: 800, fontSize: 16, color: '#C8860A' }}>{fmt(totals.inc, header.currency)}</span>
              </div>
            </div>
          </div>

          {/* Payment terms + notes */}
          {(header.paymentTerms || header.notes) && (
            <div style={{ borderTop: '1px solid #e8e4de', paddingTop: 16, fontSize: 12 }}>
              {header.paymentTerms && (
                <p style={{ marginBottom: 6 }}><strong>Payment terms:</strong> {header.paymentTerms}</p>
              )}
              {header.notes && (
                <p style={{ color: '#555', whiteSpace: 'pre-line' }}>{header.notes}</p>
              )}
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: 40, borderTop: '1px solid #e8e4de', paddingTop: 12, fontSize: 11, color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
            <span>{header.ourCompany} · {header.ourEmail}</span>
            <span>Quote #{header.quoteNumber} · {header.date}</span>
          </div>
        </div>

      </div>

      {/* ── Email Modal ────────────────────────────────────────────────────── */}
      {emailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm no-print">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Send size={16} className="text-[#C8860A]" />
                <h3 className="font-bold text-gray-900">Send Quotation by Email</h3>
              </div>
              <button type="button" onClick={() => setEmailOpen(false)} title="Close"
                className="p-1 text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* To */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">To *</label>
                <input type="email" value={emailDraft.to}
                  onChange={e => setEmailDraft(d => ({ ...d, to: e.target.value }))}
                  placeholder="client@example.com"
                  className={inp} />
              </div>

              {/* CC */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">CC (optional)</label>
                <input type="email" value={emailDraft.cc}
                  onChange={e => setEmailDraft(d => ({ ...d, cc: e.target.value }))}
                  placeholder="colleague@blikcart.nl"
                  className={inp} />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Subject</label>
                <input type="text" value={emailDraft.subject} title="Email subject" placeholder="Subject"
                  onChange={e => setEmailDraft(d => ({ ...d, subject: e.target.value }))}
                  className={inp} />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Message</label>
                <textarea value={emailDraft.body} rows={7} title="Email message body" placeholder="Write your message…"
                  onChange={e => setEmailDraft(d => ({ ...d, body: e.target.value }))}
                  className={ta} />
                <p className="text-xs text-gray-400 mt-1">The full formatted quotation table is included automatically in the email body.</p>
              </div>

              {/* Result feedback */}
              {emailResult === 'sent' && (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
                  <Check size={15} /> Email sent successfully!
                </div>
              )}
              {emailResult === 'error' && (
                <div className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
                  Failed to send. Check SMTP settings or use the mailto link below.
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              {/* Fallback: open in mail client */}
              <a href={`mailto:${emailDraft.to}?cc=${emailDraft.cc}&subject=${encodeURIComponent(emailDraft.subject)}&body=${encodeURIComponent(emailDraft.body)}`}
                className="text-sm text-[#1A3C5E] underline hover:text-[#112E4D]"
                target="_blank" rel="noreferrer">
                Open in mail client
              </a>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setEmailOpen(false)}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="button" onClick={sendEmail} disabled={!emailDraft.to || emailSending}
                  className="flex items-center gap-2 px-5 py-2 bg-[#C8860A] text-white text-sm font-semibold rounded-lg hover:bg-[#b37509] disabled:opacity-50">
                  {emailSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {emailSending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
