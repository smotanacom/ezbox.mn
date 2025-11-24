'use client';

/**
 * Image Carousel Component
 *
 * Displays product images with arrow navigation, dot indicators,
 * keyboard support, and touch/swipe gestures.
 * Optionally displays a 3D model as the first slide if available and supported.
 */

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from './Image';
import ModelViewer from './ModelViewer';
import { getImageUrl } from '@/lib/storage-client';
import { useModelViewerSupport } from '@/hooks/useModelViewerSupport';
import { ProductImage, ProductModel } from '@/types/database';

interface ImageCarouselProps {
  images: ProductImage[];
  productName: string;
  model?: ProductModel | null;
  className?: string;
}

export default function ImageCarousel({
  images,
  productName,
  model,
  className = ''
}: ImageCarouselProps) {
  // ALL HOOKS MUST BE AT THE TOP - before any conditional returns
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [modelLoadFailed, setModelLoadFailed] = useState(false);
  const isModelViewerSupported = useModelViewerSupport();

  // Determine if we should show the model as first slide
  // Only show if model exists, browser supports it, AND loading hasn't failed
  const hasModel = !!(model && isModelViewerSupported && !modelLoadFailed);

  // Calculate total slides (model + images)
  const totalSlides = (hasModel ? 1 : 0) + (images?.length || 0);

  // Handle model loading failure
  const handleModelError = useCallback(() => {
    console.warn('Model failed to load, falling back to images only');
    setModelLoadFailed(true);
    // If we're currently viewing the model, switch to first image
    if (currentIndex === 0) {
      setCurrentIndex(0); // Will show first image after model is removed
    }
  }, [currentIndex]);

  // Navigate to previous slide
  const goToPrevious = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
    setTimeout(() => setIsTransitioning(false), 300);
  }, [totalSlides, isTransitioning]);

  // Navigate to next slide
  const goToNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
    setTimeout(() => setIsTransitioning(false), 300);
  }, [totalSlides, isTransitioning]);

  // Navigate to specific image
  const goToIndex = useCallback((index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [isTransitioning, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext]);

  // Handle no content case
  if (totalSlides === 0) {
    return (
      <div className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden ${className}`}>
        <Image
          src={null}
          alt={productName}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Single slide - no carousel needed
  if (totalSlides === 1) {
    if (hasModel) {
      return (
        <div className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden ${className}`}>
          <ModelViewer
            model={model!}
            productName={productName}
            className="aspect-square"
            onError={handleModelError}
          />
        </div>
      );
    } else {
      return (
        <div className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden ${className}`}>
          <Image
            src={getImageUrl(images[0].medium_path)}
            alt={images[0].alt_text || productName}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }
  }

  // Touch/swipe support

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  // Determine what to show at current index
  const isShowingModel = hasModel && currentIndex === 0;
  const imageIndex = hasModel ? currentIndex - 1 : currentIndex;
  const currentImage = !isShowingModel && images ? images[imageIndex] : null;

  return (
    <div className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden group ${className}`}>
      {/* Main Content (Model or Image) */}
      <div
        className="w-full h-full"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {isShowingModel ? (
          <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-70' : 'opacity-100'}`}>
            <ModelViewer
              model={model!}
              productName={productName}
              className="aspect-square"
              onError={handleModelError}
            />
          </div>
        ) : (
          <Image
            src={currentImage ? getImageUrl(currentImage.medium_path) : null}
            alt={currentImage?.alt_text || productName}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isTransitioning ? 'opacity-70' : 'opacity-100'
            }`}
          />
        )}
      </div>

      {/* Previous Button */}
      <button
        onClick={goToPrevious}
        disabled={isTransitioning}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 disabled:opacity-50"
        aria-label="Previous image"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Next Button */}
      <button
        onClick={goToNext}
        disabled={isTransitioning}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 disabled:opacity-50"
        aria-label="Next image"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            onClick={() => goToIndex(index)}
            disabled={isTransitioning}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              index === currentIndex
                ? 'bg-white w-6'
                : 'bg-white/60 hover:bg-white/80'
            }`}
            aria-label={`Go to ${index === 0 && hasModel ? '3D model' : `image ${index - (hasModel ? 1 : 0) + 1}`}`}
          />
        ))}
      </div>

      {/* Slide Counter */}
      <div className="absolute top-4 right-4 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
        {currentIndex + 1} / {totalSlides}
      </div>
    </div>
  );
}
