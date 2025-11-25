/**
 * Category Image Upload API Route
 *
 * Handles category image uploads with automatic resizing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadCategoryImage, deleteCategoryImage } from '@/lib/storage';
import { updateCategory } from '@/lib/api';

/**
 * POST /api/upload/category-image
 * Upload a new category image
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const categoryId = formData.get('categoryId');
    const file = formData.get('file') as File;
    const oldImagePath = formData.get('oldImagePath') as string | null;

    // Validate required fields
    if (!categoryId || !file) {
      return NextResponse.json(
        { error: 'Missing required fields: categoryId, file' },
        { status: 400 }
      );
    }

    // Delete old image if exists
    if (oldImagePath) {
      await deleteCategoryImage(oldImagePath);
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload image
    const result = await uploadCategoryImage(
      parseInt(categoryId as string),
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

    // Update category's picture_url with the new path
    await updateCategory(parseInt(categoryId as string), {
      picture_url: result.data!.path
    });

    return NextResponse.json({ path: result.data!.path });
  } catch (error) {
    console.error('Category image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload category image' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload/category-image
 * Delete a category image
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const imagePath = searchParams.get('imagePath');

    if (!categoryId || !imagePath) {
      return NextResponse.json(
        { error: 'Missing required parameters: categoryId, imagePath' },
        { status: 400 }
      );
    }

    // Delete image files from storage
    const result = await deleteCategoryImage(imagePath);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Clear category's picture_url
    await updateCategory(parseInt(categoryId), {
      picture_url: null
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Category image delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete category image' },
      { status: 500 }
    );
  }
}
