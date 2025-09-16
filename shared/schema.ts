import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("user"), // "user" | "admin"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Listing status enum
export const listingStatusEnum = pgEnum("listing_status", [
  "draft",
  "submitted", 
  "approved",
  "published",
  "ended"
]);

// Category enum
export const categoryEnum = pgEnum("category", ["car", "motorcycle"]);

// Listing end status enum
export const endStatusEnum = pgEnum("end_status", ["sold", "unsold"]);

// Main listings table
export const listings = pgTable("listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  specifications: text("specifications"),
  condition: text("condition"),
  highlights: text("highlights"),
  category: categoryEnum("category").notNull(),
  make: varchar("make").notNull(),
  model: varchar("model").notNull(),
  year: integer("year").notNull(),
  mileage: integer("mileage").notNull(),
  mileageVerified: boolean("mileage_verified").notNull().default(false),
  ownershipMileage: integer("ownership_mileage"),
  hasShaken: boolean("has_shaken").notNull().default(false),
  shakenYear: varchar("shaken_year"),
  shakenMonth: varchar("shaken_month"),
  isTemporaryRegistration: boolean("is_temporary_registration").notNull().default(false),
  locationText: varchar("location_text").notNull(),
  reservePrice: decimal("reserve_price", { precision: 10, scale: 2 }),
  sellPrice: decimal("sell_price", { precision: 10, scale: 2 }),
  status: listingStatusEnum("status").notNull().default("draft"),
  endStatus: endStatusEnum("end_status"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  featuredImageUrl: varchar("featured_image_url"),
  imageUrls: text("image_urls").array(),
  sellerId: varchar("seller_id").references(() => users.id),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bids table
export const bids = pgTable("bids", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull().references(() => listings.id),
  bidderId: varchar("bidder_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Comments table  
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull().references(() => listings.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isQuestion: boolean("is_question").notNull().default(false),
  parentId: varchar("parent_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  listings: many(listings),
  bids: many(bids),
  comments: many(comments),
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
  seller: one(users, {
    fields: [listings.sellerId],
    references: [users.id],
  }),
  bids: many(bids),
  comments: many(comments),
}));

export const bidsRelations = relations(bids, ({ one }) => ({
  listing: one(listings, {
    fields: [bids.listingId],
    references: [listings.id],
  }),
  bidder: one(users, {
    fields: [bids.bidderId],
    references: [users.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  listing: one(listings, {
    fields: [comments.listingId],
    references: [listings.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  replies: many(comments),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertListingSchema = createInsertSchema(listings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  year: z.number().min(1900).max(2001), // Historical vehicles only
  mileage: z.number().min(0),
});

export const insertBidSchema = createInsertSchema(bids).omit({
  id: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = typeof users.$inferSelect;
export type InsertListing = z.infer<typeof insertListingSchema>;
export type SelectListing = typeof listings.$inferSelect;
export type InsertBid = z.infer<typeof insertBidSchema>;
export type SelectBid = typeof bids.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type SelectComment = typeof comments.$inferSelect;

// Extended types for UI components
export type ListingWithBids = SelectListing & {
  currentBid?: string | null;
  bidCount?: number;
  latestBid?: SelectBid | null;
};

export type BidWithUser = SelectBid & {
  bidder: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
};

export type CommentWithUser = SelectComment & {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
};