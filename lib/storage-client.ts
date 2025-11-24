/**
 * Client-Safe Storage Utilities
 *
 * This file contains storage functions that can be used in client components.
 * Server-only functions (that use Sharp) are in storage.ts
 */

import { supabase } from './supabase';
import type { ProductImage } from '@/types/database';

/**
 * Storage bucket names
 */
export const BUCKETS = {
  PRODUCT_IMAGES: 'product-images',
  PRODUCT_MODELS: 'product-models',
} as const;

/**
 * Gets public URL for an image path
 *
 * @param path - Storage path
 * @returns Public URL
 */
export function getImageUrl(path: string): string {
  const { data } = supabase.storage
    .from(BUCKETS.PRODUCT_IMAGES)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Gets the first image URL for a product (for thumbnails/cards)
 *
 * @param images - Array of product images
 * @returns First image URL or null
 */
export function getFirstImageUrl(images: ProductImage[]): string | null {
  if (!images || images.length === 0) return null;
  return getImageUrl(images[0].medium_path);
}

/**
 * Gets public URL for a model path
 *
 * @param path - Storage path
 * @returns Public URL
 */
export function getModelUrl(path: string): string {
  const { data } = supabase.storage
    .from(BUCKETS.PRODUCT_MODELS)
    .getPublicUrl(path);

  return data.publicUrl;
}
