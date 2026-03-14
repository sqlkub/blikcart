'use client';

import { useRouter } from 'next/navigation';

const CATEGORIES = [
  {
    slug: 'bridles',
    name: 'Bridles',
    description: 'Custom-fitted bridles crafted from premium leather. Choose your hardware, padding, and personalisation.',
    icon: '🐴',
    leadTime: '10–14 days',
    minOrder: 1,
  },
  {
    slug: 'saddle-pads',
    name: 'Saddle Pads',
    description: 'Design your perfect saddle pad — shape, piping colours, logo embroidery, and fabrics.',
    icon: '🪡',
    leadTime: '7–10 days',
    minOrder: 5,
  },
  {
    slug: 'rugs',
    name: 'Horse Rugs',
    description: 'Turnout and stable rugs built to order. Select fill weight, shell material, and custom trim.',
    icon: '🧥',
    leadTime: '14–21 days',
    minOrder: 3,
  },
  {
    slug: 'head-collars',
    name: 'Head Collars',
    description: 'Bespoke leather or nylon head collars with name plates, colour choices, and fittings.',
    icon: '🔖',
    leadTime: '7–12 days',
    minOrder: 1,
  },
  {
    slug: 'numnahs',
    name: 'Numnahs',
    description: 'Contoured numnahs with your choice of quilting pattern, binding, and branding.',
    icon: '🪢',
    leadTime: '7–10 days',
    minOrder: 5,
  },
  {
    slug: 'boots',
    name: 'Leg Boots',
    description: 'Protective leg boots tailored by discipline — choose shell, lining, fastenings, and colours.',
    icon: '🥾',
    leadTime: '10–14 days',
    minOrder: 4,
  },
];

export default function CustomizePage() {
  const router = useRouter();

  return (
    <main style={{ minHeight: '100vh', background: '#faf9f7', paddingBottom: 80 }}>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        color: '#fff',
        padding: '72px 24px 56px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', color: '#c9a96e', marginBottom: 16, fontWeight: 600 }}>
          Custom Manufacturing
        </p>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 700, margin: '0 0 16px', lineHeight: 1.15 }}>
          Configure Your Product
        </h1>
        <p style={{ fontSize: 16, color: '#aaa', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
          Choose a category below and walk through our guided configurator to build exactly what you need.
          Get an instant price estimate and lead time.
        </p>
      </section>

      {/* Category grid */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 24px 0' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 24,
        }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => router.push(`/customize/${cat.slug}`)}
              style={{
                background: '#fff',
                border: '1.5px solid #e8e4de',
                borderRadius: 16,
                padding: '32px 28px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'box-shadow 0.18s, border-color 0.18s, transform 0.15s',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.10)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#c9a96e';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#e8e4de';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              }}
            >
              {/* Icon */}
              <span style={{ fontSize: 36, lineHeight: 1 }}>{cat.icon}</span>

              {/* Name + description */}
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' }}>{cat.name}</h2>
                <p style={{ fontSize: 13.5, color: '#666', margin: 0, lineHeight: 1.65 }}>{cat.description}</p>
              </div>

              {/* Meta badges */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                <span style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: '#666',
                  background: '#f3f0eb',
                  borderRadius: 20,
                  padding: '3px 10px',
                }}>
                  ⏱ {cat.leadTime}
                </span>
                <span style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: '#666',
                  background: '#f3f0eb',
                  borderRadius: 20,
                  padding: '3px 10px',
                }}>
                  MOQ {cat.minOrder}
                </span>
              </div>

              {/* CTA */}
              <div style={{
                marginTop: 8,
                fontSize: 13,
                fontWeight: 700,
                color: '#c9a96e',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}>
                Configure now <span style={{ fontSize: 16 }}>→</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Trust bar */}
      <section style={{ maxWidth: 900, margin: '56px auto 0', padding: '0 24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'clamp(24px, 4vw, 64px)',
          flexWrap: 'wrap',
          borderTop: '1px solid #e8e4de',
          paddingTop: 40,
        }}>
          {[
            { icon: '🏆', label: 'Premium Materials' },
            { icon: '📦', label: 'Direct to Door' },
            { icon: '🔄', label: 'Revision-Friendly' },
            { icon: '💬', label: 'Dedicated Account Manager' },
          ].map(({ icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#555', fontSize: 13.5, fontWeight: 500 }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              {label}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
