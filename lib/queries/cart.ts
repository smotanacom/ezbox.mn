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
 * Hook to update cart item
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
    onSuccess: (response) => {
      // Invalidate all cart queries to refetch
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

/**
 * Hook to remove item from cart
 */
export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: number) => cartAPI.removeItem(itemId),
    onSuccess: () => {
      // Invalidate all cart queries to refetch
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
