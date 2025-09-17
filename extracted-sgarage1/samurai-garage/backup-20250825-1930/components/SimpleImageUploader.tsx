import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface SimpleImageUploaderProps {
  onUploadComplete: (urls: string[]) => void;
  maxFiles?: number;
  className?: string;
}

export function SimpleImageUploader({ 
  onUploadComplete, 
  maxFiles = 10,
  className = "" 
}: SimpleImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadPromises: Promise<string>[] = [];

    for (let i = 0; i < Math.min(files.length, maxFiles); i++) {
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

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "エラー", 
          description: `${file.name} のファイルサイズが大きすぎます（10MB以下にしてください）`,
          variant: "destructive",
        });
        continue;
      }

      const formData = new FormData();
      formData.append('image', file);

      const uploadPromise = fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Upload failed for ${file.name}`);
          }
          const data = await response.json();
          return data.url;
        })
        .catch((error) => {
          console.error(`Error uploading ${file.name}:`, error);
          toast({
            title: "アップロードエラー",
            description: `${file.name} のアップロードに失敗しました`,
            variant: "destructive",
          });
          return null;
        });

      uploadPromises.push(uploadPromise);
    }

    try {
      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter(url => url !== null) as string[];
      
      if (validUrls.length > 0) {
        onUploadComplete(validUrls);
        toast({
          title: "アップロード完了",
          description: `${validUrls.length}枚の画像をアップロードしました`,
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

  return (
    <div className={className}>
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
        disabled={uploading}
        className="w-full"
      >
        {uploading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
            アップロード中...
          </>
        ) : (
          <>
            <span className="mr-2">📁</span>
            画像をアップロード
          </>
        )}
      </Button>
    </div>
  );
}