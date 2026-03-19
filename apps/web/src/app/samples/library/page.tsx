'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

function token() { return typeof window !== 'undefined' ? localStorage.getItem('accessToken') || '' : ''; }
function authHeaders(json = false) {
  return { Authorization: `Bearer ${token()}`, ...(json ? { 'Content-Type': 'application/json' } : {}) };
}

export default function SamplingLibraryPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    const url = categoryFilter
      ? `${API}/samples/library?category=${encodeURIComponent(categoryFilter)}`
      : `${API}/samples/library`;
    fetch(url, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setTemplates(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [categoryFilter]);

  const categories = Array.from(new Set(templates.map(t => t.categorySlug))).filter(Boolean);

  async function handleReorder(template: any) {
    setReordering(template.id);
    try {
      const res = await fetch(`${API}/samples/library/${template.id}/reorder`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({ quantity: 1 }),
      });
      const draft = await res.json();
      if (draft?.id) router.push(`/customize/${template.categorySlug}?draft=${draft.id}`);
    } finally {
      setReordering(null);
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 16px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--navy)', marginBottom: 12 }}>Sampling Library</h1>
        <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 560, margin: '0 auto' }}>
          Approved designs ready to order — skip the sampling process and go straight to production.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
          <Link href="/account/samples"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', border: '2px solid var(--navy)', color: 'var(--navy)', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            My Sample Requests
          </Link>
        </div>
      </div>

      {/* Category filter */}
      {categories.length > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setCategoryFilter('')}
            style={{ padding: '8px 18px', borderRadius: 24, border: 'none', background: !categoryFilter ? 'var(--navy)' : '#f3f4f6', color: !categoryFilter ? 'white' : '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            All
          </button>
          {categories.map(c => (
            <button key={c} type="button" onClick={() => setCategoryFilter(c === categoryFilter ? '' : c)}
              style={{ padding: '8px 18px', borderRadius: 24, border: 'none', background: categoryFilter === c ? 'var(--navy)' : '#f3f4f6', color: categoryFilter === c ? 'white' : '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize' }}>
              {c.replace(/-/g, ' ')}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af', fontSize: 15 }}>Loading library…</div>
      ) : templates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔭</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>Library is building up</h3>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
            No approved designs in the library yet. Submit a sample request to get started.
          </p>
          <Link href="/products"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'var(--gold)', color: 'white', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            Start Sampling
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {templates.map(t => (
            <div key={t.id} style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden', transition: 'box-shadow 0.2s', cursor: 'default' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>

              {/* Card top — category coloured band */}
              <div style={{ height: 6, background: 'var(--gold)' }} />

              <div style={{ padding: 20 }}>
                {/* Category + usage */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f3f4f6', padding: '2px 8px', borderRadius: 12 }}>
                    {t.categorySlug}
                  </span>
                  {t.usageCount > 0 && (
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>🔁 {t.usageCount} reorders</span>
                  )}
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>{t.name}</h3>
                {t.description && (
                  <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {t.description}
                  </p>
                )}

                {/* Approved badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                  <span style={{ fontSize: 12 }}>✅</span>
                  <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Approved design</span>
                  {t.sample?.approvedAt && (
                    <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto' }}>
                      {new Date(t.sample.approvedAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>

                {/* Reorder button */}
                <button
                  type="button"
                  disabled={reordering === t.id}
                  onClick={() => handleReorder(t)}
                  style={{ width: '100%', padding: '12px', background: reordering === t.id ? '#9ca3af' : 'var(--navy)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: reordering === t.id ? 'default' : 'pointer', transition: 'background 0.2s' }}>
                  {reordering === t.id ? 'Creating order…' : '⚡ Use This Design'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom CTA */}
      <div style={{ marginTop: 60, padding: '32px 24px', background: 'var(--navy)', borderRadius: 20, textAlign: 'center', color: 'white' }}>
        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Don't see what you need?</h3>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 20 }}>
          Submit a custom sample request — once approved, it's added to your private library.
        </p>
        <Link href="/products"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: 'var(--gold)', color: 'white', borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
          Start a New Sample Request
        </Link>
      </div>
    </div>
  );
}
