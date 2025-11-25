import { supabase } from './supabase';
import { sendOrderNotificationEmail } from './email';
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
  SpecialItem,
  ParameterSelection,
  Order,
  User,
  History,
  HistoryWithUser,
  OrderSnapshot,
  OrderItem,
  OrderItemParameter,
  OrderTotals,
} from '@/types/database';

// Categories
export async function getCategories(includeInactive = false): Promise<Category[]> {
  let query = supabase.from('categories').select('*');

  // Only show active categories by default
  if (!includeInactive) {
    query = query.eq('status', 'active');
  }

  const { data, error } = await query.order('id');

  if (error) throw error;
  return data || [];
}

// Products
export async function getProducts(categoryId?: number, includeInactive = false): Promise<Product[]> {
  let query = supabase.from('products').select('*');

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  // Only show active products by default (for public-facing pages)
  if (!includeInactive) {
    query = query.eq('status', 'active');
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

  // Get parameter groups, images, and model in parallel
  const [
    { data: paramGroups, error: paramGroupsError },
    { data: images, error: imagesError },
    { data: model, error: modelError }
  ] = await Promise.all([
    supabase
      .from('product_parameter_groups')
      .select(`
        *,
        parameter_group:parameter_groups(*),
        default_parameter:parameters(*)
      `)
      .eq('product_id', productId),
    supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('display_order', { ascending: true }),
    supabase
      .from('product_models')
      .select('*')
      .eq('product_id', productId)
      .single()
  ]);

  if (paramGroupsError) throw paramGroupsError;
  if (imagesError) throw imagesError;
  // modelError is OK if no model exists (PGRST116 = no rows)

  // Get all parameters for each parameter group (only active parameters)
  const parameterGroupsWithParams = await Promise.all(
    (paramGroups || []).map(async (pg: any) => {
      const { data: params } = await supabase
        .from('parameters')
        .select('*')
        .eq('parameter_group_id', pg.parameter_group_id)
        .eq('status', 'active');  // Only show active parameters

      return {
        ...pg,
        parameters: params || [],
      };
    })
  );

  return {
    ...(product as any),
    parameter_groups: parameterGroupsWithParams,
    images: images || [],
    model: (modelError?.code === 'PGRST116') ? null : (model || null),
  };
}

// Internal function that does the actual database queries
async function _getAllProductsWithDetailsFromDB(includeInactive = false): Promise<ProductWithDetails[]> {
  // Batch fetch all related data in parallel
  const [
    { data: products, error: productsError },
    { data: categories, error: categoriesError },
    { data: productParamGroups, error: ppgError },
    { data: parameterGroups, error: pgError },
    { data: parameters, error: paramsError },
    { data: images, error: imagesError },
    { data: models, error: modelsError },
  ] = await Promise.all([
    includeInactive
      ? supabase.from('products').select('*').order('id')
      : supabase.from('products').select('*').eq('status', 'active').order('id'),
    includeInactive
      ? supabase.from('categories').select('*').order('id')
      : supabase.from('categories').select('*').eq('status', 'active').order('id'),
    supabase.from('product_parameter_groups').select('*'),
    includeInactive
      ? supabase.from('parameter_groups').select('*').order('id')
      : supabase.from('parameter_groups').select('*').eq('status', 'active').order('id'),
    includeInactive
      ? supabase.from('parameters').select('*').order('id')
      : supabase.from('parameters').select('*').eq('status', 'active').order('id'),
    supabase.from('product_images').select('*').order('display_order', { ascending: true }),
    supabase.from('product_models').select('*'),
  ]);

  if (productsError) throw productsError;
  if (categoriesError) throw categoriesError;
  if (ppgError) throw ppgError;
  if (pgError) throw pgError;
  if (paramsError) throw paramsError;
  if (imagesError) throw imagesError;
  if (modelsError) throw modelsError;

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

  // Group images by product_id
  const imagesByProductId = (images || []).reduce((acc: any, img: any) => {
    if (!acc[img.product_id]) {
      acc[img.product_id] = [];
    }
    acc[img.product_id].push(img);
    return acc;
  }, {} as Record<number, any[]>);

  // Group models by product_id
  const modelsByProductId = new Map(models?.map((m: any) => [m.product_id, m]) || []);

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
      images: imagesByProductId[product.id] || [],
      model: modelsByProductId.get(product.id) || null,
    };
  });
}

