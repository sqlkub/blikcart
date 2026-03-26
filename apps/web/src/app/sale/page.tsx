'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart.store';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

const DEFAULT = {
  hero: {
    eyebrow: 'Limited Time',
    title: 'Sale & Giveaways',
    subtitle: 'Handpicked deals on premium saddlery — plus free products up for grabs.',
    countdownEnd: '',   // ISO date string, e.g. "2026-04-30T23:59:59Z"
  },
  saleBadgeText:    'SALE',
  giveawayBadgeText:'GIVEAWAY',
  giveawaySection: {
    title: 'Win Free Products',
    body:  'Follow us on social media and share your purchase for a chance to win one of these premium items.',
  },
  noSaleText:     'No sale items at the moment — check back soon!',
  noGiveawayText: 'No giveaways running right now — follow us to be the first to know.',
};

function useCountdown(end: string) {
  const calc = () => {
    if (!end) return null;
    const diff = new Date(end).getTime() - Date.now();
    if (diff <= 0) return null;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { d, h, m, s };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    if (!end) return;
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [end]);
  return time;
}

function CountdownUnit({ val, label }: { val: number; label: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 60 }}>
      <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', fontSize: 28, fontWeight: 800, lineHeight: 1, color: 'white', fontVariantNumeric: 'tabular-nums' }}>
        {String(val).padStart(2, '0')}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
    </div>
  );
}

