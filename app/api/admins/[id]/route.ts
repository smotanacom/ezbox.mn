import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { supabase } from '@/lib/supabase';

// DELETE /api/admins/[id] - Delete an admin
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const currentAdmin = await requireAdmin();

    const { id } = await params;
    const adminId = parseInt(id, 10);

    if (isNaN(adminId)) {
      return NextResponse.json(
        { error: 'Invalid admin ID' },
        { status: 400 }
      );
    }

    // Prevent admin from deleting themselves
    if (currentAdmin.id === adminId) {
      return NextResponse.json(
        { error: 'You cannot delete your own admin account' },
        { status: 403 }
      );
    }

    // Delete admin
    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', adminId);

    if (error) {
      console.error('Error deleting admin:', error);
      return NextResponse.json(
        { error: 'Failed to delete admin' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/admins/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
