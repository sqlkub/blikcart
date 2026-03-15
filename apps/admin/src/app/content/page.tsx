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

const KNOWN_PAGE_SLUGS = ['returns', 'sizing-guide', 'price-lists', 'custom-orders', 'b2b', 'contact', 'design-your-own'];

function PageContentEditor({ slug, rawContent, onChange }: { slug: string; rawContent: string; onChange: (v: string) => void }) {
  const parsed = (() => { try { return JSON.parse(rawContent || '{}'); } catch { return {}; } })();

  function update(path: string[], value: any) {
    const next = JSON.parse(JSON.stringify(parsed));
    let obj = next;
    for (let i = 0; i < path.length - 1; i++) {
      if (obj[path[i]] === undefined) obj[path[i]] = {};
      obj = obj[path[i]];
    }
    obj[path[path.length - 1]] = value;
    onChange(JSON.stringify(next));
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

  // Shared styles
  const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]';
  const ta = `${inp} resize-y`;
  const label = 'block text-xs font-semibold text-gray-500 uppercase mb-1';
  const secHead = 'text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 mt-5';
  const card = 'bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3';

  // Hero section — common to all pages
  const HeroEditor = () => (
    <div className="mb-6">
      <p className={secHead}>Hero Section</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={label}>Eyebrow label</label>
          <input type="text" className={inp} value={parsed.hero?.eyebrow || ''} onChange={e => update(['hero', 'eyebrow'], e.target.value)} />
        </div>
        <div>
          <label className={label}>Page Title</label>
          <input type="text" className={inp} value={parsed.hero?.title || ''} onChange={e => update(['hero', 'title'], e.target.value)} />
        </div>
      </div>
      <div>
        <label className={label}>Subtitle</label>
        <textarea className={ta} rows={2} value={parsed.hero?.subtitle || ''} onChange={e => update(['hero', 'subtitle'], e.target.value)} />
      </div>
    </div>
  );

  // Repeatable list helper
  function RepeatableList({ field, title, template, renderItem }: { field: string; title: string; template: object; renderItem: (item: any, i: number) => React.ReactNode }) {
    const items = parsed[field] || [];
    return (
      <div className="mb-6">
        <p className={secHead}>{title}</p>
        {items.map((item: any, i: number) => (
          <div key={i} className={card}>
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-medium text-gray-400">#{i + 1}</span>
              <button type="button" onClick={() => removeItem(field, i)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
            </div>
            {renderItem(item, i)}
          </div>
        ))}
        <button type="button" onClick={() => addItem(field, template)} className="text-xs px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#1A3C5E] hover:text-[#1A3C5E] w-full">
          + Add Item
        </button>
      </div>
    );
  }

  if (slug === 'returns') return (
    <div>
      <HeroEditor />
      <RepeatableList field="summaryCards" title="Summary Cards (top strip)" template={{ label: '', sub: '' }} renderItem={(item, i) => (
        <div className="grid grid-cols-2 gap-2">
          <div><label className={label}>Label</label><input className={inp} value={item.label || ''} onChange={e => updateItem('summaryCards', i, 'label', e.target.value)} /></div>
          <div><label className={label}>Sub-text</label><input className={inp} value={item.sub || ''} onChange={e => updateItem('summaryCards', i, 'sub', e.target.value)} /></div>
        </div>
      )} />
      <RepeatableList field="sections" title="Policy Sections" template={{ title: '', paragraphs: [], bullets: [], footer: '' }} renderItem={(item, i) => (
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
    <div>
      <HeroEditor />
      <RepeatableList field="bridleSizes" title="Bridle Sizes Table" template={{ size: '', headpiece: '', browband: '', noseband: '', cheekpieces: '' }} renderItem={(item, i) => (
        <div className="grid grid-cols-5 gap-2">
          {['size','headpiece','browband','noseband','cheekpieces'].map(f => (
            <div key={f}><label className={label}>{f}</label><input className={inp} value={item[f] || ''} onChange={e => updateItem('bridleSizes', i, f, e.target.value)} /></div>
          ))}
        </div>
      )} />
      <RepeatableList field="rugSizes" title="Rug Sizes Table" template={{ size: '', cm: '', back: '', chest: '', breeds: '' }} renderItem={(item, i) => (
        <div className="grid grid-cols-5 gap-2">
          {['size','cm','back','chest','breeds'].map(f => (
            <div key={f}><label className={label}>{f}</label><input className={inp} value={item[f] || ''} onChange={e => updateItem('rugSizes', i, f, e.target.value)} /></div>
          ))}
        </div>
      )} />
      <RepeatableList field="bootSizes" title="Boot Sizes Table" template={{ size: '', canon: '', fits: '' }} renderItem={(item, i) => (
        <div className="grid grid-cols-3 gap-2">
          {['size','canon','fits'].map(f => (
            <div key={f}><label className={label}>{f}</label><input className={inp} value={item[f] || ''} onChange={e => updateItem('bootSizes', i, f, e.target.value)} /></div>
          ))}
        </div>
      )} />
      <RepeatableList field="howToMeasure" title="How to Measure Cards" template={{ title: '', steps: [] }} renderItem={(item, i) => (
        <div className="space-y-2">
          <div><label className={label}>Card Title</label><input className={inp} value={item.title || ''} onChange={e => updateItem('howToMeasure', i, 'title', e.target.value)} /></div>
          <div><label className={label}>Steps (one per line)</label><textarea className={ta} rows={4} value={(item.steps || []).join('\n')} onChange={e => updateItem('howToMeasure', i, 'steps', e.target.value.split('\n').filter(Boolean))} /></div>
        </div>
      )} />
    </div>
  );

  if (slug === 'price-lists') return (
    <div>
      <HeroEditor />
      <RepeatableList field="basePrices" title="Base Prices Table" template={{ category: '', from: 0, to: 0, moq: 1, note: '', leadTime: '' }} renderItem={(item, i) => (
        <div className="grid grid-cols-3 gap-2">
          <div><label className={label}>Category</label><input className={inp} value={item.category || ''} onChange={e => updateItem('basePrices', i, 'category', e.target.value)} /></div>
          <div><label className={label}>From (€)</label><input type="number" className={inp} value={item.from || 0} onChange={e => updateItem('basePrices', i, 'from', Number(e.target.value))} /></div>
          <div><label className={label}>To (€)</label><input type="number" className={inp} value={item.to || 0} onChange={e => updateItem('basePrices', i, 'to', Number(e.target.value))} /></div>
          <div><label className={label}>MOQ</label><input type="number" className={inp} value={item.moq || 1} onChange={e => updateItem('basePrices', i, 'moq', Number(e.target.value))} /></div>
          <div><label className={label}>Lead Time</label><input className={inp} value={item.leadTime || ''} onChange={e => updateItem('basePrices', i, 'leadTime', e.target.value)} /></div>
          <div><label className={label}>Note</label><input className={inp} value={item.note || ''} onChange={e => updateItem('basePrices', i, 'note', e.target.value)} /></div>
        </div>
      )} />
      <RepeatableList field="volumeTiers" title="Volume Discount Tiers" template={{ range: '', discount: '', highlight: false }} renderItem={(item, i) => (
        <div className="grid grid-cols-3 gap-2 items-end">
          <div><label className={label}>Range</label><input className={inp} value={item.range || ''} onChange={e => updateItem('volumeTiers', i, 'range', e.target.value)} /></div>
          <div><label className={label}>Discount</label><input className={inp} value={item.discount || ''} onChange={e => updateItem('volumeTiers', i, 'discount', e.target.value)} /></div>
          <div><label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase cursor-pointer mt-4"><input type="checkbox" checked={item.highlight || false} onChange={e => updateItem('volumeTiers', i, 'highlight', e.target.checked)} /> Highlight (Most Popular)</label></div>
        </div>
      )} />
      <div className="mb-4">
        <p className={secHead}>Express Production Section</p>
        <div><label className={label}>Title</label><input className={inp} value={parsed.expressSection?.title || ''} onChange={e => update(['expressSection', 'title'], e.target.value)} /></div>
        <div className="mt-2"><label className={label}>Body</label><textarea className={ta} rows={3} value={parsed.expressSection?.body || ''} onChange={e => update(['expressSection', 'body'], e.target.value)} /></div>
      </div>
    </div>
  );

  if (slug === 'custom-orders') return (
    <div>
      <HeroEditor />
      <RepeatableList field="processSteps" title="Process Steps" template={{ step: 1, title: '', desc: '' }} renderItem={(item, i) => (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2">
            <div><label className={label}>Step #</label><input type="number" className={inp} value={item.step || i+1} onChange={e => updateItem('processSteps', i, 'step', Number(e.target.value))} /></div>
            <div className="col-span-3"><label className={label}>Title</label><input className={inp} value={item.title || ''} onChange={e => updateItem('processSteps', i, 'title', e.target.value)} /></div>
          </div>
          <div><label className={label}>Description</label><textarea className={ta} rows={2} value={item.desc || ''} onChange={e => updateItem('processSteps', i, 'desc', e.target.value)} /></div>
        </div>
      )} />
      <RepeatableList field="categories" title="Product Categories" template={{ slug: '', name: '', from: 0, leadTime: '', moq: 1 }} renderItem={(item, i) => (
        <div className="grid grid-cols-3 gap-2">
          <div><label className={label}>Slug</label><input className={inp} value={item.slug || ''} onChange={e => updateItem('categories', i, 'slug', e.target.value)} /></div>
          <div><label className={label}>Name</label><input className={inp} value={item.name || ''} onChange={e => updateItem('categories', i, 'name', e.target.value)} /></div>
          <div><label className={label}>From (€)</label><input type="number" className={inp} value={item.from || 0} onChange={e => updateItem('categories', i, 'from', Number(e.target.value))} /></div>
          <div><label className={label}>Lead Time</label><input className={inp} value={item.leadTime || ''} onChange={e => updateItem('categories', i, 'leadTime', e.target.value)} /></div>
          <div><label className={label}>MOQ</label><input type="number" className={inp} value={item.moq || 1} onChange={e => updateItem('categories', i, 'moq', Number(e.target.value))} /></div>
        </div>
      )} />
      <RepeatableList field="capabilities" title="Capabilities" template={{ label: '', desc: '' }} renderItem={(item, i) => (
        <div className="grid grid-cols-2 gap-2">
          <div><label className={label}>Label</label><input className={inp} value={item.label || ''} onChange={e => updateItem('capabilities', i, 'label', e.target.value)} /></div>
          <div><label className={label}>Description</label><input className={inp} value={item.desc || ''} onChange={e => updateItem('capabilities', i, 'desc', e.target.value)} /></div>
        </div>
      )} />
    </div>
  );

  if (slug === 'b2b') return (
    <div>
      <HeroEditor />
      <RepeatableList field="stats" title="Stats Bar" template={{ value: '', label: '' }} renderItem={(item, i) => (
        <div className="grid grid-cols-2 gap-2">
          <div><label className={label}>Value</label><input className={inp} value={item.value || ''} onChange={e => updateItem('stats', i, 'value', e.target.value)} /></div>
          <div><label className={label}>Label</label><input className={inp} value={item.label || ''} onChange={e => updateItem('stats', i, 'label', e.target.value)} /></div>
        </div>
      )} />
      <RepeatableList field="features" title="Features / Benefits" template={{ title: '', desc: '' }} renderItem={(item, i) => (
        <div className="space-y-2">
          <div><label className={label}>Title</label><input className={inp} value={item.title || ''} onChange={e => updateItem('features', i, 'title', e.target.value)} /></div>
          <div><label className={label}>Description</label><textarea className={ta} rows={2} value={item.desc || ''} onChange={e => updateItem('features', i, 'desc', e.target.value)} /></div>
        </div>
      )} />
      <RepeatableList field="steps" title="How to Get Access Steps" template={{ step: '01', title: '', desc: '', link: '', linkText: '' }} renderItem={(item, i) => (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2">
            <div><label className={label}>Step label</label><input className={inp} value={item.step || ''} onChange={e => updateItem('steps', i, 'step', e.target.value)} /></div>
            <div className="col-span-3"><label className={label}>Title</label><input className={inp} value={item.title || ''} onChange={e => updateItem('steps', i, 'title', e.target.value)} /></div>
          </div>
          <div><label className={label}>Description</label><textarea className={ta} rows={2} value={item.desc || ''} onChange={e => updateItem('steps', i, 'desc', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={label}>Link URL (optional)</label><input className={inp} value={item.link || ''} onChange={e => updateItem('steps', i, 'link', e.target.value)} /></div>
            <div><label className={label}>Link Text (optional)</label><input className={inp} value={item.linkText || ''} onChange={e => updateItem('steps', i, 'linkText', e.target.value)} /></div>
          </div>
        </div>
      )} />
      <RepeatableList field="volumeTiers" title="Volume Tiers" template={{ range: '', pct: '', note: '' }} renderItem={(item, i) => (
        <div className="grid grid-cols-3 gap-2">
          <div><label className={label}>Range</label><input className={inp} value={item.range || ''} onChange={e => updateItem('volumeTiers', i, 'range', e.target.value)} /></div>
          <div><label className={label}>Discount %</label><input className={inp} value={item.pct || ''} onChange={e => updateItem('volumeTiers', i, 'pct', e.target.value)} /></div>
          <div><label className={label}>Badge (empty = no badge)</label><input className={inp} placeholder="e.g. Popular" value={item.note || ''} onChange={e => updateItem('volumeTiers', i, 'note', e.target.value)} /></div>
        </div>
      )} />
      <div className="mb-4">
        <p className={secHead}>CTA Block</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>Title</label><input className={inp} value={parsed.cta?.title || ''} onChange={e => update(['cta', 'title'], e.target.value)} /></div>
          <div><label className={label}>Email</label><input className={inp} value={parsed.cta?.email || ''} onChange={e => update(['cta', 'email'], e.target.value)} /></div>
          <div className="col-span-2"><label className={label}>Body</label><textarea className={ta} rows={2} value={parsed.cta?.body || ''} onChange={e => update(['cta', 'body'], e.target.value)} /></div>
        </div>
      </div>
    </div>
  );

  if (slug === 'contact') return (
    <div>
      <HeroEditor />
      <RepeatableList field="contactCards" title="Contact Cards" template={{ label: '', value: '', sub: '', link: '' }} renderItem={(item, i) => (
        <div className="grid grid-cols-2 gap-2">
          <div><label className={label}>Label</label><input className={inp} value={item.label || ''} onChange={e => updateItem('contactCards', i, 'label', e.target.value)} /></div>
          <div><label className={label}>Value (email / phone / location)</label><input className={inp} value={item.value || ''} onChange={e => updateItem('contactCards', i, 'value', e.target.value)} /></div>
          <div><label className={label}>Sub-text</label><input className={inp} value={item.sub || ''} onChange={e => updateItem('contactCards', i, 'sub', e.target.value)} /></div>
          <div><label className={label}>Link (mailto: / tel: / empty)</label><input className={inp} value={item.link || ''} onChange={e => updateItem('contactCards', i, 'link', e.target.value)} /></div>
        </div>
      )} />
      <div className="mb-6">
        <p className={secHead}>Form Section</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div><label className={label}>Title</label><input className={inp} value={parsed.formSection?.title || ''} onChange={e => update(['formSection', 'title'], e.target.value)} /></div>
          <div><label className={label}>Body</label><input className={inp} value={parsed.formSection?.body || ''} onChange={e => update(['formSection', 'body'], e.target.value)} /></div>
        </div>
        <div><label className={label}>Topic Options (one per line)</label><textarea className={ta} rows={6} value={(parsed.formSection?.topics || []).join('\n')} onChange={e => update(['formSection', 'topics'], e.target.value.split('\n').filter(Boolean))} /></div>
      </div>
      <div className="mb-4">
        <p className={secHead}>Response Times (one per line)</p>
        <textarea className={ta} rows={4} value={(parsed.responseTimes || []).join('\n')} onChange={e => update(['responseTimes'], e.target.value.split('\n').filter(Boolean))} />
      </div>
    </div>
  );

  if (slug === 'design-your-own') return (
    <div>
      <HeroEditor />
      <RepeatableList field="stats" title="Stats Bar" template={{ num: '', label: '' }} renderItem={(item, i) => (
        <div className="grid grid-cols-2 gap-2">
          <div><label className={label}>Number/Value</label><input className={inp} value={item.num || ''} onChange={e => updateItem('stats', i, 'num', e.target.value)} /></div>
          <div><label className={label}>Label</label><input className={inp} value={item.label || ''} onChange={e => updateItem('stats', i, 'label', e.target.value)} /></div>
        </div>
      )} />
      <RepeatableList field="lifecycle" title="Lifecycle Steps" template={{ phase: 'You', step: 1, title: '', desc: '' }} renderItem={(item, i) => (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={label}>Phase</label>
              <select title="Phase" className={inp} value={item.phase || 'You'} onChange={e => updateItem('lifecycle', i, 'phase', e.target.value)}>
                <option value="You">You</option><option value="Blikcart">Blikcart</option><option value="Delivered">Delivered</option>
              </select>
            </div>
            <div><label className={label}>Step #</label><input type="number" className={inp} value={item.step || i+1} onChange={e => updateItem('lifecycle', i, 'step', Number(e.target.value))} /></div>
            <div><label className={label}>Title</label><input className={inp} value={item.title || ''} onChange={e => updateItem('lifecycle', i, 'title', e.target.value)} /></div>
          </div>
          <div><label className={label}>Description</label><textarea className={ta} rows={2} value={item.desc || ''} onChange={e => updateItem('lifecycle', i, 'desc', e.target.value)} /></div>
        </div>
      )} />
      <RepeatableList field="categories" title="Product Categories" template={{ slug: '', name: '', description: '', leadTime: '', minOrder: 1, steps: 7 }} renderItem={(item, i) => (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div><label className={label}>Slug</label><input className={inp} value={item.slug || ''} onChange={e => updateItem('categories', i, 'slug', e.target.value)} /></div>
            <div><label className={label}>Name</label><input className={inp} value={item.name || ''} onChange={e => updateItem('categories', i, 'name', e.target.value)} /></div>
            <div><label className={label}>Lead Time</label><input className={inp} value={item.leadTime || ''} onChange={e => updateItem('categories', i, 'leadTime', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={label}>Min Order</label><input type="number" className={inp} value={item.minOrder || 1} onChange={e => updateItem('categories', i, 'minOrder', Number(e.target.value))} /></div>
            <div><label className={label}>Config Steps</label><input type="number" className={inp} value={item.steps || 7} onChange={e => updateItem('categories', i, 'steps', Number(e.target.value))} /></div>
          </div>
          <div><label className={label}>Description</label><textarea className={ta} rows={2} value={item.description || ''} onChange={e => updateItem('categories', i, 'description', e.target.value)} /></div>
        </div>
      )} />
      <RepeatableList field="whyBlikcart" title="Why Blikcart" template={{ title: '', desc: '' }} renderItem={(item, i) => (
        <div className="space-y-2">
          <div><label className={label}>Title</label><input className={inp} value={item.title || ''} onChange={e => updateItem('whyBlikcart', i, 'title', e.target.value)} /></div>
          <div><label className={label}>Description</label><textarea className={ta} rows={2} value={item.desc || ''} onChange={e => updateItem('whyBlikcart', i, 'desc', e.target.value)} /></div>
        </div>
      )} />
      <RepeatableList field="faqs" title="FAQs" template={{ q: '', a: '' }} renderItem={(item, i) => (
        <div className="space-y-2">
          <div><label className={label}>Question</label><input className={inp} value={item.q || ''} onChange={e => updateItem('faqs', i, 'q', e.target.value)} /></div>
          <div><label className={label}>Answer</label><textarea className={ta} rows={3} value={item.a || ''} onChange={e => updateItem('faqs', i, 'a', e.target.value)} /></div>
        </div>
      )} />
      <div className="mb-4">
        <p className={secHead}>Final CTA</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>Title</label><input className={inp} value={parsed.finalCta?.title || ''} onChange={e => update(['finalCta', 'title'], e.target.value)} /></div>
          <div><label className={label}>Body</label><input className={inp} value={parsed.finalCta?.body || ''} onChange={e => update(['finalCta', 'body'], e.target.value)} /></div>
        </div>
      </div>
    </div>
  );

  // Unknown slug — should not reach here since we only show this component for known slugs
  return <p className="text-sm text-gray-400">No structured editor for this page slug.</p>;
}

// ── Static Pages Tab ──────────────────────────────────────────────────────────

const EMPTY_PAGE = { slug: '', title: '', content: '', metaTitle: '', metaDescription: '', isPublished: false };

function PagesTab() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({ ...EMPTY_PAGE });
  const [saving, setSaving] = useState(false);

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
              <input type="text" value={newForm.title} onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Meta Title</label>
              <input type="text" value={newForm.metaTitle} onChange={e => setNewForm(f => ({ ...f, metaTitle: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Meta Description</label>
              <input type="text" value={newForm.metaDescription} onChange={e => setNewForm(f => ({ ...f, metaDescription: e.target.value }))}
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
