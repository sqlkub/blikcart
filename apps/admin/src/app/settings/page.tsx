'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { UserPlus, ShieldCheck, Users, Eye, EyeOff, X, ChevronDown } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

type Tab = 'users' | 'email' | 'shipping' | 'tax';

const ACCOUNT_TYPES = [
  { value: 'admin',     label: 'Admin',     color: 'bg-purple-100 text-purple-700',  desc: 'Full admin panel access' },
  { value: 'retail',    label: 'Retail',    color: 'bg-blue-100 text-blue-700',      desc: 'Standard customer account' },
  { value: 'wholesale', label: 'Wholesale', color: 'bg-amber-100 text-amber-700',    desc: 'B2B wholesale account' },
];

const EMPTY_CREATE_FORM = { fullName: '', email: '', password: '', accountType: 'retail', companyName: '', phone: '' };

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
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ ...EMPTY_CREATE_FORM });
  const [showPw, setShowPw] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);

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

  async function createUser() {
    if (!createForm.fullName || !createForm.email || !createForm.password) return;
    setCreating(true);
    setCreateError('');
    try {
      const res = await axios.post(`${API}/auth/register`, {
        fullName: createForm.fullName,
        email: createForm.email,
        password: createForm.password,
        accountType: createForm.accountType,
        companyName: createForm.companyName || undefined,
        phone: createForm.phone || undefined,
      });
      const newUser = res.data?.user || res.data;
      setAllUsers(prev => [newUser, ...prev]);
      if (newUser.accountType === 'admin') setAdmins(prev => [newUser, ...prev]);
      setCreateForm({ ...EMPTY_CREATE_FORM });
      setShowCreate(false);
    } catch (e: any) {
      setCreateError(e.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  }

  async function deleteAdminUser(userId: string, name: string) {
    if (!window.confirm(`Remove admin access for "${name}"? This will delete the user account.`)) return;
    setDeletingUserId(userId);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API}/auth/admin/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      setAdmins(prev => prev.filter(u => u.id !== userId));
      setAllUsers(prev => prev.filter(u => u.id !== userId));
    } finally { setDeletingUserId(null); }
  }

  async function changeUserType(userId: string, newType: string) {
    setChangingRoleId(userId);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`${API}/auth/admin/users/${userId}`, { accountType: newType }, { headers: { Authorization: `Bearer ${token}` } });
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, accountType: newType } : u));
      setAdmins(prev => {
        if (newType === 'admin') {
          const user = allUsers.find(u => u.id === userId);
          return user && !prev.find(a => a.id === userId) ? [...prev, { ...user, accountType: 'admin' }] : prev;
        }
        return prev.filter(u => u.id !== userId);
      });
    } finally { setChangingRoleId(null); }
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

          {/* Create New User */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900 flex items-center gap-2"><UserPlus className="w-4 h-4 text-[#1A3C5E]" /> Create New User</h2>
                <p className="text-sm text-gray-400 mt-0.5">Create admin, retail, or wholesale accounts directly</p>
              </div>
              <button type="button" onClick={() => { setShowCreate(v => !v); setCreateError(''); }}
                className="px-4 py-2 bg-[#1A3C5E] text-white text-sm font-semibold rounded-lg hover:bg-[#112E4D] flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                {showCreate ? 'Cancel' : '+ New User'}
              </button>
            </div>
            {showCreate && (
              <div className="p-5">
                {/* Account type selector */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {ACCOUNT_TYPES.map(t => (
                    <button key={t.value} type="button"
                      onClick={() => setCreateForm(f => ({ ...f, accountType: t.value }))}
                      className={`border-2 rounded-xl p-3 text-left transition-all ${createForm.accountType === t.value ? 'border-[#1A3C5E] bg-[#1A3C5E]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                      <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-1.5 ${t.color}`}>{t.label}</span>
                      <p className="text-xs text-gray-500">{t.desc}</p>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Full Name *</label>
                    <input type="text" value={createForm.fullName} onChange={e => setCreateForm(f => ({ ...f, fullName: e.target.value }))}
                      placeholder="Jane Smith"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email *</label>
                    <input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="jane@example.com"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Password *</label>
                    <div className="relative">
                      <input type={showPw ? 'text' : 'password'} value={createForm.password}
                        onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                        placeholder="Min 8 characters"
                        className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]" />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Phone</label>
                    <input type="text" value={createForm.phone} onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+31 6 1234 5678"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]" />
                  </div>
                  {createForm.accountType === 'wholesale' && (
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Company Name</label>
                      <input type="text" value={createForm.companyName} onChange={e => setCreateForm(f => ({ ...f, companyName: e.target.value }))}
                        placeholder="Acme Equestrian Ltd"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E]" />
                    </div>
                  )}
                </div>

                {createError && (
                  <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                    <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700">{createError}</p>
                  </div>
                )}

                <div className="flex justify-end mt-4">
                  <button type="button" onClick={createUser}
                    disabled={creating || !createForm.fullName || !createForm.email || !createForm.password}
                    className="px-5 py-2 bg-[#1A3C5E] text-white text-sm font-semibold rounded-lg hover:bg-[#112E4D] disabled:opacity-50 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    {creating ? 'Creating…' : `Create ${ACCOUNT_TYPES.find(t => t.value === createForm.accountType)?.label} Account`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* All Users Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-gray-900 flex items-center gap-2"><Users className="w-4 h-4 text-[#1A3C5E]" /> All Users</h2>
                <p className="text-sm text-gray-400 mt-0.5">{allUsers.length} registered accounts</p>
              </div>
              <div className="flex gap-2 items-center">
                <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search name or email…"
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1A3C5E] w-52" />
                <select title="Filter by account type" value={userTypeFilter} onChange={e => setUserTypeFilter(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#1A3C5E]">
                  <option value="">All types</option>
                  {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            {loading ? (
              <div className="p-8 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['User', 'Email', 'Type', 'Joined', 'Change Type', ''].map((h, i) => (
                      <th key={i} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allUsers
                    .filter(u =>
                      (!userTypeFilter || u.accountType === userTypeFilter) &&
                      (!userSearch || u.fullName?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase()))
                    )
                    .map(u => {
                      const typeMeta = ACCOUNT_TYPES.find(t => t.value === u.accountType);
                      return (
                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#1A3C5E] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {(u.fullName || u.email)?.[0]?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{u.fullName || '—'}</p>
                                {me?.id === u.id && <p className="text-xs text-green-600 font-medium">you</p>}
                                {u.companyName && <p className="text-xs text-gray-400">{u.companyName}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-gray-500 text-xs">{u.email}</td>
                          <td className="px-5 py-3">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${typeMeta?.color || 'bg-gray-100 text-gray-600'}`}>
                              {typeMeta?.label || u.accountType}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                          <td className="px-5 py-3">
                            {me?.id !== u.id ? (
                              <select title="Change account type"
                                value={u.accountType}
                                disabled={changingRoleId === u.id}
                                onChange={e => changeUserType(u.id, e.target.value)}
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-[#1A3C5E] disabled:opacity-50">
                                {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                              </select>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            {me?.id !== u.id && (
                              <button type="button" disabled={deletingUserId === u.id}
                                onClick={() => deleteAdminUser(u.id, u.fullName || u.email)}
                                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 font-medium">
                                {deletingUserId === u.id ? '…' : 'Delete'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>

          {/* Admin users quick view */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <h2 className="font-bold text-gray-900">Admin Accounts ({admins.length})</h2>
            </div>
            {loading ? (
              <div className="p-8 space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
            ) : admins.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">No admin accounts yet</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {admins.map(u => (
                  <div key={u.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.fullName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{u.fullName}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</span>
                      {me?.id === u.id
                        ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">you</span>
                        : <button type="button" onClick={() => deleteAdminUser(u.id, u.fullName || u.email)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Account type reference */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Account Type Reference</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { type: 'Admin',     color: 'bg-purple-100 text-purple-700', desc: 'Full admin panel access — all modules, user management, settings' },
                { type: 'Wholesale', color: 'bg-amber-100 text-amber-700',   desc: 'B2B buyer account — requires approval, sees wholesale pricing and MOQs' },
                { type: 'Retail',    color: 'bg-blue-100 text-blue-700',     desc: 'Standard customer — auto-approved, sees retail pricing' },
              ].map(r => (
                <div key={r.type} className="px-5 py-4 flex items-center gap-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold w-24 text-center flex-shrink-0 ${r.color}`}>{r.type}</span>
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
