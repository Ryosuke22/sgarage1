import { useState, useRef, useEffect, memo } from 'react';
import { useIntersectionLazyLoad } from '@/components/LazyLoading';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

// Memoized optimized image component
const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder,
  sizes,
  loading = 'lazy',
  onLoad,
  onError
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const imgRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionLazyLoad(imgRef);

  // Progressive image loading
  useEffect(() => {
    if ((priority || isVisible) && src && !isLoaded && !isError) {
      const img = new Image();
      
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
        onLoad?.();
      };
      
      img.onerror = () => {
        setIsError(true);
        onError?.();
      };

      // Optimize image format based on browser support
      const optimizedSrc = getOptimizedImageSrc(src);
      img.src = optimizedSrc;
    }
  }, [src, priority, isVisible, isLoaded, isError, onLoad, onError]);

  // Generate responsive srcset for different screen densities
  const generateSrcSet = (baseSrc: string) => {
    const srcSet = [];
    const extensions = ['.webp', '.jpg', '.png'];
    
    // Add different density variants
    srcSet.push(`${baseSrc} 1x`);
    
    // Add 2x density for high-DPI displays
    const highDensitySrc = baseSrc.replace(/\.(jpg|png|webp)$/, '@2x.$1');
    srcSet.push(`${highDensitySrc} 2x`);
    
    return srcSet.join(', ');
  };

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
      data-testid={`optimized-image-${alt.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {/* Placeholder while loading */}
      {!isLoaded && !isError && (
        <div 
          className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse flex items-center justify-center"
          style={{ 
            backgroundImage: placeholder ? `url(${placeholder})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      )}

      {/* Main image */}
      {isLoaded && imageSrc && (
        <img
          src={imageSrc}
          srcSet={generateSrcSet(imageSrc)}
          sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
          alt={alt}
          width={width}
          height={height}
          className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading={priority ? 'eager' : loading}
          decoding="async"
          style={{ objectFit: 'cover' }}
        />
      )}

      {/* Error fallback */}
      {isError && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-gray-500 text-sm">Failed to load image</div>
        </div>
      )}
    </div>
  );
});

// Helper function to get optimized image source
function getOptimizedImageSrc(src: string): string {
  // Check if browser supports WebP
  const supportsWebP = document.createElement('canvas')
    .toDataURL('image/webp')
    .indexOf('data:image/webp') === 0;
    
  // Check if browser supports AVIF
  const supportsAVIF = document.createElement('canvas')
    .toDataURL('image/avif')
    .indexOf('data:image/avif') === 0;

  if (supportsAVIF && src.includes('/uploads/')) {
    return src.replace(/\.(jpg|png)$/, '.avif');
  } else if (supportsWebP && src.includes('/uploads/')) {
    return src.replace(/\.(jpg|png)$/, '.webp');
  }
  
  return src;
}

export default OptimizedImage;