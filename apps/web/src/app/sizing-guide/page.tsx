import Link from 'next/link';
import { fetchPageContent } from '@/lib/fetchPageContent';

const DEFAULT = {
  hero: {
    eyebrow: 'Fit Guide',
    title: 'Sizing Guide',
    subtitle: 'Correct fit is critical for comfort and performance. Use these charts alongside our configurator to select the right size for every product.',
  },
  bridleSizesTitle: 'Bridles & Browbands',
  bridleSizesSubtitle: 'Measure with a soft tape. Sizes listed are the adjustable range. When between sizes, choose the larger.',
  rugSizesTitle: 'Horse Rugs',
  rugSizesSubtitle: 'Rug size is measured from the centre of the chest to the tail (back length). Measure along the horse\'s back, not beneath the belly.',
  headCollarSizesTitle: 'Head Collars & Halters',
  headCollarSizesSubtitle: 'Measure around the nose at the widest point (noseband), and over the poll from ring to ring (headpiece). All sizes are adjustable within the stated range.',
  saddlePadSizesTitle: 'Saddle Pads & Numnahs',
  saddlePadSizesSubtitle: 'Saddle pad size should match your saddle seat size. Measure spine length from front of pad to back edge along the centre channel. When between sizes, size up.',
  howToMeasureTitle: 'How to Measure',
  bridleSizes: [
    { size: 'Pony',    headpiece: '50–55 cm', browband: '35–40 cm', noseband: '35–40 cm', cheekpieces: '35–40 cm' },
    { size: 'Cob',     headpiece: '55–59 cm', browband: '40–44 cm', noseband: '40–44 cm', cheekpieces: '40–44 cm' },
    { size: 'Full',    headpiece: '65–69 cm', browband: '45–49 cm', noseband: '45–49 cm', cheekpieces: '45–49 cm' },
    { size: 'Full XL', headpiece: '75–79 cm', browband: '50–54 cm', noseband: '50–54 cm', cheekpieces: '50–54 cm' },
  ],
  bridleNote: '* All measurements are total length of leather on the buckle holes.',
  rugSizes: [
    { size: "4'3\"", cm: '130 cm', back: '111 cm', chest: '120 cm', breeds: 'Small pony' },
    { size: "4'6\"", cm: '137 cm', back: '120 cm', chest: '128 cm', breeds: 'Medium pony' },
    { size: "4'9\"", cm: '145 cm', back: '127 cm', chest: '136 cm', breeds: 'Large pony / small cob' },
    { size: "5'0\"", cm: '152 cm', back: '134 cm', chest: '142 cm', breeds: 'Cob' },
    { size: "5'3\"", cm: '160 cm', back: '140 cm', chest: '150 cm', breeds: 'Small TB / WB' },
    { size: "5'6\"", cm: '167 cm', back: '147 cm', chest: '158 cm', breeds: 'TB / Warm Blood' },
    { size: "5'9\"", cm: '175 cm', back: '154 cm', chest: '166 cm', breeds: 'Large WB' },
    { size: "6'0\"", cm: '183 cm', back: '161 cm', chest: '174 cm', breeds: 'XL WB / Draught' },
    { size: "6'3\"", cm: '191 cm', back: '168 cm', chest: '182 cm', breeds: 'XXL / Draught' },
  ],
  headCollarSizes: [
    { size: 'Foal',        noseband: '11–17 cm', headpiece: '18–28 cm', cheekpieces: '8–9 cm',   crown: '13–14 cm', fits: 'Miniature / newborn foal' },
    { size: 'MiniMini',    noseband: '14–20 cm', headpiece: '34–42 cm', cheekpieces: '9–10 cm',  crown: '16–18 cm', fits: 'Mini Mini' },
    { size: 'Mini',        noseband: '14–24 cm', headpiece: '38–46 cm', cheekpieces: '11–12 cm', crown: '19–20 cm', fits: 'Mini' },
    { size: 'Shet',        noseband: '17–28 cm', headpiece: '36–50 cm', cheekpieces: '12–13 cm', crown: '21–22 cm', fits: 'Shet' },
    { size: 'Pony',        noseband: '18–29 cm', headpiece: '30–51 cm', cheekpieces: '14–15 cm', crown: '24–25 cm', fits: 'Small to medium pony' },
    { size: 'Cob',         noseband: '20–30 cm', headpiece: '42–55 cm', cheekpieces: '16–17 cm', crown: '29–30 cm', fits: 'Large pony / cob' },
    { size: 'Full',        noseband: '25–35 cm', headpiece: '46–60 cm', cheekpieces: '18–19 cm', crown: '34–35 cm', fits: 'Average horse / TB' },
    { size: 'Full XL',     noseband: '52–58 cm', headpiece: '60–74 cm', cheekpieces: '38–42 cm', crown: '42–46 cm', fits: 'Warmblood / large draught' },
  ],
  headCollarNote: '* All leather headcollars are adjustable at the noseband and headpiece. Measurements are total strap length.',
  saddlePadSizes: [
    { size: 'Pony',       saddleSize: '12″ – 14″',   spineLength: '45 cm', panelWidth: '50 cm', overallWidth: '64 cm', fits: 'Pony saddles' },
    { size: 'Cob / Sml',  saddleSize: '14.5″ – 15.5″', spineLength: '48 cm', panelWidth: '55 cm', overallWidth: '70 cm', fits: 'Cob & small horse saddles' },
    { size: 'Full',       saddleSize: '16″ – 17″',   spineLength: '52 cm', panelWidth: '60 cm', overallWidth: '76 cm', fits: 'Standard horse saddles' },
    { size: 'Oversized',  saddleSize: '17.5″ – 18.5″', spineLength: '57 cm', panelWidth: '65 cm', overallWidth: '82 cm', fits: 'Large WB / draught saddles' },
  ],
  howToMeasure: [
    { title: 'Headpiece / Bridle', steps: ['Use a soft tape measure', 'Measure over the poll from cheek ring to cheek ring', 'Add 4 cm for buckle adjustment range'] },
    { title: 'Rug Back Length', steps: ['Start from the centre of the chest', 'Measure along the back following the spine', 'End at the base of the tail', 'Do not measure under the belly'] },
    { title: 'Head Collar / Halter', steps: ['Measure noseband circumference at the widest point of the nose', 'Measure headpiece from ring to ring over the poll', 'All our head collars are fully adjustable — when between sizes, choose the larger'] },
    { title: 'Saddle Pad', steps: ['Measure the saddle seat size (pommel to cantle)', 'Select the matching pad size from the table above', 'Our pads have a generous spine channel — if in doubt, size up for clearance'] },
  ],
  cta: {
    title: 'Not sure what size to order?',
    body: "Our team can advise — just share your horse's measurements.",
  },
};

