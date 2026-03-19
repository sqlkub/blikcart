'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FlaskConical, RefreshCw, ChevronRight, CheckCircle, Clock, BookOpen, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

const STATUS_META: Record<string, { label: string; color: string; icon: string }> = {
  requested:          { label: 'Requested',      color: 'bg-blue-100 text-blue-700',    icon: '📬' },
  in_review:          { label: 'In Review',       color: 'bg-yellow-100 text-yellow-700', icon: '🔍' },
  sample_sent:        { label: 'Sample Sent',     color: 'bg-purple-100 text-purple-700', icon: '📦' },
  approved:           { label: 'Approved',        color: 'bg-green-100 text-green-700',  icon: '✅' },
  rejected:           { label: 'Rejected',        color: 'bg-red-100 text-red-700',      icon: '❌' },
  revision_requested: { label: 'Revision Needed', color: 'bg-orange-100 text-orange-700', icon: '🔄' },
};

function token() { return typeof window !== 'undefined' ? localStorage.getItem('accessToken') || '' : ''; }
function authHeaders(json = false) {
  return { Authorization: `Bearer ${token()}`, ...(json ? { 'Content-Type': 'application/json' } : {}) };
}

export default function MySamplesPage() {
  const router = useRouter();
  const [samples, setSamples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/samples`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setSamples(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  async function handleReorder(sampleId: string, qty: number) {
    setReordering(sampleId);
    try {
      const res = await fetch(`${API}/samples/${sampleId}/reorder`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({ quantity: qty }),
      });
      const draft = await res.json();
      if (draft?.id) router.push(`/customize/${draft.categorySlug || 'products'}?draft=${draft.id}`);
    } finally {
      setReordering(null);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--navy)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🧵</span> My Sample Requests
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginTop: 6 }}>Track your sample journey from request to approved design</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/samples/new"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'var(--gold)', color: 'white', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            <span>+</span> New Request
          </Link>
          <Link href="/samples/library"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'var(--navy)', color: 'white', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            <span>📚</span> Browse Library
          </Link>
        </div>
      </div>

      {/* Process timeline */}
      <div style={{ background: 'linear-gradient(135deg, #f0f4ff, #e8f5e9)', borderRadius: 16, padding: '20px 24px', marginBottom: 28, border: '1px solid #e0e7ff' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>Sampling Process</p>
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
          {[
            { step: '1', label: 'Submit Request', desc: 'Configure your design' },
            { step: '2', label: 'Review', desc: 'We review your specs' },
            { step: '3', label: 'Sample Made', desc: 'Physical sample produced' },
            { step: '4', label: 'Approval', desc: 'You approve or request changes' },
            { step: '5', label: 'Bulk Order', desc: '1-click reorder at scale' },
          ].map((s, i, arr) => (
            <div key={s.step} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 100 }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--navy)', color: 'white', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}>{s.step}</div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)', marginBottom: 2 }}>{s.label}</p>
                <p style={{ fontSize: 11, color: '#6b7280' }}>{s.desc}</p>
              </div>
              {i < arr.length - 1 && <div style={{ width: 24, height: 2, background: '#c7d2fe', flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>Loading your samples…</div>
      ) : samples.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', background: 'white', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🧵</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>No sample requests yet</h3>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>Start by configuring your product and submitting a sample request</p>
          <Link href="/samples/new"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'var(--gold)', color: 'white', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            <Plus style={{ width: 16, height: 16 }} /> New Sample Request
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {samples.map(s => {
            const st = STATUS_META[s.status] || { label: s.status, color: 'bg-gray-100 text-gray-600', icon: '•' };
            const allVersions = [s, ...(s.revisions || [])];
            const latestVersion = allVersions.reduce((acc: any, v: any) => v.version > acc.version ? v : acc, s);

            return (
              <div key={s.id} style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                {/* Sample header */}
                <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 20 }}>{st.icon}</span>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>{latestVersion.productName}</h3>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#e5e7eb', color: '#374151' }}>
                        V{latestVersion.version}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}
                        className={st.color}>
                        {st.label}
                      </span>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>{latestVersion.categorySlug} · {latestVersion.quantity} units</span>
                      {latestVersion.samplingFee && (
                        <span style={{ fontSize: 12, color: latestVersion.samplingFeeRecovered ? '#16a34a' : '#6b7280' }}>
                          Fee: €{Number(latestVersion.samplingFee).toFixed(2)}{latestVersion.samplingFeeRecovered ? ' ✓' : ''}
                        </span>
                      )}
                    </div>
                    {latestVersion.adminNotes && (
                      <div style={{ marginTop: 10, padding: '10px 14px', background: '#fafafa', borderRadius: 8, border: '1px solid #f3f4f6' }}>
                        <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Note from our team:</p>
                        <p style={{ fontSize: 13, color: '#374151' }}>{latestVersion.adminNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                    {latestVersion.status === 'approved' && (
                      <button
                        type="button"
                        disabled={reordering === latestVersion.id}
                        onClick={() => handleReorder(latestVersion.id, latestVersion.quantity)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'var(--gold)', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        <RefreshCw style={{ width: 14, height: 14 }} />
                        {reordering === latestVersion.id ? 'Creating…' : '1-Click Reorder'}
                      </button>
                    )}
                    {(latestVersion.status === 'revision_requested' || latestVersion.status === 'rejected') && (
                      <Link href={`/customize/${latestVersion.categorySlug}?revise=${latestVersion.id}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#f59e0b', color: 'white', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                        <RefreshCw style={{ width: 14, height: 14 }} /> Submit Revision
                      </Link>
                    )}
                  </div>
                </div>

                {/* Version history strip */}
                {allVersions.length > 1 && (
                  <div style={{ borderTop: '1px solid #f3f4f6', padding: '12px 24px', background: '#fafafa', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#9ca3af', marginRight: 4 }}>Versions:</span>
                    {allVersions.map((v: any) => (
                      <span key={v.id} style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12,
                        background: v.id === latestVersion.id ? 'var(--navy)' : '#e5e7eb',
                        color: v.id === latestVersion.id ? 'white' : '#6b7280',
                      }}>V{v.version}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CTA */}
      <div style={{ marginTop: 32, padding: '24px', background: 'var(--cream, #fdf9f4)', borderRadius: 16, border: '1px solid #e5e7eb', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>
          Looking for already approved designs to reorder without sampling?
        </p>
        <Link href="/samples/library"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', border: '2px solid var(--navy)', color: 'var(--navy)', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
          <span>📚</span> Browse Sampling Library
        </Link>
      </div>
    </div>
  );
}
