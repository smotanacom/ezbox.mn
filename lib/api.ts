import { supabase } from './supabase';
import type {
  Category,
  Product,
  ProductWithDetails,
  Parameter,
  ParameterGroup,
  Cart,
  ProductInCart,
  CartItemWithDetails,
  Special,
  SpecialWithItems,
  ParameterSelection,
  Order,
  User,
} from '@/types/database';

// Categories
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('id');

  if (error) throw error;
  return data || [];
}

// Products
export async function getProducts(categoryId?: number): Promise<Product[]> {
  let query = supabase.from('products').select('*');

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query.order('id');

  if (error) throw error;
  return data || [];
}

export async function getProductWithDetails(productId: number): Promise<ProductWithDetails | null> {
  const { data: product, error: productError } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('id', productId)
    .single();

  if (productError) throw productError;
  if (!product) return null;

  // Get parameter groups for this product
  const { data: paramGroups, error: paramGroupsError } = await supabase
    .from('product_parameter_groups')
    .select(`
      *,
      parameter_group:parameter_groups(*),
      default_parameter:parameters(*)
    `)
    .eq('product_id', productId);

  if (paramGroupsError) throw paramGroupsError;

  // Get all parameters for each parameter group
  const parameterGroupsWithParams = await Promise.all(
    (paramGroups || []).map(async (pg: any) => {
      const { data: params } = await supabase
        .from('parameters')
        .select('*')
        .eq('parameter_group_id', pg.parameter_group_id);

      return {
        ...pg,
        parameters: params || [],
      };
    })
  );

  return {
    ...(product as any),
    parameter_groups: parameterGroupsWithParams,
  };
}

