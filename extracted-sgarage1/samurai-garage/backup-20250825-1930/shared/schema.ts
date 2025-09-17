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
  unique,
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

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  username: varchar("username").unique(),
  passwordHash: varchar("password_hash"), // For local auth
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  firstNameKana: varchar("first_name_kana"),
  lastNameKana: varchar("last_name_kana"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("user"), // "user" | "admin"
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerificationToken: varchar("email_verification_token"),
  pendingEmail: varchar("pending_email"), // New email waiting for verification
  emailChangeToken: varchar("email_change_token"), // Token for email change verification
  emailChangeExpires: timestamp("email_change_expires"),
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
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
  city: varchar("city"),
  reservePrice: decimal("reserve_price", { precision: 12, scale: 2 }),
  startingPrice: decimal("starting_price", { precision: 12, scale: 2 }).notNull(),
  currentPrice: decimal("current_price", { precision: 12, scale: 2 }).notNull(),
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at").notNull(),
  status: listingStatusEnum("status").notNull().default("draft"),
  endStatus: endStatusEnum("end_status"),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  winningBidderId: varchar("winning_bidder_id").references(() => users.id),
  extensionCount: integer("extension_count").notNull().default(0),
  preferredDayOfWeek: varchar("preferred_day_of_week"), // "sunday", "monday", etc.
  preferredStartTime: varchar("preferred_start_time"), // "09:00", "10:00", etc.
  auctionDuration: varchar("auction_duration"), // "3days", "7days", etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Photo storage
export const photos = pgTable("photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Document type enum
export const documentTypeEnum = pgEnum("document_type", [
  "registration_certificate", // 車検証
  "transfer_certificate",     // 譲渡証明書
  "registration_seal",        // 印鑑証明書
  "insurance_certificate",    // 自賠責保険証明書
  "maintenance_record",       // 整備記録簿
  "other"                     // その他
]);

// Document storage for legal paperwork
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  type: documentTypeEnum("type").notNull(),
  fileName: varchar("file_name").notNull(),
  url: text("url").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Bid storage
export const bids = pgTable("bids", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  bidderId: varchar("bidder_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  maxBidAmount: decimal("max_bid_amount", { precision: 12, scale: 2 }).notNull().default("0.00"), // プロキシ入札用の最大入札額
  feeAmount: decimal("fee_amount", { precision: 12, scale: 2 }), // 手数料額（入札額の5%）
  feePaymentIntentId: varchar("fee_payment_intent_id"), // Stripe PaymentIntent ID
  feePaymentStatus: varchar("fee_payment_status").default("pending"), // pending, paid, failed, refunded
  feePaidAt: timestamp("fee_paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Comments
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  isHidden: boolean("is_hidden").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Watch list
export const watchList = pgTable("watch_list", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit log
export const auditLog = pgTable("audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actorId: varchar("actor_id").references(() => users.id),
  action: varchar("action").notNull(),
  entity: varchar("entity").notNull(),
  entityId: varchar("entity_id").notNull(),
  metaJson: jsonb("meta_json"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Settings for bid increments etc
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").notNull().unique(),
  valueJson: jsonb("value_json").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Auto bid strategy enum
export const autoBidStrategyEnum = pgEnum("auto_bid_strategy", [
  "snipe",        // スナイピング入札（指定時間前に1回入札）
  "incremental"   // 段階的自動入札（他の入札者に抜かれた時に自動再入札）
]);

// Auto bid configurations
export const autoBids = pgTable("auto_bids", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: varchar("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  maxAmount: decimal("max_amount", { precision: 12, scale: 2 }).notNull(), // 最大入札額（円）
  triggerMinutes: integer("trigger_minutes").notNull(), // 終了何分前に実行するか (3-10)
  strategyType: autoBidStrategyEnum("strategy_type").notNull().default("snipe"),
  incrementAmount: decimal("increment_amount", { precision: 12, scale: 2 }), // 段階的入札の場合の増額
  isActive: boolean("is_active").notNull().default(true),
  hasExecuted: boolean("has_executed").notNull().default(false), // スナイピング入札が実行済みかどうか
  lastExecutedAt: timestamp("last_executed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueAutoBid: unique().on(table.userId, table.listingId),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  listings: many(listings, { relationName: "seller" }),
  wonListings: many(listings, { relationName: "winner" }),
  bids: many(bids),
  comments: many(comments),
  watchList: many(watchList),
  autoBids: many(autoBids),
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
  seller: one(users, {
    fields: [listings.sellerId],
    references: [users.id],
    relationName: "seller",
  }),
  winner: one(users, {
    fields: [listings.winningBidderId],
    references: [users.id],
    relationName: "winner",
  }),
  photos: many(photos),
  documents: many(documents),
  bids: many(bids),
  comments: many(comments),
  watchList: many(watchList),
  autoBids: many(autoBids),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  listing: one(listings, {
    fields: [photos.listingId],
    references: [listings.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  listing: one(listings, {
    fields: [documents.listingId],
    references: [listings.id],
  }),
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

export const commentsRelations = relations(comments, ({ one }) => ({
  listing: one(listings, {
    fields: [comments.listingId],
    references: [listings.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));

export const watchListRelations = relations(watchList, ({ one }) => ({
  listing: one(listings, {
    fields: [watchList.listingId],
    references: [listings.id],
  }),
  user: one(users, {
    fields: [watchList.userId],
    references: [users.id],
  }),
}));

export const autoBidsRelations = relations(autoBids, ({ one }) => ({
  user: one(users, {
    fields: [autoBids.userId],
    references: [users.id],
  }),
  listing: one(listings, {
    fields: [autoBids.listingId],
    references: [listings.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertListingSchema = createInsertSchema(listings).omit({
  id: true,
  slug: true,
  currentPrice: true,
  winningBidderId: true,
  extensionCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export const insertBidSchema = createInsertSchema(bids).omit({
  id: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertWatchSchema = createInsertSchema(watchList).omit({
  id: true,
  createdAt: true,
});

export const insertAutoBidSchema = createInsertSchema(autoBids).omit({
  id: true,
  hasExecuted: true,
  lastExecutedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLog).omit({
  id: true,
  createdAt: true,
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Auth schemas
export const signupSchema = z.object({
  userId: z.string().min(3, "ユーザーIDは3文字以上で入力してください").max(20, "ユーザーIDは20文字以下で入力してください").regex(/^[a-zA-Z0-9_-]+$/, "ユーザーIDは英数字、ハイフン、アンダースコアのみ使用可能です"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
  confirmPassword: z.string().min(1, "パスワード確認を入力してください"),
  lastName: z.string().min(1, "姓を入力してください"),
  firstName: z.string().min(1, "名を入力してください"),
  lastNameKana: z.string().min(1, "姓（カタカナ）を入力してください").regex(/^[ァ-ヶー\s]+$/, "カタカナで入力してください"),
  firstNameKana: z.string().min(1, "名（カタカナ）を入力してください").regex(/^[ァ-ヶー\s]+$/, "カタカナで入力してください"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "パスワードが一致しません",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = typeof photos.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertBid = z.infer<typeof insertBidSchema>;
export type Bid = typeof bids.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertWatch = z.infer<typeof insertWatchSchema>;
export type Watch = typeof watchList.$inferSelect;
export type InsertAutoBid = z.infer<typeof insertAutoBidSchema>;
export type AutoBid = typeof autoBids.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLog.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;

// Extended types for joins
export type ListingWithDetails = Listing & {
  seller: User;
  winner?: User;
  photos: Photo[];
  documents: Document[];
  bids: (Bid & { bidder: User })[];
  comments: (Comment & { author: User })[];
  _count: {
    bids: number;
    watchList: number;
  };
};

export type BidWithDetails = Bid & {
  bidder: User;
  listing: Listing;
};

// Email change schema
export const emailChangeSchema = z.object({
  newEmail: z.string().email("有効なメールアドレスを入力してください")
});
export type EmailChangeRequest = z.infer<typeof emailChangeSchema>;

// Email verification schemas
export const emailVerificationSchema = z.object({
  token: z.string().min(1, "認証トークンが必要です")
});
export type EmailVerificationRequest = z.infer<typeof emailVerificationSchema>;
