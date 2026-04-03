'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import {
  ArrowLeft, Plus, Trash2, GripVertical, ChevronDown, ChevronUp,
  Save, Check, Settings2,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
function token() { return localStorage.getItem('adminToken') || ''; }
function hdrs() { return { Authorization: `Bearer ${token()}` }; }

// ─── Types ────────────────────────────────────────────────────────────────────

type StepType = 'select' | 'color' | 'multiselect' | 'toggle' | 'text' | 'textarea' | 'size';

const STEP_TYPE_LABELS: Record<StepType, string> = {
  select:      'Single Select (radio / dropdown)',
  multiselect: 'Multi Select (checkboxes)',
  color:       'Colour Swatch',
  size:        'Size Grid',
  toggle:      'Toggle (yes / no)',
  text:        'Short Text Input',
  textarea:    'Long Text / Notes',
};

const STEP_TYPE_ICONS: Record<StepType, string> = {
  select:      '⊙',
  multiselect: '☑',
  color:       '🎨',
  size:        '📐',
  toggle:      '⇄',
  text:        'Aa',
  textarea:    '📝',
};

interface StepOption {
  id: string;
  label: string;
  colorHex?: string;
  priceModifier: number;
}

interface CustomStep {
  id: string;
  title: string;
  description?: string;
  type: StepType;
  required: boolean;
  options: StepOption[];
}

