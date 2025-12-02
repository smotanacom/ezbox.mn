/**
 * Admin Project Products API
 * POST - Add product to project
 * DELETE - Remove product from project
 * PUT - Update product in project
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  addProductToProject,
  removeProductFromProject,
  updateProjectProduct,
} from '@/lib/api';

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

    const body = await request.json();

    if (!body.product_id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const projectProduct = await addProductToProject(
      projectId,
      body.product_id,
      body.quantity || 1,
      body.selected_parameters || {}
    );

    return NextResponse.json({ projectProduct });
  } catch (error: any) {
    console.error('Error adding product to project:', error);

    // Handle duplicate product error
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Product already in project' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to add product' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.projectProductId) {
      return NextResponse.json(
        { error: 'Project product ID is required' },
        { status: 400 }
      );
    }

    const projectProduct = await updateProjectProduct(body.projectProductId, {
      quantity: body.quantity,
      selected_parameters: body.selected_parameters,
    });

    return NextResponse.json({ projectProduct });
  } catch (error) {
    console.error('Error updating project product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectProductId = searchParams.get('projectProductId');

    if (!projectProductId) {
      return NextResponse.json(
        { error: 'Project product ID required' },
        { status: 400 }
      );
    }

    await removeProductFromProject(parseInt(projectProductId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing product from project:', error);
    return NextResponse.json(
      { error: 'Failed to remove product' },
      { status: 500 }
    );
  }
}
