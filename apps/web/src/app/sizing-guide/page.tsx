import Link from 'next/link';

const BRIDLE_SIZES = [
  { size: 'Pony',    headpiece: '50–54 cm', browband: '38–42 cm', noseband: '30–33 cm', cheekpieces: '28–34 cm' },
  { size: 'Cob',     headpiece: '54–58 cm', browband: '42–46 cm', noseband: '33–36 cm', cheekpieces: '34–40 cm' },
  { size: 'Full',    headpiece: '58–63 cm', browband: '46–52 cm', noseband: '36–40 cm', cheekpieces: '40–46 cm' },
  { size: 'Full XL', headpiece: '63–68 cm', browband: '52–56 cm', noseband: '40–44 cm', cheekpieces: '46–52 cm' },
];

const RUG_SIZES = [
  { size: '4\'3"', cm: '130 cm', back: '111 cm', chest: '120 cm', breeds: 'Small pony' },
  { size: '4\'6"', cm: '137 cm', back: '120 cm', chest: '128 cm', breeds: 'Medium pony' },
  { size: '4\'9"', cm: '145 cm', back: '127 cm', chest: '136 cm', breeds: 'Large pony / small cob' },
  { size: '5\'0"', cm: '152 cm', back: '134 cm', chest: '142 cm', breeds: 'Cob' },
  { size: '5\'3"', cm: '160 cm', back: '140 cm', chest: '150 cm', breeds: 'Small TB / WB' },
  { size: '5\'6"', cm: '167 cm', back: '147 cm', chest: '158 cm', breeds: 'TB / Warm Blood' },
  { size: '5\'9"', cm: '175 cm', back: '154 cm', chest: '166 cm', breeds: 'Large WB' },
  { size: '6\'0"', cm: '183 cm', back: '161 cm', chest: '174 cm', breeds: 'XL WB / Draught' },
  { size: '6\'3"', cm: '191 cm', back: '168 cm', chest: '182 cm', breeds: 'XXL / Draught' },
];

const BOOT_SIZES = [
  { size: 'XS', canon: '< 19 cm',  fits: 'Small pony, fine-boned' },
  { size: 'S',  canon: '19–21 cm', fits: 'Pony / small cob' },
  { size: 'M',  canon: '21–23 cm', fits: 'Cob / average horse' },
  { size: 'L',  canon: '23–25 cm', fits: 'Warmblood / TB' },
  { size: 'XL', canon: '25–28 cm', fits: 'Large WB / Draught cross' },
];