function uid() {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function newOption(): StepOption {
  return { id: uid(), label: '', colorHex: '', priceModifier: 0 };
}

function newStep(): CustomStep {
  return { id: uid(), title: '', description: '', type: 'select', required: true, options: [newOption()] };
}

// ─── Preset templates ─────────────────────────────────────────────────────────

const PRESET_STEPS: CustomStep[] = [
  {
    id: uid(), title: 'Select Size', description: 'Choose the correct size for your horse.',
    type: 'size', required: true,
    options: [
      { id: uid(), label: 'Pony', colorHex: '', priceModifier: 0 },
      { id: uid(), label: 'Cob', colorHex: '', priceModifier: 0 },
      { id: uid(), label: 'Full', colorHex: '', priceModifier: 0 },
      { id: uid(), label: 'Warmblood', colorHex: '', priceModifier: 0 },
      { id: uid(), label: 'XL / Draft', colorHex: '', priceModifier: 2 },
    ],
  },
  {
    id: uid(), title: 'Leather Type & Colour', description: 'Select the leather grade and your preferred colour.',
    type: 'color', required: true,
    options: [
      { id: uid(), label: 'Black – Full Grain', colorHex: '#1a1a1a', priceModifier: 0 },
      { id: uid(), label: 'Brown – Full Grain', colorHex: '#6b3a2a', priceModifier: 0 },
      { id: uid(), label: 'Havana – Full Grain', colorHex: '#9b5a2a', priceModifier: 0 },
      { id: uid(), label: 'Black – Patent', colorHex: '#000000', priceModifier: 5 },
      { id: uid(), label: 'White – Bio Leather', colorHex: '#f5f5f0', priceModifier: 8 },
    ],
  },
  {
    id: uid(), title: 'Padding & Lining',
    type: 'select', required: false,
    options: [
      { id: uid(), label: 'No Padding', colorHex: '', priceModifier: 0 },
      { id: uid(), label: 'Foam Padding', colorHex: '', priceModifier: 3 },
      { id: uid(), label: 'Memory Foam Padding', colorHex: '', priceModifier: 6 },
      { id: uid(), label: 'Gel Padding', colorHex: '', priceModifier: 8 },
    ],
  },
  {
    id: uid(), title: 'Hardware Finish',
    type: 'select', required: true,
    options: [
      { id: uid(), label: 'Stainless Steel', colorHex: '', priceModifier: 0 },
      { id: uid(), label: 'Antique Brass', colorHex: '', priceModifier: 2 },
      { id: uid(), label: 'Matte Black', colorHex: '', priceModifier: 3 },
      { id: uid(), label: 'Rose Gold', colorHex: '', priceModifier: 5 },
    ],
  },
  {
    id: uid(), title: 'Stitching Colour',
    type: 'color', required: false,
    options: [
      { id: uid(), label: 'Black', colorHex: '#1a1a1a', priceModifier: 0 },
      { id: uid(), label: 'White', colorHex: '#ffffff', priceModifier: 0 },
      { id: uid(), label: 'Brown', colorHex: '#6b3a2a', priceModifier: 0 },
      { id: uid(), label: 'Gold', colorHex: '#C8860A', priceModifier: 1 },
    ],
  },
  {
    id: uid(), title: 'Logo / Branding', description: 'Add your logo or stable name (optional).',
    type: 'toggle', required: false,
    options: [
      { id: uid(), label: 'No Branding', colorHex: '', priceModifier: 0 },
      { id: uid(), label: 'Add Logo / Name', colorHex: '', priceModifier: 8 },
    ],
  },
  {
    id: uid(), title: 'Special Measurements', description: 'Enter any non-standard measurements or notes for the workshop.',
    type: 'textarea', required: false,
    options: [],
  },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProductCustomizePage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<any>(null);
  const [steps, setSteps] = useState<CustomStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/products/${productId}`, { headers: hdrs() });
      setProduct(res.data);
      const f = res.data.features;
      // Support both old array format and new object format
      const existing: CustomStep[] = Array.isArray(f?.customizationSteps)
        ? f.customizationSteps
        : [];
      setSteps(existing);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [productId]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const f = product?.features;
      // Preserve existing specs (array format) alongside steps
      const specs = Array.isArray(f) ? f : Array.isArray(f?.specs) ? f.specs : [];
      await axios.patch(`${API}/products/${productId}`, {
        features: { specs, customizationSteps: steps },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  }

  function addStep() {
    const s = newStep();
    setSteps(prev => [...prev, s]);
    setExpandedId(s.id);
  }

  function removeStep(id: string) {
    setSteps(prev => prev.filter(s => s.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  function moveStep(id: string, dir: -1 | 1) {
    setSteps(prev => {
      const idx = prev.findIndex(s => s.id === id);
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  }

  function updateStep(id: string, patch: Partial<CustomStep>) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }

  function addOption(stepId: string) {
    setSteps(prev => prev.map(s => s.id === stepId
      ? { ...s, options: [...s.options, newOption()] }
      : s
    ));
  }

  function updateOption(stepId: string, optId: string, patch: Partial<StepOption>) {
    setSteps(prev => prev.map(s => s.id === stepId
      ? { ...s, options: s.options.map(o => o.id === optId ? { ...o, ...patch } : o) }
      : s
    ));
  }

  function removeOption(stepId: string, optId: string) {
    setSteps(prev => prev.map(s => s.id === stepId
      ? { ...s, options: s.options.filter(o => o.id !== optId) }
      : s
    ));
  }

  function applyPresets() {
    setSteps(PRESET_STEPS.map(s => ({ ...s, id: uid(), options: s.options.map(o => ({ ...o, id: uid() })) })));
    setShowPresets(false);
    setExpandedId(null);
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-gray-400">Loading…</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Settings2 size={16} className="text-[#1A3C5E]" />
              <h1 className="text-xl font-bold text-gray-900">Customization Steps</h1>
            </div>
            {product && (
              <p className="text-sm text-gray-500 mt-0.5">
                {product.name} <span className="font-mono text-xs text-gray-300 ml-1">#{product.sku}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPresets(v => !v)}
            className="px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            Load Presets
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A3C5E] text-white text-sm font-semibold rounded-lg hover:bg-[#112E4D] disabled:opacity-50"
          >
            {saved ? <><Check size={14} /> Saved!</> : saving ? 'Saving…' : <><Save size={14} /> Save Steps</>}
          </button>
        </div>
      </div>

      {/* Preset loader */}
      {showPresets && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
          <p className="font-semibold text-gray-900 text-sm">Load Preset Steps</p>
          <p className="text-sm text-gray-600">
            This will replace all current steps with a standard bridle-style template
            (Size → Leather → Padding → Hardware → Stitching → Branding → Notes).
            You can then edit, add, or remove steps to match this product.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={applyPresets}
              className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700">
              Apply Presets
            </button>
            <button type="button" onClick={() => setShowPresets(false)}
              className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Step count + info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {steps.length === 0 ? 'No steps defined yet.' : `${steps.length} customization step${steps.length === 1 ? '' : 's'}`}
        </p>
        <button type="button" onClick={addStep}
          className="flex items-center gap-1.5 text-sm font-semibold text-[#1A3C5E] hover:underline">
          <Plus size={14} /> Add Step
        </button>
      </div>

      {/* Steps list */}
      {steps.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl py-16 text-center">
          <Settings2 size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No customization steps yet</p>
          <p className="text-gray-400 text-sm mt-1">Add steps to let customers personalise this product</p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <button type="button" onClick={addStep}
              className="flex items-center gap-2 px-4 py-2 bg-[#1A3C5E] text-white text-sm font-semibold rounded-lg hover:bg-[#112E4D]">
              <Plus size={14} /> Add First Step
            </button>
            <button type="button" onClick={() => setShowPresets(true)}
              className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50">
              Load Presets
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {steps.map((step, idx) => (
            <StepCard
              key={step.id}
              step={step}
              index={idx}
              total={steps.length}
              expanded={expandedId === step.id}
              onToggle={() => setExpandedId(expandedId === step.id ? null : step.id)}
              onMove={dir => moveStep(step.id, dir)}
              onRemove={() => removeStep(step.id)}
              onUpdate={patch => updateStep(step.id, patch)}
              onAddOption={() => addOption(step.id)}
              onUpdateOption={(optId, patch) => updateOption(step.id, optId, patch)}
              onRemoveOption={optId => removeOption(step.id, optId)}
            />
          ))}
          <button type="button" onClick={addStep}
            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 font-medium hover:border-[#1A3C5E] hover:text-[#1A3C5E] transition-colors flex items-center justify-center gap-2">
            <Plus size={14} /> Add Another Step
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Step card ────────────────────────────────────────────────────────────────

function StepCard({ step, index, total, expanded, onToggle, onMove, onRemove, onUpdate, onAddOption, onUpdateOption, onRemoveOption }: {
  step: CustomStep;
  index: number;
  total: number;
  expanded: boolean;
  onToggle: () => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onUpdate: (patch: Partial<CustomStep>) => void;
  onAddOption: () => void;
  onUpdateOption: (optId: string, patch: Partial<StepOption>) => void;
  onRemoveOption: (optId: string) => void;
}) {
  const hasOptions = !['text', 'textarea'].includes(step.type);

  return (
    <div className={`bg-white border rounded-xl overflow-hidden transition-all ${expanded ? 'border-[#1A3C5E] shadow-md' : 'border-gray-200'}`}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none" onClick={onToggle}>
        <div className="flex flex-col gap-0.5 text-gray-300">
          <button type="button" title="Move up" disabled={index === 0}
            onClick={e => { e.stopPropagation(); onMove(-1); }}
            className="disabled:opacity-20 hover:text-gray-600 leading-none">
            <ChevronUp size={13} />
          </button>
          <button type="button" title="Move down" disabled={index === total - 1}
            onClick={e => { e.stopPropagation(); onMove(1); }}
            className="disabled:opacity-20 hover:text-gray-600 leading-none">
            <ChevronDown size={13} />
          </button>
        </div>
        <GripVertical size={14} className="text-gray-300 shrink-0" />
        <span className="w-6 h-6 rounded-full bg-[#1A3C5E] text-white text-xs font-bold flex items-center justify-center shrink-0">
          {index + 1}
        </span>
        <span className="text-base font-semibold text-gray-800 flex-1 truncate">
          {step.title || <span className="text-gray-400 font-normal italic">Untitled step</span>}
        </span>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full hidden sm:inline">
          {STEP_TYPE_ICONS[step.type]} {STEP_TYPE_LABELS[step.type].split(' ')[0]}
        </span>
        {step.required
          ? <span className="text-xs text-red-500 font-semibold hidden sm:inline">Required</span>
          : <span className="text-xs text-gray-400 hidden sm:inline">Optional</span>}
        <button type="button" title="Remove step"
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="ml-1 text-gray-300 hover:text-red-500 shrink-0">
          <Trash2 size={14} />
        </button>
        {expanded ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-5 bg-gray-50">
          {/* Step meta */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="col-span-2 lg:col-span-1">
              <label className="text-xs text-gray-500 block mb-1">Step Title *</label>
              <input
                value={step.title}
                onChange={e => onUpdate({ title: e.target.value })}
                placeholder="e.g. Choose Leather Type"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1A3C5E] bg-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Input Type</label>
              <select
                value={step.type}
                onChange={e => onUpdate({ type: e.target.value as StepType, options: step.options.length ? step.options : [newOption()] })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-[#1A3C5E]"
              >
                {(Object.keys(STEP_TYPE_LABELS) as StepType[]).map(t => (
                  <option key={t} value={t}>{STEP_TYPE_ICONS[t]} {STEP_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={step.required}
                  onChange={e => onUpdate({ required: e.target.checked })} className="rounded" />
                Required
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Help Text <span className="text-gray-300">(shown to customer)</span></label>
            <input
              value={step.description || ''}
              onChange={e => onUpdate({ description: e.target.value })}
              placeholder="Optional hint or description for this step"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1A3C5E] bg-white"
            />
          </div>

          {/* Options (only for non-text types) */}
          {hasOptions && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Options</label>
                <button type="button" onClick={onAddOption}
                  className="flex items-center gap-1 text-xs text-[#1A3C5E] font-semibold hover:underline">
                  <Plus size={11} /> Add Option
                </button>
              </div>
              <div className="space-y-2">
                {step.options.map((opt, oi) => (
                  <div key={opt.id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                    {step.type === 'color' && (
                      <div className="relative">
                        <input
                          type="color"
                          value={opt.colorHex || '#cccccc'}
                          onChange={e => onUpdateOption(opt.id, { colorHex: e.target.value })}
                          className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                          title="Pick colour"
                        />
                      </div>
                    )}
                    <input
                      value={opt.label}
                      onChange={e => onUpdateOption(opt.id, { label: e.target.value })}
                      placeholder={`Option ${oi + 1}`}
                      className="flex-1 text-sm outline-none border-0 bg-transparent"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-gray-400">+€</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={opt.priceModifier}
                        onChange={e => onUpdateOption(opt.id, { priceModifier: parseFloat(e.target.value) || 0 })}
                        className="w-14 text-sm outline-none border border-gray-200 rounded px-2 py-0.5 text-center"
                        title="Price modifier"
                      />
                    </div>
                    <button type="button" onClick={() => onRemoveOption(opt.id)}
                      disabled={step.options.length <= 1}
                      className="text-gray-300 hover:text-red-500 disabled:opacity-20">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasOptions && (
            <div className="text-xs text-gray-400 italic bg-white border border-gray-200 rounded-lg px-3 py-3">
              This step type shows a free-text field to the customer — no options needed.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
