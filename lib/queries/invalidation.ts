/**
 * Cache invalidation utilities
 *
 * Use these functions to invalidate caches from components that use direct API calls
 * instead of React Query mutations (e.g., admin detail pages).
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { productKeys } from './products';
import { categoryKeys } from './categories';
import { orderKeys } from './orders';
import { specialKeys } from './specials';
import { parameterKeys } from './parameters';
import { homeKeys } from './home';

/**
 * Hook to get cache invalidation functions
 *
 * Usage:
 * ```
 * const { invalidateProducts, invalidateHome } = useCacheInvalidation();
 *
 * // After saving product
 * await productAPI.update(id, data);
 * invalidateProducts(id);
 * ```
 */
export function useCacheInvalidation() {
  const queryClient = useQueryClient();

  /**
   * Invalidate all product-related caches
   * Also invalidates home data since home page shows products
   */
  const invalidateProducts = useCallback((productId?: number) => {
    if (productId) {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
    }
    queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    // Home page shows products
    queryClient.invalidateQueries({ queryKey: homeKeys.data() });
  }, [queryClient]);

  /**
   * Invalidate all category-related caches
   * Also invalidates home data since home page shows categories
   */
  const invalidateCategories = useCallback((categoryId?: number) => {
    if (categoryId) {
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(categoryId) });
    }
    queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    // Home page shows categories
    queryClient.invalidateQueries({ queryKey: homeKeys.data() });
  }, [queryClient]);

  /**
   * Invalidate all order-related caches
   */
  const invalidateOrders = useCallback((orderId?: number) => {
    if (orderId) {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
    }
    queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
  }, [queryClient]);

  /**
   * Invalidate all special-related caches
   * Also invalidates home data since home page shows specials
   */
  const invalidateSpecials = useCallback((specialId?: number) => {
    if (specialId) {
      queryClient.invalidateQueries({ queryKey: specialKeys.detail(specialId) });
    }
    queryClient.invalidateQueries({ queryKey: specialKeys.lists() });
    // Home page shows specials
    queryClient.invalidateQueries({ queryKey: homeKeys.data() });
  }, [queryClient]);

  /**
   * Invalidate all parameter-related caches
   * Also invalidates products since products display parameters
   */
  const invalidateParameters = useCallback((groupId?: number) => {
    if (groupId) {
      queryClient.invalidateQueries({ queryKey: parameterKeys.group(groupId) });
    }
    queryClient.invalidateQueries({ queryKey: parameterKeys.groupsList() });
    // Products include parameter data
    queryClient.invalidateQueries({ queryKey: productKeys.all });
    queryClient.invalidateQueries({ queryKey: homeKeys.data() });
  }, [queryClient]);

  /**
   * Invalidate home page data only
   */
  const invalidateHome = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: homeKeys.data() });
  }, [queryClient]);

  /**
   * Invalidate all caches (nuclear option)
   */
  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  return {
    invalidateProducts,
    invalidateCategories,
    invalidateOrders,
    invalidateSpecials,
    invalidateParameters,
    invalidateHome,
    invalidateAll,
  };
}
