import React, { useState } from "react";

export default function UploadDoc() {
  const [status, setStatus] = useState<string>("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const contentType = file.type || "application/octet-stream";

      setStatus("URL発行中...");
      const r = await fetch("/api/uploads/create-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ext, contentType, kind: "doc" }),
      });
      if (!r.ok) {
        const errorData = await r.json().catch(() => ({ error: "Unknown error" }));
        setStatus(`URL発行失敗 (${r.status}): ${errorData.error || errorData.message || "不明なエラー"}\n\n設定方法:\n${errorData.details?.requiredEnvVars?.join(', ') || 'GCP認証情報が必要です'}`);
        return;
      }
      const { url, objectName, publicUrl } = await r.json();

      setStatus("アップロード中...");
      const put = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });

      if (!put.ok) {
        const text = await put.text();
        setStatus("アップロード失敗: " + put.status + " " + text);
        return;
      }
      setStatus("完了: " + publicUrl);
    } catch (error) {
      setStatus(`エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }

  async function onLocalUpload(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setStatus("ローカルアップロード中...");
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        setStatus(`アップロード失敗 (${response.status}): ${errorData.message || "不明なエラー"}`);
        return;
      }

      const result = await response.json();
      setStatus(`ローカルアップロード完了!\nファイル名: ${result.filename}\nサイズ: ${(result.size / 1024).toFixed(1)}KB\nURL: ${result.url}`);
    } catch (error) {
      setStatus(`ローカルアップロードエラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }

  return (
    <div style={{display:"grid", gap:12}}>
      <div>
        <h4 style={{margin:"0 0 8px 0"}}>🌩️ クラウドストレージ (GCS設定が必要)</h4>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={onChange} />
      </div>
      <div>
        <h4 style={{margin:"0 0 8px 0"}}>💾 ローカルストレージ (設定不要)</h4>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={onLocalUpload} />
      </div>
      <div style={{whiteSpace:"pre-wrap", minHeight:"60px", padding:"8px", backgroundColor:"#f5f5f5", borderRadius:"4px"}}>{status}</div>
    </div>
  );
}