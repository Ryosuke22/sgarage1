import React, { useState } from "react";
import { uploadShakenPdf } from "@/lib/uploadUtils";
import { Button } from "@/components/ui/button";
import { FileText, Upload, CheckCircle } from "lucide-react";
import { convertImageUrl } from "@/lib/imageUtils";

interface ShakenUploadProps {
  onUploadComplete?: (data: { readUrl: string; objectName: string }) => void;
}

export default function ShakenUpload({ onUploadComplete }: ShakenUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ readUrl: string; objectName: string; fileType?: string } | null>(null);
  const [error, setError] = useState<string>("");

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            車検証をアップロード（PDF・画像）
          </p>
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              
              setIsUploading(true);
              setError("");
              setUploadResult(null);
              
              try {
                const { readUrl, objectName } = await uploadShakenPdf(f);
                const fileType = f.type.startsWith('image/') ? 'image' : 'pdf';
                setUploadResult({ readUrl, objectName, fileType });
                onUploadComplete?.({ readUrl, objectName });
              } catch (err: any) {
                setError("アップロード失敗: " + err.message);
              } finally {
                setIsUploading(false);
              }
            }}
            className="hidden"
            id="shaken-upload"
            disabled={isUploading}
          />
          <label htmlFor="shaken-upload">
            <Button asChild disabled={isUploading}>
              <span className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? "アップロード中..." : "車検証PDFを選択"}
              </span>
            </Button>
          </label>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md text-sm bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {uploadResult && (
        <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
          <div className="flex items-center mb-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
            <h4 className="font-medium text-green-800 dark:text-green-200">
              車検証アップロード完了
            </h4>
          </div>
          
          {uploadResult.fileType === 'image' && (
            <div className="mb-3">
              <img 
                src={convertImageUrl(uploadResult.readUrl)} 
                alt="車検証プレビュー" 
                className="max-w-full h-auto rounded border border-green-200 dark:border-green-700"
              />
            </div>
          )}
          
          <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
            <p><strong>保存場所:</strong> {uploadResult.objectName}</p>
            <a 
              href={uploadResult.readUrl} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
            >
              <FileText className="w-4 h-4 mr-1" />
              車検証を表示（10分間有効）
            </a>
          </div>
        </div>
      )}
    </div>
  );
}