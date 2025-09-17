import type { Request, Response } from 'express';

type Listing = {
  id: string;
  endAt: Date;
  currentPrice: number;
  reserve: number | null;
};

// In-memory store for demo
const listings = new Map<string, Listing>();

// Seed one demo listing if none exists
function seed() {
  if (listings.size === 0) {
    const id = 'demo-1';
    listings.set(id, {
      id,
      endAt: new Date(Date.now() + 1000 * 60 * 15),
      currentPrice: 10000,
      reserve: 12000,
    });
  }
}
seed();

const EXTEND_WINDOW_SEC = 30;
const EXTEND_AMOUNT_SEC = 120;

export function registerAuctionMemoryRoutes(
  app: import('express').Express,
  broadcast: (msg: any, listingId?: string) => void
) {
  app.get('/api/listings/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    const l = listings.get(id);
    if (!l) return res.status(404).send('not found');
    return res.json({
      id: l.id,
      endAt: l.endAt.toISOString(),
      currentPrice: l.currentPrice,
      reserveState: l.reserve == null ? 'none' : (l.currentPrice >= l.reserve ? 'met' : 'not_met'),
      minIncrement: 250,
    });
  });

  app.post('/api/bids', (req: Request, res: Response) => {
    const { listingId, amount } = req.body || {};
    const l = listings.get(String(listingId));
    if (!l) return res.status(404).send('not found');
    const minInc = 250;
    const min = l.currentPrice + minInc;
    const a = Number(amount);
    if (!Number.isFinite(a) || a < min) return res.status(400).send('低すぎる入札です');
    l.currentPrice = a;

    // soft close
    const secsLeft = Math.floor((l.endAt.getTime() - Date.now()) / 1000);
    let extended = false;
    if (secsLeft <= EXTEND_WINDOW_SEC) {
      l.endAt = new Date(l.endAt.getTime() + EXTEND_AMOUNT_SEC * 1000);
      extended = true;
    }

    // broadcast
    broadcast({ type: 'bid:placed', listingId, price: l.currentPrice }, listingId);
    if (extended) {
      broadcast({ type: 'auction:extended', listingId, endAt: l.endAt.toISOString() }, listingId);
    }

    return res.json({ ok: true, currentPrice: l.currentPrice, endAt: l.endAt.toISOString(), extended });
  });
}
