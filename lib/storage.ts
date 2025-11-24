/**
 * Storage API
 *
 * Handles file uploads, deletions, and management for product images and 3D models.
 * Integrates with Supabase Storage and database.
 */

import { supabase } from './supabase';
import {
  validateImageFile,
  generateAllSizes
} from './image-processing';
import type { ProductImage, ProductModel } from '@/types/database';

// Lazy load model processing to avoid bundling issues
let modelProcessing: any = null;
async function getModelProcessing() {
  if (!modelProcessing) {
    modelProcessing = await import('./model-processing');
  }
  return modelProcessing;
}

/**
 * Storage bucket names
 */
export const BUCKETS = {
  PRODUCT_IMAGES: 'product-images',
  PRODUCT_MODELS: 'product-models',
} as const;

/**
 * Supported 3D model formats
 */
const ALLOWED_MODEL_TYPES = [
  'model/gltf-binary', // .glb
  'model/gltf+json',   // .gltf
  'application/octet-stream' // fallback for binary files
];

const ALLOWED_MODEL_EXTENSIONS = ['.glb', '.gltf', '.usdz'];

const MAX_MODEL_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Uploads a product image with all required sizes
 *
 * @param productId - Product ID
 * @param file - Image file buffer
 * @param fileName - Original file name
 * @param mimeType - MIME type
 * @param displayOrder - Display order in carousel
 * @param altText - Alternative text for accessibility
 * @returns Created product image record
 */
export async function uploadProductImage(
  productId: number,
  file: Buffer,
  fileName: string,
  mimeType: string,
  displayOrder: number = 0,
  altText?: string
): Promise<{ data: ProductImage | null; error: string | null }> {
  try {
    // Validate image
    const validation = await validateImageFile(file, fileName, mimeType);
    if (!validation.valid) {
      return { data: null, error: validation.error || 'Invalid image file' };
    }

    // Generate all sizes
    const sizes = await generateAllSizes(file);

    // Generate unique file names
    const timestamp = Date.now();
    const ext = '.jpg'; // All processed images are saved as JPEG
    const basePath = `products/${productId}`;

    const paths = {
      original: `${basePath}/${timestamp}_original${ext}`,
      thumbnail: `${basePath}/${timestamp}_thumb${ext}`,
      medium: `${basePath}/${timestamp}_medium${ext}`,
    };

    // Upload all sizes to storage
    const uploadResults = await Promise.all([
      supabase.storage
        .from(BUCKETS.PRODUCT_IMAGES)
        .upload(paths.original, sizes.original, {
          contentType: 'image/jpeg',
          upsert: false
        }),
      supabase.storage
        .from(BUCKETS.PRODUCT_IMAGES)
        .upload(paths.thumbnail, sizes.thumbnail, {
          contentType: 'image/jpeg',
          upsert: false
        }),
      supabase.storage
        .from(BUCKETS.PRODUCT_IMAGES)
        .upload(paths.medium, sizes.medium, {
          contentType: 'image/jpeg',
          upsert: false
        })
    ]);

    // Check for upload errors
    const uploadError = uploadResults.find(result => result.error);
    if (uploadError?.error) {
      // Cleanup uploaded files
      await deleteStorageFiles(BUCKETS.PRODUCT_IMAGES, Object.values(paths));
      return { data: null, error: uploadError.error.message };
    }

    // Save to database
    const { data, error } = await supabase
      .from('product_images')
      .insert({
        product_id: productId,
        storage_path: paths.original,
        thumbnail_path: paths.thumbnail,
        medium_path: paths.medium,
        display_order: displayOrder,
        alt_text: altText || null
      } as any)
      .select()
      .single();

    if (error) {
      // Cleanup uploaded files
      await deleteStorageFiles(BUCKETS.PRODUCT_IMAGES, Object.values(paths));
      return { data: null, error: error.message };
    }

    return { data: data as ProductImage, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to upload image'
    };
  }
}

/**
 * Deletes a product image
 *
 * @param imageId - Image ID
 * @returns Success status
 */
export async function deleteProductImage(
  imageId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Get image record
    const { data: image, error: fetchError } = await supabase
      .from('product_images')
      .select('*')
      .eq('id', imageId)
      .single() as { data: ProductImage | null; error: any };

    if (fetchError || !image) {
      return { success: false, error: 'Image not found' };
    }

    // Delete files from storage
    const paths = [
      image.storage_path,
      image.thumbnail_path,
      image.medium_path
    ];

    await deleteStorageFiles(BUCKETS.PRODUCT_IMAGES, paths);

    // Delete database record
    const { error: deleteError } = await supabase
      .from('product_images')
      .delete()
      .eq('id', imageId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete image'
    };
  }
}

/**
 * Reorders product images
 *
 * @param productId - Product ID
 * @param imageIds - Array of image IDs in desired order
 * @returns Success status
 */
export async function reorderProductImages(
  productId: number,
  imageIds: string[]
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Update display_order for each image
    const updates = imageIds.map((imageId, index) =>
      supabase
        .from('product_images')
        // @ts-expect-error - Supabase type inference issue with update
        .update({ display_order: index })
        .eq('id', imageId)
        .eq('product_id', productId)
    );

    const results = await Promise.all(updates);
    const errorResult = results.find(result => result.error);

    if (errorResult?.error) {
      return { success: false, error: errorResult.error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reorder images'
    };
  }
}

/**
 * Gets all images for a product
 *
 * @param productId - Product ID
 * @returns Array of product images
 */
