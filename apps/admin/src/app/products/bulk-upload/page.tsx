'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Upload, Download, CheckCircle, XCircle, Loader2, Plus, Trash2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
function token() { return typeof window !== 'undefined' ? localStorage.getItem('adminToken') || '' : ''; }
function hdrs() { return { Authorization: `Bearer ${token()}` }; }

// ─── Types ────────────────────────────────────────────────────────────────────

type UploadTab = 'products' | 'customization';
type RowStatus = 'pending' | 'uploading' | 'success' | 'error';

interface ProductRow {
  _id: string;
  name: string;
  sku: string;
  categoryId: string;
  basePrice: string;
  wholesalePrice: string;
  moq: string;
  leadTimeDays: string;
  isCustomizable: string;
  description: string;
  tags: string;
  status: RowStatus;
  error: string;
}

interface StepOption {
  label: string;
  value: string;
  priceModifier: string;
  colour: string;
  icon: string;
}

interface CustomizationRow {
  _id: string;
  productId: string;
  productName: string;
  stepId: string;
  stepLabel: string;
  stepType: string;
  stepRequired: string;
  options: StepOption[];
  status: RowStatus;
  error: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return `r_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`; }

function parseCSV(text: string): string[][] {
  return text.trim().split('\n').map(line => {
    const cols: string[] = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQ = !inQ; continue; }
      if (c === ',' && !inQ) { cols.push(cur.trim()); cur = ''; continue; }
      cur += c;
    }
    cols.push(cur.trim());
    return cols;
  });
}

function downloadBlob(content: string, filename: string, mime = 'text/csv') {
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([content], { type: mime })),
    download: filename,
  });
  a.click();
}

const inp = 'w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#1A3C5E] bg-white';
const sel = `${inp} cursor-pointer`;

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BulkUploadPage() {
  const [tab, setTab] = useState<UploadTab>('products');
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    axios.get(`${API}/products/admin/categories`, { headers: hdrs() })
      .then(r => setCategories(r.data?.categories || r.data || []))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bulk Upload</h1>
        <p className="text-sm text-gray-500 mt-1">Upload products or customization steps via CSV template.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['products', 'customization'] as UploadTab[]).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-white shadow text-[#1A3C5E]' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'products' ? 'Products' : 'Customization Steps'}
          </button>
        ))}
      </div>

      {tab === 'products'
        ? <ProductBulkUpload categories={categories} />
        : <CustomizationBulkUpload />}
    </div>
  );
}

// ─── Product Bulk Upload ──────────────────────────────────────────────────────

