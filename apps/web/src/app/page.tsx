import Link from 'next/link';
import { ArrowRight, Leaf, Factory, Settings } from 'lucide-react';

const categories = [
  { name: 'Bridles', slug: 'bridles', emoji: '🐴', count: '12 styles' },
  { name: 'Browbands', slug: 'browbands', emoji: '✨', count: '8 styles' },
  { name: 'Halters', slug: 'halters', emoji: '🎯', count: '6 styles' },
  { name: 'Reins', slug: 'reins', emoji: '🔗', count: '9 styles' },
  { name: 'Girths', slug: 'girths', emoji: '⚡', count: '5 styles' },
  { name: 'Gloves', slug: 'gloves', emoji: '🧤', count: '4 styles' },
];

const features = [
  { icon: '🎨', title: 'Fully Customisable', desc: '9-step configurator with live price preview. Choose material, colour, hardware and more.' },
  { icon: '🌿', title: 'Eco-Friendly Options', desc: 'Bio-certified leather tanning. Sustainable packaging. Carbon-tracked shipping.' },
  { icon: '🏭', title: 'Direct from Manufacturer', desc: 'No middlemen. Better quality control. Competitive wholesale pricing from 5 units.' },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy to-navy-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-gold text-sm font-semibold uppercase tracking-widest mb-4">Premium Saddlery</p>
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
              Fully Customised.<br />
              <span className="text-gold">Handcrafted.</span><br />
              Delivered.
            </h1>
            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              Design your perfect bridle, browband, or halter with our step-by-step configurator. 
              Premium leather, your colours, your hardware. Direct from our workshop.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/customize/bridles" className="btn-primary flex items-center gap-2 justify-center">
                Design Your Own <ArrowRight size={16} />
              </Link>
              <Link href="/products/for-horses" className="btn-outline border-white text-white hover:bg-white hover:text-navy flex items-center gap-2 justify-center">
                Browse Products
              </Link>
            </div>
            <p className="text-gray-400 text-sm mt-6">Wholesale from 5 units · Free shipping over €150 · 21-day lead time</p>
          </div>
          <div className="relative">
            <div className="aspect-square bg-navy-800 rounded-2xl flex items-center justify-center text-9xl shadow-2xl">
              🐴
            </div>
            <div className="absolute -bottom-4 -right-4 bg-gold text-white rounded-xl px-4 py-3 shadow-lg">
              <p className="text-xs font-semibold">from</p>
              <p className="text-2xl font-bold">€38</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-cream">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-navy mb-2">Shop by Category</h2>
          <p className="text-gray-600 mb-8">All products available as standard or fully customised</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map(cat => (
              <Link
                key={cat.slug}
                href={`/products/${cat.slug}`}
                className="bg-white rounded-xl p-4 text-center hover:shadow-lg transition-shadow group border border-gray-100"
              >
                <div className="text-4xl mb-2">{cat.emoji}</div>
                <p className="font-semibold text-navy group-hover:text-gold transition-colors text-sm">{cat.name}</p>
                <p className="text-xs text-gray-500 mt-1">{cat.count}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Configurator CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-navy rounded-2xl p-10 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Design Your Perfect Bridle</h2>
            <p className="text-gray-300 mb-8 text-lg max-w-2xl mx-auto">
              Choose from 8 styles, 3 materials, 8 colours, 4 hardware finishes, padding options and more. 
              Real-time price as you configure.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-3xl mx-auto">
              {['Style', 'Material', 'Colour', 'Hardware', 'Padding', 'Stitching', 'Size', 'Delivery'].map((s, i) => (
                <div key={s} className="bg-navy-800 rounded-lg p-3">
                  <div className="text-gold font-bold text-lg">{i + 1}</div>
                  <div className="text-sm text-gray-300">{s}</div>
                </div>
              ))}
            </div>
            <Link href="/customize/bridles" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">
              Start Configuring <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-cream">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map(f => (
              <div key={f.title} className="bg-white rounded-xl p-6 border border-gray-100">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-navy mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wholesale Banner */}
      <section className="bg-gold py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-white">B2B & Wholesale</h2>
            <p className="text-white/80 mt-1">Volume discounts from 5 units. Dedicated account manager. Net-30 terms available.</p>
          </div>
          <Link href="/wholesale" className="bg-white text-gold font-bold px-8 py-3 rounded-lg hover:bg-cream transition-colors flex-shrink-0">
            Apply for Wholesale
          </Link>
        </div>
      </section>
    </>
  );
}
