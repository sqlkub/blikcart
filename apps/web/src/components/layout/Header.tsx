'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

const SALE_ITEM = { label: '🔥 Sale', href: '/sale' };

function buildNav(categories: any[]) {
  const active = categories.filter((c: any) => c.isActive);
  const nav = active.map((cat: any) => {
    const activeChildren = (cat.children || []).filter((c: any) => c.isActive);
    if (activeChildren.length === 0) {
      return { label: cat.name, href: `/products/${cat.slug}` };
    }
    return {
      label: cat.name,
      href: `/products/${cat.slug}`,
      children: activeChildren.map((child: any) => {
        const activeGrandchildren = (child.children || []).filter((gc: any) => gc.isActive);
        if (activeGrandchildren.length === 0) {
          return { label: child.name, href: `/products/${child.slug}` };
        }
        return {
          label: child.name,
          href: `/products/${child.slug}`,
          children: [
            ...activeGrandchildren.map((gc: any) => ({ label: gc.name, href: `/products/${gc.slug}` })),
            { label: `All ${child.name}`, href: `/products/${child.slug}` },
          ],
        };
      }),
    };
  });
  return [...nav, SALE_ITEM];
}

const FALLBACK_NAV = [
  {
    label: 'For Horses',
    href: '/products/for-horses',
    children: [
      {
        label: 'Bridles', href: '/products/bridles',
        children: [
          { label: 'Dressage Bridles', href: '/products/dressage-bridles' },
          { label: 'Jumping Bridles',  href: '/products/jumping-bridles' },
          { label: 'All Bridles',      href: '/products/bridles' },
        ]
      },
      { label: 'Browbands', href: '/products/browbands' },
      { label: 'Halters',   href: '/products/halters' },
      { label: 'Girths',    href: '/products/girths' },
      { label: 'Reins',     href: '/products/horse-reins' },
    ]
  },
  { label: 'For Riders', href: '/products/for-riders' },
  { label: 'For Pets',   href: '/products/for-pets' },
  { label: 'Parts & Components', href: '/products/parts-components' },
  SALE_ITEM,
];

