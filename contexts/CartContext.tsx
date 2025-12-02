'use client';

import React, { createContext, useContext, useCallback } from 'react';
import type { Cart, CartItemWithDetails, ParameterSelection } from '@/types/database';
import { getGuestSessionId } from '@/lib/api-client';
import {
  useCart as useCartQuery,
  useAddToCart as useAddToCartMutation,
  useUpdateCartItem as useUpdateCartItemMutation,
  useRemoveCartItem as useRemoveCartItemMutation,
  useAddSpecialToCart as useAddSpecialToCartMutation,
  useRemoveSpecialFromCart as useRemoveSpecialFromCartMutation,
} from '@/lib/queries';
import { useAuth } from '@/contexts/AuthContext';

interface CartContextType {
  cart: Cart | null;
  items: CartItemWithDetails[];
  total: number;
  loading: boolean;
  addToCart: (productId: number, quantity: number, selectedParameters: ParameterSelection) => Promise<void>;
  updateCartItem: (itemId: number, quantity?: number, selectedParameters?: ParameterSelection) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  removeSpecialFromCart: (specialId: number) => Promise<void>;
  addSpecialToCart: (specialId: number) => Promise<void>;
  refreshCart: () => Promise<{ cart: Cart | null; items: CartItemWithDetails[]; total: number }>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Get current user from AuthContext
  const { user } = useAuth();
  const guestSessionId = user ? undefined : getGuestSessionId();

  // Use React Query hooks for cart data
  const {
    data: cartData,
    isLoading,
    refetch,
  } = useCartQuery(user?.id, guestSessionId);

  // Use React Query mutation hooks
  const addToCartMutation = useAddToCartMutation();
  const updateCartItemMutation = useUpdateCartItemMutation();
  const removeCartItemMutation = useRemoveCartItemMutation();
  const addSpecialMutation = useAddSpecialToCartMutation();
  const removeSpecialMutation = useRemoveSpecialFromCartMutation();

  // Wrapper functions to maintain the same API surface
  const addToCart = useCallback(
    async (productId: number, quantity: number, selectedParameters: ParameterSelection) => {
      try {
        await addToCartMutation.mutateAsync({
          productId,
          quantity,
          selectedParameters,
          userId: user?.id,
          sessionId: guestSessionId,
        });
      } catch (error) {
        console.error('Error adding to cart:', error);
        throw error;
      }
    },
    [addToCartMutation, user?.id, guestSessionId]
  );

  const updateCartItem = useCallback(
    async (itemId: number, quantity?: number, selectedParameters?: ParameterSelection) => {
      try {
        await updateCartItemMutation.mutateAsync({
          itemId,
          quantity,
          selectedParameters,
        });
      } catch (error) {
        console.error('Error updating cart item:', error);
        throw error;
      }
    },
    [updateCartItemMutation]
  );

  const removeFromCart = useCallback(
    async (itemId: number) => {
      try {
        await removeCartItemMutation.mutateAsync(itemId);
      } catch (error) {
        console.error('Error removing from cart:', error);
        throw error;
      }
    },
    [removeCartItemMutation]
  );

  const removeSpecialFromCart = useCallback(
    async (specialId: number) => {
      try {
        await removeSpecialMutation.mutateAsync({
          specialId,
          userId: user?.id,
          sessionId: guestSessionId,
        });
      } catch (error) {
        console.error('Error removing special from cart:', error);
        throw error;
      }
    },
    [removeSpecialMutation, user?.id, guestSessionId]
  );

  const addSpecialToCart = useCallback(
    async (specialId: number) => {
      try {
        await addSpecialMutation.mutateAsync({
          specialId,
          userId: user?.id,
          sessionId: guestSessionId,
        });
      } catch (error) {
        console.error('Error adding special to cart:', error);
        throw error;
      }
    },
    [addSpecialMutation, user?.id, guestSessionId]
  );

  const refreshCart = useCallback(async () => {
    const result = await refetch();
    return result.data || { cart: null, items: [], total: 0 };
  }, [refetch]);

  const value: CartContextType = {
    cart: cartData?.cart || null,
    items: cartData?.items || [],
    total: cartData?.total || 0,
    loading: isLoading,
    addToCart,
    updateCartItem,
    removeFromCart,
    removeSpecialFromCart,
    addSpecialToCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
