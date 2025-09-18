import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Upload } from "lucide-react";

export default function DocUploader() {
  const [msg, setMsg] = useState("");
  const [uploadedDoc, setUploadedDoc] = useState<{ objectName: string; readUrl: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);

    setIsUploading(true);
    setMsg("PDF文書をアップロード中...");
    
    try {
      const r = await fetch("/api/upload-doc", { method: "POST", body: fd });
      const j = await r.json();
      
      if (!r.ok || !j.ok) {
        setMsg(`エラー: ${j.message || r.statusText}`);
        setUploadedDoc(null);
        return;
      }
      
      setUploadedDoc({ objectName: j.objectName, readUrl: j.readUrl });
      setMsg(`✅ PDFアップロード完了: ${file.name}`);
    } catch (error: any) {
      setMsg(`アップロードエラー: ${error.message}`);
      setUploadedDoc(null);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            車検証やその他のPDF文書をアップロード
          </p>
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={onFileSelect}
            className="hidden"
            id="pdf-upload"
            disabled={isUploading}
          />
          <label htmlFor="pdf-upload">
            <Button asChild disabled={isUploading}>
              <span className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? "アップロード中..." : "PDFファイルを選択"}
              </span>
            </Button>
          </label>
        </div>
      </div>

      {msg && (
        <div className={`p-3 rounded-md text-sm ${
          msg.includes("エラー") 
            ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"
            : "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
        }`}>
          {msg}
        </div>
      )}

      {uploadedDoc && (
        <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
          <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
            アップロード完了
          </h4>
          <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
            <p><strong>保存場所:</strong> {uploadedDoc.objectName}</p>
            <a 
              href={uploadedDoc.readUrl} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
            >
              <FileText className="w-4 h-4 mr-1" />
              PDF文書を開く（10分間有効）
            </a>
          </div>
        </div>
      )}
    </div>
  );
}