export async function getAllProductsWithDetails(includeInactive = false): Promise<ProductWithDetails[]> {
  // If running on the server (Node.js environment), query DB directly
  if (typeof window === 'undefined') {
    return _getAllProductsWithDetailsFromDB(includeInactive);
  }

  // If running on the client, use the API route
  const url = includeInactive ? '/api/products?includeInactive=true' : '/api/products';
  const response = await fetch(url, {
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch products: ${errorText}`);
  }

  const data = await response.json();
  return data.products || [];
}

// Parameter Groups and Parameters
export async function getParameterGroups(includeInactive = false): Promise<ParameterGroup[]> {
  let query = supabase.from('parameter_groups').select('*');

  // Only show active parameter groups by default
  if (!includeInactive) {
    query = query.eq('status', 'active');
  }

  const { data, error } = await query.order('id');

  if (error) throw error;
  return data || [];
}

export async function getParameterGroup(id: number): Promise<ParameterGroup | null> {
  const { data, error } = await supabase
    .from('parameter_groups')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
}

export async function getParameters(groupId?: number, includeInactive = false): Promise<Parameter[]> {
  let query = supabase.from('parameters').select('*');

  if (groupId) {
    query = query.eq('parameter_group_id', groupId);
  }

  // Only show active parameters by default
  if (!includeInactive) {
    query = query.eq('status', 'active');
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
  // Check if an identical item (same product + parameters) already exists in the cart
  const { data: existingItems, error: fetchError } = await supabase
    .from('product_in_cart')
    .select('*')
    .eq('cart_id', cartId)
    .eq('product_id', productId);

  if (fetchError) throw fetchError;

  // Find an item with matching selected_parameters
  const matchingItem = (existingItems || []).find((item: any) => {
    const existingParams = item.selected_parameters || {};
    const newParams = selectedParameters || {};

    // Compare parameters by converting to strings
    return JSON.stringify(existingParams) === JSON.stringify(newParams);
  }) as any;

  if (matchingItem) {
    // Update quantity of existing item
    const newQuantity = matchingItem.quantity + quantity;
    const { data, error } = await (supabase as any)
      .from('product_in_cart')
      .update({
        quantity: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', matchingItem.id)
      .select()
      .single();

    if (error) throw error;
    return data as ProductInCart;
  } else {
    // Insert new item
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

export async function removeSpecialFromCart(cartId: number, specialId: number): Promise<void> {
  const { error } = await supabase
    .from('product_in_cart')
    .delete()
    .eq('cart_id', cartId)
    .eq('special_id', specialId);

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
export async function getSpecials(status?: string | null): Promise<SpecialWithItems[]> {
  let query = supabase.from('specials').select('*');

  // If status is explicitly provided (including null to show all), use it
  // Otherwise, default to showing only 'available' specials
  if (status !== undefined) {
    if (status !== null) {
      query = query.eq('status', status);
    }
    // If status is null, show all (no filter)
  } else {
    // Default: only show 'available' specials
    query = query.eq('status', 'available');
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

// Calculate the original price of a special (sum of all items with their parameters)
export async function calculateSpecialOriginalPrice(specialId: number): Promise<number> {
  const { data: items, error } = await supabase
    .from('special_items')
    .select(`
      *,
      product:products(*)
    `)
    .eq('special_id', specialId);

  if (error) throw error;
  if (!items) return 0;

  let total = 0;
  for (const item of items as any[]) {
    if (!item.product) continue;

    // Get product details with parameters
    const product = await getProductWithDetails(item.product.id);
    if (!product) continue;

    // Calculate price with selected parameters
    const selectedParams = (item.selected_parameters as ParameterSelection) || {};
    const itemPrice = calculateProductPrice(product, selectedParams);
    total += itemPrice * item.quantity;
  }

  return total;
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

// Admin: Special Management
export async function createSpecial(special: {
  name: string;
  description?: string;
  discounted_price: number;
  status?: string;
  picture_url?: string;
}): Promise<Special> {
  const { data, error } = await supabase
    .from('specials')
    .insert({
      name: special.name,
      description: special.description || null,
      discounted_price: special.discounted_price,
      status: special.status || 'draft',
      picture_url: special.picture_url || null,
    } as any)
    .select()
    .single();

  if (error) {
    console.error('Supabase error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw new Error(error.message || 'Failed to create special');
  }
  return data as Special;
}

export async function updateSpecial(
  specialId: number,
  updates: {
    name?: string;
    description?: string;
    discounted_price?: number;
    status?: string;
    picture_url?: string | null;
  }
): Promise<Special> {
  const { data, error } = await (supabase as any)
    .from('specials')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', specialId)
    .select()
    .single();

  if (error) throw error;
  return data as Special;
}

export async function deleteSpecial(specialId: number): Promise<void> {
  // First delete all special_items entries
  await supabase
    .from('special_items')
    .delete()
    .eq('special_id', specialId);

  // Then delete the special
  const { error } = await supabase
    .from('specials')
    .delete()
    .eq('id', specialId);

  if (error) throw error;
}

export async function getSpecialWithDetails(specialId: number): Promise<SpecialWithItems | null> {
  const { data: special, error: specialError } = await supabase
    .from('specials')
    .select('*')
    .eq('id', specialId)
    .single();

  if (specialError) throw specialError;
  if (!special) return null;

  // Get items for this special
  const { data: items, error: itemsError } = await supabase
    .from('special_items')
    .select(`
      *,
      product:products(*)
    `)
    .eq('special_id', specialId);

  if (itemsError) throw itemsError;

  return {
    ...(special as any),
    items: items || [],
  } as SpecialWithItems;
}

export async function addItemToSpecial(
  specialId: number,
  productId: number,
  quantity: number,
  selectedParameters?: ParameterSelection
): Promise<SpecialItem> {
  const { data, error } = await supabase
    .from('special_items')
    .insert({
      special_id: specialId,
      product_id: productId,
      quantity,
      selected_parameters: selectedParameters || null,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data as SpecialItem;
}

export async function updateSpecialItem(
  itemId: number,
  quantity?: number,
  selectedParameters?: ParameterSelection
): Promise<SpecialItem> {
  const updates: any = {};
  if (quantity !== undefined) updates.quantity = quantity;
  if (selectedParameters !== undefined) {
    updates.selected_parameters = selectedParameters;
  }

  const { data, error } = await (supabase as any)
    .from('special_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data as SpecialItem;
}

export async function removeItemFromSpecial(itemId: number): Promise<void> {
  const { error } = await supabase
    .from('special_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
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

// Helper function to build order snapshot from cart items
async function buildOrderSnapshot(cartId: number): Promise<OrderSnapshot> {
  // Get cart items with full product details
  const cartItems = await getCartItems(cartId);

  // Build order items array
  const orderItems: OrderItem[] = cartItems.map((item) => {
    const product = item.product!;

    // Get first image URL
    const imageUrl = product.images && product.images.length > 0
      ? `/api/images/${product.images[0].id}`
      : null;

    // Build parameters array (human-readable)
    const parameters: OrderItemParameter[] = [];
    if (item.selected_parameters && product.parameter_groups) {
      const selections = item.selected_parameters as ParameterSelection;

      for (const [paramGroupId, paramId] of Object.entries(selections)) {
        const paramGroup = product.parameter_groups.find(
          pg => pg.parameter_group_id === parseInt(paramGroupId)
        );
        const param = paramGroup?.parameters?.find(p => p.id === paramId);

        if (paramGroup && param && paramGroup.parameter_group) {
          parameters.push({
            group: paramGroup.parameter_group.name,
            name: param.name,
            value: param.description || undefined,
          });
        }
      }
    }

    // Calculate unit price (base price + parameter modifiers)
    let unitPrice = product.base_price;
    if (item.selected_parameters && product.parameter_groups) {
      const selections = item.selected_parameters as ParameterSelection;

      for (const [paramGroupId, paramId] of Object.entries(selections)) {
        const paramGroup = product.parameter_groups.find(
          pg => pg.parameter_group_id === parseInt(paramGroupId)
        );
        const param = paramGroup?.parameters?.find(p => p.id === paramId);

        if (param) {
          unitPrice += param.price_modifier;
        }
      }
    }

    const lineTotal = unitPrice * item.quantity;

    // Get special info if applicable
    let specialId: number | undefined;
    let specialName: string | undefined;
    if (item.special_id) {
      specialId = item.special_id;
      // Note: We would need to fetch special name here if needed
      // For now, leaving it undefined - can be enhanced later
    }

    return {
      id: crypto.randomUUID(),
      product_id: product.id,
      product_name: product.name,
      product_description: product.description,
      category_name: product.category?.name || null,
      image_url: imageUrl,
      quantity: item.quantity,
      unit_price: unitPrice,
      line_total: lineTotal,
      parameters,
      special_id: specialId,
      special_name: specialName,
    };
  });

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + item.line_total, 0);
  const discount = 0; // No discounts implemented yet
  const tax = 0; // No tax implemented yet
  const total = subtotal - discount + tax;

  const totals: OrderTotals = {
    subtotal,
    discount,
    tax,
    total,
  };

  return {
    items: orderItems,
    totals,
  };
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
  // Build order snapshot from cart items
  const snapshot = await buildOrderSnapshot(cartId);

  // Create order with snapshot
  const { data, error } = await supabase
    .from('orders')
    .insert({
      cart_id: cartId,
      user_id: userId,
      name,
      phone,
      address,
      secondary_phone: secondaryPhone || null,
      total_price: snapshot.totals.total,
      snapshot_data: snapshot as any,
      status: 'pending',
    } as any)
    .select()
    .single();

  if (error) throw error;

  // Mark cart as checked out
  await (supabase
    .from('carts')
    .update({ status: 'checked_out' } as never)
    .eq('id', cartId) as any);

  const order = data as Order;

  // Record order creation in history
  try {
    await createHistoryRecord({
      entity_type: 'order',
      entity_id: order.id,
      action: 'created',
      new_value: 'pending',
      changed_by_user_id: userId || undefined,
      notes: `Order created by ${name} (${phone})`,
    });
  } catch (historyError) {
    console.error('Failed to record order creation in history:', historyError);
    // Continue - don't fail the order if history fails
  }

  // Send order notification email (non-blocking, don't fail order if email fails)
  try {
    await sendOrderNotificationEmail(order, cartId);
  } catch (emailError) {
    console.error('Failed to send order notification email:', emailError);
    // Continue - don't fail the order if email fails
  }

  return order;
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

// Get order items from snapshot (or fallback to cart items for old orders)
export async function getOrderItems(orderId: number): Promise<OrderItem[]> {
  // Get the order
  const order = await getOrderById(orderId);
  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // If order has snapshot data, return items from snapshot
  if (order.snapshot_data) {
    const snapshot = order.snapshot_data as unknown as OrderSnapshot;
    return snapshot.items || [];
  }

  // Fallback: For old orders without snapshot, fetch from cart items
  // This is for backward compatibility during migration
  if (order.cart_id) {
    console.warn(`Order ${orderId} has no snapshot_data, falling back to cart items`);
    const cartItems = await getCartItems(order.cart_id);

    // Convert cart items to order items format (best effort)
    return cartItems.map(item => {
      const product = item.product!;
      const imageUrl = product.images && product.images.length > 0
        ? `/api/images/${product.images[0].id}`
        : null;

      // Build parameters
      const parameters: OrderItemParameter[] = [];
      if (item.selected_parameters && product.parameter_groups) {
        const selections = item.selected_parameters as ParameterSelection;
        for (const [paramGroupId, paramId] of Object.entries(selections)) {
          const paramGroup = product.parameter_groups.find(
            pg => pg.parameter_group_id === parseInt(paramGroupId)
          );
          const param = paramGroup?.parameters?.find(p => p.id === paramId);
          if (paramGroup && param && paramGroup.parameter_group) {
            parameters.push({
              group: paramGroup.parameter_group.name,
              name: param.name,
              value: param.description || undefined,
            });
          }
        }
      }

      // Calculate unit price
      let unitPrice = product.base_price;
      if (item.selected_parameters && product.parameter_groups) {
        const selections = item.selected_parameters as ParameterSelection;
        for (const [paramGroupId, paramId] of Object.entries(selections)) {
          const paramGroup = product.parameter_groups.find(
            pg => pg.parameter_group_id === parseInt(paramGroupId)
          );
          const param = paramGroup?.parameters?.find(p => p.id === paramId);
          if (param) {
            unitPrice += param.price_modifier;
          }
        }
      }

      return {
        id: crypto.randomUUID(),
        product_id: product.id,
        product_name: product.name,
        product_description: product.description,
        category_name: product.category?.name || null,
        image_url: imageUrl,
        quantity: item.quantity,
        unit_price: unitPrice,
        line_total: unitPrice * item.quantity,
        parameters,
        special_id: item.special_id || undefined,
        special_name: undefined,
      };
    });
  }

  // No snapshot and no cart_id
  return [];
}

// Admin: Get all orders with optional filtering
export async function getAllOrders(filters?: {
  status?: string;
  searchTerm?: string;
  sortBy?: 'created_at' | 'total_price' | 'status';
  sortOrder?: 'asc' | 'desc';
}): Promise<Order[]> {
  let query = supabase
    .from('orders')
    .select('*');

  // Filter by status
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  // Search by name, phone, or address
  if (filters?.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%,address.ilike.%${term}%`);
  }

  // Sort
  const sortBy = filters?.sortBy || 'created_at';
  const sortOrder = filters?.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data, error } = await query;

  if (error) throw error;
  return data as Order[];
}

