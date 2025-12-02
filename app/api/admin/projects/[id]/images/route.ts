/**
 * Admin Project Images API
 * GET - List project images
 * POST - Upload new image
 * DELETE - Delete image
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProjectImages, updateCustomProject } from '@/lib/api';
import { uploadProjectImage, deleteProjectImage, uploadProjectCoverImage } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const images = await getProjectImages(projectId);
    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error fetching project images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const isCover = formData.get('isCover') === 'true';
    const displayOrder = parseInt(formData.get('displayOrder') as string) || 0;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (isCover) {
      // Upload as cover image
      const result = await uploadProjectCoverImage(
        projectId,
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

      // Update project with cover image path
      await updateCustomProject(projectId, {
        cover_image_path: result.data!.path,
      });

      return NextResponse.json({ path: result.data!.path });
    } else {
      // Upload as gallery image
      const result = await uploadProjectImage(
        projectId,
        buffer,
        file.name,
        file.type,
        displayOrder
      );

      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({ image: result.data });
    }
  } catch (error) {
    console.error('Error uploading project image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID required' },
        { status: 400 }
      );
    }

    const result = await deleteProjectImage(imageId);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
