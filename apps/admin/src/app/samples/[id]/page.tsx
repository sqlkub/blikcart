'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FlaskConical, CheckCircle, XCircle, RotateCcw, Send, BookOpen, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  requested:          { label: 'Requested',      color: 'bg-blue-100 text-blue-700' },
  in_review:          { label: 'In Review',       color: 'bg-yellow-100 text-yellow-700' },
  sample_sent:        { label: 'Sample Sent',     color: 'bg-purple-100 text-purple-700' },
  approved:           { label: 'Approved',        color: 'bg-green-100 text-green-700' },
  rejected:           { label: 'Rejected',        color: 'bg-red-100 text-red-700' },
  revision_requested: { label: 'Revision Req.',   color: 'bg-orange-100 text-orange-700' },
};

function token() { return typeof window !== 'undefined' ? localStorage.getItem('adminToken') || '' : ''; }
function authHeaders(json = false) {
  return {
    Authorization: `Bearer ${token()}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  };
}

export default function SampleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [sample, setSample] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Action form state
  const [adminNotes, setAdminNotes] = useState('');
  const [samplingFee, setSamplingFee] = useState('');
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/samples/${id}`, { headers: authHeaders() });
      const json = await res.json();
      setSample(json);
      setAdminNotes(json.adminNotes || '');
      setSamplingFee(json.samplingFee ? String(json.samplingFee) : '');
      setTemplateName(json.productName || '');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function updateStatus(status: string) {
    setSaving(true);
    try {
      await fetch(`${API}/samples/admin/${id}/status`, {
        method: 'PATCH',
        headers: authHeaders(true),
        body: JSON.stringify({ status, adminNotes, samplingFee: samplingFee ? parseFloat(samplingFee) : undefined }),
      });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove() {
    setSaving(true);
    try {
      await fetch(`${API}/samples/admin/${id}/approve`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({
          adminNotes,
          samplingFee: samplingFee ? parseFloat(samplingFee) : undefined,
          saveToLibrary,
          templateName,
          templateDescription,
          isPublic,
        }),
      });
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center py-24 text-gray-400">Loading…</div>;
  if (!sample) return <div className="text-red-500 text-center py-12">Sample not found</div>;

  const st = STATUS_LABELS[sample.status] || { label: sample.status, color: 'bg-gray-100 text-gray-600' };
  const allVersions = [
    ...(sample.parentSampleId ? [] : []),
    sample,
    ...(sample.revisions || []),
  ];

  return (
    <div className="max-w-5xl">
      {/* Back */}
      <Link href="/samples" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Samples
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-blue-600" />
            {sample.productName}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${st.color}`}>{st.label}</span>
            <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">V{sample.version}</span>
            <span className="text-sm text-gray-400">{sample.categorySlug}</span>
          </div>
        </div>
        {sample.template && (
          <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" /> In Sampling Library
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Sample details */}
        <div className="col-span-2 space-y-5">

          {/* Client */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Client</h3>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#1A3C5E] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                {sample.user?.fullName?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{sample.user?.companyName || sample.user?.fullName}</p>
                <p className="text-sm text-gray-500">{sample.user?.email}</p>
                {sample.user?.wholesaleTier && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full capitalize">{sample.user.wholesaleTier}</span>
                )}
              </div>
              <Link href={`/customers/${sample.userId}`} className="ml-auto text-xs text-blue-600 hover:underline">View Profile →</Link>
            </div>
          </div>

          {/* Sample Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Sample Details</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div><dt className="text-gray-400">Category</dt><dd className="font-medium text-gray-800">{sample.categorySlug}</dd></div>
              <div><dt className="text-gray-400">Quantity</dt><dd className="font-medium text-gray-800">{sample.quantity} units</dd></div>
              <div><dt className="text-gray-400">Version</dt><dd className="font-medium text-gray-800">V{sample.version}</dd></div>
              <div><dt className="text-gray-400">Requested</dt><dd className="font-medium text-gray-800">{new Date(sample.requestedAt).toLocaleDateString('en-GB')}</dd></div>
              {sample.samplingFee && (
                <div>
                  <dt className="text-gray-400">Sampling Fee</dt>
                  <dd className={`font-semibold ${sample.samplingFeeRecovered ? 'text-green-600' : 'text-gray-800'}`}>
                    €{Number(sample.samplingFee).toFixed(2)} {sample.samplingFeeRecovered ? '(recovered)' : '(pending)'}
                  </dd>
                </div>
              )}
              {sample.approvedAt && (
                <div><dt className="text-gray-400">Approved</dt><dd className="font-medium text-green-700">{new Date(sample.approvedAt).toLocaleDateString('en-GB')}</dd></div>
              )}
            </dl>
            {sample.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Description</p>
                <p className="text-sm text-gray-700">{sample.description}</p>
              </div>
            )}
            {sample.clientNotes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Client Notes</p>
                <p className="text-sm text-gray-700 italic">"{sample.clientNotes}"</p>
              </div>
            )}
          </div>

          {/* Configurator Snapshot */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <button type="button" onClick={() => setShowConfig(v => !v)}
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-700">
              Configurator Selections
              {showConfig ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showConfig && (
              <pre className="mt-3 bg-gray-50 rounded-lg p-4 text-xs overflow-auto max-h-64 border border-gray-100">
                {JSON.stringify(sample.configSnapshot, null, 2)}
              </pre>
            )}
          </div>

          {/* Version History */}
          {(sample.revisions?.length > 0 || sample.version > 1) && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Version History</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="font-mono text-xs bg-blue-600 text-white px-2 py-0.5 rounded">V{sample.version}</span>
                  <span className="text-sm font-medium text-blue-900">Current version</span>
                  <span className="ml-auto text-xs text-blue-500">{new Date(sample.requestedAt).toLocaleDateString('en-GB')}</span>
                </div>
                {(sample.revisions || []).map((rev: any) => (
                  <Link key={rev.id} href={`/samples/${rev.id}`}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <span className="font-mono text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">V{rev.version}</span>
                    <span className="text-sm text-gray-600">{STATUS_LABELS[rev.status]?.label || rev.status}</span>
                    <span className="ml-auto text-xs text-gray-400">{new Date(rev.requestedAt).toLocaleDateString('en-GB')}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="space-y-4">

          {/* Status actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Actions</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  rows={3}
                  placeholder="Internal notes for this sample…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Sampling Fee (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={samplingFee}
                  onChange={e => setSamplingFee(e.target.value)}
                  placeholder="e.g. 25.00"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Quick status buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {sample.status !== 'in_review' && (
                  <button type="button" disabled={saving} onClick={() => updateStatus('in_review')}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 transition-colors disabled:opacity-50">
                    <Send className="w-3.5 h-3.5" /> In Review
                  </button>
                )}
                {sample.status !== 'sample_sent' && (
                  <button type="button" disabled={saving} onClick={() => updateStatus('sample_sent')}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors disabled:opacity-50">
                    <Send className="w-3.5 h-3.5" /> Sample Sent
                  </button>
                )}
                {sample.status !== 'revision_requested' && (
                  <button type="button" disabled={saving} onClick={() => updateStatus('revision_requested')}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors disabled:opacity-50">
                    <RotateCcw className="w-3.5 h-3.5" /> Req. Revision
                  </button>
                )}
                {sample.status !== 'rejected' && (
                  <button type="button" disabled={saving} onClick={() => updateStatus('rejected')}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Approve + Library */}
          {sample.status !== 'approved' && (
            <div className="bg-white rounded-xl border border-green-200 p-5">
              <h3 className="text-sm font-semibold text-green-700 mb-4 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Approve Sample
              </h3>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={saveToLibrary} onChange={e => setSaveToLibrary(e.target.checked)}
                    className="w-4 h-4 rounded text-green-600" />
                  <span className="text-sm text-gray-700">Save to Sampling Library</span>
                </label>

                {saveToLibrary && (
                  <>
                    <input type="text" value={templateName} onChange={e => setTemplateName(e.target.value)}
                      placeholder="Template name"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                    <textarea value={templateDescription} onChange={e => setTemplateDescription(e.target.value)}
                      rows={2} placeholder="Template description (optional)"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500" />
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)}
                        className="w-4 h-4 rounded text-green-600" />
                      <span className="text-sm text-gray-700">Visible to all B2B clients</span>
                    </label>
                  </>
                )}

                <button type="button" disabled={saving} onClick={handleApprove}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50">
                  <CheckCircle className="w-4 h-4" />
                  {saving ? 'Approving…' : 'Approve Sample'}
                </button>
              </div>
            </div>
          )}

          {sample.status === 'approved' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-green-800">Sample Approved</p>
              {sample.approvedAt && (
                <p className="text-xs text-green-600 mt-1">{new Date(sample.approvedAt).toLocaleDateString('en-GB')}</p>
              )}
              {!sample.template && (
                <button type="button" onClick={() => setSaveToLibrary(true)}
                  className="mt-3 text-xs text-green-700 underline hover:no-underline">
                  + Add to Sampling Library
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