export async function getProductImages(
  productId: number
): Promise<{ data: ProductImage[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('display_order', { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data as ProductImage[], error: null };
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch images'
    };
  }
}

/**
 * Gets the first image for a product (for thumbnails)
 *
 * @param productId - Product ID
 * @returns First product image or null
 */
export async function getProductFirstImage(
  productId: number
): Promise<{ data: ProductImage | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('display_order', { ascending: true })
      .limit(1)
      .single();

    if (error) {
      // No images found is not an error
      if (error.code === 'PGRST116') {
        return { data: null, error: null };
      }
      return { data: null, error: error.message };
    }

    return { data: data as ProductImage, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch first image'
    };
  }
}

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
 * Uploads a 3D model for a product
 *
 * Features:
 * - Supports GLB, GLTF, USDZ, and SKP formats
 * - Converts SKP to GLB (requires Blender)
 * - Optimizes GLB files to reduce size
 * - Generates a preview image from the model
 *
 * @param productId - Product ID
 * @param file - Model file buffer
 * @param fileName - Original file name
 * @param mimeType - MIME type
 * @returns Created product model record
 */
export async function uploadProductModel(
  productId: number,
  file: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ data: ProductModel | null; error: string | null }> {
  try {
    // Validate file size
    if (file.length > MAX_MODEL_SIZE) {
      return {
        data: null,
        error: `File size exceeds ${MAX_MODEL_SIZE / (1024 * 1024)}MB limit`
      };
    }

    // Validate file extension
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    if (!ALLOWED_MODEL_EXTENSIONS.includes(ext)) {
      return {
        data: null,
        error: `Invalid file type. Allowed types: ${ALLOWED_MODEL_EXTENSIONS.join(', ')}`
      };
    }

    let processedBuffer = file;
    let finalExtension = ext;
    let finalFormat = ext.substring(1); // Remove the dot

    // Get model processing module
    const { optimizeGLB, getFileSizeMB } = await getModelProcessing();

    // Note: Preview generation is now done client-side using the "Take Screenshot" button
    // in the admin panel after the model is uploaded and visible in model-viewer

    // Optimize GLB files (after preview generation)
    if (finalExtension === '.glb') {
      console.log('Optimizing GLB with meshopt compression...');
      const originalSize = processedBuffer.length;
      try {
        processedBuffer = await optimizeGLB(processedBuffer);
        const optimizedSize = processedBuffer.length;
        const savedPercent = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
        console.log(`GLB optimized. Original: ${getFileSizeMB(Buffer.from(new Uint8Array(originalSize)))}MB, Optimized: ${getFileSizeMB(processedBuffer)}MB (${savedPercent}% reduction)`);
      } catch (error) {
        console.error('GLB optimization failed, using original:', error);
        // Continue with unoptimized file
      }
    }

    // Check if model already exists for this product (only one model per product)
    const { data: existing } = await supabase
      .from('product_models')
      .select('id')
      .eq('product_id', productId)
      .single() as { data: { id: string } | null; error: any };

    // If exists, delete it first
    if (existing) {
      await deleteProductModel(productId);
    }

    // Generate unique file path
    const timestamp = Date.now();
    const path = `products/${productId}/${timestamp}_model${finalExtension}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKETS.PRODUCT_MODELS)
      .upload(path, processedBuffer, {
        contentType: finalExtension === '.glb' ? 'model/gltf-binary' : mimeType,
        upsert: false
      });

    if (uploadError) {
      return { data: null, error: uploadError.message };
    }

    // Preview is now generated client-side - see "Take Screenshot" button in admin panel

    // Save to database
    const { data, error } = await supabase
      .from('product_models')
      .insert({
        product_id: productId,
        storage_path: path,
        file_size: processedBuffer.length,
        file_format: finalFormat
      } as any)
      .select()
      .single();

    if (error) {
      // Cleanup uploaded file
      await deleteStorageFiles(BUCKETS.PRODUCT_MODELS, [path]);
      return { data: null, error: error.message };
    }

    return { data: data as ProductModel, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to upload model'
    };
  }
}

/**
 * Deletes a product's 3D model
 *
 * @param productId - Product ID
 * @returns Success status
 */
export async function deleteProductModel(
  productId: number
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Get model record
    const { data: model, error: fetchError } = await supabase
      .from('product_models')
      .select('*')
      .eq('product_id', productId)
      .single() as { data: ProductModel | null; error: any };

    if (fetchError || !model) {
      return { success: false, error: 'Model not found' };
    }

    // Delete file from storage
    await deleteStorageFiles(BUCKETS.PRODUCT_MODELS, [model.storage_path]);

    // Delete database record
    const { error: deleteError } = await supabase
      .from('product_models')
      .delete()
      .eq('product_id', productId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete model'
    };
  }
}

/**
 * Gets a product's 3D model
 *
 * @param productId - Product ID
 * @returns Product model or null
 */
export async function getProductModel(
  productId: number
): Promise<{ data: ProductModel | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('product_models')
      .select('*')
      .eq('product_id', productId)
      .single();

    if (error) {
      // No model found is not an error
      if (error.code === 'PGRST116') {
        return { data: null, error: null };
      }
      return { data: null, error: error.message };
    }

    return { data: data as ProductModel, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch model'
    };
  }
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
 * Helper function to delete multiple files from storage
 *
 * @param bucket - Bucket name
 * @param paths - Array of file paths
 */
async function deleteStorageFiles(
  bucket: string,
  paths: string[]
): Promise<void> {
  try {
    await supabase.storage.from(bucket).remove(paths);
  } catch (error) {
    console.error('Failed to delete storage files:', error);
  }
}
