'use client';

import Image from '@/components/Image';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import { getCategoryImageUrl } from '@/lib/storage-client';
import type { Category, Product } from '@/types/database';

interface CategorySelectorProps {
  categories: Category[];
  productsByCategory: Record<number, Product[]>;
  selectedCategory: number | null;
  onCategorySelect: (categoryId: number | null) => void;
  /** Optional: Render custom content below selected category (mobile only, directly below card) */
  renderMobileContent?: (categoryId: number, products: Product[]) => React.ReactNode;
  /** Optional: Render custom content below all categories (desktop only) */
  renderDesktopContent?: (categoryId: number, products: Product[]) => React.ReactNode;
}

export default function CategorySelector({
  categories,
  productsByCategory,
  selectedCategory,
  onCategorySelect,
  renderMobileContent,
  renderDesktopContent
}: CategorySelectorProps) {
  const { t } = useTranslation();

  // Filter out categories with no visible products
  const categoriesWithProducts = categories.filter(cat => {
    const products = productsByCategory[cat.id] || [];
    return products.length > 0;
  });

  const handleCategoryClick = (categoryId: number) => {
    onCategorySelect(selectedCategory === categoryId ? null : categoryId);
  };

  return (
    <div>
      {/* Mobile: Horizontal Scrolling Categories */}
      <div className="lg:hidden">
        <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
          <div className="flex gap-6 min-w-min pb-4">
            {categoriesWithProducts.map((category) => {
              const products = productsByCategory[category.id] || [];
              const isSelected = selectedCategory === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="flex-shrink-0 w-32 flex flex-col items-center group"
                >
                  {/* Category Image */}
                  <div className={`w-32 h-32 relative rounded-lg overflow-hidden mb-2 transition-all ${
                    isSelected ? 'ring-2 ring-primary' : 'opacity-70 group-hover:opacity-100'
                  }`}>
                    <Image
                      src={category.picture_url ? getCategoryImageUrl(category.picture_url) : null}
                      alt={category.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  {/* Category Name */}
                  <h3 className={`text-sm font-semibold text-center transition-colors ${
                    isSelected ? 'text-primary' : 'text-gray-700'
                  }`}>
                    {category.name}
                  </h3>
                  {/* Underline Indicator */}
                  <div className={`mt-1 h-0.5 w-full transition-all ${
                    isSelected ? 'bg-primary' : 'bg-transparent'
                  }`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile: Products below horizontal categories */}
        {selectedCategory && renderMobileContent && (
          <div className="mt-6">
            {renderMobileContent(selectedCategory, productsByCategory[selectedCategory] || [])}
          </div>
        )}
      </div>

      {/* Desktop: Grid Layout (unchanged) */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-4 lg:gap-6 lg:items-end">
        {categoriesWithProducts.map((category) => {
          const products = productsByCategory[category.id] || [];
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
                    src={category.picture_url ? getCategoryImageUrl(category.picture_url) : null}
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
              {isSelected && renderDesktopContent && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-0.5 bg-primary h-8 translate-y-full z-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop Content (below all categories) */}
      {selectedCategory && renderDesktopContent && (
        <div className="hidden lg:block mt-8 pt-8 border-t-2 border-primary/20">
          {renderDesktopContent(selectedCategory, productsByCategory[selectedCategory] || [])}
        </div>
      )}
    </div>
  );
}
