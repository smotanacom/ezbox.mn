'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from '@/components/Image';
import { ChevronDown, MoreHorizontal } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import type { Category, Product } from '@/types/database';

interface CategoryProductGridProps {
  categories: Category[];
  productsByCategory: Record<number, Product[]>;
}

export default function CategoryProductGrid({
  categories,
  productsByCategory
}: CategoryProductGridProps) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const handleCategoryClick = (categoryId: number) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 lg:items-end">
          {categories.map((category) => {
            const products = productsByCategory[category.id] || [];
            const displayProducts = products.slice(0, 4);
            const hasMore = products.length > 4;
            const isSelected = selectedCategory === category.id;

            return (
              <div key={category.id} className="relative flex flex-col">
                {/* Category Card */}
                <button
                  onClick={() => handleCategoryClick(category.id)}
                  className={`w-full bg-white rounded-lg shadow-md hover:shadow-xl transition-all p-6 border-2 flex flex-col ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-transparent hover:border-primary/30'
                  }`}
                >
                  <div className="aspect-square relative rounded-lg overflow-hidden mb-4">
                    <Image
                      src={category.picture_url}
                      alt={category.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 flex-1">
                    {category.description || t('category.browse-products').replace('{count}', products.length.toString())}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-primary font-semibold">
                    <span>{isSelected ? t('category.hide') : t('category.view')} {t('category.products-text')}</span>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform ${
                        isSelected ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Connection Line (Desktop only) */}
                {isSelected && displayProducts.length > 0 && (
                  <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 bottom-0 w-0.5 bg-primary h-8 translate-y-full z-0" />
                )}

                {/* Products Grid (appears below on mobile, in row on desktop) */}
                {isSelected && displayProducts.length > 0 && (
                  <>
                    {/* Mobile: Products appear directly below */}
                    <div className="lg:hidden mt-4 space-y-3">
                      {displayProducts.map((product) => (
                        <Link
                          key={product.id}
                          href={`/products?category=${category.id}&autoAdd=${product.id}`}
                          className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-all p-4 border border-gray-200 hover:border-primary"
                        >
                          <div className="flex gap-4">
                            <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                              <Image
                                src={product.picture_url}
                                alt={product.name}
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate mb-1">
                                {product.name}
                              </h4>
                              <p className="text-lg font-bold text-primary">
                                ₮{product.base_price.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                      {hasMore && (
                        <Link
                          href={`/products?category=${category.id}`}
                          className="block bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg shadow-sm hover:shadow-md transition-all p-4 border border-primary/20 hover:border-primary text-center"
                        >
                          <div className="flex items-center justify-center gap-2 text-primary font-semibold">
                            <MoreHorizontal className="h-5 w-5" />
                            <span>{t('category.view-all').replace('{count}', products.length.toString())}</span>
                          </div>
                        </Link>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop: Products Row (appears below all categories) */}
        {selectedCategory && (
          <div className="hidden lg:block">
            {(() => {
              const category = categories.find(c => c.id === selectedCategory);
              if (!category) return null;

              const products = productsByCategory[selectedCategory] || [];
              const displayProducts = products.slice(0, 4);
              const hasMore = products.length > 4;

              return (
                <div className="mt-8 pt-8 border-t-2 border-primary/20">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {category.name} {t('category.products-text')}
                    </h3>
                  </div>

                  <div className="flex gap-6 items-stretch">
                    <div className="grid grid-cols-4 gap-6 flex-1">
                      {displayProducts.map((product) => (
                        <Link
                          key={product.id}
                          href={`/products?category=${selectedCategory}&autoAdd=${product.id}`}
                          className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden border border-gray-200 hover:border-primary"
                        >
                          <div className="w-[70%] aspect-square relative mx-auto mt-4">
                            <Image
                              src={product.picture_url}
                              alt={product.name}
                              className="object-cover w-full h-full rounded-lg"
                            />
                          </div>
                          <div className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-2 truncate">
                              {product.name}
                            </h4>
                            <p className="text-xl font-bold text-primary">
                              ₮{product.base_price.toLocaleString()}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* More Indicator on the Right */}
                    {hasMore && (
                      <Link
                        href={`/products?category=${selectedCategory}`}
                        className="flex-shrink-0 w-48 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg shadow-md hover:shadow-xl transition-all border-2 border-primary/20 hover:border-primary flex flex-col items-center justify-center gap-4 p-6 group"
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
            })()}
          </div>
        )}
      </div>
    </section>
  );
}
