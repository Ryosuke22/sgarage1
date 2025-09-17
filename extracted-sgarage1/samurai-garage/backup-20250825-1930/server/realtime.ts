// server/realtime.ts
import { EventEmitter } from "events";
export const auctionBus = new EventEmitter();
auctionBus.setMaxListeners(0);

// 共有イベント名：
//  - "bid:created"    payload: { listingId, bid:{id,amount,userId}, endsAt }
//  - "listing:extended" payload: { listingId, endsAt }