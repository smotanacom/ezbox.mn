'use client';

/**
 * Hook to detect if the browser supports model-viewer (3D model rendering)
 *
 * Checks for:
 * - Custom Elements API support
 * - IntersectionObserver (used by model-viewer)
 * - ResizeObserver (used by model-viewer)
 */

import { useState, useEffect } from 'react';

export function useModelViewerSupport(): boolean {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      setIsSupported(false);
      return;
    }

    // Check for required browser APIs
    const hasCustomElements = 'customElements' in window;
    const hasIntersectionObserver = 'IntersectionObserver' in window;
    const hasResizeObserver = 'ResizeObserver' in window;

    // Model-viewer also requires WebGL, but we'll let it fail gracefully if not available
    const supported = hasCustomElements && hasIntersectionObserver && hasResizeObserver;

    setIsSupported(supported);
  }, []);

  return isSupported;
}
