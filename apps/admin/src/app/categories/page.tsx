'use client';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Plus, Pencil, ToggleLeft, ToggleRight, Check, X, ChevronRight, ChevronDown, Eye, EyeOff } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

function token() { return localStorage.getItem('adminToken') || ''; }
function hdrs() { return { Authorization: `Bearer ${token()}` }; }

const EMPTY_FORM = { name: '', slug: '', parentId: '', sortOrder: '0', isCustomizable: false };

export default function CategoriesPage() {
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/products/admin/categories`, { headers: hdrs() });
      const data: any[] = res.data || [];
      setCats(data);
      // Auto-expand roots
      setExpanded(new Set(data.filter((c: any) => !c.parentId).map((c: any) => c.id)));
    } catch { setCats([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const roots = cats.filter(c => !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder);
  const childrenOf = (pid: string) => cats.filter(c => c.parentId === pid).sort((a, b) => a.sortOrder - b.sortOrder);

  async function createCat() {
    if (!createForm.name) return;
    setSaving('new');
    try {
      const res = await axios.post(`${API}/products/admin/categories`, createForm, { headers: hdrs() });
      setCats(prev => [...prev, res.data]);
      setShowCreate(false);
      setCreateForm(EMPTY_FORM);
    } finally { setSaving(null); }
  }

  async function saveEdit(id: string) {
    setSaving(id);
    try {
      const res = await axios.patch(`${API}/products/admin/categories/${id}`, editForm, { headers: hdrs() });
      setCats(prev => prev.map(c => c.id === id ? { ...c, ...res.data } : c));
      setEditingId(null);
    } finally { setSaving(null); }
  }

  async function toggleVisibility(id: string, current: boolean) {
    setSaving(id);
    try {
      await axios.patch(`${API}/products/admin/categories/${id}`, { isActive: !current }, { headers: hdrs() });
      setCats(prev => prev.map(c => c.id === id ? { ...c, isActive: !current } : c));
    } finally { setSaving(null); }
  }

  function startEdit(cat: any) {
    setEditingId(cat.id);
    setEditForm({ name: cat.name, slug: cat.slug, sortOrder: cat.sortOrder, parentId: cat.parentId ?? '' });
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  const totalActive = cats.filter(c => c.isActive).length;
  const totalHidden = cats.filter(c => !c.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage which categories appear on the website.&nbsp;
            <span className="text-green-600 font-medium">{totalActive} visible</span>
            {totalHidden > 0 && <span className="text-gray-400">&nbsp;· {totalHidden} hidden</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setShowCreate(v => !v); setEditingId(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A3C5E] text-white text-sm font-semibold rounded-lg hover:bg-[#112E4D]"
        >
          <Plus size={14} /> New Category
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
          <p className="font-semibold text-gray-900">New Category</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Name *</label>
              <input
                value={createForm.name}
                onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1A3C5E]"
                placeholder="e.g. Jumping Bridles"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Slug <span className="text-gray-400">(auto if blank)</span></label>
              <input
                value={createForm.slug}
                onChange={e => setCreateForm(f => ({ ...f, slug: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none font-mono focus:border-[#1A3C5E]"
                placeholder="jumping-bridles"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Parent Category</label>
              <select
                value={createForm.parentId}
                onChange={e => setCreateForm(f => ({ ...f, parentId: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-[#1A3C5E]"
              >
                <option value="">None (top-level)</option>
                {roots.map(c => (
                  <optgroup key={c.id} label={c.name}>
                    <option value={c.id}>{c.name}</option>
                    {childrenOf(c.id).map(ch => (
                      <option key={ch.id} value={ch.id}>&nbsp;&nbsp;└ {ch.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Sort Order</label>
              <input
                type="number"
                value={createForm.sortOrder}
                onChange={e => setCreateForm(f => ({ ...f, sortOrder: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1A3C5E]"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createForm.isCustomizable}
                  onChange={e => setCreateForm(f => ({ ...f, isCustomizable: e.target.checked }))}
                  className="rounded"
                />
                Has Configurator
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={createCat}
              disabled={saving === 'new' || !createForm.name}
              className="px-4 py-2 bg-[#1A3C5E] text-white text-sm font-semibold rounded-lg hover:bg-[#112E4D] disabled:opacity-50"
            >
              {saving === 'new' ? 'Creating…' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Info banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex items-center gap-3 text-sm text-amber-800">
        <Eye size={16} className="shrink-0" />
        <span>
          Toggle the <strong>eye icon</strong> to show or hide a category on the website (homepage &amp; navigation menu).
          Changes take effect within 60 seconds.
        </span>
      </div>

      {/* Category tree */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_160px_100px_80px_90px_100px_36px] gap-0 border-b border-gray-100 px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          <span>Name</span>
          <span>Slug</span>
          <span>Parent</span>
          <span className="text-center">Products</span>
          <span className="text-center">Configurator</span>
          <span className="text-center">Visible</span>
          <span />
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">Loading…</div>
        ) : cats.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">No categories yet. Create one above.</div>
        ) : (
          roots.map(root => (
            <div key={root.id}>
              <CategoryRow
                cat={root}
                depth={0}
                hasChildren={childrenOf(root.id).length > 0}
                isExpanded={expanded.has(root.id)}
                onToggleExpand={() => toggleExpand(root.id)}
                isEditing={editingId === root.id}
                editForm={editForm}
                setEditForm={setEditForm}
                onEdit={() => startEdit(root)}
                onSave={() => saveEdit(root.id)}
                onCancel={() => setEditingId(null)}
                onToggleVisibility={() => toggleVisibility(root.id, root.isActive)}
                saving={saving === root.id}
                allCats={cats}
              />
              {expanded.has(root.id) && childrenOf(root.id).map(child => {
                const grandkids = childrenOf(child.id);
                return (
                  <div key={child.id}>
                    <CategoryRow
                      cat={child}
                      depth={1}
                      hasChildren={grandkids.length > 0}
                      isExpanded={expanded.has(child.id)}
                      onToggleExpand={() => toggleExpand(child.id)}
                      isEditing={editingId === child.id}
                      editForm={editForm}
                      setEditForm={setEditForm}
                      onEdit={() => startEdit(child)}
                      onSave={() => saveEdit(child.id)}
                      onCancel={() => setEditingId(null)}
                      onToggleVisibility={() => toggleVisibility(child.id, child.isActive)}
                      saving={saving === child.id}
                      allCats={cats}
                    />
                    {expanded.has(child.id) && grandkids.map(gc => (
                      <CategoryRow
                        key={gc.id}
                        cat={gc}
                        depth={2}
                        hasChildren={false}
                        isExpanded={false}
                        onToggleExpand={() => {}}
                        isEditing={editingId === gc.id}
                        editForm={editForm}
                        setEditForm={setEditForm}
                        onEdit={() => startEdit(gc)}
                        onSave={() => saveEdit(gc.id)}
                        onCancel={() => setEditingId(null)}
                        onToggleVisibility={() => toggleVisibility(gc.id, gc.isActive)}
                        saving={saving === gc.id}
                        allCats={cats}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CategoryRow({
  cat, depth, hasChildren, isExpanded, onToggleExpand,
  isEditing, editForm, setEditForm, onEdit, onSave, onCancel,
  onToggleVisibility, saving, allCats,
}: any) {
  const indent = depth * 24;

  return (
    <div className={`grid grid-cols-[1fr_160px_100px_80px_90px_100px_36px] gap-0 border-b border-gray-50 px-5 py-3 items-center hover:bg-gray-50 ${!cat.isActive ? 'opacity-50' : ''}`}>

      {/* Name */}
      <div className="flex items-center gap-1.5" style={{ paddingLeft: indent }}>
        {hasChildren ? (
          <button type="button" onClick={onToggleExpand} className="text-gray-400 hover:text-gray-600 p-0.5">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-5 shrink-0 text-gray-200 text-xs pl-1">{depth > 0 ? '└' : ''}</span>
        )}
        {isEditing ? (
          <input
            value={editForm.name ?? cat.name}
            onChange={(e: any) => setEditForm((f: any) => ({ ...f, name: e.target.value }))}
            className="border rounded px-2 py-1 text-sm w-40 outline-none focus:border-[#1A3C5E]"
          />
        ) : (
          <span className={`text-sm font-semibold text-gray-900 ${depth === 0 ? 'text-[#1A3C5E]' : ''}`}>{cat.name}</span>
        )}
      </div>

      {/* Slug */}
      <div>
        {isEditing ? (
          <input
            value={editForm.slug ?? cat.slug}
            onChange={(e: any) => setEditForm((f: any) => ({ ...f, slug: e.target.value }))}
            className="border rounded px-2 py-1 text-xs w-36 font-mono outline-none focus:border-[#1A3C5E]"
          />
        ) : (
          <span className="text-xs font-mono text-gray-400">{cat.slug}</span>
        )}
      </div>

      {/* Parent */}
      <div>
        {isEditing ? (
          <select
            value={editForm.parentId ?? cat.parentId ?? ''}
            onChange={(e: any) => setEditForm((f: any) => ({ ...f, parentId: e.target.value || null }))}
            className="border rounded px-2 py-1 text-xs w-28 bg-white outline-none"
          >
            <option value="">None</option>
            {(allCats || []).filter((c: any) => c.id !== cat.id).map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        ) : (
          <span className="text-xs text-gray-400">{cat.parent?.name || '—'}</span>
        )}
      </div>

      {/* Products count */}
      <div className="text-center">
        <span className="text-sm text-gray-500">{cat._count?.products ?? 0}</span>
      </div>

      {/* Configurator */}
      <div className="text-center">
        {cat.isCustomizable
          ? <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Yes</span>
          : <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">No</span>
        }
      </div>

      {/* Visibility toggle */}
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={onToggleVisibility}
          disabled={saving}
          title={cat.isActive ? 'Hide from website' : 'Show on website'}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
          style={{
            background: cat.isActive ? '#dcfce7' : '#f3f4f6',
            color: cat.isActive ? '#16a34a' : '#9ca3af',
          }}
        >
          {cat.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
          {cat.isActive ? 'Visible' : 'Hidden'}
        </button>
      </div>

      {/* Edit / Save / Cancel */}
      <div className="flex items-center justify-center">
        {isEditing ? (
          <div className="flex gap-1">
            <button type="button" onClick={onSave} disabled={saving} title="Save" className="text-green-600 hover:text-green-800 disabled:opacity-40">
              <Check size={14} />
            </button>
            <button type="button" onClick={onCancel} title="Cancel" className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
        ) : (
          <button type="button" onClick={onEdit} title="Edit" className="text-gray-300 hover:text-[#1A3C5E]">
            <Pencil size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
