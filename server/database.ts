import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, desc, and, like, gte, lte } from 'drizzle-orm';
import * as schema from '@shared/schema';
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import type { 
  SelectListing, 
  InsertListing, 
  SelectBid, 
  InsertBid, 
  SelectComment, 
  InsertComment,
  SelectUser,
  UpsertUser 
} from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export class DatabaseService {
  // Listing methods
  async getListings(filters?: {
    category?: 'car' | 'motorcycle';
    status?: 'published' | 'ended';
    limit?: number;
    offset?: number;
  }) {
    const query = db
      .select({
        id: schema.listings.id,
        slug: schema.listings.slug,
        title: schema.listings.title,
        description: schema.listings.description,
        category: schema.listings.category,
        make: schema.listings.make,
        model: schema.listings.model,
        year: schema.listings.year,
        mileage: schema.listings.mileage,
        locationText: schema.listings.locationText,
        imageUrl: schema.listings.imageUrl,
        status: schema.listings.status,
        endStatus: schema.listings.endStatus,
        startAt: schema.listings.startAt,
        endAt: schema.listings.endAt,
        startingPrice: schema.listings.startingPrice,
        currentPrice: schema.listings.currentPrice,
        createdAt: schema.listings.createdAt,
      })
      .from(schema.listings);

    if (filters?.category) {
      query.where(eq(schema.listings.category, filters.category));
    }
    if (filters?.status) {
      query.where(eq(schema.listings.status, filters.status));
    }

    query.orderBy(desc(schema.listings.createdAt));
    
    if (filters?.limit) {
      query.limit(filters.limit);
    }
    if (filters?.offset) {
      query.offset(filters.offset);
    }

    return await query;
  }

  async getListingBySlug(slug: string) {
    const [listing] = await db
      .select()
      .from(schema.listings)
      .where(eq(schema.listings.slug, slug))
      .limit(1);

    if (!listing) return null;

    // Get the latest bid for this listing
    const [latestBid] = await db
      .select()
      .from(schema.bids)
      .where(eq(schema.bids.listingId, listing.id))
      .orderBy(desc(schema.bids.amount))
      .limit(1);

    // Get bid count
    const [bidCount] = await db
      .select({ count: schema.bids.id })
      .from(schema.bids)
      .where(eq(schema.bids.listingId, listing.id));

    return {
      ...listing,
      currentBid: latestBid?.amount || null,
      bidCount: bidCount?.count || 0,
    };
  }

  async createListing(listing: InsertListing): Promise<SelectListing> {
    const [created] = await db
      .insert(schema.listings)
      .values(listing)
      .returning();
    
    return created;
  }

  // Bid methods
  async getBidsForListing(listingId: string) {
    return await db
      .select({
        id: schema.bids.id,
        amount: schema.bids.amount,
        createdAt: schema.bids.createdAt,
        bidder: {
          id: schema.users.id,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
        }
      })
      .from(schema.bids)
      .leftJoin(schema.users, eq(schema.bids.bidderId, schema.users.id))
      .where(eq(schema.bids.listingId, listingId))
      .orderBy(desc(schema.bids.createdAt));
  }

  async createBid(bid: InsertBid): Promise<SelectBid> {
    const [created] = await db
      .insert(schema.bids)
      .values(bid)
      .returning();
    
    return created;
  }

  // Comment methods
  async getCommentsForListing(listingId: string) {
    return await db
      .select({
        id: schema.comments.id,
        body: schema.comments.body,
        createdAt: schema.comments.createdAt,
        user: {
          id: schema.users.id,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
        }
      })
      .from(schema.comments)
      .leftJoin(schema.users, eq(schema.comments.authorId, schema.users.id))
      .where(eq(schema.comments.listingId, listingId))
      .orderBy(desc(schema.comments.createdAt));
  }

  async createComment(comment: InsertComment): Promise<SelectComment> {
    const [created] = await db
      .insert(schema.comments)
      .values(comment)
      .returning();
    
    return created;
  }

  // User methods
  async getUserById(id: string): Promise<SelectUser | null> {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);
    
    return user || null;
  }

  async getUserByUsername(username: string): Promise<SelectUser | null> {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);
    
    return user || null;
  }

  async getUserByEmail(email: string): Promise<SelectUser | null> {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    
    return user || null;
  }

  async createUser(user: InsertUser): Promise<SelectUser> {
    const [created] = await db
      .insert(schema.users)
      .values(user)
      .returning();
    
    return created;
  }

  // Admin methods for user management
  async getAllUsers(filters?: {
    role?: 'user' | 'admin';
    limit?: number;
    offset?: number;
  }) {
    const query = db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        email: schema.users.email,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users);

    if (filters?.role) {
      query.where(eq(schema.users.role, filters.role));
    }

    query.orderBy(desc(schema.users.createdAt));
    
    if (filters?.limit) {
      query.limit(filters.limit);
    }
    if (filters?.offset) {
      query.offset(filters.offset);
    }

    return await query;
  }

  async updateUserRole(userId: string, role: 'user' | 'admin'): Promise<SelectUser | null> {
    const [updated] = await db
      .update(schema.users)
      .set({ role, updatedAt: new Date() })
      .where(eq(schema.users.id, userId))
      .returning();
    
    return updated || null;
  }

  // Admin methods for listing management
  async getListingsForAdmin(filters?: {
    status?: 'draft' | 'submitted' | 'approved' | 'published' | 'ended';
    category?: 'car' | 'motorcycle';
    limit?: number;
    offset?: number;
  }) {
    const query = db
      .select({
        id: schema.listings.id,
        slug: schema.listings.slug,
        title: schema.listings.title,
        description: schema.listings.description,
        category: schema.listings.category,
        make: schema.listings.make,
        model: schema.listings.model,
        year: schema.listings.year,
        mileage: schema.listings.mileage,
        locationText: schema.listings.locationText,
        imageUrl: schema.listings.imageUrl,
        status: schema.listings.status,
        endStatus: schema.listings.endStatus,
        startAt: schema.listings.startAt,
        endAt: schema.listings.endAt,
        startingPrice: schema.listings.startingPrice,
        currentPrice: schema.listings.currentPrice,
        createdAt: schema.listings.createdAt,
        updatedAt: schema.listings.updatedAt,
        seller: {
          id: schema.users.id,
          username: schema.users.username,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
        }
      })
      .from(schema.listings)
      .leftJoin(schema.users, eq(schema.listings.sellerId, schema.users.id));

    if (filters?.status) {
      query.where(eq(schema.listings.status, filters.status));
    }
    if (filters?.category) {
      query.where(eq(schema.listings.category, filters.category));
    }

    query.orderBy(desc(schema.listings.updatedAt));
    
    if (filters?.limit) {
      query.limit(filters.limit);
    }
    if (filters?.offset) {
      query.offset(filters.offset);
    }

    return await query;
  }

  async updateListingStatus(
    listingId: string, 
    status: 'draft' | 'submitted' | 'approved' | 'published' | 'ended',
    adminNotes?: string
  ): Promise<SelectListing | null> {
    const updateData: any = { 
      status, 
      updatedAt: new Date() 
    };
    
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    const [updated] = await db
      .update(schema.listings)
      .set(updateData)
      .where(eq(schema.listings.id, listingId))
      .returning();
    
    return updated || null;
  }

  // Admin statistics methods
  async getAdminStats() {
    const [userCount] = await db
      .select({ count: schema.users.id })
      .from(schema.users);

    const [listingCount] = await db
      .select({ count: schema.listings.id })
      .from(schema.listings);

    const [activeListingCount] = await db
      .select({ count: schema.listings.id })
      .from(schema.listings)
      .where(eq(schema.listings.status, 'published'));

    const [pendingListingCount] = await db
      .select({ count: schema.listings.id })
      .from(schema.listings)
      .where(eq(schema.listings.status, 'submitted'));

    const [bidCount] = await db
      .select({ count: schema.bids.id })
      .from(schema.bids);

    return {
      totalUsers: userCount?.count || 0,
      totalListings: listingCount?.count || 0,
      activeListings: activeListingCount?.count || 0,
      pendingListings: pendingListingCount?.count || 0,
      totalBids: bidCount?.count || 0,
    };
  }

  // Get or create a guest user for anonymous bidding
  async getOrCreateGuestUser(): Promise<SelectUser> {
    // Check if guest user already exists
    const [existingGuest] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, 'guest@anonymous.local'))
      .limit(1);
    
    if (existingGuest) {
      return existingGuest;
    }

    // Create a new guest user
    const guestUser: InsertUser = {
      username: 'guest_user',
      email: 'guest@anonymous.local',
      password: 'hashed_guest_password_placeholder',
      firstName: 'ゲスト',
      lastName: 'ユーザー',
      role: 'user',
    };

    return await this.createUser(guestUser);
  }

  // Initialize sample data for development
  async initializeSampleData() {
    // Check if we already have data
    const [existingListing] = await db
      .select()
      .from(schema.listings)
      .limit(1);
    
    if (existingListing) {
      console.log('Sample data already exists, skipping initialization');
      return;
    }

    // Create sample users with authentication data
    const sampleUsers: InsertUser[] = [
      {
        username: 'admin',
        email: 'admin@samuraigarage.com',
        password: await hashPassword('admin123'), // Test password: admin123
        firstName: '管理者',
        lastName: 'システム',
        role: 'admin', // Admin user for testing
      },
      {
        username: 'tanaka_taro',
        email: 'seller1@example.com',
        password: await hashPassword('password123'), // Test password: password123
        firstName: '田中',
        lastName: '太郎',
        role: 'user',
      },
      {
        username: 'sato_hanako',
        email: 'seller2@example.com', 
        password: await hashPassword('password123'), // Test password: password123
        firstName: '佐藤',
        lastName: '花子',
        role: 'user',
      },
    ];

    const createdUsers = await Promise.all(
      sampleUsers.map(user => this.createUser(user))
    );

    // Create sample listings
    const sampleListings: InsertListing[] = [
      {
        slug: 'toyota-ae86-1986',
        title: '1986年 トヨタ AE86 カローラ レビン',
        description: '希少な1986年式AE86カローラレビン。走行距離78,000km（実走行）。エンジンは4A-GEツインカム16バルブを搭載。内装・外装ともに良好な状態を保っています。車検は2年付き。',
        specifications: 'エンジン: 4A-GE 1.6L DOHC 16V\n最高出力: 130ps/6,600rpm\nミッション: 5速MT\n駆動方式: FR',
        condition: '外装: 良好（小キズあり）\n内装: 良好\nエンジン: 好調\nミッション: 良好',
        highlights: '• 実走行78,000km\n• エンジン良好\n• 車検2年付き\n• 希少なAE86\n• オリジナル状態維持',
        category: 'car',
        make: 'トヨタ',
        model: 'AE86 カローラ レビン',
        year: 1986,
        mileage: 78000,
        mileageVerified: true,
        hasShaken: true,
        shakenYear: '2026',
        shakenMonth: '3',
        locationText: '神奈川県横浜市',
        reservePrice: '1800000',
        status: 'published',
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Started yesterday
        endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // Ends in 6 days
        featuredImageUrl: 'https://images.unsplash.com/photo-1600712242805-5f78671b24da?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
        imageUrls: [
          'https://images.unsplash.com/photo-1600712242805-5f78671b24da?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
          'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
        ],
        sellerId: createdUsers[0].id,
      },
      {
        slug: 'honda-nsx-1991',
        title: '1991年 ホンダ NSX タイプR',
        description: '伝説の1991年式ホンダNSX。走行距離45,000km（記録簿完備）。VTEC V6エンジンの咆哮とミッドシップレイアウトによる卓越したハンドリングが魅力。',
        specifications: 'エンジン: C30A 3.0L DOHC VTEC V6\n最高出力: 280ps/7,300rpm\nミッション: 5速MT\n駆動方式: MR',
        condition: '外装: 優良\n内装: 優良\nエンジン: 絶好調\nミッション: 完璧',
        highlights: '• 記録簿完備\n• オリジナルエンジン\n• メンテナンス履歴完備\n• タイプR仕様\n• 希少なフォーミュラレッド',
        category: 'car',
        make: 'ホンダ',
        model: 'NSX タイプR',
        year: 1991,
        mileage: 45000,
        mileageVerified: true,
        hasShaken: true,
        shakenYear: '2025',
        shakenMonth: '12',
        locationText: '東京都渋谷区',
        reservePrice: '12000000',
        status: 'published',
        startDate: new Date(Date.now() - 12 * 60 * 60 * 1000), // Started 12 hours ago
        endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // Ends in 4 days
        featuredImageUrl: 'https://images.unsplash.com/photo-1544829365-4a3d5ee7c8b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
        imageUrls: [
          'https://images.unsplash.com/photo-1544829365-4a3d5ee7c8b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
          'https://images.unsplash.com/photo-1549399081-e7a8992e5742?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
        ],
        sellerId: createdUsers[1].id,
      },
      {
        slug: 'suzuki-gsx-r1000-2001',
        title: '2001年 スズキ GSX-R1000 K1',
        description: '初代GSX-R1000の2001年式K1モデル。走行距離28,000km。スズキの名車中の名車。エンジンは完全にオーバーホール済み。',
        specifications: 'エンジン: 988cc 直列4気筒 DOHC\n最高出力: 160ps/9,500rpm\nミッション: 6速\n車重: 170kg',
        condition: '外装: 良好\n内装: 良好\nエンジン: オーバーホール済み\nブレーキ: 新品パッド',
        highlights: '• エンジンオーバーホール済み\n• 新品タイヤ装着\n• チェーン・スプロケット交換済み\n• 初代K1モデル\n• ブルー/ホワイト カラー',
        category: 'motorcycle',
        make: 'スズキ',
        model: 'GSX-R1000 K1',
        year: 2001,
        mileage: 28000,
        mileageVerified: true,
        hasShaken: false,
        locationText: '大阪府大阪市',
        reservePrice: '450000',
        status: 'published',
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Started 2 days ago
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Ends in 2 days
        featuredImageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
        imageUrls: [
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
          'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
        ],
        sellerId: createdUsers[0].id,
      },
    ];

    const createdListings = await Promise.all(
      sampleListings.map(listing => this.createListing(listing))
    );

    // Create sample bids
    const sampleBids: InsertBid[] = [
      {
        listingId: createdListings[0].id,
        bidderId: createdUsers[1].id,
        amount: '1900000',
      },
      {
        listingId: createdListings[0].id,
        bidderId: createdUsers[0].id,
        amount: '2000000',
      },
      {
        listingId: createdListings[1].id,
        bidderId: createdUsers[0].id,
        amount: '12500000',
      },
      {
        listingId: createdListings[2].id,
        bidderId: createdUsers[1].id,
        amount: '500000',
      },
    ];

    await Promise.all(
      sampleBids.map(bid => this.createBid(bid))
    );

    console.log('Sample data initialized successfully');
  }
}

export const dbService = new DatabaseService();