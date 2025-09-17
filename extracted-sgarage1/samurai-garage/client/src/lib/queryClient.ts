import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    // Special handling for auth user endpoint
    if (queryKey.join("/") === "/api/auth/user") {
      if (res.status === 401) {
        return null; // Not authenticated
      }
      if (res.ok) {
        return await res.json(); // Return user data
      }
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Enhanced query client with advanced performance optimizations
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      
      // Aggressive performance optimizations for faster loading
      staleTime: 2 * 60_000, // 2 minutes - longer fresh time to reduce requests
      gcTime: 15 * 60_000, // 15 minutes - longer cache retention
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
      refetchOnReconnect: 'always', // Smart reconnection handling
      refetchInterval: false, // No automatic polling to save bandwidth
      networkMode: 'online', // Only fetch when online
      
      // Smart retry with connection awareness
      retry: (failureCount, error) => {
        // Check if we're offline
        if (!navigator.onLine) {
          return false;
        }
        
        // Don't retry on 4xx errors except transient ones
        if (error instanceof Error && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
            return false;
          }
        }
        return failureCount < 2; // Reduced retry attempts for faster failure handling
      },
      retryDelay: (attemptIndex) => {
        // Progressive delay with connection speed awareness
        const connection = (navigator as any).connection;
        const baseDelay = connection && connection.effectiveType === 'slow-2g' ? 2000 : 1000;
        return Math.min(baseDelay * 2 ** attemptIndex, 10000); // Max 10 seconds
      },
    },
    mutations: {
      // Optimized mutation settings
      retry: (failureCount, error) => {
        // Only retry mutations on network errors, not client errors
        if (error instanceof Error && 'status' in error) {
          const status = (error as any).status;
          return status >= 500 && failureCount < 2; // Only retry server errors
        }
        return failureCount < 1;
      },
      retryDelay: 1500, // Slightly longer delay for mutations
      networkMode: 'online',
    },
  },
});

// Memory optimization for query client
let memoryCleanupInterval: NodeJS.Timeout;

// Setup automatic cache cleanup
if (typeof window !== 'undefined') {
  const connection = (navigator as any).connection;
  const isLowMemory = (navigator as any).deviceMemory <= 2;
  
  // More aggressive cleanup on low memory devices
  const cleanupInterval = isLowMemory ? 30000 : 60000; // 30s vs 60s
  
  memoryCleanupInterval = setInterval(() => {
    const cache = queryClient.getQueryCache();
    const now = Date.now();
    const maxAge = isLowMemory ? 10 * 60 * 1000 : 20 * 60 * 1000; // 10min vs 20min
    
    // Remove stale queries that haven't been used recently
    cache.getAll().forEach(query => {
      const timeSinceLastAccess = now - query.state.dataUpdatedAt;
      const hasActiveObservers = query.getObserversCount() > 0;
      
      if (timeSinceLastAccess > maxAge && !hasActiveObservers) {
        cache.remove(query);
      }
    });
    
    // Clear mutation cache on low memory devices
    if (isLowMemory) {
      queryClient.getMutationCache().clear();
    }
  }, cleanupInterval);
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    clearInterval(memoryCleanupInterval);
  });
}
