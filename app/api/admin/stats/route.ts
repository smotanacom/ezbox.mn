import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Require admin authentication
    await requireAdmin();

    // Fetch order statistics
    const { data: orders, error } = await supabase
      .from('orders')
      .select('status, total_price') as { data: { status: string; total_price: number }[] | null; error: Error | null };

    if (error) throw error;

    const orderList = orders || [];
    const totalOrders = orderList.length;
    const pendingOrders = orderList.filter((o) => o.status === 'pending').length;
    const processingOrders = orderList.filter((o) => o.status === 'processing').length;
    const shippedOrders = orderList.filter((o) => o.status === 'shipped').length;
    const completedOrders = orderList.filter((o) => o.status === 'completed').length;
    const cancelledOrders = orderList.filter((o) => o.status === 'cancelled').length;

    return NextResponse.json({
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      completedOrders,
      cancelledOrders,
    });
  } catch (error: unknown) {
    console.error('Error fetching admin stats:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch stats';
    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
