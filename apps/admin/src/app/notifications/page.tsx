'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

function authH(json = false): Record<string, string> {
  const tok = typeof window !== 'undefined' ? localStorage.getItem('adminToken') || '' : '';
  return { Authorization: `Bearer ${tok}`, ...(json ? { 'Content-Type': 'application/json' } : {}) };
}

function waUrl(phone: string, text: string) {
  const clean = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

function gmailUrl(to: string, subject: string, body: string) {
  return `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

const TYPE_META: Record<string, { label: string; icon: string; bg: string; color: string }> = {
  change_request:   { label: 'Change Request',  icon: '✏️', bg: '#fef3c7', color: '#92400e' },
  status_update:    { label: 'Status Update',   icon: '🏭', bg: '#ede9fe', color: '#5b21b6' },
  manual_email:     { label: 'Email Sent',      icon: '📧', bg: '#dbeafe', color: '#1e40af' },
  manual_whatsapp:  { label: 'WhatsApp Sent',   icon: '💬', bg: '#dcfce7', color: '#166534' },
};

const CHANNEL_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  email:    { label: 'Email',    bg: '#dbeafe', color: '#1e40af' },
  whatsapp: { label: 'WhatsApp', bg: '#dcfce7', color: '#166534' },
  in_app:   { label: 'In-App',  bg: '#f3f4f6', color: '#374151' },
};

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [changeRequests, setChangeRequests] = useState<any[]>([]);
  const [crTab, setCrTab] = useState<'log' | 'requests'>('requests');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [notifRes, crRes] = await Promise.all([
      fetch(`${API}/notifications?limit=100`, { headers: authH() }).then(r => r.json()).catch(() => ({ data: [] })),
      fetch(`${API}/orders/admin/change-requests`, { headers: authH() }).then(r => r.json()).catch(() => []),
    ]);
    setItems(notifRes.data || []);
    setChangeRequests(Array.isArray(crRes) ? crRes : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markAllRead() {
    await fetch(`${API}/notifications/mark-all-read`, { method: 'PATCH', headers: authH() });
    setItems(prev => prev.map(n => ({ ...n, isRead: true })));
  }

  async function resolveRequest(id: string, status: 'approved' | 'rejected', adminNote?: string) {
    setResolvingId(id);
    await fetch(`${API}/orders/admin/change-requests/${id}`, {
      method: 'PATCH', headers: authH(true),
      body: JSON.stringify({ status, adminNote }),
    });
    setChangeRequests(prev => prev.filter(r => r.id !== id));
    setResolvingId(null);
  }

  const filtered = items.filter(n => {
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    if (unreadOnly && n.isRead) return false;
    return true;
  });

  const unreadCount = items.filter(n => !n.isRead).length;
  const pendingCr = changeRequests.filter(r => r.status === 'pending').length;

  return (
    <div style={{ padding: 32, maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>Notifications</h1>
          <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>
            All client change requests, manufacturer updates, and sent communications
          </p>
        </div>
        {unreadCount > 0 && (
          <button type="button" onClick={markAllRead}
            style={{ padding: '9px 18px', border: '1.5px solid #e2e8f0', borderRadius: 8, background: 'white', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            Mark all read ({unreadCount})
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Notifications', value: items.length, color: '#1A3C5E' },
          { label: 'Unread', value: unreadCount, color: unreadCount > 0 ? '#dc2626' : '#9ca3af' },
          { label: 'Pending Change Requests', value: pendingCr, color: pendingCr > 0 ? '#d97706' : '#9ca3af' },
          { label: 'Status Updates', value: items.filter(n => n.type === 'status_update').length, color: '#7c3aed' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 10, padding: '16px 20px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f1f5f9', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {([['requests', `Change Requests${pendingCr > 0 ? ` (${pendingCr})` : ''}`], ['log', 'Notification Log']] as [string, string][]).map(([key, label]) => (
          <button key={key} type="button" onClick={() => setCrTab(key as any)}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              background: crTab === key ? 'white' : 'transparent', color: crTab === key ? '#0f172a' : '#64748b',
              boxShadow: crTab === key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
            {label}
          </button>
        ))}
      </div>

      {crTab === 'requests' ? (
        /* ── Change Requests Panel ── */
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Pending Change Requests
              {pendingCr > 0 && <span style={{ marginLeft: 8, fontSize: 12, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 10 }}>{pendingCr} pending</span>}
            </h2>
          </div>
          {changeRequests.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>
              <p style={{ fontSize: 36, marginBottom: 8 }}>✅</p>
              <p style={{ fontWeight: 600, color: '#374151' }}>No pending change requests</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {changeRequests.map(cr => {
                const meta = cr;
                return (
                  <div key={cr.id} style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'start' }}>
                    <div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                        <Link href={`/orders/${cr.orderId}`}
                          style={{ fontWeight: 700, color: '#1A3C5E', fontSize: 13, fontFamily: 'monospace', textDecoration: 'none' }}>
                          #{cr.order?.orderNumber}
                        </Link>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                          {cr.user?.companyName || cr.user?.fullName} · {cr.user?.email}
                        </span>
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>
                          {new Date(cr.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: 14, color: '#374151', background: '#f8fafc', borderRadius: 8, padding: '10px 14px', margin: '0 0 12px', border: '1px solid #f1f5f9' }}>
                        "{cr.message}"
                      </p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {cr.user?.email && (
                          <a href={gmailUrl(cr.user.email, `Re: Change Request – Order #${cr.order?.orderNumber}`, `Hi ${cr.user?.fullName},\n\nThank you for your change request regarding order #${cr.order?.orderNumber}:\n"${cr.message}"\n\n`)}
                            target="_blank" rel="noreferrer"
                            style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 7, background: '#dbeafe', color: '#1e40af', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            📧 Reply via Gmail
                          </a>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button type="button" disabled={resolvingId === cr.id}
                        onClick={() => resolveRequest(cr.id, 'approved')}
                        style={{ padding: '8px 16px', border: 'none', borderRadius: 8, background: '#dcfce7', color: '#166534', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        ✓ Approve
                      </button>
                      <button type="button" disabled={resolvingId === cr.id}
                        onClick={() => resolveRequest(cr.id, 'rejected')}
                        style={{ padding: '8px 16px', border: 'none', borderRadius: 8, background: '#fee2e2', color: '#991b1b', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ── Notification Log ── */
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[['all', 'All'], ['change_request', '✏️ Change Requests'], ['status_update', '🏭 Status Updates'], ['manual_email', '📧 Emails'], ['manual_whatsapp', '💬 WhatsApp']].map(([k, l]) => (
                <button key={k} type="button" onClick={() => setTypeFilter(k)}
                  style={{ padding: '6px 12px', borderRadius: 20, border: typeFilter === k ? 'none' : '1px solid #e2e8f0', background: typeFilter === k ? '#1A3C5E' : 'white', color: typeFilter === k ? 'white' : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {l}
                </button>
              ))}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b', cursor: 'pointer', marginLeft: 'auto' }}>
              <input type="checkbox" checked={unreadOnly} onChange={e => setUnreadOnly(e.target.checked)} />
              Unread only
            </label>
          </div>

          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>Loading…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>
                <p style={{ fontSize: 36, marginBottom: 8 }}>🔔</p>
                <p style={{ fontWeight: 600, color: '#374151' }}>No notifications yet</p>
              </div>
            ) : (
              <div>
                {filtered.map(n => {
                  const tm = TYPE_META[n.type] || { label: n.type, icon: '•', bg: '#f3f4f6', color: '#374151' };
                  const meta = n.metadata || {};
                  const channels: string[] = n.channels || [];
                  return (
                    <div key={n.id} style={{ padding: '16px 20px', borderBottom: '1px solid #f8fafc', display: 'flex', gap: 14, alignItems: 'flex-start', background: n.isRead ? 'white' : '#fafbff' }}>
                      {!n.isRead && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', marginTop: 7, flexShrink: 0 }} />}
                      {n.isRead && <div style={{ width: 6, flexShrink: 0 }} />}
                      <div style={{ fontSize: 18, marginTop: 1, flexShrink: 0 }}>{tm.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: tm.bg, color: tm.color }}>{tm.label}</span>
                          {channels.map(ch => {
                            const cb = CHANNEL_BADGE[ch];
                            return cb ? <span key={ch} style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: cb.bg, color: cb.color }}>{cb.label}</span> : null;
                          })}
                          {n.order?.orderNumber && (
                            <Link href={`/orders/${n.orderId}`}
                              style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: '#1A3C5E', textDecoration: 'none' }}>
                              #{n.order.orderNumber}
                            </Link>
                          )}
                          <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto' }}>
                            {new Date(n.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {n.subject && <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 3px' }}>{n.subject}</p>}
                        <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>{n.body}</p>
                        {n.fromUser && (
                          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                            From: {n.fromUser.companyName || n.fromUser.fullName} ({n.fromUser.email})
                          </p>
                        )}
                        {/* Action buttons for change requests */}
                        {n.type === 'change_request' && (
                          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {meta.clientEmail && (
                              <a href={gmailUrl(meta.clientEmail, `Re: ${n.subject}`, `Hi ${meta.clientName},\n\nRegarding your change request on order #${meta.orderNumber}:\n"${n.body}"\n\n`)}
                                target="_blank" rel="noreferrer"
                                onClick={async () => {
                                  await fetch(`${API}/notifications`, { method: 'POST', headers: authH(true), body: JSON.stringify({ type: 'manual_email', channels: ['email'], orderId: n.orderId, subject: `Re: ${n.subject}`, body: `Email opened to ${meta.clientEmail}`, metadata: { to: meta.clientEmail } }) });
                                }}
                                style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 7, background: '#dbeafe', color: '#1e40af', textDecoration: 'none' }}>
                                📧 Gmail
                              </a>
                            )}
                            {meta.clientPhone && (
                              <a href={waUrl(meta.clientPhone, `Hi ${meta.clientName}, regarding your change request on order #${meta.orderNumber}: "${n.body}"`)}
                                target="_blank" rel="noreferrer"
                                style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 7, background: '#dcfce7', color: '#166534', textDecoration: 'none' }}>
                                💬 WhatsApp
                              </a>
                            )}
                          </div>
                        )}
                        {/* WhatsApp for manufacturer updates */}
                        {n.type === 'status_update' && meta.manufacturerPhone && (
                          <div style={{ marginTop: 8 }}>
                            <a href={waUrl(meta.manufacturerPhone, `Update on order #${meta.orderNumber}: ${n.body}`)}
                              target="_blank" rel="noreferrer"
                              style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 7, background: '#dcfce7', color: '#166534', textDecoration: 'none' }}>
                              💬 WhatsApp Manufacturer
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