const thStyle: React.CSSProperties = { textAlign: 'left', padding: '10px 14px', fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#f5f3ef', borderBottom: '1px solid #e8e4de' };
const tdStyle: React.CSSProperties = { padding: '11px 14px', fontSize: 13.5, color: '#333', borderBottom: '1px solid #f0ece7' };

export default async function SizingGuidePage() {
  const content = await fetchPageContent('sizing-guide', DEFAULT);

  return (
    <main style={{ minHeight: '100vh', background: '#faf9f7' }}>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2017 100%)', color: '#fff', padding: 'clamp(56px, 7vw, 88px) 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: '#C8860A', fontWeight: 700, marginBottom: 14 }}>{content.hero.eyebrow}</p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.02em' }}>{content.hero.title}</h1>
        <p style={{ fontSize: 16, color: '#aaa', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
          {content.hero.subtitle}
        </p>
      </section>

      {/* Jump links */}
      <section style={{ background: '#fff', borderBottom: '1px solid #e8e4de' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '14px 24px', display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Bridles & Browbands', 'Horse Rugs', 'Head Collars & Halters', 'Saddle Pads & Numnahs', 'How to Measure'].map(s => (
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
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>{content.bridleSizesTitle || DEFAULT.bridleSizesTitle}</h2>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 20, lineHeight: 1.7 }}>
            {content.bridleSizesSubtitle || DEFAULT.bridleSizesSubtitle}
          </p>
          <div style={{ background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Size', 'Headpiece', 'Browband', 'Noseband', 'Cheekpieces'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {content.bridleSizes.map((r: any, i: number) => (
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
          <p style={{ fontSize: 12, color: '#999', marginTop: 10 }}>{content.bridleNote}</p>
        </div>

        {/* Rugs */}
        <div id="horse-rugs" style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>{content.rugSizesTitle || DEFAULT.rugSizesTitle}</h2>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 20, lineHeight: 1.7 }}>
            {content.rugSizesSubtitle || DEFAULT.rugSizesSubtitle}
          </p>
          <div style={{ background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Size (ft)', 'Size (cm)', 'Back length', 'Chest width', 'Typical breed'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {content.rugSizes.map((r: any, i: number) => (
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

        {/* Head Collars */}
        <div id="head-collars-halters" style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>{content.headCollarSizesTitle || DEFAULT.headCollarSizesTitle}</h2>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 20, lineHeight: 1.7 }}>
            {content.headCollarSizesSubtitle || DEFAULT.headCollarSizesSubtitle}
          </p>
          <div style={{ background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Size', 'Noseband', 'Headpiece', 'Cheekpieces', 'Crown', 'Typical fit'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {(content.headCollarSizes || DEFAULT.headCollarSizes).map((r: any, i: number) => (
                  <tr key={r.size} style={{ background: i % 2 === 1 ? '#faf9f7' : '#fff' }}>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#C8860A' }}>{r.size}</td>
                    <td style={tdStyle}>{r.noseband}</td>
                    <td style={tdStyle}>{r.headpiece}</td>
                    <td style={tdStyle}>{r.cheekpieces}</td>
                    <td style={tdStyle}>{r.crown}</td>
                    <td style={tdStyle}>{r.fits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(content.headCollarNote || DEFAULT.headCollarNote) && (
            <p style={{ fontSize: 12, color: '#999', marginTop: 10 }}>{content.headCollarNote || DEFAULT.headCollarNote}</p>
          )}
        </div>

        {/* Saddle Pads & Numnahs */}
        <div id="saddle-pads-numnahs" style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>{content.saddlePadSizesTitle || DEFAULT.saddlePadSizesTitle}</h2>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 20, lineHeight: 1.7 }}>
            {content.saddlePadSizesSubtitle || DEFAULT.saddlePadSizesSubtitle}
          </p>
          <div style={{ background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Size', 'Saddle size', 'Spine length', 'Panel width', 'Overall width', 'Fits'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {(content.saddlePadSizes || DEFAULT.saddlePadSizes).map((r: any, i: number) => (
                  <tr key={r.size} style={{ background: i % 2 === 1 ? '#faf9f7' : '#fff' }}>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#C8860A' }}>{r.size}</td>
                    <td style={tdStyle}>{r.saddleSize}</td>
                    <td style={tdStyle}>{r.spineLength}</td>
                    <td style={tdStyle}>{r.panelWidth}</td>
                    <td style={tdStyle}>{r.overallWidth}</td>
                    <td style={tdStyle}>{r.fits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* How to measure */}
        <div id="how-to-measure" style={{ background: '#fff', border: '1.5px solid #e8e4de', borderRadius: 16, padding: 'clamp(24px, 3vw, 36px)', marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', marginBottom: 20 }}>{content.howToMeasureTitle || DEFAULT.howToMeasureTitle}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {content.howToMeasure.map((m: any) => (
              <div key={m.title}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>{m.title}</p>
                <ol style={{ margin: 0, paddingLeft: 18 }}>
                  {(m.steps || []).map((s: string) => <li key={s} style={{ fontSize: 13.5, color: '#555', lineHeight: 1.7, marginBottom: 4 }}>{s}</li>)}
                </ol>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: '#1a1a1a', borderRadius: 16, padding: 'clamp(24px, 3vw, 36px)', textAlign: 'center', color: '#fff' }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>{content.cta.title}</h3>
          <p style={{ color: '#888', fontSize: 14, marginBottom: 20 }}>{content.cta.body}</p>
          <Link href="/contact" style={{ background: '#C8860A', color: '#fff', fontWeight: 700, padding: '11px 24px', borderRadius: 8, textDecoration: 'none', fontSize: 14, display: 'inline-block' }}>
            Ask a sizing question
          </Link>
        </div>

      </section>
    </main>
  );
}
