import React from 'react';

export default function HowItWorks() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 prose">
      <h1>How it Works（ご利用の流れ）</h1>
      <p>登録 → KYC（本人確認）→ 入札 → 落札 → 決済 → 引渡し/輸送 の流れを説明します。</p>
      <hr />
      <h2>目次</h2>
      <ol>
        <li>登録・アカウント作成</li>
        <li>KYC（本人確認）と入札権限</li>
        <li>入札方法（最低入札刻み、ソフトクローズ）</li>
        <li>落札後の手続き（手数料・税）</li>
        <li>引渡し・輸送（国内・海外）</li>
        <li>サポート・紛争時の流れ</li>
      </ol>
    </main>
  );
}
