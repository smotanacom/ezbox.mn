/**
 * React Query hooks for product operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productAPI } from '@/lib/api-client';

// Query keys
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (includeInactive: boolean = false) =>
    [...productKeys.lists(), { includeInactive }] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
};

/**
 * Hook to get all products with full details
 */
export function useProducts(includeInactive: boolean = false) {
  return useQuery({
    queryKey: productKeys.list(includeInactive),
    queryFn: () => productAPI.getAll(includeInactive),
    // Products are relatively stable, keep them fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get a single product by ID with full details
 */
export function useProduct(id: number) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productAPI.getById(id),
    // Product details are stable, keep fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Only fetch if we have a valid ID
    enabled: !!id && id > 0,
  });
}

/**
 * Hook to create a product (admin only)
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      category_id: number;
      description?: string;
      base_price: number;
      picture_url?: string;
      is_active?: boolean;
    }) => productAPI.create(data),
    onSuccess: () => {
      // Invalidate product lists to refetch
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

/**
 * Hook to update a product (admin only)
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      name?: string;
      category_id?: number;
      description?: string;
      base_price?: number;
      picture_url?: string;
      is_active?: boolean;
    }) => productAPI.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate the specific product and all product lists
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

/**
 * Hook to delete a product (admin only)
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => productAPI.delete(id),
    onSuccess: () => {
      // Invalidate all product queries
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
