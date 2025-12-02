/**
 * Admin Single Project API
 * GET - Get project with all details
 * PUT - Update project
 * DELETE - Delete project
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getCustomProjectWithDetails,
  updateCustomProject,
  deleteCustomProject,
} from '@/lib/api';
import { deleteProjectCoverImage } from '@/lib/storage';

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

    const project = await getCustomProjectWithDetails(projectId);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const body = await request.json();

    // Get current project to check for cover image changes
    const currentProject = await getCustomProjectWithDetails(projectId);
    if (!currentProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // If cover image is being removed or replaced, delete old one
    if (
      currentProject.cover_image_path &&
      body.cover_image_path !== undefined &&
      body.cover_image_path !== currentProject.cover_image_path
    ) {
      await deleteProjectCoverImage(currentProject.cover_image_path);
    }

    const project = await updateCustomProject(projectId, {
      title: body.title?.trim(),
      description: body.description?.trim() || null,
      cover_image_path: body.cover_image_path,
      special_id: body.special_id || null,
      status: body.status,
      display_order: body.display_order,
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Get project to delete cover image
    const project = await getCustomProjectWithDetails(projectId);
    if (project?.cover_image_path) {
      await deleteProjectCoverImage(project.cover_image_path);
    }

    // Note: Gallery images will be deleted via CASCADE but we should also delete from storage
    // For now, the cascade handles DB cleanup; storage cleanup would need separate handling

    await deleteCustomProject(projectId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
