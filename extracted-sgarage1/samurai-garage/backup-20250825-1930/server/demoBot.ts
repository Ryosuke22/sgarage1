// Demo bidding bot for testing auction functionality
import { storage } from "./storage";
import { broadcastToSSE } from "./routes";

interface BotBidder {
  id: string;
  name: string;
  strategy: "aggressive" | "conservative" | "sniping";
  maxBid: number;
  bidChance: number; // 0-1 probability of bidding when opportunity arises
}

const demoBidders: BotBidder[] = [
  {
    id: "bot-collector-1",
    name: "ClassicCollector",
    strategy: "aggressive",
    maxBid: 5000000,
    bidChance: 0.8,
  },
  {
    id: "bot-enthusiast-1", 
    name: "PorscheEnthusiast",
    strategy: "conservative",
    maxBid: 4200000,
    bidChance: 0.6,
  },
  {
    id: "bot-dealer-1",
    name: "TokyoDealer",
    strategy: "sniping",
    maxBid: 3500000,
    bidChance: 0.4,
  },
];

class DemoBiddingBot {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log("🤖 Demo bidding bot started");
    
    // Check for bidding opportunities every 15-30 seconds
    this.intervalId = setInterval(() => {
      this.checkBiddingOpportunities();
    }, Math.random() * 15000 + 15000);
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log("🤖 Demo bidding bot stopped");
  }

  private async checkBiddingOpportunities() {
    try {
      // Get all published listings
      const listings = await storage.getListings({
        status: "published",
        limit: 10,
      });

      for (const listing of listings) {
        // Skip if auction has ended
        if (new Date() > new Date(listing.endAt)) continue;

        // Only bid on demo listings
        if (!listing.id.startsWith("demo-")) continue;

        await this.considerBidding(listing);
      }
    } catch (error) {
      console.error("Error in demo bot bidding check:", error);
    }
  }

  private async considerBidding(listing: any) {
    const currentPrice = parseFloat(listing.currentPrice);
    const timeLeft = new Date(listing.endAt).getTime() - Date.now();
    const hoursLeft = timeLeft / (1000 * 60 * 60);

    // Select a random bidder
    const bidder = demoBidders[Math.floor(Math.random() * demoBidders.length)];
    
    // Check if bidder should bid based on strategy and chance
    const shouldBid = this.shouldBidderPlaceBid(bidder, currentPrice, hoursLeft);
    
    if (!shouldBid) return;

    try {
      // Calculate bid amount based on strategy
      const bidAmount = this.calculateBidAmount(bidder, currentPrice, listing);
      
      if (bidAmount <= currentPrice) return;

      // Get bid increment - Yahoo Auction style
      const bidIncrementSetting = await storage.getSetting("bid_increments");
      const bidIncrements = bidIncrementSetting?.valueJson || [
        { maxPrice: 1000, increment: 10 },
        { maxPrice: 5000, increment: 100 },
        { maxPrice: 10000, increment: 250 },
        { maxPrice: 50000, increment: 500 },
        { maxPrice: 100000, increment: 1000 },
        { maxPrice: 1000000, increment: 5000 },
        { maxPrice: 5000000, increment: 10000 },
        { maxPrice: null, increment: 50000 },
      ];

      const increment = bidIncrements.find(rule => 
        rule.maxPrice === null || currentPrice < rule.maxPrice
      )?.increment || 50000;

      const minBid = currentPrice + increment;
      const finalBidAmount = Math.max(bidAmount, minBid);

      console.log(`🤖 ${bidder.name} placing bid: ¥${finalBidAmount.toLocaleString()} on ${listing.title}`);

      // Create demo bot user if it doesn't exist
      const botUserId = `demo-bot-${bidder.id}`;
      let botUser = await storage.getUser(botUserId);
      if (!botUser) {
        botUser = await storage.upsertUser({
          id: botUserId,
          email: `${bidder.id}@demobot.local`,
          firstName: bidder.name,
          lastName: "Bot",
          profileImageUrl: null,
        });
      }

      // Place the bid
      const bid = await storage.placeBid({
        listingId: listing.id,
        bidderId: botUserId,
        amount: finalBidAmount.toString(),
      });

      // Log the action
      await storage.logAction({
        actorId: botUserId,
        action: "bid_placed",
        entity: "listing",
        entityId: listing.id,
        metaJson: { amount: finalBidAmount, bidId: bid.id, botName: bidder.name },
      });

      // Broadcast to SSE clients
      broadcastToSSE(listing.id, {
        type: "bid",
        data: {
          amount: finalBidAmount,
          bidder: bidder.name,
          timestamp: bid.createdAt,
        },
      });

    } catch (error) {
      console.error(`Error placing bot bid for ${bidder.name}:`, error);
    }
  }

  private shouldBidderPlaceBid(bidder: BotBidder, currentPrice: number, hoursLeft: number): boolean {
    // Random chance check
    if (Math.random() > bidder.bidChance) return false;

    // Don't bid if over max budget
    if (currentPrice >= bidder.maxBid) return false;

    // Strategy-based bidding timing
    switch (bidder.strategy) {
      case "aggressive":
        // Bid often throughout the auction
        return Math.random() < 0.3;
        
      case "conservative":
        // Bid more as price approaches reserve or in last few hours
        return hoursLeft < 12 && Math.random() < 0.4;
        
      case "sniping":
        // Only bid in the last hour
        return hoursLeft < 1 && Math.random() < 0.7;
        
      default:
        return false;
    }
  }

  private calculateBidAmount(bidder: BotBidder, currentPrice: number, listing: any): number {
    const maxBid = Math.min(bidder.maxBid, parseFloat(listing.reservePrice || bidder.maxBid));
    
    switch (bidder.strategy) {
      case "aggressive":
        // Bid 5-15% above current price
        const aggressiveIncrease = currentPrice * (0.05 + Math.random() * 0.10);
        return Math.floor(currentPrice + aggressiveIncrease);
        
      case "conservative":
        // Bid 2-8% above current price
        const conservativeIncrease = currentPrice * (0.02 + Math.random() * 0.06);
        return Math.floor(currentPrice + conservativeIncrease);
        
      case "sniping":
        // Bid close to max budget when sniping
        const snipeAmount = maxBid * (0.8 + Math.random() * 0.2);
        return Math.floor(Math.min(snipeAmount, maxBid));
        
      default:
        return currentPrice;
    }
  }
}

export const demoBiddingBot = new DemoBiddingBot();