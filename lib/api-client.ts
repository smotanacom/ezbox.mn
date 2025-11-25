/**
 * API Client Library
 *
 * Frontend wrapper for all API calls.
 * Replaces direct Supabase access with API routes.
 * Uses httpOnly cookies for authentication.
 */

import {
  Product,
  Category,
  CartItemWithDetails,
  Cart,
  Order,
  ParameterGroup,
  Parameter,
  ProductWithDetails,
  Special,
  User
} from '@/types/database';

// Base API configuration
const API_BASE = '';
const defaultOptions: RequestInit = {
  credentials: 'include', // Include httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
};

// Helper for API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || 'API request failed');
  }

  return response.json();
}

// ==================== AUTHENTICATION ====================

export interface AuthResponse {
  user: User;
  message?: string;
}

export interface AdminAuthResponse {
  admin: { id: number; username: string; created_at: string };
  message?: string;
}

export const authAPI = {
  // User authentication
  register: async (phone: string, password: string) => {
    const response = await apiRequest<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ phone, password, guestSessionId: getGuestSessionId() }),
    });
    // Clear guest session after successful registration
    clearGuestSession();
    return response;
  },

  login: async (phone: string, password: string) => {
    const response = await apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password, guestSessionId: getGuestSessionId() }),
    });
    // Clear guest session after successful login
    clearGuestSession();
    return response;
  },

  logout: () => {
    clearGuestSession();
    return apiRequest<{ message: string }>('/api/auth/logout', {
      method: 'POST',
    });
  },

  getUser: () =>
    apiRequest<{ user: User | null }>('/api/auth/me'),

  updateProfile: (updates: { address?: string; phone?: string }) =>
    apiRequest<{ user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest<{ message: string }>('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  checkPhone: (phone: string) =>
    apiRequest<{ exists: boolean }>('/api/auth/check-phone', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  // Admin authentication
  adminLogin: (username: string, password: string) =>
    apiRequest<AdminAuthResponse>('/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  adminLogout: () =>
    apiRequest<{ message: string }>('/api/auth/admin/logout', {
      method: 'POST',
    }),

  getAdmin: () =>
    apiRequest<{ admin: { id: number; username: string; created_at: string } | null }>('/api/auth/admin/me'),
};

// ==================== CATEGORIES ====================

export const categoryAPI = {
  getAll: () =>
    apiRequest<{ categories: Category[] }>('/api/categories'),

  getById: (id: number) =>
    apiRequest<{ category: Category }>(`/api/categories/${id}`),

  create: (data: { name: string; description?: string; picture_url?: string }) =>
    apiRequest<{ category: Category }>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: { name?: string; description?: string; picture_url?: string }) =>
    apiRequest<{ category: Category }>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest<{ message: string }>(`/api/categories/${id}`, {
      method: 'DELETE',
    }),
};

// ==================== PRODUCTS ====================

export interface ProductDetailResponse {
  product: ProductWithDetails;
  images: Array<{ id: number; product_id: number; image_url: string; display_order: number }>;
  model: { product_id: number; model_url: string } | null;
}

export const productAPI = {
  // Batched: all products with full details
  getAll: (includeInactive = false) =>
    apiRequest<{ products: ProductWithDetails[] }>(`/api/products?includeInactive=${includeInactive}`),

  // Batched: product + parameter groups + images + model
  getById: (id: number) =>
    apiRequest<ProductDetailResponse>(`/api/products/${id}`),

  create: (data: {
    name: string;
    category_id: number;
    description?: string;
    base_price: number;
    picture_url?: string;
    is_active?: boolean;
  }) =>
    apiRequest<{ product: Product }>('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: {
    name?: string;
    category_id?: number;
    description?: string;
    base_price?: number;
    picture_url?: string;
    is_active?: boolean;
  }) =>
    apiRequest<{ product: Product }>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest<{ message: string }>(`/api/products/${id}`, {
      method: 'DELETE',
    }),

  // Parameter group associations
  addParameterGroup: (productId: number, parameterGroupId: number, defaultParameterId?: number) =>
    apiRequest<{ message: string }>(`/api/products/${productId}/parameter-groups`, {
      method: 'POST',
      body: JSON.stringify({ parameterGroupId, defaultParameterId }),
    }),

  removeParameterGroup: (productId: number, parameterGroupId: number) =>
    apiRequest<{ message: string }>(`/api/products/${productId}/parameter-groups/${parameterGroupId}`, {
      method: 'DELETE',
    }),
};

// ==================== PARAMETERS ====================

export interface ParameterGroupWithParameters extends ParameterGroup {
  parameters: Parameter[];
}

export const parameterAPI = {
  // Batched: all groups with their parameters
  getAllGroups: () =>
    apiRequest<{ parameterGroups: ParameterGroupWithParameters[] }>('/api/parameter-groups'),

  getGroup: (id: number) =>
    apiRequest<{ parameterGroup: ParameterGroupWithParameters }>(`/api/parameter-groups/${id}`),

  createGroup: (data: { name: string; description?: string }) =>
    apiRequest<{ parameterGroup: ParameterGroup }>('/api/parameter-groups', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateGroup: (id: number, data: { name?: string; description?: string }) =>
    apiRequest<{ parameterGroup: ParameterGroup }>(`/api/parameter-groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteGroup: (id: number) =>
    apiRequest<{ message: string }>(`/api/parameter-groups/${id}`, {
      method: 'DELETE',
    }),

  cloneGroup: (id: number, newName: string) =>
    apiRequest<{ parameterGroup: ParameterGroup }>(`/api/parameter-groups/${id}/clone`, {
      method: 'POST',
      body: JSON.stringify({ newName }),
    }),

  createParameter: (parameterGroupId: number, data: {
    name: string;
    price_modifier: number;
    picture_url?: string;
  }) =>
    apiRequest<{ parameter: Parameter }>('/api/parameters', {
      method: 'POST',
      body: JSON.stringify({ parameterGroupId, ...data }),
    }),

  updateParameter: (id: number, data: {
    name?: string;
    price_modifier?: number;
    picture_url?: string;
  }) =>
    apiRequest<{ parameter: Parameter }>(`/api/parameters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteParameter: (id: number) =>
    apiRequest<{ message: string }>(`/api/parameters/${id}`, {
      method: 'DELETE',
    }),

  getProductsUsingGroup: (parameterGroupId: number) =>
    apiRequest<{ products: Product[] }>(`/api/parameter-groups/${parameterGroupId}/products`),
};

// ==================== CART ====================

export interface CartResponse {
  cart: Cart;
  items: CartItemWithDetails[];
  total: number;
}

export const cartAPI = {
  // Get cart (batched with items)
  get: (userId?: number, sessionId?: string) => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId.toString());
    if (sessionId) params.append('sessionId', sessionId);
    return apiRequest<CartResponse>(`/api/cart?${params}`);
  },

  // Add item (returns updated cart)
  addItem: (data: {
    productId: number;
    quantity: number;
    selectedParameters: Record<string, number>;
    userId?: number;
    sessionId?: string;
  }) =>
    apiRequest<CartResponse>('/api/cart/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update item (returns updated cart)
  updateItem: (itemId: number, data: {
    quantity?: number;
    selectedParameters?: Record<string, number>;
  }) =>
    apiRequest<CartResponse>(`/api/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Remove item (returns updated cart)
  removeItem: (itemId: number) =>
    apiRequest<CartResponse>(`/api/cart/items/${itemId}`, {
      method: 'DELETE',
    }),

  // Add special to cart (returns updated cart)
  addSpecial: (data: {
    specialId: number;
    userId?: number;
    sessionId?: string;
  }) =>
    apiRequest<CartResponse>('/api/cart/specials', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Remove special from cart (returns updated cart)
  removeSpecial: (data: {
    specialId: number;
    userId?: number;
    sessionId?: string;
  }) =>
    apiRequest<CartResponse>(`/api/cart/specials/${data.specialId}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId: data.userId, sessionId: data.sessionId }),
    }),
};

