import React, { useState } from "react";

export default function Uploader() {
  const [msg, setMsg] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);

    setMsg("アップロード中...");
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const j = await r.json();
    setMsg(r.ok ? `OK: ${(j.publicUrl || j.readUrl || j.url)}` : `NG: ${j.message || r.statusText}`);
  }

  return (
    <div style={{display:"grid", gap:8}}>
      <input type="file" onChange={onChange} />
      <div>{msg}</div>
    </div>
  );
}