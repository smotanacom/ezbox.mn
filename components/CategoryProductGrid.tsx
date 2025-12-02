'use client';

import Link from 'next/link';
import Image from '@/components/Image';
import { getCategoryImageUrl } from '@/lib/storage-client';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
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

  // Filter out categories with no visible products
  const categoriesWithProducts = categories.filter(cat => {
    const products = productsByCategory[cat.id] || [];
    return products.length > 0;
  });

  return (
    <section className="py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          {t('home.categories.title')}
        </h2>

        {/* Mobile: Horizontal scroll */}
        <div className="lg:hidden">
          <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
            <div className="flex gap-4 min-w-min pb-2">
              {categoriesWithProducts.map((category) => {
                const products = productsByCategory[category.id] || [];
                return (
                  <Link
                    key={category.id}
                    href={`/products?category=${category.id}`}
                    prefetch={false}
                    className="flex-shrink-0 w-28 flex flex-col items-center group"
                  >
                    <div className="w-28 h-28 relative rounded-xl overflow-hidden mb-2 shadow-md group-hover:shadow-lg transition-all group-hover:ring-2 group-hover:ring-primary">
                      <Image
                        src={category.picture_url ? getCategoryImageUrl(category.picture_url) : null}
                        alt={category.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 text-center group-hover:text-primary transition-colors line-clamp-2">
                      {category.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {products.length} {t('category.products-text')}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Desktop: Grid */}
        <div className="hidden lg:grid lg:grid-cols-6 gap-4">
          {categoriesWithProducts.map((category) => {
            const products = productsByCategory[category.id] || [];
            return (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                prefetch={false}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-4 border border-gray-200 hover:border-primary group"
              >
                <div className="aspect-square relative rounded-lg overflow-hidden mb-3">
                  <Image
                    src={category.picture_url ? getCategoryImageUrl(category.picture_url) : null}
                    alt={category.name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                  />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1 truncate group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {products.length} {t('category.products-text')}
                  </p>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
