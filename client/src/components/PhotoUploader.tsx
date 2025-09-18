import React, { useState } from "react";

export default function PhotoUploader() {
  const [msg, setMsg] = useState("");
  const [links, setLinks] = useState<string[]>([]);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fd = new FormData();
    Array.from(files).forEach(f => fd.append("files", f));

    setMsg("アップロード中...");
    const r = await fetch("/api/image/upload-image", { method: "POST", body: fd });
    const j = await r.json();
    if (!r.ok || !j.ok) {
      setMsg(`NG: ${j.message || r.statusText}`);
      return;
    }
    // 非公開バケット運用でも見える readUrl をUIに反映
    setLinks(j.items.map((it: any) => it.readUrl || it.publicUrl));
    setMsg(`OK: ${j.items.length}件`);
  }

  return (
    <div style={{display:"grid", gap:8}}>
      <input type="file" accept="image/*" multiple onChange={onChange}/>
      <div>{msg}</div>
      <div style={{display:"grid", gap:8}}>
        {links.map((u: string) => (
          <a key={u} href={u} target="_blank" rel="noreferrer">{u}</a>
        ))}
      </div>
    </div>
  );
}