import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { storage } from "./storage";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Wrapper functions for route compatibility with expected naming
export const getListingForUpdate = (id: string) => storage.getListingForUpdate(id);
export const getListing = (id: string) => storage.getListingById(id);
export const getLastBid = (listingId: string) => storage.getLastBid(listingId);

export const createBid = (data: { listingId: string; userId: string; amount: number }) => 
  storage.createBid(data);

export const extendListing = (listingId: string, newEndsAt: string, extensionsUsed: number) => 
  storage.extendListing(listingId, newEndsAt, extensionsUsed);

export const settleListing = (id: string, status: string, outcome: string, winnerUserId: string | null) => 
  storage.settleListing(id, status, outcome, winnerUserId);

// AutoBid functions
export const createAutoBid = (data: any) => storage.createAutoBid(data);
export const findScheduledAutoBid = (listingId: string, userId: string) => 
  storage.findScheduledAutoBid(listingId, userId);

export const findDueAutoBids = (options: { withinMs: number }) => 
  storage.findDueAutoBids(options);

export const markAutoBidExecuted = (id: string) => storage.markAutoBidExecuted(id);
export const markAutoBidExpired = (id: string) => storage.markAutoBidExpired(id);

// Cron helper functions
export const findExpiredLiveListings = () => storage.findExpiredLiveListings();