/**
 * React Query hooks for cart operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartAPI, CartResponse } from '@/lib/api-client';
import { getGuestSessionId } from '@/lib/api-client';

// Query keys
export const cartKeys = {
  all: ['cart'] as const,
  byUser: (userId?: number, sessionId?: string) =>
    ['cart', { userId, sessionId }] as const,
};

/**
 * Hook to get cart data
 * Automatically refetches when userId or sessionId changes
 */
export function useCart(userId?: number, sessionId?: string) {
  const guestSessionId = sessionId || getGuestSessionId();

  return useQuery({
    queryKey: cartKeys.byUser(userId, userId ? undefined : guestSessionId),
    queryFn: () => cartAPI.get(userId, userId ? undefined : guestSessionId),
    // Keep cart data fresh for 2 minutes
    staleTime: 2 * 60 * 1000,
    // Always fetch on mount to ensure cart is up to date
    refetchOnMount: true,
  });
}

/**
 * Hook to add item to cart
 * Automatically updates the cart query after successful mutation
 */
export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      productId: number;
      quantity: number;
      selectedParameters: Record<string, number>;
      userId?: number;
      sessionId?: string;
    }) => cartAPI.addItem(data),
    onSuccess: (response, variables) => {
      // Update cart query with new data
      const sessionId = variables.sessionId || getGuestSessionId();
      queryClient.setQueryData(
        cartKeys.byUser(variables.userId, variables.userId ? undefined : sessionId),
        response
      );
    },
  });
}

/**
 * Hook to update cart item with optimistic updates
 */
export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      ...data
    }: {
      itemId: number;
      quantity?: number;
      selectedParameters?: Record<string, number>;
    }) => cartAPI.updateItem(itemId, data),
    // Optimistic update
    onMutate: async ({ itemId, quantity }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: cartKeys.all });

      // Snapshot previous value for rollback
      const previousData = queryClient.getQueriesData<CartResponse>({ queryKey: cartKeys.all });

      // Optimistically update all matching cart queries
      queryClient.setQueriesData<CartResponse>(
        { queryKey: cartKeys.all },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) =>
              item.id === itemId && quantity !== undefined
                ? { ...item, quantity }
                : item
            ),
          };
        }
      );

      return { previousData };
    },
    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          if (data) {
            queryClient.setQueryData(queryKey, data);
          }
        });
      }
    },
    // Always refetch after error or success to sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

/**
 * Hook to remove item from cart with optimistic updates
 */
export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: number) => cartAPI.removeItem(itemId),
    // Optimistic update
    onMutate: async (itemId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: cartKeys.all });

      // Snapshot previous value for rollback
      const previousData = queryClient.getQueriesData<CartResponse>({ queryKey: cartKeys.all });

      // Optimistically remove item from all matching cart queries
      queryClient.setQueriesData<CartResponse>(
        { queryKey: cartKeys.all },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.filter((item) => item.id !== itemId),
          };
        }
      );

      return { previousData };
    },
    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          if (data) {
            queryClient.setQueryData(queryKey, data);
          }
        });
      }
    },
    // Always refetch after error or success to sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

/**
 * Hook to add special to cart
 */
export function useAddSpecialToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      specialId: number;
      userId?: number;
      sessionId?: string;
    }) => cartAPI.addSpecial(data),
    onSuccess: (response, variables) => {
      // Update cart query with new data
      const sessionId = variables.sessionId || getGuestSessionId();
      queryClient.setQueryData(
        cartKeys.byUser(variables.userId, variables.userId ? undefined : sessionId),
        response
      );
    },
  });
}

/**
 * Hook to remove special from cart
 */
export function useRemoveSpecialFromCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      specialId: number;
      userId?: number;
      sessionId?: string;
    }) => cartAPI.removeSpecial(data),
    onSuccess: () => {
      // Invalidate all cart queries to refetch
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}
