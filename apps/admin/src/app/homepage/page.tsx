'use client';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Save, Check, Eye, RefreshCw, Layout, Sparkles, MessageSquare, Building2, Star } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
function hdrs() { return { Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` }; }

// ─── Default content ──────────────────────────────────────────────────────────

const DEFAULT: HomeContent = {
  hero: {
    badge: 'Premium Saddlery',
    headline: 'Fully Customised. Handcrafted. Delivered.',
    subheading: 'Design your perfect bridle, browband, or halter with our step-by-step configurator. Premium leather, your colours, your hardware. Direct from our workshop.',
    ctaText: 'Design Your Own',
    ctaUrl: '/design-your-own',
    secondaryCtaText: 'Browse Products',
    secondaryCtaUrl: '/products/for-horses',
    footnote: 'B2B from 5 units · Free shipping over €150 · 21-day lead time',
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface Hero {
  badge: string;
  headline: string;
  subheading: string;
  ctaText: string;
  ctaUrl: string;
  secondaryCtaText: string;
  secondaryCtaUrl: string;
  footnote: string;
}

interface FeatureCard { title: string; description: string; }

interface ConfiguratorCta { headline: string; subtext: string; ctaText: string; ctaUrl: string; }

interface B2bBanner { headline: string; subtext: string; ctaText: string; ctaUrl: string; }

interface HomeContent {
  hero: Hero;
  features: FeatureCard[];
  configuratorCta: ConfiguratorCta;
  b2bBanner: B2bBanner;
}

// ─── Reusable field components ────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, multiline = false, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; hint?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
      {multiline ? (
        <textarea
          value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1A3C5E] resize-y"
        />
      ) : (
        <input
          type="text" value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#1A3C5E]"
        />
      )}
    </div>
  );
}

function SectionCard({ icon: Icon, title, color, children }: {
  icon: any; title: string; color: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={`flex items-center gap-2 px-5 py-3 border-b border-gray-100 ${color}`}>
        <Icon size={16} />
        <h2 className="font-semibold text-sm">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HomepagePage() {
  const [pageId, setPageId] = useState<string | null>(null);
  const [content, setContent] = useState<HomeContent>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/content/admin/pages`, { headers: hdrs() });
      const pages: any[] = res.data || [];
      const home = pages.find((p: any) => p.slug === 'home');
      if (home) {
        setPageId(home.id);
        try {
          const parsed = typeof home.content === 'string' ? JSON.parse(home.content) : home.content;
          setContent({ ...DEFAULT, ...parsed });
        } catch { setContent(DEFAULT); }
      }
    } catch { /* keep defaults */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const body = { slug: 'home', title: 'Home Page', content: JSON.stringify(content), isPublished: true };
      if (pageId) {
        await axios.patch(`${API}/content/admin/pages/${pageId}`, body, { headers: hdrs() });
      } else {
        const res = await axios.post(`${API}/content/admin/pages`, body, { headers: hdrs() });
        setPageId(res.data.id);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  }

  function setHero(patch: Partial<Hero>) {
    setContent(c => ({ ...c, hero: { ...c.hero, ...patch } }));
  }

  function setFeature(i: number, patch: Partial<FeatureCard>) {
    setContent(c => {
      const features = [...c.features];
      features[i] = { ...features[i], ...patch };
      return { ...c, features };
    });
  }

  function setCta(patch: Partial<ConfiguratorCta>) {
    setContent(c => ({ ...c, configuratorCta: { ...c.configuratorCta, ...patch } }));
  }

  function setB2b(patch: Partial<B2bBanner>) {
    setContent(c => ({ ...c, b2bBanner: { ...c.b2bBanner, ...patch } }));
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-gray-400">Loading…</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Home Page Editor</h1>
          <p className="text-sm text-gray-500 mt-1">
            Edit all sections of the website home page.
            {!pageId && <span className="ml-1 text-amber-600 font-medium">Not yet saved — click Save to create.</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href="http://52.49.206.184:3000" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Eye size={14} /> Preview
          </a>
          <button type="button" onClick={load} title="Reload from server"
            className="p-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg">
            <RefreshCw size={14} />
          </button>
          <button
            type="button" onClick={save} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A3C5E] text-white text-sm font-semibold rounded-lg hover:bg-[#112E4D] disabled:opacity-50"
          >
            {saved ? <><Check size={14} /> Saved!</> : saving ? 'Saving…' : <><Save size={14} /> Save Page</>}
          </button>
        </div>
      </div>

      {/* Info note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
        <strong>Note:</strong> The <strong>Promo Bar</strong> and <strong>Hero Banner</strong> image/text can also be managed under{' '}
        <a href="/content" className="underline font-medium">Content → Banners & Hero Images</a>.
        Categories shown in the "Shop by Category" grid are managed under{' '}
        <a href="/categories" className="underline font-medium">Categories</a>.
      </div>

      {/* ── 1. Hero ─────────────────────────────────────────────────────────── */}
      <SectionCard icon={Layout} title="Hero Section" color="bg-gray-50 text-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Badge / Eyebrow text" value={content.hero.badge} onChange={v => setHero({ badge: v })} placeholder="Premium Saddlery" />
          <Field label="Footnote (below CTAs)" value={content.hero.footnote} onChange={v => setHero({ footnote: v })} placeholder="B2B from 5 units · Free shipping…" />
        </div>
        <Field label="Main Headline" value={content.hero.headline} onChange={v => setHero({ headline: v })} placeholder="Fully Customised. Handcrafted. Delivered." />
        <Field label="Subheading / Description" value={content.hero.subheading} onChange={v => setHero({ subheading: v })} multiline placeholder="Design your perfect bridle…" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Primary CTA text" value={content.hero.ctaText} onChange={v => setHero({ ctaText: v })} placeholder="Design Your Own" />
          <Field label="Primary CTA URL" value={content.hero.ctaUrl} onChange={v => setHero({ ctaUrl: v })} placeholder="/design-your-own" />
          <Field label="Secondary CTA text" value={content.hero.secondaryCtaText} onChange={v => setHero({ secondaryCtaText: v })} placeholder="Browse Products" />
          <Field label="Secondary CTA URL" value={content.hero.secondaryCtaUrl} onChange={v => setHero({ secondaryCtaUrl: v })} placeholder="/products/for-horses" />
        </div>
      </SectionCard>

      {/* ── 2. Feature cards ─────────────────────────────────────────────────── */}
      <SectionCard icon={Star} title="Features / USP Section (3 cards)" color="bg-amber-50 text-amber-700">
        <p className="text-xs text-gray-400">These three cards appear below the Shop by Category grid.</p>
        {content.features.map((f, i) => (
          <div key={i} className="p-4 bg-gray-50 rounded-xl space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Card {i + 1}</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Title" value={f.title} onChange={v => setFeature(i, { title: v })} placeholder="Fully Customisable" />
              <Field label="Description" value={f.description} onChange={v => setFeature(i, { description: v })} placeholder="…" />
            </div>
          </div>
        ))}
      </SectionCard>

      {/* ── 3. Configurator CTA ──────────────────────────────────────────────── */}
      <SectionCard icon={Sparkles} title="Configurator CTA Section" color="bg-purple-50 text-purple-700">
        <p className="text-xs text-gray-400">The dark section inviting customers to start the configurator.</p>
        <Field label="Headline" value={content.configuratorCta.headline} onChange={v => setCta({ headline: v })} placeholder="Design Your Perfect Bridle" />
        <Field label="Subtext" value={content.configuratorCta.subtext} onChange={v => setCta({ subtext: v })} multiline />
        <div className="grid grid-cols-2 gap-4">
          <Field label="CTA button text" value={content.configuratorCta.ctaText} onChange={v => setCta({ ctaText: v })} placeholder="Start Configuring" />
          <Field label="CTA button URL" value={content.configuratorCta.ctaUrl} onChange={v => setCta({ ctaUrl: v })} placeholder="/design-your-own" />
        </div>
      </SectionCard>

      {/* ── 4. B2B Banner ────────────────────────────────────────────────────── */}
      <SectionCard icon={Building2} title="B2B Banner" color="bg-green-50 text-green-700">
        <p className="text-xs text-gray-400">The dark strip at the bottom of the home page.</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Headline" value={content.b2bBanner.headline} onChange={v => setB2b({ headline: v })} placeholder="B2B" />
          <Field label="Subtext" value={content.b2bBanner.subtext} onChange={v => setB2b({ subtext: v })} placeholder="Volume discounts…" />
          <Field label="Button text" value={content.b2bBanner.ctaText} onChange={v => setB2b({ ctaText: v })} placeholder="Apply for B2B" />
          <Field label="Button URL" value={content.b2bBanner.ctaUrl} onChange={v => setB2b({ ctaUrl: v })} placeholder="/wholesale" />
        </div>
      </SectionCard>

      {/* ── 5. Promo bar note ─────────────────────────────────────────────────── */}
      <SectionCard icon={MessageSquare} title="Promo Bar (top announcement)" color="bg-orange-50 text-orange-700">
        <p className="text-sm text-gray-600">
          The top announcement bar is managed as a <strong>Banner</strong> with position <code className="bg-gray-100 rounded px-1">promo</code>.
        </p>
        <a href="/content" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#1A3C5E] border border-[#1A3C5E] rounded-lg hover:bg-blue-50">
          → Go to Banners Editor
        </a>
      </SectionCard>

      {/* Save button (bottom) */}
      <div className="flex justify-end pb-8">
        <button
          type="button" onClick={save} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#1A3C5E] text-white text-sm font-semibold rounded-lg hover:bg-[#112E4D] disabled:opacity-50"
        >
          {saved ? <><Check size={14} /> Saved!</> : saving ? 'Saving…' : <><Save size={14} /> Save All Changes</>}
        </button>
      </div>
    </div>
  );
}
