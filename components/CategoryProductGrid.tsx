'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from '@/components/Image';
import { getFirstImageUrl } from '@/lib/storage-client';
import { MoreHorizontal, ShoppingCart, Eye } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import CategorySelector from '@/components/CategorySelector';
import type { Category, ProductWithDetails } from '@/types/database';

interface CategoryProductGridProps {
  categories: Category[];
  productsByCategory: Record<number, ProductWithDetails[]>;
}

export default function CategoryProductGrid({
  categories,
  productsByCategory
}: CategoryProductGridProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const renderMobileProducts = (categoryId: number, products: ProductWithDetails[]) => {
    const displayProducts = products.slice(0, 4);
    const hasMore = products.length > 4;

    return (
      <div className="lg:hidden mt-4 space-y-3">
        {displayProducts.map((product) => (
          <div
            key={product.id}
            onClick={() => router.push(`/products/${product.id}`)}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all p-4 border border-gray-200 hover:border-primary group cursor-pointer"
          >
            <div className="flex gap-4">
              <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                <Image
                  src={getFirstImageUrl(product.images || [])}
                  alt={product.name}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 truncate mb-1">
                    {product.name}
                  </h4>
                  <p className="text-lg font-bold text-primary">
                    ₮{product.base_price.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/products?category=${categoryId}&autoAdd=${product.id}`);
                    }}
                    className="flex items-center gap-1.5 text-sm text-white bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-md font-medium transition-colors"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>{t('products.add-to-cart')}</span>
                  </button>
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Eye className="h-3.5 w-3.5" />
                    <span>{t('category.view')}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {hasMore && (
          <Link
            href={`/products?category=${categoryId}`}
            className="block bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg shadow-sm hover:shadow-md transition-all p-4 border border-primary/20 hover:border-primary text-center"
            prefetch={false}
          >
            <div className="flex items-center justify-center gap-2 text-primary font-semibold">
              <MoreHorizontal className="h-5 w-5" />
              <span>{t('category.view-all').replace('{count}', products.length.toString())}</span>
            </div>
          </Link>
        )}
      </div>
    );
  };

  const renderDesktopProducts = (categoryId: number, products: ProductWithDetails[]) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return null;

    const displayProducts = products.slice(0, 4);
    const hasMore = products.length > 4;

    return (
      <div>
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            {category.name} {t('category.products-text')}
          </h3>
        </div>

        <div className="flex gap-6 items-stretch">
          <div className="grid grid-cols-4 gap-6 flex-1">
            {displayProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => router.push(`/products/${product.id}`)}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden border border-gray-200 hover:border-primary group flex flex-col cursor-pointer"
              >
                <div className="w-[70%] aspect-square relative mx-auto mt-4">
                  <Image
                    src={getFirstImageUrl(product.images || [])}
                    alt={product.name}
                    className="object-cover w-full h-full rounded-lg"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 truncate">
                      {product.name}
                    </h4>
                    <p className="text-xl font-bold text-primary mb-3">
                      ₮{product.base_price.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/products?category=${categoryId}&autoAdd=${product.id}`);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span className="text-sm">{t('products.add-to-cart')}</span>
                    </button>
                    <div className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 rounded-lg text-gray-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Eye className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* More Indicator on the Right */}
          {hasMore && (
            <Link
              href={`/products?category=${categoryId}`}
              className="flex-shrink-0 w-48 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg shadow-md hover:shadow-xl transition-all border-2 border-primary/20 hover:border-primary flex flex-col items-center justify-center gap-4 p-6 group"
              prefetch={false}
            >
              <MoreHorizontal className="h-12 w-12 text-primary group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900 mb-1">
                  {t('category.more').replace('{count}', (products.length - 4).toString())}
                </p>
                <p className="text-sm text-gray-600">
                  {t('category.view-all-products')}
                </p>
              </div>
            </Link>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CategorySelector
          categories={categories}
          productsByCategory={productsByCategory}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          renderMobileContent={renderMobileProducts}
          renderDesktopContent={renderDesktopProducts}
        />
      </div>
    </section>
  );
}