// Admin: Update order status
export async function updateOrderStatus(orderId: number, status: string, changedByAdminId?: number): Promise<Order> {
  // Get current order to track old status
  const { data: currentOrder, error: fetchError } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single();

  const oldStatus = (currentOrder as any)?.status || null;

  // Update order status
  const { data, error } = await (supabase as any)
    .from('orders')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;

  // Record history if status changed
  if (oldStatus && oldStatus !== status) {
    await createHistoryRecord({
      entity_type: 'order',
      entity_id: orderId,
      action: 'status_changed',
      field_name: 'status',
      old_value: oldStatus,
      new_value: status,
      changed_by_admin_id: changedByAdminId,
    });
  }

  return data as Order;
}

// Admin: Update order details
export async function updateOrder(
  orderId: number,
  updates: {
    name?: string;
    phone?: string;
    address?: string;
    secondary_phone?: string;
    status?: string;
    total_price?: number;
    snapshot_data?: OrderSnapshot;
  },
  changedByAdminId?: number
): Promise<Order> {
  // Get current order for history tracking
  const currentOrder = await getOrderById(orderId);

  const { data, error } = await (supabase as any)
    .from('orders')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;

  // Record changes in history
  if (changedByAdminId && currentOrder) {
    const changedFields: string[] = [];
    if (updates.status && updates.status !== currentOrder.status) {
      changedFields.push(`status: ${currentOrder.status} → ${updates.status}`);
    }
    if (updates.total_price && updates.total_price !== currentOrder.total_price) {
      changedFields.push(`total: ₮${currentOrder.total_price} → ₮${updates.total_price}`);
    }
    if (updates.snapshot_data) {
      changedFields.push('order items modified');
    }

    if (changedFields.length > 0) {
      await createHistoryRecord({
        entity_type: 'order',
        entity_id: orderId,
        action: 'updated',
        notes: `Admin updated: ${changedFields.join(', ')}`,
        changed_by_admin_id: changedByAdminId,
      });
    }
  }

  return data as Order;
}

