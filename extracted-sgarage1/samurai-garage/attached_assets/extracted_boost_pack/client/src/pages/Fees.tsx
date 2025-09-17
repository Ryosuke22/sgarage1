import React from 'react';

export default function Fees() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 prose">
      <h1>Fees（手数料と費用）</h1>
      <p>買い手手数料・売り手手数料、税、輸送概算の考え方を明示します。</p>
      <hr />
      <h2>目次</h2>
      <ol>
        <li>買い手手数料（% or 固定）</li>
        <li>売り手手数料（% or 固定）</li>
        <li>税（国・地域により異なる）</li>
        <li>輸送費（提携業者の概算リンク）</li>
        <li>事例シミュレーション</li>
      </ol>
    </main>
  );
}
