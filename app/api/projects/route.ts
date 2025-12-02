/**
 * Public Custom Projects API
 * GET - List published projects
 */

import { NextResponse } from 'next/server';
import { getPublishedCustomProjectsWithDetails } from '@/lib/api';

export async function GET() {
  try {
    const projects = await getPublishedCustomProjectsWithDetails();
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
