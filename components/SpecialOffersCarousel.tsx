'use client';

import { useState, useEffect } from 'react';
import Image from '@/components/Image';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import type { SpecialWithItems } from '@/types/database';

interface SpecialOffersCarouselProps {
  specials: SpecialWithItems[];
  specialOriginalPrices: Record<number, number>;
  onAddToCart: (specialId: number) => void;
  addingSpecial: Set<number>;
  addedSpecial: Set<number>;
  specialErrors: Record<number, string>;
}

export default function SpecialOffersCarousel({
  specials,
  specialOriginalPrices,
  onAddToCart,
  addingSpecial,
  addedSpecial,
  specialErrors,
}: SpecialOffersCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // Auto-rotate slides every 5 seconds unless hovering
  useEffect(() => {
    if (isHovering || specials.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % specials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isHovering, specials.length]);

  if (specials.length === 0) return null;

  const currentSpecial = specials[currentIndex];
  const originalPrice = specialOriginalPrices[currentSpecial.id] || 0;
  const savings = originalPrice - currentSpecial.discounted_price;
  const savingsPercent = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;
  const isAdding = addingSpecial.has(currentSpecial.id);
  const isAdded = addedSpecial.has(currentSpecial.id);
  const error = specialErrors[currentSpecial.id];

  return (
    <section
      className="relative h-full min-h-[600px] w-full overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        {specials.map((special, index) => (
          <div
            key={special.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={special.picture_url}
              alt={special.name}
              className="object-cover w-full h-full"
            />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
          </div>
        ))}
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          {/* Badge */}
          {savingsPercent > 0 && (
            <div className="inline-block">
              <span className="inline-flex items-center px-6 py-2 rounded-full text-lg font-bold bg-primary text-white shadow-lg">
                Save {savingsPercent}%
              </span>
            </div>
          )}

          {/* Title */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white drop-shadow-2xl">
            {currentSpecial.name}
          </h2>

          {/* Description */}
          {currentSpecial.description && (
            <p className="text-lg sm:text-xl text-white/90 drop-shadow-lg max-w-2xl mx-auto">
              {currentSpecial.description}
            </p>
          )}

          {/* Pricing */}
          <div className="space-y-2">
            {originalPrice > 0 && (
              <div className="text-white/80">
                <span className="text-2xl line-through">₮{originalPrice.toLocaleString()}</span>
                <span className="ml-3 text-lg font-semibold text-primary-foreground">
                  Save ₮{savings.toLocaleString()}
                </span>
              </div>
            )}
            <div className="text-5xl sm:text-6xl font-bold text-secondary-foreground drop-shadow-lg">
              ₮{currentSpecial.discounted_price.toLocaleString()}
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-4 space-y-2">
            <Button
              onClick={() => onAddToCart(currentSpecial.id)}
              disabled={isAdding || isAdded}
              size="lg"
              className="bg-secondary hover:bg-secondary/90 text-white px-10 py-7 text-xl shadow-2xl hover:shadow-secondary/50 transition-all"
            >
              {isAdded && <span className="mr-2">✓</span>}
              {!isAdded && !isAdding && <ShoppingCart className="mr-2 h-6 w-6" />}
              {isAdding ? 'Adding...' : isAdded ? 'Added to Cart' : 'Add Bundle to Cart'}
            </Button>
            {error && (
              <p className="text-sm text-red-400 font-semibold drop-shadow">{error}</p>
            )}
            <p className="text-sm text-white/70 drop-shadow">
              Pre-configured bundle • Limited time offer
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Dots */}
      {specials.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-3">
          {specials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex
                  ? 'w-12 h-3 bg-white'
                  : 'w-3 h-3 bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to special offer ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Side Navigation Arrows (optional) */}
      {specials.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + specials.length) % specials.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all backdrop-blur-sm"
            aria-label="Previous special"
          >
            ‹
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % specials.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all backdrop-blur-sm"
            aria-label="Next special"
          >
            ›
          </button>
        </>
      )}
    </section>
  );
}
