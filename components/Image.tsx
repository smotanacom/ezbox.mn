'use client';

import { memo, useState } from 'react';

interface ImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
}

export default memo(function Image({
  src,
  alt = 'Image',
  className = '',
}: ImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // If no src or error, show a simple gray placeholder
  if (!src || hasError) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className || 'max-w-[200px] max-h-[200px] rounded'}`}
        role="img"
        aria-label={alt}
      >
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className || 'max-w-[200px] max-h-[200px] rounded'}`}>
      {/* Loading skeleton - shows until image loads */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
    </div>
  );
});
