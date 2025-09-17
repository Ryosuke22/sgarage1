import type { Express } from "express";

// メモリベースの入札システム（後でDBに移行）
interface Bid {
  id: string;
  listingId: string;
  userId: string;
  amount: number;
  timestamp: Date;
}

interface Listing {
  id: string;
  title: string;
  currentPrice: number;
  minIncrement: number;
  endAt: Date;
  reservePrice?: number;
  reserveState: 'none' | 'met' | 'not_met';
  bids: Bid[];
}

// デモ用のメモリストレージ
const listings = new Map<string, Listing>();

// デモリスティングを初期化
listings.set("demo-1", {
  id: "demo-1",
  title: "1990 Nissan Skyline GT-R (R32)",
  currentPrice: 1000000,
  minIncrement: 25000,
  endAt: new Date(Date.now() + 15 * 60 * 1000), // 15分後
  reservePrice: 1200000,
  reserveState: 'not_met',
  bids: []
});

export function registerAuctionMemoryRoutes(app: Express, broadcast?: (event: any) => void) {
  // デモリスティング取得
  app.get("/api/listings/:id", (req, res) => {
    const { id } = req.params;
    const listing = listings.get(id);
    
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }
    
    res.json(listing);
  });
  
  // 入札API
  app.post("/api/bids", (req, res) => {
    try {
      const { listingId, amount } = req.body;
      const userId = (req as any).user?.id || "anonymous"; // 認証システムと連携
      
      const listing = listings.get(listingId);
      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }
      
      // オークション終了チェック
      if (new Date() > listing.endAt) {
        return res.status(400).json({ error: "Auction has ended" });
      }
      
      // 最小入札額チェック
      const minimumBid = listing.currentPrice + listing.minIncrement;
      if (amount < minimumBid) {
        return res.status(400).json({ 
          error: `Minimum bid is ¥${minimumBid.toLocaleString()}` 
        });
      }
      
      // 入札を作成
      const bid: Bid = {
        id: `bid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        listingId,
        userId,
        amount,
        timestamp: new Date()
      };
      
      // リスティングを更新
      listing.bids.push(bid);
      listing.currentPrice = amount;
      
      // リザーブ価格チェック
      if (listing.reservePrice) {
        listing.reserveState = amount >= listing.reservePrice ? 'met' : 'not_met';
      }
      
      // ソフトクローズ機能（終了30秒前の入札で120秒延長）
      const timeRemaining = listing.endAt.getTime() - Date.now();
      if (timeRemaining <= 30 * 1000) { // 30秒以内
        listing.endAt = new Date(Date.now() + 120 * 1000); // 120秒延長
      }
      
      // WebSocketで即座に通知
      if (broadcast) {
        broadcast({
          type: 'bid_placed',
          listingId,
          currentPrice: listing.currentPrice,
          endAt: listing.endAt.toISOString(),
          reserveState: listing.reserveState,
          bidCount: listing.bids.length
        });
      }
      
      res.json({
        success: true,
        bid,
        listing: {
          currentPrice: listing.currentPrice,
          endAt: listing.endAt,
          reserveState: listing.reserveState
        }
      });
    } catch (error) {
      console.error('Bid placement error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // 入札履歴取得
  app.get("/api/listings/:id/bids", (req, res) => {
    const { id } = req.params;
    const listing = listings.get(id);
    
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }
    
    // 入札履歴を最新順でソート
    const sortedBids = [...listing.bids].sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
    
    res.json(sortedBids);
  });
}