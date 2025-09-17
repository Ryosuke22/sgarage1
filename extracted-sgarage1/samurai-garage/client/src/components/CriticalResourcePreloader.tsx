import { useEffect } from 'react';

// Critical resource preloader for aggressive performance optimization
export function CriticalResourcePreloader() {
  useEffect(() => {
    // Aggressive DNS prefetching
    const criticalDomains = [
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'js.stripe.com',
      'cdn.jsdelivr.net'
    ];

    criticalDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain}`;
      document.head.appendChild(link);
    });

    // Preconnect to critical origins
    const preconnectDomains = [
      'fonts.googleapis.com',
      'js.stripe.com'
    ];

    preconnectDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = `https://${domain}`;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    // Critical API endpoints preloading
    const criticalAPIs = [
      '/api/auth/user',
      '/api/featured-listings?limit=6',
      '/api/listings?limit=20'
    ];

    // Use requestIdleCallback for non-blocking preloading
    const preloadAPIs = () => {
      criticalAPIs.forEach(url => {
        fetch(url, {
          method: 'HEAD',
          credentials: 'include',
          cache: 'force-cache',
          keepalive: true
        }).catch(() => {});
      });
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadAPIs, { timeout: 1000 });
    } else {
      setTimeout(preloadAPIs, 100);
    }

    // Preload critical fonts
    const criticalFonts = [
      'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
    ];

    criticalFonts.forEach(fontUrl => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = fontUrl;
      link.as = 'style';
      link.onload = () => {
        link.rel = 'stylesheet';
      };
      document.head.appendChild(link);
    });

    // Critical images preloading
    const criticalImages = [
      '/assets/logo.svg',
      '/assets/hero-background.webp',
      '/assets/icons/upload.svg'
    ];

    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = src;
      link.as = 'image';
      document.head.appendChild(link);
    });

    // Setup resource hints for better loading
    const metaResourceHints = document.createElement('meta');
    metaResourceHints.httpEquiv = 'x-dns-prefetch-control';
    metaResourceHints.content = 'on';
    document.head.appendChild(metaResourceHints);

  }, []);

  return null; // This component only adds performance optimizations
}

export default CriticalResourcePreloader;