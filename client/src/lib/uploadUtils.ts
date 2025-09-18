/**
 * 車検証PDFアップロード用ヘルパー関数
 */
export async function uploadShakenPdf(file: File): Promise<{ readUrl: string; objectName: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload-doc", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(result.message || response.statusText || "PDFアップロードに失敗しました");
  }

  return {
    readUrl: result.readUrl,
    objectName: result.objectName,
  };
}

/**
 * 複数画像アップロード用ヘルパー関数
 */
export async function uploadMultipleImages(files: File[]): Promise<{ readUrl: string; objectName: string }[]> {
  const formData = new FormData();
  files.forEach(file => formData.append("files", file));

  const response = await fetch("/api/image/upload-image", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(result.message || response.statusText || "画像アップロードに失敗しました");
  }

  return result.items.map((item: any) => ({
    readUrl: item.readUrl || item.publicUrl,
    objectName: item.objectName,
  }));
}

/**
 * 単一ファイルアップロード用ヘルパー関数
 */
export async function uploadSingleFile(file: File): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || response.statusText || "ファイルアップロードに失敗しました");
  }

  return {
    url: result.url,
    filename: result.filename,
  };
}