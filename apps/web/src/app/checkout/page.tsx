'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/store/cart.store';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

export default function CheckoutPage() {
  const router = useRouter();
  const { cartId, items, subtotal, clearCart } = useCartStore();
  const [step, setStep] = useState<'address' | 'confirm' | 'done'>('address');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [form, setForm] = useState({
    fullName: '', streetLine1: '', streetLine2: '', city: '', postalCode: '', countryCode: 'NL',
  });

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login?redirect=/checkout');
      return;
    }
    if (!cartId || items.length === 0) {
      router.push('/');
    }
  }, [cartId, items, router]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handlePlaceOrder() {
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');

      // Create address
      const addrRes = await fetch(`${API}/auth/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, isDefault: true }),
      });
      if (!addrRes.ok) throw new Error('Could not save address');
      const addr = await addrRes.json();

      // Place order
      const orderRes = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cartId, shippingAddressId: addr.id }),
      });
      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.message || 'Could not place order');
      }
      const order = await orderRes.json();
      setOrderId(order.id);
      setOrderNumber(order.orderNumber);
      clearCart();
      setStep('done');
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const shipping = subtotal > 150 ? 0 : 9.95;
  const tax = Math.round(subtotal * 0.21 * 100) / 100;
  const total = subtotal + shipping + tax;

  if (step === 'done') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: 'white', borderRadius: 16, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ width: 72, height: 72, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 20px' }}>✓</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>Order Placed!</h1>
          <p style={{ color: '#6b7280', marginBottom: 4 }}>Your order number is:</p>
          <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--gold)', marginBottom: 24 }}>{orderNumber}</p>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 32 }}>We'll send you a confirmation email shortly. You can track your order in your account.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link href="/account" style={{ background: 'var(--navy)', color: 'white', padding: '12px 24px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>View My Orders</Link>
            <Link href="/" style={{ background: 'white', color: 'var(--navy)', border: '2px solid var(--navy)', padding: '12px 24px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', padding: '40px 24px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <Link href="/" style={{ color: '#6b7280', fontSize: 14, textDecoration: 'none' }}>← Back</Link>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy)', marginTop: 8 }}>Checkout</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
          {/* Address form */}
          <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 24 }}>Shipping Address</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Full Name *</label>
                <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Jane Smith"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Street Address *</label>
                <input name="streetLine1" value={form.streetLine1} onChange={handleChange} placeholder="123 Main Street"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Apartment, suite, etc. (optional)</label>
                <input name="streetLine2" value={form.streetLine2} onChange={handleChange} placeholder="Apt 2B"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>City *</label>
                  <input name="city" value={form.city} onChange={handleChange} placeholder="Amsterdam"
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Postal Code *</label>
                  <input name="postalCode" value={form.postalCode} onChange={handleChange} placeholder="1234 AB"
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Country *</label>
                <select name="countryCode" value={form.countryCode} onChange={handleChange}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', background: 'white', boxSizing: 'border-box' }}>
                  <option value="NL">Netherlands</option>
                  <option value="BE">Belgium</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="GB">United Kingdom</option>
                  <option value="ES">Spain</option>
                  <option value="IT">Italy</option>
                  <option value="PL">Poland</option>
                  <option value="SE">Sweden</option>
                  <option value="DK">Denmark</option>
                  <option value="NO">Norway</option>
                  <option value="FI">Finland</option>
                  <option value="AT">Austria</option>
                  <option value="CH">Switzerland</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                </select>
              </div>
            </div>

            {error && (
              <div style={{ marginTop: 16, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 14 }}>
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={submitting || !form.fullName || !form.streetLine1 || !form.city || !form.postalCode}
              style={{
                marginTop: 24, width: '100%', padding: '14px', background: submitting || !form.fullName || !form.streetLine1 || !form.city || !form.postalCode ? '#9ca3af' : '#C8860A',
                color: 'white', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 800,
                cursor: submitting || !form.fullName ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Placing Order…' : `Place Order · €${total.toFixed(2)}`}
            </button>
          </div>

          {/* Order summary */}
          <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 16 }}>Order Summary</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              {items.map((item: any) => {
                const image = item.product?.images?.[0];
                return (
                  <div key={item.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 8, background: '#f9fafb', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      {image ? <img src={image.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🐴'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{item.product?.name}</p>
                      <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Qty {item.quantity}</p>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>€{Number(item.total).toFixed(2)}</p>
                  </div>
                );
              })}
            </div>
            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280' }}>
                <span>Subtotal</span><span>€{subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280' }}>
                <span>Shipping</span><span>{shipping === 0 ? 'Free' : `€${shipping.toFixed(2)}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280' }}>
                <span>VAT (21%)</span><span>€{tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, color: '#1a1a1a', paddingTop: 8, borderTop: '1px solid #f3f4f6', marginTop: 4 }}>
                <span>Total</span><span>€{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