export default function Header() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [nav, setNav] = useState(FALLBACK_NAV);
  const { itemCount, toggleCart } = useCartStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetch(`${API}/products/categories`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data) && data.length > 0) setNav(buildNav(data)); })
      .catch(() => {});
  }, []);

  return (
    <header style={{ background: '#1a1a1a', color: 'white', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontWeight: 800, fontSize: 18, color: 'white', letterSpacing: '-0.02em' }}>BLIKCART</span>
          <span className="header-tagline" style={{ fontSize: 10, color: '#C8860A', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>Premium Saddlery</span>
        </Link>

        {/* Desktop nav */}
        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {nav.map(item => (
            <div key={item.label} style={{ position: 'relative' }}
              onMouseEnter={() => setOpenMenu(item.label)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <Link href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: 6,
                fontSize: 14, fontWeight: item.href === '/sale' ? 700 : 500,
                color: item.href === '/sale' ? '#ff4d4d' : 'rgba(255,255,255,0.9)', textDecoration: 'none',
                background: openMenu === item.label ? 'rgba(255,255,255,0.08)' : 'transparent', transition: 'all 0.15s',
              }}>
                {item.label}
                {item.children && <span style={{ fontSize: 10, opacity: 0.7 }}>▾</span>}
              </Link>

              {item.children && openMenu === item.label && (
                <div style={{ position: 'absolute', top: '100%', left: 0, background: 'white', borderRadius: 10, minWidth: 220, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', padding: '8px 0', border: '1px solid #e5e7eb', zIndex: 200 }}>
                  {item.children.map((child: any) => (
                    <div key={child.label}>
                      {child.children ? (
                        <div>
                          <div style={{ padding: '8px 16px 4px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{child.label}</div>
                          {child.children.map((gc: any) => (
                            <Link key={gc.label} href={gc.href} style={{ display: 'block', padding: '7px 16px 7px 24px', fontSize: 14, color: '#374151', textDecoration: 'none' }}
                              onMouseEnter={e => { (e.target as HTMLElement).style.background = '#f5f5f5'; (e.target as HTMLElement).style.color = '#1a1a1a'; }}
                              onMouseLeave={e => { (e.target as HTMLElement).style.background = 'transparent'; (e.target as HTMLElement).style.color = '#374151'; }}>
                              {gc.label}
                            </Link>
                          ))}
                          <div style={{ height: 1, background: '#f3f4f6', margin: '4px 0' }} />
                        </div>
                      ) : (
                        <Link href={child.href} style={{ display: 'block', padding: '9px 16px', fontSize: 14, color: '#374151', textDecoration: 'none', fontWeight: 500 }}
                          onMouseEnter={e => { (e.target as HTMLElement).style.background = '#f5f5f5'; (e.target as HTMLElement).style.color = '#1a1a1a'; }}
                          onMouseLeave={e => { (e.target as HTMLElement).style.background = 'transparent'; (e.target as HTMLElement).style.color = '#374151'; }}>
                          {child.label}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <Link href="/design-your-own" style={{ padding: '8px 14px', borderRadius: 6, fontSize: 14, fontWeight: 700, color: '#C8860A', textDecoration: 'none', border: '1px solid rgba(200,134,10,0.4)', marginLeft: 4 }}>
            Design Your Own ✦
          </Link>
          <Link href="/wholesale" style={{ padding: '8px 12px', borderRadius: 6, fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.9)', textDecoration: 'none' }}>
            B2B
          </Link>
        </nav>

        {/* Right icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Link href={user ? '/account' : '/login'} style={{ padding: '6px 10px', color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: 18, borderRadius: 6 }}>👤</Link>
          <button onClick={() => toggleCart()} style={{ position: 'relative', padding: '6px 10px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.85)', cursor: 'pointer', fontSize: 18, borderRadius: 6 }}>
            🛒
            {itemCount > 0 && <span style={{ position: 'absolute', top: 2, right: 2, background: '#C8860A', color: 'white', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{itemCount}</span>}
          </button>
          {/* Hamburger — mobile only */}
          <button
            className="hamburger-btn"
            onClick={() => setMobileOpen(v => !v)}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '6px 8px', display: 'none', flexDirection: 'column', gap: 5, borderRadius: 6 }}
            aria-label="Toggle menu"
          >
            <span style={{ display: 'block', width: 22, height: 2, background: mobileOpen ? '#C8860A' : 'white', borderRadius: 2, transition: 'all 0.2s', transform: mobileOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ display: 'block', width: 22, height: 2, background: 'white', borderRadius: 2, transition: 'all 0.2s', opacity: mobileOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: mobileOpen ? '#C8860A' : 'white', borderRadius: 2, transition: 'all 0.2s', transform: mobileOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mobile-nav" style={{ background: '#111', borderTop: '1px solid rgba(255,255,255,0.08)', paddingBottom: 16 }}>
          {/* Quick links */}
          <div style={{ padding: '12px 16px 0', display: 'flex', gap: 8 }}>
            <Link href="/design-your-own" onClick={() => setMobileOpen(false)}
              style={{ flex: 1, textAlign: 'center', padding: '10px', background: '#C8860A', color: 'white', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
              Design Your Own ✦
            </Link>
            <Link href="/wholesale" onClick={() => setMobileOpen(false)}
              style={{ flex: 1, textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.08)', color: 'white', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
              B2B / Wholesale
            </Link>
          </div>

          {/* Nav items */}
          <div style={{ marginTop: 8 }}>
            {nav.map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Link href={item.href} onClick={() => setMobileOpen(false)}
                    style={{ flex: 1, padding: '12px 16px', fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                    {item.label}
                  </Link>
                  {item.children && (
                    <button onClick={() => setMobileExpanded(mobileExpanded === item.label ? null : item.label)}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', padding: '12px 16px', fontSize: 12, cursor: 'pointer' }}>
                      {mobileExpanded === item.label ? '▲' : '▾'}
                    </button>
                  )}
                </div>
                {item.children && mobileExpanded === item.label && (
                  <div style={{ background: 'rgba(255,255,255,0.04)', paddingLeft: 16 }}>
                    {item.children.map((child: any) => (
                      <div key={child.label}>
                        {child.children ? (
                          <>
                            <div style={{ padding: '8px 16px 4px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{child.label}</div>
                            {child.children.map((gc: any) => (
                              <Link key={gc.label} href={gc.href} onClick={() => setMobileOpen(false)}
                                style={{ display: 'block', padding: '8px 16px 8px 24px', fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
                                {gc.label}
                              </Link>
                            ))}
                          </>
                        ) : (
                          <Link href={child.href} onClick={() => setMobileOpen(false)}
                            style={{ display: 'block', padding: '10px 16px', fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
                            {child.label}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
