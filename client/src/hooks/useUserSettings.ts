import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { UserSettings, InsertUserSettings } from "@shared/schema";

// Query key factory for user settings
export const userSettingsKeys = {
  all: ["/api/user/settings"] as const,
  settings: () => ["/api/user/settings"] as const,
};

// Hook to get user settings
export function useUserSettings() {
  return useQuery<UserSettings>({
    queryKey: userSettingsKeys.settings(),
    staleTime: 5 * 60 * 1000, // 5 minutes - settings don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 401/403 errors
      if (error instanceof Error && 'message' in error) {
        if (error.message.includes('401') || error.message.includes('403')) {
          return false;
        }
      }
      return failureCount < 2;
    },
  });
}

// Hook to update user settings
export function useUpdateUserSettings() {
  return useMutation({
    mutationFn: async (settings: Partial<InsertUserSettings>) => {
      const response = await apiRequest("PUT", "/api/user/settings", settings);
      return response.json();
    },
    onSuccess: (data) => {
      // Update the cache with the new settings
      queryClient.setQueryData(userSettingsKeys.settings(), data.settings);
      
      // Also invalidate to ensure fresh data on next fetch
      queryClient.invalidateQueries({ 
        queryKey: userSettingsKeys.all
      });
    },
    // Optimistic updates
    onMutate: async (newSettings) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userSettingsKeys.settings() });
      
      // Snapshot previous value
      const previousSettings = queryClient.getQueryData(userSettingsKeys.settings());
      
      // Optimistically update to new value
      if (previousSettings) {
        queryClient.setQueryData(userSettingsKeys.settings(), {
          ...previousSettings,
          ...newSettings,
          updatedAt: new Date(),
        });
      }
      
      // Return context with snapshot
      return { previousSettings };
    },
    onError: (error, newSettings, context) => {
      console.error("Failed to update user settings:", error);
      
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(userSettingsKeys.settings(), context.previousSettings);
      }
    },
  });
}

// Hook that provides both query and mutation with helper functions
export function useSettings() {
  const query = useUserSettings();
  const mutation = useUpdateUserSettings();
  
  const updateSettings = (settings: Partial<InsertUserSettings>) => {
    return mutation.mutate(settings);
  };
  
  const updateSetting = <K extends keyof InsertUserSettings>(
    key: K, 
    value: InsertUserSettings[K]
  ) => {
    return mutation.mutate({ [key]: value } as Partial<InsertUserSettings>);
  };
  
  return {
    // Data
    settings: query.data,
    
    // States
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    
    // Mutations
    updateSettings,
    updateSetting,
    isUpdating: mutation.isPending,
    updateError: mutation.error,
    
    // Utility
    refetch: query.refetch,
  };
}