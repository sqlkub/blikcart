'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/store/cart.store';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

const CONFIGURATOR_MAP: Record<string, string> = {
  bridles: 'bridles',
  'dressage-bridles': 'bridles',
  'jumping-bridles': 'bridles',
  browbands: 'bridles',
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

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [addons, setAddons] = useState<any[]>([]);
  const [addonAdding, setAddonAdding] = useState<string | null>(null);
  const { addItem } = useCartStore();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API}/products/${slug}`);
        if (!res.ok) { setNotFound(true); return; }
        const data = await res.json();
        const p = data.data ?? data;
        setProduct(p);
        const primary = p.images?.findIndex((i: any) => i.isPrimary);
        if (primary > 0) setActiveImage(primary);
        if (p.variants?.length > 0) setSelectedVariant(p.variants[0]);
        setQuantity(p.moq || 1);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  useEffect(() => {
    fetch(`${API}/products?tags=addon&limit=8`)
      .then(r => r.json())
      .then(d => setAddons((d.data || []).filter((a: any) => a.slug !== slug)))
      .catch(() => {});
  }, [slug]);

  async function handleAddToCart() {
    if (!product) return;
    setAdding(true);
    try {
      await addItem(product.id, quantity, selectedVariant?.id);
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🐴</div>
          <p style={{ color: '#6b7280' }}>Loading product…</p>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>Product Not Found</h1>
          <p style={{ color: '#6b7280', marginBottom: 24 }}>This product doesn't exist or has been removed.</p>
          <button type="button" onClick={() => router.back()} style={{ background: 'var(--navy)', color: 'white', border: 'none', padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const configSlug = CONFIGURATOR_MAP[product.category?.slug] || product.category?.slug;
  const unitPrice = Number(product.basePrice) + (selectedVariant ? Number(selectedVariant.priceModifier) : 0);
  const totalPrice = unitPrice * quantity;
  const images: any[] = product.images?.length > 0 ? product.images : [];
  const variantImageUrl: string | null = selectedVariant?.imageUrl || null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Breadcrumb */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '12px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280' }}>
          <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link href={`/products/${product.category.slug}`} style={{ color: '#6b7280', textDecoration: 'none' }}>{product.category.name}</Link>
              <span>/</span>
            </>
          )}
          <span style={{ color: 'var(--navy)', fontWeight: 600 }}>{product.name}</span>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 48, alignItems: 'start' }}>

          {/* ── Left: Image gallery ── */}
          <div>
            {/* Main image — shows variant swatch image when a variant is selected */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, position: 'relative' }}>
              {variantImageUrl ? (
                <img src={variantImageUrl} alt={selectedVariant?.color || product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : images.length > 0 ? (
                <img
                  src={images[activeImage]?.url}
                  alt={images[activeImage]?.altText || product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: 80 }}>🐴</span>
              )}
              {product.isCustomizable && (
                <span style={{ position: 'absolute', top: 12, left: 12, background: 'var(--gold)', color: 'white', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>🎨 Customizable</span>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {images.map((img: any, i: number) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    style={{
                      width: 72,
                      height: 72,
                      border: i === activeImage ? '2px solid var(--gold)' : '2px solid #e5e7eb',
                      borderRadius: 8,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      background: 'white',
                      padding: 0,
                      flexShrink: 0,
                    }}
                  >
                    <img src={img.url} alt={img.altText || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Product info ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Name + category badge */}
            <div>
              {product.category && (
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {product.category.name}
                </span>
              )}
              <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy)', marginTop: 4, lineHeight: 1.2 }}>{product.name}</h1>
              {product.sku && <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>SKU: {product.sku}</p>}
            </div>

            {/* Price */}
            <div style={{ background: 'white', borderRadius: 12, padding: '16px 20px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--navy)' }}>€{unitPrice.toFixed(2)}</span>
                <span style={{ fontSize: 14, color: '#6b7280' }}>per unit</span>
              </div>
              {product.moq > 1 && (
                <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Minimum order: {product.moq} units</p>
              )}
              {product.leadTimeDays > 0 && (
                <p style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Lead time: {product.leadTimeDays} days</p>
              )}
              {quantity > 1 && (
                <p style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 600, marginTop: 6 }}>
                  Total: €{totalPrice.toFixed(2)} for {quantity} units
                </p>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>Description</h2>
                <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.7 }}>{product.description}</p>
              </div>
            )}

            {/* Variants */}
            {product.variants?.length > 0 && (
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 10 }}>Options</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {product.variants.map((v: any) => {
                    const isSelected = selectedVariant?.id === v.id;
                    const label = [v.size, v.color, v.material].filter(Boolean).join(' · ') || v.sku;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        style={{
                          padding: v.imageUrl ? '4px 12px 4px 4px' : '8px 16px',
                          borderRadius: 10,
                          fontSize: 13,
                          fontWeight: 600,
                          border: '2px solid',
                          borderColor: isSelected ? 'var(--gold)' : '#e5e7eb',
                          background: isSelected ? '#fff8ee' : 'white',
                          color: '#374151',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          boxShadow: isSelected ? '0 0 0 2px var(--gold)' : 'none',
                        }}
                      >
                        {v.imageUrl && (
                          <img src={v.imageUrl} alt={label} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0, border: '1px solid #e5e7eb' }} />
                        )}
                        <span>
                          {label}
                          {v.priceModifier !== 0 && (
                            <span style={{ marginLeft: 6, opacity: 0.7, fontSize: 12 }}>
                              ({v.priceModifier > 0 ? '+' : ''}€{Number(v.priceModifier).toFixed(2)})
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            {!product.isCustomizable && (
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 10 }}>Quantity</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, width: 'fit-content', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.max(product.moq || 1, q - 1))}
                    style={{ width: 40, height: 40, background: 'white', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--navy)', fontWeight: 700 }}
                  >−</button>
                  <span style={{ width: 52, textAlign: 'center', fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(q => q + 1)}
                    style={{ width: 40, height: 40, background: 'white', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--navy)', fontWeight: 700 }}
                  >+</button>
                </div>
              </div>
            )}

            {/* CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {product.isCustomizable ? (
                <Link
                  href={`/customize/${configSlug}?productId=${product.id}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--gold)', color: 'white', padding: '14px 20px', borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}
                >
                  🎨 Configure & Order →
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={adding}
                  style={{ width: '100%', background: added ? '#16a34a' : adding ? '#9ca3af' : 'var(--navy)', color: 'white', border: 'none', padding: '14px 20px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: adding ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
                >
                  {added ? '✓ Added to Cart!' : adding ? 'Adding…' : '🛒 Add to Cart'}
                </button>
              )}
              <button
                type="button"
                onClick={() => router.back()}
                style={{ width: '100%', background: 'white', color: 'var(--navy)', border: '2px solid var(--navy)', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                ← Back to Products
              </button>
            </div>

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 4 }}>
                {product.tags.map((tag: string) => (
                  <span key={tag} style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', background: '#f3f4f6', borderRadius: 20, padding: '3px 10px' }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add-ons section */}
      {addons.length > 0 && (
        <div style={{ marginTop: 48, paddingTop: 40, borderTop: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)', marginBottom: 20 }}>
            🧩 Frequently Added Together
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {addons.map((a: any) => {
              const img = a.images?.find((i: any) => i.isPrimary) || a.images?.[0];
              return (
                <div key={a.id} style={{ background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ aspectRatio: '1', background: '#f9f9f9', position: 'relative' }}>
                    {img
                      ? <img src={img.url} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🐴</div>}
                    <span style={{ position: 'absolute', top: 6, left: 6, background: 'var(--gold)', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>Add-on</span>
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 4, lineHeight: 1.3 }}>{a.name}</p>
                    <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', marginBottom: 10 }}>€{Number(a.basePrice).toFixed(2)}</p>
                    <button
                      type="button"
                      disabled={addonAdding === a.id}
                      onClick={async () => {
                        setAddonAdding(a.id);
                        try { await addItem(a.id, a.moq || 1); } finally { setAddonAdding(null); }
                      }}
                      style={{ width: '100%', background: addonAdding === a.id ? '#9ca3af' : 'var(--navy)', color: 'white', border: 'none', padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      {addonAdding === a.id ? 'Adding…' : '+ Add to Cart'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
