/**
 * Site Image Upload API Route
 *
 * Handles site settings image uploads (e.g., custom design cover) with automatic resizing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadSiteImage, deleteSiteImage } from '@/lib/storage';
import { updateSiteSetting, getSiteSetting } from '@/lib/api';

/**
 * POST /api/upload/site-image
 * Upload a new site settings image
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const settingKey = formData.get('settingKey') as string;
    const file = formData.get('file') as File;
    const oldImagePath = formData.get('oldImagePath') as string | null;

    // Validate required fields
    if (!settingKey || !file) {
      return NextResponse.json(
        { error: 'Missing required fields: settingKey, file' },
        { status: 400 }
      );
    }

    // Validate setting key (only allow known keys)
    const allowedKeys = ['custom_design_cover_image'];
    if (!allowedKeys.includes(settingKey)) {
      return NextResponse.json(
        { error: 'Invalid setting key' },
        { status: 400 }
      );
    }

    // Delete old image if exists
    if (oldImagePath) {
      await deleteSiteImage(oldImagePath);
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload image
    const result = await uploadSiteImage(
      settingKey,
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

    // Update site setting with the new original path (for hero display)
    await updateSiteSetting(settingKey, result.data!.originalPath);

    return NextResponse.json({
      path: result.data!.originalPath,
      mediumPath: result.data!.path
    });
  } catch (error) {
    console.error('Site image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload site image' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload/site-image
 * Delete a site settings image
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const settingKey = searchParams.get('settingKey');
    const imagePath = searchParams.get('imagePath');

    if (!settingKey || !imagePath) {
      return NextResponse.json(
        { error: 'Missing required parameters: settingKey, imagePath' },
        { status: 400 }
      );
    }

    // Delete image files from storage
    const result = await deleteSiteImage(imagePath);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Clear site setting value
    await updateSiteSetting(settingKey, null);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Site image delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete site image' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload/site-image
 * Get current site image path
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const settingKey = searchParams.get('settingKey');

    if (!settingKey) {
      return NextResponse.json(
        { error: 'Missing required parameter: settingKey' },
        { status: 400 }
      );
    }

    const setting = await getSiteSetting(settingKey);

    return NextResponse.json({
      path: setting?.value || null
    });
  } catch (error) {
    console.error('Site image get error:', error);
    return NextResponse.json(
      { error: 'Failed to get site image' },
      { status: 500 }
    );
  }
}
