import * as cron from "node-cron";
import { storage } from "./storage";
import { emailService } from "./emailService";
import { auctionBus } from "./realtime";

// 自動入札実行（終了時間前のタイミング）
export async function fireDueAutoBids() {
  try {
    await storage.executeAutoBids();
  } catch (error) {
    console.error("Error executing auto bids:", error);
  }
}

// 終了確定処理（sold/unsold判定）
export async function settleExpiredAuctions() {
  try {
    console.log("Checking for expired auctions...");
    
    const expiredAuctions = await storage.getExpiredAuctions();
    
    for (const auction of expiredAuctions) {
      console.log(`Processing expired auction: ${auction.title} (${auction.id})`);
      
      const highestBid = await storage.getHighestBidForListing(auction.id);
      const hasMetReserve = !auction.reservePrice || 
        (highestBid && parseFloat(highestBid.amount) >= parseFloat(auction.reservePrice));

      await storage.closeAuction(
        auction.id,
        hasMetReserve ? highestBid?.bidderId : undefined
      );

      // Send completion emails if auction was sold
      if (hasMetReserve && highestBid) {
        try {
          const winnerUser = await storage.getUser(highestBid.bidderId);
          const sellerUser = await storage.getUser(auction.sellerId);

          if (winnerUser?.email) {
            // Send winning notification to buyer
            await emailService.sendWinningNotification(
              winnerUser.email,
              auction,
              highestBid,
              sellerUser
            );
          }

          if (sellerUser?.email) {
            // Send auction end notification to seller
            await emailService.sendAuctionEndNotification(
              sellerUser.email,
              auction,
              highestBid,
              winnerUser?.email || 'anonymous'
            );
          }
        } catch (emailError) {
          console.error('Email notification error for completed auction:', emailError);
        }
      }

      console.log(`Auction ${auction.id} closed with status: ${hasMetReserve ? "sold" : "unsold"}`);
    }
    
    if (expiredAuctions.length === 0) {
      console.log("No expired auctions found.");
    }
  } catch (error) {
    console.error("Error in auction closing cron job:", error);
  }
}

// まとめて実行
export async function runCronTick() {
  await fireDueAutoBids();
  await settleExpiredAuctions();
}

// 1分ごとに実行
cron.schedule("* * * * *", async () => {
  try {
    await runCronTick();
  } catch (error) {
    console.error("Error in cron tick:", error);
  }
});

console.log("🤖 Demo bidding bot started");
console.log("🚀 Demo bidding bot started automatically");
