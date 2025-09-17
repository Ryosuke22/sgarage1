import { type SelectUser as User, type UpsertUser, type SelectListing as Listing, type InsertListing, type SelectBid as Bid, type InsertBid, type SelectComment as Comment, type InsertComment, type ListingWithBids } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;

  // Listing methods
  getListings(filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    yearFrom?: number;
    yearTo?: number;
    make?: string;
    search?: string;
  }): Promise<ListingWithBids[]>;
  getListing(id: string): Promise<ListingWithBids | undefined>;
  createListing(listing: InsertListing): Promise<Listing>;

  // Bid methods
  getBidsForListing(listingId: string): Promise<Bid[]>;
  createBid(bid: InsertBid): Promise<Bid>;
  getLatestBidForListing(listingId: string): Promise<Bid | undefined>;

  // Comment methods
  getCommentsForListing(listingId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private listings: Map<string, Listing>;
  private bids: Map<string, Bid>;
  private comments: Map<string, Comment>;

  constructor() {
    this.users = new Map();
    this.listings = new Map();
    this.bids = new Map();
    this.comments = new Map();
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    console.log('Sample data already exists, skipping initialization');
    return;
    
    // Create sample listings (using years <= 2001 per schema requirement)
    const sampleListings: InsertListing[] = [
      {
        title: "トヨタ カムリ ハイブリッド",
        description: "1999年式トヨタカムリハイブリッド。走行距離12,000km。車検2年付き。",
        category: "car",
        make: "トヨタ",
        model: "カムリ",
        year: 1999,
        mileage: 12000,
        startingPrice: "2500000.00",
        locationText: "東京都",
        city: "東京",
        startAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        endAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        status: "published",
        sellerId: "seller1",
      },
      {
        title: "ホンダ CBR600RR",
        description: "2001年式ホンダCBR600RR。走行距離8,500km。メンテナンス記録完備。",
        category: "motorcycle",
        make: "ホンダ",
        model: "CBR600RR",
        year: 2001,
        mileage: 8500,
        startingPrice: "1000000.00",
        locationText: "大阪府",
        city: "大阪",
        startAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        endAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
        status: "published",
        sellerId: "seller1",
      },
    ];

    for (const listingData of sampleListings) {
      const listing = await this.createListing(listingData);
      // Add some initial bids
      const bidAmount = parseFloat(listingData.startingPrice || "0") + Math.floor(Math.random() * 500000);
      await this.createBid({
        listingId: listing.id,
        bidderId: "bidder1",
        amount: bidAmount.toString(),
        maxBidAmount: (bidAmount + 100000).toString(),
      });
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: UpsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      email: insertUser.email,
      username: insertUser.username || null,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      firstNameKana: insertUser.firstNameKana || null,
      lastNameKana: insertUser.lastNameKana || null,
      profileImageUrl: insertUser.profileImageUrl || null,
      role: insertUser.role || "user",
      emailVerified: insertUser.emailVerified || false,
      emailVerificationToken: insertUser.emailVerificationToken || null,
      pendingEmail: insertUser.pendingEmail || null,
      emailChangeToken: insertUser.emailChangeToken || null,
      emailChangeExpires: insertUser.emailChangeExpires || null,
      passwordResetToken: insertUser.passwordResetToken || null,
      passwordResetExpires: insertUser.passwordResetExpires || null,
      stripeCustomerId: insertUser.stripeCustomerId || null,
      stripeSubscriptionId: insertUser.stripeSubscriptionId || null,
      passwordHash: insertUser.passwordHash || null,
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async getListings(filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    yearFrom?: number;
    yearTo?: number;
    make?: string;
    search?: string;
  }): Promise<ListingWithBids[]> {
    let listings = Array.from(this.listings.values()).filter(l => l.status === "published");

    if (filters) {
      if (filters.category && filters.category !== "all") {
        listings = listings.filter(l => l.category === filters.category);
      }
      if (filters.minPrice && listings.length > 0) {
        listings = listings.filter(l => {
          const latestBid = this.getLatestBidForListingSync(l.id);
          const currentPrice = latestBid ? parseFloat(latestBid.amount) : parseFloat(l.startingPrice || "0");
          return currentPrice >= filters.minPrice!;
        });
      }
      if (filters.maxPrice && listings.length > 0) {
        listings = listings.filter(l => {
          const latestBid = this.getLatestBidForListingSync(l.id);
          const currentPrice = latestBid ? parseFloat(latestBid.amount) : parseFloat(l.startingPrice || "0");
          return currentPrice <= filters.maxPrice!;
        });
      }
      if (filters.yearFrom) {
        listings = listings.filter(l => l.year >= filters.yearFrom!);
      }
      if (filters.yearTo) {
        listings = listings.filter(l => l.year <= filters.yearTo!);
      }
      if (filters.make && filters.make !== "all") {
        listings = listings.filter(l => l.make === filters.make);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        listings = listings.filter(l => 
          l.title.toLowerCase().includes(search) ||
          l.make.toLowerCase().includes(search) ||
          l.model.toLowerCase().includes(search)
        );
      }
    }

    // Sort by end time (soonest first)
    listings.sort((a, b) => {
      const aTime = a.endAt ? new Date(a.endAt).getTime() : 0;
      const bTime = b.endAt ? new Date(b.endAt).getTime() : 0;
      return aTime - bTime;
    });

    const listingsWithBids: ListingWithBids[] = [];
    for (const listing of listings) {
      const latestBid = await this.getLatestBidForListing(listing.id);
      const bidCount = await this.getBidsForListing(listing.id).then(bids => bids.length);
      const currentBid = latestBid ? latestBid.amount : null;
      
      listingsWithBids.push({
        ...listing,
        latestBid,
        currentBid,
        bidCount,
      });
    }

    return listingsWithBids;
  }

  async getListing(id: string): Promise<ListingWithBids | undefined> {
    const listing = this.listings.get(id);
    if (!listing) return undefined;

    const latestBid = await this.getLatestBidForListing(id);
    const bidCount = await this.getBidsForListing(id).then(bids => bids.length);
    const currentBid = latestBid ? latestBid.amount : null;
    
    return {
      ...listing,
      latestBid,
      currentBid,
      bidCount,
    };
  }

  async createListing(insertListing: InsertListing): Promise<Listing> {
    const id = randomUUID();
    
    // Generate slug from title
    const slug = insertListing.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    
    const listing: Listing = {
      ...insertListing,
      id,
      slug,
      currentPrice: insertListing.startingPrice, // Set currentPrice to startingPrice
      city: insertListing.city || null,
      status: insertListing.status || "draft",
      specifications: insertListing.specifications || null,
      condition: insertListing.condition || null,
      highlights: insertListing.highlights || null,
      mileageVerified: insertListing.mileageVerified || false,
      ownershipMileage: insertListing.ownershipMileage || null,
      hasShaken: insertListing.hasShaken || false,
      shakenYear: insertListing.shakenYear || null,
      shakenMonth: insertListing.shakenMonth || null,
      isTemporaryRegistration: insertListing.isTemporaryRegistration || false,
      reservePrice: insertListing.reservePrice || null,
      endStatus: insertListing.endStatus || null,
      winningBidderId: null, // Set to null as this is auto-managed
      extensionCount: 0, // Set to 0 as this is auto-managed
      preferredDayOfWeek: insertListing.preferredDayOfWeek || null,
      preferredStartTime: insertListing.preferredStartTime || null,
      auctionDuration: insertListing.auctionDuration || null,
      videoUrl: insertListing.videoUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.listings.set(id, listing);
    return listing;
  }

  private getLatestBidForListingSync(listingId: string): Bid | undefined {
    const bids = Array.from(this.bids.values())
      .filter(bid => bid.listingId === listingId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return bids[0];
  }

  async getBidsForListing(listingId: string): Promise<Bid[]> {
    return Array.from(this.bids.values())
      .filter(bid => bid.listingId === listingId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async createBid(insertBid: InsertBid): Promise<Bid> {
    const id = randomUUID();
    const bid: Bid = {
      ...insertBid,
      id,
      maxBidAmount: insertBid.maxBidAmount || insertBid.amount,
      feeAmount: insertBid.feeAmount || null,
      feePaymentIntentId: insertBid.feePaymentIntentId || null,
      feePaymentStatus: insertBid.feePaymentStatus || null,
      feePaidAt: insertBid.feePaidAt || null,
      createdAt: new Date(),
    };
    this.bids.set(id, bid);
    return bid;
  }

  async getLatestBidForListing(listingId: string): Promise<Bid | undefined> {
    const bids = await this.getBidsForListing(listingId);
    return bids[0]; // First one is latest due to sorting
  }

  async getCommentsForListing(listingId: string): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.listingId === listingId && !comment.isHidden)
      .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = randomUUID();
    const comment: Comment = {
      ...insertComment,
      id,
      isHidden: insertComment.isHidden || false,
      createdAt: new Date(),
    };
    this.comments.set(id, comment);
    return comment;
  }
}

export const storage = new MemStorage();
