import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { X, GripVertical, Upload, Camera } from 'lucide-react';
import { convertImageUrl } from '@/lib/imageUtils';

interface PhotoItem {
  id: string;
  url: string;
  sortOrder: number;
}

interface PhotoManagerProps {
  photos: PhotoItem[];
  onPhotosChange: (photos: PhotoItem[]) => void;
  maxFiles?: number;
  className?: string;
}

export function PhotoManager({ 
  photos, 
  onPhotosChange, 
  maxFiles = 10,
  className = "" 
}: PhotoManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate a unique ID for new photos
  const generatePhotoId = () => `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxFiles - photos.length;
    if (remainingSlots <= 0) {
      toast({
        title: "上限に達しています",
        description: `最大${maxFiles}枚まで追加できます`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const uploadPromises: Promise<PhotoItem | null>[] = [];

    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "エラー",
          description: `${file.name} は画像ファイルではありません`,
          variant: "destructive",
        });
        continue;
      }

      // Validate file size (100MB limit for high-resolution photos)
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "エラー", 
          description: `${file.name} のファイルサイズが大きすぎます（100MB以下にしてください）`,
          variant: "destructive",
        });
        continue;
      }

      const formData = new FormData();
      formData.append('image', file);

      const uploadPromise = fetch('/api/upload-image-temp', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || `Upload failed for ${file.name}`;
            throw new Error(errorMessage);
          }
          const data = await response.json();
          
          // Create a PhotoItem with the next sort order
          const newPhoto: PhotoItem = {
            id: generatePhotoId(),
            url: data.url,
            sortOrder: photos.length + i
          };
          
          console.log(`✓ Successfully uploaded ${file.name}:`, {
            size: data.sizeFormatted || `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
            url: data.url
          });
          
          return newPhoto;
        })
        .catch((error) => {
          console.error(`Error uploading ${file.name}:`, error);
          toast({
            title: "アップロードエラー",
            description: error.message || `${file.name} のアップロードに失敗しました`,
            variant: "destructive",
          });
          return null;
        });

      uploadPromises.push(uploadPromise);
    }

    try {
      const uploadedPhotos = await Promise.all(uploadPromises);
      const validPhotos = uploadedPhotos.filter(photo => photo !== null) as PhotoItem[];
      
      if (validPhotos.length > 0) {
        const updatedPhotos = [...photos, ...validPhotos];
        onPhotosChange(updatedPhotos);
        toast({
          title: "アップロード完了",
          description: `${validPhotos.length}枚の画像をアップロードしました`,
        });
      }
    } finally {
      setUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = useCallback((photoId: string) => {
    const updatedPhotos = photos
      .filter(photo => photo.id !== photoId)
      .map((photo, index) => ({
        ...photo,
        sortOrder: index
      }));
    onPhotosChange(updatedPhotos);
    toast({
      title: "画像を削除しました",
      description: "画像が削除されました",
    });
  }, [photos, onPhotosChange]);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder the photos array
    const reorderedPhotos = [...photos];
    const [draggedPhoto] = reorderedPhotos.splice(draggedIndex, 1);
    reorderedPhotos.splice(dropIndex, 0, draggedPhoto);

    // Update sort orders
    const updatedPhotos = reorderedPhotos.map((photo, index) => ({
      ...photo,
      sortOrder: index
    }));

    onPhotosChange(updatedPhotos);
    setDraggedIndex(null);
    setDragOverIndex(null);
    
    toast({
      title: "並び順を変更しました",
      description: "画像の順序が更新されました",
    });
  }, [photos, draggedIndex, onPhotosChange]);

  return (
    <div className={className}>
      {/* Upload Button */}
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || photos.length >= maxFiles}
          className="w-full"
          data-testid="button-upload-photos"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              アップロード中...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              画像をアップロード ({photos.length}/{maxFiles})
            </>
          )}
        </Button>
      </div>

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Camera className="h-4 w-4" />
            <span>画像をドラッグして順序を変更できます（最初の画像がメイン画像になります）</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <Card 
                key={photo.id}
                className={`relative cursor-move transition-all ${
                  draggedIndex === index ? 'opacity-50 scale-95' : ''
                } ${
                  dragOverIndex === index && draggedIndex !== index ? 'ring-2 ring-blue-500' : ''
                } ${
                  index === 0 ? 'ring-2 ring-green-500' : ''
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index)}
                data-testid={`photo-item-${index}`}
              >
                <CardContent className="p-2">
                  {/* Drag Handle */}
                  <div className="absolute top-2 left-2 bg-black/50 text-white p-1 rounded">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  
                  {/* Main Image Badge */}
                  {index === 0 && (
                    <div className="absolute top-2 right-8 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                      メイン
                    </div>
                  )}
                  
                  {/* Delete Button */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                    onClick={() => removePhoto(photo.id)}
                    data-testid={`button-delete-photo-${index}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  
                  {/* Image */}
                  <img
                    src={convertImageUrl(photo.url)}
                    alt={`Uploaded image ${index + 1}`}
                    className="w-full h-32 object-cover rounded"
                    data-testid={`img-photo-${index}`}
                    onError={(e) => {
                      console.error('Image failed to load:', photo.url);
                    }}
                  />
                  
                  {/* Order Number */}
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                    {index + 1}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {photos.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Camera className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">画像をアップロード</h3>
            <p className="text-muted-foreground mb-4">
              出品する車両の画像をアップロードしてください
            </p>
            <p className="text-sm text-muted-foreground">
              最初にアップロードした画像がメイン画像として表示されます
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}