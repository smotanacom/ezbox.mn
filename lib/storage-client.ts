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

/**
 * Gets public URL for a category image path
 * Category images are stored in the product-images bucket
 *
 * @param path - Storage path (e.g., "categories/1/123_medium.jpg")
 * @returns Public URL
 */
export function getCategoryImageUrl(path: string): string {
  const { data } = supabase.storage
    .from(BUCKETS.PRODUCT_IMAGES)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Gets public URL for a special image path
 * Special images are stored in the product-images bucket
 *
 * @param path - Storage path (e.g., "specials/1/123_medium.jpg") or full URL
 * @returns Public URL or null if it's a placeholder
 */
export function getSpecialImageUrl(path: string): string | null {
  // Filter out placeholder images
  if (path.includes('picsum.photos') || path.includes('placeholder')) {
    return null;
  }

  // If it's already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const { data } = supabase.storage
    .from(BUCKETS.PRODUCT_IMAGES)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Gets public URL for a site settings image path
 * Site images are stored in the product-images bucket under site/
 *
 * @param path - Storage path (e.g., "site/custom_design_cover_image/123_original.jpg")
 * @returns Public URL
 */
export function getSiteImageUrl(path: string): string {
  const { data } = supabase.storage
    .from(BUCKETS.PRODUCT_IMAGES)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Gets public URL for a custom project image path
 * Project images are stored in the product-images bucket under projects/
 *
 * @param path - Storage path (e.g., "projects/1/123_medium.jpg")
 * @returns Public URL
 */
export function getProjectImageUrl(path: string): string {
  const { data } = supabase.storage
    .from(BUCKETS.PRODUCT_IMAGES)
    .getPublicUrl(path);

  return data.publicUrl;
}
