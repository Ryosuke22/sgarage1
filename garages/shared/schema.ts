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