'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Eye, EyeOff, BarChart2, FlaskConical, RefreshCw } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

function token() { return typeof window !== 'undefined' ? localStorage.getItem('adminToken') || '' : ''; }
function authHeaders(json = false) {
  return { Authorization: `Bearer ${token()}`, ...(json ? { 'Content-Type': 'application/json' } : {}) };
}

export default function SamplingLibraryPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/samples/admin/library`, { headers: authHeaders() });
      setTemplates(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggleVisibility(templateId: string, isPublic: boolean) {
    setToggling(templateId);
    try {
      await fetch(`${API}/samples/admin/library/${templateId}/visibility`, {
        method: 'PATCH',
        headers: authHeaders(true),
        body: JSON.stringify({ isPublic }),
      });
      setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, isPublic } : t));
    } finally {
      setToggling(null);
    }
  }

  const filtered = templates.filter(t =>
    filter === 'all' ? true : filter === 'public' ? t.isPublic : !t.isPublic
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            Sampling Library
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {templates.filter(t => t.isPublic).length} public · {templates.filter(t => !t.isPublic).length} private · {templates.length} total
          </p>
        </div>
        <Link href="/samples" className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <FlaskConical className="w-4 h-4" />
          Sample Requests
        </Link>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5">
        {(['all', 'public', 'private'] as const).map(f => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
              filter === f ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 py-20 flex flex-col items-center gap-3 text-gray-400">
          <BookOpen className="w-10 h-10 opacity-30" />
          <p className="font-medium">No templates in library yet</p>
          <p className="text-sm">Approve samples and save them to the library</p>
          <Link href="/samples" className="mt-2 text-sm text-emerald-600 hover:underline">View sample requests →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
              {/* Category badge + visibility */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t.categorySlug}</span>
                <button
                  type="button"
                  disabled={toggling === t.id}
                  onClick={() => toggleVisibility(t.id, !t.isPublic)}
                  title={t.isPublic ? 'Make private' : 'Make public'}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                    t.isPublic
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  } disabled:opacity-50`}>
                  {t.isPublic ? <><Eye className="w-3 h-3" /> Public</> : <><EyeOff className="w-3 h-3" /> Private</>}
                </button>
              </div>

              <h3 className="font-semibold text-gray-900 text-sm mb-1">{t.name}</h3>
              {t.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{t.description}</p>}

              <div className="flex items-center gap-4 text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3" /> {t.usageCount} reorders</span>
                <span>{t.sample?.user?.companyName || 'Unknown client'}</span>
                <Link href={`/samples/${t.sampleId}`} className="ml-auto text-blue-500 hover:underline text-xs">
                  View Sample →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
