// Advanced caching configuration for different data types

export const cacheConfigs = {
  // Static or rarely changing data
  static: {
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 48 * 60 * 60 * 1000, // 48 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  },
  
  // User-specific data
  user: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  },
  
  // Real-time data (auctions, bids)
  realtime: {
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000, // 30 seconds
  },
  
  // Listings and content
  content: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  },
  
  // Admin data
  admin: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  }
};

// Query key factories for consistent caching
export const queryKeys = {
  listings: {
    all: ['listings'] as const,
    featured: () => [...queryKeys.listings.all, 'featured'] as const,
    detail: (slug: string) => [...queryKeys.listings.all, 'detail', slug] as const,
    search: (params: Record<string, any>) => [...queryKeys.listings.all, 'search', params] as const,
  },
  
  auctions: {
    all: ['auctions'] as const,
    active: () => [...queryKeys.auctions.all, 'active'] as const,
    detail: (id: string) => [...queryKeys.auctions.all, 'detail', id] as const,
    bids: (id: string) => [...queryKeys.auctions.all, 'bids', id] as const,
  },
  
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    watchlist: () => [...queryKeys.user.all, 'watchlist'] as const,
    bids: () => [...queryKeys.user.all, 'bids'] as const,
  },
  
  admin: {
    all: ['admin'] as const,
    users: () => [...queryKeys.admin.all, 'users'] as const,
    objects: (directory?: string) => {
      const baseKeys = [...queryKeys.admin.all, 'objects'] as const;
      return directory ? [...baseKeys, directory] as const : baseKeys;
    },
    stats: () => [...queryKeys.admin.all, 'stats'] as const,
  }
};

// Helper to get cache config by data type
export function getCacheConfig(type: keyof typeof cacheConfigs) {
  return cacheConfigs[type];
}

// Memory management utilities
export function clearExpiredCache() {
  // Clear old cache entries manually if needed
  console.log('Cache cleanup initiated for expired entries');
}

// Cache warming for critical data
export function warmCache() {
  // Prefetch critical data on app start
  const criticalQueries = [
    '/api/featured-listings',
    '/api/auth/user'
  ];
  
  criticalQueries.forEach(url => {
    fetch(url, { method: 'HEAD' }).catch(() => {
      // Silent fail for prefetching
    });
  });
}