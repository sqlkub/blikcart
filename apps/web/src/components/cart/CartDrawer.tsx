'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart.store';

export default function CartDrawer() {
  const { isOpen, items, subtotal, itemCount, isLoading, toggleCart, removeItem, initCart } = useCartStore();

  useEffect(() => {
    initCart();
  }, []);

  if (!isOpen) return null;

  const shipping = subtotal > 150 ? 0 : 9.95;
  const tax = Math.round(subtotal * 0.21 * 100) / 100;
  const total = subtotal + shipping + tax;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => toggleCart(false)}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300 }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, maxWidth: '95vw',
        background: 'white', zIndex: 301, display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontWeight: 800, fontSize: 18, color: '#1a1a1a', margin: 0 }}>Your Cart</h2>
            {itemCount > 0 && <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 0' }}>{itemCount} item{itemCount !== 1 ? 's' : ''}</p>}
          </div>
          <button onClick={() => toggleCart(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}>✕</button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Loading...</div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
              <p style={{ color: '#6b7280', fontWeight: 600, marginBottom: 8 }}>Your cart is empty</p>
              <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24 }}>Add products to get started</p>
              <button onClick={() => toggleCart(false)} style={{ background: '#1A3C5E', color: 'white', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                Continue Shopping
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {items.map((item: any) => {
                const image = item.product?.images?.[0];
                return (
                  <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 8, background: '#f9fafb', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                      {image ? <img src={image.url} alt={item.product?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🐴'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a', margin: '0 0 2px' }}>{item.product?.name || 'Product'}</p>
                      {item.variant && <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 4px' }}>{item.variant.name}</p>}
                      <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Qty {item.quantity} × €{Number(item.unitPrice).toFixed(2)}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 800, fontSize: 15, color: '#1A3C5E', margin: '0 0 6px' }}>€{Number(item.total).toFixed(2)}</p>
                      <button
                        onClick={() => removeItem(item.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 12, cursor: 'pointer', padding: 0, fontWeight: 600 }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid #f3f4f6', background: 'white' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#6b7280' }}>
                <span>Subtotal</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#6b7280' }}>
                <span>Shipping {subtotal > 150 ? '(free over €150)' : ''}</span>
                <span>{shipping === 0 ? 'Free' : `€${shipping.toFixed(2)}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#6b7280' }}>
                <span>VAT (21%)</span>
                <span>€{tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, color: '#1a1a1a', paddingTop: 8, borderTop: '1px solid #f3f4f6', marginTop: 4 }}>
                <span>Total</span>
                <span>€{total.toFixed(2)}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              onClick={() => toggleCart(false)}
              style={{ display: 'block', textAlign: 'center', background: '#C8860A', color: 'white', padding: '14px', borderRadius: 10, fontWeight: 800, fontSize: 15, textDecoration: 'none', marginBottom: 8 }}
            >
              Proceed to Checkout →
            </Link>
            <button
              onClick={() => toggleCart(false)}
              style={{ display: 'block', width: '100%', textAlign: 'center', background: 'none', border: '2px solid #e5e7eb', color: '#374151', padding: '10px', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
