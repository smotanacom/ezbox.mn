'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function HomePageSkeleton() {
  return (
    <>
      {/* Hero + Specials Container Skeleton */}
      <div className="flex flex-col lg:flex-row border-b">
        {/* Hero Section Skeleton */}
        <div className="relative bg-gradient-to-br from-primary/5 via-white to-secondary/5 overflow-hidden min-h-[600px] flex-1">
          <div className="relative z-10 max-w-7xl mx-auto px-4 py-32 sm:px-8 lg:px-12 sm:py-40 lg:py-48">
            <div className="text-center space-y-6 max-w-4xl mx-auto">
              {/* Logo placeholder */}
              <div className="inline-block">
                <div className="flex items-center justify-center gap-4">
                  <Skeleton className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg" />
                  <Skeleton className="h-12 w-48 sm:h-16 sm:w-64" />
                </div>
              </div>
              {/* Tagline placeholder */}
              <Skeleton className="h-6 w-3/4 mx-auto" />
              {/* Buttons placeholder */}
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Skeleton className="h-12 w-40 rounded-lg" />
                <Skeleton className="h-12 w-40 rounded-lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Specials Carousel Skeleton */}
        <div className="w-full lg:w-1/3 lg:max-w-[480px] lg:min-w-[380px]">
          <div className="relative h-[300px] sm:h-[400px] lg:h-full bg-gray-100">
            <Skeleton className="absolute inset-0" />
            {/* Navigation dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="w-2 h-2 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid Skeleton */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category tabs skeleton */}
          <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-12 w-24 rounded-lg flex-shrink-0" />
            ))}
          </div>

          {/* Desktop product grid skeleton */}
          <div className="hidden lg:grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
                <Skeleton className="aspect-square w-[70%] mx-auto mt-4 rounded-lg" />
                <div className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-6 w-1/2 mb-3" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>

          {/* Mobile product grid skeleton */}
          <div className="lg:hidden space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-4 flex gap-4">
                <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Design Section Skeleton */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <Skeleton className="aspect-video rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-12 w-40 rounded-lg mt-6" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
