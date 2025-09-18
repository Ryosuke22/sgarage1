// client/src/hooks/useAuctionSSE.ts
import { useEffect } from "react";

export function useAuctionSSE(listingId: string, handlers: {
  onBid?: (p:any)=>void;
  onExtended?: (p:any)=>void;
}) {
  useEffect(() => {
    if (!listingId) return;
    const es = new EventSource(`/api/stream/auction/${listingId}`, { withCredentials: true } as any);
    const onBid = (e: MessageEvent) => handlers.onBid?.(JSON.parse(e.data));
    const onExt = (e: MessageEvent) => handlers.onExtended?.(JSON.parse(e.data));
    es.addEventListener("bid", onBid as any);
    es.addEventListener("extended", onExt as any);
    return () => es.close();
  }, [listingId]);
}