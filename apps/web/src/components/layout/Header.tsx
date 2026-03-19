'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';

const NAV = [
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
];

export default function Header() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { itemCount, toggleCart } = useCartStore();
  const { user } = useAuthStore();

  return (
    <header style={{ background: '#1a1a1a', color: 'white', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontWeight: 800, fontSize: 20, color: 'white', letterSpacing: '-0.02em' }}>BLIKCART</span>
          <span style={{ fontSize: 10, color: '#C8860A', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>Premium Saddlery</span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {NAV.map(item => (
            <div key={item.label} style={{ position: 'relative' }}
              onMouseEnter={() => setOpenMenu(item.label)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <Link href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: 6,
                fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.9)', textDecoration: 'none',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Link href={user ? '/account' : '/login'} style={{ padding: '6px 10px', color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: 18, borderRadius: 6 }}>👤</Link>
          <button onClick={() => toggleCart()} style={{ position: 'relative', padding: '6px 10px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.85)', cursor: 'pointer', fontSize: 18, borderRadius: 6 }}>
            🛒
            {itemCount > 0 && <span style={{ position: 'absolute', top: 2, right: 2, background: '#C8860A', color: 'white', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{itemCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}
