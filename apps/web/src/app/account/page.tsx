'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Draft',     color: '#9ca3af' },
  submitted: { label: 'Submitted', color: '#3b82f6' },
  quoted:    { label: 'Quoted',    color: '#f59e0b' },
  approved:  { label: 'Approved',  color: '#22c55e' },
  declined:  { label: 'Declined',  color: '#ef4444' },
};

export default function AccountPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) { router.push('/login'); return; }

    fetch(`${API}/quotes/custom-orders`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ background: 'var(--navy)', color: 'white', padding: '40px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>My Account</p>
            <h1 style={{ fontSize: 26, fontWeight: 800 }}>{user?.fullName || 'Welcome back'}</h1>
            <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 4 }}>{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            style={{ padding: '10px 22px', border: '2px solid rgba(255,255,255,0.3)', borderRadius: 8, background: 'transparent', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)', marginBottom: 20 }}>My Quote Requests</h2>

        {loading ? (
          <div style={{ background: 'white', borderRadius: 12, padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
        ) : orders.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 12, padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
            <h3 style={{ color: 'var(--navy)', fontWeight: 700, marginBottom: 8 }}>No quote requests yet</h3>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>Customise a product and submit a quote request to get started.</p>
            <Link href="/" style={{ background: 'var(--gold)', color: 'white', padding: '10px 28px', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>
              Browse Products
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {orders.map((order: any) => {
              const st = STATUS_LABEL[order.status] || { label: order.status, color: '#6b7280' };
              const image = order.product?.images?.[0];
              return (
                <div key={order.id} style={{ background: 'white', borderRadius: 12, padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--cream)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, overflow: 'hidden' }}>
                    {image ? <img src={image.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🐴'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <p style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 15 }}>{order.product?.name || 'Custom Product'}</p>
                        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                          Qty {order.quantity} · Submitted {new Date(order.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: `${st.color}18`, color: st.color }}>
                        {st.label}
                      </span>
                    </div>
                    {order.quote && (
                      <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--cream)', borderRadius: 8, display: 'flex', gap: 24 }}>
                        <div>
                          <p style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Unit price</p>
                          <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--gold)' }}>€{Number(order.quote.unitPrice).toFixed(2)}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</p>
                          <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)' }}>€{Number(order.quote.totalPrice).toFixed(2)}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quote status</p>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>{order.quote.status}</p>
                        </div>
                      </div>
                    )}
                    {order.estimatedPriceMin && !order.quote && (
                      <p style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>
                        Est. €{order.estimatedPriceMin.toFixed(2)} – €{order.estimatedPriceMax?.toFixed(2)} per unit · {order.quantity} units
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
