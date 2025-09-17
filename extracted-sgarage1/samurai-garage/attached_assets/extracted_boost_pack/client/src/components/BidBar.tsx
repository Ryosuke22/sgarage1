import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ReserveBadge, ReserveState } from './ReserveBadge';
import { FeeHint } from './FeeHint';
import { connectRealtime } from '@/lib/realtime';

type Props = {
  listingId: string;
  currentPrice: number;
  minIncrement: number;
  endAtISO: string; // server authoritative end time
  reserveState: ReserveState;
};

export function BidBar({ listingId, currentPrice, minIncrement, endAtISO, reserveState }: Props) {
  const [amount, setAmount] = useState(currentPrice + minIncrement);
  const [serverNow, setServerNow] = useState<number>(Date.now());
  const [endAt, setEndAt] = useState<Date>(new Date(endAtISO));
  const [price, setPrice] = useState<number>(currentPrice);
  const [placing, setPlacing] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // tick
  useEffect(() => {
    const t = setInterval(() => setServerNow((n) => n + 1000), 1000);
    return () => clearInterval(t);
  }, []);

  // realtime
  useEffect(() => {
    const ws = connectRealtime(listingId, (ev) => {
      if (ev.type === 'bid:placed') {
        setPrice(ev.price);
        setAmount(Math.max(ev.price + minIncrement, amount));
      } else if (ev.type === 'auction:extended') {
        setEndAt(new Date(ev.endAt));
      }
    });
    wsRef.current = ws;
    return () => { try { ws.close(); } catch {} };
  }, [listingId]);

  const secondsLeft = useMemo(() => {
    return Math.max(0, Math.floor((endAt.getTime() - serverNow) / 1000));
  }, [endAt, serverNow]);

  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2,'0');

  async function placeBid() {
    setPlacing(true);
    try {
      const res = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, amount }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'failed to bid');
      }
      // server will broadcast new price; local optimistic update
    } catch (e: any) {
      alert('入札に失敗: ' + (e?.message || 'unknown'));
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div role="region" aria-live="polite" className="fixed bottom-0 left-0 right-0 border-t bg-white/95 backdrop-blur p-3 z-50">
      <div className="mx-auto max-w-5xl flex flex-wrap items-center gap-3">
        <div className="font-semibold">残り {mm}:{ss}</div>
        <ReserveBadge state={reserveState} />
        <div className="ml-2">現在価格: <strong>${price.toLocaleString()}</strong></div>
        <div className="flex items-center gap-2">
          <input
            aria-label="入札金額"
            type="number"
            min={price + minIncrement}
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value, 10))}
            className="border rounded px-2 py-1 w-36"
          />
          <button
            disabled={placing || amount < price + minIncrement}
            onClick={placeBid}
            className="rounded bg-black text-white px-4 py-2 font-semibold disabled:opacity-50"
          >
            今すぐ入札
          </button>
        </div>
        <div className="flex-1" />
        <FeeHint amount={amount} />
      </div>
    </div>
  );
}
