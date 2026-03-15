import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

const categories = [
  { name: 'Bridles', slug: 'bridles', count: '12 styles' },
  { name: 'Browbands', slug: 'browbands', count: '8 styles' },
  { name: 'Halters', slug: 'halters', count: '6 styles' },
  { name: 'Reins', slug: 'horse-reins', count: '9 styles' },
  { name: 'Girths', slug: 'girths', count: '5 styles' },
  { name: 'Parts & Components', slug: 'parts-components', count: '4 styles' },
];

const features = [
  { title: 'Fully Customisable', desc: '9-step configurator with live price preview. Choose material, colour, hardware and more.' },
  { title: 'Eco-Friendly Options', desc: 'Bio-certified leather tanning. Sustainable packaging. Carbon-tracked shipping.' },
  { title: 'Direct from Manufacturer', desc: 'No middlemen. Better quality control. Competitive wholesale pricing from 5 units.' },
];

async function getHeroBanner() {
  try {
    const res = await fetch(`${API}/content/banners?position=hero`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch {
    return null;
  }
}

async function getPromoBanner() {
  try {
    const res = await fetch(`${API}/content/banners?position=promo`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const [heroBanner, promoBanner] = await Promise.all([getHeroBanner(), getPromoBanner()]);

  const heroTitle   = heroBanner?.title    || null;
  const heroSub     = heroBanner?.subtitle || null;
  const heroLink    = heroBanner?.linkUrl  || '/design-your-own';
  const heroLinkTxt = heroBanner?.linkText || 'Design Your Own';

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* Promo banner (CMS — position: promo) */}
      {promoBanner && (
        <div style={{ background: '#C8860A', color: '#fff', textAlign: 'center', padding: '10px 24px', fontSize: 13, fontWeight: 600 }}>
          {promoBanner.linkUrl ? (
            <a href={promoBanner.linkUrl} style={{ color: '#fff', textDecoration: 'none' }}>
              {promoBanner.title}{promoBanner.linkText && ` — ${promoBanner.linkText}`}
            </a>
          ) : promoBanner.title}
        </div>
      )}

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)', color: 'white', padding: '88px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <p style={{ color: '#C8860A', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 16 }}>Premium Saddlery</p>

            {heroTitle ? (
              <>
                <h1 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 20, letterSpacing: '-0.02em' }}>
                  {heroTitle}
                </h1>
                {heroSub && (
                  <p style={{ color: '#999', fontSize: 17, marginBottom: 32, lineHeight: 1.7, maxWidth: 480 }}>{heroSub}</p>
                )}
              </>
            ) : (
              <>
                <h1 style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.02em' }}>
                  Fully Customised.<br />
                  <span style={{ color: '#C8860A' }}>Handcrafted.</span><br />
                  Delivered.
                </h1>
                <p style={{ color: '#999', fontSize: 17, marginBottom: 32, lineHeight: 1.7, maxWidth: 480 }}>
                  Design your perfect bridle, browband, or halter with our step-by-step configurator. Premium leather, your colours, your hardware. Direct from our workshop.
                </p>
              </>
            )}

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href={heroLink} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#C8860A', color: 'white', padding: '13px 28px', borderRadius: 8, fontWeight: 700, fontSize: 15 }}>
                {heroLinkTxt} <ArrowRight size={16} />
              </Link>
              <Link href="/products/for-horses" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', color: 'white', padding: '12px 28px', borderRadius: 8, fontWeight: 600, fontSize: 15, border: '1.5px solid rgba(255,255,255,0.2)' }}>
                Browse Products
              </Link>
            </div>
            <p style={{ color: '#555', fontSize: 13, marginTop: 20 }}>Wholesale from 5 units · Free shipping over €150 · 21-day lead time</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 24, aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: 80, fontWeight: 800, color: 'rgba(255,255,255,0.08)', letterSpacing: '-0.04em' }}>BK</span>
              </div>
              <div style={{ position: 'absolute', bottom: -12, right: -12, background: '#C8860A', color: 'white', borderRadius: 12, padding: '12px 18px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                <p style={{ fontSize: 11, fontWeight: 600, opacity: 0.85 }}>from</p>
                <p style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>€38</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      <section style={{ background: '#f5f5f5', padding: '64px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>Shop by Category</h2>
          <p style={{ color: '#666', marginBottom: 32 }}>All products available as standard or fully customised</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {categories.map(cat => (
              <Link key={cat.slug} href={`/products/${cat.slug}`} style={{ background: 'white', borderRadius: 12, padding: '28px 20px', textAlign: 'center', border: '1px solid #e0e0e0', display: 'block', transition: 'box-shadow 0.2s, transform 0.2s' }}>
                <p style={{ fontWeight: 700, color: '#1a1a1a', fontSize: 15 }}>{cat.name}</p>
                <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{cat.count}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Configurator CTA */}
      <section style={{ background: 'white', padding: '64px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)', borderRadius: 20, padding: '56px 48px', color: 'white', textAlign: 'center' }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Design Your Perfect Bridle</h2>
            <p style={{ color: '#888', marginBottom: 36, fontSize: 16, maxWidth: 560, margin: '0 auto 36px' }}>
              Choose from 8 styles, 3 materials, 8 colours, 4 hardware finishes, padding options and more. Real-time price as you configure.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, maxWidth: 640, margin: '0 auto 36px' }}>
              {['Style', 'Material', 'Colour', 'Hardware', 'Padding', 'Stitching', 'Size', 'Delivery'].map((step, i) => (
                <div key={step} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ color: '#C8860A', fontWeight: 800, fontSize: 18 }}>{i + 1}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{step}</div>
                </div>
              ))}
            </div>
            <Link href="/design-your-own" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#C8860A', color: 'white', padding: '14px 32px', borderRadius: 8, fontWeight: 700, fontSize: 16 }}>
              Start Configuring <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ background: '#f5f5f5', padding: '64px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {features.map((f, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 12, padding: '28px 24px', border: '1px solid #e0e0e0' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: '#666', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* B2B Banner */}
      <section style={{ background: '#2a2a2a', padding: '48px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>B2B & Wholesale</h2>
            <p style={{ color: '#888', marginTop: 4 }}>Volume discounts from 5 units. Dedicated account manager. Net-30 terms available.</p>
          </div>
          <Link href="/wholesale" style={{ background: '#C8860A', color: 'white', fontWeight: 700, padding: '12px 28px', borderRadius: 8, fontSize: 15 }}>
            Apply for Wholesale
          </Link>
        </div>
      </section>

    </div>
  );
}
