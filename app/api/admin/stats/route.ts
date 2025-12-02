import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Require admin authentication
    await requireAdmin();

    // Fetch order statistics using PostgreSQL function (single query, computed in DB)
    const { data, error } = await supabase.rpc('get_order_stats');

    if (error) throw error;

    // RPC returns array with single row
    const defaultStats = {
      total_orders: 0,
      pending_orders: 0,
      processing_orders: 0,
      shipped_orders: 0,
      completed_orders: 0,
      cancelled_orders: 0,
      total_revenue: 0,
    };
    const stats = (data && data[0]) ? data[0] : defaultStats;

    return NextResponse.json({
      totalOrders: Number(stats.total_orders),
      pendingOrders: Number(stats.pending_orders),
      processingOrders: Number(stats.processing_orders),
      shippedOrders: Number(stats.shipped_orders),
      completedOrders: Number(stats.completed_orders),
      cancelledOrders: Number(stats.cancelled_orders),
      totalRevenue: Number(stats.total_revenue),
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
