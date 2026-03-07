'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ConfiguratorStep from '@/components/configurator/ConfiguratorStep';
import { useConfiguratorStore } from '@/store/configurator.store';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

export default function ConfiguratorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const category = params.category as string;

  const [schema, setSchema] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { selections, quantity, reset } = useConfiguratorStore();

  useEffect(() => {
    reset();
    setCurrentStep(0);
    setSchema(null);
    setSteps([]);
    setError('');
    setLoading(true);

    fetch(`${API}/configurator/schema/${category}`)
      .then(r => { if (!r.ok) throw new Error('No configurator found for this category'); return r.json(); })
      .then(data => { setSchema(data); setSteps(data.steps || []); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [category]);

  const step = steps[currentStep];
  const totalSteps = steps.length;
  const completedSteps = steps.filter(s => selections[s.id]).length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  const canNext = step && (!step.required || selections[step.id]);
  const isLast = currentStep === totalSteps - 1;

  const categoryLabel = category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Calculate total price modifier from selections
  const priceModifier = steps.reduce((sum, s) => {
    const val = selections[s.id];
    if (!val) return sum;
    const opt = s.options?.find((o: any) => o.id === val);
    return sum + (opt?.price_modifier || 0);
  }, 0);
  const estimatedPrice = ((schema?.basePrice || 0) + priceModifier).toFixed(2);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16, animation: 'spin 1s linear infinite' }}>🎨</div>
        <p style={{ color: 'var(--navy)', fontWeight: 600, fontSize: 16 }}>Loading configurator...</p>
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Top bar */}
      <div style={{ background: 'var(--navy)', color: 'white', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            Custom Order Configurator
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Design Your {categoryLabel}</h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 6 }}>
            {completedSteps} of {totalSteps} steps complete
          </p>
          <div style={{ width: 180, height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 3 }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--gold)', borderRadius: 3, transition: 'width 0.4s ease' }} />
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
                <button key={s.id} onClick={() => setCurrentStep(i)} title={s.title} style={{
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
                <button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  style={{ padding: '10px 24px', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#374151', background: 'white', cursor: currentStep === 0 ? 'not-allowed' : 'pointer', opacity: currentStep === 0 ? 0.4 : 1, transition: 'all 0.2s' }}
                >
                  ← Back
                </button>

                <span style={{ fontSize: 13, color: '#9ca3af' }}>
                  {step.required && !selections[step.id] ? '⚠️ Required — please make a selection' : ''}
                </span>

                {!isLast ? (
                  <button
                    onClick={() => canNext && setCurrentStep(currentStep + 1)}
                    disabled={!canNext}
                    style={{ padding: '10px 28px', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, color: 'white', background: canNext ? 'var(--gold)' : '#e5e7eb', cursor: canNext ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}
                  >
                    Next Step →
                  </button>
                ) : (
                  <Link href="/login?redirect=/account" style={{ padding: '10px 28px', borderRadius: 8, fontSize: 14, fontWeight: 700, color: 'white', background: 'var(--navy)', textDecoration: 'none', display: 'inline-block' }}>
                    Submit Quote Request →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — live summary */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
            <div style={{ background: 'var(--navy)', padding: '16px 20px' }}>
              <h3 style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>Your Configuration</h3>
            </div>
            <div style={{ padding: 20 }}>
              {steps.map(s => {
                const val = selections[s.id];
                if (!val || s.ui_type === 'notes_upload' || s.ui_type === 'quantity_delivery') return null;
                let displayVal = val;
                let modifier = 0;
                try {
                  // parts_selector stores JSON array
                  const parsed = JSON.parse(val);
                  if (Array.isArray(parsed)) {
                    displayVal = parsed.map((id: string) => s.options?.find((o: any) => o.id === id)?.label || id).join(', ');
                  }
                } catch {
                  const opt = s.options?.find((o: any) => o.id === val);
                  displayVal = opt?.label || val;
                  modifier = opt?.price_modifier || 0;
                }
                return (
                  <div key={s.id} style={{ paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid #f3f4f6' }}>
                    <p style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{s.title}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{displayVal}</p>
                      {modifier !== 0 && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: modifier > 0 ? 'var(--gold)' : '#22c55e' }}>
                          {modifier > 0 ? '+' : ''}€{modifier.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {completedSteps === 0 && (
                <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '16px 0' }}>
                  Your selections will appear here
                </p>
              )}

              {/* Pricing */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '2px solid #f3f4f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>Base price</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>€{(schema?.basePrice || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>Options</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: priceModifier >= 0 ? 'var(--gold)' : '#22c55e' }}>
                    {priceModifier >= 0 ? '+' : ''}€{priceModifier.toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '2px solid var(--navy)' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>Est. per unit</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--gold)' }}>€{estimatedPrice}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>Quantity</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{quantity} units</span>
                </div>
              </div>

              <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--cream)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280' }}>
                <span>MOQ {schema?.moq || 5} units</span>
                <span>Lead time {schema?.leadTimeStandardDays || 14} days</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
