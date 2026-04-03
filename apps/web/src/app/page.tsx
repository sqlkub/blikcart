import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

async function getCategories() {
  try {
    const res = await fetch(`${API}/products/categories`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.filter((c: any) => c.isActive) : [];
  } catch {
    return [];
  }
}

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

async function getHomeContent() {
  try {
    const res = await fetch(`${API}/content/pages/home`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const page = await res.json();
    const raw = page?.content;
    return typeof raw === 'string' ? JSON.parse(raw) : raw ?? null;
  } catch {
    return null;
  }
}

const DEFAULTS = {
  hero: {
    badge: 'Premium Saddlery',
    headline: null as string | null,
    subheading: 'Design your perfect bridle, browband, or halter with our step-by-step configurator. Premium leather, your colours, your hardware. Direct from our workshop.',
    ctaText: 'Design Your Own',
    ctaUrl: '/design-your-own',
    secondaryCtaText: 'Browse Products',
    secondaryCtaUrl: '/products/for-horses',
    footnote: 'B2B from 5 units · Free shipping over €150 · 21-day lead time',
    heroImageUrl: '',
    fromPrice: '38',
  },
  features: [
    { title: 'Fully Customisable', description: '9-step configurator with live price preview. Choose material, colour, hardware and more.' },
    { title: 'Eco-Friendly Options', description: 'Bio-certified leather tanning. Sustainable packaging. Carbon-tracked shipping.' },
    { title: 'Direct from Manufacturer', description: 'No middlemen. Better quality control. Competitive B2B pricing from 5 units.' },
  ],
  configuratorCta: {
    headline: 'Design Your Perfect Bridle',
    subtext: 'Choose from 8 styles, 3 materials, 8 colours, 4 hardware finishes, padding options and more. Real-time price as you configure.',
    ctaText: 'Start Configuring',
    ctaUrl: '/design-your-own',
  },
  b2bBanner: {
    headline: 'B2B',
    subtext: 'Volume discounts from 5 units. Dedicated account manager. Net-30 terms available.',
    ctaText: 'Apply for B2B',
    ctaUrl: '/wholesale',
  },
};

export default async function HomePage() {
  const [heroBanner, promoBanner, allCategories, cms] = await Promise.all([
    getHeroBanner(), getPromoBanner(), getCategories(), getHomeContent(),
  ]);

  // Merge CMS data over defaults
  const hero = { ...DEFAULTS.hero, ...(cms?.hero ?? {}) };
  const features: { title: string; description: string }[] =
    (cms?.features?.length ? cms.features : DEFAULTS.features);
  const cta = { ...DEFAULTS.configuratorCta, ...(cms?.configuratorCta ?? {}) };
  const b2b = { ...DEFAULTS.b2bBanner, ...(cms?.b2bBanner ?? {}) };

  // Hero banner (position:hero) overrides CMS hero text if set
  const heroTitle    = heroBanner?.title    || hero.headline;
  const heroSub      = heroBanner?.subtitle || hero.subheading;
  const heroLink     = heroBanner?.linkUrl  || hero.ctaUrl;
  const heroLinkTxt  = heroBanner?.linkText || hero.ctaText;

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* Promo banner */}
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
      <section style={{ background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)', color: 'white', padding: 'clamp(48px, 7vw, 88px) 24px' }}>
        <div className="hero-grid" style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <p style={{ color: '#C8860A', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 16 }}>
              {hero.badge}
            </p>

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
                <h1 className="hero-h1-static" style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.02em' }}>
                  Fully Customised.<br />
                  <span style={{ color: '#C8860A' }}>Handcrafted.</span><br />
                  Delivered.
                </h1>
                <p style={{ color: '#999', fontSize: 17, marginBottom: 32, lineHeight: 1.7, maxWidth: 480 }}>
                  {hero.subheading}
                </p>
              </>
            )}

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href={heroLink} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#C8860A', color: 'white', padding: '13px 28px', borderRadius: 8, fontWeight: 700, fontSize: 15 }}>
                {heroLinkTxt} <ArrowRight size={16} />
              </Link>
              <Link href={hero.secondaryCtaUrl} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', color: 'white', padding: '12px 28px', borderRadius: 8, fontWeight: 600, fontSize: 15, border: '1.5px solid rgba(255,255,255,0.2)' }}>
                {hero.secondaryCtaText}
              </Link>
            </div>
            <p style={{ color: '#555', fontSize: 13, marginTop: 20 }}>{hero.footnote}</p>
          </div>

          <div className="hero-image-col" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 24, aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                {hero.heroImageUrl ? (
                  <img src={hero.heroImageUrl} alt="Hero product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 80, fontWeight: 800, color: 'rgba(255,255,255,0.08)', letterSpacing: '-0.04em' }}>BK</span>
                )}
              </div>
              {hero.fromPrice && (
                <div style={{ position: 'absolute', bottom: -12, right: -12, background: '#C8860A', color: 'white', borderRadius: 12, padding: '12px 18px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, opacity: 0.85 }}>from</p>
                  <p style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>€{hero.fromPrice}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      {allCategories.length > 0 && (
        <section style={{ background: '#f5f5f5', padding: '64px 24px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>Shop by Category</h2>
            <p style={{ color: '#666', marginBottom: 32 }}>All products available as standard or fully customised</p>
            <div className="categories-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {allCategories.map((cat: any) => {
                const activeChildren = (cat.children || []).filter((c: any) => c.isActive);
                const subtitle = activeChildren.length > 0
                  ? `${activeChildren.length} subcategor${activeChildren.length === 1 ? 'y' : 'ies'}`
                  : cat.isCustomizable ? 'Customisable' : 'Shop now';
                return (
                  <Link key={cat.slug} href={`/products/${cat.slug}`} style={{ background: 'white', borderRadius: 12, padding: '28px 20px', textAlign: 'center', border: '1px solid #e0e0e0', display: 'block' }}>
                    <p style={{ fontWeight: 700, color: '#1a1a1a', fontSize: 15 }}>{cat.name}</p>
                    <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{subtitle}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Configurator CTA */}
      <section style={{ background: 'white', padding: '64px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)', borderRadius: 20, padding: 'clamp(28px, 4vw, 56px) clamp(20px, 4vw, 48px)', color: 'white', textAlign: 'center' }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>{cta.headline}</h2>
            <p style={{ color: '#888', marginBottom: 36, fontSize: 16, maxWidth: 560, margin: '0 auto 36px' }}>
              {cta.subtext}
            </p>
            <div className="config-steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, maxWidth: 640, margin: '0 auto 36px' }}>
              {['Style', 'Material', 'Colour', 'Hardware', 'Padding', 'Stitching', 'Size', 'Delivery'].map((step, i) => (
                <div key={step} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ color: '#C8860A', fontWeight: 800, fontSize: 18 }}>{i + 1}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{step}</div>
                </div>
              ))}
            </div>
            <Link href={cta.ctaUrl} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#C8860A', color: 'white', padding: '14px 32px', borderRadius: 8, fontWeight: 700, fontSize: 16 }}>
              {cta.ctaText} <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ background: '#f5f5f5', padding: '64px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {features.map((f, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 12, padding: '28px 24px', border: '1px solid #e0e0e0' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: '#666', fontSize: 14, lineHeight: 1.6 }}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* B2B Banner */}
      <section style={{ background: '#2a2a2a', padding: '48px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>{b2b.headline}</h2>
            <p style={{ color: '#888', marginTop: 4 }}>{b2b.subtext}</p>
          </div>
          <Link href={b2b.ctaUrl} style={{ background: '#C8860A', color: 'white', fontWeight: 700, padding: '12px 28px', borderRadius: 8, fontSize: 15 }}>
            {b2b.ctaText}
          </Link>
        </div>
      </section>

    </div>
  );
}
