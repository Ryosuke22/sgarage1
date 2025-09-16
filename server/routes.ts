// server/routes.ts
import type { Express } from "express";
import { createServer, type Server } from "http";
import { dbService } from './database';
import { z } from 'zod';
import { insertBidSchema, insertCommentSchema } from '@shared/schema';

// index.ts は await registerRoutes(app) の戻り値を server として使う想定
export async function registerRoutes(app: Express): Promise<Server> {
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

      // Validate bid data
      const bidData = insertBidSchema.parse({
        ...req.body,
        listingId: listing.id,
      });

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

  app.post("/api/listings/:slug/comments", async (req, res) => {
    try {
      const { slug } = req.params;
      const listing = await dbService.getListingBySlug(slug);
      
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      // Validate comment data
      const commentData = insertCommentSchema.parse({
        ...req.body,
        listingId: listing.id,
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

  // Node の HTTP サーバを作って返す（index.ts 側で listen する）
  const server = createServer(app);
  return server;
}
