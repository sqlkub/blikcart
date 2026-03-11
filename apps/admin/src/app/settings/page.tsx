'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

type Tab = 'users' | 'email' | 'shipping' | 'tax';

// ── Default data (editable in-page, persisted to localStorage) ───────────────
const DEFAULT_SHIPPING_ZONES = [
  { id: '1', name: 'Netherlands',      countries: 'NL',          freeThreshold: 150,  standardRate: 4.95,  expressRate: 9.95 },
  { id: '2', name: 'Belgium',          countries: 'BE',          freeThreshold: 150,  standardRate: 5.95,  expressRate: 11.95 },
  { id: '3', name: 'Germany',          countries: 'DE',          freeThreshold: 150,  standardRate: 6.95,  expressRate: 12.95 },
  { id: '4', name: 'Rest of EU',       countries: 'FR,ES,IT,AT,PL,SE,DK,FI', freeThreshold: 200, standardRate: 9.95, expressRate: 18.95 },
  { id: '5', name: 'United Kingdom',   countries: 'GB',          freeThreshold: 200,  standardRate: 12.95, expressRate: 22.95 },
  { id: '6', name: 'Rest of World',    countries: 'US,CA,AU,CH', freeThreshold: 300,  standardRate: 19.95, expressRate: 34.95 },
];

const DEFAULT_TAX_RULES = [
  { id: '1', name: 'Standard VAT',      rate: 21,  countries: 'NL,BE,FR,DE,ES,IT,AT,PL', applies: 'All products' },
  { id: '2', name: 'Reduced VAT',       rate: 9,   countries: 'NL',                        applies: 'Reduced rate items' },
  { id: '3', name: 'UK VAT',            rate: 20,  countries: 'GB',                        applies: 'All products' },
  { id: '4', name: 'Zero Rate (Export)',rate: 0,   countries: 'US,CA,AU,CH',               applies: 'Export orders' },
];