export async function getAllProductsWithDetails(): Promise<ProductWithDetails[]> {
  // Use the API route that batches all queries server-side
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const response = await fetch(`${baseUrl}/api/products`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  const data = await response.json();
  const { products, categories, productParamGroups, parameterGroups, parameters } = data;

  if (!products) return [];

  // Create lookup maps for efficient assembly
  const categoryMap = new Map(categories?.map((c: any) => [c.id, c]) || []);
  const paramGroupMap = new Map(parameterGroups?.map((pg: any) => [pg.id, pg]) || []);
  const parametersByGroupId = (parameters || []).reduce((acc: any, param: any) => {
    if (!acc[param.parameter_group_id]) {
      acc[param.parameter_group_id] = [];
    }
    acc[param.parameter_group_id].push(param);
    return acc;
  }, {} as Record<number, any[]>);

  // Group product_parameter_groups by product_id
  const ppgByProductId = (productParamGroups || []).reduce((acc: any, ppg: any) => {
    if (!acc[ppg.product_id]) {
      acc[ppg.product_id] = [];
    }
    acc[ppg.product_id].push(ppg);
    return acc;
  }, {} as Record<number, any[]>);

  // Assemble the complete product details
  return products.map((product: any) => {
    const category = categoryMap.get(product.category_id);
    const ppgs = ppgByProductId[product.id] || [];

    const parameterGroupsWithParams = ppgs.map((ppg: any) => {
      const paramGroup = paramGroupMap.get(ppg.parameter_group_id);
      const params = parametersByGroupId[ppg.parameter_group_id] || [];
      const defaultParam = params.find((p: any) => p.id === ppg.default_parameter_id);

      return {
        ...ppg,
        parameter_group: paramGroup,
        default_parameter: defaultParam,
        parameters: params,
      };
    });

    return {
      ...product,
      category,
      parameter_groups: parameterGroupsWithParams,
    };
  });
}

// Parameter Groups and Parameters
export async function getParameterGroups(): Promise<ParameterGroup[]> {
  const { data, error } = await supabase
    .from('parameter_groups')
    .select('*')
    .order('id');

  if (error) throw error;
  return data || [];
}

export async function getParameters(groupId?: number): Promise<Parameter[]> {
  let query = supabase.from('parameters').select('*');

  if (groupId) {
    query = query.eq('parameter_group_id', groupId);
  }

  const { data, error } = await query.order('id');

  if (error) throw error;
  return data || [];
}

// Cart functions
export async function getOrCreateCart(userId?: number, sessionId?: string): Promise<Cart> {
  // Try to find existing active cart
  let query = supabase
    .from('carts')
    .select('*')
    .eq('status', 'active');

  if (userId) {
    query = query.eq('user_id', userId);
  } else if (sessionId) {
    query = query.eq('session_id', sessionId);
  }

  const { data: existingCarts } = await query.maybeSingle();

  if (existingCarts) {
    return existingCarts;
  }

  // Create new cart
  const { data: newCart, error } = await supabase
    .from('carts')
    .insert({
      user_id: userId || null,
      session_id: sessionId || null,
      status: 'active',
    } as any)
    .select()
    .single();

  if (error) throw error;
  return newCart as Cart;
}

export async function getCartItems(cartId: number): Promise<CartItemWithDetails[]> {
  const { data, error } = await supabase
    .from('product_in_cart')
    .select('*')
    .eq('cart_id', cartId);

  if (error) throw error;
  if (!data) return [];

  // Enrich with product details
  const itemsWithDetails = await Promise.all(
    data.map(async (item: any) => {
      const product = await getProductWithDetails(item.product_id);
      return {
        ...item,
        product,
      };
    })
  );

  return itemsWithDetails as CartItemWithDetails[];
}

export async function addToCart(
  cartId: number,
  productId: number,
  quantity: number,
  selectedParameters: ParameterSelection
): Promise<ProductInCart> {
  const { data, error } = await supabase
    .from('product_in_cart')
    .insert({
      cart_id: cartId,
      product_id: productId,
      quantity,
      selected_parameters: selectedParameters as any,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data as ProductInCart;
}

export async function updateCartItem(
  itemId: number,
  quantity?: number,
  selectedParameters?: ParameterSelection
): Promise<ProductInCart> {
  const updates: any = {};
  if (quantity !== undefined) updates.quantity = quantity;
  if (selectedParameters !== undefined) {
    updates.selected_parameters = selectedParameters;
  }
  updates.updated_at = new Date().toISOString();

  const { data, error } = await (supabase as any)
    .from('product_in_cart')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data as ProductInCart;
}

export async function removeFromCart(itemId: number): Promise<void> {
  const { error } = await supabase
    .from('product_in_cart')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
}

export async function calculateCartTotal(cartId: number): Promise<number> {
  const items = await getCartItems(cartId);

  let total = 0;
  for (const item of items) {
    if (!item.product) continue;

    let itemPrice = item.product.base_price;

    // Add parameter modifiers
    if (item.selected_parameters) {
      const selections = item.selected_parameters as ParameterSelection;
      const product = item.product;

      for (const [paramGroupId, paramId] of Object.entries(selections)) {
        const paramGroup = product.parameter_groups?.find(
          pg => pg.parameter_group_id === parseInt(paramGroupId)
        );
        const param = paramGroup?.parameters?.find(p => p.id === paramId);
        if (param) {
          itemPrice += param.price_modifier;
        }
      }
    }

    total += itemPrice * item.quantity;
  }

  return total;
}

// Specials
export async function getSpecials(status?: string): Promise<SpecialWithItems[]> {
  let query = supabase.from('specials').select('*');

  if (status) {
    query = query.eq('status', status);
  }

  const { data: specials, error } = await query.order('id');

  if (error) throw error;
  if (!specials) return [];

  // Get items for each special
  const specialsWithItems = await Promise.all(
    specials.map(async (special: any) => {
      const { data: items } = await supabase
        .from('special_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('special_id', special.id);

      return {
        ...special,
        items: items || [],
      };
    })
  );

  return specialsWithItems as SpecialWithItems[];
}

export async function addSpecialToCart(
  cartId: number,
  specialId: number
): Promise<void> {
  const { data: special, error: specialError } = await supabase
    .from('specials')
    .select(`
      *,
      items:special_items(*)
    `)
    .eq('id', specialId)
    .single();

  if (specialError) throw specialError;
  if (!special || !(special as any).items) return;

  // Add each item from the special to the cart
  for (const item of (special as any).items as any[]) {
    await supabase
      .from('product_in_cart')
      .insert({
        cart_id: cartId,
        product_id: item.product_id,
        quantity: item.quantity,
        selected_parameters: item.selected_parameters,
        special_id: specialId,
      } as any);
  }
}

// Calculate product price with parameters
export function calculateProductPrice(
  product: ProductWithDetails,
  selectedParameters: ParameterSelection
): number {
  let price = product.base_price;

  for (const [paramGroupId, paramId] of Object.entries(selectedParameters)) {
    const paramGroup = product.parameter_groups?.find(
      pg => pg.parameter_group_id === parseInt(paramGroupId)
    );
    const param = paramGroup?.parameters?.find(p => p.id === paramId);
    if (param) {
      price += param.price_modifier;
    }
  }

  return price;
}

// Orders
export async function createOrder(
  cartId: number,
  userId: number | null,
  name: string,
  phone: string,
  address: string,
  secondaryPhone?: string
): Promise<Order> {
  // Calculate total
  const total = await calculateCartTotal(cartId);

  // Create order
  const { data, error } = await supabase
    .from('orders')
    .insert({
      cart_id: cartId,
      user_id: userId,
      name,
      phone,
      address,
      secondary_phone: secondaryPhone || null,
      total_price: total,
      status: 'pending',
    } as any)
    .select()
    .single();

  if (error) throw error;

  // Mark cart as checked out
  await supabase
    .from('carts')
    .update({ status: 'checked_out' } as any)
    .eq('id', cartId);

  return data as Order;
}

// User lookup
export async function getUserByPhone(phone: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (error) throw error;
  return data as User | null;
}

// Get all orders for a user
export async function getUserOrders(userId: number): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Order[];
}

// Get a single order by ID
export async function getOrderById(orderId: number): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (error) throw error;
  return data as Order | null;
}

// Get order items with product details
export async function getOrderItems(cartId: number) {
  return getCartItems(cartId);
}
