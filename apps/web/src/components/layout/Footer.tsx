import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-navy text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-white font-bold text-lg mb-3">BLIKCART</h3>
          <p className="text-sm leading-relaxed">Premium saddlery, fully customised. Direct from manufacturer to your stable.</p>
          <p className="text-sm mt-3 text-gray-500">blikcart.nl</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Shop</h4>
          <ul className="space-y-2 text-sm">
            {['Bridles', 'Browbands', 'Halters', 'Reins', 'Girths'].map(l => (
              <li key={l}><Link href={`/products/${l.toLowerCase()}`} className="hover:text-gold transition-colors">{l}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Business</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/wholesale" className="hover:text-gold transition-colors">Wholesale</Link></li>
            <li><Link href="/custom-orders" className="hover:text-gold transition-colors">Custom Orders</Link></li>
            <li><Link href="/b2b" className="hover:text-gold transition-colors">B2B Portal</Link></li>
            <li><Link href="/price-lists" className="hover:text-gold transition-colors">Price Lists</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Support</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/sizing-guide" className="hover:text-gold transition-colors">Sizing Guide</Link></li>
            <li><Link href="/faq" className="hover:text-gold transition-colors">FAQ</Link></li>
            <li><Link href="/contact" className="hover:text-gold transition-colors">Contact Us</Link></li>
            <li><Link href="/returns" className="hover:text-gold transition-colors">Returns</Link></li>
          </ul>
          <a href="mailto:support@blikcart.nl" className="text-sm mt-4 block hover:text-gold transition-colors">support@blikcart.nl</a>
        </div>
      </div>
      <div className="border-t border-navy-700 py-4">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} Blikcart B.V. · KvK 12345678 · BTW NL123456789B01</span>
          <Link href="/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-gold transition-colors">Terms & Conditions</Link>
        </div>
      </div>
    </footer>
  );
}
