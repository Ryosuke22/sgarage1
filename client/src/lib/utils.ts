import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates and converts video URLs to embed URLs
 * Supports YouTube and Vimeo
 */
export function validateAndNormalizeVideoUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  try {
    const urlObj = new URL(url);
    
    // YouTube URL patterns
    if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
      const videoId = urlObj.searchParams.get('v');
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    
    if (urlObj.hostname === 'youtu.be') {
      const videoId = urlObj.pathname.slice(1);
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    
    if (urlObj.hostname === 'www.youtube.com' && urlObj.pathname.includes('/shorts/')) {
      const videoId = urlObj.pathname.split('/shorts/')[1];
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    
    // Vimeo URL patterns
    if (urlObj.hostname === 'vimeo.com' || urlObj.hostname === 'www.vimeo.com') {
      const videoId = urlObj.pathname.split('/')[1];
      if (videoId && /^\d+$/.test(videoId)) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Checks if a URL is from a supported video platform
 */
export function isSupportedVideoUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    const supportedHosts = [
      'youtube.com',
      'www.youtube.com', 
      'youtu.be',
      'vimeo.com',
      'www.vimeo.com'
    ];
    
    return supportedHosts.includes(urlObj.hostname);
  } catch {
    return false;
  }
}
