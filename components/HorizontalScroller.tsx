'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalScrollerProps {
  children: ReactNode;
  itemsPerPage?: {
    mobile?: number;
    tablet?: number;
    smallDesktop?: number;
    mediumDesktop?: number;
    largeDesktop?: number;
  };
  className?: string;
  title?: string;
  showArrows?: boolean;
}

export default function HorizontalScroller({
  children,
  itemsPerPage = {
    mobile: 2,
    tablet: 3,
    smallDesktop: 4,
    mediumDesktop: 5,
    largeDesktop: 6,
  },
  className = '',
  title,
  showArrows = true,
}: HorizontalScrollerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [currentItemsPerPage, setCurrentItemsPerPage] = useState(itemsPerPage.largeDesktop || 6);

  // Calculate items per page based on screen width
  useEffect(() => {
    const calculateItemsPerPage = () => {
      const width = window.innerWidth;
      if (width < 640) return itemsPerPage.mobile || 2;
      if (width < 768) return itemsPerPage.tablet || 3;
      if (width < 1024) return itemsPerPage.smallDesktop || 4;
      if (width < 1280) return itemsPerPage.mediumDesktop || 5;
      return itemsPerPage.largeDesktop || 6;
    };

    const updateItemsPerPage = () => {
      setCurrentItemsPerPage(calculateItemsPerPage());
      checkScrollPosition();
    };

    updateItemsPerPage();
    window.addEventListener('resize', updateItemsPerPage);
    return () => window.removeEventListener('resize', updateItemsPerPage);
  }, [itemsPerPage]);

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
  }, [children]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const childCount = Array.isArray(children) ? children.length : 1;
    const itemWidth = container.scrollWidth / childCount;
    const scrollAmount = itemWidth * currentItemsPerPage;

    const start = container.scrollLeft;
    const end = start + (direction === 'left' ? -scrollAmount : scrollAmount);
    const duration = 300;
    const startTime = performance.now();

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeInOutCubic = (t: number) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const easedProgress = easeInOutCubic(progress);
      container.scrollLeft = start + (end - start) * easedProgress;

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else {
        checkScrollPosition();
      }
    };

    requestAnimationFrame(animateScroll);
  };

  return (
    <div className={`space-y-4 overflow-hidden ${className}`}>
      {title && (
        <h3 className="text-2xl font-bold text-gray-900 px-4 sm:px-6 lg:px-12">
          {title}
        </h3>
      )}

      <div className="relative group overflow-hidden">
        {/* Left Arrow */}
        {showArrows && canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-10 w-12 sm:w-24 lg:w-32 bg-gradient-to-r from-black/80 to-transparent flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-white drop-shadow-lg" />
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollPosition}
          className="flex gap-2 sm:gap-3 overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth px-4 sm:px-6 lg:px-12 py-4"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            scrollBehavior: 'smooth',
          }}
        >
          {children}
        </div>

        {/* Right Arrow */}
        {showArrows && canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-10 w-12 sm:w-24 lg:w-32 bg-gradient-to-l from-black/80 to-transparent flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-white drop-shadow-lg" />
          </button>
        )}
      </div>
    </div>
  );
}
