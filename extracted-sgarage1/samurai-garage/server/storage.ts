import {
  users,
  listings,
  photos,
  documents,
  bids,
  comments,
  watchList,
  autoBids,
  auditLog,
  settings,
  userSettings,
  type User,
  type UpsertUser,
  type Listing,
  type ListingWithDetails,
  type InsertListing,
  type InsertPhoto,
  type Photo,
  type InsertDocument,
  type Document,
  type InsertBid,
  type Bid,
  type BidWithDetails,
  type InsertComment,
  type Comment,
  type InsertWatch,
  type Watch,
  type InsertAutoBid,
  type AutoBid,
  type InsertAuditLog,
  type AuditLog,
  type InsertSetting,
  type Setting,
  type InsertUserSettings,
  type UserSettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, or, count, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: Partial<User>): Promise<User>;
  updateUser(userId: string, userData: Partial<User>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserEmail(userId: string, email: string): Promise<User>;
  requestEmailChange(userId: string, newEmail: string, token: string): Promise<User>;
  verifyEmailChange(token: string): Promise<User | null>;
  getUserByEmailChangeToken(token: string): Promise<User | undefined>;

  // Listing operations
  getListings(filters?: {
    status?: string;
    category?: string;
    sortBy?: "endingSoon" | "newest" | "highestPrice";
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<ListingWithDetails[]>;
  getListingBySlug(slug: string): Promise<ListingWithDetails | undefined>;
  getListingById(id: string): Promise<ListingWithDetails | undefined>;
  createListing(listing: InsertListing, sellerId: string): Promise<Listing>;
  updateListing(id: string, updates: Partial<InsertListing>): Promise<Listing>;
  updateListingStatus(id: string, status: string, adminId?: string): Promise<void>;
  updateListingSchedule(id: string, startAt: Date, endAt: Date): Promise<ListingWithDetails>;

  // Photo operations
  addPhotos(photos: InsertPhoto[]): Promise<Photo[]>;
  getPhotosByListingId(listingId: string): Promise<Photo[]>;
  deletePhoto(id: string): Promise<void>;

  // Document operations
  addDocuments(documents: InsertDocument[]): Promise<Document[]>;
  getDocumentsByListingId(listingId: string): Promise<Document[]>;
  deleteDocument(id: string): Promise<void>;

  // Bid operations
  placeBid(bid: InsertBid): Promise<Bid>;
  getBidsByListingId(listingId: string): Promise<BidWithDetails[]>;
  getHighestBidForListing(listingId: string): Promise<BidWithDetails | undefined>;

  // Comment operations
  addComment(comment: InsertComment): Promise<Comment>;
  getCommentsByListingId(listingId: string): Promise<(Comment & { author: User })[]>;
  hideComment(commentId: string, adminId: string): Promise<void>;

  // Watch operations
  addToWatchList(watch: InsertWatch): Promise<Watch>;
  removeFromWatchList(listingId: string, userId: string): Promise<void>;
  getWatchListByUserId(userId: string): Promise<(Watch & { listing: ListingWithDetails })[]>;
  isWatching(listingId: string, userId: string): Promise<boolean>;

  // Auto bid operations
  createAutoBid(autoBid: InsertAutoBid): Promise<AutoBid>;
  getAutoBidByUserAndListing(userId: string, listingId: string): Promise<AutoBid | undefined>;
  updateAutoBid(id: string, userId: string, updates: Partial<InsertAutoBid>): Promise<AutoBid | undefined>;
  deleteAutoBid(id: string, userId: string): Promise<boolean>;
  getActiveAutoBids(listingId: string): Promise<AutoBid[]>;
  executeAutoBids(): Promise<void>;
  
  // Additional functions for route compatibility
  findScheduledAutoBid(listingId: string, userId: string): Promise<AutoBid | undefined>;
  findDueAutoBids(options: { withinMs: number }): Promise<AutoBid[]>;
  markAutoBidExecuted(id: string): Promise<void>;
  markAutoBidExpired(id: string): Promise<void>;
  getListingForUpdate(id: string): Promise<ListingWithDetails | undefined>;
  getLastBid(listingId: string): Promise<BidWithDetails | undefined>;
  createBid(data: { listingId: string; userId: string; amount: number }): Promise<Bid>;
  extendListing(listingId: string, newEndsAt: string, extensionsUsed: number): Promise<void>;
  settleListing(id: string, status: string, outcome: string, winnerUserId: string | null): Promise<void>;
  findExpiredLiveListings(): Promise<ListingWithDetails[]>;

  // Audit operations
  logAction(log: InsertAuditLog): Promise<void>;
  getAuditLogs(filters?: { entity?: string; entityId?: string; limit?: number }): Promise<AuditLog[]>;

  // Settings operations
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(key: string, value: any): Promise<void>;

  // User settings operations
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  updateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings>;
  upsertUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings>;

  // Admin operations
  getListingsForAdmin(status?: string): Promise<ListingWithDetails[]>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<void>;
  getAdminDashboard(): Promise<{
    activeAuctions: number;
    pendingApproval: number;
    totalUsers: number;
    totalBids: number;
  }>;
  getDashboardStats(): Promise<{
    activeAuctions: number;
    pendingApproval: number;
    monthlySales: string;
    conversionRate: string;
  }>;

  // Auction closing operations
  getExpiredAuctions(): Promise<ListingWithDetails[]>;
  closeAuction(listingId: string, winningBidderId?: string): Promise<void>;
  getBidderProfile(userId: string): Promise<any>;
  extendAuction(listingId: string, extensionMinutes: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData as any)
      .returning();
    return user;
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      // Try insert first
      const [user] = await db
        .insert(users)
        .values(userData)
        .returning();
      return user;
    } catch (error: any) {
      // If email already exists, update by email
      if (error?.code === '23505') {
        const [user] = await db
          .update(users)
          .set({
            ...userData,
            updatedAt: new Date(),
          })
          .where(eq(users.email, userData.email))
          .returning();
        return user;
      }
      throw error;
    }
  }

  async updateUserEmail(userId: string, email: string): Promise<User> {
    const [result] = await db
      .update(users)
      .set({ 
        email, 
        emailVerified: true,
        pendingEmail: null,
        emailChangeToken: null,
        emailChangeExpires: null,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();

    return result;
  }

  async requestEmailChange(userId: string, newEmail: string, token: string): Promise<User> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24時間後に有効期限

    const [result] = await db
      .update(users)
      .set({ 
        pendingEmail: newEmail,
        emailChangeToken: token,
        emailChangeExpires: expiresAt,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();

    return result;
  }

  async verifyEmailChange(token: string): Promise<User | null> {
    // トークンでユーザーを検索し、有効期限をチェック
    const user = await this.getUserByEmailChangeToken(token);
    if (!user || !user.pendingEmail || !user.emailChangeExpires) {
      return null;
    }

    // 有効期限チェック
    if (new Date() > user.emailChangeExpires) {
      // 期限切れのトークンをクリア
      await db
        .update(users)
        .set({
          pendingEmail: null,
          emailChangeToken: null,
          emailChangeExpires: null,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));
      return null;
    }

    // メールアドレス更新
    return await this.updateUserEmail(user.id, user.pendingEmail);
  }

  async getUserByEmailChangeToken(token: string): Promise<User | undefined> {
    const [result] = await db
      .select()
      .from(users)
      .where(eq(users.emailChangeToken, token));
    
    return result;
  }

  // Listing operations
  async getListings(filters: {
    status?: string;
    category?: string;
    sortBy?: "endingSoon" | "newest" | "highestPrice";
    limit?: number;
    offset?: number;
    search?: string;
  } = {}): Promise<ListingWithDetails[]> {
    const {
      status = "published",
      category,
      sortBy = "endingSoon",
      limit = 20,
      offset = 0,
      search,
    } = filters;

    let orderBy;
    switch (sortBy) {
      case "newest":
        orderBy = desc(listings.createdAt);
        break;
      case "highestPrice":
        orderBy = desc(listings.currentPrice);
        break;
      case "endingSoon":
      default:
        orderBy = asc(listings.endAt);
        break;
    }

    const whereConditions = [eq(listings.status, status as any)];
    if (category) {
      whereConditions.push(eq(listings.category, category as any));
    }
    
    // Add search functionality
    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      whereConditions.push(
        or(
          sql`${listings.make} ILIKE ${`%${searchTerm}%`}`,
          sql`${listings.model} ILIKE ${`%${searchTerm}%`}`,
          sql`${listings.title} ILIKE ${`%${searchTerm}%`}`
        )!
      );
    }

    const result = await db
      .select({
        listing: listings,
        seller: users,
        photosCount: count(photos.id),
        bidsCount: count(bids.id),
        watchCount: count(watchList.id),
      })
      .from(listings)
      .leftJoin(users, eq(listings.sellerId, users.id))
      .leftJoin(photos, eq(listings.id, photos.listingId))
      .leftJoin(bids, eq(listings.id, bids.listingId))
      .leftJoin(watchList, eq(listings.id, watchList.listingId))
      .where(and(...whereConditions))
      .groupBy(listings.id, users.id)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Get detailed data for each listing
    const detailedListings = await Promise.all(
      result.map(async (row) => {
        const [photos, bids, comments] = await Promise.all([
          this.getPhotosByListingId(row.listing.id),
          this.getBidsByListingId(row.listing.id),
          this.getCommentsByListingId(row.listing.id),
        ]);

        return {
          ...row.listing,
          seller: row.seller!,
          winner: undefined,
          photos,
          documents: [],
          bids,
          comments,
          _count: {
            bids: row.bidsCount,
            watchList: row.watchCount,
          },
        } as ListingWithDetails;
      })
    );

    return detailedListings;
  }

  async getListingBySlug(slug: string): Promise<ListingWithDetails | undefined> {
    const [result] = await db
      .select()
      .from(listings)
      .leftJoin(users, eq(listings.sellerId, users.id))
      .where(eq(listings.slug, slug));

    if (!result) return undefined;

    const [photos, bidsWithDetails, comments, watchCount] = await Promise.all([
      this.getPhotosByListingId(result.listings.id),
      this.getBidsByListingId(result.listings.id),
      this.getCommentsByListingId(result.listings.id),
      db
        .select({ count: count(watchList.id) })
        .from(watchList)
        .where(eq(watchList.listingId, result.listings.id))
        .then((res) => res[0]?.count || 0),
    ]);

    return {
      ...result.listings,
      seller: result.users!,
      photos,
      documents: [],
      bids: bidsWithDetails,
      comments,
      _count: {
        bids: bidsWithDetails.length,
        watchList: watchCount,
      },
    } as ListingWithDetails;
  }

  async getListingById(id: string): Promise<ListingWithDetails | undefined> {
    const [result] = await db
      .select()
      .from(listings)
      .leftJoin(users, eq(listings.sellerId, users.id))
      .where(eq(listings.id, id));

    if (!result) return undefined;

    const [photos, bidsWithDetails, comments, watchCount] = await Promise.all([
      this.getPhotosByListingId(result.listings.id),
      this.getBidsByListingId(result.listings.id),
      this.getCommentsByListingId(result.listings.id),
      db
        .select({ count: count(watchList.id) })
        .from(watchList)
        .where(eq(watchList.listingId, result.listings.id))
        .then((res) => res[0]?.count || 0),
    ]);

    return {
      ...result.listings,
      seller: result.users!,
      photos,
      documents: [],
      bids: bidsWithDetails,
      comments,
      _count: {
        bids: bidsWithDetails.length,
        watchList: watchCount,
      },
    } as ListingWithDetails;
  }

  async createListing(listing: InsertListing, sellerId: string): Promise<Listing> {
    // Generate slug from title
    const slug = listing.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .substring(0, 50)
      + "-" + Date.now();

    const [created] = await db
      .insert(listings)
      .values({
        ...listing,
        slug,
        currentPrice: listing.startingPrice,
        sellerId: listing.sellerId || sellerId, // Use sellerId from listing if available, otherwise use parameter
      })
      .returning();

    return created;
  }

  async updateListing(id: string, updates: Partial<InsertListing>): Promise<Listing> {
    const [updated] = await db
      .update(listings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(listings.id, id))
      .returning();

    return updated;
  }

  async updateListingStatus(id: string, status: string, adminId?: string): Promise<void> {
    await db
      .update(listings)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(listings.id, id));

    if (adminId) {
      await this.logAction({
        actorId: adminId,
        action: `listing_${status}`,
        entity: "listing",
        entityId: id,
        metaJson: { status },
      });
    }
  }

  async updateListingSchedule(id: string, startAt: Date, endAt: Date): Promise<ListingWithDetails> {
    const [updated] = await db
      .update(listings)
      .set({ startAt, endAt, updatedAt: new Date() })
      .where(eq(listings.id, id))
      .returning();

    if (!updated) {
      throw new Error("Listing not found");
    }

    // Return the full listing with details
    const fullListing = await this.getListingById(id);
    if (!fullListing) {
      throw new Error("Failed to fetch updated listing");
    }

    return fullListing;
  }

  // Photo operations
  async createPhoto(photo: InsertPhoto): Promise<Photo> {
    const [created] = await db.insert(photos).values(photo).returning();
    return created;
  }

  async addPhotos(photosData: InsertPhoto[]): Promise<Photo[]> {
    if (photosData.length === 0) return [];
    const result = await db.insert(photos).values(photosData).returning();
    return result;
  }

  async getPhotosByListingId(listingId: string): Promise<Photo[]> {
    return await db
      .select()
      .from(photos)
      .where(eq(photos.listingId, listingId))
      .orderBy(asc(photos.sortOrder));
  }

  async deletePhoto(id: string): Promise<void> {
    await db.delete(photos).where(eq(photos.id, id));
  }

  // Document operations
  async addDocuments(documentsData: InsertDocument[]): Promise<Document[]> {
    if (documentsData.length === 0) return [];
    const result = await db.insert(documents).values(documentsData).returning();
    return result;
  }

  async getDocumentsByListingId(listingId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.listingId, listingId))
      .orderBy(desc(documents.uploadedAt));
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Bid operations
  async placeBid(bid: InsertBid & { maxBidAmount: string }): Promise<Bid> {
    // プロキシ入札システム: ユーザーの最大入札額を保存し、競争に基づいて実際の価格を設定
    
    // 現在の最高入札を取得
    const currentHighestBid = await this.getHighestBidForListing(bid.listingId);
    
    // ヤフオクスタイルの入札増額ルールを取得
    const bidIncrementSetting = await this.getSetting("bid_increments");
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

    // 新しい入札額を計算（プロキシシステム）
    let actualBidAmount = parseFloat(bid.amount);
    const maxBidAmount = parseFloat(bid.maxBidAmount);
    
    if (currentHighestBid) {
      const currentPrice = parseFloat(currentHighestBid.amount);
      const currentMaxBid = parseFloat(currentHighestBid.maxBidAmount || currentHighestBid.amount);
      
      // 現在の最高入札者の最大額と比較
      if (maxBidAmount <= currentMaxBid) {
        // 新しい入札者が負ける場合、増額だけ上乗せ
        const increment = (bidIncrements as any[]).find((rule: any) => 
          rule.maxPrice === null || maxBidAmount < rule.maxPrice
        )?.increment || 50000;
        actualBidAmount = Math.min(maxBidAmount, currentPrice + increment);
      } else {
        // 新しい入札者が勝つ場合、前の最高入札の最大額+増額
        const increment = (bidIncrements as any[]).find((rule: any) => 
          rule.maxPrice === null || currentMaxBid < rule.maxPrice
        )?.increment || 50000;
        actualBidAmount = Math.min(maxBidAmount, currentMaxBid + increment);
      }
    } else {
      // 最初の入札の場合、開始価格またはユーザーの入札額の小さい方
      const listing = await this.getListingById(bid.listingId);
      if (listing) {
        const startingPrice = parseFloat(listing.startingPrice);
        actualBidAmount = Math.max(startingPrice, actualBidAmount);
      }
    }

    // 入札を作成（実際の表示額と最大入札額の両方を保存）
    const [created] = await db.insert(bids).values({
      ...bid,
      amount: actualBidAmount.toString(),
      maxBidAmount: bid.maxBidAmount,
    }).returning();

    // 出品の現在価格を更新
    await db
      .update(listings)
      .set({ 
        currentPrice: actualBidAmount.toString(),
        updatedAt: new Date() 
      })
      .where(eq(listings.id, bid.listingId));

    return created;
  }

  async getBidsByListingId(listingId: string): Promise<BidWithDetails[]> {
    const result = await db
      .select({
        bid: bids,
        bidder: users,
      })
      .from(bids)
      .leftJoin(users, eq(bids.bidderId, users.id))
      .where(eq(bids.listingId, listingId))
      .orderBy(desc(bids.createdAt));

    return result.map((row) => ({
      ...row.bid,
      bidder: row.bidder!,
      listing: { id: listingId } as Listing,
    })) as BidWithDetails[];
  }

  async getHighestBidForListing(listingId: string): Promise<BidWithDetails | undefined> {
    const [result] = await db
      .select({
        bid: bids,
        bidder: users,
      })
      .from(bids)
      .leftJoin(users, eq(bids.bidderId, users.id))
      .where(eq(bids.listingId, listingId))
      .orderBy(desc(bids.amount))
      .limit(1);

    if (!result) return undefined;

    return {
      ...result.bid,
      bidder: result.bidder!,
      listing: { id: listingId } as Listing,
    } as BidWithDetails;
  }

  // Comment operations
  async addComment(comment: InsertComment): Promise<Comment> {
    const [created] = await db.insert(comments).values(comment).returning();
    return created;
  }

  async getCommentsByListingId(listingId: string): Promise<(Comment & { author: User })[]> {
    const result = await db
      .select({
        comment: comments,
        author: users,
      })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(and(eq(comments.listingId, listingId), eq(comments.isHidden, false)))
      .orderBy(desc(comments.createdAt));

    return result.map((row) => ({
      ...row.comment,
      author: row.author!,
    }));
  }

  async hideComment(commentId: string, adminId: string): Promise<void> {
    await db
      .update(comments)
      .set({ isHidden: true })
      .where(eq(comments.id, commentId));

    await this.logAction({
      actorId: adminId,
      action: "comment_hidden",
      entity: "comment",
      entityId: commentId,
    });
  }

  // Watch operations
  async addToWatchList(watch: InsertWatch): Promise<Watch> {
    const [created] = await db.insert(watchList).values(watch).returning();
    return created;
  }

  async removeFromWatchList(listingId: string, userId: string): Promise<void> {
    await db
      .delete(watchList)
      .where(and(eq(watchList.listingId, listingId), eq(watchList.userId, userId)));
  }

  async getWatchListByUserId(userId: string): Promise<(Watch & { listing: ListingWithDetails })[]> {
    const result = await db
      .select({
        watch: watchList,
        listing: listings,
        seller: users,
      })
      .from(watchList)
      .leftJoin(listings, eq(watchList.listingId, listings.id))
      .leftJoin(users, eq(listings.sellerId, users.id))
      .where(eq(watchList.userId, userId))
      .orderBy(desc(watchList.createdAt));

    return await Promise.all(
      result.map(async (row) => {
        const [photos, bids, comments] = await Promise.all([
          this.getPhotosByListingId(row.listing!.id),
          this.getBidsByListingId(row.listing!.id),
          this.getCommentsByListingId(row.listing!.id),
        ]);

        return {
          ...row.watch,
          listing: {
            ...row.listing!,
            seller: row.seller!,
            photos,
            documents: [],
            bids,
            comments,
            _count: {
              bids: bids.length,
              watchList: 1,
            },
          } as ListingWithDetails,
        };
      })
    );
  }

  async isWatching(listingId: string, userId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(watchList)
      .where(and(eq(watchList.listingId, listingId), eq(watchList.userId, userId)))
      .limit(1);

    return !!result;
  }

  // Audit operations
  async logAction(log: InsertAuditLog): Promise<void> {
    await db.insert(auditLog).values(log);
  }

  async getAuditLogs(filters: { entity?: string; entityId?: string; limit?: number } = {}): Promise<AuditLog[]> {
    const { entity, entityId, limit = 100 } = filters;
    
    const whereConditions = [];
    if (entity) whereConditions.push(eq(auditLog.entity, entity));
    if (entityId) whereConditions.push(eq(auditLog.entityId, entityId));

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    return await db
      .select()
      .from(auditLog)
      .where(whereClause)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit);
  }

  // Settings operations
  async getSetting(key: string): Promise<Setting | undefined> {
    const [result] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key));
    return result;
  }

  async setSetting(key: string, value: any): Promise<void> {
    await db
      .insert(settings)
      .values({ key, valueJson: value })
      .onConflictDoUpdate({
        target: settings.key,
        set: { valueJson: value, updatedAt: new Date() },
      });
  }

  // Admin operations
  async getListingsForAdmin(status?: string): Promise<ListingWithDetails[]> {
    const whereConditions = [];
    if (status) {
      whereConditions.push(eq(listings.status, status as any));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const result = await db
      .select()
      .from(listings)
      .leftJoin(users, eq(listings.sellerId, users.id))
      .where(whereClause)
      .orderBy(desc(listings.createdAt));

    return await Promise.all(
      result.map(async (row) => {
        const [photos, bids, comments] = await Promise.all([
          this.getPhotosByListingId(row.listings.id),
          this.getBidsByListingId(row.listings.id),
          this.getCommentsByListingId(row.listings.id),
        ]);

        return {
          ...row.listings,
          seller: row.users!,
          photos,
          documents: [],
          bids,
          comments,
          _count: {
            bids: bids.length,
            watchList: 0,
          },
        } as ListingWithDetails;
      })
    );
  }

  async getAllUsers(): Promise<User[]> {
    const result = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
    return result;
  }

  async updateUserRole(userId: string, role: string): Promise<void> {
    await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async getDashboardStats(): Promise<{
    activeAuctions: number;
    pendingApproval: number;
    monthlySales: string;
    conversionRate: string;
  }> {
    const [activeAuctions, pendingApproval, soldThisMonth] = await Promise.all([
      db
        .select({ count: count(listings.id) })
        .from(listings)
        .where(eq(listings.status, "published"))
        .then((res) => res[0]?.count || 0),
      
      db
        .select({ count: count(listings.id) })
        .from(listings)
        .where(eq(listings.status, "submitted"))
        .then((res) => res[0]?.count || 0),
      
      db
        .select({
          totalSales: sql<string>`sum(${listings.currentPrice})`,
          soldCount: count(listings.id)
        })
        .from(listings)
        .where(
          and(
            eq(listings.endStatus, "sold"),
            sql`${listings.updatedAt} >= date_trunc('month', current_date)`
          )
        )
        .then((res) => res[0]),
    ]);

    const totalListingsThisMonth = await db
      .select({ count: count(listings.id) })
      .from(listings)
      .where(
        and(
          eq(listings.status, "ended"),
          sql`${listings.updatedAt} >= date_trunc('month', current_date)`
        )
      )
      .then((res) => res[0]?.count || 0);

    const conversionRate = totalListingsThisMonth > 0 
      ? ((soldThisMonth?.soldCount || 0) / totalListingsThisMonth * 100).toFixed(0)
      : "0";

    return {
      activeAuctions,
      pendingApproval,
      monthlySales: `¥${(Number(soldThisMonth?.totalSales || 0) / 1000000).toFixed(0)}M`,
      conversionRate: `${conversionRate}%`,
    };
  }

  // Auction closing operations
  async getExpiredAuctions(): Promise<ListingWithDetails[]> {
    const result = await db
      .select()
      .from(listings)
      .leftJoin(users, eq(listings.sellerId, users.id))
      .where(
        and(
          eq(listings.status, "published"),
          sql`${listings.endAt} < now()`
        )
      );

    return await Promise.all(
      result.map(async (row) => {
        const [photos, bids, comments] = await Promise.all([
          this.getPhotosByListingId(row.listings.id),
          this.getBidsByListingId(row.listings.id),
          this.getCommentsByListingId(row.listings.id),
        ]);

        return {
          ...row.listings,
          seller: row.users!,
          photos,
          documents: [],
          bids,
          comments,
          _count: {
            bids: bids.length,
            watchList: 0,
          },
        } as ListingWithDetails;
      })
    );
  }

  async closeAuction(listingId: string, winningBidderId?: string): Promise<void> {
    const endStatus = winningBidderId ? "sold" : "unsold";
    
    await db
      .update(listings)
      .set({
        status: "ended",
        endStatus,
        winningBidderId,
        updatedAt: new Date(),
      })
      .where(eq(listings.id, listingId));

    await this.logAction({
      action: `auction_closed_${endStatus}`,
      entity: "listing",
      entityId: listingId,
      metaJson: { winningBidderId },
    });
  }

  async extendAuction(listingId: string, extensionMinutes: number): Promise<void> {
    await db
      .update(listings)
      .set({
        endAt: sql`${listings.endAt} + interval '${extensionMinutes} minutes'`,
        extensionCount: sql`${listings.extensionCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(listings.id, listingId));

    await this.logAction({
      action: "auction_extended",
      entity: "listing",
      entityId: listingId,
      metaJson: { extensionMinutes },
    });
  }

  async getBidderProfile(userId: string): Promise<any> {
    // Get user basic info
    const user = await this.getUser(userId);
    if (!user) {
      return null;
    }

    // Get total counts
    const totalBidsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(bids)
      .where(eq(bids.bidderId, userId));

    const totalCommentsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(comments)
      .where(eq(comments.authorId, userId));

    // Get recent bids (last 10)
    const recentBids = await db
      .select({
        bid: bids,
        listing: {
          id: listings.id,
          title: listings.title,
          slug: listings.slug,
          status: listings.status,
        },
      })
      .from(bids)
      .innerJoin(listings, eq(bids.listingId, listings.id))
      .where(eq(bids.bidderId, userId))
      .orderBy(desc(bids.createdAt))
      .limit(10);

    // Get recent comments (last 10)
    const recentComments = await db
      .select({
        comment: comments,
        listing: {
          id: listings.id,
          title: listings.title,
          slug: listings.slug,
        },
      })
      .from(comments)
      .innerJoin(listings, eq(comments.listingId, listings.id))
      .where(eq(comments.authorId, userId))
      .orderBy(desc(comments.createdAt))
      .limit(10);

    return {
      user,
      totalBids: totalBidsResult[0]?.count || 0,
      totalComments: totalCommentsResult[0]?.count || 0,
      recentBids: recentBids.map(row => ({
        id: row.bid.id,
        amount: row.bid.amount,
        createdAt: row.bid.createdAt,
        listing: row.listing,
      })),
      recentComments: recentComments.map(row => ({
        id: row.comment.id,
        body: row.comment.body,
        createdAt: row.comment.createdAt,
        listing: row.listing,
      })),
    };
  }

  // Auto bid operations
  async createAutoBid(autoBidData: InsertAutoBid): Promise<AutoBid> {
    const [autoBid] = await db
      .insert(autoBids)
      .values({
        ...autoBidData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return autoBid;
  }

  async getAutoBidByUserAndListing(userId: string, listingId: string): Promise<AutoBid | undefined> {
    const [autoBid] = await db
      .select()
      .from(autoBids)
      .where(and(eq(autoBids.userId, userId), eq(autoBids.listingId, listingId)));
    return autoBid;
  }

  async updateAutoBid(id: string, userId: string, updates: Partial<InsertAutoBid>): Promise<AutoBid | undefined> {
    const [autoBid] = await db
      .update(autoBids)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(autoBids.id, id), eq(autoBids.userId, userId)))
      .returning();
    return autoBid;
  }

  async deleteAutoBid(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(autoBids)
      .where(and(eq(autoBids.id, id), eq(autoBids.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  async getActiveAutoBids(listingId: string): Promise<AutoBid[]> {
    return await db
      .select()
      .from(autoBids)
      .where(and(eq(autoBids.listingId, listingId), eq(autoBids.isActive, true)));
  }

  async executeAutoBids(): Promise<void> {
    // Get auctions ending soon
    const endingSoonAuctions = await db
      .select()
      .from(listings)
      .where(
        and(
          eq(listings.status, "published"),
          sql`${listings.endAt} > NOW()`,
          sql`${listings.endAt} <= NOW() + interval '15 minutes'`
        )
      );

    for (const auction of endingSoonAuctions) {
      const minutesUntilEnd = Math.floor(
        (new Date(auction.endAt).getTime() - Date.now()) / (1000 * 60)
      );

      // Get auto bids that should trigger now
      const triggerAutoBids = await db
        .select()
        .from(autoBids)
        .where(
          and(
            eq(autoBids.listingId, auction.id),
            eq(autoBids.isActive, true),
            eq(autoBids.triggerMinutes, minutesUntilEnd),
            eq(autoBids.hasExecuted, false)
          )
        );

      for (const autoBid of triggerAutoBids) {
        try {
          // Check if max amount is higher than current price
          const currentPrice = parseFloat(auction.currentPrice);
          const maxAmount = parseFloat(autoBid.maxAmount);

          if (maxAmount > currentPrice) {
            // Place bid
            await this.placeBid({
              listingId: auction.id,
              bidderId: autoBid.userId,
              amount: maxAmount.toString(),
              maxBidAmount: maxAmount.toString(),
            });

            // Mark as executed for snipe bids
            if (autoBid.strategyType === "snipe") {
              await db
                .update(autoBids)
                .set({
                  hasExecuted: true,
                  lastExecutedAt: new Date(),
                  updatedAt: new Date(),
                })
                .where(eq(autoBids.id, autoBid.id));
            }

            await this.logAction({
              action: "auto_bid_executed",
              entity: "auto_bid",
              entityId: autoBid.id,
              metaJson: { amount: maxAmount, strategy: autoBid.strategyType },
            });
          }
        } catch (error) {
          console.error(`Failed to execute auto bid ${autoBid.id}:`, error);
        }
      }
    }
  }

  // Additional functions for route compatibility
  async findScheduledAutoBid(listingId: string, userId: string): Promise<AutoBid | undefined> {
    return this.getAutoBidByUserAndListing(userId, listingId);
  }

  async findDueAutoBids(options: { withinMs: number }): Promise<AutoBid[]> {
    const offsetMinutes = Math.floor(options.withinMs / (1000 * 60));
    const result = await db
      .select({ autoBid: autoBids })
      .from(autoBids)
      .innerJoin(listings, eq(autoBids.listingId, listings.id))
      .where(
        and(
          eq(autoBids.isActive, true),
          eq(autoBids.hasExecuted, false),
          eq(listings.status, "published"),
          sql`${listings.endAt} <= NOW() + interval '${offsetMinutes} minutes'`,
          sql`${listings.endAt} > NOW()`
        )
      );
    
    return result.map(row => row.autoBid);
  }

  async markAutoBidExecuted(id: string): Promise<void> {
    await db
      .update(autoBids)
      .set({
        hasExecuted: true,
        lastExecutedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(autoBids.id, id));
  }

  async markAutoBidExpired(id: string): Promise<void> {
    await db
      .update(autoBids)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(autoBids.id, id));
  }

  async getListingForUpdate(id: string): Promise<ListingWithDetails | undefined> {
    return this.getListingById(id);
  }

  async getLastBid(listingId: string): Promise<BidWithDetails | undefined> {
    return this.getHighestBidForListing(listingId);
  }

  async createBid(data: { listingId: string; userId: string; amount: number }): Promise<Bid> {
    return this.placeBid({
      listingId: data.listingId,
      bidderId: data.userId,
      amount: data.amount.toString(),
      maxBidAmount: data.amount.toString(),
    });
  }

  async extendListing(listingId: string, newEndsAt: string, extensionsUsed: number): Promise<void> {
    await db
      .update(listings)
      .set({
        endAt: new Date(newEndsAt),
        extensionCount: extensionsUsed,
        updatedAt: new Date(),
      })
      .where(eq(listings.id, listingId));
  }

  async settleListing(id: string, status: string, outcome: string, winnerUserId: string | null): Promise<void> {
    await db
      .update(listings)
      .set({
        status: status as any,
        endStatus: outcome as any,
        winningBidderId: winnerUserId,
        updatedAt: new Date(),
      })
      .where(eq(listings.id, id));
  }

  async findExpiredLiveListings(): Promise<ListingWithDetails[]> {
    return this.getExpiredAuctions();
  }

  // Admin dashboard stats
  async getAdminDashboard(): Promise<{
    activeAuctions: number;
    pendingApproval: number;
    totalUsers: number;
    totalBids: number;
  }> {
    const [activeAuctionsResult] = await db
      .select({ count: count() })
      .from(listings)
      .where(eq(listings.status, "published"));

    const [pendingApprovalResult] = await db
      .select({ count: count() })
      .from(listings)
      .where(eq(listings.status, "submitted"));

    const [totalUsersResult] = await db
      .select({ count: count() })
      .from(users);

    const [totalBidsResult] = await db
      .select({ count: count() })
      .from(bids);

    return {
      activeAuctions: activeAuctionsResult.count,
      pendingApproval: pendingApprovalResult.count,
      totalUsers: totalUsersResult.count,
      totalBids: totalBidsResult.count,
    };
  }

  // User settings operations
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [userSettingsRecord] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    
    return userSettingsRecord;
  }

  async updateUserSettings(userId: string, settingsData: Partial<InsertUserSettings>): Promise<UserSettings> {
    const [result] = await db
      .update(userSettings)
      .set({
        ...settingsData,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, userId))
      .returning();
    
    return result;
  }

  async upsertUserSettings(userId: string, settingsData: Partial<InsertUserSettings>): Promise<UserSettings> {
    try {
      // Try to update first
      const existing = await this.getUserSettings(userId);
      if (existing) {
        return await this.updateUserSettings(userId, settingsData);
      }
      
      // If no existing settings, create new ones with defaults
      const [result] = await db
        .insert(userSettings)
        .values({
          userId,
          ...settingsData,
        })
        .returning();
      
      return result;
    } catch (error: any) {
      // If insert fails due to unique constraint, try update instead
      if (error?.code === '23505') {
        return await this.updateUserSettings(userId, settingsData);
      }
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
