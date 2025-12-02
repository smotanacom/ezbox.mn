/**
 * React Query hooks for home page data
 */

import { useQuery } from '@tanstack/react-query';
import { homeAPI } from '@/lib/api-client';

// Query keys
export const homeKeys = {
  all: ['home'] as const,
  data: () => [...homeKeys.all, 'data'] as const,
};

/**
 * Hook to get batched home page data (categories + products + specials)
 * This is optimized to fetch all home page data in a single request
 */
export function useHomeData() {
  return useQuery({
    queryKey: homeKeys.data(),
    queryFn: () => homeAPI.getData(),
    // Home page data changes occasionally, keep fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
  });
}
