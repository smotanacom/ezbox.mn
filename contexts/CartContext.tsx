'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Cart, CartItemWithDetails, ParameterSelection } from '@/types/database';
import {
  getOrCreateCart,
  getCartItems,
  addToCart as apiAddToCart,
  updateCartItem as apiUpdateCartItem,
  removeFromCart as apiRemoveFromCart,
  calculateCartTotal,
  addSpecialToCart as apiAddSpecialToCart,
} from '@/lib/api';
import { getCurrentUser, getOrCreateGuestSession } from '@/lib/auth';

interface CartContextType {
  cart: Cart | null;
  items: CartItemWithDetails[];
  total: number;
  loading: boolean;
  addToCart: (productId: number, quantity: number, selectedParameters: ParameterSelection) => Promise<void>;
  updateCartItem: (itemId: number, quantity?: number, selectedParameters?: ParameterSelection) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  addSpecialToCart: (specialId: number) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [items, setItems] = useState<CartItemWithDetails[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshCart = useCallback(async () => {
    try {
      setLoading(true);
      const user = getCurrentUser();
      const guestSession = getOrCreateGuestSession();

      const currentCart = await getOrCreateCart(
        user?.id,
        user ? undefined : guestSession
      );

      setCart(currentCart);

      const cartItems = await getCartItems(currentCart.id);
      setItems(cartItems);

      const cartTotal = await calculateCartTotal(currentCart.id);
      setTotal(cartTotal);
    } catch (error) {
      console.error('Error refreshing cart:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(
    async (productId: number, quantity: number, selectedParameters: ParameterSelection) => {
      if (!cart) return;

      try {
        await apiAddToCart(cart.id, productId, quantity, selectedParameters);
        await refreshCart();
      } catch (error) {
        console.error('Error adding to cart:', error);
        throw error;
      }
    },
    [cart, refreshCart]
  );

  const updateCartItem = useCallback(
    async (itemId: number, quantity?: number, selectedParameters?: ParameterSelection) => {
      try {
        await apiUpdateCartItem(itemId, quantity, selectedParameters);
        await refreshCart();
      } catch (error) {
        console.error('Error updating cart item:', error);
        throw error;
      }
    },
    [refreshCart]
  );

  const removeFromCart = useCallback(
    async (itemId: number) => {
      try {
        await apiRemoveFromCart(itemId);
        await refreshCart();
      } catch (error) {
        console.error('Error removing from cart:', error);
        throw error;
      }
    },
    [refreshCart]
  );

  const addSpecialToCart = useCallback(
    async (specialId: number) => {
      if (!cart) return;

      try {
        await apiAddSpecialToCart(cart.id, specialId);
        await refreshCart();
      } catch (error) {
        console.error('Error adding special to cart:', error);
        throw error;
      }
    },
    [cart, refreshCart]
  );

  const value: CartContextType = {
    cart,
    items,
    total,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
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