const DEFAULT_EMAIL_TEMPLATES = [
  { id: 'order_confirmation', name: 'Order Confirmation',    trigger: 'Order placed',           subject: 'Your Blikcart order #{{orderNumber}} is confirmed',   active: true },
  { id: 'quote_sent',         name: 'Quote Sent',            trigger: 'Admin sends quote',      subject: 'Your custom order quote from Blikcart',               active: true },
  { id: 'quote_accepted',     name: 'Quote Accepted',        trigger: 'Buyer accepts quote',    subject: 'Quote accepted — your order is in production',        active: true },
  { id: 'shipped',            name: 'Order Shipped',         trigger: 'Status → shipped',       subject: 'Your Blikcart order has shipped!',                    active: true },
  { id: 'wholesale_approved', name: 'Wholesale Approved',    trigger: 'Admin approves B2B',     subject: 'Welcome to Blikcart Wholesale — your account is ready', active: true },
  { id: 'wholesale_rejected', name: 'Wholesale Rejected',    trigger: 'Admin rejects B2B',      subject: 'Update on your Blikcart wholesale application',       active: false },
  { id: 'password_reset',     name: 'Password Reset',        trigger: 'User requests reset',    subject: 'Reset your Blikcart password',                        active: true },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('users');
  const [admins, setAdmins] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<any>(null);
  const [promotingId, setPromotingId] = useState<string | null>(null);

  // Shipping zones state (editable)
  const [zones, setZones] = useState(DEFAULT_SHIPPING_ZONES);
  const [editingZone, setEditingZone] = useState<string | null>(null);
  const [zoneForm, setZoneForm] = useState<any>({});

  // Tax rules state
  const [taxRules, setTaxRules] = useState(DEFAULT_TAX_RULES);
  const [editingTax, setEditingTax] = useState<string | null>(null);
  const [taxForm, setTaxForm] = useState<any>({});

  // Email templates state
  const [templates, setTemplates] = useState(DEFAULT_EMAIL_TEMPLATES);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get(`${API}/auth/me`, { headers }),
      axios.get(`${API}/auth/users?limit=200`, { headers }),
    ]).then(([meRes, usersRes]) => {
      setMe(meRes.data);
      const users = usersRes.data.data || [];
      setAllUsers(users);
      setAdmins(users.filter((u: any) => u.accountType === 'admin'));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function promoteToAdmin(userId: string) {
    setPromotingId(userId);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`${API}/auth/admin/users/${userId}/approve`, { tier: 'admin' }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdmins(prev => {
        const user = allUsers.find(u => u.id === userId);
        return user ? [...prev, { ...user, accountType: 'admin' }] : prev;
      });
    } catch { /* ignore */ } finally { setPromotingId(null); }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'users',    label: 'Admin Users & Roles' },
    { id: 'email',    label: 'Email Templates' },
    { id: 'shipping', label: 'Shipping Zones & Rates' },
    { id: 'tax',      label: 'Tax / VAT Configuration' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Platform configuration and administration</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${tab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Admin Users & Roles ─────────────────────────────────────────── */}
      {tab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Admin Users</h2>
              <p className="text-sm text-gray-400 mt-0.5">Users with admin account type have full panel access</p>
            </div>
            {loading ? (
              <div className="p-8 space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                    {['User', 'Email', 'Role', 'Joined', ''].map((h, i) => (
                      <th key={i} className="text-left px-5 py-3 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {admins.map(u => (
                    <tr key={u.id} className="border-b border-gray-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#1A3C5E] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {u.fullName?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{u.fullName}</p>
                            {me?.id === u.id && <p className="text-xs text-green-600 font-medium">you</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">{u.email}</td>
                      <td className="px-5 py-4">
                        <select defaultValue="admin" className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700">
                          <option value="admin">Super Admin</option>
                          <option value="ops">Ops Admin</option>
                          <option value="catalog">Catalog Manager</option>
                          <option value="finance">Finance Admin</option>
                          <option value="support">Support Agent</option>
                        </select>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-4">
                        {me?.id !== u.id && (
                          <button type="button" className="text-xs text-red-500 hover:text-red-700 font-medium">Revoke</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {admins.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">No admin users found</td></tr>
                  )}
                </tbody>
              </table>
            )}
            <div className="p-4 border-t border-gray-50 bg-gray-50 rounded-b-xl">
              <p className="text-xs text-gray-400">To add a new admin, promote an existing user below.</p>
            </div>
          </div>

          {/* Promote user to admin */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Promote User to Admin</h2>
              <p className="text-sm text-gray-400 mt-0.5">Grant admin panel access to an existing registered user</p>
            </div>
            <div className="p-5">
              {loading ? <div className="h-10 bg-gray-100 rounded animate-pulse" /> : (
                <div className="flex gap-3">
                  <select id="promote-select" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:border-[#1A3C5E]">
                    <option value="">— Select a user —</option>
                    {allUsers.filter(u => u.accountType !== 'admin').map(u => (
                      <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!!promotingId}
                    onClick={() => {
                      const sel = document.getElementById('promote-select') as HTMLSelectElement;
                      if (sel?.value) promoteToAdmin(sel.value);
                    }}
                    className="px-4 py-2 bg-[#1A3C5E] text-white text-sm font-semibold rounded-lg hover:bg-[#112E4D] disabled:opacity-50">
                    {promotingId ? 'Promoting…' : 'Grant Admin Access'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Roles reference */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Role Definitions</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { role: 'Super Admin',      color: 'bg-purple-100 text-purple-700', desc: 'Full access — all modules including role management' },
                { role: 'Ops Admin',        color: 'bg-blue-100 text-blue-700',     desc: 'Orders, custom orders, quotes, shipping, wholesale approvals' },
                { role: 'Catalog Manager',  color: 'bg-green-100 text-green-700',   desc: 'Products, categories, configurator schemas, CMS' },
                { role: 'Finance Admin',    color: 'bg-amber-100 text-amber-700',   desc: 'Payments, invoices, refunds, analytics reports' },
                { role: 'Support Agent',    color: 'bg-gray-100 text-gray-600',     desc: 'View orders and users, send messages — no edit access' },
              ].map(r => (
                <div key={r.role} className="px-5 py-4 flex items-center gap-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold w-36 text-center flex-shrink-0 ${r.color}`}>{r.role}</span>
                  <p className="text-sm text-gray-500">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Email Templates ─────────────────────────────────────────────── */}
      {tab === 'email' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900">Email Templates</h2>
                <p className="text-sm text-gray-400 mt-0.5">Transactional emails sent automatically by the platform</p>
              </div>
              <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">Managed via email provider (SendGrid / SES)</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                  {['Template', 'Trigger', 'Subject Line', 'Status'].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {templates.map(t => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{t.id}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{t.trigger}</td>
                    <td className="px-5 py-4 text-sm text-gray-600 max-w-xs truncate" title={t.subject}>{t.subject}</td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        aria-label={t.active ? `Disable ${t.name}` : `Enable ${t.name}`}
                        onClick={() => setTemplates(prev => prev.map(x => x.id === t.id ? { ...x, active: !x.active } : x))}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${t.active ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${t.active ? 'translate-x-4' : 'translate-x-1'}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 bg-gray-50 rounded-b-xl border-t border-gray-50">
              <p className="text-xs text-gray-400">Template content is managed in your email provider dashboard. Variable tokens: <span className="font-mono">{'{{orderNumber}}, {{buyerName}}, {{trackingUrl}}, {{quoteLink}}'}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* ── Shipping Zones & Rates ──────────────────────────────────────── */}
      {tab === 'shipping' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900">Shipping Zones & Rates</h2>
                <p className="text-sm text-gray-400 mt-0.5">Rates applied at checkout. Free shipping when order exceeds threshold.</p>
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                  {['Zone', 'Countries', 'Free Above', 'Standard', 'Express', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {zones.map(z => (
                  <tr key={z.id} className="border-b border-gray-50 hover:bg-gray-50">
                    {editingZone === z.id ? (
                      <>
                        <td className="px-5 py-3"><input title="Zone name" className="border border-gray-300 rounded px-2 py-1 text-sm w-32" value={zoneForm.name} onChange={e => setZoneForm((f: any) => ({ ...f, name: e.target.value }))} /></td>
                        <td className="px-5 py-3"><input title="Country codes (comma-separated)" className="border border-gray-300 rounded px-2 py-1 text-sm w-32" value={zoneForm.countries} onChange={e => setZoneForm((f: any) => ({ ...f, countries: e.target.value }))} /></td>
                        <td className="px-5 py-3"><input type="number" title="Free shipping threshold (€)" className="border border-gray-300 rounded px-2 py-1 text-sm w-20" value={zoneForm.freeThreshold} onChange={e => setZoneForm((f: any) => ({ ...f, freeThreshold: Number(e.target.value) }))} /></td>
                        <td className="px-5 py-3"><input type="number" step="0.01" title="Standard shipping rate (€)" className="border border-gray-300 rounded px-2 py-1 text-sm w-20" value={zoneForm.standardRate} onChange={e => setZoneForm((f: any) => ({ ...f, standardRate: Number(e.target.value) }))} /></td>
                        <td className="px-5 py-3"><input type="number" step="0.01" title="Express shipping rate (€)" className="border border-gray-300 rounded px-2 py-1 text-sm w-20" value={zoneForm.expressRate} onChange={e => setZoneForm((f: any) => ({ ...f, expressRate: Number(e.target.value) }))} /></td>
                        <td className="px-5 py-3">
                          <div className="flex gap-2">
                            <button type="button" onClick={() => { setZones(prev => prev.map(x => x.id === z.id ? { ...x, ...zoneForm } : x)); setEditingZone(null); }} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold">Save</button>
                            <button type="button" onClick={() => setEditingZone(null)} className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-semibold">Cancel</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">{z.name}</td>
                        <td className="px-5 py-4 text-xs font-mono text-gray-500">{z.countries}</td>
                        <td className="px-5 py-4 text-sm text-gray-700">€{z.freeThreshold}</td>
                        <td className="px-5 py-4 text-sm text-gray-700">€{z.standardRate.toFixed(2)}</td>
                        <td className="px-5 py-4 text-sm text-gray-700">€{z.expressRate.toFixed(2)}</td>
                        <td className="px-5 py-4">
                          <button type="button" onClick={() => { setEditingZone(z.id); setZoneForm({ ...z }); }} className="text-xs text-[#1A3C5E] hover:underline font-medium">Edit</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 bg-gray-50 rounded-b-xl border-t border-gray-50">
              <p className="text-xs text-gray-400">Rates are in EUR. Free shipping applies when cart subtotal exceeds the threshold. Express rates are shown to buyers as an upgrade option at checkout.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Tax / VAT Configuration ─────────────────────────────────────── */}
      {tab === 'tax' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Tax / VAT Configuration</h2>
              <p className="text-sm text-gray-400 mt-0.5">VAT rates applied per country. B2B customers with a valid VAT number may be zero-rated.</p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                  {['Rule Name', 'Rate', 'Countries', 'Applies To', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {taxRules.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    {editingTax === r.id ? (
                      <>
                        <td className="px-5 py-3"><input title="Rule name" className="border border-gray-300 rounded px-2 py-1 text-sm w-40" value={taxForm.name} onChange={e => setTaxForm((f: any) => ({ ...f, name: e.target.value }))} /></td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1">
                            <input type="number" title="VAT rate (%)" className="border border-gray-300 rounded px-2 py-1 text-sm w-16" value={taxForm.rate} onChange={e => setTaxForm((f: any) => ({ ...f, rate: Number(e.target.value) }))} />
                            <span className="text-sm text-gray-500">%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3"><input title="Country codes (comma-separated)" className="border border-gray-300 rounded px-2 py-1 text-sm w-36" value={taxForm.countries} onChange={e => setTaxForm((f: any) => ({ ...f, countries: e.target.value }))} /></td>
                        <td className="px-5 py-3"><input title="Applies to" className="border border-gray-300 rounded px-2 py-1 text-sm w-36" value={taxForm.applies} onChange={e => setTaxForm((f: any) => ({ ...f, applies: e.target.value }))} /></td>
                        <td className="px-5 py-3">
                          <div className="flex gap-2">
                            <button type="button" onClick={() => { setTaxRules(prev => prev.map(x => x.id === r.id ? { ...x, ...taxForm } : x)); setEditingTax(null); }} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold">Save</button>
                            <button type="button" onClick={() => setEditingTax(null)} className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-semibold">Cancel</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">{r.name}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${r.rate === 0 ? 'bg-gray-100 text-gray-500' : r.rate >= 20 ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>
                            {r.rate}%
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs font-mono text-gray-500">{r.countries}</td>
                        <td className="px-5 py-4 text-sm text-gray-500">{r.applies}</td>
                        <td className="px-5 py-4">
                          <button type="button" onClick={() => { setEditingTax(r.id); setTaxForm({ ...r }); }} className="text-xs text-[#1A3C5E] hover:underline font-medium">Edit</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 bg-gray-50 rounded-b-xl border-t border-gray-50">
              <p className="text-xs text-gray-400">
                VAT is calculated at checkout based on the shipping country. B2B buyers (wholesale) with a valid EU VAT number are zero-rated for cross-border EU transactions (intra-community supply). All rates in %.
              </p>
            </div>
          </div>

          {/* VAT Settings summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4">VAT Settings Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Default VAT Rate', value: '21%', note: 'Netherlands standard' },
                { label: 'B2B Zero-Rate', value: 'Enabled', note: 'Valid EU VAT number required' },
                { label: 'Invoice Format', value: 'Auto PDF', note: 'Generated on payment' },
                { label: 'VAT on Shipping', value: 'Included', note: 'At standard rate' },
                { label: 'Currency', value: 'EUR', note: 'Euro only' },
                { label: 'Rounding', value: '2 decimal', note: 'Standard accounting' },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">{item.label}</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{item.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
