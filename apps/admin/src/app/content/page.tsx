'use client';
import React from 'react';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

function Skel({ cols }: { cols: number }) {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <tr key={i} className="border-b border-gray-50">
          {[...Array(cols)].map((_, j) => (
            <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      aria-label={value ? 'Active — click to deactivate' : 'Inactive — click to activate'}
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value ? 'bg-green-500' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4.5' : 'translate-x-1'}`} />
    </button>
  );
}

// ── Banners Tab ───────────────────────────────────────────────────────────────

const POSITIONS = ['hero', 'promo', 'category', 'sidebar'];

const EMPTY_BANNER = { title: '', subtitle: '', imageUrl: '', linkUrl: '', linkText: '', position: 'hero', sortOrder: 0, isActive: true };

function BannersTab() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({ ...EMPTY_BANNER });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    try {
      const res = await axios.get(`${API}/content/admin/banners`, { headers: { Authorization: `Bearer ${token}` } });
      setBanners(res.data || []);
    } catch { setBanners([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(id: string) {
    setSaving(true);
    const token = localStorage.getItem('adminToken');
    try {
      await axios.patch(`${API}/content/admin/banners/${id}`, editForm, { headers: { Authorization: `Bearer ${token}` } });
      setBanners(prev => prev.map(b => b.id === id ? { ...b, ...editForm } : b));
      setEditingId(null);
    } finally { setSaving(false); }
  }

  async function create() {
    setSaving(true);
    const token = localStorage.getItem('adminToken');
    try {
      const res = await axios.post(`${API}/content/admin/banners`, newForm, { headers: { Authorization: `Bearer ${token}` } });
      setBanners(prev => [...prev, res.data]);
      setNewForm({ ...EMPTY_BANNER });
      setCreating(false);
    } finally { setSaving(false); }
  }

  async function deleteBanner(id: string) {
    if (!confirm('Delete this banner?')) return;
    const token = localStorage.getItem('adminToken');
    await axios.delete(`${API}/content/admin/banners/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    setBanners(prev => prev.filter(b => b.id !== id));
  }

  async function toggleActive(b: any) {
    const token = localStorage.getItem('adminToken');
    await axios.patch(`${API}/content/admin/banners/${b.id}`, { isActive: !b.isActive }, { headers: { Authorization: `Bearer ${token}` } });
    setBanners(prev => prev.map(x => x.id === b.id ? { ...x, isActive: !x.isActive } : x));
  }

  const groupedPositions = POSITIONS.map(pos => ({
    pos,
    items: banners.filter(b => b.position === pos),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">{banners.length} banners</p>
        <button type="button" onClick={() => setCreating(true)}
          className="px-4 py-2 bg-[#1A3C5E] text-white rounded-lg text-sm font-semibold hover:bg-[#112E4D]">
          + New Banner
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm">New Banner</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Title *</label>
              <input type="text" value={newForm.title} onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Subtitle</label>
              <input type="text" value={newForm.subtitle} onChange={e => setNewForm(f => ({ ...f, subtitle: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Image URL</label>
              <input type="text" placeholder="https://…" value={newForm.imageUrl} onChange={e => setNewForm(f => ({ ...f, imageUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Link URL</label>
              <input type="text" placeholder="https://… or /path" value={newForm.linkUrl} onChange={e => setNewForm(f => ({ ...f, linkUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Link Text</label>
              <input type="text" placeholder="Shop Now" value={newForm.linkText} onChange={e => setNewForm(f => ({ ...f, linkText: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Position</label>
              <select value={newForm.position} onChange={e => setNewForm(f => ({ ...f, position: e.target.value }))}
                title="Banner position"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]">
                {POSITIONS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Sort Order</label>
              <input type="number" value={newForm.sortOrder} onChange={e => setNewForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setCreating(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="button" onClick={create} disabled={!newForm.title || saving}
              className="px-4 py-2 bg-[#1A3C5E] text-white rounded-lg text-sm font-semibold hover:bg-[#112E4D] disabled:opacity-50">
              {saving ? 'Creating…' : 'Create Banner'}
            </button>
          </div>
        </div>
      )}

      {/* Banners by position */}
      {groupedPositions.map(({ pos, items }) => (
        <div key={pos} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{pos}</h3>
            <span className="text-xs text-gray-400">({items.length})</span>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                  {['Title', 'Subtitle', 'Link', 'Sort', 'Active', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? <Skel cols={6} /> : items.length > 0 ? items.map(b => (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                    {editingId === b.id ? (
                      <>
                        <td className="px-3 py-3" colSpan={4}>
                          <div className="grid grid-cols-4 gap-2">
                            <input type="text" value={editForm.title ?? b.title} onChange={e => setEditForm((f: any) => ({ ...f, title: e.target.value }))}
                              title="Title" placeholder="Title"
                              className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#1A3C5E]" />
                            <input type="text" value={editForm.subtitle ?? b.subtitle ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, subtitle: e.target.value }))}
                              title="Subtitle" placeholder="Subtitle"
                              className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#1A3C5E]" />
                            <input type="text" value={editForm.linkUrl ?? b.linkUrl ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, linkUrl: e.target.value }))}
                              title="Link URL" placeholder="Link URL"
                              className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#1A3C5E]" />
                            <input type="number" value={editForm.sortOrder ?? b.sortOrder} onChange={e => setEditForm((f: any) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                              title="Sort order"
                              className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#1A3C5E]" />
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <Toggle value={editForm.isActive ?? b.isActive} onChange={v => setEditForm((f: any) => ({ ...f, isActive: v }))} />
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex gap-1.5">
                            <button type="button" onClick={() => save(b.id)} disabled={saving}
                              className="text-xs px-3 py-1.5 bg-[#1A3C5E] text-white rounded-lg hover:bg-[#112E4D] disabled:opacity-50">
                              {saving ? '…' : 'Save'}
                            </button>
                            <button type="button" onClick={() => setEditingId(null)}
                              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-4 text-sm font-medium text-gray-900">{b.title}</td>
                        <td className="px-5 py-4 text-sm text-gray-500">{b.subtitle || '—'}</td>
                        <td className="px-5 py-4 text-xs text-blue-600 truncate max-w-[140px]">
                          {b.linkUrl ? <a href={b.linkUrl} target="_blank" rel="noreferrer">{b.linkText || b.linkUrl}</a> : '—'}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500">{b.sortOrder}</td>
                        <td className="px-5 py-4">
                          <Toggle value={b.isActive} onChange={() => toggleActive(b)} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-1.5">
                            <button type="button" title="Edit banner"
                              onClick={() => { setEditingId(b.id); setEditForm({}); }}
                              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                              Edit
                            </button>
                            <button type="button" title="Delete banner" onClick={() => deleteBanner(b.id)}
                              className="text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-600 hover:bg-red-50">
                              Del
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="px-5 py-6 text-center text-gray-400 text-sm">No {pos} banners</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── FAQ Tab ───────────────────────────────────────────────────────────────────

const EMPTY_FAQ = { question: '', answer: '', categorySlug: 'general', sortOrder: 0, isActive: true };

function FaqTab() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({ ...EMPTY_FAQ });
  const [saving, setSaving] = useState(false);
  const [catFilter, setCatFilter] = useState('All');

  const load = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    try {
      const res = await axios.get(`${API}/content/admin/faqs`, { headers: { Authorization: `Bearer ${token}` } });
      setFaqs(res.data || []);
    } catch { setFaqs([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const categories = ['All', ...Array.from(new Set(faqs.map(f => f.categorySlug)))];
  const filtered = catFilter === 'All' ? faqs : faqs.filter(f => f.categorySlug === catFilter);

  async function save(id: string) {
    setSaving(true);
    const token = localStorage.getItem('adminToken');
    try {
      await axios.patch(`${API}/content/admin/faqs/${id}`, editForm, { headers: { Authorization: `Bearer ${token}` } });
      setFaqs(prev => prev.map(f => f.id === id ? { ...f, ...editForm } : f));
      setEditingId(null);
    } finally { setSaving(false); }
  }

  async function create() {
    if (!newForm.question || !newForm.answer) return;
    setSaving(true);
    const token = localStorage.getItem('adminToken');
    try {
      const res = await axios.post(`${API}/content/admin/faqs`, newForm, { headers: { Authorization: `Bearer ${token}` } });
      setFaqs(prev => [...prev, res.data]);
      setNewForm({ ...EMPTY_FAQ });
      setCreating(false);
    } finally { setSaving(false); }
  }

  async function deleteFaq(id: string) {
    if (!confirm('Delete this FAQ?')) return;
    const token = localStorage.getItem('adminToken');
    await axios.delete(`${API}/content/admin/faqs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    setFaqs(prev => prev.filter(f => f.id !== id));
  }

  async function toggleActive(f: any) {
    const token = localStorage.getItem('adminToken');
    await axios.patch(`${API}/content/admin/faqs/${f.id}`, { isActive: !f.isActive }, { headers: { Authorization: `Bearer ${token}` } });
    setFaqs(prev => prev.map(x => x.id === f.id ? { ...x, isActive: !x.isActive } : x));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1.5 flex-wrap">
          {categories.map(c => (
            <button key={c} type="button" onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${catFilter === c ? 'bg-[#1A3C5E] text-white border-[#1A3C5E]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
              {c}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setCreating(true)}
          className="px-4 py-2 bg-[#1A3C5E] text-white rounded-lg text-sm font-semibold hover:bg-[#112E4D]">
          + New FAQ
        </button>
      </div>

      {creating && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm">New FAQ</h3>
          <div className="space-y-3 mb-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Question *</label>
                <input type="text" value={newForm.question} onChange={e => setNewForm(f => ({ ...f, question: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Category</label>
                <input type="text" placeholder="general" value={newForm.categorySlug} onChange={e => setNewForm(f => ({ ...f, categorySlug: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Answer *</label>
              <textarea value={newForm.answer} onChange={e => setNewForm(f => ({ ...f, answer: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E] resize-none" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setCreating(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="button" onClick={create} disabled={!newForm.question || !newForm.answer || saving}
              className="px-4 py-2 bg-[#1A3C5E] text-white rounded-lg text-sm font-semibold hover:bg-[#112E4D] disabled:opacity-50">
              {saving ? 'Creating…' : 'Create FAQ'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {loading ? (
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <Skel cols={1} />
          </div>
        ) : filtered.length > 0 ? filtered.map(f => (
          <div key={f.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {editingId === f.id ? (
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Question</label>
                    <input type="text" value={editForm.question ?? f.question}
                      onChange={e => setEditForm((x: any) => ({ ...x, question: e.target.value }))}
                      title="Question"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Category</label>
                    <input type="text" value={editForm.categorySlug ?? f.categorySlug}
                      onChange={e => setEditForm((x: any) => ({ ...x, categorySlug: e.target.value }))}
                      title="Category slug"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Answer</label>
                  <textarea value={editForm.answer ?? f.answer}
                    onChange={e => setEditForm((x: any) => ({ ...x, answer: e.target.value }))}
                    rows={4} title="Answer"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E] resize-none" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <Toggle value={editForm.isActive ?? f.isActive} onChange={v => setEditForm((x: any) => ({ ...x, isActive: v }))} />
                    Active
                  </label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditingId(null)}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                    <button type="button" onClick={() => save(f.id)} disabled={saving}
                      className="px-4 py-2 bg-[#1A3C5E] text-white rounded-lg text-sm font-semibold hover:bg-[#112E4D] disabled:opacity-50">
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{f.categorySlug}</span>
                      {!f.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-500 font-medium">hidden</span>}
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">{f.question}</p>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{f.answer}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Toggle value={f.isActive} onChange={() => toggleActive(f)} />
                    <button type="button" title="Edit FAQ"
                      onClick={() => { setEditingId(f.id); setEditForm({}); }}
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                      Edit
                    </button>
                    <button type="button" title="Delete FAQ" onClick={() => deleteFaq(f.id)}
                      className="text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-600 hover:bg-red-50">
                      Del
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-10 text-center text-gray-400 text-sm">
            {catFilter === 'All' ? 'No FAQs yet — click "+ New FAQ" to add one' : `No FAQs in category "${catFilter}"`}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page Content Editor ───────────────────────────────────────────────────────

const KNOWN_PAGE_SLUGS = ['returns', 'sizing-guide', 'price-lists', 'custom-orders', 'b2b', 'contact', 'design-your-own', 'wholesale', 'sale'];

// Module-level style constants — stable across renders
const PCE_inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]';
const PCE_ta = `${PCE_inp} resize-y`;
const PCE_label = 'block text-xs font-semibold text-gray-500 uppercase mb-1';
const PCE_secHead = 'text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 mt-5';
const PCE_card = 'bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3';

// Module-level component — stable identity, never remounts on parent re-render
// (defining it inside PageContentEditor would cause React to unmount/remount on every keystroke)
function RepeatableList({ title, items, onAdd, onRemove, renderItem }: {
  title: string;
  items: any[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  renderItem: (item: any, i: number) => React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <p className={PCE_secHead}>{title}</p>
      {items.map((item: any, i: number) => (
        <div key={i} className={PCE_card}>
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-medium text-gray-400">#{i + 1}</span>
            <button type="button" onClick={() => onRemove(i)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
          </div>
          {renderItem(item, i)}
        </div>
      ))}
      <button type="button" onClick={onAdd} className="text-xs px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#1A3C5E] hover:text-[#1A3C5E] w-full">
        + Add Item
      </button>
    </div>
  );
}

function PageContentEditor({ slug, rawContent, onChange }: { slug: string; rawContent: string; onChange: (v: string) => void }) {
  // Local draft state: inputs read from here, not the prop.
  // This breaks the re-render cascade: typing → setDraft (local) → no parent re-render clobbering focus.
  const [draft, setDraft] = useState(rawContent);
  const parsed = (() => { try { return JSON.parse(draft || '{}'); } catch { return {}; } })();

  function update(path: string[], value: any) {
    const next = JSON.parse(JSON.stringify(parsed));
    let obj = next;
    for (let i = 0; i < path.length - 1; i++) {
      if (obj[path[i]] === undefined) obj[path[i]] = {};
      obj = obj[path[i]];
    }
    obj[path[path.length - 1]] = value;
    const json = JSON.stringify(next);
    setDraft(json);
    onChange(json);
  }

  function updateItem(arrayPath: string, index: number, field: string, value: any) {
    const arr = [...(parsed[arrayPath] || [])];
    arr[index] = { ...arr[index], [field]: value };
    update([arrayPath], arr);
  }

  function addItem(arrayPath: string, template: object) {
    const arr = [...(parsed[arrayPath] || []), { ...template }];
    update([arrayPath], arr);
  }

  function removeItem(arrayPath: string, index: number) {
    const arr = (parsed[arrayPath] || []).filter((_: any, i: number) => i !== index);
    update([arrayPath], arr);
  }

  // Local aliases for JSX readability
  const inp = PCE_inp;
  const ta = PCE_ta;
  const label = PCE_label;
  const secHead = PCE_secHead;

  // Hero section — plain function call, NOT a React component.
  // Using <HeroEditor /> would cause unmount/remount on every render; calling heroEditor() avoids that.
  function heroEditor() {
    return (
      <div className="mb-6">
        <p className={secHead}>Hero Section</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className={label}>Eyebrow label</label>
            <input type="text" title="Eyebrow label" placeholder="e.g. Free Returns" className={inp} value={parsed.hero?.eyebrow || ''} onChange={e => update(['hero', 'eyebrow'], e.target.value)} />
          </div>
          <div>
            <label className={label}>Page Title</label>
            <input type="text" title="Page title" placeholder="e.g. Returns & Exchanges" className={inp} value={parsed.hero?.title || ''} onChange={e => update(['hero', 'title'], e.target.value)} />
          </div>
        </div>
        <div>
          <label className={label}>Subtitle</label>
          <textarea title="Page subtitle" placeholder="Short description shown under the page title..." className={ta} rows={2} value={parsed.hero?.subtitle || ''} onChange={e => update(['hero', 'subtitle'], e.target.value)} />
        </div>
      </div>
    );
  }

  if (slug === 'returns') return (
    <div>
      {heroEditor()}
      <RepeatableList title="Summary Cards (top strip)" items={parsed.summaryCards || []} onAdd={() => addItem('summaryCards', { label: '', sub: '' })} onRemove={i => removeItem('summaryCards', i)} renderItem={(item, i) => (
        <div className="grid grid-cols-2 gap-2">
          <div><label className={label}>Label</label><input className={inp} value={item.label || ''} onChange={e => updateItem('summaryCards', i, 'label', e.target.value)} /></div>
          <div><label className={label}>Sub-text</label><input className={inp} value={item.sub || ''} onChange={e => updateItem('summaryCards', i, 'sub', e.target.value)} /></div>
        </div>
      )} />
      <RepeatableList title="Policy Sections" items={parsed.sections || []} onAdd={() => addItem('sections', { title: '', paragraphs: [], bullets: [], footer: '' })} onRemove={i => removeItem('sections', i)} renderItem={(item, i) => (
        <div className="space-y-2">
          <div><label className={label}>Section Title</label><input className={inp} value={item.title || ''} onChange={e => updateItem('sections', i, 'title', e.target.value)} /></div>
          <div><label className={label}>Paragraphs (one per line)</label><textarea className={ta} rows={3} value={(item.paragraphs || []).join('\n')} onChange={e => updateItem('sections', i, 'paragraphs', e.target.value.split('\n'))} /></div>
          <div><label className={label}>Bullet points (one per line)</label><textarea className={ta} rows={4} value={(item.bullets || []).join('\n')} onChange={e => updateItem('sections', i, 'bullets', e.target.value.split('\n').filter(Boolean))} /></div>
          <div><label className={label}>Footer text</label><input className={inp} value={item.footer || ''} onChange={e => updateItem('sections', i, 'footer', e.target.value)} /></div>
        </div>
      )} />
      <div className="mb-4">
        <p className={secHead}>CTA Block</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>Title</label><input className={inp} value={parsed.cta?.title || ''} onChange={e => update(['cta', 'title'], e.target.value)} /></div>
          <div><label className={label}>Email</label><input className={inp} value={parsed.cta?.email || ''} onChange={e => update(['cta', 'email'], e.target.value)} /></div>
          <div className="col-span-2"><label className={label}>Body</label><textarea className={ta} rows={2} value={parsed.cta?.body || ''} onChange={e => update(['cta', 'body'], e.target.value)} /></div>
          <div><label className={label}>Last updated text</label><input className={inp} value={parsed.cta?.lastUpdated || ''} onChange={e => update(['cta', 'lastUpdated'], e.target.value)} /></div>
        </div>
      </div>
    </div>
  );

  if (slug === 'sizing-guide') return (
    <div className="space-y-2">
      {heroEditor()}

      {/* Bridles & Browbands */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-3 flex items-center gap-2">
          <span className="text-base">🐴</span>
          <p className="text-sm font-bold text-amber-900">Bridles &amp; Browbands</p>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={label}>Section Heading</label><input className={inp} value={parsed.bridleSizesTitle || ''} onChange={e => update(['bridleSizesTitle'], e.target.value)} placeholder="Bridles & Browbands" /></div>
            <div><label className={label}>Note below table</label><input className={inp} value={parsed.bridleNote || ''} onChange={e => update(['bridleNote'], e.target.value)} placeholder="* All measurements are total length..." /></div>
          </div>
          <div><label className={label}>Section Subtitle</label><textarea className={ta} rows={2} value={parsed.bridleSizesSubtitle || ''} onChange={e => update(['bridleSizesSubtitle'], e.target.value)} placeholder="Measure with a soft tape..." /></div>
          <RepeatableList title="Size Rows" items={parsed.bridleSizes || []} onAdd={() => addItem('bridleSizes', { size: '', headpiece: '', browband: '', noseband: '', cheekpieces: '' })} onRemove={i => removeItem('bridleSizes', i)} renderItem={(item, i) => (
            <div className="grid grid-cols-5 gap-2">
              <div><label className={label}>Size label</label><input className={inp} value={item.size || ''} onChange={e => updateItem('bridleSizes', i, 'size', e.target.value)} placeholder="e.g. Full" /></div>
              <div><label className={label}>Headpiece (cm)</label><input className={inp} value={item.headpiece || ''} onChange={e => updateItem('bridleSizes', i, 'headpiece', e.target.value)} placeholder="65–69 cm" /></div>
              <div><label className={label}>Browband (cm)</label><input className={inp} value={item.browband || ''} onChange={e => updateItem('bridleSizes', i, 'browband', e.target.value)} placeholder="45–49 cm" /></div>
              <div><label className={label}>Noseband (cm)</label><input className={inp} value={item.noseband || ''} onChange={e => updateItem('bridleSizes', i, 'noseband', e.target.value)} placeholder="45–49 cm" /></div>
              <div><label className={label}>Cheekpieces (cm)</label><input className={inp} value={item.cheekpieces || ''} onChange={e => updateItem('bridleSizes', i, 'cheekpieces', e.target.value)} placeholder="45–49 cm" /></div>
            </div>
          )} />
        </div>
      </div>

      {/* Horse Rugs */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 flex items-center gap-2">
          <span className="text-base">🧥</span>
          <p className="text-sm font-bold text-blue-900">Horse Rugs</p>
        </div>
        <div className="p-4 space-y-3">
          <div><label className={label}>Section Heading</label><input className={inp} value={parsed.rugSizesTitle || ''} onChange={e => update(['rugSizesTitle'], e.target.value)} placeholder="Horse Rugs" /></div>
          <div><label className={label}>Section Subtitle</label><textarea className={ta} rows={2} value={parsed.rugSizesSubtitle || ''} onChange={e => update(['rugSizesSubtitle'], e.target.value)} placeholder="Rug size is measured from..." /></div>
          <RepeatableList title="Size Rows" items={parsed.rugSizes || []} onAdd={() => addItem('rugSizes', { size: '', cm: '', back: '', chest: '', breeds: '' })} onRemove={i => removeItem('rugSizes', i)} renderItem={(item, i) => (
            <div className="grid grid-cols-5 gap-2">
              <div><label className={label}>Size (ft)</label><input className={inp} value={item.size || ''} onChange={e => updateItem('rugSizes', i, 'size', e.target.value)} placeholder={`4'6"`} /></div>
              <div><label className={label}>Size (cm)</label><input className={inp} value={item.cm || ''} onChange={e => updateItem('rugSizes', i, 'cm', e.target.value)} placeholder="137 cm" /></div>
              <div><label className={label}>Back length</label><input className={inp} value={item.back || ''} onChange={e => updateItem('rugSizes', i, 'back', e.target.value)} placeholder="120 cm" /></div>
              <div><label className={label}>Chest width</label><input className={inp} value={item.chest || ''} onChange={e => updateItem('rugSizes', i, 'chest', e.target.value)} placeholder="128 cm" /></div>
              <div><label className={label}>Typical breed</label><input className={inp} value={item.breeds || ''} onChange={e => updateItem('rugSizes', i, 'breeds', e.target.value)} placeholder="Medium pony" /></div>
            </div>
          )} />
        </div>
      </div>

      {/* Head Collars */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-green-50 border-b border-green-100 px-4 py-3 flex items-center gap-2">
          <span className="text-base">🔗</span>
          <p className="text-sm font-bold text-green-900">Head Collars &amp; Halters</p>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={label}>Section Heading</label><input className={inp} value={parsed.headCollarSizesTitle || ''} onChange={e => update(['headCollarSizesTitle'], e.target.value)} placeholder="Head Collars & Halters" /></div>
            <div><label className={label}>Note below table</label><input className={inp} value={parsed.headCollarNote || ''} onChange={e => update(['headCollarNote'], e.target.value)} placeholder="* All leather headcollars are adjustable..." /></div>
          </div>
          <div><label className={label}>Section Subtitle</label><textarea className={ta} rows={2} value={parsed.headCollarSizesSubtitle || ''} onChange={e => update(['headCollarSizesSubtitle'], e.target.value)} placeholder="Measure around the nose at the widest point..." /></div>
          <RepeatableList title="Size Rows" items={parsed.headCollarSizes || []} onAdd={() => addItem('headCollarSizes', { size: '', noseband: '', headpiece: '', cheekpieces: '', crown: '', fits: '' })} onRemove={i => removeItem('headCollarSizes', i)} renderItem={(item, i) => (
            <div className="grid grid-cols-3 gap-2">
              <div><label className={label}>Size label</label><input className={inp} value={item.size || ''} onChange={e => updateItem('headCollarSizes', i, 'size', e.target.value)} placeholder="e.g. Cob" /></div>
              <div><label className={label}>Noseband (cm)</label><input className={inp} value={item.noseband || ''} onChange={e => updateItem('headCollarSizes', i, 'noseband', e.target.value)} placeholder="40–46 cm" /></div>
              <div><label className={label}>Headpiece (cm)</label><input className={inp} value={item.headpiece || ''} onChange={e => updateItem('headCollarSizes', i, 'headpiece', e.target.value)} placeholder="55–60 cm" /></div>
              <div><label className={label}>Cheekpieces (cm)</label><input className={inp} value={item.cheekpieces || ''} onChange={e => updateItem('headCollarSizes', i, 'cheekpieces', e.target.value)} placeholder="30–34 cm" /></div>
              <div><label className={label}>Crown (cm)</label><input className={inp} value={item.crown || ''} onChange={e => updateItem('headCollarSizes', i, 'crown', e.target.value)} placeholder="34–38 cm" /></div>
              <div><label className={label}>Typical fit</label><input className={inp} value={item.fits || ''} onChange={e => updateItem('headCollarSizes', i, 'fits', e.target.value)} placeholder="Large pony / cob" /></div>
            </div>
          )} />
        </div>
      </div>

      {/* Saddle Pads */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-purple-50 border-b border-purple-100 px-4 py-3 flex items-center gap-2">
          <span className="text-base">🏇</span>
          <p className="text-sm font-bold text-purple-900">Saddle Pads &amp; Numnahs</p>
        </div>
        <div className="p-4 space-y-3">
          <div><label className={label}>Section Heading</label><input className={inp} value={parsed.saddlePadSizesTitle || ''} onChange={e => update(['saddlePadSizesTitle'], e.target.value)} placeholder="Saddle Pads & Numnahs" /></div>
          <div><label className={label}>Section Subtitle</label><textarea className={ta} rows={2} value={parsed.saddlePadSizesSubtitle || ''} onChange={e => update(['saddlePadSizesSubtitle'], e.target.value)} placeholder="Saddle pad size should match your saddle seat size..." /></div>
          <RepeatableList title="Size Rows" items={parsed.saddlePadSizes || []} onAdd={() => addItem('saddlePadSizes', { size: '', saddleSize: '', spineLength: '', panelWidth: '', overallWidth: '', fits: '' })} onRemove={i => removeItem('saddlePadSizes', i)} renderItem={(item, i) => (
            <div className="grid grid-cols-3 gap-2">
              <div><label className={label}>Size label</label><input className={inp} value={item.size || ''} onChange={e => updateItem('saddlePadSizes', i, 'size', e.target.value)} placeholder="e.g. Full" /></div>
              <div><label className={label}>Saddle seat size</label><input className={inp} value={item.saddleSize || ''} onChange={e => updateItem('saddlePadSizes', i, 'saddleSize', e.target.value)} placeholder='16″ – 17″' /></div>
              <div><label className={label}>Spine length (cm)</label><input className={inp} value={item.spineLength || ''} onChange={e => updateItem('saddlePadSizes', i, 'spineLength', e.target.value)} placeholder="52 cm" /></div>
              <div><label className={label}>Panel width (cm)</label><input className={inp} value={item.panelWidth || ''} onChange={e => updateItem('saddlePadSizes', i, 'panelWidth', e.target.value)} placeholder="60 cm" /></div>
              <div><label className={label}>Overall width (cm)</label><input className={inp} value={item.overallWidth || ''} onChange={e => updateItem('saddlePadSizes', i, 'overallWidth', e.target.value)} placeholder="76 cm" /></div>
              <div><label className={label}>Fits</label><input className={inp} value={item.fits || ''} onChange={e => updateItem('saddlePadSizes', i, 'fits', e.target.value)} placeholder="Standard horse saddles" /></div>
            </div>
          )} />
        </div>
      </div>

      {/* How to Measure */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
          <span className="text-base">📏</span>
          <p className="text-sm font-bold text-gray-700">How to Measure</p>
        </div>
        <div className="p-4 space-y-3">
          <div><label className={label}>Section Heading</label><input className={inp} value={parsed.howToMeasureTitle || ''} onChange={e => update(['howToMeasureTitle'], e.target.value)} placeholder="How to Measure" /></div>
          <RepeatableList title="Measurement Guide Cards" items={parsed.howToMeasure || []} onAdd={() => addItem('howToMeasure', { title: '', steps: [] })} onRemove={i => removeItem('howToMeasure', i)} renderItem={(item, i) => (
            <div className="space-y-2">
              <div><label className={label}>Card Title</label><input className={inp} value={item.title || ''} onChange={e => updateItem('howToMeasure', i, 'title', e.target.value)} placeholder="e.g. Headpiece / Bridle" /></div>
              <div>
                <label className={label}>Steps — one per line</label>
                <textarea className={ta} rows={4} value={(item.steps || []).join('\n')} onChange={e => updateItem('howToMeasure', i, 'steps', e.target.value.split('\n').filter(Boolean))} placeholder={'Use a soft tape measure\nMeasure over the poll\nAdd 4 cm for buckle adjustment'} />
              </div>
            </div>
          )} />
        </div>
      </div>
    </div>
  );

  if (slug === 'price-lists') return (
    <div>
      {heroEditor()}
      <RepeatableList title="Base Prices Table" items={parsed.basePrices || []} onAdd={() => addItem('basePrices', { category: '', from: 0, to: 0, moq: 1, note: '', leadTime: '' })} onRemove={i => removeItem('basePrices', i)} renderItem={(item, i) => (
        <div className="grid grid-cols-3 gap-2">
          <div><label className={label}>Category</label><input className={inp} title="Category" placeholder="e.g. Bridles" value={item.category || ''} onChange={e => updateItem('basePrices', i, 'category', e.target.value)} /></div>
          <div><label className={label}>From (€)</label><input type="number" className={inp} title="From price (€)" placeholder="0" value={item.from || 0} onChange={e => updateItem('basePrices', i, 'from', Number(e.target.value))} /></div>
          <div><label className={label}>To (€)</label><input type="number" className={inp} title="To price (€)" placeholder="0" value={item.to || 0} onChange={e => updateItem('basePrices', i, 'to', Number(e.target.value))} /></div>
          <div><label className={label}>MOQ</label><input type="number" className={inp} title="Minimum order quantity" placeholder="1" value={item.moq || 1} onChange={e => updateItem('basePrices', i, 'moq', Number(e.target.value))} /></div>
          <div><label className={label}>Lead Time</label><input className={inp} title="Lead time" placeholder="e.g. 3–4 weeks" value={item.leadTime || ''} onChange={e => updateItem('basePrices', i, 'leadTime', e.target.value)} /></div>
          <div><label className={label}>Note</label><input className={inp} title="Note" placeholder="e.g. Custom hardware" value={item.note || ''} onChange={e => updateItem('basePrices', i, 'note', e.target.value)} /></div>
        </div>
      )} />
      <RepeatableList title="Volume Discount Tiers" items={parsed.volumeTiers || []} onAdd={() => addItem('volumeTiers', { range: '', discount: '', highlight: false })} onRemove={i => removeItem('volumeTiers', i)} renderItem={(item, i) => (
        <div className="grid grid-cols-3 gap-2 items-end">
          <div><label className={label}>Range</label><input className={inp} title="Quantity range" placeholder="e.g. 50–99" value={item.range || ''} onChange={e => updateItem('volumeTiers', i, 'range', e.target.value)} /></div>
          <div><label className={label}>Discount</label><input className={inp} title="Discount" placeholder="e.g. 5%" value={item.discount || ''} onChange={e => updateItem('volumeTiers', i, 'discount', e.target.value)} /></div>
          <div><label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase cursor-pointer mt-4"><input type="checkbox" checked={item.highlight || false} onChange={e => updateItem('volumeTiers', i, 'highlight', e.target.checked)} /> Highlight (Most Popular)</label></div>
        </div>
      )} />
      <div className="mb-4">
        <p className={secHead}>Express Production Section</p>
        <div><label className={label}>Title</label><input className={inp} title="Section title" placeholder="Express Production" value={parsed.expressSection?.title || ''} onChange={e => update(['expressSection', 'title'], e.target.value)} /></div>
        <div className="mt-2"><label className={label}>Body</label><textarea className={ta} title="Section body" placeholder="Add a body description..." rows={3} value={parsed.expressSection?.body || ''} onChange={e => update(['expressSection', 'body'], e.target.value)} /></div>
      </div>
    </div>
  );

  if (slug === 'custom-orders') return (
    <div>
      {heroEditor()}
      <RepeatableList title="Process Steps" items={parsed.processSteps || []} onAdd={() => addItem('processSteps', { step: 1, title: '', desc: '' })} onRemove={i => removeItem('processSteps', i)} renderItem={(item, i) => (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2">
            <div><label className={label}>Step #</label><input type="number" className={inp} title="Step number" placeholder="1" value={item.step || i+1} onChange={e => updateItem('processSteps', i, 'step', Number(e.target.value))} /></div>
            <div className="col-span-3"><label className={label}>Title</label><input className={inp} title="Step title" placeholder="e.g. Submit your brief" value={item.title || ''} onChange={e => updateItem('processSteps', i, 'title', e.target.value)} /></div>
          </div>
          <div><label className={label}>Description</label><textarea className={ta} title="Step description" placeholder="Describe this step..." rows={2} value={item.desc || ''} onChange={e => updateItem('processSteps', i, 'desc', e.target.value)} /></div>
        </div>
      )} />
      <RepeatableList title="Product Categories" items={parsed.categories || []} onAdd={() => addItem('categories', { slug: '', name: '', from: 0, leadTime: '', moq: 1 })} onRemove={i => removeItem('categories', i)} renderItem={(item, i) => (
        <div className="grid grid-cols-3 gap-2">
          <div><label className={label}>Slug</label><input className={inp} title="URL slug" placeholder="e.g. bridles" value={item.slug || ''} onChange={e => updateItem('categories', i, 'slug', e.target.value)} /></div>
          <div><label className={label}>Name</label><input className={inp} title="Category name" placeholder="e.g. Bridles" value={item.name || ''} onChange={e => updateItem('categories', i, 'name', e.target.value)} /></div>
          <div><label className={label}>From (€)</label><input type="number" className={inp} title="Starting price (€)" placeholder="0" value={item.from || 0} onChange={e => updateItem('categories', i, 'from', Number(e.target.value))} /></div>
          <div><label className={label}>Lead Time</label><input className={inp} title="Lead time" placeholder="e.g. 3–4 weeks" value={item.leadTime || ''} onChange={e => updateItem('categories', i, 'leadTime', e.target.value)} /></div>
          <div><label className={label}>MOQ</label><input type="number" className={inp} title="Minimum order quantity" placeholder="1" value={item.moq || 1} onChange={e => updateItem('categories', i, 'moq', Number(e.target.value))} /></div>
        </div>
      )} />
      <RepeatableList title="Capabilities" items={parsed.capabilities || []} onAdd={() => addItem('capabilities', { label: '', desc: '' })} onRemove={i => removeItem('capabilities', i)} renderItem={(item, i) => (
        <div className="grid grid-cols-2 gap-2">
          <div><label className={label}>Label</label><input className={inp} title="Capability label" placeholder="e.g. Personalisation" value={item.label || ''} onChange={e => updateItem('capabilities', i, 'label', e.target.value)} /></div>
          <div><label className={label}>Description</label><input className={inp} title="Capability description" placeholder="Short description..." value={item.desc || ''} onChange={e => updateItem('capabilities', i, 'desc', e.target.value)} /></div>
        </div>
      )} />
    </div>
  );

  if (slug === 'b2b') return (
    <div>
      {heroEditor()}
      <RepeatableList title="Stats Bar" items={parsed.stats || []} onAdd={() => addItem('stats', { value: '', label: '' })} onRemove={i => removeItem('stats', i)} renderItem={(item, i) => (
        <div className="grid grid-cols-2 gap-2">
          <div><label className={label}>Value</label><input className={inp} title="Stat value" placeholder="e.g. 500+" value={item.value || ''} onChange={e => updateItem('stats', i, 'value', e.target.value)} /></div>
          <div><label className={label}>Label</label><input className={inp} title="Stat label" placeholder="e.g. Brands served" value={item.label || ''} onChange={e => updateItem('stats', i, 'label', e.target.value)} /></div>
        </div>
      )} />
      <RepeatableList title="Features / Benefits" items={parsed.features || []} onAdd={() => addItem('features', { title: '', desc: '' })} onRemove={i => removeItem('features', i)} renderItem={(item, i) => (
        <div className="space-y-2">
          <div><label className={label}>Title</label><input className={inp} title="Feature title" placeholder="e.g. Custom Branding" value={item.title || ''} onChange={e => updateItem('features', i, 'title', e.target.value)} /></div>
          <div><label className={label}>Description</label><textarea className={ta} title="Feature description" placeholder="Short description..." rows={2} value={item.desc || ''} onChange={e => updateItem('features', i, 'desc', e.target.value)} /></div>
        </div>
      )} />
      <RepeatableList title="How to Get Access Steps" items={parsed.steps || []} onAdd={() => addItem('steps', { step: '01', title: '', desc: '', link: '', linkText: '' })} onRemove={i => removeItem('steps', i)} renderItem={(item, i) => (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2">
            <div><label className={label}>Step label</label><input className={inp} title="Step label" placeholder="01" value={item.step || ''} onChange={e => updateItem('steps', i, 'step', e.target.value)} /></div>
            <div className="col-span-3"><label className={label}>Title</label><input className={inp} title="Step title" placeholder="e.g. Apply for an account" value={item.title || ''} onChange={e => updateItem('steps', i, 'title', e.target.value)} /></div>
          </div>
          <div><label className={label}>Description</label><textarea className={ta} title="Step description" placeholder="Describe this step..." rows={2} value={item.desc || ''} onChange={e => updateItem('steps', i, 'desc', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={label}>Link URL (optional)</label><input className={inp} title="Link URL" placeholder="/wholesale" value={item.link || ''} onChange={e => updateItem('steps', i, 'link', e.target.value)} /></div>
            <div><label className={label}>Link Text (optional)</label><input className={inp} title="Link text" placeholder="Apply now" value={item.linkText || ''} onChange={e => updateItem('steps', i, 'linkText', e.target.value)} /></div>
          </div>
        </div>
      )} />
      <RepeatableList title="Volume Tiers" items={parsed.volumeTiers || []} onAdd={() => addItem('volumeTiers', { range: '', pct: '', note: '' })} onRemove={i => removeItem('volumeTiers', i)} renderItem={(item, i) => (
        <div className="grid grid-cols-3 gap-2">
          <div><label className={label}>Range</label><input className={inp} title="Quantity range" placeholder="e.g. 50–99 units" value={item.range || ''} onChange={e => updateItem('volumeTiers', i, 'range', e.target.value)} /></div>
          <div><label className={label}>Discount %</label><input className={inp} title="Discount percentage" placeholder="e.g. 5%" value={item.pct || ''} onChange={e => updateItem('volumeTiers', i, 'pct', e.target.value)} /></div>
          <div><label className={label}>Badge (empty = no badge)</label><input className={inp} title="Badge text" placeholder="e.g. Popular" value={item.note || ''} onChange={e => updateItem('volumeTiers', i, 'note', e.target.value)} /></div>
        </div>
      )} />
      <div className="mb-4">
        <p className={secHead}>CTA Block</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>Title</label><input className={inp} title="CTA title" placeholder="Get in touch" value={parsed.cta?.title || ''} onChange={e => update(['cta', 'title'], e.target.value)} /></div>
          <div><label className={label}>Email</label><input className={inp} title="Contact email" placeholder="hello@blikcart.com" value={parsed.cta?.email || ''} onChange={e => update(['cta', 'email'], e.target.value)} /></div>
          <div className="col-span-2"><label className={label}>Body</label><textarea className={ta} title="CTA body text" placeholder="Body text..." rows={2} value={parsed.cta?.body || ''} onChange={e => update(['cta', 'body'], e.target.value)} /></div>
        </div>
      </div>
    </div>
  );

  if (slug === 'contact') return (
    <div>
      {heroEditor()}
      <RepeatableList title="Contact Cards" items={parsed.contactCards || []} onAdd={() => addItem('contactCards', { label: '', value: '', sub: '', link: '' })} onRemove={i => removeItem('contactCards', i)} renderItem={(item, i) => (
        <div className="grid grid-cols-2 gap-2">
          <div><label className={label}>Label</label><input className={inp} title="Card label" placeholder="e.g. Email" value={item.label || ''} onChange={e => updateItem('contactCards', i, 'label', e.target.value)} /></div>
          <div><label className={label}>Value (email / phone / location)</label><input className={inp} title="Contact value" placeholder="hello@blikcart.com" value={item.value || ''} onChange={e => updateItem('contactCards', i, 'value', e.target.value)} /></div>
          <div><label className={label}>Sub-text</label><input className={inp} title="Sub-text" placeholder="e.g. Mon–Fri 9am–5pm" value={item.sub || ''} onChange={e => updateItem('contactCards', i, 'sub', e.target.value)} /></div>
          <div><label className={label}>Link (mailto: / tel: / empty)</label><input className={inp} title="Link" placeholder="mailto:hello@blikcart.com" value={item.link || ''} onChange={e => updateItem('contactCards', i, 'link', e.target.value)} /></div>
        </div>
      )} />
      <div className="mb-6">
        <p className={secHead}>Form Section</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div><label className={label}>Title</label><input className={inp} title="Form section title" placeholder="Send us a message" value={parsed.formSection?.title || ''} onChange={e => update(['formSection', 'title'], e.target.value)} /></div>
          <div><label className={label}>Body</label><input className={inp} title="Form section body" placeholder="We'll get back to you within..." value={parsed.formSection?.body || ''} onChange={e => update(['formSection', 'body'], e.target.value)} /></div>
        </div>
        <div><label className={label}>Topic Options (one per line)</label><textarea className={ta} title="Topic options" placeholder={'Order enquiry\nSampling\nWholesale'} rows={6} value={(parsed.formSection?.topics || []).join('\n')} onChange={e => update(['formSection', 'topics'], e.target.value.split('\n').filter(Boolean))} /></div>
      </div>
      <div className="mb-4">
        <p className={secHead}>Response Times (one per line)</p>
        <textarea className={ta} title="Response times" placeholder={'Email: within 24 hours\nPhone: Mon–Fri 9am–5pm'} rows={4} value={(parsed.responseTimes || []).join('\n')} onChange={e => update(['responseTimes'], e.target.value.split('\n').filter(Boolean))} />
      </div>
    </div>
  );

  if (slug === 'design-your-own') return (
    <div>
      {heroEditor()}
      <RepeatableList title="Stats Bar" items={parsed.stats || []} onAdd={() => addItem('stats', { num: '', label: '' })} onRemove={i => removeItem('stats', i)} renderItem={(item, i) => (
        <div className="grid grid-cols-2 gap-2">
          <div><label className={label}>Number/Value</label><input className={inp} title="Stat number or value" placeholder="e.g. 500+" value={item.num || ''} onChange={e => updateItem('stats', i, 'num', e.target.value)} /></div>
          <div><label className={label}>Label</label><input className={inp} title="Stat label" placeholder="e.g. Products designed" value={item.label || ''} onChange={e => updateItem('stats', i, 'label', e.target.value)} /></div>
        </div>
      )} />
      <RepeatableList title="Lifecycle Steps" items={parsed.lifecycle || []} onAdd={() => addItem('lifecycle', { phase: 'You', step: 1, title: '', desc: '' })} onRemove={i => removeItem('lifecycle', i)} renderItem={(item, i) => (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={label}>Phase</label>
              <select title="Phase" className={inp} value={item.phase || 'You'} onChange={e => updateItem('lifecycle', i, 'phase', e.target.value)}>
                <option value="You">You</option><option value="Blikcart">Blikcart</option><option value="Delivered">Delivered</option>
              </select>
            </div>
            <div><label className={label}>Step #</label><input type="number" className={inp} title="Step number" placeholder="1" value={item.step || i+1} onChange={e => updateItem('lifecycle', i, 'step', Number(e.target.value))} /></div>
            <div><label className={label}>Title</label><input className={inp} title="Step title" placeholder="e.g. Design your product" value={item.title || ''} onChange={e => updateItem('lifecycle', i, 'title', e.target.value)} /></div>
          </div>
          <div><label className={label}>Description</label><textarea className={ta} title="Step description" placeholder="Describe this step..." rows={2} value={item.desc || ''} onChange={e => updateItem('lifecycle', i, 'desc', e.target.value)} /></div>
        </div>
      )} />
      <RepeatableList title="Product Categories" items={parsed.categories || []} onAdd={() => addItem('categories', { slug: '', name: '', description: '', leadTime: '', minOrder: 1, steps: 7 })} onRemove={i => removeItem('categories', i)} renderItem={(item, i) => (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div><label className={label}>Slug</label><input className={inp} title="URL slug" placeholder="e.g. bridles" value={item.slug || ''} onChange={e => updateItem('categories', i, 'slug', e.target.value)} /></div>
            <div><label className={label}>Name</label><input className={inp} title="Category name" placeholder="e.g. Bridles" value={item.name || ''} onChange={e => updateItem('categories', i, 'name', e.target.value)} /></div>
            <div><label className={label}>Lead Time</label><input className={inp} title="Lead time" placeholder="e.g. 3–4 weeks" value={item.leadTime || ''} onChange={e => updateItem('categories', i, 'leadTime', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={label}>Min Order</label><input type="number" className={inp} title="Minimum order quantity" placeholder="1" value={item.minOrder || 1} onChange={e => updateItem('categories', i, 'minOrder', Number(e.target.value))} /></div>
            <div><label className={label}>Config Steps</label><input type="number" className={inp} title="Number of configurator steps" placeholder="7" value={item.steps || 7} onChange={e => updateItem('categories', i, 'steps', Number(e.target.value))} /></div>
          </div>
          <div><label className={label}>Description</label><textarea className={ta} title="Category description" placeholder="Short description..." rows={2} value={item.description || ''} onChange={e => updateItem('categories', i, 'description', e.target.value)} /></div>
        </div>
      )} />
      <RepeatableList title="Why Blikcart" items={parsed.whyBlikcart || []} onAdd={() => addItem('whyBlikcart', { title: '', desc: '' })} onRemove={i => removeItem('whyBlikcart', i)} renderItem={(item, i) => (
        <div className="space-y-2">
          <div><label className={label}>Title</label><input className={inp} title="Reason title" placeholder="e.g. Expert craftsmanship" value={item.title || ''} onChange={e => updateItem('whyBlikcart', i, 'title', e.target.value)} /></div>
          <div><label className={label}>Description</label><textarea className={ta} title="Reason description" placeholder="Short description..." rows={2} value={item.desc || ''} onChange={e => updateItem('whyBlikcart', i, 'desc', e.target.value)} /></div>
        </div>
      )} />
      <RepeatableList title="FAQs" items={parsed.faqs || []} onAdd={() => addItem('faqs', { q: '', a: '' })} onRemove={i => removeItem('faqs', i)} renderItem={(item, i) => (
        <div className="space-y-2">
          <div><label className={label}>Question</label><input className={inp} title="FAQ question" placeholder="e.g. What is the minimum order?" value={item.q || ''} onChange={e => updateItem('faqs', i, 'q', e.target.value)} /></div>
          <div><label className={label}>Answer</label><textarea className={ta} title="FAQ answer" placeholder="Type the answer here..." rows={3} value={item.a || ''} onChange={e => updateItem('faqs', i, 'a', e.target.value)} /></div>
        </div>
      )} />
      <div className="mb-4">
        <p className={secHead}>Final CTA</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>Title</label><input className={inp} title="CTA title" placeholder="Ready to design your own?" value={parsed.finalCta?.title || ''} onChange={e => update(['finalCta', 'title'], e.target.value)} /></div>
          <div><label className={label}>Body</label><input className={inp} title="CTA body" placeholder="Short supporting text..." value={parsed.finalCta?.body || ''} onChange={e => update(['finalCta', 'body'], e.target.value)} /></div>
        </div>
      </div>
    </div>
  );

  if (slug === 'wholesale') return (
    <div>
      {heroEditor()}

      {/* Stats bar */}
      <RepeatableList title="Stats Bar (4 numbers)" items={parsed.stats || []} onAdd={() => addItem('stats', { value: '', label: '' })} onRemove={i => removeItem('stats', i)} renderItem={(item, i) => (
        <div className="grid grid-cols-2 gap-2">
          <div><label className={label}>Value</label><input className={inp} title="Stat value" placeholder="e.g. 500+" value={item.value || ''} onChange={e => updateItem('stats', i, 'value', e.target.value)} /></div>
          <div><label className={label}>Label</label><input className={inp} title="Stat label" placeholder="e.g. B2B Partners" value={item.label || ''} onChange={e => updateItem('stats', i, 'label', e.target.value)} /></div>
        </div>
      )} />

      {/* Benefits grid */}
      <RepeatableList title="Benefits Grid" items={parsed.benefits || []} onAdd={() => addItem('benefits', { icon: '📦', title: '', desc: '' })} onRemove={i => removeItem('benefits', i)} renderItem={(item, i) => (
        <div className="grid grid-cols-3 gap-2">
          <div><label className={label}>Icon (emoji)</label><input className={inp} title="Benefit icon" placeholder="📦" value={item.icon || ''} onChange={e => updateItem('benefits', i, 'icon', e.target.value)} /></div>
          <div><label className={label}>Title</label><input className={inp} title="Benefit title" placeholder="MOQ from 5 units" value={item.title || ''} onChange={e => updateItem('benefits', i, 'title', e.target.value)} /></div>
          <div><label className={label}>Description</label><input className={inp} title="Benefit description" placeholder="Low minimums..." value={item.desc || ''} onChange={e => updateItem('benefits', i, 'desc', e.target.value)} /></div>
        </div>
      )} />

      {/* Pricing tiers */}
      <RepeatableList title="Volume Pricing Tiers" items={parsed.pricingTiers || []} onAdd={() => addItem('pricingTiers', { qty: '', discount: '', tag: '', bg: '#f8fafc', border: '#e2e8f0' })} onRemove={i => removeItem('pricingTiers', i)} renderItem={(item, i) => (
        <div className="grid grid-cols-3 gap-2">
          <div><label className={label}>Qty range</label><input className={inp} title="Quantity range" placeholder="5 – 19 units" value={item.qty || ''} onChange={e => updateItem('pricingTiers', i, 'qty', e.target.value)} /></div>
          <div><label className={label}>Discount</label><input className={inp} title="Discount label" placeholder="10% off" value={item.discount || ''} onChange={e => updateItem('pricingTiers', i, 'discount', e.target.value)} /></div>
          <div><label className={label}>Badge (empty = none)</label><input className={inp} title="Badge text" placeholder="Popular" value={item.tag || ''} onChange={e => updateItem('pricingTiers', i, 'tag', e.target.value)} /></div>
        </div>
      )} />

      {/* Apply section */}
      <div className="mb-6">
        <p className={PCE_secHead}>Apply Section</p>
        <div className="space-y-2">
          <div><label className={label}>Heading</label><input className={inp} title="Section heading" placeholder="Get B2B Access" value={parsed.applySection?.heading || ''} onChange={e => update(['applySection', 'heading'], e.target.value)} /></div>
          <div><label className={label}>Body text</label><textarea className={ta} rows={2} title="Section body" placeholder="Apply below and we'll respond within 1 business day..." value={parsed.applySection?.body || ''} onChange={e => update(['applySection', 'body'], e.target.value)} /></div>
        </div>
      </div>

      {/* Contact info */}
      <div className="mb-6">
        <p className={PCE_secHead}>Contact Info (sidebar card)</p>
        <div className="grid grid-cols-3 gap-3">
          <div><label className={label}>Email</label><input className={inp} title="Contact email" placeholder="wholesale@blikcart.nl" value={parsed.contact?.email || ''} onChange={e => update(['contact', 'email'], e.target.value)} /></div>
          <div><label className={label}>Phone</label><input className={inp} title="Contact phone" placeholder="+31 (0)20 123 4567" value={parsed.contact?.phone || ''} onChange={e => update(['contact', 'phone'], e.target.value)} /></div>
          <div><label className={label}>Office Hours</label><input className={inp} title="Office hours" placeholder="Mon–Fri, 09:00–17:00 CET" value={parsed.contact?.hours || ''} onChange={e => update(['contact', 'hours'], e.target.value)} /></div>
        </div>
      </div>
    </div>
  );

  // Unknown slug — should not reach here since we only show this component for known slugs
  return <p className="text-sm text-gray-400">No structured editor for this page slug.</p>;
}

// ── Static Pages Tab ──────────────────────────────────────────────────────────

const EMPTY_PAGE = { slug: '', title: '', content: '', metaTitle: '', metaDescription: '', isPublished: false };

const KNOWN_PAGE_META: Record<string, string> = {
  'returns':        'Returns & Exchanges',
  'sizing-guide':   'Sizing Guide',
  'price-lists':    'Price Lists',
  'custom-orders':  'Custom Orders',
  'b2b':            'B2B / Wholesale Info',
  'contact':        'Contact',
  'design-your-own':'Design Your Own',
  'wholesale':      'Wholesale',
  'sale':           'Sale & Giveaways',
};

function PagesTab() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({ ...EMPTY_PAGE });
  const [saving, setSaving] = useState(false);
  const [seedingSlug, setSeedingSlug] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    try {
      const res = await axios.get(`${API}/content/admin/pages`, { headers: { Authorization: `Bearer ${token}` } });
      setPages(res.data || []);
    } catch { setPages([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(id: string) {
    setSaving(true);
    const token = localStorage.getItem('adminToken');
    try {
      await axios.patch(`${API}/content/admin/pages/${id}`, editForm, { headers: { Authorization: `Bearer ${token}` } });
      setPages(prev => prev.map(p => p.id === id ? { ...p, ...editForm } : p));
      setEditingId(null);
    } finally { setSaving(false); }
  }

  async function create() {
    if (!newForm.slug || !newForm.title) return;
    setSaving(true);
    const token = localStorage.getItem('adminToken');
    try {
      const res = await axios.post(`${API}/content/admin/pages`, newForm, { headers: { Authorization: `Bearer ${token}` } });
      setPages(prev => [res.data, ...prev]);
      setNewForm({ ...EMPTY_PAGE });
      setCreating(false);
    } finally { setSaving(false); }
  }

  async function deletePage(id: string) {
    if (!confirm('Delete this page?')) return;
    const token = localStorage.getItem('adminToken');
    await axios.delete(`${API}/content/admin/pages/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    setPages(prev => prev.filter(p => p.id !== id));
  }

  async function togglePublished(p: any) {
    const token = localStorage.getItem('adminToken');
    await axios.patch(`${API}/content/admin/pages/${p.id}`, { isPublished: !p.isPublished }, { headers: { Authorization: `Bearer ${token}` } });
    setPages(prev => prev.map(x => x.id === p.id ? { ...x, isPublished: !x.isPublished } : x));
  }

  async function seedPage(slug: string) {
    setSeedingSlug(slug);
    const token = localStorage.getItem('adminToken');
    try {
      const res = await axios.post(`${API}/content/admin/pages`, {
        slug,
        title: KNOWN_PAGE_META[slug] || slug,
        content: '{}',
        isPublished: true,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setPages(prev => [res.data, ...prev]);
    } finally { setSeedingSlug(null); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">{pages.length} pages</p>
        <button type="button" onClick={() => setCreating(true)}
          className="px-4 py-2 bg-[#1A3C5E] text-white rounded-lg text-sm font-semibold hover:bg-[#112E4D]">
          + New Page
        </button>
      </div>

      {creating && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm">New Static Page</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Slug * (e.g. about-us)</label>
              <input type="text" value={newForm.slug} onChange={e => setNewForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                placeholder="about-us"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Title *</label>
              <input type="text" title="Page title" placeholder="About Us" value={newForm.title} onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Meta Title</label>
              <input type="text" title="Meta title for SEO" placeholder="About Us — Blikcart" value={newForm.metaTitle} onChange={e => setNewForm(f => ({ ...f, metaTitle: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Meta Description</label>
              <input type="text" title="Meta description for SEO" placeholder="Short description for search engines..." value={newForm.metaDescription} onChange={e => setNewForm(f => ({ ...f, metaDescription: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]" />
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Content (HTML / Markdown)</label>
            <textarea value={newForm.content} onChange={e => setNewForm(f => ({ ...f, content: e.target.value }))}
              rows={8} placeholder="<h1>About Us</h1><p>...</p>"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-[#1A3C5E] resize-y" />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <Toggle value={newForm.isPublished} onChange={v => setNewForm(f => ({ ...f, isPublished: v }))} />
              Publish immediately
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCreating(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={create} disabled={!newForm.slug || !newForm.title || saving}
                className="px-4 py-2 bg-[#1A3C5E] text-white rounded-lg text-sm font-semibold hover:bg-[#112E4D] disabled:opacity-50">
                {saving ? 'Creating…' : 'Create Page'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick setup: show known slugs that haven't been created yet */}
      {!loading && (() => {
        const existingSlugs = new Set(pages.map(p => p.slug));
        const missing = Object.entries(KNOWN_PAGE_META).filter(([slug]) => !existingSlugs.has(slug));
        if (missing.length === 0) return null;
        return (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
            <p className="text-sm font-semibold text-amber-800 mb-3">
              These structured pages haven't been set up yet — click to create them:
            </p>
            <div className="flex flex-wrap gap-2">
              {missing.map(([slug, title]) => (
                <button key={slug} type="button"
                  disabled={seedingSlug === slug}
                  onClick={() => seedPage(slug)}
                  className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 text-xs font-semibold rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-colors">
                  {seedingSlug === slug ? 'Creating…' : `+ ${title}`}
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl p-5 border border-gray-100"><Skel cols={1} /></div>
        ) : pages.length > 0 ? pages.map(p => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {editingId === p.id ? (
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Slug</label>
                    <input type="text" value={editForm.slug ?? p.slug}
                      onChange={e => setEditForm((x: any) => ({ ...x, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                      title="Page slug"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-[#1A3C5E]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Title</label>
                    <input type="text" value={editForm.title ?? p.title}
                      onChange={e => setEditForm((x: any) => ({ ...x, title: e.target.value }))}
                      title="Page title"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Meta Title</label>
                    <input type="text" value={editForm.metaTitle ?? p.metaTitle ?? ''}
                      onChange={e => setEditForm((x: any) => ({ ...x, metaTitle: e.target.value }))}
                      title="Meta title"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Meta Description</label>
                    <input type="text" value={editForm.metaDescription ?? p.metaDescription ?? ''}
                      onChange={e => setEditForm((x: any) => ({ ...x, metaDescription: e.target.value }))}
                      title="Meta description"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]" />
                  </div>
                </div>
                {KNOWN_PAGE_SLUGS.includes(editForm.slug ?? p.slug) ? (
                  <PageContentEditor
                    key={p.id}
                    slug={editForm.slug ?? p.slug}
                    rawContent={editForm.content ?? p.content ?? '{}'}
                    onChange={v => setEditForm((x: any) => ({ ...x, content: v }))}
                  />
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Content</label>
                    <textarea value={editForm.content ?? p.content}
                      onChange={e => setEditForm((x: any) => ({ ...x, content: e.target.value }))}
                      rows={10} title="Page content"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-[#1A3C5E] resize-y" />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <Toggle value={editForm.isPublished ?? p.isPublished} onChange={v => setEditForm((x: any) => ({ ...x, isPublished: v }))} />
                    Published
                  </label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditingId(null)}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                    <button type="button" onClick={() => save(p.id)} disabled={saving}
                      className="px-4 py-2 bg-[#1A3C5E] text-white rounded-lg text-sm font-semibold hover:bg-[#112E4D] disabled:opacity-50">
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">/{p.slug}</code>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {p.isPublished ? 'Published' : 'Draft'}
                    </span>
                    {KNOWN_PAGE_SLUGS.includes(p.slug) && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600">Structured</span>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900">{p.title}</p>
                  {p.metaDescription && <p className="text-xs text-gray-400 mt-0.5">{p.metaDescription}</p>}
                  <p className="text-xs text-gray-300 mt-1">
                    Updated {new Date(p.updatedAt).toLocaleDateString()}
                    {' · '}{p.content.length} chars
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Toggle value={p.isPublished} onChange={() => togglePublished(p)} />
                  <button type="button" title="Edit page"
                    onClick={() => { setEditingId(p.id); setEditForm({}); }}
                    className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                    Edit
                  </button>
                  <button type="button" title="Delete page" onClick={() => deletePage(p.id)}
                    className="text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-600 hover:bg-red-50">
                    Del
                  </button>
                </div>
              </div>
            )}
          </div>
        )) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-10 text-center text-gray-400 text-sm">
            No static pages yet — click "+ New Page" to create one (e.g. about-us, terms, privacy-policy)
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

const TABS = ['Banners & Hero Images', 'FAQ', 'Pages'] as const;
type Tab = typeof TABS[number];

export default function ContentPage() {
  const [tab, setTab] = useState<Tab>('Banners & Hero Images');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Content</h1>
        <p className="text-gray-500 text-sm mt-1">Manage banners, FAQs, and static pages</p>
      </div>

      <div className="flex gap-1 mb-8 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t ? 'bg-white text-[#1A3C5E] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Banners & Hero Images' && <BannersTab />}
      {tab === 'FAQ' && <FaqTab />}
      {tab === 'Pages' && <PagesTab />}
    </div>
  );
}
