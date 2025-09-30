import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { uploadShakenPdf } from "@/lib/uploadUtils";
import { directUpload } from "@/lib/upload";

interface DocumentUploadProps {
  documentType: string;
  title: string;
  icon: string;
  onUploadComplete?: (url: string, fileName: string) => void;
  existingDocument?: { url: string; fileName: string };
  onRemove?: () => void;
  className?: string;
}

interface UploadingFile {
  name: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export function DocumentUpload({ 
  documentType,
  title, 
  icon,
  onUploadComplete, 
  existingDocument,
  onRemove,
  className = "" 
}: DocumentUploadProps) {
  const [uploadingFile, setUploadingFile] = useState<UploadingFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    // Validate file type (accept images and PDFs)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "無効なファイル形式",
        description: "JPEG、PNG、WebP、AVIF、PDF形式のみ対応しています。",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "ファイルサイズエラー",
        description: "10MB以下のファイルをお選びください。",
        variant: "destructive"
      });
      return;
    }

    setUploadingFile({
      name: file.name,
      progress: 0,
      status: 'uploading'
    });

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadingFile(prev => prev ? {
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        } : null);
      }, 200);

      // Route based on file type
      let url: string;
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        // PDF files go to specialized endpoint
        const { readUrl } = await uploadShakenPdf(file);
        url = readUrl;
      } else {
        // Image files go to general document upload
        url = await directUpload(file, { purpose: 'document' });
      }
      
      clearInterval(progressInterval);
      
      setUploadingFile({
        name: file.name,
        progress: 100,
        status: 'completed'
      });

      setTimeout(() => {
        setUploadingFile(null);
        onUploadComplete?.(url, file.name);
        toast({
          title: "アップロード完了",
          description: `${title}がアップロードされました。`
        });
      }, 500);

    } catch (error: any) {
      setUploadingFile({
        name: file.name,
        progress: 0,
        status: 'error',
        error: error.message || 'アップロードに失敗しました'
      });
      
      toast({
        title: "アップロードエラー",
        description: error.message || 'アップロードに失敗しました',
        variant: "destructive"
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const resetUpload = () => {
    setUploadingFile(null);
  };

  // Show existing document
  if (existingDocument && !uploadingFile) {
    return (
      <Card className={`bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">{title}</p>
                <p className="text-sm text-green-600 dark:text-green-300">{existingDocument.fileName}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => window.open(existingDocument.url, '_blank')}
                data-testid={`button-view-${documentType}`}
              >
                表示
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onRemove}
                data-testid={`button-remove-${documentType}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show upload progress
  if (uploadingFile) {
    return (
      <Card className={`border-blue-200 dark:border-blue-800 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {uploadingFile.status === 'completed' ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : uploadingFile.status === 'error' ? (
                <AlertCircle className="h-8 w-8 text-red-600" />
              ) : (
                <FileText className="h-8 w-8 text-blue-600 animate-pulse" />
              )}
              <div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{uploadingFile.name}</p>
              </div>
            </div>
            {uploadingFile.status === 'error' && (
              <Button type="button" size="sm" variant="ghost" onClick={resetUpload}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {uploadingFile.status === 'uploading' && (
            <Progress value={uploadingFile.progress} className="h-2" />
          )}
          
          {uploadingFile.status === 'error' && (
            <p className="text-sm text-red-600 mt-2">{uploadingFile.error}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show upload area
  return (
    <Card 
      className={`transition-colors cursor-pointer ${
        isDragging 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      } ${className}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{title}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              ファイルをドラッグ＆ドロップまたはクリックしてアップロード
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              対応形式: JPEG, PNG, WebP, AVIF, PDF (最大10MB)
            </p>
          </div>
          <Button 
            type="button"
            size="sm" 
            variant="outline"
            onClick={() => document.getElementById(`file-${documentType}`)?.click()}
            data-testid={`button-upload-${documentType}`}
          >
            <Upload className="h-4 w-4 mr-2" />
            ファイル選択
          </Button>
          <input
            id={`file-${documentType}`}
            type="file"
            className="hidden"
            accept="image/*,application/pdf"
            onChange={handleFileInputChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}