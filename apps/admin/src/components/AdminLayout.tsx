'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios';
import { LayoutDashboard, ShoppingBag, Users, Package, BarChart3, LogOut, Briefcase, CreditCard, Settings, FileText, Truck, FlaskConical, Building2, Layers, Factory, Receipt, Bell } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

const navItems = [
  { label: 'Dashboard',           href: '/dashboard',           icon: LayoutDashboard },
  { label: 'Orders',              href: '/orders',              icon: ShoppingBag, countKey: 'customOrders' },
  { label: 'Notifications',       href: '/notifications',       icon: Bell, countKey: 'notifications' },
  { label: 'Products',            href: '/products',            icon: Package },
  { label: 'Customers',           href: '/customers',           icon: Users },
  { label: 'B2B Approvals',       href: '/customers/wholesale', icon: Briefcase, countKey: 'wholesale' },
  { label: 'B2B Clients',         href: '/b2b-clients',         icon: Building2 },
  { label: 'Client Products',     href: '/client-products',     icon: Layers },
  { label: 'Manufacturers',       href: '/manufacturers',       icon: Factory },
  { label: 'Proforma Invoices',   href: '/proforma',            icon: Receipt },
  { label: 'Sample Requests',     href: '/samples',             icon: FlaskConical, countKey: 'samples' },
  { label: 'Payments',            href: '/payments',            icon: CreditCard },
  { label: 'Shipping',            href: '/shipping',            icon: Truck },
  { label: 'Content',             href: '/content',             icon: FileText },
  { label: 'Analytics',           href: '/analytics',           icon: BarChart3 },
  { label: 'Settings',            href: '/settings',            icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [wholesaleCount, setWholesaleCount] = useState<number | null>(null);
  const [samplesCount, setSamplesCount] = useState<number | null>(null);
  const [notifCount, setNotifCount] = useState<number | null>(null);

  // Global 401 interceptor — catches expired tokens anywhere in the app
  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      res => res,
      err => {
        if (err.response?.status === 401) {
          localStorage.removeItem('adminToken');
          router.push('/login');
        }
        return Promise.reject(err);
      }
    );
    return () => { axios.interceptors.response.eject(interceptorId); };
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token && path !== '/login') {
      router.push('/login');
      return;
    }
    if (!token) { setReady(true); return; }

    // Verify token is still valid, fetch pending count
    axios.get(`${API}/orders/admin/custom-orders?status=submitted`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => {
      setPendingCount(res.data?.meta?.total ?? res.data?.data?.length ?? 0);
      setReady(true);
      // Fetch wholesale pending count
      axios.get(`${API}/auth/users?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => {
        const wc = (r.data?.data || []).filter((u: any) => u.accountType === 'wholesale' && !u.isApproved).length;
        setWholesaleCount(wc || null);
      }).catch(() => {});
      // Fetch pending sample requests count
      axios.get(`${API}/samples/admin/all?status=requested&limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => {
        setSamplesCount(r.data?.meta?.total || null);
      }).catch(() => {});
      // Fetch unread notifications count
      axios.get(`${API}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => {
        setNotifCount(r.data || null);
      }).catch(() => {});
    }).catch(err => {
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken');
        router.push('/login');
      } else {
        setReady(true);
      }
    });
  }, [path]);

  function signOut() {
    localStorage.removeItem('adminToken');
    router.push('/login');
  }

  if (path === '/login') return <>{children}</>;
  if (!ready) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 bg-[#1A3C5E] text-white flex flex-col flex-shrink-0 fixed h-full">
        <div className="p-5 border-b border-white/10">
          <p className="font-bold text-lg">BLIKCART</p>
          <p className="text-xs text-white/50 uppercase tracking-wider">Admin Panel</p>
        </div>
        <nav className="flex-1 py-4 px-2 space-y-0.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = path.startsWith(item.href);
            const badge = (item.countKey === 'customOrders' && pendingCount) ? pendingCount
                         : (item.countKey === 'wholesale' && wholesaleCount) ? wholesaleCount
                         : (item.countKey === 'samples' && samplesCount) ? samplesCount
                         : (item.countKey === 'notifications' && notifCount) ? notifCount
                         : null;
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                <Icon size={16} />
                {item.label}
                {badge ? (
                  <span className="ml-auto bg-[#C8860A] text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{badge}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button type="button" onClick={signOut} className="flex items-center gap-2 text-white/60 hover:text-white text-sm px-3 py-2 w-full rounded-lg hover:bg-white/10 transition-colors">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-56 p-8 overflow-auto">{children}</main>
    </div>
  );
}
