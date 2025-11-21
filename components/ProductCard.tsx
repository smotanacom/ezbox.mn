'use client';

import Image from '@/components/Image';
import { Card } from '@/components/ui/card';

interface ProductCardProps {
  imageUrl: string;
  title: string;
  description?: string;
  price?: number;
  quantity?: number;
  basePrice?: number;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
  square?: boolean; // true for square, false for rectangular
  className?: string;
}

export default function ProductCard({
  imageUrl,
  title,
  description,
  price,
  quantity,
  basePrice,
  onClick,
  selected = false,
  compact = false,
  square = true,
  className = '',
}: ProductCardProps) {
  const isClickable = !!onClick;

  const content = (
    <>
      <div className={`relative overflow-hidden ${square ? 'aspect-square' : 'aspect-video'}`}>
        <Image
          src={imageUrl}
          alt={title}
          className={`object-cover w-full h-full transition-transform duration-500 ${isClickable ? 'hover:scale-110' : ''}`}
        />
        <div className={`absolute inset-0 bg-gradient-to-t transition-opacity duration-300 ${
          selected
            ? 'from-primary/60 via-primary/30 to-transparent'
            : 'from-black/60 via-black/20 to-transparent'
        }`}></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          <h4 className={`${compact ? 'text-base' : 'text-2xl sm:text-3xl'} font-bold mb-2 drop-shadow-lg text-white`}>
            {title}
          </h4>
          {selected && (
            <span className={`${compact ? 'text-xs' : 'text-sm sm:text-base'} text-white font-medium drop-shadow-lg`}>
              Selected ✓
            </span>
          )}
        </div>
        {/* Bottom overlay for price/description */}
        {(price !== undefined || description || basePrice !== undefined) && (
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
            {basePrice !== undefined && (
              <div className={`${compact ? 'text-xs' : 'text-sm'} text-white/90 drop-shadow-lg`}>
                Base: ₮{basePrice.toLocaleString()}
              </div>
            )}
            {description && (
              <div className={`${compact ? 'text-xs' : 'text-sm'} text-white/90 drop-shadow-lg line-clamp-2`}>
                {description}
              </div>
            )}
            {price !== undefined && (
              <div className={`${compact ? 'text-sm' : 'text-lg'} font-semibold drop-shadow-lg`}>
                ₮{price.toLocaleString()}
                {quantity && quantity > 1 && (
                  <span className="text-xs ml-2">x{quantity}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );

  if (isClickable) {
    return (
      <button onClick={onClick} className={`${className}`}>
        <Card className={`overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300 h-full ${
          selected
            ? 'border-2 border-primary shadow-xl scale-105'
            : 'border-2 border-transparent'
        }`}>
          {content}
        </Card>
      </button>
    );
  }

  return (
    <Card className={`overflow-hidden h-full ${className}`}>
      {content}
    </Card>
  );
}
