import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AppRoutes } from "@/routes";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PerformanceProvider } from "@/components/PerformanceProvider";
import CriticalResourcePreloader from "@/components/CriticalResourcePreloader";
import { Suspense, useEffect, memo } from "react";
import { PageLoading } from "@/components/LoadingSpinner";

// Performance monitoring and optimization
function initializePerformanceOptimizations() {
  // Initialize comprehensive performance monitoring
  import("@/utils/performance").then(({ logPerformanceMetrics, preloadCriticalResources }) => {
    logPerformanceMetrics();
    preloadCriticalResources();
  });
  
  // Setup memory management for low-memory devices
  import("@/utils/memoryOptimization").then(({ setupMemoryManagement }) => {
    const memoryManager = setupMemoryManagement();
    (window as any).__MEMORY_MANAGER = memoryManager;
    console.log('💾 Memory management initialized');
  });
  
  // Preload critical resources
  setTimeout(() => {
    import("@/utils/performance").then(({ preloadCriticalResources }) => {
      preloadCriticalResources();
    });
  }, 500);
}

// Memoized App component to prevent unnecessary re-renders
const App = memo(function App() {
  useEffect(() => {
    // Initialize aggressive performance optimizations immediately
    initializePerformanceOptimizations();
    
    // Force immediate garbage collection if available
    if (typeof (window as any).gc === 'function') {
      setTimeout(() => (window as any).gc(), 2000);
    }
  }, []);

  return (
    <PerformanceProvider>
      <CriticalResourcePreloader />
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" storageKey="samurai-garage-theme">
          <TooltipProvider>
            <Toaster />
            <Suspense fallback={<PageLoading />}>
              <AppRoutes />
            </Suspense>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </PerformanceProvider>
  );
});

// Memoize App component to prevent unnecessary re-renders
export default App;