/**
 * Admin: Update a specific line item in an order's snapshot
 */
export async function updateOrderLineItem(
  orderId: number,
  itemId: string,
  updates: {
    quantity?: number;
    unit_price?: number;
    product_name?: string;
    parameters?: OrderItemParameter[];
  },
  changedByAdminId?: number
): Promise<Order> {
  // Get current order
  const order = await getOrderById(orderId);
  if (!order) throw new Error('Order not found');
  if (!order.snapshot_data) throw new Error('Order has no snapshot data');

  const snapshot = order.snapshot_data as OrderSnapshot;

  // Find and update the item
  const itemIndex = snapshot.items.findIndex(item => item.id === itemId);
  if (itemIndex === -1) throw new Error('Item not found in order');

  const oldItem = { ...snapshot.items[itemIndex] };
  const updatedItem = {
    ...snapshot.items[itemIndex],
    ...updates,
  };

  // Recalculate line total if quantity or unit_price changed
  if (updates.quantity !== undefined || updates.unit_price !== undefined) {
    updatedItem.line_total = updatedItem.quantity * updatedItem.unit_price;
  }

  snapshot.items[itemIndex] = updatedItem;

  // Recalculate totals
  const subtotal = snapshot.items.reduce((sum, item) => sum + item.line_total, 0);
  snapshot.totals = {
    ...snapshot.totals,
    subtotal,
    total: subtotal - (snapshot.totals.discount || 0) + (snapshot.totals.tax || 0),
  };

  // Update metadata
  snapshot.metadata = {
    ...snapshot.metadata,
    last_modified_by: changedByAdminId,
    last_modified_at: new Date().toISOString(),
  };

  // Update order
  return updateOrder(
    orderId,
    {
      snapshot_data: snapshot,
      total_price: snapshot.totals.total,
    },
    changedByAdminId
  );
}

/**
 * Admin: Add a new line item to an order's snapshot
 */
export async function addOrderLineItem(
  orderId: number,
  item: {
    product_id: number;
    product_name: string;
    product_description?: string;
    category_name?: string;
    image_url?: string;
    quantity: number;
    unit_price: number;
    parameters?: OrderItemParameter[];
  },
  changedByAdminId?: number
): Promise<Order> {
  // Get current order
  const order = await getOrderById(orderId);
  if (!order) throw new Error('Order not found');
  if (!order.snapshot_data) throw new Error('Order has no snapshot data');

  const snapshot = order.snapshot_data as OrderSnapshot;

  // Create new item
  const newItem: OrderItem = {
    id: crypto.randomUUID(),
    product_id: item.product_id,
    product_name: item.product_name,
    product_description: item.product_description || null,
    category_name: item.category_name || null,
    image_url: item.image_url || null,
    quantity: item.quantity,
    unit_price: item.unit_price,
    line_total: item.quantity * item.unit_price,
    parameters: item.parameters || [],
  };

  // Add to items
  snapshot.items.push(newItem);

  // Recalculate totals
  const subtotal = snapshot.items.reduce((sum, item) => sum + item.line_total, 0);
  snapshot.totals = {
    ...snapshot.totals,
    subtotal,
    total: subtotal - (snapshot.totals.discount || 0) + (snapshot.totals.tax || 0),
  };

  // Update metadata
  snapshot.metadata = {
    ...snapshot.metadata,
    last_modified_by: changedByAdminId,
    last_modified_at: new Date().toISOString(),
  };

  // Update order
  return updateOrder(
    orderId,
    {
      snapshot_data: snapshot,
      total_price: snapshot.totals.total,
    },
    changedByAdminId
  );
}

/**
 * Admin: Remove a line item from an order's snapshot
 */
