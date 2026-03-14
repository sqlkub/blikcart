'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/store/cart.store';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

const CONFIGURATOR_MAP: Record<string, string> = {
  bridles: 'bridles',
  'dressage-bridles': 'bridles',
  'jumping-bridles': 'bridles',
  browbands: 'browbands',
  halters: 'halters',
  'horse-reins': 'horse-reins',
  girths: 'girths',
  headpieces: 'halters',
  nosebands: 'bridles',
  cheekpieces: 'bridles',
  backstraps: 'bridles',
  throatlatches: 'bridles',
  'flash-straps': 'bridles',
  reins: 'bridles',
};

function getConfiguratorSlug(product: any): string {
  return CONFIGURATOR_MAP[product.category?.slug] || 'bridles';
}

export default function ProductsPage() {
  const params = useParams();
  const category = params.category as string;
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const { addItem } = useCartStore();

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const catRes = await fetch(`${API}/products/categories`);
        const catData = await catRes.json();
        const targetCat = catData.find((c: any) => c.slug === category);
        const children = targetCat?.children || [];
        const grandchildren = children.flatMap((c: any) => c.children || []);
        setFilters(grandchildren.length > 0 ? children : children);
        const allSlugs = [category, ...children.map((c: any) => c.slug), ...grandchildren.map((c: any) => c.slug)];
        const allProducts: any[] = [];
        await Promise.all(allSlugs.map(async (slug) => {
          const res = await fetch(`${API}/products?categorySlug=${slug}&limit=50`);
          const data = await res.json();
          allProducts.push(...(data.data || []));
        }));
        const seen = new Set();
        setProducts(allProducts.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; }));
      } catch (e) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [category]);

  async function handleAddToCart(productId: string) {
    setAddingId(productId);
    try {
      await addItem(productId, 1);
    } finally {
      setAddingId(null);
    }
  }

  const label = category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    if (!activeFilter) return matchSearch;
    const catSlug = p.category?.slug || '';
    const matchFilter = catSlug === activeFilter ||
      filters.find((f: any) => f.slug === activeFilter)?.children?.some((gc: any) => gc.slug === catSlug);
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ background: 'var(--navy)', color: 'white', padding: '48px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h1 style={{ fontSize: 32, fontWeight: 700 }}>{label}</h1>
          <p style={{ color: '#d1d5db', marginTop: 8 }}>{products.length} products available</p>
        </div>
      </div>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
        {filters.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
            <button onClick={() => setActiveFilter(null)} style={{ padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: '2px solid', borderColor: !activeFilter ? 'var(--navy)' : '#e5e7eb', background: !activeFilter ? 'var(--navy)' : 'white', color: !activeFilter ? 'white' : '#374151', cursor: 'pointer' }}>
              All ({products.length})
            </button>
            {filters.map((f: any) => {
              const count = products.filter(p => {
                const s = p.category?.slug || '';
                return s === f.slug || (f.children || []).some((gc: any) => gc.slug === s);
              }).length;
              return (
                <button key={f.id} onClick={() => setActiveFilter(activeFilter === f.slug ? null : f.slug)} style={{ padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: '2px solid', borderColor: activeFilter === f.slug ? 'var(--gold)' : '#e5e7eb', background: activeFilter === f.slug ? 'var(--gold)' : 'white', color: activeFilter === f.slug ? 'white' : '#374151', cursor: 'pointer' }}>
                  {f.name} ({count})
                </button>
              );
            })}
          </div>
        )}
        <div style={{ position: 'relative', maxWidth: 400, marginBottom: 24 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>🔍</span>
          <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: 36, paddingRight: 16, paddingTop: 10, paddingBottom: 10, border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', background: 'white' }} />
        </div>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                <div style={{ aspectRatio: '1', background: '#f3f4f6' }} />
                <div style={{ padding: 16 }}>
                  <div style={{ height: 16, background: '#f3f4f6', borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ height: 12, background: '#f3f4f6', borderRadius: 4, width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {filtered.map(p => {
              const configSlug = getConfiguratorSlug(p);
              const primaryImage = p.images?.find((i: any) => i.isPrimary) || p.images?.[0];
              return (
                <div key={p.id} style={{ background: 'white', borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <div style={{ aspectRatio: '1', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, position: 'relative' }}>
                    {primaryImage ? <img src={primaryImage.url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🐴'}
                    {p.isCustomizable && <span style={{ position: 'absolute', top: 8, left: 8, background: 'var(--gold)', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>🎨 Customizable</span>}
                    {p.category && <span style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(26,60,94,0.85)', color: 'white', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>{p.category.name}</span>}
                  </div>
                  <div style={{ padding: 16 }}>
                    <h3 style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 15, marginBottom: 4 }}>{p.name}</h3>
                    <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12, lineHeight: 1.4 }}>{p.description?.slice(0, 80)}{p.description?.length > 80 ? '...' : ''}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)' }}>€{Number(p.basePrice).toFixed(2)}</span>
                      {p.moq > 1 && <span style={{ fontSize: 12, color: '#9ca3af' }}>MOQ {p.moq}</span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {!p.isCustomizable && (
                        <button
                          type="button"
                          onClick={() => handleAddToCart(p.id)}
                          disabled={addingId === p.id}
                          style={{ width: '100%', background: addingId === p.id ? '#9ca3af' : 'var(--navy)', color: 'white', border: 'none', padding: '10px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: addingId === p.id ? 'not-allowed' : 'pointer' }}
                        >
                          {addingId === p.id ? 'Adding…' : '🛒 Add to Cart'}
                        </button>
                      )}
                      {p.isCustomizable && (
                        <Link href={`/customize/${configSlug}?productId=${p.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--gold)', color: 'white', padding: '10px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>🎨 Customize & Order →</Link>
                      )}
                      <Link href={`/products/${p.category?.slug || category}/${p.slug}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--navy)', color: 'var(--navy)', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>View Details</Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 0', background: 'white', borderRadius: 12 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🐴</div>
            <p style={{ color: '#6b7280', fontSize: 16 }}>No products found</p>
            <Link href="/" style={{ display: 'inline-block', marginTop: 16, color: 'var(--gold)', fontWeight: 600 }}>← Back to Home</Link>
          </div>
        )}
      </div>
    </div>
  );
}
