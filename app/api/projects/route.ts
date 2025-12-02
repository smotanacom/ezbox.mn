/**
 * Public Custom Projects API
 * GET - List published projects (optimized for listing)
 */

import { NextResponse } from 'next/server';
import { getPublishedProjectsForListing } from '@/lib/api';

export async function GET() {
  try {
    const projects = await getPublishedProjectsForListing();
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
