/**
 * Convert object storage URLs to accessible public URLs via image proxy
 * Handles both /objects/uploads/ and /uploads/ formats
 */
export function convertImageUrl(url: string): string {
  if (!url) return '';
  
  // Already converted URL - return as-is
  if (url.startsWith('/image/') || url.startsWith('http')) {
    return url;
  }
  
  // Extract filename from various URL formats
  let filename = '';
  
  if (url.startsWith('/objects/uploads/')) {
    filename = url.replace('/objects/uploads/', '');
  } else if (url.startsWith('/objects/')) {
    filename = url.replace('/objects/', '');
  } else if (url.startsWith('/uploads/')) {
    filename = url.replace('/uploads/', '');
  } else {
    // Unknown format - return as-is
    return url;
  }
  
  // Use the image proxy route
  return `/image/${filename}`;
}