export async function removeOrderLineItem(
  orderId: number,
  itemId: string,
  changedByAdminId?: number
): Promise<Order> {
  // Get current order
  const order = await getOrderById(orderId);
  if (!order) throw new Error('Order not found');
  if (!order.snapshot_data) throw new Error('Order has no snapshot data');

  const snapshot = order.snapshot_data as OrderSnapshot;

  // Find and remove the item
  const itemIndex = snapshot.items.findIndex(item => item.id === itemId);
  if (itemIndex === -1) throw new Error('Item not found in order');

  snapshot.items.splice(itemIndex, 1);

  // Recalculate totals
  const subtotal = snapshot.items.reduce((sum, item) => sum + item.line_total, 0);
  snapshot.totals = {
    ...snapshot.totals,
    subtotal,
    total: subtotal - (snapshot.totals.discount || 0) + (snapshot.totals.tax || 0),
  };

  // Update metadata
  snapshot.metadata = {
    ...snapshot.metadata,
    last_modified_by: changedByAdminId,
    last_modified_at: new Date().toISOString(),
  };

  // Update order
  return updateOrder(
    orderId,
    {
      snapshot_data: snapshot,
      total_price: snapshot.totals.total,
    },
    changedByAdminId
  );
}

// Admin: Delete order
export async function deleteOrder(orderId: number): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId);

  if (error) throw error;
}

// Admin: Product Management
export async function createProduct(product: {
  name: string;
  category_id?: number | null;
  description?: string;
  base_price: number;
  status?: string;
}): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: product.name,
      category_id: product.category_id || null,
      description: product.description || null,
      base_price: product.base_price,
      status: product.status || 'active',
    } as any)
    .select()
    .single();

  if (error) {
    console.error('Supabase error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw new Error(error.message || 'Failed to create product');
  }
  return data as Product;
}

export async function updateProduct(
  productId: number,
  updates: {
    name?: string;
    category_id?: number | null;
    description?: string;
    base_price?: number;
    status?: string;
  }
): Promise<Product> {
  const { data, error } = await (supabase as any)
    .from('products')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)
    .select()
    .single();

  if (error) throw error;
  return data as Product;
}

export async function deleteProduct(productId: number): Promise<void> {
  // First delete all product_parameter_groups entries
  await supabase
    .from('product_parameter_groups')
    .delete()
    .eq('product_id', productId);

  // Then delete the product
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) throw error;
}

