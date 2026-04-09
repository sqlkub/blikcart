'use client';
import { useState, useRef, useCallback } from 'react';
import { Plus, Trash2, Printer, Download, Save, Check, Copy, RefreshCw } from 'lucide-react';

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
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>Cost = manufacturer price · Margin = your markup · VAT per line</span>
            </div>
          </div>

          {/* Column headers */}
          <div className="grid text-xs font-bold text-gray-400 uppercase tracking-wider px-5 py-2 border-b border-gray-100 bg-gray-50"
            style={{ gridTemplateColumns: '2fr 2fr 60px 60px 110px 80px 90px 110px 110px 110px 70px' }}>
            <span>Product</span>
            <span>Description</span>
            <span>Qty</span>
            <span>Unit</span>
            <span>Mfr. Cost/unit</span>
            <span>Margin %</span>
            <span>Sell price/unit</span>
            <span>Subtotal (ex)</span>
            <span>VAT %</span>
            <span>VAT amount</span>
            <span className="text-right">Actions</span>
          </div>

          {lines.map((l, idx) => {
            const { sellUnit, lineEx, lineVat } = calcLine(l);
            return (
              <div key={l.id} className={`grid items-center gap-1 px-5 py-3 border-b border-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                style={{ gridTemplateColumns: '2fr 2fr 60px 60px 110px 80px 90px 110px 110px 110px 70px' }}>

                <input value={l.product} onChange={e => updateLine(l.id, { product: e.target.value })}
                  placeholder="Product name" title="Product name"
                  className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#1A3C5E]" />

                <input value={l.description} onChange={e => updateLine(l.id, { description: e.target.value })}
                  placeholder="Details / variant" title="Description"
                  className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#1A3C5E]" />

                <input type="number" min={1} value={l.qty} onChange={e => updateLine(l.id, { qty: parseFloat(e.target.value) || 1 })}
                  title="Quantity"
                  className="px-2 py-1.5 border border-gray-200 rounded text-sm text-center focus:outline-none focus:border-[#1A3C5E]" />

                <input value={l.unit} onChange={e => updateLine(l.id, { unit: e.target.value })}
                  placeholder="pcs" title="Unit"
                  className="px-2 py-1.5 border border-gray-200 rounded text-sm text-center focus:outline-none focus:border-[#1A3C5E]" />

                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400 flex-shrink-0">{header.currency}</span>
                  <input type="number" min={0} step={0.01} value={l.unitCost} onChange={e => updateLine(l.id, { unitCost: parseFloat(e.target.value) || 0 })}
                    title="Manufacturer cost per unit" placeholder="0.00"
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#1A3C5E]" />
                </div>

                <div className="flex items-center gap-1">
                  <input type="number" min={0} max={999} step={1} value={l.margin} onChange={e => updateLine(l.id, { margin: parseFloat(e.target.value) || 0 })}
                    title="Margin percentage" placeholder="30"
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
                  <input type="number" min={0} max={100} step={1} value={l.vatPct} onChange={e => updateLine(l.id, { vatPct: parseFloat(e.target.value) || 0 })}
                    title="VAT percentage" placeholder="21"
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
    </>
  );
}
