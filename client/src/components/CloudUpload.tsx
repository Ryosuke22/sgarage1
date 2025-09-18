import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import { directUpload, formatFileSize, isValidImageType } from "@/lib/upload";

interface CloudUploadProps {
  onUploadComplete?: (publicUrl: string) => void;
  maxFiles?: number;
  purpose?: 'listing' | 'profile' | 'document';
  className?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  publicUrl: string;
  size: number;
  status: 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
}

export function CloudUpload({ 
  onUploadComplete, 
  maxFiles = 10, 
  purpose = 'listing',
  className = "" 
}: CloudUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      // Validate file type using utility function
      if (!isValidImageType(file)) {
        toast({
          title: "無効なファイル形式",
          description: `${file.name} は対応していません。JPEG、PNG、WebP、AVIF形式のみ対応しています。`,
          variant: "destructive"
        });
        return false;
      }
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "ファイルサイズエラー",
          description: `${file.name} のサイズが大きすぎます。10MB以下のファイルをお選びください。`,
          variant: "destructive"
        });
        return false;
      }
      
      return true;
    });

    // Check max files limit
    if (uploadedFiles.length + validFiles.length > maxFiles) {
      toast({
        title: "ファイル数制限",
        description: `最大${maxFiles}個のファイルまでアップロードできます。`,
        variant: "destructive"
      });
      return;
    }

    validFiles.forEach(file => uploadFile(file));
  };

  const uploadFile = async (file: File) => {
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add file to state with uploading status
    const newFile: UploadedFile = {
      id: fileId,
      name: file.name,
      publicUrl: '',
      size: file.size,
      status: 'uploading',
      progress: 50
    };
    
    setUploadedFiles(prev => [...prev, newFile]);

    try {
      // Use the unified upload utility
      const publicUrl = await directUpload(file, { 
        purpose, 
        provider: 'gcs' 
      });

      // Update file status to completed
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'completed', progress: 100, publicUrl }
          : f
      ));

      toast({
        title: "アップロード完了",
        description: `${file.name} のアップロードが完了しました。`,
      });

      // Callback for parent component
      onUploadComplete?.(publicUrl);

    } catch (error) {
      console.error('Upload error:', error);
      
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              status: 'error', 
              progress: 0, 
              error: error instanceof Error ? error.message : 'Upload failed' 
            }
          : f
      ));

      toast({
        title: "アップロードエラー",
        description: `${file.name} のアップロードに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Use utility function for file size formatting

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            ファイルアップロード
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            data-testid="upload-dropzone"
          >
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              ファイルをドラッグ＆ドロップ
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              または クリックしてファイルを選択
            </p>
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              data-testid="upload-button"
            >
              ファイルを選択
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              data-testid="file-input"
            />
            <p className="text-xs text-gray-400 mt-3">
              対応形式: JPEG, PNG, WebP, AVIF • 最大10MB • 最大{maxFiles}ファイル
            </p>
          </div>

          {/* File List */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                アップロードファイル
              </h4>
              {uploadedFiles.map((file) => (
                <div 
                  key={file.id} 
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  data-testid={`file-item-${file.id}`}
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {file.status === 'uploading' && (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    )}
                    {file.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {file.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                      {file.status === 'error' && file.error && (
                        <span className="text-red-600 ml-2">• {file.error}</span>
                      )}
                    </p>
                    {file.status === 'uploading' && (
                      <Progress value={file.progress} className="h-1 mt-2" />
                    )}
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="flex-shrink-0"
                    data-testid={`remove-file-${file.id}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}