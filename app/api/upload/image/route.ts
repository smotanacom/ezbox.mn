/**
 * Image Upload API Route
 *
 * Handles product image uploads with automatic resizing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadProductImage, deleteProductImage, reorderProductImages } from '@/lib/storage';

/**
 * POST /api/upload/image
 * Upload a new product image
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const productId = formData.get('productId');
    const file = formData.get('file') as File;
    const displayOrder = formData.get('displayOrder');
    const altText = formData.get('altText');

    // Validate required fields
    if (!productId || !file) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, file' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload image
    const result = await uploadProductImage(
      parseInt(productId as string),
      buffer,
      file.name,
      file.type,
      displayOrder ? parseInt(displayOrder as string) : 0,
      altText as string | undefined
    );

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload/image
 * Delete a product image
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json(
        { error: 'Missing required parameter: imageId' },
        { status: 400 }
      );
    }

    const result = await deleteProductImage(imageId);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Image delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/upload/image
 * Reorder product images
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, imageIds } = body;

    if (!productId || !imageIds || !Array.isArray(imageIds)) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields: productId, imageIds' },
        { status: 400 }
      );
    }

    const result = await reorderProductImages(parseInt(productId), imageIds);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Image reorder error:', error);
    return NextResponse.json(
      { error: 'Failed to reorder images' },
      { status: 500 }
    );
  }
}
