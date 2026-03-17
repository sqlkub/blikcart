'use client';
import { useEffect, useState, useCallback, useMemo, useRef, Fragment } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Package, Tag, Layers, Cpu, Plus, Pencil, ToggleLeft, ToggleRight, Trash2, ChevronDown, ChevronUp, Check, X, Download, ExternalLink, ImagePlus } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

type Tab = 'products' | 'categories' | 'variants' | 'schemas';

function token() { return localStorage.getItem('adminToken') || ''; }
function hdrs() { return { Authorization: `Bearer ${token()}` }; }

// ── Shared helpers ────────────────────────────────────────────────────────────

function Bdg({ label, color }: { label: string; color: string }) {
  return <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${color}`}>{label}</span>;
}

function Skel({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <>
      {[...Array(rows)].map((_, i) => (
        <tr key={i} className="border-b border-gray-50">
          {[...Array(cols)].map((_, j) => (
            <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ── All Products ──────────────────────────────────────────────────────────────

function ProductsTab() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('');
  const [custFilter, setCustFilter] = useState<boolean | null>(null);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [createForm, setCreateForm] = useState({
    name: '', sku: '', categoryId: '', basePrice: '', wholesalePrice: '',
    moq: '1', leadTimeDays: '0', isCustomizable: false, description: '',
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkWorking, setBulkWorking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        axios.get(`${API}/products/admin/all?limit=100`, { headers: hdrs() }),
        axios.get(`${API}/products/admin/categories`, { headers: hdrs() }),
      ]);
      setProducts(pRes.data.data || []);
      setCategories(cRes.data || []);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => products.filter(p => {
    if (statusFilter === 'active' && !p.isActive) return false;
    if (statusFilter === 'inactive' && p.isActive) return false;
    if (catFilter && p.categoryId !== catFilter) return false;
    if (custFilter !== null && p.isCustomizable !== custFilter) return false;
    if (lowStockOnly && (p.totalStock ?? 1) > 0) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.sku?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [products, statusFilter, catFilter, custFilter, lowStockOnly, search]);

  async function toggleActive(id: string) {
    await axios.patch(`${API}/products/admin/${id}/toggle`, {}, { headers: hdrs() });
    setProducts(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
  }

  async function deleteProduct(id: string) {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    await axios.delete(`${API}/products/admin/${id}`, { headers: hdrs() });
    setProducts(prev => prev.filter(p => p.id !== id));
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s; });
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length && filtered.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(p => p.id)));
    }
  }

  async function bulkActivate(active: boolean) {
    setBulkWorking(true);
    try {
      await Promise.all(Array.from(selected).map(id => {
        const p = products.find(x => x.id === id);
        if (p && p.isActive !== active) return axios.patch(`${API}/products/admin/${id}/toggle`, {}, { headers: hdrs() });
      }));
      setProducts(prev => prev.map(p => selected.has(p.id) ? { ...p, isActive: active } : p));
      setSelected(new Set());
    } finally { setBulkWorking(false); }
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selected.size} product(s)? This cannot be undone.`)) return;
    setBulkWorking(true);
    try {
      await Promise.all(Array.from(selected).map(id => axios.delete(`${API}/products/admin/${id}`, { headers: hdrs() })));
      setProducts(prev => prev.filter(p => !selected.has(p.id)));
      setSelected(new Set());
    } finally { setBulkWorking(false); }
  }

  function exportCSV() {
    const rows = filtered.filter(p => selected.size === 0 || selected.has(p.id));
    const csv = ['Name,SKU,Category,Base Price,Wholesale Price,Active,Customizable,Stock'].concat(
      rows.map(p => `"${p.name}","${p.sku}","${p.category?.name ?? ''}","${p.basePrice}","${p.wholesalePrice ?? ''}","${p.isActive}","${p.isCustomizable}","${p.totalStock ?? ''}"`)
    ).join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'products.csv' });
    a.click();
  }

  async function saveEdit(id: string) {
    const res = await axios.patch(`${API}/products/${id}`, editForm, { headers: hdrs() });
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...res.data } : p));
    setEditingId(null);
  }

  async function createProduct() {
    if (!createForm.name || !createForm.categoryId || !createForm.basePrice) return;
    const res = await axios.post(`${API}/products/admin`, createForm, { headers: hdrs() });
    setProducts(prev => [{ ...res.data, variantCount: 0 }, ...prev]);
    setShowCreate(false);
    setCreateForm({ name: '', sku: '', categoryId: '', basePrice: '', wholesalePrice: '', moq: '1', leadTimeDays: '0', isCustomizable: false, description: '' });
  }

  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string | null>(null);

  // Stock management modal
  const [stockProduct, setStockProduct] = useState<any | null>(null);
  const [stockVariants, setStockVariants] = useState<any[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockValues, setStockValues] = useState<Record<string, number>>({});

  async function openStockModal(p: any) {
    setStockProduct(p);
    setStockLoading(true);
    try {
      const res = await axios.get(`${API}/products/admin/variants?productId=${p.id}`, { headers: hdrs() });
      const vars = res.data || [];
      setStockVariants(vars);
      setStockValues(Object.fromEntries(vars.map((v: any) => [v.id, v.stockQty])));
    } catch { setStockVariants([]); }
    finally { setStockLoading(false); }
  }

  async function saveStock() {
    if (!stockProduct) return;
    await Promise.all(stockVariants.map(v =>
      axios.patch(`${API}/products/admin/variants/${v.id}`, { stockQty: stockValues[v.id] ?? v.stockQty }, { headers: hdrs() })
    ));
    setProducts(prev => prev.map(p => p.id === stockProduct.id
      ? { ...p, totalStock: Object.values(stockValues).reduce((a: number, b) => a + (b as number), 0) }
      : p
    ));
    setStockProduct(null);
  }

  async function toggleAddon(p: any) {
    const tags: string[] = p.tags || [];
    const next = tags.includes('addon') ? tags.filter((t: string) => t !== 'addon') : [...tags, 'addon'];
    await axios.patch(`${API}/products/${p.id}`, { tags: next }, { headers: hdrs() });
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, tags: next } : x));
  }

  // Image manager modal
  const [imgMgrProduct, setImgMgrProduct] = useState<any | null>(null);
  const [imgMgrImages, setImgMgrImages] = useState<any[]>([]);
  const [imgMgrLoading, setImgMgrLoading] = useState(false);
  const addImgInputRef = useRef<HTMLInputElement>(null);

  async function openImgMgr(p: any) {
    setImgMgrProduct(p);
    setImgMgrLoading(true);
    try {
      const res = await axios.get(`${API}/products/${p.id}/images`, { headers: hdrs() });
      setImgMgrImages(res.data || []);
    } catch { setImgMgrImages(p.images || []); }
    finally { setImgMgrLoading(false); }
  }

  async function imgMgrDelete(imageId: string) {
    if (!imgMgrProduct) return;
    await axios.delete(`${API}/products/${imgMgrProduct.id}/images/${imageId}`, { headers: hdrs() });
    const next = imgMgrImages.filter(i => i.id !== imageId);
    setImgMgrImages(next);
    setProducts(prev => prev.map(p => p.id === imgMgrProduct.id ? { ...p, images: next } : p));
  }

  async function imgMgrSetPrimary(imageId: string) {
    if (!imgMgrProduct) return;
    await axios.patch(`${API}/products/${imgMgrProduct.id}/images/${imageId}`, { isPrimary: true }, { headers: hdrs() });
    const next = imgMgrImages.map(i => ({ ...i, isPrimary: i.id === imageId }));
    setImgMgrImages(next);
    setProducts(prev => prev.map(p => p.id === imgMgrProduct.id ? { ...p, images: next } : p));
  }

  async function imgMgrSetType(imageId: string, layerType: string) {
    if (!imgMgrProduct) return;
    await axios.patch(`${API}/products/${imgMgrProduct.id}/images/${imageId}`, { layerType }, { headers: hdrs() });
    setImgMgrImages(prev => prev.map(i => i.id === imageId ? { ...i, layerType } : i));
  }

  async function imgMgrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !imgMgrProduct) return;
    e.target.value = '';
    setImgMgrLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('isPrimary', imgMgrImages.length === 0 ? 'true' : 'false');
      const res = await axios.post(`${API}/products/${imgMgrProduct.id}/images`, fd, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const next = [...imgMgrImages, res.data];
      setImgMgrImages(next);
      setProducts(prev => prev.map(p => p.id === imgMgrProduct.id ? { ...p, images: next } : p));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Upload failed');
    } finally { setImgMgrLoading(false); }
  }

  function triggerUpload(productId: string) {
    uploadTargetRef.current = productId;
    fileInputRef.current?.click();
  }

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const productId = uploadTargetRef.current;
    if (!file || !productId) return;
    e.target.value = '';
    setUploadingId(productId);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('isPrimary', 'true');
      const res = await axios.post(`${API}/products/${productId}/images`, fd, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setProducts(prev => prev.map(p =>
        p.id === productId ? { ...p, images: [res.data, ...(p.images || []).filter((i: any) => !i.isPrimary)] } : p
      ));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Image upload failed');
    } finally {
      setUploadingId(null);
    }
  }

  const VIEW_TYPES = [
    { value: '', label: 'Photo' },
    { value: '2d', label: '2D Render' },
    { value: '3d', label: '3D Render' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'detail', label: 'Detail' },
  ];

  const stats = {
    total: products.length,
    active: products.filter(p => p.isActive).length,
    inactive: products.filter(p => !p.isActive).length,
    customizable: products.filter(p => p.isCustomizable).length,
  };

  return (
    <div className="space-y-5">

      {/* Stock Management Modal */}
      {stockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setStockProduct(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Stock — {stockProduct.name}</h2>
              <button type="button" title="Close" onClick={() => setStockProduct(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            {stockLoading && <p className="text-sm text-gray-400 text-center py-6">Loading…</p>}
            {!stockLoading && stockVariants.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No variants. Add variants in the Variants tab first.</p>
            )}
            {!stockLoading && stockVariants.length > 0 && (
              <div className="space-y-3 mb-5">
                {stockVariants.map(v => {
                  const label = [v.size, v.color, v.material].filter(Boolean).join(' · ') || v.sku;
                  const qty = stockValues[v.id] ?? v.stockQty;
                  return (
                    <div key={v.id} className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{label}</p>
                        <p className="text-xs text-gray-400 font-mono">{v.sku}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" title="Decrease"
                          onClick={() => setStockValues(s => ({ ...s, [v.id]: Math.max(0, (s[v.id] ?? v.stockQty) - 1) }))}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-300 font-bold text-lg flex items-center justify-center">−</button>
                        <input
                          type="number"
                          title="Stock quantity"
                          min={0}
                          value={qty}
                          onChange={e => setStockValues(s => ({ ...s, [v.id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="w-16 text-center border border-gray-200 rounded-lg px-2 py-1 text-sm font-bold outline-none"
                        />
                        <button type="button" title="Increase"
                          onClick={() => setStockValues(s => ({ ...s, [v.id]: (s[v.id] ?? v.stockQty) + 1 }))}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-green-50 hover:border-green-300 font-bold text-lg flex items-center justify-center">+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {!stockLoading && stockVariants.length > 0 && (
              <div className="flex gap-2">
                <button type="button" onClick={saveStock}
                  className="flex-1 bg-[#1A3C5E] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#112E4D]">
                  Save Stock
                </button>
                <button type="button" onClick={() => setStockProduct(null)}
                  className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm font-semibold hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Manager Modal */}
      {imgMgrProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setImgMgrProduct(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Images — {imgMgrProduct.name}</h2>
              <button type="button" title="Close" onClick={() => setImgMgrProduct(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            {imgMgrLoading && <p className="text-sm text-gray-400 text-center py-6">Loading…</p>}

            {!imgMgrLoading && imgMgrImages.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No images yet. Upload one below.</p>
            )}

            {!imgMgrLoading && imgMgrImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {imgMgrImages.map(img => (
                  <div key={img.id} className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50">
                    <div className="relative">
                      <img src={img.url} alt={img.altText || ''} className="w-full h-36 object-cover" />
                      {img.isPrimary && (
                        <span className="absolute top-1 left-1 text-xs bg-[#1A3C5E] text-white px-2 py-0.5 rounded-full font-semibold">Primary</span>
                      )}
                    </div>
                    <div className="p-2 space-y-2">
                      <select
                        title="View type"
                        value={img.layerType || ''}
                        onChange={e => imgMgrSetType(img.id, e.target.value)}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white outline-none"
                      >
                        {VIEW_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      <div className="flex gap-1">
                        {!img.isPrimary && (
                          <button type="button" onClick={() => imgMgrSetPrimary(img.id)}
                            className="flex-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg px-2 py-1 font-medium">
                            Set Primary
                          </button>
                        )}
                        <button type="button" onClick={() => imgMgrDelete(img.id)}
                          className="flex-1 text-xs bg-red-50 text-red-500 hover:bg-red-100 rounded-lg px-2 py-1 font-medium flex items-center justify-center gap-1">
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <input ref={addImgInputRef} type="file" accept="image/*" title="Add image" className="hidden" onChange={imgMgrUpload} />
            <button type="button" onClick={() => addImgInputRef.current?.click()}
              disabled={imgMgrLoading}
              className="w-full border-2 border-dashed border-gray-200 hover:border-[#1A3C5E] text-gray-500 hover:text-[#1A3C5E] rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-40">
              <ImagePlus size={16} /> Add Image
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-[#1A3C5E]' },
          { label: 'Active', value: stats.active, color: 'text-green-600' },
          { label: 'Inactive', value: stats.inactive, color: 'text-gray-400' },
          { label: 'Customizable', value: stats.customizable, color: 'text-blue-600' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{c.label}</p>
            {loading ? <div className="h-7 w-12 bg-gray-100 rounded animate-pulse mt-1" /> :
              <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>}
          </div>
        ))}
      </div>

      {/* Hidden file input for image uploads */}
      <input ref={fileInputRef} type="file" accept="image/*" title="Upload product image" className="hidden" onChange={handleImageFile} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input type="text" placeholder="Search name or SKU…" value={search} onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none w-52" />
        <select title="Filter by category" value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none">
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex gap-1 flex-wrap">
          {(['all', 'active', 'inactive'] as const).map(s => (
            <button key={s} type="button" onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${statusFilter === s ? 'bg-[#1A3C5E] text-white border-[#1A3C5E]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <button type="button" onClick={() => setCustFilter(custFilter === true ? null : true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${custFilter === true ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
            Customizable
          </button>
          <button type="button" onClick={() => setLowStockOnly(s => !s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${lowStockOnly ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
            Low Stock
          </button>
        </div>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={exportCSV} title="Export CSV"
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50">
            <Download size={13} /> Export
          </button>
          <button type="button" onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A3C5E] text-white text-sm font-semibold rounded-lg hover:bg-[#112E4D]">
            <Plus size={14} /> New Product
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-[#1A3C5E] text-white rounded-xl px-5 py-3">
          <span className="text-sm font-semibold">{selected.size} selected</span>
          <div className="flex gap-2 ml-auto">
            <button type="button" onClick={() => bulkActivate(true)} disabled={bulkWorking}
              className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50">Activate</button>
            <button type="button" onClick={() => bulkActivate(false)} disabled={bulkWorking}
              className="text-xs bg-gray-500 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-600 disabled:opacity-50">Deactivate</button>
            <button type="button" onClick={exportCSV}
              className="text-xs bg-white/20 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-white/30">Export CSV</button>
            <button type="button" onClick={bulkDelete} disabled={bulkWorking}
              className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50">Delete</button>
            <button type="button" title="Clear selection" onClick={() => setSelected(new Set())}
              className="text-xs text-white/70 hover:text-white px-2 py-1.5"><X size={12} /></button>
          </div>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
          <p className="font-semibold text-gray-900">New Product</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Name *', key: 'name', placeholder: 'Product name' },
              { label: 'SKU', key: 'sku', placeholder: 'Auto-generated' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-gray-500 block mb-1">{f.label}</label>
                <input title={f.label} value={(createForm as any)[f.key]}
                  onChange={e => setCreateForm(cf => ({ ...cf, [f.key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder={f.placeholder} />
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-500 block mb-1">Category *</label>
              <select title="Category" value={createForm.categoryId} onChange={e => setCreateForm(f => ({ ...f, categoryId: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none">
                <option value="">Select…</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {[
              { label: 'Base Price (€) *', key: 'basePrice', type: 'number', step: '0.01', placeholder: '0.00' },
              { label: 'Wholesale Price (€)', key: 'wholesalePrice', type: 'number', step: '0.01', placeholder: 'Optional' },
              { label: 'MOQ', key: 'moq', type: 'number', placeholder: '1' },
              { label: 'Lead Time (days)', key: 'leadTimeDays', type: 'number', placeholder: '0' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-gray-500 block mb-1">{f.label}</label>
                <input type={f.type} step={f.step} title={f.label} value={(createForm as any)[f.key]}
                  onChange={e => setCreateForm(cf => ({ ...cf, [f.key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder={f.placeholder} />
              </div>
            ))}
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={createForm.isCustomizable}
                  onChange={e => setCreateForm(f => ({ ...f, isCustomizable: e.target.checked }))} />
                Customizable
              </label>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Description</label>
            <textarea title="Description" value={createForm.description}
              onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
              rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none resize-none" placeholder="Optional" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={createProduct}
              className="px-4 py-2 bg-[#1A3C5E] text-white text-sm font-semibold rounded-lg hover:bg-[#112E4D]">Create Product</button>
            <button type="button" onClick={() => setShowCreate(false)}
              className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
              <th className="px-4 py-3 w-8">
                <input type="checkbox" title="Select all"
                  checked={selected.size === filtered.length && filtered.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded" />
              </th>
              {['Product', 'SKU', 'Category', 'Base €', 'Wholesale €', 'Stock', 'Status', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <Skel rows={6} cols={9} /> : filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-5 py-10 text-center text-gray-400 text-sm">No products found</td></tr>
            ) : filtered.map(p => (
              editingId === p.id ? (
                <Fragment key={p.id}>
                <tr className="border-b border-gray-100 bg-yellow-50">
                  <td className="px-4 py-2" />
                  <td className="px-4 py-2">
                    <input title="Name" defaultValue={p.name} onChange={e => setEditForm((f: any) => ({ ...f, name: e.target.value }))}
                      className="border rounded px-2 py-1 text-sm w-40" />
                  </td>
                  <td className="px-4 py-2 text-xs font-mono text-gray-400">{p.sku}</td>
                  <td className="px-4 py-2">
                    <select title="Category" value={editForm.categoryId ?? p.categoryId ?? ''}
                      onChange={e => setEditForm((f: any) => ({ ...f, categoryId: e.target.value }))}
                      className="border rounded px-2 py-1 text-sm w-32 bg-white">
                      <option value="">— select —</option>
                      {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" step="0.01" title="Base price" defaultValue={p.basePrice}
                      onChange={e => setEditForm((f: any) => ({ ...f, basePrice: e.target.value }))}
                      className="border rounded px-2 py-1 text-sm w-20" />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" step="0.01" title="Wholesale price" defaultValue={p.wholesalePrice ?? ''}
                      onChange={e => setEditForm((f: any) => ({ ...f, wholesalePrice: e.target.value }))}
                      className="border rounded px-2 py-1 text-sm w-20" placeholder="—" />
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">{p.totalStock ?? '—'}</td>
                  <td /><td />
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button type="button" title="Save" onClick={() => saveEdit(p.id)} className="text-green-600 hover:text-green-800"><Check size={14} /></button>
                      <button type="button" title="Cancel" onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-gray-100 bg-yellow-50">
                  <td />
                  <td colSpan={8} className="px-4 pb-3">
                    <label className="text-xs text-gray-500 block mb-1">Description</label>
                    <textarea title="Description" defaultValue={p.description ?? ''}
                      onChange={e => setEditForm((f: any) => ({ ...f, description: e.target.value }))}
                      rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none resize-none" placeholder="Optional" />
                  </td>
                </tr>
                </Fragment>
              ) : (
                <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50 ${selected.has(p.id) ? 'bg-blue-50' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" title="Select" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button type="button" title="Manage images" onClick={() => openImgMgr(p)} className="flex-shrink-0 relative group">
                        {p.images?.[0]
                          ? <img src={p.images[0].url} alt={p.name} className="w-8 h-8 rounded object-cover bg-gray-100 group-hover:opacity-70 transition-opacity" />
                          : <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors"><Package size={12} className="text-gray-400" /></div>}
                        <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ImagePlus size={12} className="text-white drop-shadow" />
                        </span>
                      </button>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 max-w-[150px] truncate">{p.name}</p>
                        {p.isCustomizable && <p className="text-xs text-blue-500">customizable</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-400">{p.sku}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.category?.name}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">€{Number(p.basePrice).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.wholesalePrice ? `€${Number(p.wholesalePrice).toFixed(2)}` : '—'}</td>
                  <td className="px-4 py-3">
                    <button type="button" title="Edit stock" onClick={() => openStockModal(p)}
                      className="group flex items-center gap-1 hover:opacity-80">
                      {p.totalStock !== null && p.totalStock !== undefined ? (
                        <span className={`text-sm font-semibold underline decoration-dashed underline-offset-2 ${p.totalStock === 0 ? 'text-red-500' : p.totalStock < 10 ? 'text-amber-600' : 'text-gray-700'}`}>
                          {p.totalStock}
                        </span>
                      ) : <span className="text-gray-400 text-sm underline decoration-dashed underline-offset-2">—</span>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => toggleActive(p.id)} title={p.isActive ? 'Deactivate' : 'Activate'}>
                      {p.isActive ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} className="text-gray-300" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 items-center">
                      <button type="button"
                        title={p.tags?.includes('addon') ? 'Remove add-on tag' : 'Mark as add-on'}
                        onClick={() => toggleAddon(p)}
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full border transition-colors ${p.tags?.includes('addon') ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-amber-50 hover:text-amber-600'}`}>
                        +Add-on
                      </button>
                      <button type="button" title="Manage images" onClick={() => openImgMgr(p)}
                        className="text-gray-400 hover:text-blue-500">
                        <ImagePlus size={14} />
                      </button>
                      <button type="button" title="Edit product" onClick={() => { setEditingId(p.id); setEditForm({ description: p.description ?? '', categoryId: p.categoryId ?? '' }); }}
                        className="text-gray-400 hover:text-[#1A3C5E]"><Pencil size={14} /></button>
                      <button type="button" title="Delete product" onClick={() => deleteProduct(p.id)}
                        className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Categories ────────────────────────────────────────────────────────────────

function CategoriesTab() {
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [createForm, setCreateForm] = useState({ name: '', slug: '', parentId: '', sortOrder: '0', isCustomizable: false });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/products/admin/categories`, { headers: hdrs() });
      setCats(res.data || []);
    } catch { setCats([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createCat() {
    if (!createForm.name) return;
    const res = await axios.post(`${API}/products/admin/categories`, createForm, { headers: hdrs() });
    setCats(prev => [...prev, { ...res.data, _count: { products: 0 } }]);
    setShowCreate(false);
    setCreateForm({ name: '', slug: '', parentId: '', sortOrder: '0', isCustomizable: false });
  }

  async function saveEdit(id: string) {
    const res = await axios.patch(`${API}/products/admin/categories/${id}`, editForm, { headers: hdrs() });
    setCats(prev => prev.map(c => c.id === id ? { ...c, ...res.data } : c));
    setEditingId(null);
  }

  async function toggleCat(id: string, current: boolean) {
    await axios.patch(`${API}/products/admin/categories/${id}`, { isActive: !current }, { headers: hdrs() });
    setCats(prev => prev.map(c => c.id === id ? { ...c, isActive: !current } : c));
  }

  const roots = cats.filter(c => !c.parentId);
  const children = (pid: string) => cats.filter(c => c.parentId === pid);

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button type="button" onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A3C5E] text-white text-sm font-semibold rounded-lg hover:bg-[#112E4D]">
          <Plus size={14} /> New Category
        </button>
      </div>

      {showCreate && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
          <p className="font-semibold text-gray-900">New Category</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Name *</label>
              <input title="Name" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Category name" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Slug (auto-generated)</label>
              <input title="Slug" value={createForm.slug} onChange={e => setCreateForm(f => ({ ...f, slug: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="auto" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Parent Category</label>
              <select title="Parent" value={createForm.parentId} onChange={e => setCreateForm(f => ({ ...f, parentId: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none">
                <option value="">None (top-level)</option>
                {roots.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Sort Order</label>
              <input type="number" title="Sort order" value={createForm.sortOrder}
                onChange={e => setCreateForm(f => ({ ...f, sortOrder: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={createForm.isCustomizable}
                  onChange={e => setCreateForm(f => ({ ...f, isCustomizable: e.target.checked }))} />
                Has Configurator
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={createCat}
              className="px-4 py-2 bg-[#1A3C5E] text-white text-sm font-semibold rounded-lg hover:bg-[#112E4D]">Create</button>
            <button type="button" onClick={() => setShowCreate(false)}
              className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
              {['Name', 'Slug', 'Parent', 'Products', 'Configurator', 'Sort', 'Active', ''].map(h => (
                <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <Skel rows={4} cols={8} /> : cats.length === 0 ? (
              <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-400 text-sm">No categories yet</td></tr>
            ) : roots.map(cat => (
              <>
                <CatRow key={cat.id} cat={cat} indent={0} allCats={cats}
                  editing={editingId === cat.id} editForm={editForm} setEditForm={setEditForm}
                  onEdit={() => { setEditingId(cat.id); setEditForm({ name: cat.name, slug: cat.slug, sortOrder: cat.sortOrder, parentId: cat.parentId ?? '' }); }}
                  onSave={() => saveEdit(cat.id)} onCancel={() => setEditingId(null)}
                  onToggle={() => toggleCat(cat.id, cat.isActive)} />
                {children(cat.id).map(child => (
                  <CatRow key={child.id} cat={child} indent={1} allCats={cats}
                    editing={editingId === child.id} editForm={editForm} setEditForm={setEditForm}
                    onEdit={() => { setEditingId(child.id); setEditForm({ name: child.name, slug: child.slug, sortOrder: child.sortOrder, parentId: child.parentId ?? '' }); }}
                    onSave={() => saveEdit(child.id)} onCancel={() => setEditingId(null)}
                    onToggle={() => toggleCat(child.id, child.isActive)} />
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CatRow({ cat, indent, editing, editForm, setEditForm, onEdit, onSave, onCancel, onToggle, allCats }: any) {
  const indentClass = indent > 0 ? 'pl-9 py-2' : 'px-5 py-2';
  const indentViewClass = indent > 0 ? 'pl-9 py-3' : 'px-5 py-3';
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50">
      {editing ? (
        <>
          <td className={indentClass}>
            <input title="Name" value={editForm.name ?? cat.name}
              onChange={(e: any) => setEditForm((f: any) => ({ ...f, name: e.target.value }))}
              className="border rounded px-2 py-1 text-sm w-36" />
          </td>
          <td className="px-5 py-2">
            <input title="Slug" value={editForm.slug ?? cat.slug}
              onChange={(e: any) => setEditForm((f: any) => ({ ...f, slug: e.target.value }))}
              className="border rounded px-2 py-1 text-sm w-32 font-mono" />
          </td>
          <td className="px-5 py-2">
            <select title="Parent category" value={editForm.parentId ?? cat.parentId ?? ''}
              onChange={(e: any) => setEditForm((f: any) => ({ ...f, parentId: e.target.value || null }))}
              className="border rounded px-2 py-1 text-sm w-32 bg-white">
              <option value="">None (top-level)</option>
              {(allCats || []).filter((c: any) => c.id !== cat.id).map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </td>
          <td className="px-5 py-2 text-sm text-gray-500">{cat._count?.products || 0}</td>
          <td className="px-5 py-2">{cat.isCustomizable ? <Bdg label="yes" color="bg-blue-100 text-blue-700" /> : null}</td>
          <td className="px-5 py-2">
            <input type="number" title="Sort order" value={editForm.sortOrder ?? cat.sortOrder}
              onChange={(e: any) => setEditForm((f: any) => ({ ...f, sortOrder: Number(e.target.value) }))}
              className="border rounded px-2 py-1 text-sm w-14" />
          </td>
          <td className="px-5 py-2" />
          <td className="px-5 py-2">
            <div className="flex gap-2">
              <button type="button" title="Save" onClick={onSave} className="text-green-600 hover:text-green-800"><Check size={14} /></button>
              <button type="button" title="Cancel" onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
            </div>
          </td>
        </>
      ) : (
        <>
          <td className={`${indentViewClass} text-sm font-semibold text-gray-900`}>
            {indent > 0 && <span className="text-gray-300 mr-1">└</span>}{cat.name}
          </td>
          <td className="px-5 py-3 text-xs font-mono text-gray-400">{cat.slug}</td>
          <td className="px-5 py-3 text-sm text-gray-400">{cat.parent?.name || '—'}</td>
          <td className="px-5 py-3 text-sm text-gray-500">{cat._count?.products || 0}</td>
          <td className="px-5 py-3">
            {cat.isCustomizable ? <Bdg label="yes" color="bg-blue-100 text-blue-700" /> : <Bdg label="no" color="bg-gray-100 text-gray-400" />}
          </td>
          <td className="px-5 py-3 text-sm text-gray-500">{cat.sortOrder}</td>
          <td className="px-5 py-3">
            <button type="button" onClick={onToggle} title={cat.isActive ? 'Deactivate' : 'Activate'}>
              {cat.isActive ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} className="text-gray-300" />}
            </button>
          </td>
          <td className="px-5 py-3">
            <button type="button" title="Edit category" onClick={onEdit} className="text-gray-400 hover:text-[#1A3C5E]"><Pencil size={14} /></button>
          </td>
        </>
      )}
    </tr>
  );
}

// ── Variants ──────────────────────────────────────────────────────────────────

function VariantsTab() {
  const [products, setProducts] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [createForm, setCreateForm] = useState({ sku: '', size: '', color: '', material: '', priceModifier: '0', stockQty: '0' });

  // Variant image upload
  const varImgInputRef = useRef<HTMLInputElement>(null);
  const varImgTargetRef = useRef<{ productId: string; variantId: string } | null>(null);
  const [varImgUploading, setVarImgUploading] = useState<string | null>(null);

  // Gallery picker
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [galleryPickerVariant, setGalleryPickerVariant] = useState<string | null>(null);

  function triggerVariantImgUpload(productId: string, variantId: string) {
    varImgTargetRef.current = { productId, variantId };
    varImgInputRef.current?.click();
  }

  async function handleVariantImgFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const target = varImgTargetRef.current;
    if (!file || !target) return;
    e.target.value = '';
    setVarImgUploading(target.variantId);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axios.post(`${API}/products/${target.productId}/variants/${target.variantId}/image`, fd, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setVariants(prev => prev.map(v => v.id === target.variantId ? { ...v, variantImage: res.data } : v));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Upload failed');
    } finally { setVarImgUploading(null); }
  }

  async function deleteVariantImg(productId: string, variantId: string) {
    await axios.delete(`${API}/products/${productId}/variants/${variantId}/image`, { headers: hdrs() });
    setVariants(prev => prev.map(v => v.id === variantId ? { ...v, variantImage: null } : v));
  }

  useEffect(() => {
    axios.get(`${API}/products/admin/all?limit=200`, { headers: hdrs() })
      .then(r => setProducts(r.data.data || [])).catch(() => {});
  }, []);

  async function loadVariants(productId: string) {
    setLoading(true);
    setSelectedProduct(productId);
    setShowCreate(false);
    setEditingId(null);
    setGalleryImages([]);
    try {
      const url = productId ? `${API}/products/admin/variants?productId=${productId}` : `${API}/products/admin/variants`;
      const [vRes, imgRes] = await Promise.all([
        axios.get(url, { headers: hdrs() }),
        productId ? axios.get(`${API}/products/${productId}/images`, { headers: hdrs() }).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      ]);
      setVariants(vRes.data || []);
      setGalleryImages((imgRes.data || []).filter((i: any) => !i.layerType || i.layerType === '' || i.layerType === 'photo' || i.layerType === '2d' || i.layerType === '3d' || i.layerType === 'lifestyle' || i.layerType === 'detail'));
    } catch { setVariants([]); }
    finally { setLoading(false); }
  }

  async function assignGalleryImage(variantId: string, url: string) {
    await axios.post(`${API}/products/${selectedProduct}/variants/${variantId}/image-url`, { url }, { headers: hdrs() });
    setVariants(prev => prev.map(v => v.id === variantId ? { ...v, variantImage: { url } } : v));
    setGalleryPickerVariant(null);
  }

  async function createVariant() {
    if (!selectedProduct) return;
    const res = await axios.post(`${API}/products/admin/variants`, { ...createForm, productId: selectedProduct }, { headers: hdrs() });
    setVariants(prev => [...prev, res.data]);
    setShowCreate(false);
    setCreateForm({ sku: '', size: '', color: '', material: '', priceModifier: '0', stockQty: '0' });
  }

  async function saveEdit(id: string) {
    const res = await axios.patch(`${API}/products/admin/variants/${id}`, editForm, { headers: hdrs() });
    setVariants(prev => prev.map(v => v.id === id ? { ...v, ...res.data } : v));
    setEditingId(null);
  }

  async function deleteVariant(id: string) {
    if (!confirm('Delete this variant?')) return;
    await axios.delete(`${API}/products/admin/variants/${id}`, { headers: hdrs() });
    setVariants(prev => prev.filter(v => v.id !== id));
  }

  async function toggleVariant(id: string, current: boolean) {
    await axios.patch(`${API}/products/admin/variants/${id}`, { isActive: !current }, { headers: hdrs() });
    setVariants(prev => prev.map(v => v.id === id ? { ...v, isActive: !current } : v));
  }

  const varFields = [
    { label: 'SKU', key: 'sku', placeholder: 'Auto-generated' },
    { label: 'Size', key: 'size', placeholder: 'e.g. A4' },
    { label: 'Color', key: 'color', placeholder: 'e.g. White' },
    { label: 'Material', key: 'material', placeholder: 'e.g. Matte' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center">
        <select title="Select product" value={selectedProduct} onChange={e => loadVariants(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none w-72">
          <option value="">— Select a product —</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
        </select>
        {selectedProduct && (
          <button type="button" onClick={() => setShowCreate(s => !s)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A3C5E] text-white text-sm font-semibold rounded-lg hover:bg-[#112E4D]">
            <Plus size={14} /> Add Variant
          </button>
        )}
      </div>

      {showCreate && selectedProduct && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
          <p className="font-semibold text-gray-900">New Variant</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {varFields.map(f => (
              <div key={f.key}>
                <label className="text-xs text-gray-500 block mb-1">{f.label}</label>
                <input title={f.label} value={(createForm as any)[f.key]}
                  onChange={e => setCreateForm(cf => ({ ...cf, [f.key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder={f.placeholder} />
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-500 block mb-1">Price Modifier (€)</label>
              <input type="number" step="0.01" title="Price modifier" value={createForm.priceModifier}
                onChange={e => setCreateForm(f => ({ ...f, priceModifier: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Stock Qty</label>
              <input type="number" title="Stock quantity" value={createForm.stockQty}
                onChange={e => setCreateForm(f => ({ ...f, stockQty: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={createVariant}
              className="px-4 py-2 bg-[#1A3C5E] text-white text-sm font-semibold rounded-lg hover:bg-[#112E4D]">Add Variant</button>
            <button type="button" onClick={() => setShowCreate(false)}
              className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      <input ref={varImgInputRef} type="file" accept="image/*" title="Upload variant swatch" className="hidden" onChange={handleVariantImgFile} />

      {/* Gallery Picker Modal */}
      {galleryPickerVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setGalleryPickerVariant(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Select from Gallery</h2>
              <button type="button" title="Close" onClick={() => setGalleryPickerVariant(null)} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
            </div>
            {galleryImages.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No gallery images — upload images in the Products tab first.</p>
            ) : (
              <div className="grid grid-cols-4 gap-3 max-h-72 overflow-y-auto">
                {galleryImages.map(img => (
                  <button key={img.id} type="button" onClick={() => assignGalleryImage(galleryPickerVariant, img.url)}
                    className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-[#1A3C5E] transition-all">
                    <img src={img.url} alt={img.altText || ''} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedProduct ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                {['Swatch', 'SKU', 'Size', 'Color', 'Material', 'Price Mod', 'Stock', 'Active', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <Skel rows={3} cols={9} /> : variants.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-gray-400 text-sm">No variants — add one above</td></tr>
              ) : variants.map(v => (
                editingId === v.id ? (
                  <tr key={v.id} className="border-b border-gray-100 bg-yellow-50">
                    <td className="px-4 py-2" />
                    <td className="px-4 py-2"><input title="SKU" defaultValue={v.sku} onChange={(e: any) => setEditForm((f: any) => ({ ...f, sku: e.target.value }))} className="border rounded px-2 py-1 text-sm w-32 font-mono" /></td>
                    <td className="px-4 py-2"><input title="Size" defaultValue={v.size ?? ''} onChange={(e: any) => setEditForm((f: any) => ({ ...f, size: e.target.value }))} className="border rounded px-2 py-1 text-sm w-20" placeholder="—" /></td>
                    <td className="px-4 py-2"><input title="Color" defaultValue={v.color ?? ''} onChange={(e: any) => setEditForm((f: any) => ({ ...f, color: e.target.value }))} className="border rounded px-2 py-1 text-sm w-20" placeholder="—" /></td>
                    <td className="px-4 py-2"><input title="Material" defaultValue={v.material ?? ''} onChange={(e: any) => setEditForm((f: any) => ({ ...f, material: e.target.value }))} className="border rounded px-2 py-1 text-sm w-24" placeholder="—" /></td>
                    <td className="px-4 py-2"><input type="number" step="0.01" title="Price modifier" defaultValue={v.priceModifier} onChange={(e: any) => setEditForm((f: any) => ({ ...f, priceModifier: e.target.value }))} className="border rounded px-2 py-1 text-sm w-20" /></td>
                    <td className="px-4 py-2"><input type="number" title="Stock" defaultValue={v.stockQty} onChange={(e: any) => setEditForm((f: any) => ({ ...f, stockQty: e.target.value }))} className="border rounded px-2 py-1 text-sm w-20" /></td>
                    <td className="px-4 py-2" />
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button type="button" title="Save" onClick={() => saveEdit(v.id)} className="text-green-600 hover:text-green-800"><Check size={14} /></button>
                        <button type="button" title="Cancel" onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50">
                    {/* Swatch image */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {varImgUploading === v.id ? (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center animate-pulse text-xs text-gray-400">…</div>
                        ) : v.variantImage ? (
                          <div className="relative group">
                            <img src={v.variantImage.url} alt="swatch" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                            <div className="absolute inset-0 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                              <button type="button" title="Upload new image" onClick={() => triggerVariantImgUpload(selectedProduct, v.id)} className="text-white hover:text-blue-300"><ImagePlus size={12} /></button>
                              <button type="button" title="Select from gallery" onClick={() => setGalleryPickerVariant(v.id)} className="text-white hover:text-yellow-300"><Layers size={12} /></button>
                              <button type="button" title="Remove image" onClick={() => deleteVariantImg(selectedProduct, v.id)} className="text-white hover:text-red-400"><Trash2 size={12} /></button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <button type="button" title="Upload swatch" onClick={() => triggerVariantImgUpload(selectedProduct, v.id)}
                              className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-200 hover:border-[#1A3C5E] flex items-center justify-center text-gray-300 hover:text-[#1A3C5E] transition-colors">
                              <ImagePlus size={14} />
                            </button>
                            {galleryImages.length > 0 && (
                              <button type="button" title="Select from gallery" onClick={() => setGalleryPickerVariant(v.id)}
                                className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-200 hover:border-[#C9A84C] flex items-center justify-center text-gray-300 hover:text-[#C9A84C] transition-colors">
                                <Layers size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{v.sku}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{v.size || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{v.color || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{v.material || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {Number(v.priceModifier) > 0 ? `+€${Number(v.priceModifier).toFixed(2)}`
                        : Number(v.priceModifier) < 0 ? `-€${Math.abs(Number(v.priceModifier)).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-semibold ${v.stockQty === 0 ? 'text-red-500' : v.stockQty < 10 ? 'text-amber-600' : 'text-gray-900'}`}>
                        {v.stockQty}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => toggleVariant(v.id, v.isActive)} title={v.isActive ? 'Deactivate' : 'Activate'}>
                        {v.isActive ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} className="text-gray-300" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button type="button" title="Edit variant" onClick={() => { setEditingId(v.id); setEditForm({}); }} className="text-gray-400 hover:text-[#1A3C5E]"><Pencil size={14} /></button>
                        <button type="button" title="Delete variant" onClick={() => deleteVariant(v.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400 text-sm">
          Select a product above to manage its variants
        </div>
      )}
    </div>
  );
}

// ── Configurator Schemas ──────────────────────────────────────────────────────

function SchemasTab() {
  const [schemas, setSchemas] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [showCreate, setShowCreate] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [newSteps, setNewSteps] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [jsonErr, setJsonErr] = useState('');
  const [createForm, setCreateForm] = useState({
    categoryId: '', basePrice: '0', moq: '1', leadTimeStandardDays: '21',
    leadTimeExpressDays: '10', expressPriceMultiplier: '1.25', steps: '[]', notes: '',
  });
  const [createJsonErr, setCreateJsonErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        axios.get(`${API}/configurator/admin/schemas`, { headers: hdrs() }),
        axios.get(`${API}/products/admin/categories`, { headers: hdrs() }),
      ]);
      setSchemas(sRes.data || []);
      setCategories(cRes.data || []);
    } catch { setSchemas([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createSchema() {
    try { JSON.parse(createForm.steps); } catch { setCreateJsonErr('Invalid JSON'); return; }
    setCreateJsonErr('');
    try {
      const res = await axios.post(`${API}/configurator/admin/schemas`,
        { ...createForm, steps: JSON.parse(createForm.steps) }, { headers: hdrs() });
      setSchemas(prev => [res.data, ...prev]);
      setShowCreate(false);
      setCreateForm({ categoryId: '', basePrice: '0', moq: '1', leadTimeStandardDays: '21', leadTimeExpressDays: '10', expressPriceMultiplier: '1.25', steps: '[]', notes: '' });
    } catch { /* ignore */ }
  }

  async function saveEdit(id: string) {
    await axios.patch(`${API}/configurator/admin/schemas/${id}`, editForm, { headers: hdrs() });
    setSchemas(prev => prev.map(s => s.id === id ? { ...s, ...editForm } : s));
    setEditingId(null);
  }

  async function publishVersion(schemaId: string) {
    try { JSON.parse(newSteps); } catch { setJsonErr('Invalid JSON'); return; }
    setJsonErr('');
    try {
      const res = await axios.post(`${API}/configurator/admin/schemas/${schemaId}/versions`,
        { steps: JSON.parse(newSteps), notes: newNotes }, { headers: hdrs() });
      setSchemas(prev => prev.map(s => s.id === schemaId
        ? { ...s, latestVersion: res.data, versionCount: (s.versionCount || 0) + 1 } : s));
      setPublishingId(null);
      setNewSteps('');
      setNewNotes('');
    } catch { /* ignore */ }
  }

  const numFields = [
    { label: 'Base Price (€)', key: 'basePrice', step: '0.01' },
    { label: 'MOQ', key: 'moq' },
    { label: 'Standard Lead (days)', key: 'leadTimeStandardDays' },
    { label: 'Express Lead (days)', key: 'leadTimeExpressDays' },
    { label: 'Express Multiplier', key: 'expressPriceMultiplier', step: '0.01' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button type="button" onClick={() => setShowCreate(s => !s)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A3C5E] text-white text-sm font-semibold rounded-lg hover:bg-[#112E4D]">
          <Plus size={14} /> New Schema
        </button>
      </div>

      {showCreate && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
          <p className="font-semibold text-gray-900">New Configurator Schema</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Category (customizable) *</label>
              <select title="Category" value={createForm.categoryId}
                onChange={e => setCreateForm(f => ({ ...f, categoryId: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none">
                <option value="">Select…</option>
                {categories.filter(c => c.isCustomizable).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {numFields.map(f => (
              <div key={f.key}>
                <label className="text-xs text-gray-500 block mb-1">{f.label}</label>
                <input type="number" step={f.step} title={f.label} value={(createForm as any)[f.key]}
                  onChange={e => setCreateForm(cf => ({ ...cf, [f.key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Initial Steps (JSON array)</label>
            <textarea title="Steps JSON" value={createForm.steps}
              onChange={e => { setCreateForm(f => ({ ...f, steps: e.target.value })); setCreateJsonErr(''); }}
              rows={8} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono outline-none resize-y" />
            {createJsonErr && <p className="text-xs text-red-500 mt-1">{createJsonErr}</p>}
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Notes</label>
            <input title="Notes" value={createForm.notes} onChange={e => setCreateForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Initial version notes…" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={createSchema}
              className="px-4 py-2 bg-[#1A3C5E] text-white text-sm font-semibold rounded-lg hover:bg-[#112E4D]">Create Schema</button>
            <button type="button" onClick={() => setShowCreate(false)}
              className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : schemas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400 text-sm">
            No configurator schemas yet
          </div>
        ) : schemas.map(s => (
          <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-100">
            {/* Header row */}
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="font-semibold text-gray-900">{s.category?.name || '—'}</p>
                  {s.isActive ? <Bdg label="active" color="bg-green-100 text-green-700" /> : <Bdg label="inactive" color="bg-gray-100 text-gray-400" />}
                  <Bdg label={`v${s.latestVersion?.versionNumber ?? 0}`} color="bg-blue-100 text-blue-700" />
                  <span className="text-xs text-gray-400">{s.versionCount || 0} version{s.versionCount !== 1 ? 's' : ''}</span>
                </div>

                {editingId === s.id ? (
                  <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mt-3">
                    {numFields.map(f => (
                      <div key={f.key}>
                        <label className="text-xs text-gray-400 block mb-0.5">{f.label.split('(')[0].trim()}</label>
                        <input type="number" step={f.step} title={f.label}
                          defaultValue={(s as any)[f.key]}
                          onChange={e => setEditForm((ef: any) => ({ ...ef, [f.key]: e.target.value }))}
                          className="border rounded px-2 py-1 text-sm w-full" />
                      </div>
                    ))}
                    <div className="flex items-end">
                      <label className="flex items-center gap-1 text-xs cursor-pointer">
                        <input type="checkbox" defaultChecked={s.isActive}
                          onChange={e => setEditForm((ef: any) => ({ ...ef, isActive: e.target.checked }))} />
                        Active
                      </label>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">
                    Base: <b>€{Number(s.basePrice).toFixed(2)}</b> · MOQ: <b>{s.moq}</b> · Lead: <b>{s.leadTimeStandardDays}d</b> / <b>{s.leadTimeExpressDays}d</b> exp · ×<b>{Number(s.expressPriceMultiplier).toFixed(2)}</b>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {editingId === s.id ? (
                  <>
                    <button type="button" title="Save" onClick={() => saveEdit(s.id)} className="text-green-600 hover:text-green-800"><Check size={16} /></button>
                    <button type="button" title="Cancel" onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                  </>
                ) : (
                  <>
                    <button type="button"
                      onClick={() => { setEditingId(s.id); setEditForm({}); }}
                      className="text-xs text-gray-500 hover:text-[#1A3C5E] flex items-center gap-1 border border-gray-200 rounded px-2 py-1.5">
                      <Pencil size={12} /> Edit
                    </button>
                    <Link href={`/products/schemas/${s.id}`}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 border border-blue-200 rounded px-2 py-1.5">
                      <ExternalLink size={12} /> Edit Schema
                    </Link>
                    <button type="button" onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                      className="text-gray-400 hover:text-gray-600 border border-gray-200 rounded px-2 py-1.5">
                      {expandedId === s.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Publish version form */}
            {publishingId === s.id && (
              <div className="border-t border-gray-100 px-5 py-4 bg-blue-50 space-y-3">
                <p className="text-sm font-semibold text-gray-900">Publish New Version</p>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Steps JSON</label>
                  <textarea title="Steps JSON" value={newSteps}
                    onChange={e => { setNewSteps(e.target.value); setJsonErr(''); }}
                    rows={10} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono outline-none resize-y" />
                  {jsonErr && <p className="text-xs text-red-500 mt-1">{jsonErr}</p>}
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Release Notes</label>
                  <input title="Notes" value={newNotes} onChange={e => setNewNotes(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="What changed…" />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => publishVersion(s.id)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">Publish</button>
                  <button type="button" onClick={() => setPublishingId(null)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg">Cancel</button>
                </div>
              </div>
            )}

            {/* Steps viewer */}
            {expandedId === s.id && (
              <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wide">
                  Steps — v{s.latestVersion?.versionNumber ?? '?'}
                  {s.latestVersion?.notes && <span className="ml-2 font-normal text-gray-400 normal-case">({s.latestVersion.notes})</span>}
                </p>
                <pre className="text-xs bg-white border border-gray-100 rounded-lg p-4 overflow-auto max-h-72 text-gray-700 leading-relaxed">
                  {s.latestVersion?.steps ? JSON.stringify(s.latestVersion.steps, null, 2) : 'No versions yet'}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'products',   label: 'All Products',        icon: Package },
  { id: 'categories', label: 'Categories',           icon: Tag },
  { id: 'variants',   label: 'Variants',             icon: Layers },
  { id: 'schemas',    label: 'Configurator Schemas', icon: Cpu },
];

export default function ProductsPage() {
  const [tab, setTab] = useState<Tab>('products');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your catalog, categories, variants, and configurator schemas</p>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map(t => {
          const TIcon = t.icon;
          return (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${tab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              <TIcon size={14} />{t.label}
            </button>
          );
        })}
      </div>

      {tab === 'products'   && <ProductsTab />}
      {tab === 'categories' && <CategoriesTab />}
      {tab === 'variants'   && <VariantsTab />}
      {tab === 'schemas'    && <SchemasTab />}
    </div>
  );
}
