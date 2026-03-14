'use client';
import { useRef, useState } from 'react';
import type { ConfiguratorStep as StepType } from '@blikcart/types';
import { useConfiguratorStore } from '@/store/configurator.store';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

interface Props { step: StepType; }

export default function ConfiguratorStep({ step }: Props) {
  const { selections, selectOption, quantity, setQuantity, moq } = useConfiguratorStore();
  const selected = selections[step.id];
  // Guard: newly-created steps may have options: null from the DB
  const opts: StepType['options'] = step.options ?? [];

  // File upload state (used only by notes_upload steps)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (file.size > 10 * 1024 * 1024) { setUploadError('File must be under 10 MB'); return; }
    setUploading(true);
    setUploadError('');
    try {
      const tok = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const res = await fetch(`${API}/configurator/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      if (!res.ok) throw new Error('Could not get upload URL');
      const { uploadUrl, fileUrl } = await res.json();
      await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      const next = [...uploadedFiles, { name: file.name, url: fileUrl }];
      setUploadedFiles(next);
      selectOption(step.id, JSON.stringify(next.map(f => f.url)));
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  function removeFile(url: string) {
    const next = uploadedFiles.filter(f => f.url !== url);
    setUploadedFiles(next);
    selectOption(step.id, next.length ? JSON.stringify(next.map(f => f.url)) : '');
  }

  if (step.ui_type === 'image_card_grid') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {opts.map(opt => (
          <button type="button" key={opt.id} onClick={() => selectOption(step.id, opt.id)} style={{ border: selected === opt.id ? '2px solid var(--gold)' : '2px solid #e5e7eb', borderRadius: 10, padding: 12, textAlign: 'left', background: selected === opt.id ? 'rgba(200,134,10,0.05)' : 'white', cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
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
          {opts.map(opt => (
            <button type="button" key={opt.id} onClick={() => selectOption(step.id, opt.id)} title={opt.label} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: opt.color_hex || '#ccc', border: selected === opt.id ? '3px solid var(--gold)' : '3px solid #e5e7eb', boxShadow: selected === opt.id ? '0 0 0 2px var(--gold)' : 'none', transition: 'all 0.2s', transform: selected === opt.id ? 'scale(1.15)' : 'scale(1)' }} />
            </button>
          ))}
        </div>
        {selected && (<p style={{ marginTop: 16, fontSize: 14, color: '#6b7280' }}>Selected: <strong style={{ color: 'var(--navy)' }}>{opts.find(o => o.id === selected)?.label}</strong>{(opts.find(o => o.id === selected)?.price_modifier ?? 0) > 0 && (<span style={{ color: 'var(--gold)', marginLeft: 8 }}>+€{opts.find(o => o.id === selected)?.price_modifier?.toFixed(2)}</span>)}</p>)}
      </div>
    );
  }

  if (step.ui_type === 'icon_radio') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {opts.map(opt => (
          <button type="button" key={opt.id} onClick={() => selectOption(step.id, opt.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, border: selected === opt.id ? '2px solid var(--gold)' : '2px solid #e5e7eb', borderRadius: 10, textAlign: 'left', background: selected === opt.id ? 'rgba(200,134,10,0.05)' : 'white', cursor: 'pointer', transition: 'all 0.2s' }}>
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

  if ((step.ui_type as string) === 'parts_selector') {
    const selectedParts: string[] = (() => { try { return selected ? JSON.parse(selected) : []; } catch { return []; } })();
    const isFullBridle = selectedParts.includes('full_bridle');
    const togglePart = (partId: string) => {
      if (partId === 'full_bridle') { selectOption(step.id, JSON.stringify(isFullBridle ? [] : ['full_bridle'])); return; }
      let next = selectedParts.filter(p => p !== 'full_bridle');
      next = next.includes(partId) ? next.filter(p => p !== partId) : [...next, partId];
      selectOption(step.id, JSON.stringify(next));
    };
    const isSelected = (id: string) => selectedParts.includes(id);
    const completeParts = opts.filter((o: any) => o.category === 'complete');
    const individualParts = opts.filter((o: any) => o.category === 'part');
    return (
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Complete Set</p>
        {completeParts.map(opt => (
          <button type="button" key={opt.id} onClick={() => togglePart(opt.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: 18, border: isSelected(opt.id) ? '2px solid var(--gold)' : '2px solid #e5e7eb', borderRadius: 12, background: isSelected(opt.id) ? 'rgba(200,134,10,0.06)' : 'white', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', marginBottom: 20 }}>
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
            <button type="button" key={opt.id} onClick={() => togglePart(opt.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, border: isSelected(opt.id) ? '2px solid var(--gold)' : '2px solid #e5e7eb', borderRadius: 10, background: isSelected(opt.id) ? 'rgba(200,134,10,0.06)' : 'white', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', opacity: isFullBridle ? 0.4 : 1 }}>
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
            <button type="button" onClick={() => setQuantity(Math.max(moq, quantity - 1))} style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--navy)', color: 'var(--navy)', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'white' }}>−</button>
            <input type="number" value={quantity} min={moq} onChange={e => setQuantity(Math.max(moq, parseInt(e.target.value) || moq))} style={{ width: 80, textAlign: 'center', border: '2px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 18, fontWeight: 700, color: 'var(--navy)' }} />
            <button type="button" onClick={() => setQuantity(quantity + 1)} style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--navy)', color: 'var(--navy)', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'white' }}>+</button>
            <span style={{ fontSize: 14, color: '#6b7280' }}>units</span>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[{min:5,label:'5–19',d:'5% off'},{min:20,label:'20–49',d:'10% off'},{min:50,label:'50–99',d:'15% off'},{min:100,label:'100+',d:'18% off'}].map(t => (
              <div key={t.min} style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: quantity >= t.min ? 'var(--gold)' : '#f3f4f6', color: quantity >= t.min ? 'white' : '#6b7280', transition: 'all 0.2s' }}>{t.label} — {t.d}</div>
            ))}
          </div>
        </div>
        {opts.length > 0 && (
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Delivery Speed</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {opts.map(opt => (
                <button type="button" key={opt.id} onClick={() => selectOption(step.id, opt.id)} style={{ padding: 16, border: selected === opt.id ? '2px solid var(--gold)' : '2px solid #e5e7eb', borderRadius: 10, background: selected === opt.id ? 'rgba(200,134,10,0.05)' : 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
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
        )}
      </div>
    );
  }

  if (step.ui_type === 'notes_upload') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <textarea
          style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, fontSize: 14, resize: 'none', height: 120, fontFamily: 'inherit' }}
          placeholder="Add any special instructions, colour codes, measurements, or requests..."
          onChange={e => useConfiguratorStore.getState().setNotes(e.target.value)}
        />
        <input
          ref={fileInputRef}
          type="file"
          title="Upload reference file"
          accept="image/*,.pdf"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <div
          style={{ border: '2px dashed #e5e7eb', borderRadius: 10, padding: 32, textAlign: 'center', background: uploading ? '#fafafa' : 'white' }}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--gold)'; }}
          onDragLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
          onDrop={e => {
            e.preventDefault();
            e.currentTarget.style.borderColor = '#e5e7eb';
            const file = e.dataTransfer.files?.[0];
            if (file) handleFileSelect({ target: { files: [file], value: '' } } as any);
          }}
        >
          {uploading ? (
            <p style={{ fontSize: 14, color: 'var(--gold)', fontWeight: 600 }}>Uploading…</p>
          ) : (
            <>
              <p style={{ fontSize: 14, color: '#6b7280' }}>📎 Drop reference images or files here</p>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>JPG, PNG, PDF up to 10MB</p>
              <button type="button" onClick={() => fileInputRef.current?.click()}
                style={{ marginTop: 12, fontSize: 14, color: 'var(--gold)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                Browse files
              </button>
            </>
          )}
        </div>
        {uploadError && <p style={{ fontSize: 13, color: '#ef4444' }}>{uploadError}</p>}
        {uploadedFiles.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {uploadedFiles.map(f => (
              <div key={f.url} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: 16 }}>📄</span>
                <span style={{ fontSize: 13, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                <button type="button" onClick={() => removeFile(f.url)}
                  style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (step.ui_type === 'toggle') {
    const isOn = selected === 'true';
    return (
      <div
        role="switch"
        aria-checked={isOn}
        tabIndex={0}
        onClick={() => selectOption(step.id, isOn ? '' : 'true')}
        onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); selectOption(step.id, isOn ? '' : 'true'); } }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: 'white', border: `2px solid ${isOn ? 'var(--gold)' : '#e5e7eb'}`, borderRadius: 12, cursor: 'pointer', transition: 'border-color 0.2s' }}
      >
        <div>
          <p style={{ fontWeight: 600, color: 'var(--navy)', fontSize: 15 }}>{opts[0]?.label || 'Enable'}</p>
          {opts[0]?.description && <p style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{opts[0].description}</p>}
        </div>
        <div style={{ width: 52, height: 28, borderRadius: 14, background: isOn ? 'var(--gold)' : '#e5e7eb', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: isOn ? 26 : 2, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
        </div>
      </div>
    );
  }

  if (step.ui_type === 'dropdown') {
    const selectedOpt = opts.find(o => o.id === selected);
    return (
      <div>
        <div style={{ position: 'relative' }}>
          <select
            aria-label={step.title}
            value={selected || ''}
            onChange={e => selectOption(step.id, e.target.value)}
            style={{ width: '100%', padding: '14px 44px 14px 16px', border: `2px solid ${selected ? 'var(--gold)' : '#e5e7eb'}`, borderRadius: 10, fontSize: 15, color: selected ? 'var(--navy)' : '#9ca3af', background: 'white', cursor: 'pointer', outline: 'none', appearance: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
          >
            <option value="" disabled>Choose an option…</option>
            {opts.map(opt => (
              <option key={opt.id} value={opt.id}>
                {opt.label}{(opt.price_modifier ?? 0) > 0 ? ` (+€${(opt.price_modifier ?? 0).toFixed(2)})` : ''}
              </option>
            ))}
          </select>
          <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 12, color: '#6b7280' }}>▼</span>
        </div>
        {selectedOpt && (
          <p style={{ marginTop: 8, fontSize: 13, color: '#6b7280' }}>
            Selected: <strong style={{ color: 'var(--navy)' }}>{selectedOpt.label}</strong>
            {(selectedOpt.price_modifier ?? 0) > 0 && <span style={{ color: 'var(--gold)', marginLeft: 8 }}>+€{(selectedOpt.price_modifier ?? 0).toFixed(2)}</span>}
          </p>
        )}
      </div>
    );
  }

  if (step.ui_type === 'text_input') {
    const maxLength = parseInt(opts[0]?.description || '200') || 200;
    const placeholder = opts[0]?.label || 'Enter value…';
    return (
      <div>
        <input
          type="text"
          aria-label={step.title}
          value={selected || ''}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={e => selectOption(step.id, e.target.value)}
          style={{ width: '100%', padding: '14px 16px', border: `2px solid ${selected ? 'var(--gold)' : '#e5e7eb'}`, borderRadius: 10, fontSize: 15, color: 'var(--navy)', background: 'white', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
        />
        <p style={{ marginTop: 6, fontSize: 12, color: '#9ca3af', textAlign: 'right' }}>{(selected || '').length} / {maxLength} chars</p>
        {opts.slice(1).map(opt => (
          <button key={opt.id} type="button" onClick={() => selectOption(step.id, opt.id === selected ? '' : opt.id)}
            style={{ marginTop: 8, marginRight: 8, padding: '6px 14px', border: `2px solid ${selected === opt.id ? 'var(--gold)' : '#e5e7eb'}`, borderRadius: 20, fontSize: 13, fontWeight: 600, color: selected === opt.id ? 'var(--gold)' : '#374151', background: 'white', cursor: 'pointer' }}>
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  if (step.ui_type === 'date_picker') {
    const today = new Date().toISOString().slice(0, 10);
    const formatted = selected ? new Date(selected + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    return (
      <div>
        <input
          type="date"
          aria-label={step.title}
          value={selected || ''}
          min={today}
          onChange={e => selectOption(step.id, e.target.value)}
          style={{ width: '100%', padding: '14px 16px', border: `2px solid ${selected ? 'var(--gold)' : '#e5e7eb'}`, borderRadius: 10, fontSize: 15, color: selected ? 'var(--navy)' : '#9ca3af', background: 'white', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
        />
        {selected && (
          <p style={{ marginTop: 8, fontSize: 13, color: '#6b7280' }}>
            Requested delivery: <strong style={{ color: 'var(--navy)' }}>{formatted}</strong>
          </p>
        )}
        {!step.required && (
          <p style={{ marginTop: 6, fontSize: 12, color: '#9ca3af' }}>Optional — skip if no specific date required</p>
        )}
      </div>
    );
  }

  // Unknown / null ui_type — fall back to best-guess renderer
  if (opts.length > 0) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {opts.map(opt => (
          <button type="button" key={opt.id} onClick={() => selectOption(step.id, opt.id)} style={{ border: selected === opt.id ? '2px solid var(--gold)' : '2px solid #e5e7eb', borderRadius: 10, padding: 12, textAlign: 'left', background: selected === opt.id ? 'rgba(200,134,10,0.05)' : 'white', cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
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

  // No options and unknown type — free text input
  return (
    <div>
      <input
        type="text"
        aria-label={step.title}
        value={selected || ''}
        placeholder="Enter value…"
        onChange={e => selectOption(step.id, e.target.value)}
        style={{ width: '100%', padding: '14px 16px', border: `2px solid ${selected ? 'var(--gold)' : '#e5e7eb'}`, borderRadius: 10, fontSize: 15, color: 'var(--navy)', background: 'white', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
      />
    </div>
  );
}
