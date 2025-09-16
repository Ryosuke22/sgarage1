// server/routes.ts - Updated to use blueprint:javascript_auth_all_persistance
import type { Express } from "express";
import { createServer, type Server } from "http";
import { dbService } from './database';
import { setupAuth } from './auth';
import { z } from 'zod';
import { insertBidSchema, insertCommentSchema } from '@shared/schema';

// Authentication middleware helper
function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'ログインが必要です' });
  }
  next();
}

// Admin role middleware helper
function requireAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'ログインが必要です' });
  }
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: '管理者権限が必要です' });
  }
  next();
}

// index.ts は await registerRoutes(app) の戻り値を server として使う想定
export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication system (includes /api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // Initialize sample data on server start
  await dbService.initializeSampleData();

  // Health check route
  app.get("/health", (_req, res) => {
    res.json({ ok: true, ts: Date.now() });
  });

  // Root route
  app.get("/", (_req, res) => {
    res.send("Samurai Garage server is running");
  });

  // API Routes for listings
  app.get("/api/listings", async (req, res) => {
    try {
      const { category, status, limit = '20', offset = '0' } = req.query;
      
      const filters: any = {};
      if (category) filters.category = category;
      if (status) filters.status = status;
      if (limit) filters.limit = parseInt(limit as string);
      if (offset) filters.offset = parseInt(offset as string);

      const listings = await dbService.getListings(filters);
      res.json(listings);
    } catch (error) {
      console.error('Error fetching listings:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get("/api/listings/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const listing = await dbService.getListingBySlug(slug);
      
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      res.json(listing);
    } catch (error) {
      console.error('Error fetching listing:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // API Routes for bids
  app.get("/api/listings/:slug/bids", async (req, res) => {
    try {
      const { slug } = req.params;
      const listing = await dbService.getListingBySlug(slug);
      
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      const bids = await dbService.getBidsForListing(listing.id);
      res.json(bids);
    } catch (error) {
      console.error('Error fetching bids:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post("/api/listings/:slug/bids", async (req, res) => {
    try {
      const { slug } = req.params;
      const listing = await dbService.getListingBySlug(slug);
      
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      // Require authentication for bidding
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          message: '入札するにはログインが必要です',
          code: 'AUTHENTICATION_REQUIRED'
        });
      }

      // Validate bid data using authenticated user
      const { bidderId, ...clientBidData } = req.body; // Remove any client-supplied bidderId
      const bidData = insertBidSchema.parse({
        ...clientBidData,
        listingId: listing.id,
        bidderId: req.user!.id, // Use authenticated user ID (guaranteed by requireAuth)
      });

      // CRITICAL SERVER-SIDE BUSINESS RULE VALIDATION
      const currentTime = new Date();
      const bidAmount = parseFloat(bidData.amount);

      // 1. Auction Status Check: Reject bids if auction has ended
      if (listing.endDate && new Date(listing.endDate) <= currentTime) {
        return res.status(400).json({
          message: 'このオークションは既に終了しています',
          code: 'AUCTION_ENDED'
        });
      }

      // 2. Check if listing is in published status
      if (listing.status !== 'published') {
        return res.status(400).json({
          message: 'このオークションはまだ開始されていません',
          code: 'AUCTION_NOT_STARTED'
        });
      }

      // 3. Get current highest bid to validate minimum bid amount
      const currentBidPrice = listing.currentBid ? parseFloat(listing.currentBid) : parseFloat(listing.reservePrice || '0');
      const minimumBidAmount = currentBidPrice + 10000;

      // 4. Minimum Bid Enforcement: Reject bids if amount < currentBid + 10,000 yen
      if (bidAmount < minimumBidAmount) {
        return res.status(400).json({
          message: `入札額は現在価格より10,000円以上高い金額にしてください（最低入札額: ¥${minimumBidAmount.toLocaleString()}）`,
          code: 'BID_TOO_LOW',
          minimumAmount: minimumBidAmount
        });
      }

      // 5. Exact Increment Validation: Reject bids if not in exact 10,000 yen increments
      const basePrice = parseFloat(listing.reservePrice || '0');
      const incrementFromBase = bidAmount - basePrice;
      if (incrementFromBase % 10000 !== 0) {
        return res.status(400).json({
          message: '入札額は10,000円単位で入力してください',
          code: 'INVALID_INCREMENT'
        });
      }

      // 6. Validate bid amount is positive and reasonable
      if (bidAmount <= 0) {
        return res.status(400).json({
          message: '入札額は正の数値である必要があります',
          code: 'INVALID_AMOUNT'
        });
      }

      // Maximum reasonable bid check (optional safety measure)
      if (bidAmount > 999999999) {
        return res.status(400).json({
          message: '入札額が上限を超えています',
          code: 'AMOUNT_TOO_HIGH'
        });
      }

      // All validations passed - create the bid
      const bid = await dbService.createBid(bidData);
      res.status(201).json(bid);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid bid data', errors: error.errors });
      }
      console.error('Error creating bid:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // API Routes for comments
  app.get("/api/listings/:slug/comments", async (req, res) => {
    try {
      const { slug } = req.params;
      const listing = await dbService.getListingBySlug(slug);
      
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      const comments = await dbService.getCommentsForListing(listing.id);
      res.json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post("/api/listings/:slug/comments", requireAuth, async (req, res) => {
    try {
      const { slug } = req.params;
      const listing = await dbService.getListingBySlug(slug);
      
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      // Validate comment data using authenticated user
      const commentData = insertCommentSchema.parse({
        ...req.body,
        listingId: listing.id,
        userId: req.user!.id, // Use authenticated user ID (guaranteed by requireAuth)
      });

      const comment = await dbService.createComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid comment data', errors: error.errors });
      }
      console.error('Error creating comment:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await dbService.getUserById(id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Remove sensitive information
      const { email, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Admin API Routes - Protected by admin role
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await dbService.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const { role, limit = '50', offset = '0' } = req.query;
      
      const filters: any = {};
      if (role) filters.role = role as 'user' | 'admin';
      if (limit) filters.limit = parseInt(limit as string);
      if (offset) filters.offset = parseInt(offset as string);

      const users = await dbService.getAllUsers(filters);
      res.json(users);
    } catch (error) {
      console.error('Error fetching users for admin:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch("/api/admin/users/:id/role", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role || !['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: '無効な役割が指定されました' });
      }

      const updatedUser = await dbService.updateUserRole(id, role);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'ユーザーが見つかりません' });
      }

      // Remove password from response
      const { password: _, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get("/api/admin/listings", requireAdmin, async (req, res) => {
    try {
      const { status, category, limit = '50', offset = '0' } = req.query;
      
      const filters: any = {};
      if (status) filters.status = status;
      if (category) filters.category = category;
      if (limit) filters.limit = parseInt(limit as string);
      if (offset) filters.offset = parseInt(offset as string);

      const listings = await dbService.getListingsForAdmin(filters);
      res.json(listings);
    } catch (error) {
      console.error('Error fetching listings for admin:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch("/api/admin/listings/:id/status", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      if (!status || !['draft', 'submitted', 'approved', 'published', 'ended'].includes(status)) {
        return res.status(400).json({ message: '無効なステータスが指定されました' });
      }

      const updatedListing = await dbService.updateListingStatus(id, status, adminNotes);
      
      if (!updatedListing) {
        return res.status(404).json({ message: '出品が見つかりません' });
      }

      res.json(updatedListing);
    } catch (error) {
      console.error('Error updating listing status:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Node の HTTP サーバを作って返す（index.ts 側で listen する）
  const server = createServer(app);
  return server;
}
