/**
 * Public Single Project API
 * GET - Get published project with details and availability check
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCustomProjectWithDetails, checkProjectAvailability } from '@/lib/api';

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

    // Only allow access to published projects publicly
    if (project.status !== 'published') {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check availability of products/special
    const availability = await checkProjectAvailability(projectId);

    return NextResponse.json({
      project,
      availability,
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}
