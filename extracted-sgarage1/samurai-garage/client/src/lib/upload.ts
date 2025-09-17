// Unified upload utility for both Replit Object Storage and Google Cloud Storage

export interface SignedUrlResponse {
  uploadUrl: string;
  publicPath?: string;
  publicUrl?: string;
  filename?: string;
  expiresAt?: string;
}

export interface UploadOptions {
  purpose?: 'listing' | 'profile' | 'document';
  provider?: 'replit' | 'gcs';
}

// Get signed upload URL using the new simplified GCS endpoint
export async function getSignedUrl(
  filename: string, 
  contentType: string, 
  options: UploadOptions = {}
): Promise<SignedUrlResponse> {
  const { purpose = 'listing' } = options;
  
  // Extract file extension
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  const response = await fetch('/api/uploads/create-url', {
    method: "POST",
    headers: { 
      "Content-Type": "application/json" 
    },
    credentials: 'include',
    body: JSON.stringify({ 
      ext,
      contentType,
      kind: purpose === 'document' ? 'doc' : 'image'
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Signed URL generation failed: ${response.status}`);
  }
  
  const data = await response.json();
  return {
    uploadUrl: data.url,
    publicUrl: data.publicUrl,
    filename: data.objectName,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
  };
}

// Direct file upload via server proxy (bypasses CORS issues)
export async function directUpload(
  file: File, 
  options: UploadOptions = {}
): Promise<string> {
  // Validate file type - allow PDFs for documents
  const isImage = file.type.match(/^image\/(jpeg|jpg|png|webp|avif)$/);
  const isPDF = file.type === 'application/pdf' && options.purpose === 'document';
  
  if (!isImage && !isPDF) {
    throw new Error(`Unsupported file type: ${file.type}. Images (JPEG, PNG, WebP, AVIF) and PDFs (for documents) are supported.`);
  }
  
  // Validate file size (100MB max for high-resolution photos)
  if (file.size > 100 * 1024 * 1024) {
    throw new Error(`File size too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum is 100MB.`);
  }
  
  // Use server-side upload to bypass CORS issues
  const formData = new FormData();
  formData.append('file', file);
  
  const uploadResponse = await fetch('/api/gcs/upload', {
    method: 'POST',
    credentials: 'include',
    body: formData
  });
  
  if (!uploadResponse.ok) {
    const errorData = await uploadResponse.json().catch(() => ({}));
    throw new Error(errorData.message || `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
  }
  
  const result = await uploadResponse.json();
  
  // Return read URL for accessing the uploaded file
  return result.readUrl || result.publicUrl || '';
}

// Upload multiple files with progress tracking
export async function uploadMultipleFiles(
  files: FileList | File[],
  options: UploadOptions = {},
  onProgress?: (progress: { completed: number; total: number; currentFile: string }) => void
): Promise<string[]> {
  const fileArray = Array.from(files);
  const results: string[] = [];
  
  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i];
    
    onProgress?.({
      completed: i,
      total: fileArray.length,
      currentFile: file.name
    });
    
    try {
      const publicUrl = await directUpload(file, options);
      results.push(publicUrl);
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
      throw new Error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  onProgress?.({
    completed: fileArray.length,
    total: fileArray.length,
    currentFile: ''
  });
  
  return results;
}

// Validate uploaded file exists
export async function validateUpload(
  filename: string,
  provider: 'replit' | 'gcs' = 'gcs'
): Promise<boolean> {
  try {
    const endpoint = provider === 'gcs' ? '/api/upload/gcs/validate' : '/api/upload/validate';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ filename }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Upload validation error:', error);
    return false;
  }
}

// Delete uploaded file
export async function deleteUpload(
  filename: string,
  provider: 'replit' | 'gcs' = 'gcs'
): Promise<boolean> {
  try {
    const endpoint = provider === 'gcs' 
      ? `/api/upload/gcs/${encodeURIComponent(filename)}`
      : `/api/upload/${encodeURIComponent(filename)}`;
    
    const response = await fetch(endpoint, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    return response.ok;
  } catch (error) {
    console.error('Upload deletion error:', error);
    return false;
  }
}

// Utility function to format file sizes
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Check if file type is supported
export function isValidImageType(file: File): boolean {
  return /^image\/(jpeg|jpg|png|webp|avif)$/i.test(file.type);
}

// Generate thumbnail-friendly filename
export function generateThumbnailFilename(originalFilename: string, size: string = 'thumb'): string {
  const extension = originalFilename.split('.').pop();
  const nameWithoutExt = originalFilename.replace(/\.[^/.]+$/, '');
  return `${nameWithoutExt}_${size}.${extension}`;
}