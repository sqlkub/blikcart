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
            {['Wholesale', 'Custom Orders', 'B2B Portal', 'Price Lists'].map(l => (
              <li key={l}><Link href="#" className="hover:text-gold transition-colors">{l}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Support</h4>
          <ul className="space-y-2 text-sm">
            {['Sizing Guide', 'FAQ', 'Contact Us', 'Returns'].map(l => (
              <li key={l}><Link href="#" className="hover:text-gold transition-colors">{l}</Link></li>
            ))}
          </ul>
          <p className="text-sm mt-4">support@blikcart.nl</p>
        </div>
      </div>
      <div className="border-t border-navy-700 py-4">
        <p className="text-center text-xs text-gray-500">© {new Date().getFullYear()} Blikcart B.V. · KvK 12345678 · VAT NL123456789B01</p>
      </div>
    </footer>
  );
}
