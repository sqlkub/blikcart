'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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

const COLOR_HEX: Record<string, string> = {
  black: '#1a1a1a', navy: '#1A3C5E', 'navy blue': '#1A3C5E',
  brown: '#6B3A2A', havana: '#6B3A2A', 'brown havana': '#6B3A2A',
  cognac: '#9B5523', caramel: '#C67D3A', tan: '#d2691e',
  burgundy: '#800020', red: '#cc0000', white: '#f8f8f8',
  grey: '#9ca3af', gray: '#9ca3af', blue: '#1e3a8a',
  green: '#2D5016', 'forest green': '#2D5016',
  'rose gold': '#B76E79', gold: '#C8860A', silver: '#C0C0C0',
};

const tc = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const [product, setProduct]               = useState<any>(null);
  const [loading, setLoading]               = useState(true);
  const [notFound, setNotFound]             = useState(false);
  const [activeImage, setActiveImage]       = useState(0);
  const [variantImgOverride, setVarImgOvr] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selSize, setSelSize]               = useState<string | null>(null);
  const [selColor, setSelColor]             = useState<string | null>(null);
  const [selMaterial, setSelMaterial]       = useState<string | null>(null);
  const [quantity, setQuantity]             = useState(1);
  const [adding, setAdding]                 = useState(false);
  const [added, setAdded]                   = useState(false);
  const [addons, setAddons]                 = useState<any[]>([]);
  const [addonAdding, setAddonAdding]       = useState<string | null>(null);
  const [lightbox, setLightbox]             = useState<{ open: boolean; idx: number }>({ open: false, idx: 0 });
  const { addItem } = useCartStore();

  const openLightbox = useCallback((idx: number) => setLightbox({ open: true, idx }), []);
  const closeLightbox = useCallback(() => setLightbox(l => ({ ...l, open: false })), []);

  // Keyboard navigation in lightbox
  useEffect(() => {
    if (!lightbox.open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') setLightbox(l => ({ ...l, idx: Math.min(l.idx + 1, (product?.images?.length ?? 1) - 1) }));
      if (e.key === 'ArrowLeft')  setLightbox(l => ({ ...l, idx: Math.max(l.idx - 1, 0) }));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox.open, closeLightbox, product?.images?.length]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API}/products/${slug}`);
        if (!res.ok) { setNotFound(true); return; }
        const data = await res.json();
        const raw = data.data ?? data;
        if (raw.variants) {
          raw.variants = raw.variants.map((v: any) => ({
            ...v,
            size: v.size ? tc(v.size) : v.size,
            color: v.color ? tc(v.color) : v.color,
            material: v.material ? tc(v.material) : v.material,
          }));
        }
        setProduct(raw);
        const primaryIdx = raw.images?.findIndex((i: any) => i.isPrimary);
        if (primaryIdx > 0) setActiveImage(primaryIdx);

        if (raw.variants?.length > 0) {
          const urlId = searchParams.get('variant');
          const preselect = urlId ? raw.variants.find((v: any) => v.id === urlId) : null;
          const first = preselect
            || raw.variants.find((v: any) => (v.stockQty ?? 1) > 0)
            || raw.variants[0];
          applyVariant(first);
        }
        setQuantity(raw.moq || 1);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    fetch(`${API}/products?tags=addon&limit=8`)
      .then(r => r.json())
      .then(d => setAddons((d.data || []).filter((a: any) => a.slug !== slug)))
      .catch(() => {});
  }, [slug]);

  // Keep URL in sync with selected variant
  useEffect(() => {
    if (selectedVariant && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('variant', selectedVariant.id);
      window.history.replaceState({}, '', url.toString());
    }
  }, [selectedVariant?.id]);

  function applyVariant(v: any) {
    setSelectedVariant(v);
    setSelSize(v.size || null);
    setSelColor(v.color || null);
    setSelMaterial(v.material || null);
    if (v.imageUrl) setVarImgOvr(v.imageUrl);
    else setVarImgOvr(null);
  }

  function pickVariant(attr: 'size' | 'color' | 'material', val: string) {
    if (!product?.variants) return;
    const vs: any[] = product.variants;
    const ns = attr === 'size'     ? val : selSize;
    const nc = attr === 'color'    ? val : selColor;
    const nm = attr === 'material' ? val : selMaterial;

    const find = (s: string | null, c: string | null, m: string | null) =>
      vs.find(v =>
        (s === null || v.size === s) &&
        (c === null || v.color === c) &&
        (m === null || v.material === m)
      );

    // Try progressively relaxed matches so selection never gets stuck
    const resolved =
      find(ns, nc, nm)   ||
      find(ns, nc, null) ||
      find(ns, null, nm) ||
      find(null, nc, nm) ||
      find(ns, null, null) ||
      find(null, nc, null) ||
      find(null, null, nm) ||
      vs[0];

    applyVariant(resolved);
  }

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

  // ── Loading / 404 ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#6b7280', fontSize: 15 }}>Loading product…</p>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>Product Not Found</h1>
          <p style={{ color: '#6b7280', marginBottom: 24 }}>This product doesn't exist or has been removed.</p>
          <button type="button" onClick={() => router.back()}
            style={{ background: 'var(--navy)', color: 'white', border: 'none', padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────

  const variants: any[]   = product.variants || [];
  const sizes              = Array.from(new Set(variants.map((v: any) => v.size).filter(Boolean))) as string[];
  const colors             = Array.from(new Set(variants.map((v: any) => v.color).filter(Boolean))) as string[];
  const materials          = Array.from(new Set(variants.map((v: any) => v.material).filter(Boolean))) as string[];
  const colorImgMap: Record<string, string> = {};
  variants.forEach((v: any) => { if (v.color && v.imageUrl && !colorImgMap[v.color]) colorImgMap[v.color] = v.imageUrl; });

  const hasStock  = (attr: 'size' | 'color' | 'material', val: string) =>
    variants.some((v: any) => v[attr] === val && (v.stockQty ?? 1) > 0);

  const stockQty  = selectedVariant?.stockQty ?? null;
  const inStock   = stockQty === null ? true : stockQty > 0;
  const stockLabel = !inStock ? 'Out of stock' : stockQty !== null && stockQty <= 5 ? `Only ${stockQty} left` : 'In stock';
  const stockColor = !inStock ? '#ef4444' : stockQty !== null && stockQty <= 5 ? '#f59e0b' : '#22c55e';

  const configSlug = CONFIGURATOR_MAP[product.category?.slug] || product.category?.slug;
  const unitPrice  = Number(product.basePrice) + (selectedVariant ? Number(selectedVariant.priceModifier) : 0);
  const totalPrice = unitPrice * quantity;
  const allImages: any[] = product.images?.filter((i: any) => !i.layerVariantKey) || [];
  const mainImg   = variantImgOverride || (allImages.length > 0 ? allImages[activeImage]?.url : null);
  const lbImg     = lightbox.open ? (allImages[lightbox.idx]?.url || mainImg) : null;

  // pill button style
  const pill = (active: boolean, oos: boolean): React.CSSProperties => ({
    padding: '8px 18px', borderRadius: 40, fontSize: 13, fontWeight: 600,
    border: `1.5px solid ${active ? '#1a1a1a' : oos ? '#e5e7eb' : '#d1d5db'}`,
    background: active ? '#1a1a1a' : 'white',
    color: active ? 'white' : oos ? '#c4c4c4' : '#374151',
    cursor: oos ? 'default' : 'pointer',
    textDecoration: oos ? 'line-through' : 'none',
    opacity: oos ? 0.55 : 1,
    transition: 'all 0.15s',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>

      {/* ── Lightbox ── */}
      {lightbox.open && (
        <div
          role="dialog" aria-modal="true" aria-label="Image preview"
          onClick={closeLightbox}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Close */}
          <button type="button" aria-label="Close" onClick={closeLightbox}
            style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.12)', border: 'none', color: 'white', width: 40, height: 40, borderRadius: '50%', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            ✕
          </button>
          {/* Prev */}
          {lightbox.idx > 0 && (
            <button type="button" aria-label="Previous image"
              onClick={e => { e.stopPropagation(); setLightbox(l => ({ ...l, idx: l.idx - 1 })); }}
              style={{ position: 'absolute', left: 16, background: 'rgba(255,255,255,0.12)', border: 'none', color: 'white', width: 44, height: 44, borderRadius: '50%', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ‹
            </button>
          )}
          {/* Image — white card so dark products stay visible */}
          {lbImg && (
            <div onClick={e => e.stopPropagation()}
              style={{ background: '#ffffff', borderRadius: 14, padding: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.6)', maxWidth: '88vw', maxHeight: '86vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={lbImg} alt={product.name}
                style={{ maxWidth: '80vw', maxHeight: '78vh', objectFit: 'contain', borderRadius: 6, userSelect: 'none', display: 'block' }}
              />
            </div>
          )}
          {/* Next */}
          {lightbox.idx < allImages.length - 1 && (
            <button type="button" aria-label="Next image"
              onClick={e => { e.stopPropagation(); setLightbox(l => ({ ...l, idx: l.idx + 1 })); }}
              style={{ position: 'absolute', right: 16, background: 'rgba(255,255,255,0.12)', border: 'none', color: 'white', width: 44, height: 44, borderRadius: '50%', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ›
            </button>
          )}
          {/* Counter */}
          {allImages.length > 1 && (
            <span style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
              {lightbox.idx + 1} / {allImages.length}
            </span>
          )}
        </div>
      )}

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

      {/* Main layout */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        <div className="mob-stack" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 56, alignItems: 'start' }}>

          {/* ── Left: Images ── */}
          <div>
            {/* Main image — click to open lightbox */}
            <div
              onClick={() => mainImg && openLightbox(variantImgOverride ? 0 : activeImage)}
              style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e8e8e8', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, position: 'relative', cursor: mainImg ? 'zoom-in' : 'default', padding: 16 }}>
              {mainImg
                ? <img src={mainImg} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'transform 0.2s', borderRadius: 8 }} />
                : <span style={{ fontSize: 72, opacity: 0.10, color: '#aaa' }}>BK</span>
              }
              {/* Zoom hint */}
              {mainImg && (
                <span style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.45)', color: 'white', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 600, pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  🔍 Tap to zoom
                </span>
              )}
              {product.isCustomizable && (
                <span style={{ position: 'absolute', top: 12, left: 12, background: 'var(--gold)', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>
                  Customizable
                </span>
              )}
              {variants.length > 0 && !inStock && (
                <div style={{ position: 'absolute', top: 12, right: 12, background: '#ef4444', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
                  Out of stock
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {allImages.map((img: any, i: number) => (
                  <button key={img.id || i} type="button"
                    onClick={() => { setActiveImage(i); setVarImgOvr(null); }}
                    style={{ width: 72, height: 72, border: i === activeImage && !variantImgOverride ? '2px solid var(--gold)' : '2px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', background: 'white', padding: 0, flexShrink: 0 }}>
                    <img src={img.url} alt={img.altText || ''} style={{ width: '88%', height: '88%', objectFit: 'contain' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Product info ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Name */}
            <div>
              {product.category && (
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {product.category.name}
                </span>
              )}
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a1a', marginTop: 4, lineHeight: 1.2 }}>{product.name}</h1>
              {product.sku && <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>SKU: {product.sku}</p>}
            </div>

            {/* Price block */}
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 30, fontWeight: 800, color: '#1a1a1a' }}>€{unitPrice.toFixed(2)}</span>
                <span style={{ fontSize: 14, color: '#6b7280' }}>per unit</span>
                {selectedVariant && Number(selectedVariant.priceModifier) !== 0 && (
                  <span style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 600 }}>
                    ({Number(selectedVariant.priceModifier) > 0 ? '+' : ''}€{Number(selectedVariant.priceModifier).toFixed(2)})
                  </span>
                )}
              </div>

              {/* Stock badge */}
              {variants.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: stockColor, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: stockColor, fontWeight: 600 }}>{stockLabel}</span>
                </div>
              )}

              {product.moq > 1 && <p style={{ fontSize: 13, color: '#6b7280' }}>Minimum order: {product.moq} units</p>}
              {product.leadTimeDays > 0 && <p style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Lead time: {product.leadTimeDays} days</p>}
              {quantity > 1 && (
                <p style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 600, marginTop: 6 }}>
                  Total: €{totalPrice.toFixed(2)} for {quantity} units
                </p>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Description</h2>
                <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.7, margin: 0 }}>{product.description}</p>
              </div>
            )}

            {/* Features / Specifications */}
            {Array.isArray(product.features) && product.features.length > 0 && (
              <div style={{ background: '#f8f9fa', borderRadius: 12, padding: '18px 20px', border: '1px solid #e5e7eb' }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 12 }}>Specifications</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {(product.features as { label: string; value: string }[]).map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: i < product.features.length - 1 ? '1px solid #e5e7eb' : 'none', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', minWidth: 120, flexShrink: 0 }}>{f.label}</span>
                      <span style={{ fontSize: 13, color: '#1a1a1a', flex: 1 }}>{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Variant selectors ── */}
            {variants.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 4 }}>

                {/* Size */}
                {sizes.length > 0 && (
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 10, margin: '0 0 10px' }}>
                      Size: <span style={{ fontWeight: 400, color: '#6b7280' }}>{selSize || '—'}</span>
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {sizes.map(s => {
                        const oos = !hasStock('size', s);
                        return (
                          <button key={s} type="button" onClick={() => !oos && pickVariant('size', s)} style={pill(selSize === s, oos)}>
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Color */}
                {colors.length > 0 && (
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 10, margin: '0 0 10px' }}>
                      Color: <span style={{ fontWeight: 400, color: '#6b7280' }}>{selColor || '—'}</span>
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                      {colors.map(c => {
                        const img = colorImgMap[c];
                        const active = selColor === c;
                        const oos = !hasStock('color', c);
                        const hex = COLOR_HEX[c.toLowerCase()] || '#e5e7eb';
                        return (
                          <button key={c} type="button" title={c} onClick={() => !oos && pickVariant('color', c)}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: oos ? 'default' : 'pointer', padding: 0, opacity: oos ? 0.4 : 1 }}>
                            <span style={{
                              width: 44, height: 44, borderRadius: '50%', display: 'block', overflow: 'hidden', flexShrink: 0,
                              border: `3px solid ${active ? '#1a1a1a' : 'transparent'}`,
                              outline: active ? '2px solid #1a1a1a' : '2px solid #e5e7eb',
                              outlineOffset: 2,
                              background: hex,
                              position: 'relative',
                            }}>
                              {img && <img src={img} alt={c} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                              {oos && (
                                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <span style={{ width: '140%', height: 1.5, background: '#6b7280', transform: 'rotate(-45deg)', display: 'block' }} />
                                </span>
                              )}
                            </span>
                            <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, lineHeight: 1 }}>{c}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Material */}
                {materials.length > 0 && (
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 10, margin: '0 0 10px' }}>
                      Material: <span style={{ fontWeight: 400, color: '#6b7280' }}>{selMaterial || '—'}</span>
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {materials.map(m => {
                        const oos = !hasStock('material', m);
                        return (
                          <button key={m} type="button" onClick={() => !oos && pickVariant('material', m)} style={pill(selMaterial === m, oos)}>
                            {m}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quantity */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 10, margin: '0 0 10px' }}>Quantity</p>
              <div style={{ display: 'inline-flex', alignItems: 'center', border: '1.5px solid #d1d5db', borderRadius: 8, overflow: 'hidden' }}>
                <button type="button" onClick={() => setQuantity(q => Math.max(product.moq || 1, q - 1))}
                  style={{ width: 44, height: 44, background: 'white', border: 'none', fontSize: 20, cursor: 'pointer', color: '#374151', fontWeight: 400 }}>−</button>
                <span style={{ minWidth: 56, textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#1a1a1a', borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', height: 44, lineHeight: '44px', display: 'block', padding: '0 8px' }}>
                  {quantity}
                </span>
                <button type="button" onClick={() => setQuantity(q => q + 1)}
                  style={{ width: 44, height: 44, background: 'white', border: 'none', fontSize: 20, cursor: 'pointer', color: '#374151', fontWeight: 400 }}>+</button>
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {product.isCustomizable && (
                <Link href={`/customize/${configSlug}?productId=${product.id}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--gold)', color: 'white', padding: '14px 20px', borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
                  Configure & Order →
                </Link>
              )}
              <button type="button" onClick={handleAddToCart} disabled={adding || !inStock}
                style={{ width: '100%', background: added ? '#16a34a' : !inStock ? '#d1d5db' : adding ? '#9ca3af' : '#1a1a1a', color: 'white', border: 'none', padding: '14px 20px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: (adding || !inStock) ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
                {added ? '✓ Added to Cart!' : adding ? 'Adding…' : !inStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button type="button" onClick={() => router.back()}
                style={{ width: '100%', background: 'white', color: '#374151', border: '1.5px solid #d1d5db', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                ← Back to Products
              </button>
            </div>

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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

      {/* Add-ons */}
      {addons.length > 0 && (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 64px', borderTop: '1px solid #e5e7eb', paddingTop: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', marginBottom: 20 }}>Frequently Added Together</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {addons.map((a: any) => {
              const img = a.images?.find((i: any) => i.isPrimary) || a.images?.[0];
              return (
                <div key={a.id} style={{ background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ aspectRatio: '1', background: '#f9f9f9', position: 'relative' }}>
                    {img
                      ? <img src={img.url} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, opacity: 0.15 }}>BK</div>}
                    <span style={{ position: 'absolute', top: 6, left: 6, background: 'var(--gold)', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>Add-on</span>
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 4, lineHeight: 1.3 }}>{a.name}</p>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a', marginBottom: 10 }}>€{Number(a.basePrice).toFixed(2)}</p>
                    <button type="button" disabled={addonAdding === a.id}
                      onClick={async () => { setAddonAdding(a.id); try { await addItem(a.id, a.moq || 1); } finally { setAddonAdding(null); } }}
                      style={{ width: '100%', background: addonAdding === a.id ? '#9ca3af' : '#1a1a1a', color: 'white', border: 'none', padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
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
