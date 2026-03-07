'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

export default function CustomOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quoteForm, setQuoteForm] = useState({ unitPrice: '', leadTimeDays: '21', message: '' });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await axios.get(`${API}/quotes/custom-orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrder(res.data);
        if (res.data.estimatedPriceMin) {
          setQuoteForm(f => ({ ...f, unitPrice: res.data.estimatedPriceMin.toString() }));
        }
      } catch { } finally { setLoading(false); }
    }
    load();
  }, [id]);

  const sendQuote = async () => {
    setSending(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API}/quotes/send`, {
        customOrderId: id,
        unitPrice: parseFloat(quoteForm.unitPrice),
        leadTimeDays: parseInt(quoteForm.leadTimeDays),
        message: quoteForm.message,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess(true);
    } catch { } finally { setSending(false); }
  };

  if (loading) return <div className="animate-pulse text-gray-400 p-8">Loading order...</div>;
  if (!order) return <div className="text-red-500 p-8">Order not found</div>;

  const snapshot = order.configSnapshot || {};
  const steps = (order.schemaVersion?.steps as any[]) || [];
  const qty = order.quantity || 1;
  const estTotal = parseFloat(quoteForm.unitPrice || '0') * qty;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-navy text-sm">← Back</button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Custom Order #{order.id.slice(0, 8).toUpperCase()}</h1>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            order.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' :
            order.status === 'quoted' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {order.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config snapshot */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 mb-4">Configuration</h2>
            <div className="grid grid-cols-2 gap-3">
              {steps.map((step: any) => {
                const selId = snapshot[step.id];
                const opt = step.options?.find((o: any) => o.id === selId);
                return (
                  <div key={step.id} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{step.title}</p>
                    <p className="font-semibold text-navy text-sm mt-0.5">{opt?.label || '—'}</p>
                    {opt?.price_modifier > 0 && <p className="text-xs text-gold">+€{opt.price_modifier}</p>}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex gap-4 text-sm text-gray-600">
              <span>Qty: <strong>{qty}</strong></span>
              <span>Buyer: <strong>{order.user?.fullName}</strong></span>
              <span>Company: <strong>{order.user?.companyName || 'Retail'}</strong></span>
            </div>
            {order.notes && (
              <div className="mt-4 p-3 bg-gold/5 border border-gold/20 rounded-lg text-sm text-gray-700">
                <p className="font-semibold text-gold text-xs mb-1">BUYER NOTES</p>
                {order.notes}
              </div>
            )}
          </div>
        </div>

        {/* Quote form */}
        <div className="space-y-4">
          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">✅</div>
              <p className="font-bold text-green-700">Quote Sent!</p>
              <p className="text-sm text-green-600 mt-1">Buyer has been notified by email</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-900 mb-4">Send Quote</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Unit Price (€)</label>
                  <input
                    type="number"
                    value={quoteForm.unitPrice}
                    onChange={e => setQuoteForm(f => ({ ...f, unitPrice: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Lead Time (days)</label>
                  <input
                    type="number"
                    value={quoteForm.leadTimeDays}
                    onChange={e => setQuoteForm(f => ({ ...f, leadTimeDays: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Message to Buyer</label>
                  <textarea
                    value={quoteForm.message}
                    onChange={e => setQuoteForm(f => ({ ...f, message: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold resize-none h-20"
                    placeholder="Any notes about materials, timing, etc..."
                  />
                </div>
                {quoteForm.unitPrice && (
                  <div className="bg-navy text-white rounded-lg p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Unit Price</span>
                      <span className="font-semibold">€{parseFloat(quoteForm.unitPrice).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-300">Total ({qty} units)</span>
                      <span className="font-bold text-gold">€{estTotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                <button
                  onClick={sendQuote}
                  disabled={!quoteForm.unitPrice || sending}
                  className="w-full bg-gold text-white py-3 rounded-lg font-bold text-sm hover:bg-amber-600 disabled:opacity-50 transition-colors"
                >
                  {sending ? 'Sending...' : '📤 Send Quote to Buyer'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