function ProductCard({ p, badge, badgeColor, addingId, onAdd }: {
  p: any; badge: string; badgeColor: string;
  addingId: string | null; onAdd: (id: string) => void;
}) {
  const img = p.images?.find((i: any) => i.isPrimary) || p.images?.[0];
  const isGiveaway = p.tags?.includes('giveaway');
  return (
    <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1.5px solid #e8e4de', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
      {/* Image */}
      <Link href={`/products/${p.category?.slug || 'products'}/${p.slug}`} style={{ display: 'block', position: 'relative', background: '#ffffff', aspectRatio: '1', padding: 12 }}>
        {img
          ? <img src={img.url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, opacity: 0.12, color: '#aaa' }}>BK</div>
        }
        <span style={{ position: 'absolute', top: 10, left: 10, background: badgeColor, color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20, letterSpacing: '0.06em' }}>
          {badge}
        </span>
      </Link>

      {/* Info */}
      <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {p.category && <span style={{ fontSize: 11, fontWeight: 600, color: '#C8860A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{p.category.name}</span>}
        <Link href={`/products/${p.category?.slug || 'products'}/${p.slug}`} style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a', lineHeight: 1.3 }}>
          {p.name}
        </Link>
        {p.description && (
          <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, margin: 0 }}>
            {p.description.slice(0, 80)}{p.description.length > 80 ? '…' : ''}
          </p>
        )}

        <div style={{ marginTop: 'auto', paddingTop: 10 }}>
          {isGiveaway ? (
            <div style={{ background: 'linear-gradient(135deg, #1a1a1a, #2d2017)', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
              <p style={{ color: '#C8860A', fontWeight: 800, fontSize: 14, margin: 0 }}>🎁 Free Giveaway</p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '4px 0 0' }}>See giveaway rules below</p>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#dc2626' }}>€{Number(p.basePrice).toFixed(2)}</span>
              {p.moq > 1 && <span style={{ fontSize: 12, color: '#9ca3af' }}>MOQ {p.moq}</span>}
            </div>
          )}

          {!isGiveaway && (
            <button type="button"
              onClick={() => onAdd(p.id)}
              disabled={addingId === p.id}
              style={{ width: '100%', background: addingId === p.id ? '#9ca3af' : '#1a1a1a', color: '#fff', border: 'none', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: addingId === p.id ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}>
              {addingId === p.id ? 'Adding…' : 'Add to Cart'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SalePage() {
  const [content, setContent] = useState(DEFAULT);
  const [saleProducts, setSaleProducts]         = useState<any[]>([]);
  const [giveawayProducts, setGiveawayProducts] = useState<any[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [addingId, setAddingId]                 = useState<string | null>(null);
  const { addItem } = useCartStore();
  const countdown = useCountdown(content.hero.countdownEnd);

  useEffect(() => {
    // Load CMS content
    fetch(`${API}/content/pages/sale`)
      .then(r => r.ok ? r.json() : null)
      .then(p => {
        if (p?.content) try { setContent(c => ({ ...c, ...JSON.parse(p.content) })); } catch {}
      }).catch(() => {});

    // Load products
    async function fetchProducts() {
      setLoading(true);
      try {
        const [saleRes, gwRes] = await Promise.all([
          fetch(`${API}/products?tags=sale&limit=50`),
          fetch(`${API}/products?tags=giveaway&limit=20`),
        ]);
        const saleData = await saleRes.json();
        const gwData   = await gwRes.json();
        setSaleProducts(saleData.data || []);
        setGiveawayProducts(gwData.data || []);
      } catch {
        setSaleProducts([]);
        setGiveawayProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  async function handleAdd(productId: string) {
    setAddingId(productId);
    try { await addItem(productId, 1); }
    finally { setAddingId(null); }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#faf9f7' }}>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1a0a00 0%, #2d1200 50%, #1a1a1a 100%)', color: '#fff', padding: 'clamp(56px, 7vw, 88px) 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: '#C8860A', fontWeight: 700, marginBottom: 14 }}>
          🔥 {content.hero.eyebrow}
        </p>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          {content.hero.title}
        </h1>
        <p style={{ fontSize: 16, color: '#aaa', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.7 }}>
          {content.hero.subtitle}
        </p>

        {/* Countdown */}
        {countdown && (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <CountdownUnit val={countdown.d} label="Days" />
            <CountdownUnit val={countdown.h} label="Hours" />
            <CountdownUnit val={countdown.m} label="Mins" />
            <CountdownUnit val={countdown.s} label="Secs" />
          </div>
        )}
      </section>

      {/* Sale Products */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(40px, 5vw, 64px) 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>On Sale</h2>
          {!loading && saleProducts.length > 0 && (
            <span style={{ fontSize: 13, color: '#6b7280' }}>{saleProducts.length} item{saleProducts.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {loading ? (
          <div className="categories-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1.5px solid #e8e4de' }}>
                <div style={{ aspectRatio: '1', background: '#f3f4f6' }} />
                <div style={{ padding: 16 }}>
                  <div style={{ height: 14, background: '#f3f4f6', borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ height: 10, background: '#f3f4f6', borderRadius: 4, width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : saleProducts.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {saleProducts.map(p => (
              <ProductCard key={p.id} p={p} badge={content.saleBadgeText} badgeColor="#dc2626"
                addingId={addingId} onAdd={handleAdd} />
            ))}
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 14, padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>🏷️</p>
            <p style={{ color: '#6b7280', fontSize: 15 }}>{content.noSaleText}</p>
          </div>
        )}
      </section>

      {/* Divider */}
      <div style={{ maxWidth: 1200, margin: '48px auto 0', padding: '0 24px' }}>
        <div style={{ height: 1, background: 'linear-gradient(to right, transparent, #e8e4de, transparent)' }} />
      </div>

      {/* Giveaway */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(40px, 5vw, 64px) 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: '0 0 8px' }}>
            🎁 {content.giveawaySection.title}
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0, maxWidth: 600, lineHeight: 1.7 }}>
            {content.giveawaySection.body}
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {[1, 2].map(i => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1.5px solid #e8e4de' }}>
                <div style={{ aspectRatio: '1', background: '#f3f4f6' }} />
                <div style={{ padding: 16 }}>
                  <div style={{ height: 14, background: '#f3f4f6', borderRadius: 4, marginBottom: 8 }} />
                </div>
              </div>
            ))}
          </div>
        ) : giveawayProducts.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {giveawayProducts.map(p => (
              <ProductCard key={p.id} p={p} badge={content.giveawayBadgeText} badgeColor="#C8860A"
                addingId={addingId} onAdd={handleAdd} />
            ))}
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 14, padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>🎁</p>
            <p style={{ color: '#6b7280', fontSize: 15 }}>{content.noGiveawayText}</p>
          </div>
        )}

        {/* Giveaway CTA */}
        {giveawayProducts.length > 0 && (
          <div style={{ marginTop: 32, background: 'linear-gradient(135deg, #1a1a1a, #2d2017)', borderRadius: 16, padding: 'clamp(24px, 4vw, 40px)', textAlign: 'center', color: '#fff' }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>How to Enter</h3>
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
              {[
                { step: '1', text: 'Follow @blikcart on Instagram' },
                { step: '2', text: 'Like this post and tag a friend' },
                { step: '3', text: 'Winner announced every Friday' },
              ].map(s => (
                <div key={s.step} style={{ textAlign: 'center', maxWidth: 160 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#C8860A', color: '#fff', fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>{s.step}</div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: 0 }}>{s.text}</p>
                </div>
              ))}
            </div>
            <Link href="/contact" style={{ display: 'inline-block', background: '#C8860A', color: '#fff', fontWeight: 700, padding: '11px 28px', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}>
              Contact Us for Details
            </Link>
          </div>
        )}
      </section>

    </main>
  );
}
