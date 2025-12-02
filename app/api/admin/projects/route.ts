/**
 * Admin Custom Projects API
 * GET - List all projects (with all statuses)
 * POST - Create a new project
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCustomProjects, createCustomProject } from '@/lib/api';

export async function GET() {
  try {
    const projects = await getCustomProjects(true); // Include all statuses for admin
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const project = await createCustomProject({
      title: body.title.trim(),
      description: body.description?.trim() || undefined,
      status: body.status || 'draft',
      display_order: body.display_order || 0,
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
