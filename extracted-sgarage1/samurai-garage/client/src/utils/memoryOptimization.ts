// Advanced memory optimization utilities for better performance

import { queryClient } from '@/lib/queryClient';

// Memory usage monitoring
interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export function getMemoryUsage(): MemoryInfo | null {
  const memory = (performance as any).memory;
  return memory || null;
}

// Aggressive memory cleanup for low-memory devices
export function performAggressiveCleanup() {
  console.log('🧹 Starting aggressive memory cleanup');
  
  // 1. Clear query cache of unused queries
  const cache = queryClient.getQueryCache();
  const now = Date.now();
  const staleThreshold = 5 * 60 * 1000; // 5 minutes
  
  let removedQueries = 0;
  cache.getAll().forEach(query => {
    const timeSinceUpdate = now - query.state.dataUpdatedAt;
    const hasObservers = query.getObserversCount() > 0;
    
    if (timeSinceUpdate > staleThreshold && !hasObservers) {
      cache.remove(query);
      removedQueries++;
    }
  });
  
  // 2. Clear mutation cache
  queryClient.getMutationCache().clear();
  
  // 3. Remove unused images from DOM to free memory
  const images = document.querySelectorAll('img');
  let removedImages = 0;
  images.forEach(img => {
    // If image is not visible and not recently used, remove src
    if (!img.offsetParent && !img.dataset.priority) {
      img.removeAttribute('src');
      removedImages++;
    }
  });
  
  // 4. Clear unused CSS and styles (DISABLED - was causing visual issues)
  // Note: CSS cleanup disabled to prevent layout issues when returning to tab
  // const stylesheets = document.querySelectorAll('style');
  // stylesheets.forEach(style => {
  //   if (style.textContent && style.textContent.length > 10000) {
  //     // Only keep critical styles
  //     const criticalRules = style.textContent.match(/\.(btn|input|card|modal)[^{]*\{[^}]*\}/g) || [];
  //     if (criticalRules.length > 0) {
  //       style.textContent = criticalRules.join('\n');
  //     }
  //   }
  // });
  
  // 5. Clear localStorage of old items
  const storageItems = Object.keys(localStorage);
  storageItems.forEach(key => {
    if (key.includes('temp-') || key.includes('cache-')) {
      try {
        const item = JSON.parse(localStorage.getItem(key) || '{}');
        if (item.timestamp && (now - item.timestamp) > 24 * 60 * 60 * 1000) {
          localStorage.removeItem(key);
        }
      } catch {
        // Remove invalid JSON items
        localStorage.removeItem(key);
      }
    }
  });
  
  // 6. Force garbage collection if available
  if (typeof (window as any).gc === 'function') {
    (window as any).gc();
  }
  
  console.log(`✅ Memory cleanup completed: ${removedQueries} queries, ${removedImages} images`);
}

// Smart memory management based on device capabilities
export function setupMemoryManagement() {
  const deviceMemory = (navigator as any).deviceMemory;
  const isLowMemory = deviceMemory ? deviceMemory <= 2 : false;
  const connection = (navigator as any).connection;
  const isSlowConnection = connection && (
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g' ||
    connection.downlink < 1.5
  );
  
  // Setup periodic cleanup based on device capabilities
  const cleanupInterval = isLowMemory ? 30000 : 60000; // 30s vs 60s
  
  let cleanupTimer = setInterval(() => {
    const memoryInfo = getMemoryUsage();
    if (memoryInfo) {
      const memoryUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
      
      // Trigger cleanup if memory usage is high
      if (memoryUsagePercent > (isLowMemory ? 60 : 80)) {
        performAggressiveCleanup();
      }
    }
  }, cleanupInterval);
  
  // Monitor memory pressure events
  if ('memory' in performance) {
    const memoryApi = (performance as any).memory;
    if (memoryApi && typeof memoryApi.addEventListener === 'function') {
      memoryApi.addEventListener('memorypressure', () => {
        console.warn('⚠️ Memory pressure detected, performing cleanup');
        performAggressiveCleanup();
      });
    }
  }
  
  // Cleanup on page visibility change (REDUCED AGGRESSIVENESS)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Page is hidden, perform very light cleanup only for queries
      setTimeout(() => {
        // Only clear stale queries, don't touch CSS or images
        const cache = queryClient.getQueryCache();
        const now = Date.now();
        const staleThreshold = 10 * 60 * 1000; // 10 minutes (increased from 5)
        
        cache.getAll().forEach(query => {
          const timeSinceUpdate = now - query.state.dataUpdatedAt;
          const hasObservers = query.getObserversCount() > 0;
          
          if (timeSinceUpdate > staleThreshold && !hasObservers) {
            cache.remove(query);
          }
        });
      }, 10000); // Increased delay to 10 seconds
    }
  });
  
  // Cleanup before page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(cleanupTimer);
    performAggressiveCleanup();
  });
  
  console.log(`💾 Memory management setup: ${isLowMemory ? 'Low' : 'Normal'} memory mode`);
  
  return {
    isLowMemory,
    isSlowConnection,
    cleanup: performAggressiveCleanup,
    getMemoryUsage
  };
}

// Optimize React component re-renders
export function createMemoizedSelector<T, R>(
  selector: (state: T) => R,
  equalityFn?: (a: R, b: R) => boolean
) {
  let lastResult: R;
  let lastArgs: T;
  
  return (state: T): R => {
    if (lastArgs !== state) {
      const newResult = selector(state);
      if (!equalityFn || !equalityFn(lastResult, newResult)) {
        lastResult = newResult;
      }
      lastArgs = state;
    }
    return lastResult;
  };
}

// Debounced function for performance-critical operations
export function createDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout;
  
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), delay);
  }) as T;
}

// Throttled function for scroll and resize events
export function createThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): T {
  let inThrottle: boolean;
  
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      callback(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
}

// Image preloading with memory management
export class OptimizedImageLoader {
  private cache = new Map<string, HTMLImageElement>();
  private loading = new Set<string>();
  private maxCacheSize: number;
  
  constructor(maxCacheSize = 50) {
    this.maxCacheSize = maxCacheSize;
  }
  
  async load(src: string, priority = false): Promise<HTMLImageElement> {
    // Return cached image if available
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }
    
    // Return loading promise if already loading
    if (this.loading.has(src)) {
      return new Promise((resolve, reject) => {
        const checkLoading = () => {
          if (this.cache.has(src)) {
            resolve(this.cache.get(src)!);
          } else if (!this.loading.has(src)) {
            reject(new Error('Loading failed'));
          } else {
            setTimeout(checkLoading, 100);
          }
        };
        checkLoading();
      });
    }
    
    this.loading.add(src);
    
    try {
      const img = new Image();
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          this.loading.delete(src);
          
          // Manage cache size
          if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
              this.cache.delete(firstKey);
            }
          }
          
          this.cache.set(src, img);
          resolve(img);
        };
        
        img.onerror = () => {
          this.loading.delete(src);
          reject(new Error(`Failed to load image: ${src}`));
        };
        
        if (priority) {
          img.loading = 'eager';
        }
        
        img.src = src;
      });
    } catch (error) {
      this.loading.delete(src);
      throw error;
    }
  }
  
  preload(sources: string[]) {
    sources.forEach(src => {
      if (!this.cache.has(src) && !this.loading.has(src)) {
        this.load(src).catch(() => {});
      }
    });
  }
  
  clear() {
    this.cache.clear();
    this.loading.clear();
  }
}

// Global image loader instance
export const imageLoader = new OptimizedImageLoader();