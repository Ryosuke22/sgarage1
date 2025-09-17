// Performance monitoring and optimization utilities

export interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  timeToInteractive: number;
  bundleSize: number;
  memoryUsage: number;
}

// Measure and log performance metrics
export function measurePerformance(): PerformanceMetrics | null {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');
  
  const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
  
  return {
    pageLoadTime: navigation?.loadEventEnd - navigation?.fetchStart || 0,
    firstContentfulPaint: fcp?.startTime || 0,
    timeToInteractive: navigation?.domContentLoadedEventEnd - navigation?.fetchStart || 0,
    bundleSize: 0, // Would need build-time calculation
    memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
  };
}

// Log performance metrics for monitoring
export function logPerformanceMetrics() {
  // Wait for page to fully load
  window.addEventListener('load', () => {
    setTimeout(() => {
      const metrics = measurePerformance();
      if (metrics) {
        console.log('Performance Metrics:', {
          'Page Load': `${metrics.pageLoadTime.toFixed(2)}ms`,
          'First Contentful Paint': `${metrics.firstContentfulPaint.toFixed(2)}ms`,
          'Time to Interactive': `${metrics.timeToInteractive.toFixed(2)}ms`,
          'Memory Usage': `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`
        });
      }
    }, 1000);
  });
}

// Preload critical resources
export function preloadCriticalResources() {
  const criticalRoutes = [
    '/api/auth/user',
    '/api/listings',
    '/api/featured-listings'
  ];

  criticalRoutes.forEach(url => {
    fetch(url, { method: 'HEAD' }).catch(() => {
      // Silently fail for preloading
    });
  });
}

// Bundle splitting recommendations
export const bundleConfig = {
  vendor: ['react', 'react-dom', '@tanstack/react-query'],
  ui: ['@radix-ui', 'lucide-react'],
  utils: ['zod', 'date-fns'],
  features: {
    auction: ['./pages/ListingDetail', './components/BidBar'],
    admin: ['./pages/AdminDashboard', './pages/UserManagement'],
    upload: ['./pages/CreateListing', './components/CloudUpload']
  }
};

// Detect slow connections and adjust loading strategy
export function isSlowConnection(): boolean {
  const connection = (navigator as any).connection;
  if (!connection) return false;
  
  return connection.effectiveType === 'slow-2g' || 
         connection.effectiveType === '2g' ||
         connection.downlink < 1.5;
}

// Adaptive loading based on connection speed
export function getLoadingStrategy() {
  const isSlowConn = isSlowConnection();
  
  return {
    preloadDelay: isSlowConn ? 5000 : 2000,
    chunkSize: isSlowConn ? 'small' : 'medium',
    enablePrefetch: !isSlowConn,
    compressionLevel: isSlowConn ? 'high' : 'medium'
  };
}