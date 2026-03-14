'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Save,
  Check,
  X,
  ChevronRight,
  Settings,
  Layers,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface StepOption {
  id: string;
  label: string;
  price_modifier: number;
  image_url?: string;
  layer_key?: string;
}

type UiType =
  | 'image_card_grid'
  | 'swatch'
  | 'icon_radio'
  | 'quantity_delivery'
  | 'notes_upload'
  | 'toggle'
  | 'dropdown'
  | 'text_input'
  | 'date_picker';

const UI_TYPE_LABELS: Record<UiType, string> = {
  image_card_grid: 'Image Card Grid',
  swatch: 'Colour Swatch',
  icon_radio: 'Icon Radio',
  quantity_delivery: 'Quantity & Delivery',
  notes_upload: 'Notes & Upload',
  toggle: 'Toggle',
  dropdown: 'Dropdown',
  text_input: 'Text Input',
  date_picker: 'Date Picker',
};

interface Step {
  id: string;
  title: string;
  description?: string;
  ui_type: UiType;
  required: boolean;
  condition?: { stepId: string; optionId: string } | null;
  options: StepOption[];
}

interface SchemaVersion {
  id: string;
  versionNumber: number;
  steps: Step[];
  notes: string;
  createdAt: string;
}

interface Schema {
  id: string;
  category: { name: string; slug: string };
  basePrice: number;
  moq: number;
  leadTimeStandardDays: number;
  leadTimeExpressDays: number;
  expressPriceMultiplier: number;
  isActive: boolean;
  versions: SchemaVersion[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(str: string) {
  return str.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}
function newStepId() {
  return `step_${Date.now()}`;
}
function newOptionId() {
  return `opt_${Date.now()}`;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

function authHeaders() {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('adminToken') : '';
  return { Authorization: `Bearer ${token}` };
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="flex h-screen bg-gray-50 animate-pulse">
      <div className="w-60 bg-white border-r border-gray-200 p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-gray-100 rounded" />
        ))}
      </div>
      <div className="flex-1 p-6 space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-20 bg-gray-100 rounded" />
        <div className="h-40 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

// ─── Live Preview Modal ───────────────────────────────────────────────────────

interface PreviewModalProps {
  steps: Step[];
  basePrice: number;
  onClose: () => void;
}

function PreviewModal({ steps, basePrice, onClose }: PreviewModalProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  // Compute visible steps respecting conditions
  const visibleSteps = steps.filter((step) => {
    if (!step.condition) return true;
    return selections[step.condition.stepId] === step.condition.optionId;
  });

  const totalSteps = visibleSteps.length;
  const current = visibleSteps[currentIdx];

  const estimatedPrice =
    basePrice +
    Object.entries(selections).reduce((sum, [, optId]) => {
      for (const step of steps) {
        const opt = step.options.find((o) => o.id === optId);
        if (opt) return sum + (opt.price_modifier || 0);
      }
      return sum;
    }, 0);

  function selectOption(stepId: string, optionId: string) {
    setSelections((prev) => ({ ...prev, [stepId]: optionId }));
  }

  function handleNext() {
    if (currentIdx < totalSteps - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      setDone(true);
    }
  }

  function handleBack() {
    if (currentIdx > 0) setCurrentIdx((i) => i - 1);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-800 text-lg">
              Configurator Preview
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          /* Completion screen */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Configuration Complete
            </h2>
            <p className="text-gray-500 text-sm">
              Estimated price:{' '}
              <span className="font-semibold text-gray-800">
                €{estimatedPrice.toFixed(2)}
              </span>
            </p>
            <div className="mt-4 w-full max-w-sm bg-gray-50 rounded-lg p-4 space-y-2">
              {Object.entries(selections).map(([stepId, optId]) => {
                const step = steps.find((s) => s.id === stepId);
                const opt = step?.options.find((o) => o.id === optId);
                if (!step || !opt) return null;
                return (
                  <div key={stepId} className="flex justify-between text-sm">
                    <span className="text-gray-600">{step.title}</span>
                    <span className="font-medium text-gray-800">{opt.label}</span>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                setDone(false);
                setCurrentIdx(0);
                setSelections({});
              }}
              className="mt-4 px-5 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Start Over
            </button>
          </div>
        ) : totalSteps === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            No steps to preview. Add some steps first.
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="px-6 pt-4 pb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500">
                  Step {currentIdx + 1} of {totalSteps}
                </span>
                <span className="text-xs text-gray-500">
                  Est. €{estimatedPrice.toFixed(2)}
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIdx + 1) / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            {/* Step content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <h3 className="text-xl font-bold text-gray-800 mb-1">
                {current.title}
              </h3>
              {current.description && (
                <p className="text-sm text-gray-500 mb-4">{current.description}</p>
              )}

              {/* image_card_grid / icon_radio — card grid */}
              {(current.ui_type === 'image_card_grid' || current.ui_type === 'icon_radio') && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {current.options.map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => selectOption(current.id, opt.id)}
                      className={`flex flex-col items-center justify-center gap-2 px-3 py-4 rounded-lg border-2 transition-all ${
                        selections[current.id] === opt.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      {opt.image_url && (
                        <img src={opt.image_url} alt={opt.label} className="w-12 h-12 object-cover rounded" />
                      )}
                      <span className="text-sm font-medium text-gray-800 text-center">{opt.label}</span>
                      {opt.price_modifier !== 0 && (
                        <span className={`text-xs font-semibold ${opt.price_modifier > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {opt.price_modifier > 0 ? '+' : ''}€{opt.price_modifier.toFixed(2)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* swatch — colour circles */}
              {current.ui_type === 'swatch' && (
                <div className="flex flex-wrap gap-3">
                  {current.options.map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      title={opt.label}
                      onClick={() => selectOption(current.id, opt.id)}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all ${
                        selections[current.id] === opt.id ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-full border border-gray-200 shadow-sm"
                        style={{ background: opt.layer_key || '#ccc' }}
                      />
                      <span className="text-xs text-gray-600 max-w-[64px] text-center leading-tight">{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* icon_radio (list style fallback) / standalone radio list */}
              {current.ui_type === 'quantity_delivery' && (
                <div className="space-y-2">
                  {current.options.map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => selectOption(current.id, opt.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all text-left ${
                        selections[current.id] === opt.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${selections[current.id] === opt.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                          {selections[current.id] === opt.id && <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5" />}
                        </div>
                        <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                      </div>
                      {opt.price_modifier !== 0 && (
                        <span className={`text-xs font-semibold ${opt.price_modifier > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {opt.price_modifier > 0 ? '+' : ''}€{opt.price_modifier.toFixed(2)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* dropdown */}
              {current.ui_type === 'dropdown' && (
                <select
                  title={`Select ${current.title}`}
                  value={selections[current.id] || ''}
                  onChange={(e) => selectOption(current.id, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">— Select an option —</option>
                  {current.options.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}{opt.price_modifier !== 0 ? ` (${opt.price_modifier > 0 ? '+' : ''}€${opt.price_modifier.toFixed(2)})` : ''}
                    </option>
                  ))}
                </select>
              )}

              {/* toggle */}
              {current.ui_type === 'toggle' && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label={selections[current.id] === 'true' ? 'Disable' : 'Enable'}
                    aria-pressed={selections[current.id] === 'true' ? 'true' : 'false'}
                    onClick={() => selectOption(current.id, selections[current.id] === 'true' ? 'false' : 'true')}
                    className={`relative w-12 h-6 rounded-full transition-colors ${selections[current.id] === 'true' ? 'bg-blue-500' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${selections[current.id] === 'true' ? 'translate-x-6' : ''}`} />
                  </button>
                  <span className="text-sm text-gray-700">{selections[current.id] === 'true' ? (current.options[0]?.label || 'Enabled') : 'Disabled'}</span>
                </div>
              )}

              {/* text_input */}
              {current.ui_type === 'text_input' && (
                <input
                  type="text"
                  placeholder={current.description || 'Enter text…'}
                  value={selections[current.id] || ''}
                  onChange={(e) => selectOption(current.id, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}

              {/* date_picker */}
              {current.ui_type === 'date_picker' && (
                <input
                  type="date"
                  title={current.title}
                  aria-label={current.title}
                  value={selections[current.id] || ''}
                  onChange={(e) => selectOption(current.id, e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}

              {/* notes_upload */}
              {current.ui_type === 'notes_upload' && (
                <div className="space-y-3">
                  <textarea
                    placeholder="Add notes or special instructions…"
                    value={selections[current.id] || ''}
                    onChange={(e) => selectOption(current.id, e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer border border-dashed border-gray-300 rounded-lg px-4 py-3 hover:border-blue-400 transition-colors">
                    <span>📎</span> Attach reference file (preview only)
                  </label>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentIdx === 0}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={
                  current.required && !selections[current.id]
                }
                className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              >
                {currentIdx < totalSteps - 1 ? (
                  <>
                    Next <ChevronRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Finish <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SchemaEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // ── Schema state ──
  const [schema, setSchema] = useState<Schema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Base settings state ──
  const [basePrice, setBasePrice] = useState(0);
  const [moq, setMoq] = useState(1);
  const [leadTimeStandard, setLeadTimeStandard] = useState(7);
  const [leadTimeExpress, setLeadTimeExpress] = useState(3);
  const [expressMultiplier, setExpressMultiplier] = useState(1.5);
  const [isActive, setIsActive] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // ── Editor state ──
  const [steps, setSteps] = useState<Step[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [loadedVersionNumber, setLoadedVersionNumber] = useState<number | null>(null);
  const [releaseNotes, setReleaseNotes] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // ── DnD refs ──
  const stepDragIdx = useRef<number | null>(null);
  const optDragIdx = useRef<number | null>(null);

  // ── Load schema ──
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/configurator/admin/schemas/${id}`, {
        headers: authHeaders(),
      });
      const data: Schema = res.data;
      setSchema(data);
      setBasePrice(data.basePrice);
      setMoq(data.moq);
      setLeadTimeStandard(data.leadTimeStandardDays);
      setLeadTimeExpress(data.leadTimeExpressDays);
      setExpressMultiplier(data.expressPriceMultiplier);
      setIsActive(data.isActive);

      // Load latest version into editor
      if (data.versions && data.versions.length > 0) {
        const sorted = [...data.versions].sort(
          (a, b) => b.versionNumber - a.versionNumber
        );
        const latest = sorted[0];
        setSteps(latest.steps || []);
        setLoadedVersionNumber(latest.versionNumber);
        if ((latest.steps || []).length > 0) {
          setSelectedStepId(latest.steps[0].id);
        }
      }
    } catch {
      setError('Failed to load schema. Please check the ID and try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Derived ──
  const sortedVersions = schema
    ? [...schema.versions].sort((a, b) => b.versionNumber - a.versionNumber)
    : [];
  const nextVersionNumber =
    sortedVersions.length > 0 ? sortedVersions[0].versionNumber + 1 : 1;
  const selectedStep = steps.find((s) => s.id === selectedStepId) || null;

  // ── Settings save ──
  async function handleSaveSettings() {
    setSavingSettings(true);
    try {
      await axios.patch(
        `${API_BASE}/configurator/admin/schemas/${id}`,
        {
          basePrice,
          moq,
          leadTimeStandardDays: leadTimeStandard,
          leadTimeExpressDays: leadTimeExpress,
          expressPriceMultiplier: expressMultiplier,
          isActive,
        },
        { headers: authHeaders() }
      );
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } catch {
      alert('Failed to save settings. Please try again.');
    } finally {
      setSavingSettings(false);
    }
  }

  // ── Version load ──
  function handleLoadVersion(version: SchemaVersion) {
    setSteps(version.steps || []);
    setLoadedVersionNumber(version.versionNumber);
    if ((version.steps || []).length > 0) {
      setSelectedStepId(version.steps[0].id);
    } else {
      setSelectedStepId(null);
    }
  }

  // ── Publish ──
  async function handlePublish() {
    if (!releaseNotes.trim()) {
      alert('Please enter release notes before publishing.');
      return;
    }
    setPublishing(true);
    try {
      await axios.post(
        `${API_BASE}/configurator/admin/schemas/${id}/versions`,
        { steps, notes: releaseNotes },
        { headers: authHeaders() }
      );
      setReleaseNotes('');
      await load();
    } catch {
      alert('Failed to publish version. Please try again.');
    } finally {
      setPublishing(false);
    }
  }

  // ── Step CRUD ──
  function handleAddStep() {
    const newStep: Step = {
      id: newStepId(),
      title: 'New Step',
      ui_type: 'image_card_grid',
      required: true,
      options: [],
    };
    setSteps((prev) => [...prev, newStep]);
    setSelectedStepId(newStep.id);
  }

  function handleDeleteStep(stepId: string) {
    setSteps((prev) => prev.filter((s) => s.id !== stepId));
    if (selectedStepId === stepId) {
      setSelectedStepId(null);
    }
  }

  function updateStep(stepId: string, patch: Partial<Step>) {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, ...patch } : s))
    );
  }

  // ── Option CRUD ──
  function handleAddOption(stepId: string) {
    const newOpt: StepOption = {
      id: newOptionId(),
      label: 'Option',
      price_modifier: 0,
    };
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId ? { ...s, options: [...s.options, newOpt] } : s
      )
    );
  }

  function handleDeleteOption(stepId: string, optId: string) {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? { ...s, options: s.options.filter((o) => o.id !== optId) }
          : s
      )
    );
  }

  function updateOption(stepId: string, optId: string, patch: Partial<StepOption>) {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? {
              ...s,
              options: s.options.map((o) =>
                o.id === optId ? { ...o, ...patch } : o
              ),
            }
          : s
      )
    );
  }

  // ── Step DnD ──
  function handleStepDragStart(idx: number) {
    stepDragIdx.current = idx;
  }

  function handleStepDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    const from = stepDragIdx.current;
    if (from === null || from === idx) return;
    setSteps((prev) => {
      const arr = [...prev];
      const [removed] = arr.splice(from, 1);
      arr.splice(idx, 0, removed);
      return arr;
    });
    stepDragIdx.current = idx;
  }

  function handleStepDrop() {
    stepDragIdx.current = null;
  }

  // ── Option DnD ──
  function handleOptDragStart(idx: number) {
    optDragIdx.current = idx;
  }

  function handleOptDragOver(
    e: React.DragEvent,
    stepId: string,
    idx: number
  ) {
    e.preventDefault();
    const from = optDragIdx.current;
    if (from === null || from === idx) return;
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== stepId) return s;
        const arr = [...s.options];
        const [removed] = arr.splice(from, 1);
        arr.splice(idx, 0, removed);
        return { ...s, options: arr };
      })
    );
    optDragIdx.current = idx;
  }

  function handleOptDrop() {
    optDragIdx.current = null;
  }

  // ── Render ──
  if (loading) return <LoadingSkeleton />;

  if (error || !schema) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <X className="w-7 h-7 text-red-500" />
          </div>
          <p className="text-gray-700 font-medium">{error || 'Schema not found.'}</p>
          <button
            type="button"
            onClick={() => router.push('/products')}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {showPreview && (
        <PreviewModal
          steps={steps}
          basePrice={basePrice}
          onClose={() => setShowPreview(false)}
        />
      )}

      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* ── Left panel: Version History ── */}
        <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          <div className="px-4 pt-5 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-700">
              <Layers className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="font-semibold text-sm">Version History</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {sortedVersions.length === 0 && (
              <p className="px-4 py-6 text-xs text-gray-400 text-center">
                No versions yet. Publish to create the first one.
              </p>
            )}
            {sortedVersions.map((ver) => {
              const isLoaded = loadedVersionNumber === ver.versionNumber;
              return (
                <div
                  key={ver.id}
                  className={`mx-2 mb-1 rounded-lg px-3 py-2.5 transition-colors ${
                    isLoaded
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        isLoaded
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      v{ver.versionNumber}
                    </span>
                    {isLoaded ? (
                      <span className="text-xs text-blue-600 font-medium">
                        Using v{ver.versionNumber}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleLoadVersion(ver)}
                        className="text-xs text-gray-500 hover:text-blue-600 font-medium px-1.5 py-0.5 rounded hover:bg-blue-50 transition-colors"
                      >
                        Load
                      </button>
                    )}
                  </div>
                  {ver.notes && (
                    <p className="text-xs text-gray-600 leading-snug mt-1 line-clamp-2">
                      {ver.notes}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(ver.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── Right panel ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
              {/* ── Top: Back + Title ── */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => router.push('/products')}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Products
                </button>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {schema.category.name}
                  </h1>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                  {loadedVersionNumber !== null && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      v{loadedVersionNumber} loaded
                    </span>
                  )}
                </div>
              </div>

              {/* ── Base Settings Card ── */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-4 h-4 text-gray-500" />
                  <h2 className="font-semibold text-gray-800">Base Settings</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="space-y-1">
                    <label
                      htmlFor="base-price"
                      className="block text-xs font-medium text-gray-600"
                    >
                      Base Price (€)
                    </label>
                    <input
                      id="base-price"
                      type="number"
                      min={0}
                      step={0.01}
                      value={basePrice}
                      onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="moq"
                      className="block text-xs font-medium text-gray-600"
                    >
                      MOQ
                    </label>
                    <input
                      id="moq"
                      type="number"
                      min={1}
                      value={moq}
                      onChange={(e) => setMoq(parseInt(e.target.value) || 1)}
                      className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="lead-standard"
                      className="block text-xs font-medium text-gray-600"
                    >
                      Std. Lead Days
                    </label>
                    <input
                      id="lead-standard"
                      type="number"
                      min={1}
                      value={leadTimeStandard}
                      onChange={(e) =>
                        setLeadTimeStandard(parseInt(e.target.value) || 1)
                      }
                      className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="lead-express"
                      className="block text-xs font-medium text-gray-600"
                    >
                      Express Days
                    </label>
                    <input
                      id="lead-express"
                      type="number"
                      min={1}
                      value={leadTimeExpress}
                      onChange={(e) =>
                        setLeadTimeExpress(parseInt(e.target.value) || 1)
                      }
                      className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="express-multiplier"
                      className="block text-xs font-medium text-gray-600"
                    >
                      Express ×
                    </label>
                    <input
                      id="express-multiplier"
                      type="number"
                      min={1}
                      step={0.1}
                      value={expressMultiplier}
                      onChange={(e) =>
                        setExpressMultiplier(parseFloat(e.target.value) || 1)
                      }
                      className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="is-active"
                      className="block text-xs font-medium text-gray-600"
                    >
                      Active
                    </label>
                    <div className="flex items-center h-8">
                      <button
                        id="is-active"
                        type="button"
                        onClick={() => setIsActive((v) => !v)}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                          isActive ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                        role="switch"
                        aria-checked={isActive}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isActive ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-60 transition-colors"
                  >
                    {settingsSaved ? (
                      <>
                        <Check className="w-4 h-4" /> Saved
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />{' '}
                        {savingSettings ? 'Saving…' : 'Save Settings'}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* ── Steps section ── */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-800">Steps</h2>
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Step
                  </button>
                </div>

                {steps.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 text-sm">
                    No steps yet. Click &ldquo;Add Step&rdquo; to get started.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {steps.map((step, idx) => (
                      <div
                        key={step.id}
                        draggable
                        onDragStart={() => handleStepDragStart(idx)}
                        onDragOver={(e) => handleStepDragOver(e, idx)}
                        onDrop={handleStepDrop}
                        onClick={() => setSelectedStepId(step.id)}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                          selectedStepId === step.id
                            ? 'bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {/* Drag handle */}
                        <div
                          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-800 truncate">
                              {step.title}
                            </span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono">
                              {step.ui_type}
                            </span>
                            <span className="text-xs text-gray-400">
                              {step.options.length} option
                              {step.options.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          {step.condition && (
                            <p className="text-xs text-amber-600 mt-0.5">
                              When {step.condition.stepId} ={' '}
                              {step.condition.optionId}
                            </p>
                          )}
                        </div>

                        {/* Select indicator */}
                        {selectedStepId === step.id ? (
                          <span className="text-xs text-blue-600 font-medium flex-shrink-0">
                            Editing
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStepId(step.id);
                            }}
                            className="text-xs text-gray-400 hover:text-blue-600 font-medium flex-shrink-0 px-2 py-0.5 rounded hover:bg-blue-50 transition-colors"
                          >
                            Select
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStep(step.id);
                          }}
                          className="flex-shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete step"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Step detail editor ── */}
              {selectedStep && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-blue-500" />
                    <h2 className="font-semibold text-gray-800">
                      Edit Step: {selectedStep.title}
                    </h2>
                  </div>
                  <div className="p-5 space-y-4">
                    {/* Row 1: ID, Title, Type, Required */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label
                          htmlFor="step-id"
                          className="block text-xs font-medium text-gray-600"
                        >
                          Step ID (slug)
                        </label>
                        <input
                          id="step-id"
                          type="text"
                          value={selectedStep.id}
                          onChange={(e) =>
                            updateStep(selectedStep.id, {
                              id: slugify(e.target.value) || selectedStep.id,
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label
                          htmlFor="step-title"
                          className="block text-xs font-medium text-gray-600"
                        >
                          Title
                        </label>
                        <input
                          id="step-title"
                          type="text"
                          value={selectedStep.title}
                          onChange={(e) => {
                            const title = e.target.value;
                            updateStep(selectedStep.id, {
                              title,
                              id: slugify(title) || selectedStep.id,
                            });
                          }}
                          className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="space-y-1">
                        <label
                          htmlFor="step-type"
                          className="block text-xs font-medium text-gray-600"
                        >
                          Type
                        </label>
                        <select
                          id="step-type"
                          title="Step type"
                          value={selectedStep.ui_type}
                          onChange={(e) =>
                            updateStep(selectedStep.id, {
                              ui_type: e.target.value as UiType,
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                          {(Object.keys(UI_TYPE_LABELS) as UiType[]).map((t) => (
                            <option key={t} value={t}>{UI_TYPE_LABELS[t]}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Required checkbox + Description */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start">
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          id="step-required"
                          type="checkbox"
                          checked={selectedStep.required}
                          onChange={(e) =>
                            updateStep(selectedStep.id, {
                              required: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label
                          htmlFor="step-required"
                          className="text-xs font-medium text-gray-600"
                        >
                          Required
                        </label>
                      </div>
                      <div className="space-y-1 sm:col-span-3">
                        <label
                          htmlFor="step-desc"
                          className="block text-xs font-medium text-gray-600"
                        >
                          Description
                        </label>
                        <input
                          id="step-desc"
                          type="text"
                          placeholder="Optional description shown to buyer"
                          value={selectedStep.description || ''}
                          onChange={(e) =>
                            updateStep(selectedStep.id, {
                              description: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Conditional logic */}
                    <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-2">
                      <p className="text-xs font-medium text-gray-600 mb-2">
                        Conditional Logic
                      </p>
                      {selectedStep.condition ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-gray-500">
                            Show this step only when:
                          </span>
                          <select
                            title="Condition step"
                            value={selectedStep.condition.stepId}
                            onChange={(e) =>
                              updateStep(selectedStep.id, {
                                condition: {
                                  stepId: e.target.value,
                                  optionId:
                                    steps.find((s) => s.id === e.target.value)
                                      ?.options[0]?.id || '',
                                },
                              })
                            }
                            className="border border-gray-300 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {steps
                              .filter((s) => s.id !== selectedStep.id)
                              .map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.title}
                                </option>
                              ))}
                          </select>
                          <span className="text-xs text-gray-500">=</span>
                          <select
                            title="Condition option"
                            value={selectedStep.condition.optionId}
                            onChange={(e) =>
                              updateStep(selectedStep.id, {
                                condition: {
                                  stepId: selectedStep.condition!.stepId,
                                  optionId: e.target.value,
                                },
                              })
                            }
                            className="border border-gray-300 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {(
                              steps.find(
                                (s) => s.id === selectedStep.condition?.stepId
                              )?.options || []
                            ).map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() =>
                              updateStep(selectedStep.id, { condition: null })
                            }
                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400">Always show</span>
                          {steps.filter((s) => s.id !== selectedStep.id).length >
                            0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const otherStep = steps.find(
                                  (s) => s.id !== selectedStep.id
                                );
                                if (!otherStep) return;
                                updateStep(selectedStep.id, {
                                  condition: {
                                    stepId: otherStep.id,
                                    optionId: otherStep.options[0]?.id || '',
                                  },
                                });
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              + Add condition
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Options */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">
                          Options
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleAddOption(selectedStep.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Option
                        </button>
                      </div>

                      {selectedStep.options.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                          No options yet. Add one above.
                        </p>
                      ) : (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="w-8 px-2 py-2">
                                  <span className="sr-only">Drag</span>
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                  Label
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-28">
                                  Price Mod (€)
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                  Layer Key
                                </th>
                                <th className="w-10 px-2 py-2">
                                  <span className="sr-only">Delete</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {selectedStep.options.map((opt, oIdx) => (
                                <tr
                                  key={opt.id}
                                  draggable
                                  onDragStart={() => handleOptDragStart(oIdx)}
                                  onDragOver={(e) =>
                                    handleOptDragOver(e, selectedStep.id, oIdx)
                                  }
                                  onDrop={handleOptDrop}
                                  className="hover:bg-gray-50 transition-colors"
                                >
                                  <td className="px-2 py-1.5 text-center">
                                    <GripVertical className="w-4 h-4 text-gray-300 cursor-grab hover:text-gray-500 mx-auto" />
                                  </td>
                                  <td className="px-3 py-1.5">
                                    <input
                                      type="text"
                                      value={opt.label}
                                      onChange={(e) =>
                                        updateOption(selectedStep.id, opt.id, {
                                          label: e.target.value,
                                        })
                                      }
                                      title="Option label"
                                      className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="px-3 py-1.5">
                                    <input
                                      type="number"
                                      step={0.01}
                                      value={opt.price_modifier}
                                      onChange={(e) =>
                                        updateOption(selectedStep.id, opt.id, {
                                          price_modifier:
                                            parseFloat(e.target.value) || 0,
                                        })
                                      }
                                      title="Price modifier"
                                      className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="px-3 py-1.5">
                                    <input
                                      type="text"
                                      value={opt.layer_key || ''}
                                      onChange={(e) =>
                                        updateOption(selectedStep.id, opt.id, {
                                          layer_key: e.target.value,
                                        })
                                      }
                                      placeholder="e.g. color_red"
                                      title="Layer key"
                                      className="w-full border border-gray-200 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="px-2 py-1.5 text-center">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteOption(selectedStep.id, opt.id)
                                      }
                                      className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                      title="Delete option"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Spacer for sticky bar */}
              <div className="h-6" />
            </div>
          </div>

          {/* ── Sticky bottom bar ── */}
          <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Eye className="w-4 h-4" /> Preview Configurator
            </button>
            <div className="flex-1" />
            <input
              type="text"
              placeholder="Release notes (required to publish)…"
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              className="flex-1 max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing || !releaseNotes.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              {publishing ? 'Publishing…' : `Publish as v${nextVersionNumber}`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
