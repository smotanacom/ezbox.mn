'use client';

import Image from '@/components/Image';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
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
      {/* Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 lg:items-end">
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
              {isSelected && renderDesktopContent && (
                <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 bottom-0 w-0.5 bg-primary h-8 translate-y-full z-0" />
              )}

              {/* Mobile Content (directly below card) */}
              {isSelected && renderMobileContent && (
                renderMobileContent(category.id, products)
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop Content (below all categories) */}
      {selectedCategory && renderDesktopContent && (
        <div className="mt-8 pt-8 border-t-2 border-primary/20">
          {renderDesktopContent(selectedCategory, productsByCategory[selectedCategory] || [])}
        </div>
      )}
    </div>
  );
}
