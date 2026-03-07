'use client';
import type { ConfiguratorStep as StepType } from '@blikcart/types';
import { useConfiguratorStore } from '@/store/configurator.store';

interface Props { step: StepType; }

export default function ConfiguratorStep({ step }: Props) {
  const { selections, selectOption, quantity, setQuantity, moq } = useConfiguratorStore();
  const selected = selections[step.id];

  if (step.ui_type === 'image_card_grid') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {step.options.map(opt => (
          <button key={opt.id} onClick={() => selectOption(step.id, opt.id)} style={{ border: selected === opt.id ? '2px solid var(--gold)' : '2px solid #e5e7eb', borderRadius: 10, padding: 12, textAlign: 'left', background: selected === opt.id ? 'rgba(200,134,10,0.05)' : 'white', cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
            {opt.image && (<div style={{ aspectRatio: '1', background: 'var(--cream)', borderRadius: 6, marginBottom: 8, overflow: 'hidden' }}><img src={opt.image} alt={opt.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} /></div>)}
            <p style={{ fontWeight: 600, color: 'var(--navy)', fontSize: 14 }}>{opt.label}</p>
            {opt.description && <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{opt.description}</p>}
            {(opt.price_modifier ?? 0) > 0 && <p style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600, marginTop: 4 }}>+€{opt.price_modifier?.toFixed(2)}</p>}
            {selected === opt.id && (<div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--gold)', color: 'white', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>✓</div>)}
          </button>
        ))}
      </div>
    );
  }

  if (step.ui_type === 'swatch') {
    return (
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {step.options.map(opt => (
            <button key={opt.id} onClick={() => selectOption(step.id, opt.id)} title={opt.label} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: opt.color_hex || '#ccc', border: selected === opt.id ? '3px solid var(--gold)' : '3px solid #e5e7eb', boxShadow: selected === opt.id ? '0 0 0 2px var(--gold)' : 'none', transition: 'all 0.2s', transform: selected === opt.id ? 'scale(1.15)' : 'scale(1)' }} />
            </button>
          ))}
        </div>
        {selected && (<p style={{ marginTop: 16, fontSize: 14, color: '#6b7280' }}>Selected: <strong style={{ color: 'var(--navy)' }}>{step.options.find(o => o.id === selected)?.label}</strong>{(step.options.find(o => o.id === selected)?.price_modifier ?? 0) > 0 && (<span style={{ color: 'var(--gold)', marginLeft: 8 }}>+€{step.options.find(o => o.id === selected)?.price_modifier?.toFixed(2)}</span>)}</p>)}
      </div>
    );
  }

  if (step.ui_type === 'icon_radio') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {step.options.map(opt => (
          <button key={opt.id} onClick={() => selectOption(step.id, opt.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, border: selected === opt.id ? '2px solid var(--gold)' : '2px solid #e5e7eb', borderRadius: 10, textAlign: 'left', background: selected === opt.id ? 'rgba(200,134,10,0.05)' : 'white', cursor: 'pointer', transition: 'all 0.2s' }}>
            {opt.icon && <span style={{ fontSize: 24 }}>{opt.icon}</span>}
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, color: 'var(--navy)', fontSize: 14 }}>{opt.label}</p>
              {(opt.price_modifier ?? 0) > 0 && <p style={{ fontSize: 12, color: 'var(--gold)' }}>+€{opt.price_modifier?.toFixed(2)}</p>}
            </div>
            {selected === opt.id && (<div style={{ background: 'var(--gold)', color: 'white', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>✓</div>)}
          </button>
        ))}
      </div>
    );
  }

  if (step.ui_type === 'parts_selector') {
    const selectedParts: string[] = (() => { try { return selected ? JSON.parse(selected) : []; } catch { return []; } })();
    const isFullBridle = selectedParts.includes('full_bridle');
    const togglePart = (partId: string) => {
      if (partId === 'full_bridle') { selectOption(step.id, JSON.stringify(isFullBridle ? [] : ['full_bridle'])); return; }
      let next = selectedParts.filter(p => p !== 'full_bridle');
      next = next.includes(partId) ? next.filter(p => p !== partId) : [...next, partId];
      selectOption(step.id, JSON.stringify(next));
    };
    const isSelected = (id: string) => selectedParts.includes(id);
    const completeParts = step.options.filter((o: any) => o.category === 'complete');
    const individualParts = step.options.filter((o: any) => o.category === 'part');
    return (
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Complete Set</p>
        {completeParts.map(opt => (
          <button key={opt.id} onClick={() => togglePart(opt.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: 18, border: isSelected(opt.id) ? '2px solid var(--gold)' : '2px solid #e5e7eb', borderRadius: 12, background: isSelected(opt.id) ? 'rgba(200,134,10,0.06)' : 'white', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', marginBottom: 20 }}>
            <span style={{ fontSize: 32 }}>{(opt as any).icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 16 }}>{opt.label}</p>
              <p style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{opt.description}</p>
              <p style={{ fontSize: 12, color: '#22c55e', fontWeight: 600, marginTop: 4 }}>Includes all parts — best value</p>
            </div>
            <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, border: '2px solid', borderColor: isSelected(opt.id) ? 'var(--gold)' : '#d1d5db', background: isSelected(opt.id) ? 'var(--gold)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13 }}>{isSelected(opt.id) ? '✓' : ''}</div>
          </button>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>OR select individual parts</span>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {individualParts.map(opt => (
            <button key={opt.id} onClick={() => togglePart(opt.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, border: isSelected(opt.id) ? '2px solid var(--gold)' : '2px solid #e5e7eb', borderRadius: 10, background: isSelected(opt.id) ? 'rgba(200,134,10,0.06)' : 'white', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', opacity: isFullBridle ? 0.4 : 1 }}>
              <span style={{ fontSize: 22 }}>{(opt as any).icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, color: 'var(--navy)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.label}</p>
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{opt.description}</p>
              </div>
              <div style={{ width: 20, height: 20, borderRadius: 4, flexShrink: 0, border: '2px solid', borderColor: isSelected(opt.id) ? 'var(--gold)' : '#d1d5db', background: isSelected(opt.id) ? 'var(--gold)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 11 }}>{isSelected(opt.id) ? '✓' : ''}</div>
            </button>
          ))}
        </div>
        {selectedParts.length > 0 && (
          <div style={{ marginTop: 16, background: 'var(--navy)', color: 'white', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600 }}>{isFullBridle ? '✓ Complete Bridle selected' : `${selectedParts.length} part${selectedParts.length > 1 ? 's' : ''} selected`}</p>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{isFullBridle ? 'All components included' : selectedParts.map(id => individualParts.find(p => p.id === id)?.label).filter(Boolean).join(', ')}</p>
            </div>
          </div>
        )}
        {selectedParts.length === 0 && <p style={{ marginTop: 12, fontSize: 13, color: '#ef4444', textAlign: 'center' }}>Select complete bridle or at least one part to continue</p>}
      </div>
    );
  }

  if (step.ui_type === 'quantity_delivery') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Quantity (minimum {moq} units)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setQuantity(Math.max(moq, quantity - 1))} style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--navy)', color: 'var(--navy)', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'white' }}>−</button>
            <input type="number" value={quantity} min={moq} onChange={e => setQuantity(Math.max(moq, parseInt(e.target.value) || moq))} style={{ width: 80, textAlign: 'center', border: '2px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 18, fontWeight: 700, color: 'var(--navy)' }} />
            <button onClick={() => setQuantity(quantity + 1)} style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--navy)', color: 'var(--navy)', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'white' }}>+</button>
            <span style={{ fontSize: 14, color: '#6b7280' }}>units</span>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[{min:5,label:'5–19',d:'5% off'},{min:20,label:'20–49',d:'10% off'},{min:50,label:'50–99',d:'15% off'},{min:100,label:'100+',d:'18% off'}].map(t => (
              <div key={t.min} style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: quantity >= t.min ? 'var(--gold)' : '#f3f4f6', color: quantity >= t.min ? 'white' : '#6b7280', transition: 'all 0.2s' }}>{t.label} — {t.d}</div>
            ))}
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Delivery Speed</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {step.options.map(opt => (
              <button key={opt.id} onClick={() => selectOption(step.id, opt.id)} style={{ padding: 16, border: selected === opt.id ? '2px solid var(--gold)' : '2px solid #e5e7eb', borderRadius: 10, background: selected === opt.id ? 'rgba(200,134,10,0.05)' : 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 24 }}>{opt.icon}</span>
                  <span style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 15 }}>{opt.label}</span>
                  {selected === opt.id && <span style={{ marginLeft: 'auto', background: 'var(--gold)', color: 'white', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>✓</span>}
                </div>
                {(opt as any).is_express && <p style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>+25% surcharge</p>}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step.ui_type === 'notes_upload') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <textarea style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, fontSize: 14, resize: 'none', height: 120, fontFamily: 'inherit' }} placeholder="Add any special instructions, colour codes, measurements, or requests..." onChange={e => useConfiguratorStore.getState().setNotes(e.target.value)} />
        <div style={{ border: '2px dashed #e5e7eb', borderRadius: 10, padding: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#6b7280' }}>📎 Drop reference images or files here</p>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>JPG, PNG, PDF up to 10MB</p>
          <button style={{ marginTop: 12, fontSize: 14, color: 'var(--gold)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Browse files</button>
        </div>
      </div>
    );
  }

  return <p style={{ color: '#9ca3af' }}>Step type not supported.</p>;
}
