'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from '@/components/Image';
import { getFirstImageUrl } from '@/lib/storage-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ProductWithDetails } from '@/types/database';

interface ProductCarouselProps {
  products: ProductWithDetails[];
}

export default function ProductCarousel({ products }: ProductCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const updateArrowVisibility = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;

    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    updateArrowVisibility();
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => updateArrowVisibility();
    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', updateArrowVisibility);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateArrowVisibility);
    };
  }, [products]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.8;
    const newScrollLeft = direction === 'left'
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    });
  };

  if (!products || products.length === 0) {
    return (
      <div className="text-muted-foreground text-sm italic">
        No products available
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Left Arrow */}
      {showLeftArrow && (
        <Button
          onClick={() => scroll('left')}
          size="icon"
          variant="secondary"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth pb-2"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products?product=${product.id}`}
            className="flex-shrink-0 w-[200px] sm:w-[220px] md:w-[240px]"
          >
            <Card className="overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-200 h-full border-gray-200">
              <div className="aspect-square relative overflow-hidden bg-gray-100">
                <Image
                  src={getFirstImageUrl(product.images || [])}
                  alt={product.name}
                  className="object-cover w-full h-full hover:scale-110 transition-transform duration-300"
                />
              </div>
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold line-clamp-2 mb-2 min-h-[2.5rem]">
                  {product.name}
                </h4>
                <span className="text-base font-bold text-primary">
                  ₮{product.base_price.toLocaleString()}
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Right Arrow */}
      {showRightArrow && (
        <Button
          onClick={() => scroll('right')}
          size="icon"
          variant="secondary"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
