/**
 * 3D Model Upload API Route
 *
 * Handles product 3D model uploads (.glb, .gltf, .usdz).
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadProductModel, deleteProductModel } from '@/lib/storage';

/**
 * POST /api/upload/model
 * Upload a 3D model for a product
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const productId = formData.get('productId');
    const file = formData.get('file') as File;

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

    // Upload model
    const result = await uploadProductModel(
      parseInt(productId as string),
      buffer,
      file.name,
      file.type
    );

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Model upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload model' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload/model
 * Delete a product's 3D model
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Missing required parameter: productId' },
        { status: 400 }
      );
    }

    const result = await deleteProductModel(parseInt(productId));

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Model delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete model' },
      { status: 500 }
    );
  }
}
