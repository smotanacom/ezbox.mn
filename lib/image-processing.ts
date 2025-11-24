/**
 * Image Processing Utilities
 *
 * Handles image validation, resizing, and optimization for product images.
 * Uses Sharp library for high-performance image processing.
 */

import sharp from 'sharp';

/**
 * Supported image formats
 */
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
];

/**
 * Maximum file size: 10MB
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

/**
 * Image size configurations
 */
export const IMAGE_SIZES = {
  THUMBNAIL: { width: 200, height: 200 },
  MEDIUM: { width: 800, height: 800 },
} as const;

/**
 * Validates image file
 *
 * @param file - File or Buffer to validate
 * @param fileName - Original file name
 * @returns Validation result
 */
export async function validateImageFile(
  file: Buffer,
  fileName: string,
  mimeType?: string
): Promise<{ valid: boolean; error?: string }> {
  // Check file size
  if (file.length > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`
    };
  }

  // Check MIME type if provided
  if (mimeType && !ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`
    };
  }

  // Validate image using Sharp
  try {
    const metadata = await sharp(file).metadata();

    if (!metadata.format) {
      return {
        valid: false,
        error: 'Unable to detect image format'
      };
    }

    // Ensure it's a supported format
    const supportedFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif'];
    if (!supportedFormats.includes(metadata.format)) {
      return {
        valid: false,
        error: `Unsupported image format: ${metadata.format}`
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid image file or corrupted data'
    };
  }
}

/**
 * Resizes an image to specified dimensions
 *
 * @param buffer - Image buffer
 * @param width - Target width
 * @param height - Target height
 * @returns Resized image buffer
 */
export async function resizeImage(
  buffer: Buffer,
  width: number,
  height: number
): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();
  } catch (error) {
    throw new Error(`Failed to resize image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generates thumbnail (200x200)
 *
 * @param buffer - Original image buffer
 * @returns Thumbnail buffer
 */
export async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
  return resizeImage(buffer, IMAGE_SIZES.THUMBNAIL.width, IMAGE_SIZES.THUMBNAIL.height);
}

/**
 * Generates medium size image (800x800)
 *
 * @param buffer - Original image buffer
 * @returns Medium-sized image buffer
 */
export async function generateMedium(buffer: Buffer): Promise<Buffer> {
  return resizeImage(buffer, IMAGE_SIZES.MEDIUM.width, IMAGE_SIZES.MEDIUM.height);
}

/**
 * Gets image metadata
 *
 * @param buffer - Image buffer
 * @returns Image metadata
 */
export async function getImageMetadata(buffer: Buffer) {
  try {
    return await sharp(buffer).metadata();
  } catch (error) {
    throw new Error(`Failed to read image metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Optimizes image without resizing
 *
 * @param buffer - Original image buffer
 * @returns Optimized image buffer
 */
export async function optimizeImage(buffer: Buffer): Promise<Buffer> {
  try {
    const metadata = await sharp(buffer).metadata();

    // If image is already smaller than medium size, just optimize it
    if (metadata.width && metadata.height &&
        metadata.width <= IMAGE_SIZES.MEDIUM.width &&
        metadata.height <= IMAGE_SIZES.MEDIUM.height) {
      return await sharp(buffer)
        .jpeg({ quality: 90, progressive: true })
        .toBuffer();
    }

    // Otherwise, resize to medium
    return await generateMedium(buffer);
  } catch (error) {
    throw new Error(`Failed to optimize image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generates all required image sizes
 *
 * @param buffer - Original image buffer
 * @returns Object containing all generated sizes
 */
export async function generateAllSizes(buffer: Buffer): Promise<{
  original: Buffer;
  thumbnail: Buffer;
  medium: Buffer;
}> {
  try {
    const [thumbnail, medium] = await Promise.all([
      generateThumbnail(buffer),
      generateMedium(buffer)
    ]);

    return {
      original: buffer,
      thumbnail,
      medium
    };
  } catch (error) {
    throw new Error(`Failed to generate image sizes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
