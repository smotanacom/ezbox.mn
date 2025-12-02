/**
 * React Query hooks for category operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryAPI } from '@/lib/api-client';

// Query keys
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: () => [...categoryKeys.lists()] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: number) => [...categoryKeys.details(), id] as const,
};

/**
 * Hook to get all categories
 */
export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: async () => {
      const response = await categoryAPI.getAll();
      return response.categories;
    },
    // Categories are very stable, keep them fresh for 10 minutes
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to get a single category by ID
 */
export function useCategory(id: number) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: async () => {
      const response = await categoryAPI.getById(id);
      return response.category;
    },
    // Categories are stable
    staleTime: 10 * 60 * 1000,
    // Only fetch if we have a valid ID
    enabled: !!id && id > 0,
  });
}

/**
 * Hook to create a category (admin only)
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      picture_url?: string;
    }) => categoryAPI.create(data),
    onSuccess: () => {
      // Invalidate category list to refetch
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}

/**
 * Hook to update a category (admin only)
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      name?: string;
      description?: string;
      picture_url?: string;
    }) => categoryAPI.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate the specific category and all category lists
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}

/**
 * Hook to delete a category (admin only)
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => categoryAPI.delete(id),
    onSuccess: () => {
      // Invalidate all category queries
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}
