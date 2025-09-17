import React from 'react';

export type ReserveState = 'none' | 'met' | 'not_met';

export function ReserveBadge({ state }: { state: ReserveState }) {
  const label =
    state === 'none' ? 'No Reserve' : state === 'met' ? 'Reserve達成' : 'Reserve未達';
  const title =
    state === 'none'
      ? '最低落札価格の設定なし'
      : state === 'met'
      ? '現在価格がリザーブ（最低落札）を超えました'
      : '現在価格がリザーブ未満です';
  const className =
    state === 'met'
      ? 'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-green-100 text-green-800'
      : state === 'not_met'
      ? 'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800'
      : 'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800';

  return (
    <span className={className} title={title} aria-label={title}>
      {label}
    </span>
  );
}
