import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import {updateParameterGroup, deleteParameterGroup, getParameters } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { clearCache } from '@/lib/cache';
import type { ParameterGroup } from '@/types/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const groupId = parseInt(id);

    if (isNaN(groupId)) {
      return NextResponse.json(
        { error: 'Invalid parameter group ID' },
        { status: 400 }
      );
    }

    // Get group
    const { data: group, error } = await supabase
      .from('parameter_groups')
      .select('*')
      .eq('id', groupId)
      .single() as { data: ParameterGroup | null; error: any };

    if (error || !group) {
      return NextResponse.json(
        { error: 'Parameter group not found' },
        { status: 404 }
      );
    }

    // Get parameters for this group
    const parameters = await getParameters(groupId);

    return NextResponse.json({
      parameterGroup: {
        ...group,
        parameters,
      },
    });
  } catch (error: any) {
    console.error('Error fetching parameter group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch parameter group' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const groupId = parseInt(id);

    if (isNaN(groupId)) {
      return NextResponse.json(
        { error: 'Invalid parameter group ID' },
        { status: 400 }
      );
    }

    const updates = await request.json();
    const parameterGroup = await updateParameterGroup(groupId, updates);

    // Clear caches
    clearCache('products-data');
    clearCache('products-data-all');

    return NextResponse.json({ parameterGroup });
  } catch (error: any) {
    console.error('Error updating parameter group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update parameter group' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const groupId = parseInt(id);

    if (isNaN(groupId)) {
      return NextResponse.json(
        { error: 'Invalid parameter group ID' },
        { status: 400 }
      );
    }

    await deleteParameterGroup(groupId);

    // Clear caches
    clearCache('products-data');
    clearCache('products-data-all');

    return NextResponse.json({
      message: 'Parameter group deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting parameter group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete parameter group' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
