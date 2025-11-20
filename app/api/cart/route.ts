import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Cart } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    // Find or create cart
    let query = supabase
      .from('carts')
      .select('*')
      .eq('status', 'active');

    if (userId) {
      query = query.eq('user_id', parseInt(userId));
    } else if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    let { data: cart } = await query.maybeSingle();

    // Create new cart if none exists
    if (!cart) {
      const cartData: any = { status: 'active' };
      if (userId) cartData.user_id = parseInt(userId);
      if (sessionId) cartData.session_id = sessionId;

      const { data: newCart, error: createError } = await supabase
        .from('carts')
        .insert(cartData)
        .select()
        .single();

      if (createError) throw createError;
      cart = newCart;
    }

    if (!cart) {
      return NextResponse.json({ error: 'Failed to get or create cart' }, { status: 500 });
    }

    // Type assertion for cart after null check
    const validCart = cart as Cart;

    // Fetch cart items with all related data in one query using Supabase joins
    const { data: items, error: itemsError } = await supabase
      .from('product_in_cart')
      .select(`
        *,
        product:products(
          *,
          category:categories(*),
          parameter_groups:product_parameter_groups(
            *,
            parameter_group:parameter_groups(*),
            default_parameter:parameters(*)
          )
        )
      `)
      .eq('cart_id', validCart.id);

    if (itemsError) throw itemsError;

    // Fetch all parameters for each product's parameter groups
    const productIds = (items || [])
      .map((item: any) => item.product?.id)
      .filter(Boolean);

    let allParameters: any[] = [];
    if (productIds.length > 0) {
      const { data: ppgs } = await supabase
        .from('product_parameter_groups')
        .select('parameter_group_id')
        .in('product_id', productIds);

      const paramGroupIds = [...new Set((ppgs || []).map((ppg: any) => ppg.parameter_group_id))];

      if (paramGroupIds.length > 0) {
        const { data: params } = await supabase
          .from('parameters')
          .select('*')
          .in('parameter_group_id', paramGroupIds);

        allParameters = params || [];
      }
    }

    // Enhance items with all parameters
    const enhancedItems = (items || []).map((item: any) => {
      if (item.product?.parameter_groups) {
        item.product.parameter_groups = item.product.parameter_groups.map((pg: any) => {
          const parameters = allParameters.filter(
            (p: any) => p.parameter_group_id === pg.parameter_group_id
          );
          return { ...pg, parameters };
        });
      }
      return item;
    });

    return NextResponse.json({
      cart: validCart,
      items: enhancedItems,
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  }
}
