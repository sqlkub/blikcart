'use client';
import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ConfiguratorStep from '@/components/configurator/ConfiguratorStep';
import { useConfiguratorStore } from '@/store/configurator.store';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

function ConfiguratorContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = params.category as string;
  const productId = searchParams.get('productId');

  const [schema, setSchema] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [lastAutoSaved, setLastAutoSaved] = useState<string | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftIdRef = useRef<string | null>(null);
  const [addons, setAddons] = useState<any[]>([]);
  const [addonAdding, setAddonAdding] = useState<string | null>(null);

  const { selections, quantity, notes, reset, selectOption, setQuantity } = useConfiguratorStore();

  useEffect(() => {
    reset();
    setCurrentStep(0);
    setSchema(null);
    setSteps([]);
    setError('');
    setLoading(true);

    const schemaFetch = fetch(`${API}/configurator/schema/${category}`)
      .then(r => { if (!r.ok) throw new Error('No configurator found for this category'); return r.json(); });

    const productFetch = productId
      ? fetch(`${API}/products/${productId}`).then(r => r.ok ? r.json() : null).catch(() => null)
      : Promise.resolve(null);

    Promise.all([schemaFetch, productFetch])
      .then(([data, product]) => {
        setSchema(data);
        const sharedSteps: any[] = data.steps || [];

        // Append product-specific steps (from features.customizationSteps) after shared steps
        let productSteps: any[] = [];
        if (product) {
          const f = product.features;
          const cs = Array.isArray(f) ? [] : Array.isArray(f?.customizationSteps) ? f.customizationSteps : [];
          productSteps = cs;
        }
        setSteps([...sharedSteps, ...productSteps]);

        // Restore shared configuration from ?cfg= param
        const cfgParam = searchParams.get('cfg');
        if (cfgParam) {
          try {
            const { selections: saved, quantity: savedQty } = JSON.parse(atob(cfgParam));
            if (saved && typeof saved === 'object') {
              Object.entries(saved).forEach(([stepId, optId]) => selectOption(stepId, optId as string));
            }
            if (savedQty && typeof savedQty === 'number') {
              setQuantity(savedQty);
            }
          } catch { /* malformed cfg param — ignore */ }
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));

    fetch(`${API}/products?tags=addon&limit=8`)
      .then(r => r.json())
      .then(d => setAddons(d.data || []))
      .catch(() => {});
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save every 30 seconds if there are selections
  const autoSave = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token || Object.keys(selections).length === 0 || !schema) return;
    try {
      if (draftIdRef.current) {
        await fetch(`${API}/configurator/drafts/${draftIdRef.current}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ selections, quantity, notes }),
        });
      } else {
        const res = await fetch(`${API}/configurator/drafts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ productId, schemaVersionId: schema?.schemaVersionId, selections }),
        });
        if (res.ok) {
          const draft = await res.json();
          draftIdRef.current = draft.id;
        }
      }
      setLastAutoSaved(new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }));
    } catch { /* silent */ }
  }, [selections, quantity, notes, schema, productId]);

  useEffect(() => {
    if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    autoSaveRef.current = setInterval(autoSave, 30000);
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  }, [autoSave]);

  const step = steps[currentStep];
  const totalSteps = steps.length;
  const completedSteps = steps.filter(s => selections[s.id]).length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  // quantity_delivery steps are always "complete" — quantity is always set, delivery is optional
  const canNext = step && (!step.required || selections[step.id] || step.ui_type === 'quantity_delivery');
  const isLast = currentStep === totalSteps - 1;

  const categoryLabel = category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Calculate price
  const priceModifier = steps.reduce((sum, s) => {
    const val = selections[s.id];
    if (!val) return sum;
    const opt = s.options?.find((o: any) => o.id === val);
    return sum + (opt?.price_modifier || 0);
  }, 0);
  const unitPrice = (schema?.basePrice || 0) + priceModifier;
  const quantityDiscount = quantity >= 100 ? 0.82 : quantity >= 50 ? 0.85 : quantity >= 20 ? 0.90 : quantity >= 5 ? 0.95 : 1;
  const discountedUnit = (unitPrice * quantityDiscount).toFixed(2);
  const totalPrice = (unitPrice * quantityDiscount * quantity).toFixed(2);

  function getShareableLink() {
    const encoded = btoa(JSON.stringify({ selections, quantity }));
    const params = new URLSearchParams();
    if (productId) params.set('productId', productId);
    params.set('cfg', encoded);
    return `${window.location.origin}/customize/${category}?${params.toString()}`;
  }

  function copyShareableLink() {
    navigator.clipboard.writeText(getShareableLink()).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  async function submitQuote() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      const redirect = `/customize/${category}${productId ? `?productId=${productId}` : ''}`;
      router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      let draftId = draftIdRef.current;
      if (!draftId) {
        const draftRes = await fetch(`${API}/configurator/drafts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ productId, schemaVersionId: schema?.schemaVersionId, selections }),
        });
        if (!draftRes.ok) throw new Error((await draftRes.json()).message || 'Failed to save configuration');
        const draft = await draftRes.json();
        draftId = draft.id;
        draftIdRef.current = draftId;
      } else {
        await fetch(`${API}/configurator/drafts/${draftId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ selections, quantity, notes }),
        });
      }

      const submitRes = await fetch(`${API}/configurator/drafts/${draftId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (!submitRes.ok) throw new Error((await submitRes.json()).message || 'Failed to submit quote request');
      setSubmitted(true);
    } catch (e: any) {
      setSubmitError(e.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)' }}>
      <div style={{ textAlign: 'center', background: 'white', padding: 48, borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', maxWidth: 480 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h2 style={{ color: 'var(--navy)', fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Quote Request Sent!</h2>
        <p style={{ color: '#6b7280', lineHeight: 1.6, marginBottom: 28 }}>
          Your custom configuration has been submitted. Our team will review it and get back to you with a quote within 1–2 business days.
        </p>
        <Link href="/account/orders" style={{ display: 'inline-block', background: 'var(--navy)', color: 'white', padding: '12px 28px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', marginRight: 12 }}>
          View My Orders
        </Link>
        <Link href="/" style={{ display: 'inline-block', border: '2px solid var(--navy)', color: 'var(--navy)', padding: '12px 28px', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>
          Back to Home
        </Link>
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
        <p style={{ color: 'var(--navy)', fontWeight: 600, fontSize: 16 }}>Loading configurator…</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)' }}>
      <div style={{ textAlign: 'center', background: 'white', padding: 40, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ color: 'var(--navy)', marginBottom: 8 }}>Configurator not available</h2>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>{error}</p>
        <Link href="/" style={{ color: 'var(--gold)', fontWeight: 600 }}>← Back to Home</Link>
      </div>
    </div>
  );

  // ── Review & Summary Screen ─────────────────────────────────────────────────
  if (showReview) return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ background: 'var(--navy)', color: 'white', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Review Your Configuration</p>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Design Your {categoryLabel}</h1>
        </div>
        <button type="button" onClick={() => setShowReview(false)}
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 8, padding: '8px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          ← Edit Configuration
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)', marginBottom: 24, paddingBottom: 16, borderBottom: '2px solid #f3f4f6' }}>Configuration Summary</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
            {steps.map(s => {
              const val = selections[s.id];
              if (!val) return (
                <div key={s.id} style={{ paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid #f3f4f6' }}>
                  <p style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{s.title}</p>
                  <p style={{ fontSize: 14, color: '#d1d5db', fontStyle: 'italic' }}>Not selected{!s.required ? ' (optional)' : ''}</p>
                </div>
              );
              let displayVal = val;
              let modifier = 0;
              let colorHex = '';
              try {
                const parsed = JSON.parse(val);
                if (Array.isArray(parsed)) {
                  displayVal = parsed.map((id: string) => s.options?.find((o: any) => o.id === id)?.label || id).join(', ');
                }
              } catch {
                const opt = s.options?.find((o: any) => o.id === val);
                displayVal = opt?.label || (val === 'true' ? 'Enabled' : val);
                modifier = opt?.price_modifier || 0;
                colorHex = opt?.color_hex || '';
              }
              return (
                <div key={s.id} style={{ paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid #f3f4f6' }}>
                  <p style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{s.title}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {colorHex && <div style={{ width: 16, height: 16, borderRadius: '50%', background: colorHex, border: '2px solid #e5e7eb', flexShrink: 0 }} />}
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>{displayVal}</p>
                    </div>
                    {modifier > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>+€{modifier.toFixed(2)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pricing breakdown */}
        <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)', marginBottom: 20, paddingBottom: 16, borderBottom: '2px solid #f3f4f6' }}>Price Estimate</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#6b7280' }}>Base price</span>
              <span style={{ fontWeight: 600, color: 'var(--navy)' }}>€{(schema?.basePrice || 0).toFixed(2)}</span>
            </div>
            {priceModifier > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: '#6b7280' }}>Options</span>
                <span style={{ fontWeight: 600, color: 'var(--gold)' }}>+€{priceModifier.toFixed(2)}</span>
              </div>
            )}
            {quantityDiscount < 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: '#22c55e' }}>Quantity discount ({Math.round((1 - quantityDiscount) * 100)}%)</span>
                <span style={{ fontWeight: 600, color: '#22c55e' }}>−€{(unitPrice * (1 - quantityDiscount)).toFixed(2)}/unit</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, paddingTop: 12, borderTop: '2px solid var(--navy)', marginTop: 4 }}>
              <span style={{ fontWeight: 700, color: 'var(--navy)' }}>Est. unit price</span>
              <span style={{ fontWeight: 800, color: 'var(--gold)', fontSize: 22 }}>€{discountedUnit}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#6b7280' }}>Quantity: {quantity} units</span>
              <span style={{ fontWeight: 700, color: 'var(--navy)' }}>Est. total: €{totalPrice}</span>
            </div>
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>* Prices are estimates. Final quote confirmed by our team after review.</p>
          </div>
        </div>

        {/* Add-ons */}
        {addons.length > 0 && (
          <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 16 }}>🧩 Frequently Added Together</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {addons.map((a: any) => {
                const img = a.images?.find((i: any) => i.isPrimary) || a.images?.[0];
                return (
                  <div key={a.id} style={{ border: '1.5px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ aspectRatio: '1', background: '#f9f9f9' }}>
                      {img
                        ? <img src={img.url} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🐴</div>}
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginBottom: 2, lineHeight: 1.3 }}>{a.name}</p>
                      <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>€{Number(a.basePrice).toFixed(2)}</p>
                      <button
                        type="button"
                        disabled={addonAdding === a.id}
                        onClick={async () => {
                          setAddonAdding(a.id);
                          try {
                            const tok = localStorage.getItem('accessToken');
                            await fetch(`${API}/cart/add`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) },
                              body: JSON.stringify({ productId: a.id, quantity: a.moq || 1 }),
                            });
                          } finally { setAddonAdding(null); }
                        }}
                        style={{ width: '100%', background: addonAdding === a.id ? '#9ca3af' : 'var(--navy)', color: 'white', border: 'none', padding: '7px 0', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
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

        {/* Action row */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" onClick={copyShareableLink}
              style={{ padding: '12px 20px', border: '2px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#374151', background: 'white', cursor: 'pointer' }}>
              {linkCopied ? '✓ Link Copied!' : '🔗 Share Configuration'}
            </button>
            <button type="button" onClick={() => setShowReview(false)}
              style={{ padding: '12px 20px', border: '2px solid var(--navy)', borderRadius: 10, fontSize: 14, fontWeight: 600, color: 'var(--navy)', background: 'white', cursor: 'pointer' }}>
              ← Edit
            </button>
          </div>
          <div style={{ textAlign: 'right' }}>
            {submitError && <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 8 }}>{submitError}</p>}
            <button type="button" onClick={submitQuote} disabled={submitting}
              style={{ padding: '14px 36px', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800, color: 'white', background: submitting ? '#9ca3af' : 'var(--navy)', cursor: submitting ? 'not-allowed' : 'pointer' }}>
              {submitting ? 'Submitting…' : '✉ Submit Quote Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Main configurator ───────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Top bar */}
      <div style={{ background: 'var(--navy)', color: 'white', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            Custom Order Configurator
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Design Your {categoryLabel}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {lastAutoSaved && (
            <p style={{ fontSize: 11, color: '#9ca3af' }}>Auto-saved {lastAutoSaved}</p>
          )}
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 6 }}>{completedSteps} of {totalSteps} steps complete</p>
            <div style={{ width: 180, height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 3 }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--gold)', borderRadius: 3, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 28, alignItems: 'start' }}>

        {/* LEFT — step content */}
        <div>
          {/* Step indicator row */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24, alignItems: 'center' }}>
            {steps.map((s, i) => {
              const done = !!selections[s.id] && i !== currentStep;
              const active = i === currentStep;
              return (
                <button key={s.id} type="button" onClick={() => setCurrentStep(i)} title={s.title} style={{
                  width: 36, height: 36, borderRadius: '50%', border: '2px solid',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                  borderColor: active ? 'var(--gold)' : done ? '#22c55e' : '#d1d5db',
                  background: active ? 'var(--gold)' : done ? '#22c55e' : 'white',
                  color: active || done ? 'white' : '#9ca3af',
                  boxShadow: active ? '0 0 0 3px rgba(200,134,10,0.25)' : 'none',
                }}>
                  {done ? '✓' : i + 1}
                </button>
              );
            })}
          </div>

          {/* Step card */}
          {step && (
            <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                  Step {currentStep + 1} of {totalSteps}
                </p>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', marginBottom: 6 }}>{step.title}</h2>
                {step.description && (
                  <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>{step.description}</p>
                )}
              </div>

              <ConfiguratorStep step={step} />

              {/* Nav */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, paddingTop: 24, borderTop: '1px solid #f3f4f6' }}>
                <button type="button"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  style={{ padding: '10px 24px', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#374151', background: 'white', cursor: currentStep === 0 ? 'not-allowed' : 'pointer', opacity: currentStep === 0 ? 0.4 : 1 }}>
                  ← Back
                </button>

                <span style={{ fontSize: 13, color: '#9ca3af' }}>
                  {step.required && !selections[step.id] ? '⚠️ Required — please make a selection' : ''}
                </span>

                {!isLast ? (
                  <button type="button"
                    onClick={() => canNext && setCurrentStep(currentStep + 1)}
                    disabled={!canNext}
                    style={{ padding: '10px 28px', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, color: 'white', background: canNext ? 'var(--gold)' : '#e5e7eb', cursor: canNext ? 'pointer' : 'not-allowed' }}>
                    Next Step →
                  </button>
                ) : (
                  <button type="button" onClick={() => setShowReview(true)} disabled={!canNext}
                    style={{ padding: '10px 28px', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, color: 'white', background: canNext ? 'var(--navy)' : '#e5e7eb', cursor: canNext ? 'pointer' : 'not-allowed' }}>
                    Review & Submit →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — live summary / preview */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
            <div style={{ background: 'var(--navy)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>Your Configuration</h3>
              <button type="button" onClick={copyShareableLink} title="Copy shareable link"
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>
                {linkCopied ? '✓ Copied' : '🔗 Share'}
              </button>
            </div>
            <div style={{ padding: 20 }}>
              {steps.map(s => {
                const val = selections[s.id];
                if (!val || s.ui_type === 'notes_upload' || s.ui_type === 'quantity_delivery') return null;
                let displayVal = val;
                let modifier = 0;
                let colorHex = '';
                try {
                  const parsed = JSON.parse(val);
                  if (Array.isArray(parsed)) {
                    displayVal = parsed.map((id: string) => s.options?.find((o: any) => o.id === id)?.label || id).join(', ');
                  }
                } catch {
                  if (val === 'true') {
                    displayVal = 'Enabled';
                  } else {
                    const opt = s.options?.find((o: any) => o.id === val);
                    displayVal = opt?.label || val;
                    modifier = opt?.price_modifier || 0;
                    colorHex = opt?.color_hex || '';
                  }
                }
                return (
                  <div key={s.id} style={{ paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid #f3f4f6' }}>
                    <p style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{s.title}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        {colorHex && (
                          <div style={{ width: 14, height: 14, borderRadius: '50%', background: colorHex, border: '1.5px solid #e5e7eb', flexShrink: 0 }} />
                        )}
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayVal}</p>
                      </div>
                      {modifier > 0 && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>+€{modifier.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {completedSteps === 0 && (
                <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '16px 0' }}>Your selections will appear here</p>
              )}

              {/* Pricing */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '2px solid #f3f4f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>Base price</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>€{(schema?.basePrice || 0).toFixed(2)}</span>
                </div>
                {priceModifier > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>Options</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)' }}>+€{priceModifier.toFixed(2)}</span>
                  </div>
                )}
                {quantityDiscount < 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: '#22c55e' }}>Qty discount</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#22c55e' }}>−{Math.round((1 - quantityDiscount) * 100)}%</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '2px solid var(--navy)' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>Est. per unit</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--gold)' }}>€{discountedUnit}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>Qty: {quantity} units</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Total: €{totalPrice}</span>
                </div>
              </div>

              <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--cream)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280' }}>
                <span>MOQ {schema?.moq || 5} units</span>
                <span>Lead time {schema?.leadTimeStandardDays || 14}d</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function ConfiguratorPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6b7280', fontSize: 15 }}>Loading configurator…</p>
      </div>
    }>
      <ConfiguratorContent />
    </Suspense>
  );
}
