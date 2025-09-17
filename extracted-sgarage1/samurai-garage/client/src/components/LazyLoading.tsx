import { Suspense, lazy, ComponentType, useState, useEffect } from "react";
import { PageLoading, ComponentLoading } from "@/components/LoadingSpinner";

// Higher-order component for lazy loading with consistent fallback
export function withLazyLoading<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = lazy(factory);
  const FallbackComponent = fallback || PageLoading;
  
  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={<FallbackComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Optimized route wrapper for lazy loading
export function LazyRoute({ 
  component: Component, 
  loading: LoadingComponent = PageLoading,
  ...props 
}: {
  component: ComponentType<any>;
  loading?: ComponentType;
  [key: string]: any;
}) {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <Component {...props} />
    </Suspense>
  );
}

// Preload utilities for critical routes
export const preloadRoutes = {
  home: () => import("@/pages/Home"),
  listing: () => import("@/pages/ListingDetail"),
  create: () => import("@/pages/CreateListing"),
  admin: () => import("@/pages/AdminDashboard"),
};

// Preload critical routes on interaction
export function preloadCriticalRoutes() {
  // Preload most visited pages after initial load
  setTimeout(() => {
    preloadRoutes.home();
    preloadRoutes.listing();
  }, 2000);
}

// Intersection observer for component-level lazy loading
export function useIntersectionLazyLoad(ref: React.RefObject<HTMLElement>) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [ref]);

  return isVisible;
}