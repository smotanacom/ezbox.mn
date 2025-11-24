'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Cart, CartItemWithDetails, ParameterSelection } from '@/types/database';
import {
  cartAPI,
  authAPI,
  calculateProductPrice,
  getGuestSessionId,
} from '@/lib/api-client';

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

      // Get current user from API
      const { user } = await authAPI.getUser();
      const guestSession = user ? undefined : getGuestSessionId();

      // Fetch cart with items and total (batched)
      const data = await cartAPI.get(user?.id, guestSession);

      setCart(data.cart);
      setItems(data.items);
      setTotal(data.total);
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
      try {
        // Get current user
        const { user } = await authAPI.getUser();
        const guestSession = user ? undefined : getGuestSessionId();

        // Add item and get updated cart (no need for separate refresh!)
        const data = await cartAPI.addItem({
          productId,
          quantity,
          selectedParameters,
          userId: user?.id,
          sessionId: guestSession,
        });

        // Update state with returned data
        setCart(data.cart);
        setItems(data.items);
        setTotal(data.total);
      } catch (error) {
        console.error('Error adding to cart:', error);
        throw error;
      }
    },
    []
  );

  const updateCartItem = useCallback(
    async (itemId: number, quantity?: number, selectedParameters?: ParameterSelection) => {
      try {
        // Update item and get updated cart
        const data = await cartAPI.updateItem(itemId, { quantity, selectedParameters });

        // Update state with returned data
        setCart(data.cart);
        setItems(data.items);
        setTotal(data.total);
      } catch (error) {
        console.error('Error updating cart item:', error);
        throw error;
      }
    },
    []
  );

  const removeFromCart = useCallback(
    async (itemId: number) => {
      try {
        // Remove item and get updated cart
        const data = await cartAPI.removeItem(itemId);

        // Update state with returned data
        setCart(data.cart);
        setItems(data.items);
        setTotal(data.total);
      } catch (error) {
        console.error('Error removing from cart:', error);
        throw error;
      }
    },
    []
  );

  const removeSpecialFromCart = useCallback(
    async (specialId: number) => {
      try {
        // Get current user
        const { user } = await authAPI.getUser();
        const guestSession = user ? undefined : getGuestSessionId();

        // Remove special and get updated cart
        const data = await cartAPI.removeSpecial({
          specialId,
          userId: user?.id,
          sessionId: guestSession,
        });

        // Update state with returned data
        setCart(data.cart);
        setItems(data.items);
        setTotal(data.total);
      } catch (error) {
        console.error('Error removing special from cart:', error);
        throw error;
      }
    },
    []
  );

  const addSpecialToCart = useCallback(
    async (specialId: number) => {
      try {
        // Get current user
        const { user } = await authAPI.getUser();
        const guestSession = user ? undefined : getGuestSessionId();

        // Add special and get updated cart
        const data = await cartAPI.addSpecial({
          specialId,
          userId: user?.id,
          sessionId: guestSession,
        });

        // Update state with returned data
        setCart(data.cart);
        setItems(data.items);
        setTotal(data.total);
      } catch (error) {
        console.error('Error adding special to cart:', error);
        throw error;
      }
    },
    []
  );

  const value: CartContextType = {
    cart,
    items,
    total,
    loading,
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
