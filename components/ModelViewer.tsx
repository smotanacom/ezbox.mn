'use client';

/**
 * 3D Model Viewer Component
 *
 * Displays 3D models using Google's model-viewer web component.
 * Supports .glb, .gltf, and .usdz formats.
 */

import React, { useEffect, useRef, useState } from 'react';
import { getModelUrl } from '@/lib/storage-client';
import { ProductModel } from '@/types/database';

// Type definition for model-viewer web component
type ModelViewerJSX = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement> & {
    src?: string;
    alt?: string;
    'auto-rotate'?: boolean;
    'camera-controls'?: boolean;
    'shadow-intensity'?: string;
    'exposure'?: string;
    'ar'?: boolean;
    'ar-modes'?: string;
    'camera-orbit'?: string;
    loading?: 'auto' | 'lazy' | 'eager';
    reveal?: 'auto' | 'interaction' | 'manual';
    style?: React.CSSProperties;
  },
  HTMLElement
>;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerJSX;
    }
  }
}

interface ModelViewerProps {
  model: ProductModel;
  productName: string;
  className?: string;
  onError?: () => void;
}

export default function ModelViewer({
  model,
  productName,
  className = '',
  onError
}: ModelViewerProps) {
  const viewerRef = useRef<HTMLElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load the model-viewer script
  useEffect(() => {
    // Check if script is already loaded
    const existingScript = document.querySelector('script[src*="model-viewer"]');
    if (existingScript) {
      return;
    }

    // Load model-viewer - it will automatically load meshopt decoder from configured location
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';

    script.onload = () => {
      console.log('✓ model-viewer loaded successfully');
    };

    script.onerror = () => {
      console.error('Failed to load model-viewer script');
    };

    document.head.appendChild(script);

    return () => {
      // Don't remove script on cleanup as it might be used by other instances
    };
  }, []);

  // Handle model loading events
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const handleError = (event: any) => {
      console.error('Model loading error - type:', event.type);
      console.error('Model loading error - detail:', event.detail);
      if (event.detail) {
        console.error('Model loading error - detail keys:', Object.keys(event.detail));
        console.error('Model loading error - detail type:', event.detail.type);

        // Log sourceError details
        if (event.detail.sourceError) {
          const srcErr = event.detail.sourceError;
          console.error('Model loading error - sourceError type:', srcErr.type);
          console.error('Model loading error - sourceError target:', srcErr.target);
          console.error('Model loading error - sourceError:', srcErr);
        }
      }
      if (event.detail?.error) {
        console.error('Model loading error - error object:', event.detail.error);
        console.error('Model loading error - error message:', event.detail.error.message);
        console.error('Model loading error - error stack:', event.detail.error.stack);
      }

      // Notify parent component that model failed to load
      if (onError) {
        onError();
      }
    };

    const handleLoad = () => {
      console.log('✓ Model loaded successfully with meshopt compression');
      setIsLoaded(true);
    };

    const handleProgress = (event: any) => {
      console.log('Model loading progress:', event.detail);
    };

    viewer.addEventListener('error', handleError);
    viewer.addEventListener('load', handleLoad);
    viewer.addEventListener('progress', handleProgress);

    return () => {
      viewer.removeEventListener('error', handleError);
      viewer.removeEventListener('load', handleLoad);
      viewer.removeEventListener('progress', handleProgress);
    };
  }, [onError]);

  const modelUrl = getModelUrl(model.storage_path);

  // Debug: log model URL
  useEffect(() => {
    console.log('Model URL:', modelUrl);
    console.log('Model storage path:', model.storage_path);
    console.log('Model format:', model.file_format);
    console.log('Model size:', model.file_size);
  }, [modelUrl, model]);

  return (
    <div className={`relative w-full h-full bg-gray-100 rounded-lg overflow-hidden ${className}`}>
      {React.createElement('model-viewer', {
        ref: viewerRef,
        src: modelUrl,
        alt: `3D model of ${productName}`,
        'auto-rotate': isLoaded,
        'camera-controls': true,
        'shadow-intensity': '1',
        exposure: '1.2',
        ar: true,
        'ar-modes': 'webxr scene-viewer quick-look',
        'camera-orbit': '45deg 75deg auto',
        'min-camera-orbit': 'auto auto 5%',
        'max-camera-orbit': 'auto auto 500%',
        loading: 'eager',
        reveal: 'auto',
        style: {
          width: '100%',
          height: '100%',
          backgroundColor: '#f3f4f6'
        }
      },
        // Loading indicator - only show when not loaded
        !isLoaded && <div slot="poster" className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm">Loading 3D model...</p>
          </div>
        </div>,
        // AR button
        <button
          slot="ar-button"
          className="absolute bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-lg"
        >
          View in AR
        </button>
      )}
    </div>
  );
}
