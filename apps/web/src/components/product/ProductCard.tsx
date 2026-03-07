'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Palette } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import type { ProductDto } from '@blikcart/types';

interface Props {
  product: ProductDto;
  isWholesale?: boolean;
}

export default function ProductCard({ product, isWholesale }: Props) {
  const { addItem, isLoading } = useCartStore();
  const price = isWholesale && product.wholesalePrice ? product.wholesalePrice : product.basePrice;
  const primaryImage = product.images?.find(i => i.isPrimary) || product.images?.[0];

  return (
    <div className="card group">
      <Link href={`/products/${product.slug}`} className="relative block overflow-hidden aspect-square bg-cream">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.altText || product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <span className="text-6xl">🐴</span>
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          {product.isCustomizable && (
            <span className="bg-gold text-white text-xs px-2 py-0.5 rounded-full font-semibold">
              🎨 Customizable
            </span>
          )}
          {isWholesale && (
            <span className="bg-navy text-white text-xs px-2 py-0.5 rounded-full font-semibold">
              Wholesale
            </span>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-navy hover:text-gold transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2 flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-navy">€{price.toFixed(2)}</span>
            {isWholesale && product.moq > 1 && (
              <span className="text-xs text-gray-500 ml-1">MOQ {product.moq}</span>
            )}
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          {product.isCustomizable ? (
            <>
              <button
                onClick={() => addItem(product.id, product.moq)}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 border border-navy text-navy py-2 text-sm rounded hover:bg-navy hover:text-white transition-colors"
              >
                <ShoppingCart size={14} />
                Add
              </button>
              <Link
                href={`/customize/${product.category.slug}?productId=${product.id}`}
                className="flex-1 flex items-center justify-center gap-2 bg-gold text-white py-2 text-sm rounded hover:bg-gold-600 transition-colors font-semibold"
              >
                <Palette size={14} />
                Customize
              </Link>
            </>
          ) : (
            <button
              onClick={() => addItem(product.id, 1)}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-navy text-white py-2 text-sm rounded hover:bg-navy-700 transition-colors"
            >
              <ShoppingCart size={14} />
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
