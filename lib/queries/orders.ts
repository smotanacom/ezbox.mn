/**
 * React Query hooks for order operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderAPI } from '@/lib/api-client';

// Query keys
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: () => [...orderKeys.lists()] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: number) => [...orderKeys.details(), id] as const,
};

/**
 * Hook to get all orders
 * Returns user's own orders if logged in as user
 * Returns all orders if logged in as admin
 */
export function useOrders() {
  return useQuery({
    queryKey: orderKeys.list(),
    queryFn: async () => {
      const response = await orderAPI.getAll();
      return response.orders;
    },
    // Orders can change status, keep fresh for 2 minutes
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to get a single order by ID with items
 */
export function useOrder(id: number) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: async () => {
      const response = await orderAPI.getById(id);
      return response.order;
    },
    staleTime: 2 * 60 * 1000,
    // Only fetch if we have a valid ID
    enabled: !!id && id > 0,
  });
}

/**
 * Hook to create an order from cart
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      cartId: number;
      address: string;
      phone: string;
    }) => orderAPI.create(data),
    onSuccess: () => {
      // Invalidate order list and cart queries
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

/**
 * Hook to update an order
 */
export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      address?: string;
      phone?: string;
      status?: string;
    }) => orderAPI.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate the specific order and order lists
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

/**
 * Hook to update order status (admin only)
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      orderAPI.updateStatus(id, status),
    onSuccess: (_, variables) => {
      // Invalidate the specific order and order lists
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

/**
 * Hook to delete an order (admin only)
 */
export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => orderAPI.delete(id),
    onSuccess: () => {
      // Invalidate all order queries
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
