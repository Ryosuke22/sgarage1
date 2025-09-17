import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, CheckCircle, AlertCircle, FileUp } from "lucide-react";
import { formatFileSize, isValidImageType } from "@/lib/upload";

interface DirectUploadProps {
  onUploadComplete?: (result: UploadResult) => void;
  multiple?: boolean;
  maxFiles?: number;
  purpose?: 'listing' | 'profile' | 'document';
  className?: string;
}

interface UploadResult {
  publicUrl: string;
  filename: string;
  size: number;
  contentType: string;
}

interface UploadingFile {
  id: string;
  file: File;
  status: 'uploading' | 'completed' | 'error';
  progress: number;
  result?: UploadResult;
  error?: string;
}

export function DirectUpload({ 
  onUploadComplete, 
  multiple = false,
  maxFiles = 5, 
  purpose = 'listing',
  className = "" 
}: DirectUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      if (!isValidImageType(file)) {
        toast({
          title: "無効なファイル形式",
          description: `${file.name} は対応していません。JPEG、PNG、WebP、AVIF形式のみ対応しています。`,
          variant: "destructive"
        });
        return false;
      }
      
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

    if (uploadingFiles.length + validFiles.length > maxFiles) {
      toast({
        title: "ファイル数制限",
        description: `最大${maxFiles}個のファイルまでアップロードできます。`,
        variant: "destructive"
      });
      return;
    }

    if (multiple) {
      uploadMultipleFiles(validFiles);
    } else {
      if (validFiles.length > 0) {
        uploadSingleFile(validFiles[0]);
      }
    }
  };

  const uploadSingleFile = async (file: File) => {
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const uploadingFile: UploadingFile = {
      id: fileId,
      file,
      status: 'uploading',
      progress: 0
    };
    
    setUploadingFiles([uploadingFile]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', purpose);

      const response = await fetch('/api/upload/direct', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      setUploadingFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'completed', progress: 100, result }
          : f
      ));

      toast({
        title: "アップロード完了",
        description: `${file.name} のアップロードが完了しました。`,
      });

      onUploadComplete?.(result);

    } catch (error) {
      console.error('Upload error:', error);
      
      setUploadingFiles(prev => prev.map(f => 
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
        description: `${file.name} のアップロードに失敗しました。`,
        variant: "destructive"
      });
    }
  };

  const uploadMultipleFiles = async (files: File[]) => {
    const newFiles: UploadingFile[] = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      status: 'uploading' as const,
      progress: 0
    }));
    
    setUploadingFiles(prev => [...prev, ...newFiles]);

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('purpose', purpose);

      const response = await fetch('/api/upload/multiple', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const { files: results } = await response.json();
      
      // Update each file with its result
      setUploadingFiles(prev => prev.map(uploadingFile => {
        const result = results.find((r: any) => r.originalName === uploadingFile.file.name);
        if (result && newFiles.some(f => f.id === uploadingFile.id)) {
          onUploadComplete?.(result);
          return { ...uploadingFile, status: 'completed', progress: 100, result };
        }
        return uploadingFile;
      }));

      toast({
        title: "アップロード完了",
        description: `${files.length}個のファイルのアップロードが完了しました。`,
      });

    } catch (error) {
      console.error('Multiple upload error:', error);
      
      setUploadingFiles(prev => prev.map(uploadingFile => 
        newFiles.some(f => f.id === uploadingFile.id)
          ? { 
              ...uploadingFile, 
              status: 'error', 
              progress: 0, 
              error: error instanceof Error ? error.message : 'Upload failed' 
            }
          : uploadingFile
      ));

      toast({
        title: "アップロードエラー",
        description: "ファイルのアップロードに失敗しました。",
        variant: "destructive"
      });
    }
  };

  const removeFile = (fileId: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const clearAll = () => {
    setUploadingFiles([]);
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

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileUp className="h-5 w-5" />
              {multiple ? 'マルチファイルアップロード' : 'ダイレクトアップロード'}
            </div>
            {uploadingFiles.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearAll}>
                クリア
              </Button>
            )}
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
            data-testid="direct-upload-dropzone"
          >
            <FileUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {multiple ? 'ファイルをドラッグ＆ドロップ (複数可)' : 'ファイルをドラッグ＆ドロップ'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              または クリックしてファイルを選択
            </p>
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              data-testid="direct-upload-button"
            >
              ファイルを選択
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple={multiple}
              accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              data-testid="direct-file-input"
            />
            <p className="text-xs text-gray-400 mt-3">
              対応形式: JPEG, PNG, WebP, AVIF • 最大10MB
              {multiple && ` • 最大${maxFiles}ファイル`}
            </p>
          </div>

          {/* File List */}
          {uploadingFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                アップロード状況
              </h4>
              {uploadingFiles.map((uploadingFile) => (
                <div 
                  key={uploadingFile.id} 
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  data-testid={`direct-file-item-${uploadingFile.id}`}
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {uploadingFile.status === 'uploading' && (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    )}
                    {uploadingFile.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {uploadingFile.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {uploadingFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(uploadingFile.file.size)}
                      {uploadingFile.status === 'error' && uploadingFile.error && (
                        <span className="text-red-600 ml-2">• {uploadingFile.error}</span>
                      )}
                      {uploadingFile.status === 'completed' && uploadingFile.result && (
                        <span className="text-green-600 ml-2">• アップロード完了</span>
                      )}
                    </p>
                    {uploadingFile.status === 'uploading' && (
                      <Progress value={uploadingFile.progress} className="h-1 mt-2" />
                    )}
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(uploadingFile.id)}
                    className="flex-shrink-0"
                    data-testid={`remove-direct-file-${uploadingFile.id}`}
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