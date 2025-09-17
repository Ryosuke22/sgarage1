import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface PerformanceContextType {
  isSlowConnection: boolean;
  isLowMemory: boolean;
  enablePrefetch: boolean;
  maxConcurrentRequests: number;
  optimizedMode: boolean;
}

const PerformanceContext = createContext<PerformanceContextType>({
  isSlowConnection: false,
  isLowMemory: false,
  enablePrefetch: true,
  maxConcurrentRequests: 6,
  optimizedMode: false
});

export function usePerformance() {
  return useContext(PerformanceContext);
}

interface PerformanceProviderProps {
  children: ReactNode;
}

export function PerformanceProvider({ children }: PerformanceProviderProps) {
  const [performanceConfig, setPerformanceConfig] = useState<PerformanceContextType>({
    isSlowConnection: false,
    isLowMemory: false,
    enablePrefetch: true,
    maxConcurrentRequests: 6,
    optimizedMode: false
  });

  useEffect(() => {
    // Detect connection speed
    const connection = (navigator as any).connection;
    const isSlowConnection = connection && (
      connection.effectiveType === 'slow-2g' ||
      connection.effectiveType === '2g' ||
      connection.downlink < 1.5
    );

    // Detect device memory
    const deviceMemory = (navigator as any).deviceMemory;
    const isLowMemory = deviceMemory ? deviceMemory <= 2 : false;

    // Determine optimal settings
    const isMobile = window.innerWidth < 768;
    const maxConcurrentRequests = isSlowConnection ? 2 : isMobile ? 4 : 6;
    
    setPerformanceConfig({
      isSlowConnection: !!isSlowConnection,
      isLowMemory,
      enablePrefetch: !isSlowConnection && !isLowMemory,
      maxConcurrentRequests,
      optimizedMode: isSlowConnection || isLowMemory
    });

    // Log performance configuration
    console.log('🔧 Performance Configuration:', {
      'Connection Type': connection?.effectiveType || 'unknown',
      'Device Memory': deviceMemory ? `${deviceMemory}GB` : 'unknown',
      'Optimized Mode': isSlowConnection || isLowMemory,
      'Prefetch Enabled': !isSlowConnection && !isLowMemory
    });

    // Setup memory cleanup
    const memoryCleanupInterval = setInterval(() => {
      if (isLowMemory) {
        // More aggressive cleanup for low memory devices
        performMemoryCleanup();
      }
    }, 30000); // Every 30 seconds

    return () => {
      clearInterval(memoryCleanupInterval);
    };
  }, []);

  return (
    <PerformanceContext.Provider value={performanceConfig}>
      {children}
    </PerformanceContext.Provider>
  );
}

// Memory cleanup utilities
function performMemoryCleanup() {
  // Clear unused images from memory
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (!img.offsetParent) {
      // Image is not visible, clear its src to free memory
      img.src = '';
    }
  });

  // Clear browser caches if available
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        if (name.includes('old') || name.includes('temp')) {
          caches.delete(name);
        }
      });
    });
  }

  // Suggest garbage collection
  if (typeof (window as any).gc === 'function') {
    (window as any).gc();
  }

  console.log('🧹 Memory cleanup performed');
}