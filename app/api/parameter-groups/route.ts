import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { getParameterGroups, getParameters, createParameterGroup, createParameterGroupWithParameters } from '@/lib/api';
import { clearCache } from '@/lib/cache';

// GET: Return all parameter groups with their parameters (batched)
export async function GET() {
  try {
    // Get all parameter groups
    const parameterGroups = await getParameterGroups();

    // Get all parameters
    const allParameters = await getParameters();

    // Batch parameters with their groups
    const parameterGroupsWithParameters = parameterGroups.map(group => ({
      ...group,
      parameters: allParameters.filter(p => p.parameter_group_id === group.id),
    }));

    return NextResponse.json(
      { parameterGroups: parameterGroupsWithParameters },
      {
        headers: {
          // Cache for 1 hour, revalidate in background for 24 hours
          'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching parameter groups:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch parameter groups' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const data = await request.json();

    // Check if we're creating with parameters
    if (data.parameters && Array.isArray(data.parameters)) {
      const result = await createParameterGroupWithParameters(
        {
          name: data.name,
          internal_name: data.internal_name,
          description: data.description,
        },
        data.parameters
      );

      // Clear caches
      clearCache('products-data');
      clearCache('products-data-all');

      return NextResponse.json({
        parameterGroup: result.group,
        parameters: result.parameters
      });
    } else {
      // Create without parameters
      const parameterGroup = await createParameterGroup(data);

      // Clear caches
      clearCache('products-data');
      clearCache('products-data-all');

      return NextResponse.json({ parameterGroup });
    }
  } catch (error: any) {
    console.error('Error creating parameter group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create parameter group' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
