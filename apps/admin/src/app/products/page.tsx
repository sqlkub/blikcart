'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    try {
      const res = await axios.get(`${API}/products?limit=200`);
      setProducts(res.data.data || []);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }

  async function saveProduct() {
    if (!editing) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`${API}/products/${editing.id}`, {
        name: editing.name,
        description: editing.description,
        basePrice: Number(editing.basePrice),
        moq: Number(editing.moq),
        isActive: editing.isActive,
        isCustomizable: editing.isCustomizable,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMsg('Saved successfully!');
      setEditing(null);
      loadProducts();
    } catch (e: any) {
      setMsg('Save failed: ' + (e.response?.data?.message || e.message));
    } finally { setSaving(false); setTimeout(() => setMsg(''), 3000); }
  }

  async function uploadImage(productId: string, file: File) {
    setUploadingId(productId);
    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('isPrimary', 'true');
      await axios.post(`${API}/products/${productId}/images`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setMsg('Image uploaded!');
      loadProducts();
    } catch (e: any) {
      // Try S3 pre-signed or direct upload fallback
      setMsg('Image upload: ' + (e.response?.data?.message || 'Check S3 config'));
    } finally { setUploadingId(null); setTimeout(() => setMsg(''), 3000); }
  }

  const filtered = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} total products</p>
        </div>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${msg.includes('failed') || msg.includes('Check') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {msg}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-bold text-gray-900 text-lg">Edit Product</h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Product Name</label>
                <input value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1A3C5E]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description</label>
                <textarea value={editing.description || ''} onChange={e => setEditing({...editing, description: e.target.value})}
                  rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1A3C5E] resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Base Price (€)</label>
                  <input type="number" value={editing.basePrice} onChange={e => setEditing({...editing, basePrice: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1A3C5E]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">MOQ</label>
                  <input type="number" value={editing.moq} onChange={e => setEditing({...editing, moq: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1A3C5E]" />
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={editing.isActive} onChange={e => setEditing({...editing, isActive: e.target.checked})}
                    className="w-4 h-4 accent-[#1A3C5E]" />
                  <span className="font-medium">Active</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={editing.isCustomizable} onChange={e => setEditing({...editing, isCustomizable: e.target.checked})}
                    className="w-4 h-4 accent-[#C8860A]" />
                  <span className="font-medium">Customizable</span>
                </label>
              </div>

              {/* Image upload inside modal */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Product Image</label>
                {editing.images?.[0] && (
                  <img src={editing.images[0].url} alt={editing.name}
                    className="w-24 h-24 object-cover rounded-lg border border-gray-200 mb-2" />
                )}
                <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-[#1A3C5E] transition-colors w-fit">
                  <span className="text-sm text-gray-500">
                    {uploadingId === editing.id ? 'Uploading...' : '📎 Upload Image'}
                  </span>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) uploadImage(editing.id, e.target.files[0]); }} />
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={saveProduct} disabled={saving}
                className="px-6 py-2 text-sm font-semibold bg-[#1A3C5E] text-white rounded-lg hover:bg-[#112E4D] disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full max-w-sm px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                {['Image','SKU','Name','Category','Price','MOQ','Status','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(8)].map((_, j) => <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              )) : filtered.map(p => {
                const img = p.images?.find((i: any) => i.isPrimary) || p.images?.[0];
                return (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="relative group">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center text-2xl">
                          {img ? <img src={img.url} alt={p.name} className="w-full h-full object-cover" /> : '📦'}
                        </div>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                          <span className="text-white text-xs font-bold">
                            {uploadingId === p.id ? '...' : '📷'}
                          </span>
                          <input type="file" accept="image/*" className="hidden"
                            onChange={e => { if (e.target.files?.[0]) uploadImage(p.id, e.target.files[0]); }} />
                        </label>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{p.sku}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 max-w-[160px] truncate">{p.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.category?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm font-semibold">€{Number(p.basePrice).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.moq}</td>
                    <td className="px-4 py-3">
                      {p.isActive
                        ? <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-semibold">Active</span>
                        : <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-semibold">Inactive</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setEditing({...p})}
                        className="text-xs bg-[#1A3C5E] text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-[#112E4D]">
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
