'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { getFirstImageUrl, getCategoryImageUrl } from '@/lib/storage-client';
import { useTranslation } from '@/contexts/LanguageContext';
import type { Category, ProductWithDetails } from '@/types/database';

interface CategoryScrollerProps {
  category: Category;
  products: ProductWithDetails[];
}

export default function CategoryScroller({ category, products }: CategoryScrollerProps) {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Calculate items per page based on screen width
  useEffect(() => {
    const calculateItemsPerPage = () => {
      const width = window.innerWidth;
      if (width < 640) return 2; // mobile
      if (width < 768) return 3; // tablet
      if (width < 1024) return 4; // small desktop
      if (width < 1280) return 5; // medium desktop
      return 6; // large desktop
    };

    const updateItemsPerPage = () => {
      setItemsPerPage(calculateItemsPerPage());
      checkScrollPosition();
    };

    updateItemsPerPage();
    window.addEventListener('resize', updateItemsPerPage);
    return () => window.removeEventListener('resize', updateItemsPerPage);
  }, []);

  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  useEffect(() => {
    checkScrollPosition();
  }, [products]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const itemWidth = container.scrollWidth / (products.length + 1); // +1 for category card
    const scrollAmount = itemWidth * itemsPerPage;

    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });

    // Update button states after animation
    setTimeout(checkScrollPosition, 300);
  };

  const allItems = [
    { type: 'category' as const, data: category },
    ...products.map(p => ({ type: 'product' as const, data: p }))
  ];

  return (
    <div className="space-y-4 overflow-hidden">
      <div className="relative group overflow-hidden">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-10 w-24 sm:w-32 bg-gradient-to-r from-black/80 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-label={t('category.scroll-left')}
          >
            <ChevronLeft className="h-8 w-8 sm:h-10 sm:w-10 text-white drop-shadow-lg" />
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollPosition}
          className="flex gap-2 sm:gap-3 overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth px-4 sm:px-6 lg:px-12 pb-4"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {allItems.map((item, index) => {
            if (item.type === 'category') {
              return (
                <Link
                  key={`category-${category.id}`}
                  href={`/products?category=${category.id}`}
                  className="flex-shrink-0 w-[45vw] sm:w-[30vw] md:w-[23vw] lg:w-[18vw] xl:w-[15vw]"
                >
                  <ProductCard
                    imageUrl={category.picture_url ? getCategoryImageUrl(category.picture_url) : null}
                    title={category.name}
                    description={t('category.browse-collection')}
                    className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5"
                  />
                </Link>
              );
            } else {
              const product = item.data as ProductWithDetails;
              return (
                <Link
                  key={`product-${product.id}`}
                  href={`/products?product=${product.id}`}
                  className="flex-shrink-0 w-[45vw] sm:w-[30vw] md:w-[23vw] lg:w-[18vw] xl:w-[15vw]"
                >
                  <ProductCard
                    imageUrl={getFirstImageUrl(product.images || [])}
                    title={product.name}
                    price={product.base_price}
                  />
                </Link>
              );
            }
          })}
        </div>

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-10 w-24 sm:w-32 bg-gradient-to-l from-black/80 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-label={t('category.scroll-right')}
          >
            <ChevronRight className="h-8 w-8 sm:h-10 sm:w-10 text-white drop-shadow-lg" />
          </button>
        )}
      </div>
    </div>
  );
}
