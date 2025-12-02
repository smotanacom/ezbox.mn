/**
 * React Query hooks for special offers operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { specialAPI } from '@/lib/api-client';

// Query keys
export const specialKeys = {
  all: ['specials'] as const,
  lists: () => [...specialKeys.all, 'list'] as const,
  list: (status?: string) => [...specialKeys.lists(), { status }] as const,
  details: () => [...specialKeys.all, 'detail'] as const,
  detail: (id: number) => [...specialKeys.details(), id] as const,
};

/**
 * Hook to get all specials, optionally filtered by status
 */
export function useSpecials(status?: 'available' | 'draft' | 'hidden') {
  return useQuery({
    queryKey: specialKeys.list(status),
    queryFn: async () => {
      const response = await specialAPI.getAll(status);
      return response.specials;
    },
    // Specials can change, keep fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get a single special by ID
 */
export function useSpecial(id: number) {
  return useQuery({
    queryKey: specialKeys.detail(id),
    queryFn: async () => {
      const response = await specialAPI.getById(id);
      return response.special;
    },
    staleTime: 5 * 60 * 1000,
    // Only fetch if we have a valid ID
    enabled: !!id && id > 0,
  });
}

/**
 * Hook to create a special (admin only)
 */
export function useCreateSpecial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      discounted_price: number;
      status: string;
      picture_url?: string;
    }) => specialAPI.create(data),
    onSuccess: () => {
      // Invalidate special lists to refetch
      queryClient.invalidateQueries({ queryKey: specialKeys.lists() });
    },
  });
}

/**
 * Hook to update a special (admin only)
 */
export function useUpdateSpecial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      name?: string;
      description?: string;
      discounted_price?: number;
      status?: string;
      picture_url?: string;
    }) => specialAPI.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate the specific special and all special lists
      queryClient.invalidateQueries({ queryKey: specialKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: specialKeys.lists() });
    },
  });
}

/**
 * Hook to delete a special (admin only)
 */
export function useDeleteSpecial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => specialAPI.delete(id),
    onSuccess: () => {
      // Invalidate all special queries
      queryClient.invalidateQueries({ queryKey: specialKeys.all });
    },
  });
}