function ProductBulkUpload({ categories }: { categories: any[] }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  function emptyRow(): ProductRow {
    return { _id: uid(), name: '', sku: '', categoryId: '', basePrice: '', wholesalePrice: '', moq: '1', leadTimeDays: '0', isCustomizable: 'false', description: '', tags: '', status: 'pending', error: '' };
  }

  function downloadTemplate() {
    const headers = 'name,sku,category_name,base_price,wholesale_price,moq,lead_time_days,is_customizable,description,tags';
    const example = '"Leather Bridle","LB-001","Bridles","29.99","24.99","10","14","false","Premium leather bridle","leather,bridle"';
    downloadBlob(`${headers}\n${example}`, 'products_template.csv');
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      const header = rows[0].map(h => h.toLowerCase().trim());
      const idx = (name: string) => header.indexOf(name);
      const parsed: ProductRow[] = rows.slice(1).filter(r => r.some(c => c)).map(r => {
        const catName = r[idx('category_name')] || '';
        const cat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
        return {
          _id: uid(),
          name: r[idx('name')] || '',
          sku: r[idx('sku')] || '',
          categoryId: cat?.id || '',
          basePrice: r[idx('base_price')] || '',
          wholesalePrice: r[idx('wholesale_price')] || '',
          moq: r[idx('moq')] || '1',
          leadTimeDays: r[idx('lead_time_days')] || '0',
          isCustomizable: r[idx('is_customizable')] || 'false',
          description: r[idx('description')] || '',
          tags: r[idx('tags')] || '',
          status: 'pending',
          error: '',
        };
      });
      setRows(parsed);
      setDone(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function updateRow(id: string, patch: Partial<ProductRow>) {
    setRows(rs => rs.map(r => r._id === id ? { ...r, ...patch } : r));
  }

  async function uploadAll() {
    setUploading(true);
    setDone(false);
    for (const row of rows) {
      if (row.status === 'success') continue;
      if (!row.name || !row.categoryId || !row.basePrice) {
        setRows(rs => rs.map(r => r._id === row._id ? { ...r, status: 'error', error: 'Name, category and base price are required' } : r));
        continue;
      }
      setRows(rs => rs.map(r => r._id === row._id ? { ...r, status: 'uploading', error: '' } : r));
      try {
        await axios.post(`${API}/products/admin`, {
          name: row.name,
          sku: row.sku || undefined,
          categoryId: row.categoryId,
          basePrice: row.basePrice,
          wholesalePrice: row.wholesalePrice || undefined,
          moq: row.moq,
          leadTimeDays: row.leadTimeDays,
          isCustomizable: row.isCustomizable === 'true',
          description: row.description || undefined,
          tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        }, { headers: hdrs() });
        setRows(rs => rs.map(r => r._id === row._id ? { ...r, status: 'success', error: '' } : r));
      } catch (err: any) {
        const msg = err?.response?.data?.message || err.message || 'Upload failed';
        setRows(rs => rs.map(r => r._id === row._id ? { ...r, status: 'error', error: String(msg) } : r));
      }
    }
    setUploading(false);
    setDone(true);
  }

  const pending = rows.filter(r => r.status === 'pending' || r.status === 'error').length;
  const succeeded = rows.filter(r => r.status === 'success').length;
  const failed = rows.filter(r => r.status === 'error').length;

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button type="button" onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
          <Download size={14} /> Download Template
        </button>
        <button type="button" onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 border border-[#1A3C5E] rounded-lg text-sm font-medium text-[#1A3C5E] hover:bg-blue-50">
          <Upload size={14} /> Import CSV
        </button>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={onFileChange} />
        <button type="button" onClick={() => setRows(r => [...r, emptyRow()])}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
          <Plus size={14} /> Add Row
        </button>
        {rows.length > 0 && (
          <button type="button" onClick={uploadAll} disabled={uploading || pending === 0}
            className="flex items-center gap-2 px-5 py-2 bg-[#1A3C5E] text-white text-sm font-semibold rounded-lg hover:bg-[#112E4D] disabled:opacity-50 ml-auto">
            {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : <><Upload size={14} /> Upload {pending} row{pending !== 1 ? 's' : ''}</>}
          </button>
        )}
      </div>

      {/* Summary */}
      {done && (
        <div className="flex items-center gap-4 text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <span className="flex items-center gap-1.5 text-green-700"><CheckCircle size={15} /> {succeeded} uploaded</span>
          {failed > 0 && <span className="flex items-center gap-1.5 text-red-600"><XCircle size={15} /> {failed} failed</span>}
        </div>
      )}

      {/* Table */}
      {rows.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
          <Upload size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Import a CSV or add rows manually</p>
          <p className="text-gray-400 text-sm mt-1">Download the template above to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Status', 'Name *', 'SKU', 'Category *', 'Base Price *', 'Wholesale', 'MOQ', 'Lead Days', 'Customizable', 'Tags', ''].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row._id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                    <td className="px-3 py-2 w-8">
                      {row.status === 'pending' && <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" title="Pending" />}
                      {row.status === 'uploading' && <Loader2 size={14} className="animate-spin text-blue-500" />}
                      {row.status === 'success' && <CheckCircle size={14} className="text-green-500" />}
                      {row.status === 'error' && <span title={row.error}><XCircle size={14} className="text-red-500" /></span>}
                    </td>
                    <td className="px-2 py-1.5">
                      <input value={row.name} onChange={e => updateRow(row._id, { name: e.target.value })} placeholder="Product name" title="Name" className={inp} />
                    </td>
                    <td className="px-2 py-1.5">
                      <input value={row.sku} onChange={e => updateRow(row._id, { sku: e.target.value })} placeholder="SKU-001" title="SKU" className={inp} />
                    </td>
                    <td className="px-2 py-1.5">
                      <select value={row.categoryId} onChange={e => updateRow(row._id, { categoryId: e.target.value })} title="Category" className={sel}>
                        <option value="">— Select —</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1.5 w-24">
                      <input value={row.basePrice} onChange={e => updateRow(row._id, { basePrice: e.target.value })} placeholder="0.00" title="Base price" className={inp} />
                    </td>
                    <td className="px-2 py-1.5 w-24">
                      <input value={row.wholesalePrice} onChange={e => updateRow(row._id, { wholesalePrice: e.target.value })} placeholder="0.00" title="Wholesale price" className={inp} />
                    </td>
                    <td className="px-2 py-1.5 w-16">
                      <input value={row.moq} onChange={e => updateRow(row._id, { moq: e.target.value })} placeholder="1" title="MOQ" className={inp} />
                    </td>
                    <td className="px-2 py-1.5 w-16">
                      <input value={row.leadTimeDays} onChange={e => updateRow(row._id, { leadTimeDays: e.target.value })} placeholder="0" title="Lead time days" className={inp} />
                    </td>
                    <td className="px-2 py-1.5 w-24">
                      <select value={row.isCustomizable} onChange={e => updateRow(row._id, { isCustomizable: e.target.value })} title="Customizable" className={sel}>
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <input value={row.tags} onChange={e => updateRow(row._id, { tags: e.target.value })} placeholder="tag1,tag2" title="Tags (comma separated)" className={inp} />
                    </td>
                    <td className="px-2 py-1.5 w-8">
                      <button type="button" onClick={() => setRows(rs => rs.filter(r => r._id !== row._id))} title="Remove row"
                        className="p-1 text-gray-300 hover:text-red-500">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.some(r => r.status === 'error') && (
            <div className="px-4 py-3 border-t border-red-100 bg-red-50">
              {rows.filter(r => r.status === 'error').map(r => (
                <p key={r._id} className="text-xs text-red-600"><strong>{r.name || 'Row'}:</strong> {r.error}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Customization Bulk Upload ────────────────────────────────────────────────

function CustomizationBulkUpload() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<CustomizationRow[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    axios.get(`${API}/products/admin/all?limit=200`, { headers: hdrs() })
      .then(r => setProducts(r.data?.products || r.data || []))
      .catch(() => {});
  }, []);

  function emptyRow(): CustomizationRow {
    return {
      _id: uid(), productId: '', productName: '', stepId: '', stepLabel: '',
      stepType: 'radio', stepRequired: 'true',
      options: [{ label: '', value: '', priceModifier: '0', colour: '', icon: '' }],
      status: 'pending', error: '',
    };
  }

  function downloadTemplate() {
    const headers = 'product_name,step_id,step_label,step_type,step_required,option_label,option_value,price_modifier,colour,icon';
    const examples = [
      '"Leather Bridle","colour","Colour","colour_picker","true","Black","black","0","#000000",""',
      '"Leather Bridle","colour","Colour","colour_picker","true","Brown","brown","0","#8B4513",""',
      '"Leather Bridle","size","Size","radio","true","Small","S","0","",""',
      '"Leather Bridle","size","Size","radio","true","Medium","M","2.50","",""',
    ].join('\n');
    downloadBlob(`${headers}\n${examples}`, 'customization_steps_template.csv');
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const rawRows = parseCSV(text);
      const header = rawRows[0].map(h => h.toLowerCase().trim());
      const idx = (name: string) => header.indexOf(name);

      // Group by product+stepId
      const grouped: Record<string, CustomizationRow> = {};
      rawRows.slice(1).filter(r => r.some(c => c)).forEach(r => {
        const prodName = r[idx('product_name')] || '';
        const stepId = r[idx('step_id')] || '';
        const key = `${prodName}__${stepId}`;
        if (!grouped[key]) {
          const prod = products.find(p => p.name.toLowerCase() === prodName.toLowerCase());
          grouped[key] = {
            _id: uid(),
            productId: prod?.id || '',
            productName: prodName,
            stepId,
            stepLabel: r[idx('step_label')] || stepId,
            stepType: r[idx('step_type')] || 'radio',
            stepRequired: r[idx('step_required')] || 'true',
            options: [],
            status: 'pending',
            error: '',
          };
        }
        grouped[key].options.push({
          label: r[idx('option_label')] || '',
          value: r[idx('option_value')] || '',
          priceModifier: r[idx('price_modifier')] || '0',
          colour: r[idx('colour')] || '',
          icon: r[idx('icon')] || '',
        });
      });
      setRows(Object.values(grouped));
      setDone(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function updateRow(id: string, patch: Partial<CustomizationRow>) {
    setRows(rs => rs.map(r => r._id === id ? { ...r, ...patch } : r));
  }

  function updateOption(rowId: string, optIdx: number, patch: Partial<StepOption>) {
    setRows(rs => rs.map(r => {
      if (r._id !== rowId) return r;
      const opts = r.options.map((o, i) => i === optIdx ? { ...o, ...patch } : o);
      return { ...r, options: opts };
    }));
  }

  function toggleExpand(id: string) {
    setExpanded(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function uploadAll() {
    setUploading(true);
    setDone(false);

    // Group rows by productId — fetch existing features, merge steps, save
    const byProduct: Record<string, CustomizationRow[]> = {};
    rows.forEach(r => {
      if (r.status === 'success') return;
      if (!r.productId) return;
      (byProduct[r.productId] = byProduct[r.productId] || []).push(r);
    });

    for (const [productId, productRows] of Object.entries(byProduct)) {
      // Mark all rows for this product as uploading
      setRows(rs => rs.map(r => productRows.find(pr => pr._id === r._id) ? { ...r, status: 'uploading', error: '' } : r));
      try {
        // Fetch existing product features
        const existing = await axios.get(`${API}/products/${productId}`, { headers: hdrs() });
        const features = existing.data?.features || {};
        const existingSteps: any[] = Array.isArray(features?.customizationSteps) ? features.customizationSteps : [];

        // Build new steps
        const newSteps = productRows.map(r => ({
          id: r.stepId,
          label: r.stepLabel,
          ui_type: r.stepType,
          required: r.stepRequired === 'true',
          options: r.options.filter(o => o.label || o.value).map(o => ({
            label: o.label,
            value: o.value,
            priceModifier: parseFloat(o.priceModifier) || 0,
            ...(o.colour ? { colour: o.colour } : {}),
            ...(o.icon ? { icon: o.icon } : {}),
          })),
        }));

        // Merge — replace step if id already exists, otherwise append
        const merged = [...existingSteps];
        newSteps.forEach(ns => {
          const existIdx = merged.findIndex(s => s.id === ns.id);
          if (existIdx >= 0) merged[existIdx] = ns;
          else merged.push(ns);
        });

        await axios.patch(`${API}/products/${productId}`, {
          features: { ...features, customizationSteps: merged },
        }, { headers: hdrs() });

        setRows(rs => rs.map(r => productRows.find(pr => pr._id === r._id) ? { ...r, status: 'success', error: '' } : r));
      } catch (err: any) {
        const msg = err?.response?.data?.message || err.message || 'Upload failed';
        setRows(rs => rs.map(r => productRows.find(pr => pr._id === r._id) ? { ...r, status: 'error', error: String(msg) } : r));
      }
    }

    // Flag rows with no product
    rows.filter(r => !r.productId && r.status !== 'success').forEach(r => {
      setRows(rs => rs.map(row => row._id === r._id ? { ...row, status: 'error', error: 'Product not found — check product name' } : row));
    });

    setUploading(false);
    setDone(true);
  }

  const pending = rows.filter(r => r.status === 'pending' || r.status === 'error').length;
  const succeeded = rows.filter(r => r.status === 'success').length;
  const failed = rows.filter(r => r.status === 'error').length;

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button type="button" onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
          <Download size={14} /> Download Template
        </button>
        <button type="button" onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 border border-[#1A3C5E] rounded-lg text-sm font-medium text-[#1A3C5E] hover:bg-blue-50">
          <Upload size={14} /> Import CSV
        </button>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={onFileChange} />
        <button type="button" onClick={() => { const r = emptyRow(); setRows(rs => [...rs, r]); setExpanded(s => { const n = new Set(s); n.add(r._id); return n; }); }}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
          <Plus size={14} /> Add Step
        </button>
        {rows.length > 0 && (
          <button type="button" onClick={uploadAll} disabled={uploading || pending === 0}
            className="flex items-center gap-2 px-5 py-2 bg-[#1A3C5E] text-white text-sm font-semibold rounded-lg hover:bg-[#112E4D] disabled:opacity-50 ml-auto">
            {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : <><Upload size={14} /> Upload {pending} step{pending !== 1 ? 's' : ''}</>}
          </button>
        )}
      </div>

      {/* Info box */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
        <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
        <span>Each row is one customization step. Multiple options per step are separate CSV rows with the same <strong>product_name</strong> and <strong>step_id</strong>. Existing steps with the same ID will be replaced.</span>
      </div>

      {/* Summary */}
      {done && (
        <div className="flex items-center gap-4 text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <span className="flex items-center gap-1.5 text-green-700"><CheckCircle size={15} /> {succeeded} step{succeeded !== 1 ? 's' : ''} uploaded</span>
          {failed > 0 && <span className="flex items-center gap-1.5 text-red-600"><XCircle size={15} /> {failed} failed</span>}
        </div>
      )}

      {/* Steps */}
      {rows.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
          <Upload size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Import a CSV or add steps manually</p>
          <p className="text-gray-400 text-sm mt-1">Download the template above to see the format</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(row => (
            <div key={row._id} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              {/* Step header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100 cursor-pointer"
                onClick={() => toggleExpand(row._id)}>
                <div className="flex-shrink-0">
                  {row.status === 'pending' && <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />}
                  {row.status === 'uploading' && <Loader2 size={14} className="animate-spin text-blue-500" />}
                  {row.status === 'success' && <CheckCircle size={14} className="text-green-500" />}
                  {row.status === 'error' && <XCircle size={14} className="text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-gray-800 text-sm">{row.stepLabel || 'Untitled step'}</span>
                  <span className="text-xs text-gray-400 ml-2">({row.stepId || 'no id'})</span>
                  {row.productName && <span className="text-xs text-[#1A3C5E] ml-3 font-medium">{row.productName}</span>}
                  {row.status === 'error' && <span className="text-xs text-red-500 ml-3">{row.error}</span>}
                </div>
                <span className="text-xs text-gray-400">{row.options.length} option{row.options.length !== 1 ? 's' : ''}</span>
                {expanded.has(row._id) ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                <button type="button" onClick={e => { e.stopPropagation(); setRows(rs => rs.filter(r => r._id !== row._id)); }} title="Remove step"
                  className="p-1 text-gray-300 hover:text-red-500 ml-1">
                  <Trash2 size={13} />
                </button>
              </div>

              {expanded.has(row._id) && (
                <div className="p-4 space-y-4">
                  {/* Step fields */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Product *</label>
                      <select value={row.productId} onChange={e => {
                        const p = products.find(x => x.id === e.target.value);
                        updateRow(row._id, { productId: e.target.value, productName: p?.name || '' });
                      }} title="Product" className={sel}>
                        <option value="">— Select product —</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Step ID *</label>
                      <input value={row.stepId} onChange={e => updateRow(row._id, { stepId: e.target.value })} placeholder="e.g. colour" title="Step ID" className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Label</label>
                      <input value={row.stepLabel} onChange={e => updateRow(row._id, { stepLabel: e.target.value })} placeholder="e.g. Choose Colour" title="Step label" className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Type</label>
                      <select value={row.stepType} onChange={e => updateRow(row._id, { stepType: e.target.value })} title="Step type" className={sel}>
                        <option value="radio">Radio</option>
                        <option value="colour_picker">Colour Picker</option>
                        <option value="icon_radio">Icon Radio</option>
                        <option value="text">Text Input</option>
                        <option value="number">Number</option>
                        <option value="select">Select</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Required</label>
                      <select value={row.stepRequired} onChange={e => updateRow(row._id, { stepRequired: e.target.value })} title="Required" className={sel}>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  </div>

                  {/* Options table */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Options</label>
                      <button type="button" onClick={() => updateRow(row._id, { options: [...row.options, { label: '', value: '', priceModifier: '0', colour: '', icon: '' }] })}
                        className="flex items-center gap-1 text-xs text-[#1A3C5E] hover:underline">
                        <Plus size={12} /> Add option
                      </button>
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {['Label', 'Value', 'Price modifier (€)', 'Colour', 'Icon', ''].map(h => (
                            <th key={h} className="pb-1.5 text-left font-semibold text-gray-400 pr-2">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {row.options.map((opt, oi) => (
                          <tr key={oi} className="border-b border-gray-50">
                            <td className="py-1 pr-2"><input value={opt.label} onChange={e => updateOption(row._id, oi, { label: e.target.value })} placeholder="Black" title="Option label" className={inp} /></td>
                            <td className="py-1 pr-2"><input value={opt.value} onChange={e => updateOption(row._id, oi, { value: e.target.value })} placeholder="black" title="Option value" className={inp} /></td>
                            <td className="py-1 pr-2"><input value={opt.priceModifier} onChange={e => updateOption(row._id, oi, { priceModifier: e.target.value })} placeholder="0" title="Price modifier" className={inp} /></td>
                            <td className="py-1 pr-2">
                              <div className="flex items-center gap-1">
                                {opt.colour && <span className="w-5 h-5 rounded border border-gray-200 flex-shrink-0" style={{ background: opt.colour }} />}
                                <input value={opt.colour} onChange={e => updateOption(row._id, oi, { colour: e.target.value })} placeholder="#000000" title="Colour hex" className={inp} />
                              </div>
                            </td>
                            <td className="py-1 pr-2"><input value={opt.icon} onChange={e => updateOption(row._id, oi, { icon: e.target.value })} placeholder="🎨" title="Icon emoji" className={inp} /></td>
                            <td className="py-1">
                              <button type="button" onClick={() => updateRow(row._id, { options: row.options.filter((_, i) => i !== oi) })} title="Remove option"
                                className="p-1 text-gray-300 hover:text-red-500" disabled={row.options.length <= 1}>
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