const thStyle: React.CSSProperties = { textAlign: 'left', padding: '10px 14px', fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#f5f3ef', borderBottom: '1px solid #e8e4de' };
const tdStyle: React.CSSProperties = { padding: '11px 14px', fontSize: 13.5, color: '#333', borderBottom: '1px solid #f0ece7' };

export default function SizingGuidePage() {
  return (
    <main style={{ minHeight: '100vh', background: '#faf9f7' }}>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2017 100%)', color: '#fff', padding: 'clamp(56px, 7vw, 88px) 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: '#C8860A', fontWeight: 700, marginBottom: 14 }}>Fit Guide</p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.02em' }}>Sizing Guide</h1>
        <p style={{ fontSize: 16, color: '#aaa', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
          Correct fit is critical for comfort and performance. Use these charts alongside our configurator to select the right size for every product.
        </p>
      </section>

      {/* Jump links */}
      <section style={{ background: '#fff', borderBottom: '1px solid #e8e4de' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '14px 24px', display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Bridles & Browbands', 'Horse Rugs', 'Leg Boots', 'How to Measure'].map(s => (
            <a key={s} href={`#${s.replace(/\s+&\s+|\s+/g, '-').toLowerCase()}`}
              style={{ fontSize: 13, fontWeight: 600, color: '#555', padding: '5px 14px', borderRadius: 20, background: '#f5f5f5', textDecoration: 'none', border: '1px solid #e8e4de' }}>
              {s}
            </a>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(40px, 5vw, 64px) 24px' }}>

        {/* Bridles */}
        <div id="bridles-browbands" style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>Bridles & Browbands</h2>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 20, lineHeight: 1.7 }}>
            Measure with a soft tape. Sizes listed are the adjustable range. When between sizes, choose the larger.
          </p>
          <div style={{ background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Size', 'Headpiece', 'Browband', 'Noseband', 'Cheekpieces'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {BRIDLE_SIZES.map((r, i) => (
                  <tr key={r.size} style={{ background: i % 2 === 1 ? '#faf9f7' : '#fff' }}>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#C8860A' }}>{r.size}</td>
                    <td style={tdStyle}>{r.headpiece}</td>
                    <td style={tdStyle}>{r.browband}</td>
                    <td style={tdStyle}>{r.noseband}</td>
                    <td style={tdStyle}>{r.cheekpieces}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 12, color: '#999', marginTop: 10 }}>* All measurements are total length of leather on the buckle holes.</p>
        </div>

        {/* Rugs */}
        <div id="horse-rugs" style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>Horse Rugs</h2>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 20, lineHeight: 1.7 }}>
            Rug size is measured from the centre of the chest to the tail (back length). Measure along the horse's back, not beneath the belly.
          </p>
          <div style={{ background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Size (ft)', 'Size (cm)', 'Back length', 'Chest width', 'Typical breed'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {RUG_SIZES.map((r, i) => (
                  <tr key={r.size} style={{ background: i % 2 === 1 ? '#faf9f7' : '#fff' }}>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#C8860A' }}>{r.size}</td>
                    <td style={tdStyle}>{r.cm}</td>
                    <td style={tdStyle}>{r.back}</td>
                    <td style={tdStyle}>{r.chest}</td>
                    <td style={tdStyle}>{r.breeds}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Boots */}
        <div id="leg-boots" style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>Leg Boots</h2>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 20, lineHeight: 1.7 }}>
            Measure the circumference of the cannon bone at its widest point with a soft tape.
          </p>
          <div style={{ background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Size', 'Cannon circumference', 'Typical fit'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {BOOT_SIZES.map((r, i) => (
                  <tr key={r.size} style={{ background: i % 2 === 1 ? '#faf9f7' : '#fff' }}>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#C8860A' }}>{r.size}</td>
                    <td style={tdStyle}>{r.canon}</td>
                    <td style={tdStyle}>{r.fits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* How to measure */}
        <div id="how-to-measure" style={{ background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 16, padding: 'clamp(24px, 3vw, 36px)', marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', marginBottom: 20 }}>How to Measure</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {[
              { title: 'Headpiece / Bridle', steps: ['Use a soft tape measure', 'Measure over the poll from cheek ring to cheek ring', 'Add 4 cm for buckle adjustment range'] },
              { title: 'Rug Back Length', steps: ["Start from the centre of the chest", 'Measure along the back following the spine', 'End at the base of the tail', 'Do not measure under the belly'] },
              { title: 'Cannon Bone', steps: ['Have the horse standing square', 'Use a soft tape around the cannon', 'Measure at the widest point (middle third)', 'Front and hind cannons may differ'] },
            ].map(m => (
              <div key={m.title}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>{m.title}</p>
                <ol style={{ margin: 0, paddingLeft: 18 }}>
                  {m.steps.map(s => <li key={s} style={{ fontSize: 13.5, color: '#555', lineHeight: 1.7, marginBottom: 4 }}>{s}</li>)}
                </ol>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: '#1a1a1a', borderRadius: 16, padding: 'clamp(24px, 3vw, 36px)', textAlign: 'center', color: '#fff' }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>Not sure what size to order?</h3>
          <p style={{ color: '#888', fontSize: 14, marginBottom: 20 }}>Our team can advise — just share your horse's measurements.</p>
          <Link href="/contact" style={{ background: '#C8860A', color: '#fff', fontWeight: 700, padding: '11px 24px', borderRadius: 8, textDecoration: 'none', fontSize: 14, display: 'inline-block' }}>
            Ask a sizing question
          </Link>
        </div>

      </section>
    </main>
  );
}