// Admin: Parameter Group Management
export async function createParameterGroup(group: {
  name: string;
  internal_name?: string;
  description?: string;
}): Promise<ParameterGroup> {
  const { data, error } = await supabase
    .from('parameter_groups')
    .insert({
      name: group.name,
      internal_name: group.internal_name || group.name,
      description: group.description || null,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data as ParameterGroup;
}

// Create parameter group with all its parameters in one operation
export async function createParameterGroupWithParameters(
  group: {
    name: string;
    internal_name?: string;
    description?: string;
  },
  parameters: Array<{
    name: string;
    price_modifier?: number;
    description?: string;
  }>
): Promise<{ group: ParameterGroup; parameters: Parameter[] }> {
  // First create the group
  const { data: groupData, error: groupError } = await supabase
    .from('parameter_groups')
    .insert({
      name: group.name,
      internal_name: group.internal_name || group.name,
      description: group.description || null,
    } as any)
    .select()
    .single();

  if (groupError) throw groupError;
  if (!groupData) throw new Error('Failed to create parameter group');

  const createdGroup = groupData as ParameterGroup;
  const createdParameters: Parameter[] = [];

  // Then create all parameters
  if (parameters.length > 0) {
    const paramsToInsert = parameters.map((param) => ({
      parameter_group_id: createdGroup.id,
      name: param.name,
      description: param.description || null,
      price_modifier: param.price_modifier || 0,
    }));

    const { data: paramsData, error: paramsError } = await supabase
      .from('parameters')
      .insert(paramsToInsert as any)
      .select();

    if (paramsError) throw paramsError;
    if (paramsData) {
      createdParameters.push(...(paramsData as Parameter[]));
    }
  }

  return { group: createdGroup, parameters: createdParameters };
}

export async function updateParameterGroup(
  groupId: number,
  updates: {
    name?: string;
    internal_name?: string;
    description?: string;
  }
): Promise<ParameterGroup> {
  const { data, error } = await (supabase as any)
    .from('parameter_groups')
    .update(updates)
    .eq('id', groupId)
    .select()
    .single();

  if (error) throw error;
  return data as ParameterGroup;
}

export async function deleteParameterGroup(groupId: number): Promise<void> {
  // First delete all parameters in this group
  await supabase
    .from('parameters')
    .delete()
    .eq('parameter_group_id', groupId);

  // Delete all product_parameter_groups entries
  await supabase
    .from('product_parameter_groups')
    .delete()
    .eq('parameter_group_id', groupId);

  // Then delete the group
  const { error } = await supabase
    .from('parameter_groups')
    .delete()
    .eq('id', groupId);

  if (error) throw error;
}

export async function cloneParameterGroup(groupId: number, newName?: string): Promise<ParameterGroup> {
  // Get the original group
  const { data: originalGroup, error: groupError } = await supabase
    .from('parameter_groups')
    .select('*')
    .eq('id', groupId)
    .single();

  if (groupError) throw groupError;
  if (!originalGroup) throw new Error('Parameter group not found');

  // Get all parameters in the group
  const { data: parameters, error: paramsError } = await supabase
    .from('parameters')
    .select('*')
    .eq('parameter_group_id', groupId);

  if (paramsError) throw paramsError;

  // Create new group with custom name or "(Copy)" suffix
  const newGroupName = newName || `${(originalGroup as any).name} (Copy)`;
  const newInternalName = newName || `${(originalGroup as any).internal_name || (originalGroup as any).name} (Copy)`;

  const { data: newGroup, error: newGroupError } = await supabase
    .from('parameter_groups')
    .insert({
      name: newGroupName,
      internal_name: newInternalName,
      description: (originalGroup as any).description,
    } as any)
    .select()
    .single();

  if (newGroupError) throw newGroupError;
  if (!newGroup) throw new Error('Failed to create parameter group');

  // Clone all parameters
  if (parameters && parameters.length > 0) {
    const newParameters = parameters.map((param: any) => ({
      parameter_group_id: (newGroup as any).id,
      name: param.name,
      description: param.description,
      price_modifier: param.price_modifier,
      picture_url: param.picture_url,
    }));

    await supabase
      .from('parameters')
      .insert(newParameters as any);
  }

  return newGroup as ParameterGroup;
}

// Admin: Parameter Management
export async function createParameter(parameter: {
  parameter_group_id: number;
  name: string;
  description?: string;
  price_modifier?: number;
  picture_url?: string;
}): Promise<Parameter> {
  const { data, error } = await supabase
    .from('parameters')
    .insert({
      parameter_group_id: parameter.parameter_group_id,
      name: parameter.name,
      description: parameter.description || null,
      price_modifier: parameter.price_modifier || 0,
      picture_url: parameter.picture_url || null,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data as Parameter;
}

export async function updateParameter(
  parameterId: number,
  updates: {
    name?: string;
    description?: string;
    price_modifier?: number;
    picture_url?: string;
  }
): Promise<Parameter> {
  const { data, error } = await (supabase as any)
    .from('parameters')
    .update(updates)
    .eq('id', parameterId)
    .select()
    .single();

  if (error) throw error;
  return data as Parameter;
}

export async function deleteParameter(parameterId: number): Promise<void> {
  const { error } = await supabase
    .from('parameters')
    .delete()
    .eq('id', parameterId);

  if (error) throw error;
}

// Admin: Product-Parameter Group Management
export async function addParameterGroupToProduct(
  productId: number,
  parameterGroupId: number,
  defaultParameterId?: number
): Promise<void> {
  const { error } = await supabase
    .from('product_parameter_groups')
    .insert({
      product_id: productId,
      parameter_group_id: parameterGroupId,
      default_parameter_id: defaultParameterId || null,
    } as any);

  if (error) throw error;
}

export async function removeParameterGroupFromProduct(
  productId: number,
  parameterGroupId: number
): Promise<void> {
  const { error } = await supabase
    .from('product_parameter_groups')
    .delete()
    .eq('product_id', productId)
    .eq('parameter_group_id', parameterGroupId);

  if (error) throw error;
}

export async function getProductsUsingParameterGroup(groupId: number): Promise<Product[]> {
  const { data, error } = await supabase
    .from('product_parameter_groups')
    .select('product:products(*)')
    .eq('parameter_group_id', groupId);

  if (error) throw error;

  // Extract products from the nested structure
  return (data || []).map((item: any) => item.product).filter((p: any) => p !== null);
}

// Admin: Category Management
export async function createCategory(category: {
  name: string;
  description?: string;
  picture_url?: string;
}): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: category.name,
      description: category.description || null,
      picture_url: category.picture_url || null,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data as Category;
}

export async function updateCategory(
  categoryId: number,
  updates: {
    name?: string;
    description?: string;
    picture_url?: string;
  }
): Promise<Category> {
  const { data, error } = await (supabase as any)
    .from('categories')
    .update(updates)
    .eq('id', categoryId)
    .select()
    .single();

  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(categoryId: number): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId);

  if (error) throw error;
}

// History Tracking
export async function createHistoryRecord(record: {
  entity_type: string;
  entity_id: number;
  action: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  changed_by_user_id?: number;
  changed_by_admin_id?: number;
  notes?: string;
}): Promise<History> {
  const { data, error } = await supabase
    .from('history')
    .insert({
      entity_type: record.entity_type,
      entity_id: record.entity_id,
      action: record.action,
      field_name: record.field_name || null,
      old_value: record.old_value || null,
      new_value: record.new_value || null,
      changed_by_user_id: record.changed_by_user_id || null,
      changed_by_admin_id: record.changed_by_admin_id || null,
      notes: record.notes || null,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data as History;
}

export async function getHistoryForEntity(
  entity_type: string,
  entity_id: number
): Promise<HistoryWithUser[]> {
  // Fetch history records
  const { data: historyData, error } = await supabase
    .from('history')
    .select('*')
    .eq('entity_type', entity_type)
    .eq('entity_id', entity_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching history:', error);
    throw error;
  }

  if (!historyData || historyData.length === 0) {
    return [];
  }

  // Manually fetch related users and admins
  const userIds = historyData
    .filter((h: any) => h.changed_by_user_id)
    .map((h: any) => h.changed_by_user_id);

  const adminIds = historyData
    .filter((h: any) => h.changed_by_admin_id)
    .map((h: any) => h.changed_by_admin_id);

  // Fetch users
  const usersMap = new Map();
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, phone, is_admin')
      .in('id', userIds);

    users?.forEach((user: any) => usersMap.set(user.id, user));
  }

  // Fetch admins
  const adminsMap = new Map();
  if (adminIds.length > 0) {
    const { data: admins } = await supabase
      .from('admins')
      .select('id, username')
      .in('id', adminIds);

    admins?.forEach((admin: any) => adminsMap.set(admin.id, admin));
  }

  // Combine data
  const result = historyData.map((h: any) => ({
    ...h,
    changed_by: h.changed_by_user_id ? usersMap.get(h.changed_by_user_id) : undefined,
    changed_by_admin: h.changed_by_admin_id ? adminsMap.get(h.changed_by_admin_id) : undefined,
  }));

  return result as HistoryWithUser[];
}

export async function getRecentHistory(limit = 50): Promise<HistoryWithUser[]> {
  // Fetch history records
  const { data: historyData, error } = await supabase
    .from('history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent history:', error);
    throw error;
  }

  if (!historyData || historyData.length === 0) {
    return [];
  }

  // Manually fetch related users and admins
  const userIds = historyData
    .filter((h: any) => h.changed_by_user_id)
    .map((h: any) => h.changed_by_user_id);

  const adminIds = historyData
    .filter((h: any) => h.changed_by_admin_id)
    .map((h: any) => h.changed_by_admin_id);

  // Fetch users
  const usersMap = new Map();
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, phone, is_admin')
      .in('id', userIds);

    users?.forEach((user: any) => usersMap.set(user.id, user));
  }

  // Fetch admins
  const adminsMap = new Map();
  if (adminIds.length > 0) {
    const { data: admins } = await supabase
      .from('admins')
      .select('id, username')
      .in('id', adminIds);

    admins?.forEach((admin: any) => adminsMap.set(admin.id, admin));
  }

  // Combine data
  const result = historyData.map((h: any) => ({
    ...h,
    changed_by: h.changed_by_user_id ? usersMap.get(h.changed_by_user_id) : undefined,
    changed_by_admin: h.changed_by_admin_id ? adminsMap.get(h.changed_by_admin_id) : undefined,
  }));

  return result as HistoryWithUser[];
}

// Cart Migration (Guest to User)
export async function migrateGuestCartToUser(
  userId: number,
  guestSessionId: string
): Promise<void> {
  // Find guest cart
  const { data: guestCart } = await supabase
    .from('carts')
    .select('*')
    .eq('session_id', guestSessionId)
    .eq('status', 'active')
    .maybeSingle();

  // No guest cart to migrate
  if (!guestCart) return;

  // Type assertion for guest cart
  const cart = guestCart as Cart;

  // Get or create user cart
  const userCart = await getOrCreateCart(userId, undefined);

  // Get items from guest cart
  const { data: guestItems } = await supabase
    .from('product_in_cart')
    .select('*')
    .eq('cart_id', cart.id);

  if (!guestItems || guestItems.length === 0) {
    // No items to migrate, just mark guest cart as merged
    await (supabase as any)
      .from('carts')
      .update({ status: 'merged' })
      .eq('id', cart.id);
    return;
  }

  // Get existing items in user cart
  const { data: userItems } = await supabase
    .from('product_in_cart')
    .select('*')
    .eq('cart_id', userCart.id);

  // Merge items from guest cart to user cart
  for (const guestItem of guestItems as any[]) {
    // Check if an identical item exists in user cart (same product + parameters)
    const matchingUserItem = (userItems || []).find((userItem: any) => {
      return (
        userItem.product_id === guestItem.product_id &&
        JSON.stringify(userItem.selected_parameters || {}) ===
          JSON.stringify(guestItem.selected_parameters || {}) &&
        userItem.special_id === guestItem.special_id
      );
    }) as any;

    if (matchingUserItem) {
      // Item exists, increase quantity
      await (supabase as any)
        .from('product_in_cart')
        .update({
          quantity: matchingUserItem.quantity + guestItem.quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', matchingUserItem.id);
    } else {
      // Item doesn't exist, add to user cart
      await (supabase as any)
        .from('product_in_cart')
        .insert({
          cart_id: userCart.id,
          product_id: guestItem.product_id,
          quantity: guestItem.quantity,
          selected_parameters: guestItem.selected_parameters,
          special_id: guestItem.special_id,
        });
    }
  }

  // Mark guest cart as merged
  await (supabase as any)
    .from('carts')
    .update({ status: 'merged' })
    .eq('id', cart.id);
}

// Soft Delete / Archive Functions

/**
 * Archive a product (soft delete - sets status to 'inactive')
 */
export async function archiveProduct(
  productId: number,
  adminId?: number
): Promise<Product> {
  // Get current product for history
  const { data: current } = await supabase
    .from('products')
    .select('status, name')
    .eq('id', productId)
    .single();

  // Update status to inactive
  const { data, error } = await supabase
    .from('products')
    .update({ status: 'inactive', updated_at: new Date().toISOString() } as any)
    .eq('id', productId)
    .select()
    .single();

  if (error) throw error;

  // Record in history
  if (current) {
    await createHistoryRecord({
      entity_type: 'product',
      entity_id: productId,
      action: 'archived',
      field_name: 'status',
      old_value: current.status,
      new_value: 'inactive',
      changed_by_admin_id: adminId,
      notes: `Product "${current.name}" archived`,
    });
  }

  return data as Product;
}

/**
 * Restore an archived product (sets status to 'active')
 */
export async function restoreProduct(
  productId: number,
  adminId?: number
): Promise<Product> {
  // Get current product for history
  const { data: current } = await supabase
    .from('products')
    .select('status, name')
    .eq('id', productId)
    .single();

  // Update status to active
  const { data, error } = await supabase
    .from('products')
    .update({ status: 'active', updated_at: new Date().toISOString() } as any)
    .eq('id', productId)
    .select()
    .single();

  if (error) throw error;

  // Record in history
  if (current) {
    await createHistoryRecord({
      entity_type: 'product',
      entity_id: productId,
      action: 'restored',
      field_name: 'status',
      old_value: current.status,
      new_value: 'active',
      changed_by_admin_id: adminId,
      notes: `Product "${current.name}" restored`,
    });
  }

  return data as Product;
}

/**
 * Archive a category (soft delete - sets status to 'inactive')
 */
export async function archiveCategory(
  categoryId: number,
  adminId?: number
): Promise<Category> {
  // Get current category for history
  const { data: current } = await supabase
    .from('categories')
    .select('status, name')
    .eq('id', categoryId)
    .single();

  // Update status to inactive
  const { data, error } = await supabase
    .from('categories')
    .update({ status: 'inactive', updated_at: new Date().toISOString() } as any)
    .eq('id', categoryId)
    .select()
    .single();

  if (error) throw error;

  // Record in history
  if (current) {
    await createHistoryRecord({
      entity_type: 'category',
      entity_id: categoryId,
      action: 'archived',
      field_name: 'status',
      old_value: current.status,
      new_value: 'inactive',
      changed_by_admin_id: adminId,
      notes: `Category "${current.name}" archived`,
    });
  }

  return data as Category;
}

/**
 * Restore an archived category (sets status to 'active')
 */
export async function restoreCategory(
  categoryId: number,
  adminId?: number
): Promise<Category> {
  // Get current category for history
  const { data: current } = await supabase
    .from('categories')
    .select('status, name')
    .eq('id', categoryId)
    .single();

  // Update status to active
  const { data, error } = await supabase
    .from('categories')
    .update({ status: 'active', updated_at: new Date().toISOString() } as any)
    .eq('id', categoryId)
    .select()
    .single();

  if (error) throw error;

  // Record in history
  if (current) {
    await createHistoryRecord({
      entity_type: 'category',
      entity_id: categoryId,
      action: 'restored',
      field_name: 'status',
      old_value: current.status,
      new_value: 'active',
      changed_by_admin_id: adminId,
      notes: `Category "${current.name}" restored`,
    });
  }

  return data as Category;
}

/**
 * Archive a parameter group (soft delete - sets status to 'inactive')
 */
export async function archiveParameterGroup(
  parameterGroupId: number,
  adminId?: number
): Promise<ParameterGroup> {
  // Get current parameter group for history
  const { data: current } = await supabase
    .from('parameter_groups')
    .select('status, name')
    .eq('id', parameterGroupId)
    .single();

  // Update status to inactive
  const { data, error } = await supabase
    .from('parameter_groups')
    .update({ status: 'inactive' } as any)
    .eq('id', parameterGroupId)
    .select()
    .single();

  if (error) throw error;

  // Record in history
  if (current) {
    await createHistoryRecord({
      entity_type: 'parameter_group',
      entity_id: parameterGroupId,
      action: 'archived',
      field_name: 'status',
      old_value: current.status,
      new_value: 'inactive',
      changed_by_admin_id: adminId,
      notes: `Parameter group "${current.name}" archived`,
    });
  }

  return data as ParameterGroup;
}

/**
 * Restore an archived parameter group (sets status to 'active')
 */
export async function restoreParameterGroup(
  parameterGroupId: number,
  adminId?: number
): Promise<ParameterGroup> {
  // Get current parameter group for history
  const { data: current } = await supabase
    .from('parameter_groups')
    .select('status, name')
    .eq('id', parameterGroupId)
    .single();

  // Update status to active
  const { data, error } = await supabase
    .from('parameter_groups')
    .update({ status: 'active' } as any)
    .eq('id', parameterGroupId)
    .select()
    .single();

  if (error) throw error;

  // Record in history
  if (current) {
    await createHistoryRecord({
      entity_type: 'parameter_group',
      entity_id: parameterGroupId,
      action: 'restored',
      field_name: 'status',
      old_value: current.status,
      new_value: 'active',
      changed_by_admin_id: adminId,
      notes: `Parameter group "${current.name}" restored`,
    });
  }

  return data as ParameterGroup;
}

/**
 * Archive a parameter (soft delete - sets status to 'inactive')
 */
export async function archiveParameter(
  parameterId: number,
  adminId?: number
): Promise<Parameter> {
  // Get current parameter for history
  const { data: current } = await supabase
    .from('parameters')
    .select('status, name')
    .eq('id', parameterId)
    .single();

  // Update status to inactive
  const { data, error } = await supabase
    .from('parameters')
    .update({ status: 'inactive' } as any)
    .eq('id', parameterId)
    .select()
    .single();

  if (error) throw error;

  // Record in history
  if (current) {
    await createHistoryRecord({
      entity_type: 'parameter',
      entity_id: parameterId,
      action: 'archived',
      field_name: 'status',
      old_value: current.status,
      new_value: 'inactive',
      changed_by_admin_id: adminId,
      notes: `Parameter "${current.name}" archived`,
    });
  }

  return data as Parameter;
}

/**
 * Restore an archived parameter (sets status to 'active')
 */
export async function restoreParameter(
  parameterId: number,
  adminId?: number
): Promise<Parameter> {
  // Get current parameter for history
  const { data: current } = await supabase
    .from('parameters')
    .select('status, name')
    .eq('id', parameterId)
    .single();

  // Update status to active
  const { data, error } = await supabase
    .from('parameters')
    .update({ status: 'active' } as any)
    .eq('id', parameterId)
    .select()
    .single();

  if (error) throw error;

  // Record in history
  if (current) {
    await createHistoryRecord({
      entity_type: 'parameter',
      entity_id: parameterId,
      action: 'restored',
      field_name: 'status',
      old_value: current.status,
      new_value: 'active',
      changed_by_admin_id: adminId,
      notes: `Parameter "${current.name}" restored`,
    });
  }

  return data as Parameter;
}

/**
 * Archive a special (soft delete - sets status to 'hidden' or 'inactive')
 */
export async function archiveSpecial(
  specialId: number,
  adminId?: number
): Promise<Special> {
  // Get current special for history
  const { data: current } = await supabase
    .from('specials')
    .select('status, name')
    .eq('id', specialId)
    .single();

  // Update status to hidden (or inactive, depending on business logic)
  const { data, error } = await supabase
    .from('specials')
    .update({ status: 'hidden', updated_at: new Date().toISOString() } as any)
    .eq('id', specialId)
    .select()
    .single();

  if (error) throw error;

  // Record in history
  if (current) {
    await createHistoryRecord({
      entity_type: 'special',
      entity_id: specialId,
      action: 'archived',
      field_name: 'status',
      old_value: current.status,
      new_value: 'hidden',
      changed_by_admin_id: adminId,
      notes: `Special "${current.name}" archived`,
    });
  }

  return data as Special;
}

/**
 * Restore an archived special (sets status to 'available')
 */
export async function restoreSpecial(
  specialId: number,
  adminId?: number
): Promise<Special> {
  // Get current special for history
  const { data: current } = await supabase
    .from('specials')
    .select('status, name')
    .eq('id', specialId)
    .single();

  // Update status to available
  const { data, error } = await supabase
    .from('specials')
    .update({ status: 'available', updated_at: new Date().toISOString() } as any)
    .eq('id', specialId)
    .select()
    .single();

  if (error) throw error;

  // Record in history
  if (current) {
    await createHistoryRecord({
      entity_type: 'special',
      entity_id: specialId,
      action: 'restored',
      field_name: 'status',
      old_value: current.status,
      new_value: 'available',
      changed_by_admin_id: adminId,
      notes: `Special "${current.name}" restored`,
    });
  }

  return data as Special;
}