// ==================== SPECIALS ====================

export interface SpecialWithPricing extends Special {
  original_price: number;
}

export const specialAPI = {
  // Batched: specials with original prices
  getAll: (status?: string) => {
    const params = status ? `?status=${status}` : '';
    return apiRequest<{ specials: SpecialWithPricing[] }>(`/api/specials${params}`);
  },

  getById: (id: number) =>
    apiRequest<{ special: SpecialWithPricing }>(`/api/specials/${id}`),

  create: (data: {
    name: string;
    description?: string;
    discounted_price: number;
    status: string;
    picture_url?: string;
  }) =>
    apiRequest<{ special: Special }>('/api/specials', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: {
    name?: string;
    description?: string;
    discounted_price?: number;
    status?: string;
    picture_url?: string;
  }) =>
    apiRequest<{ special: Special }>(`/api/specials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest<{ message: string }>(`/api/specials/${id}`, {
      method: 'DELETE',
    }),
};

// ==================== ORDERS ====================

export interface OrderWithItems extends Order {
  items: Array<{
    id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    price_at_time: number;
    selected_parameters: Record<string, number>;
  }>;
}

export const orderAPI = {
  // Get all orders (user sees their own, admin sees all)
  getAll: () =>
    apiRequest<{ orders: Order[] }>('/api/orders'),

  // Batched: order with items
  getById: (id: number) =>
    apiRequest<{ order: OrderWithItems }>(`/api/orders/${id}`),

  create: (data: {
    cartId: number;
    address: string;
    phone: string;
  }) =>
    apiRequest<{ order: Order }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: {
    address?: string;
    phone?: string;
    status?: string;
  }) =>
    apiRequest<{ order: Order }>(`/api/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: number, status: string) =>
    apiRequest<{ order: Order }>(`/api/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  delete: (id: number) =>
    apiRequest<{ message: string }>(`/api/orders/${id}`, {
      method: 'DELETE',
    }),
};

// ==================== STORAGE ====================

export const storageAPI = {
  deleteImage: (imageId: number) =>
    apiRequest<{ message: string }>(`/api/images/${imageId}`, {
      method: 'DELETE',
    }),

  deleteModel: (productId: number) =>
    apiRequest<{ message: string }>(`/api/models/${productId}`, {
      method: 'DELETE',
    }),

  reorderImages: (imageIds: number[]) =>
    apiRequest<{ message: string }>('/api/images/reorder', {
      method: 'PUT',
      body: JSON.stringify({ imageIds }),
    }),
};

// ==================== HOME PAGE ====================

export interface HomePageData {
  categories: Category[];
  productsByCategory: Record<number, ProductWithDetails[]>;
  specials: SpecialWithPricing[];
}

export const homeAPI = {
  // Batched: categories + products + specials
  getData: () =>
    apiRequest<HomePageData>('/api/home'),
};

// ==================== HELPERS ====================

// Price calculation (client-side utility)
export function calculateProductPrice(
  product: ProductWithDetails,
  selectedParameters: Record<string, number>
): number {
  let price = product.base_price;

  for (const paramGroupId in selectedParameters) {
    const parameterId = selectedParameters[paramGroupId];
    const paramGroup = product.parameter_groups?.find(
      (pg) => pg.parameter_group_id.toString() === paramGroupId
    );

    if (paramGroup) {
      const parameter = paramGroup.parameters.find((p) => p.id === parameterId);
      if (parameter) {
        price += parameter.price_modifier;
      }
    }
  }

  return price;
}

// Session helpers (localStorage for guest sessions)
const SESSION_KEY = 'guest_session_id';

export function getGuestSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function clearGuestSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}
