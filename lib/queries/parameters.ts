/**
 * React Query hooks for parameter group and parameter operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parameterAPI } from '@/lib/api-client';

// Query keys
export const parameterKeys = {
  all: ['parameters'] as const,
  groups: () => [...parameterKeys.all, 'groups'] as const,
  groupsList: () => [...parameterKeys.groups(), 'list'] as const,
  group: (id: number) => [...parameterKeys.groups(), id] as const,
};

/**
 * Hook to get all parameter groups with their parameters
 */
export function useParameterGroups() {
  return useQuery({
    queryKey: parameterKeys.groupsList(),
    queryFn: async () => {
      const response = await parameterAPI.getAllGroups();
      return response.parameterGroups;
    },
    // Parameter groups are stable, keep fresh for 10 minutes
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to get a single parameter group by ID with its parameters
 */
export function useParameterGroup(id: number) {
  return useQuery({
    queryKey: parameterKeys.group(id),
    queryFn: async () => {
      const response = await parameterAPI.getGroup(id);
      return response.parameterGroup;
    },
    staleTime: 10 * 60 * 1000,
    // Only fetch if we have a valid ID
    enabled: !!id && id > 0,
  });
}

/**
 * Hook to create a parameter group (admin only)
 */
export function useCreateParameterGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      parameterAPI.createGroup(data),
    onSuccess: () => {
      // Invalidate parameter groups list
      queryClient.invalidateQueries({ queryKey: parameterKeys.groupsList() });
    },
  });
}

/**
 * Hook to create a parameter group with parameters (admin only)
 */
export function useCreateParameterGroupWithParameters() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      internal_name?: string;
      description?: string;
      parameters: Array<{
        name: string;
        price_modifier?: number;
        description?: string;
      }>;
    }) => parameterAPI.createGroupWithParameters(data),
    onSuccess: () => {
      // Invalidate parameter groups list
      queryClient.invalidateQueries({ queryKey: parameterKeys.groupsList() });
    },
  });
}

/**
 * Hook to update a parameter group (admin only)
 */
export function useUpdateParameterGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      name?: string;
      description?: string;
    }) => parameterAPI.updateGroup(id, data),
    onSuccess: (_, variables) => {
      // Invalidate the specific group and groups list
      queryClient.invalidateQueries({ queryKey: parameterKeys.group(variables.id) });
      queryClient.invalidateQueries({ queryKey: parameterKeys.groupsList() });
    },
  });
}

/**
 * Hook to delete a parameter group (admin only)
 */
export function useDeleteParameterGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => parameterAPI.deleteGroup(id),
    onSuccess: () => {
      // Invalidate all parameter queries
      queryClient.invalidateQueries({ queryKey: parameterKeys.all });
    },
  });
}

/**
 * Hook to create a parameter (admin only)
 */
export function useCreateParameter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      parameterGroupId,
      ...data
    }: {
      parameterGroupId: number;
      name: string;
      price_modifier: number;
      picture_url?: string;
    }) => parameterAPI.createParameter(parameterGroupId, data),
    onSuccess: (_, variables) => {
      // Invalidate the parameter group to refetch with new parameter
      queryClient.invalidateQueries({
        queryKey: parameterKeys.group(variables.parameterGroupId),
      });
      queryClient.invalidateQueries({ queryKey: parameterKeys.groupsList() });
    },
  });
}

/**
 * Hook to update a parameter (admin only)
 */
export function useUpdateParameter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      name?: string;
      price_modifier?: number;
      picture_url?: string;
    }) => parameterAPI.updateParameter(id, data),
    onSuccess: () => {
      // Invalidate all parameter groups since we don't know which group this parameter belongs to
      queryClient.invalidateQueries({ queryKey: parameterKeys.all });
    },
  });
}

/**
 * Hook to delete a parameter (admin only)
 */
export function useDeleteParameter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => parameterAPI.deleteParameter(id),
    onSuccess: () => {
      // Invalidate all parameter queries
      queryClient.invalidateQueries({ queryKey: parameterKeys.all });
    },
  });
}
