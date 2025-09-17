import React, { useEffect, useState } from 'react';

type FeeQuote = {
  buyerFee: number;
  tax: number;
  shippingEstimate?: number | null;
  total: number;
};

export function FeeHint({ amount }: { amount: number }) {
  const [quote, setQuote] = useState<FeeQuote | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchQuote() {
      try {
        const res = await fetch('/api/fees/estimate?price=' + amount);
        if (!res.ok) throw new Error('failed to fetch fee quote');
        const data: FeeQuote = await res.json();
        if (!cancelled) setQuote(data);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || 'fee error');
      }
    }
    fetchQuote();
    return () => { cancelled = true; };
  }, [amount]);

  if (err) return <span className="text-xs text-red-600">手数料取得に失敗: {err}</span>;
  if (!quote) return <span className="text-xs text-gray-500">手数料を計算中…</span>;

  const fmt = (n: number | null | undefined) =>
    typeof n === 'number' ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '-';
  return (
    <div className="text-xs text-gray-600 ml-auto flex items-center gap-3">
      <span>買手手数料: <strong>{fmt(quote.buyerFee)}</strong></span>
      <span>税: <strong>{fmt(quote.tax)}</strong></span>
      {quote.shippingEstimate != null && <span>輸送概算: <strong>{fmt(quote.shippingEstimate)}</strong></span>}
      <span>合計: <strong>{fmt(quote.total)}</strong></span>
    </div>
  );
}
