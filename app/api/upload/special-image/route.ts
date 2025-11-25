/**
 * Special Image Upload API Route
 *
 * Handles special image uploads with automatic resizing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadSpecialImage, deleteSpecialImage } from '@/lib/storage';
import { updateSpecial } from '@/lib/api';

/**
 * POST /api/upload/special-image
 * Upload a new special image
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const specialId = formData.get('specialId');
    const file = formData.get('file') as File;
    const oldImagePath = formData.get('oldImagePath') as string | null;

    // Validate required fields
    if (!specialId || !file) {
      return NextResponse.json(
        { error: 'Missing required fields: specialId, file' },
        { status: 400 }
      );
    }

    // Delete old image if exists
    if (oldImagePath) {
      await deleteSpecialImage(oldImagePath);
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload image
    const result = await uploadSpecialImage(
      parseInt(specialId as string),
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

    // Update special's picture_url with the new path
    await updateSpecial(parseInt(specialId as string), {
      picture_url: result.data!.path
    });

    return NextResponse.json({ path: result.data!.path });
  } catch (error) {
    console.error('Special image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload special image' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload/special-image
 * Delete a special image
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specialId = searchParams.get('specialId');
    const imagePath = searchParams.get('imagePath');

    if (!specialId || !imagePath) {
      return NextResponse.json(
        { error: 'Missing required parameters: specialId, imagePath' },
        { status: 400 }
      );
    }

    // Delete image files from storage
    const result = await deleteSpecialImage(imagePath);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Clear special's picture_url
    await updateSpecial(parseInt(specialId), {
      picture_url: null
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Special image delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete special image' },
      { status: 500 }
    );
  }
}
