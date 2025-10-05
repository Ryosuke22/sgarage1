import express, { type Express, Response as ExpressResponse, NextFunction } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { Storage } from "@google-cloud/storage";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { z } from "zod";
import { insertListingSchema, insertBidSchema, insertCommentSchema, signupSchema, loginSchema, emailChangeSchema, insertUserSettingsSchema } from "@shared/schema";
import { authService } from "./auth";
import rateLimit from "express-rate-limit";
import { demoBiddingBot } from "./demoBot";
import { emailService } from "./emailService";
import * as cron from "node-cron";
import Stripe from "stripe";
import type { Request, Response } from "express";
import { auctionBus } from "./realtime";
import * as db from "./db";
import { uploadService } from "./upload-service";

// Type definition for authenticated user (extends the basic User with auth properties)
interface AuthenticatedUser {
  claims?: {
    sub: string;
    email?: string;
    [key: string]: any;
  };
  id?: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
}

// Extend Session type to include userId
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    user?: any;
  }
}

// Extend Request type to include the authenticated user
interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// Helper function to get user ID safely
function getUserId(req: AuthenticatedRequest): string | null {
  if (req.session?.userId) {
    return req.session.userId;
  }
  if (req.user?.claims?.sub) {
    return req.user.claims.sub;
  }
  // Development mode fallback
  if (process.env.NODE_ENV === 'development') {
    return 'samurai-user-1';
  }
  return null;
}

function minIncrement(current: number): number {
  if (current < 1_000_000) return 10_000;
  if (current < 5_000_000) return 25_000;
  return 50_000;
}

// Multer configuration for temporary file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2)}_${file.originalname}`;
      cb(null, uniqueName);
    }
  }),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for high-resolution photos
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs for documents
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image files and PDF documents are allowed'));
    }
  }
});

// Rate limiters
const bidRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 bids per minute
  message: { error: "入札が多すぎます。しばらく待ってからお試しください。" },
  standardHeaders: true,
  legacyHeaders: false,
});

const commentRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute  
  max: 5, // 5 comments per minute
  message: { error: "コメントが多すぎます。しばらく待ってからお試しください。" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

// Initialize Google Cloud Storage  
let gcsStorage: Storage | undefined;
try {
  if (process.env.GCP_PROJECT_ID && process.env.GCP_SERVICE_ACCOUNT_JSON && process.env.GCS_BUCKET) {
    const creds = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON);
    if (creds.private_key && creds.private_key.includes("\\n")) {
      creds.private_key = creds.private_key.replace(/\\n/g, "\n");
    }
    gcsStorage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      credentials: creds,
    });
  }
} catch (error) {
  console.error("Failed to initialize Google Cloud Storage:", error);
  gcsStorage = undefined;
}
const bucketName = process.env.GCS_BUCKET!;
const allowExt = new Set(["pdf", "jpg", "jpeg", "png", "webp", "avif"]);

// SSE connections store
const sseConnections = new Map<string, Set<ExpressResponse>>();

// Export for use in demo bot
export function broadcastToSSE(listingId: string, data: any) {
  const connections = sseConnections.get(listingId);
  if (!connections) return;
  
  const message = `data: ${JSON.stringify(data)}\n\n`;
  connections.forEach((res) => {
    try {
      (res as any).write(message);
    } catch (error) {
      console.error("Error broadcasting to SSE client:", error);
      connections.delete(res);
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.post('/api/auth/signup', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = signupSchema.parse(req.body);
      const user = await authService.signup(data);
      res.json({ message: "アカウント作成が完了しました", user });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/auth/login', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await authService.login(data);
      
      // Set session
      (req as any).session.userId = user.id;
      (req as any).session.user = user;
      
      res.json({ message: "ログインしました", user });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/auth/logout', (req: AuthenticatedRequest, res: Response) => {
    (req as any).session.destroy((err: any) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({ message: "ログアウトエラー" });
      }
      res.json({ message: "ログアウトしました" });
    });
  });

  // New simplified GCS upload endpoints
  app.post("/api/uploads/create-url", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ext, contentType, kind = "doc" } = req.body ?? {};
      if (!ext || !allowExt.has(String(ext).toLowerCase())) {
        return res.status(400).json({ message: "ext must be: " + Array.from(allowExt).join(", ") });
      }
      if (!contentType) {
        return res.status(400).json({ message: "contentType is required" });
      }

      // Check if GCS is configured
      if (!bucketName || !gcsStorage) {
        return res.status(400).json({ 
          error: "Google Cloud Storage is not configured. Please set GCP_PROJECT_ID, GCS_BUCKET, and GCP_SERVICE_ACCOUNT_JSON environment variables.",
          details: {
            missingBucket: !bucketName,
            missingStorage: !gcsStorage,
            requiredEnvVars: ["GCP_PROJECT_ID", "GCS_BUCKET", "GCP_SERVICE_ACCOUNT_JSON"]
          }
        });
      }

      const id = crypto.randomUUID();
      const objectName = `${kind}/${new Date().toISOString().slice(0,10)}/${id}.${ext}`;
      const file = gcsStorage.bucket(bucketName).file(objectName);

      const [url] = await file.getSignedUrl({
        version: "v4",
        action: "write",
        // 有効期限 5分
        expires: Date.now() + 5 * 60 * 1000,
        contentType,
      });

      const publicUrl = `https://storage.googleapis.com/${bucketName}/${objectName}`;
      res.json({ url, objectName, publicUrl });
    } catch (err) {
      next(err);
    }
  });

  // アップロード後の存在確認（任意）
  app.get("/api/uploads/exists", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const name = String(req.query.name ?? "");
      if (!name) return res.status(400).json({ message: "name query is required" });
      
      // Check if GCS is configured
      if (!bucketName || !gcsStorage) {
        return res.status(400).json({ 
          error: "Google Cloud Storage is not configured",
          exists: false
        });
      }
      
      const [exists] = await gcsStorage.bucket(bucketName).file(name).exists();
      res.json({ exists });
    } catch (e) { 
      next(e); 
    }
  });

  app.get('/api/auth/user', async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Try session auth first
      if (req.session?.userId) {
        const user = await storage.getUser(req.session.userId);
        return res.json(user);
      }
      
      // Fallback to Replit auth
      if (req.user?.claims?.sub) {
        const user = await storage.getUser(req.user.claims.sub);
        return res.json(user);
      }
      
      // Development/Demo mode - auto-login as demo user
      if (process.env.NODE_ENV === 'development') {
        const demoUser = await storage.getUser('samurai-user-1');
        if (demoUser) {
          // Set session for demo user
          req.session.userId = demoUser.id;
          req.session.user = demoUser;
          return res.json(demoUser);
        }
      }
      
      res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User settings endpoints
  app.get('/api/user/settings', async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Get user ID from session or auth
      let userId;
      if (req.session?.userId) {
        userId = req.session.userId;
      } else if (req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else {
        // Development/Demo mode - auto-login as demo user
        if (process.env.NODE_ENV === 'development') {
          userId = 'samurai-user-1';
        } else {
          return res.status(401).json({ message: "認証が必要です" });
        }
      }

      // Get user settings, with defaults if none exist
      let userSettings = await storage.getUserSettings(userId);
      
      if (!userSettings) {
        // Create default settings if none exist
        userSettings = await storage.upsertUserSettings(userId, {
          userId,
          emailNotifications: true,
          pushNotifications: false,
          outbidNotifications: true,
          auctionEndNotifications: true,
          theme: "system",
          language: "ja",
          compactView: false,
        });
      }

      res.json(userSettings);
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ message: "設定の取得に失敗しました" });
    }
  });

  app.put('/api/user/settings', async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Get user ID from session or auth
      let userId;
      if (req.session?.userId) {
        userId = req.session.userId;
      } else if (req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else {
        // Development/Demo mode - auto-login as demo user
        if (process.env.NODE_ENV === 'development') {
          userId = 'samurai-user-1';
        } else {
          return res.status(401).json({ message: "認証が必要です" });
        }
      }

      // Validate the request body
      const settingsData = insertUserSettingsSchema.partial().parse(req.body);
      
      // Update or create user settings
      const updatedSettings = await storage.upsertUserSettings(userId, settingsData);
      
      res.json({ 
        message: "設定が保存されました", 
        settings: updatedSettings 
      });
    } catch (error: any) {
      console.error("Error updating user settings:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "無効な設定データです",
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "設定の保存に失敗しました" });
    }
  });

  // Admin dashboard endpoint
  app.get("/api/admin/dashboard", async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Try session auth first
      let userId;
      if (req.session?.userId) {
        userId = req.session.userId;
      } else if (req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else {
        return res.status(401).json({ error: "認証が必要です" });
      }

      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "管理者権限が必要です" });
      }

      const dashboard = await storage.getAdminDashboard();
      res.json(dashboard);
    } catch (error: any) {
      console.error("Error fetching admin dashboard:", error);
      res.status(500).json({ error: "管理者ダッシュボードの取得に失敗しました" });
    }
  });

  // Admin listings endpoint
  app.get("/api/admin/listings", async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Try session auth first
      let userId;
      if (req.session?.userId) {
        userId = req.session.userId;
      } else if (req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else {
        return res.status(401).json({ error: "認証が必要です" });
      }

      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "管理者権限が必要です" });
      }

      const { status } = req.query;
      const listings = await storage.getListingsForAdmin(status === "all" ? undefined : status as string);
      
      res.json(listings);
    } catch (error: any) {
      console.error("Error fetching admin listings:", error);
      res.status(500).json({ error: "管理者リスト取得に失敗しました" });
    }
  });

  // Admin route to get all users for management
  app.get("/api/admin/users", async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Development mode: Allow mock admin user
      if (process.env.NODE_ENV === 'development') {
        console.log("Dev mode - admin users request allowed");
        const users = await storage.getAllUsers();
        return res.json(users);
      }

      // Production auth
      let userId;
      if (req.session?.userId) {
        userId = req.session.userId;
      } else if (req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else {
        return res.status(401).json({ error: "認証が必要です" });
      }

      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "管理者権限が必要です" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "ユーザー一覧の取得に失敗しました" });
    }
  });

  // Admin route to update user role
  app.patch("/api/admin/users/:userId/role", async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Try session auth first
      let currentUserId;
      if (req.session?.userId) {
        currentUserId = req.session.userId;
      } else if (req.user?.claims?.sub) {
        currentUserId = req.user.claims.sub;
      } else {
        return res.status(401).json({ error: "認証が必要です" });
      }

      const currentUser = await storage.getUser(currentUserId);
      
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ error: "管理者権限が必要です" });
      }

      const { userId } = req.params;
      const { role } = req.body;

      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ error: "無効なロールです" });
      }

      const updatedUser = await storage.updateUserRole(userId, role);
      res.json(updatedUser);
    } catch (error: any) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: "ユーザーロールの更新に失敗しました" });
    }
  });

  // Admin route to seed test data (for demo/testing purposes)
  app.post("/api/admin/seed-test-data", async (req: any, res) => {
    try {
      // Check admin permissions
      let userId;
      if (req.session?.userId) {
        userId = req.session.userId;
      } else if (req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else {
        return res.status(401).json({ error: "認証が必要です" });
      }

      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "管理者権限が必要です" });
      }

      // Japanese car manufacturers and models
      const carData = [
        { make: "トヨタ", models: ["スープラ", "AE86", "セリカ", "MR2", "ランドクルーザー"] },
        { make: "日産", models: ["スカイラインGT-R", "シルビア", "フェアレディZ", "180SX", "サニー"] },
        { make: "ホンダ", models: ["NSX", "インテグラ", "シビック", "S2000", "アコード"] },
        { make: "マツダ", models: ["RX-7", "RX-8", "ロードスター", "サバンナ", "コスモ"] },
        { make: "スバル", models: ["インプレッサWRX", "レガシィ", "フォレスター", "BRZ"] },
        { make: "三菱", models: ["ランサーエボリューション", "3000GT", "パジェロ", "ギャラン"] }
      ];

      // Japanese motorcycle manufacturers and models
      const motorcycleData = [
        { make: "ホンダ", models: ["CB750", "NSR250R", "CBR1000RR", "CRF450R", "モンキー"] },
        { make: "ヤマハ", models: ["YZF-R1", "MT-09", "XSR700", "VMAX", "SR400"] },
        { make: "カワサキ", models: ["ニンジャZX-10R", "Z1", "バルカン", "KLR650", "W800"] },
        { make: "スズキ", models: ["ハヤブサ", "GSX-R1000", "カタナ", "DR-Z400", "アドレス"] }
      ];

      // Create test sellers
      const testSellers = [];
      for (let i = 1; i <= 6; i++) {
        try {
          const seller = await storage.createUser({
            email: `seller${i}@example.com`,
            username: `seller${i}`,
            firstName: `太郎${i}`,
            lastName: `売主`,
            firstNameKana: `タロウ${i}`,
            lastNameKana: `バイシュ`,
            role: "user",
            emailVerified: true
          });
          testSellers.push(seller);
        } catch (error) {
          // User might already exist, get existing one
          const existing = await storage.getUserByEmail(`seller${i}@example.com`);
          if (existing) testSellers.push(existing);
        }
      }

      // Create test bidders
      const testBidders = [];
      for (let i = 1; i <= 10; i++) {
        try {
          const bidder = await storage.createUser({
            email: `bidder${i}@example.com`,
            username: `bidder${i}`,
            firstName: `次郎${i}`,
            lastName: `入札者`,
            firstNameKana: `ジロウ${i}`,
            lastNameKana: `ニュウサツシャ`,
            role: "user",
            emailVerified: true
          });
          testBidders.push(bidder);
        } catch (error) {
          // User might already exist, get existing one
          const existing = await storage.getUserByEmail(`bidder${i}@example.com`);
          if (existing) testBidders.push(existing);
        }
      }

      const createdListings = [];

      // Create car listings
      let listingCount = 0;
      for (const carMfg of carData) {
        for (const model of carMfg.models) {
          if (listingCount >= 20) break; // Max 20 cars
          
          const year = 1990 + Math.floor(Math.random() * 20); // 1990-2009
          const mileage = 50000 + Math.floor(Math.random() * 200000); // 50k-250k km
          const startingPrice = 500000 + Math.floor(Math.random() * 4500000); // 50万-500万円
          const seller = testSellers[Math.floor(Math.random() * testSellers.length)];
          
          const listing = await storage.createListing({
            title: `${year}年 ${carMfg.make} ${model}`,
            description: `美しい${year}年式の${carMfg.make} ${model}です。走行距離${mileage.toLocaleString()}km。車検付き。`,
            specifications: `エンジン: 直列4気筒\n排気量: 2000cc\nトランスミッション: 5速マニュアル`,
            condition: "中古車として良好な状態です。",
            highlights: "オリジナルペイント、ワンオーナー車",
            category: "car" as any,
            make: carMfg.make,
            model: model,
            year: year,
            mileage: mileage,
            mileageVerified: true,
            hasShaken: true,
            shakenYear: "令和6年",
            shakenMonth: "12月",
            locationText: "東京都",
            city: "渋谷区",
            startingPrice: startingPrice.toString(),
            startAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Started 7 days ago
            endAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // Ended 1 hour ago
            status: "ended" as any,
            endStatus: Math.random() > 0.3 ? "sold" : "unsold" as any,
            sellerId: seller.id
          }, seller.id);

          // Add some random bids
          const numBids = 3 + Math.floor(Math.random() * 8); // 3-10 bids
          let currentPrice = startingPrice;
          
          for (let b = 0; b < numBids; b++) {
            const bidder = testBidders[Math.floor(Math.random() * testBidders.length)];
            const increment = 10000 + Math.floor(Math.random() * 50000); // 1万-6万円増額
            currentPrice += increment;
            
            await storage.placeBid({
              listingId: listing.id,
              bidderId: bidder.id,
              amount: currentPrice.toString(),
              maxBidAmount: (currentPrice + Math.floor(Math.random() * 100000)).toString()
            });
          }

          createdListings.push(listing);
          listingCount++;
        }
        if (listingCount >= 20) break;
      }

      // Create motorcycle listings
      listingCount = 0;
      for (const bikeMfg of motorcycleData) {
        for (const model of bikeMfg.models) {
          if (listingCount >= 10) break; // Max 10 motorcycles
          
          const year = 1995 + Math.floor(Math.random() * 15); // 1995-2009
          const mileage = 10000 + Math.floor(Math.random() * 80000); // 10k-90k km
          const startingPrice = 200000 + Math.floor(Math.random() * 1800000); // 20万-200万円
          const seller = testSellers[Math.floor(Math.random() * testSellers.length)];
          
          const listing = await storage.createListing({
            title: `${year}年 ${bikeMfg.make} ${model}`,
            description: `素晴らしい${year}年式の${bikeMfg.make} ${model}です。走行距離${mileage.toLocaleString()}km。車検付き。`,
            specifications: `エンジン: 4気筒\n排気量: 1000cc\nトランスミッション: 6速`,
            condition: "中古バイクとして非常に良好な状態です。",
            highlights: "フルサービス済み、カスタムパーツ付き",
            category: "motorcycle" as any,
            make: bikeMfg.make,
            model: model,
            year: year,
            mileage: mileage,
            mileageVerified: true,
            hasShaken: true,
            shakenYear: "令和6年",
            shakenMonth: "11月",
            locationText: "大阪府",
            city: "大阪市",
            startingPrice: startingPrice.toString(),
            startAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Started 5 days ago
            endAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // Ended 2 hours ago
            status: "ended" as any,
            endStatus: Math.random() > 0.2 ? "sold" : "unsold" as any,
            sellerId: seller.id
          }, seller.id);

          // Add some random bids
          const numBids = 2 + Math.floor(Math.random() * 6); // 2-7 bids
          let currentPrice = startingPrice;
          
          for (let b = 0; b < numBids; b++) {
            const bidder = testBidders[Math.floor(Math.random() * testBidders.length)];
            const increment = 5000 + Math.floor(Math.random() * 25000); // 5千-3万円増額
            currentPrice += increment;
            
            await storage.placeBid({
              listingId: listing.id,
              bidderId: bidder.id,
              amount: currentPrice.toString(),
              maxBidAmount: (currentPrice + Math.floor(Math.random() * 50000)).toString()
            });
          }

          createdListings.push(listing);
          listingCount++;
        }
        if (listingCount >= 10) break;
      }

      res.json({
        message: `${createdListings.length}件のテストデータを作成しました`,
        listings: createdListings.length,
        sellers: testSellers.length,
        bidders: testBidders.length
      });
    } catch (error: any) {
      console.error("Error seeding test data:", error);
      res.status(500).json({ error: "テストデータの作成に失敗しました" });
    }
  });

  // Object storage routes for both public and protected files
  app.get("/objects/:objectPath(*)", async (req: any, res) => {
    const userId = (req.user as any)?.claims?.sub; // May be undefined for non-authenticated requests
    const objectStorageService = new ObjectStorageService();
    try {
      // First try to find the object in public search paths (no auth required)
      const filePath = req.params.objectPath;
      let objectFile = await objectStorageService.searchPublicObject(filePath);
      
      if (objectFile) {
        // Public object found, serve it directly
        return objectStorageService.downloadObject(objectFile, res);
      }
      
      // If not found in public paths, try private storage with auth
      objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      return objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error("Error getting upload URL:", error);
      // Generate a temporary local upload URL as fallback
      const tempUploadId = `temp_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      res.json({ 
        uploadURL: `/api/temp-upload/${tempUploadId}`,
        isTempUpload: true 
      });
    }
  });

  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadDir));
  
  // Serve enhanced uploads (originals) with proper caching
  const originalsDir = path.join(process.cwd(), 'uploads', 'originals');
  if (!fs.existsSync(originalsDir)) {
    fs.mkdirSync(originalsDir, { recursive: true });
  }
  app.use('/uploads/originals', express.static(originalsDir, {
    maxAge: '365d',
    immutable: true
  }));

  // Temporary upload endpoint for when object storage fails
  app.put('/api/temp-upload/:uploadId', upload.single('file'), (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ 
      uploadURL: fileUrl,
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  });

  // Enhanced upload endpoint with large file support (no compression)
  const enhancedUpload = uploadService.createUploadMiddleware(10);
  
  // Debug endpoint to check authentication status
  app.get('/api/auth/debug', (req: any, res) => {
    res.json({
      isAuthenticated: req.isAuthenticated(),
      user: req.user ? {
        claims: req.user.claims,
        expires_at: req.user.expires_at
      } : null,
      session: req.session ? {
        id: req.sessionID,
        hasPassport: !!req.session.passport
      } : null
    });
  });
  
  // Temporary upload endpoint without authentication for debugging
  app.post('/api/upload-image-temp', enhancedUpload.single('image'), (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const processedFiles = uploadService.processUploadedFiles([req.file]);
    const file = processedFiles[0];
    
    res.json({ 
      url: file.url,
      filename: path.basename(file.url),
      originalname: file.originalName,
      mimetype: file.mimeType,
      size: file.size,
      sizeFormatted: file.sizeFormatted
    });
  });
  
  app.post('/api/upload-image', isAuthenticated, enhancedUpload.single('image'), (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const processedFiles = uploadService.processUploadedFiles([req.file]);
    const file = processedFiles[0];
    
    res.json({ 
      url: file.url,
      filename: path.basename(file.url),
      originalname: file.originalName,
      mimetype: file.mimeType,
      size: file.size,
      sizeFormatted: file.sizeFormatted
    });
  });

  // Enhanced multi-file upload endpoint
  app.post('/api/upload-multiple', isAuthenticated, enhancedUpload.array('photos', 10), (req: any, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const processedFiles = uploadService.processUploadedFiles(req.files);
    res.json({ 
      ok: true,
      files: processedFiles,
      uploadStats: uploadService.getUploadStats()
    });
  });

  // Add enhanced upload error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api/upload')) {
      uploadService.handleUploadError(err, req, res, next);
    } else {
      next(err);
    }
  });

  app.put("/api/listing-images", isAuthenticated, async (req: any, res) => {
    if (!req.body.imageURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }

    const userId = (req.user as any)?.claims?.sub;

    try {
      // Check if this is a temporary upload (local file)
      if (req.body.imageURL.startsWith('/uploads/')) {
        // For temporary uploads, just return the URL as-is since they're already publicly accessible
        res.status(200).json({ objectPath: req.body.imageURL });
        return;
      }

      // For object storage uploads, try the normal ACL process
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageURL,
        {
          owner: userId,
          visibility: "public", // Vehicle photos should be publicly accessible
        },
      );

      res.status(200).json({ objectPath });
    } catch (error) {
      console.error("Error setting listing image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Document routes
  app.post("/api/listings/:listingId/documents", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      const { listingId } = req.params;
      const { type, fileName, url } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "認証が必要です" });
      }

      // Verify listing exists and user has permission
      const listing = await storage.getListingById(listingId);
      if (!listing) {
        return res.status(404).json({ error: "オークションが見つかりません" });
      }

      if (listing.sellerId !== userId && req.user?.claims?.role !== "admin") {
        return res.status(403).json({ error: "この操作を実行する権限がありません" });
      }

      // Validate document type
      const validTypes = ['registration_certificate', 'transfer_certificate', 'registration_seal', 'insurance_certificate', 'maintenance_record', 'other'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: "無効な書類タイプです" });
      }

      const documents = await storage.addDocuments([{
        listingId,
        type,
        fileName,
        url
      }]);

      res.status(201).json(documents[0]);
    } catch (error) {
      console.error("Error adding document:", error);
      res.status(500).json({ error: "書類の追加に失敗しました" });
    }
  });

  app.get("/api/listings/:listingId/documents", async (req: Request, res: Response) => {
    try {
      const { listingId } = req.params;
      
      const listing = await storage.getListingById(listingId);
      if (!listing) {
        return res.status(404).json({ error: "オークションが見つかりません" });
      }

      const documents = await storage.getDocumentsByListingId(listingId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "書類の取得に失敗しました" });
    }
  });

  app.delete("/api/documents/:documentId", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const { documentId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "認証が必要です" });
      }

      // For now, allow deletion if user is authenticated
      // TODO: Add proper permission checking by retrieving document by ID
      await storage.deleteDocument(documentId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "書類の削除に失敗しました" });
    }
  });

  // Listings routes
  app.get("/api/listings", async (req: any, res) => {
    try {
      const { status = "published", category, sort = "endingSoon", limit = "20", offset = "0", search } = req.query;
      
      const filters = {
        status: status as string,
        category: category as string | undefined,
        sortBy: sort as "endingSoon" | "newest" | "highestPrice",
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        search: search as string | undefined,
      };
      
      const listings = await storage.getListings(filters);
      res.json(listings);
    } catch (error) {
      console.error("Error fetching listings:", error);
      res.status(500).json({ error: "Failed to fetch listings" });
    }
  });

  app.get("/api/listings/:idOrSlug", async (req: any, res) => {
    try {
      const { idOrSlug } = req.params;
      console.log("Fetching listing with idOrSlug:", idOrSlug);
      let listing;
      
      // Check if it looks like a UUID (has multiple hyphens in UUID format)
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (uuidPattern.test(idOrSlug)) {
        console.log("Searching by UUID ID:", idOrSlug);
        listing = await storage.getListingById(idOrSlug);
      } else {
        console.log("Searching by slug:", idOrSlug);
        listing = await storage.getListingBySlug(idOrSlug);
        if (!listing) {
          console.log("Not found by slug, trying ID:", idOrSlug);
          listing = await storage.getListingById(idOrSlug);
        }
      }
      
      if (!listing) {
        console.log("Listing not found for idOrSlug:", idOrSlug);
        return res.status(404).json({ error: "オークションが見つかりません" });
      }
      console.log("Found listing:", listing.id, listing.title);
      res.json(listing);
    } catch (error) {
      console.error("Error fetching listing:", error);
      res.status(500).json({ error: "Failed to fetch listing" });
    }
  });

  // --- SSE ストリーム ---
  app.get("/api/stream/auction/:id", (req: Request, res: Response) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    const { id } = req.params;

    const onBid = (payload: any) => {
      if (payload?.listingId === id) {
        res.write(`event: bid\n`);
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      }
    };
    const onExtend = (payload: any) => {
      if (payload?.listingId === id) {
        res.write(`event: extended\n`);
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      }
    };

    auctionBus.on("bid:created", onBid);
    auctionBus.on("listing:extended", onExtend);

    req.on("close", () => {
      auctionBus.off("bid:created", onBid);
      auctionBus.off("listing:extended", onExtend);
    });

    res.write(`event: ping\ndata: "ok"\n\n`);
  });

  // Temporary endpoint without authentication for testing
  app.post("/api/listings/test", async (req, res) => {
    console.log("=== TEST ENDPOINT HIT ===");
    res.setHeader('Content-Type', 'application/json');
    try {
      const userId = "46383243"; // Use your actual user ID for testing
      
      console.log("TEST: Creating listing with user ID:", userId);
      console.log("TEST: Raw request body:", JSON.stringify(req.body, null, 2));
      
      // Convert string fields to proper types and add photos from uploaded photos
      const processedData = {
        ...req.body,
        sellerId: userId, // Set sellerId first
        year: typeof req.body.year === 'string' ? parseInt(req.body.year, 10) : req.body.year,
        mileage: typeof req.body.mileage === 'string' ? parseInt(req.body.mileage, 10) : req.body.mileage,
        ownershipMileage: req.body.ownershipMileage && req.body.ownershipMileage !== '' 
          ? (typeof req.body.ownershipMileage === 'string' ? parseInt(req.body.ownershipMileage, 10) : req.body.ownershipMileage)
          : null,
        startingPrice: typeof req.body.startingPrice === 'string' ? req.body.startingPrice : req.body.startingPrice?.toString(),
        reservePrice: req.body.reservePrice && req.body.reservePrice !== '' 
          ? (typeof req.body.reservePrice === 'string' ? req.body.reservePrice : req.body.reservePrice?.toString())
          : null,
        startAt: req.body.startAt ? new Date(req.body.startAt) : new Date(Date.now() + 24 * 60 * 60 * 1000),
        endAt: req.body.endAt ? new Date(req.body.endAt) : new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        photos: req.body.photos || [], // Ensure photos array exists
      };
      
      console.log("TEST: Processed data:", JSON.stringify(processedData, null, 2));
      
      const validatedData = insertListingSchema.parse(processedData);
      console.log("TEST: Validated data:", JSON.stringify(validatedData, null, 2));
      
      const listing = await storage.createListing(validatedData, userId);
      console.log("TEST: Created listing:", listing.id);
      
      // Return the listing with photos included
      const listingWithPhotos = await storage.getListingById(listing.id);
      res.status(201).json(listingWithPhotos);
    } catch (error: any) {
      console.error("TEST: Error creating listing:", error);
      
      if (error.issues) {
        return res.status(400).json({
          error: "Invalid data",
          details: error.issues.map((issue: any) => ({
            code: issue.code,
            path: issue.path,
            message: issue.message,
          })),
        });
      }
      
      res.status(500).json({ error: "Failed to create listing" });
    }
  });

  app.post("/api/listings", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      
      console.log("User ID:", userId);
      console.log("User object:", req.user);
      
      if (!userId) {
        console.error("User ID is undefined. User object:", req.user);
        return res.status(401).json({ error: "ユーザーIDが取得できません" });
      }
      
      console.log("Raw request body:", JSON.stringify(req.body, null, 2));
      console.log("VIDEO URL CHECK:", req.body.videoUrl);
      
      // Helper function to calculate endAt based on auctionDuration
      const calculateEndDate = (startDate: Date, duration: string): Date => {
        const start = startDate.getTime();
        switch (duration) {
          case '3minutes':
            return new Date(start + 3 * 60 * 1000); // 3 minutes
          case '5days':
            return new Date(start + 5 * 24 * 60 * 60 * 1000); // 5 days
          case '7days':
            return new Date(start + 7 * 24 * 60 * 60 * 1000); // 7 days
          case '10days':
            return new Date(start + 10 * 24 * 60 * 60 * 1000); // 10 days
          case '14days':
            return new Date(start + 14 * 24 * 60 * 60 * 1000); // 14 days
          default:
            return new Date(start + 7 * 24 * 60 * 60 * 1000); // Default to 7 days
        }
      };

      // Start and end times will be set by admin during approval
      // User's preferences are stored in preferredDayOfWeek, preferredStartTime, auctionDuration
      const startAt = null;
      const endAt = null;

      // Convert string fields to proper types and add photos from uploaded photos
      const processedData = {
        ...req.body,
        sellerId: userId, // Set sellerId first
        year: typeof req.body.year === 'string' ? parseInt(req.body.year, 10) : req.body.year,
        mileage: typeof req.body.mileage === 'string' ? parseInt(req.body.mileage, 10) : req.body.mileage,
        ownershipMileage: req.body.ownershipMileage && req.body.ownershipMileage !== '' 
          ? (typeof req.body.ownershipMileage === 'string' ? parseInt(req.body.ownershipMileage, 10) : req.body.ownershipMileage)
          : null,
        startingPrice: typeof req.body.startingPrice === 'string' ? req.body.startingPrice : req.body.startingPrice?.toString(),
        reservePrice: req.body.reservePrice && req.body.reservePrice !== '' 
          ? (typeof req.body.reservePrice === 'string' ? req.body.reservePrice : req.body.reservePrice?.toString())
          : null,
        startAt,
        endAt,
        photos: req.body.photos || [], // Ensure photos array exists
      };
      
      console.log("Processed data:", JSON.stringify(processedData, null, 2));
      console.log("VIDEO URL IN PROCESSED DATA:", processedData.videoUrl);
      
      console.log("About to validate data:", JSON.stringify(processedData, null, 2));
      const validatedData = insertListingSchema.parse(processedData);
      console.log("Validated data successful");
      console.log("VIDEO URL IN VALIDATED DATA:", validatedData.videoUrl);
      
      const listing = await storage.createListing(validatedData, userId);
      console.log("Listing created successfully:", listing.id);
      
      // Create photo records if photos were provided
      if (req.body.photos && req.body.photos.length > 0) {
        console.log("Processing photos. Raw photos:", JSON.stringify(req.body.photos, null, 2));
        const photoData = req.body.photos.map((photo: any, index: number) => {
          console.log(`Photo ${index}:`, photo, `typeof:`, typeof photo);
          console.log(`Photo.url:`, photo.url, `typeof photo.url:`, typeof photo.url);
          const result = {
            listingId: listing.id,
            url: typeof photo === 'string' ? photo : photo.url,
            sortOrder: typeof photo === 'string' ? index : (photo.sortOrder ?? index),
          };
          console.log(`Result for photo ${index}:`, result);
          return result;
        });
        console.log("Final photoData to save:", JSON.stringify(photoData, null, 2));
        await storage.addPhotos(photoData);
      }
      
      await storage.logAction({
        actorId: userId,
        action: "listing_created",
        entity: "listing",
        entityId: listing.id,
      });

      // Return the listing with photos included
      const listingWithPhotos = await storage.getListingById(listing.id);
      res.status(201).json(listingWithPhotos);
    } catch (error: any) {
      console.error("Error creating listing:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create listing" });
    }
  });

  app.put("/api/listings/:id", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      
      if (!userId) {
        return res.status(401).json({ error: "ユーザーIDが取得できません" });
      }
      
      const listing = await storage.getListingById(req.params.id);
      
      if (!listing) {
        return res.status(404).json({ error: "オークションが見つかりません" });
      }
      
      // Only seller or admin can update
      if (listing.sellerId !== userId && req.user?.claims?.role !== "admin") {
        return res.status(403).json({ error: "このオークションを編集する権限がありません" });
      }

      const validatedData = insertListingSchema.partial().parse(req.body);
      const updated = await storage.updateListing(req.params.id, validatedData);
      
      await storage.logAction({
        actorId: userId,
        action: "listing_updated",
        entity: "listing",
        entityId: req.params.id,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error updating listing:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update listing" });
    }
  });

  // Reorder photos for a listing
  app.put("/api/photos/reorder", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      
      if (!userId) {
        return res.status(401).json({ error: "認証が必要です" });
      }
      
      const { listingId, photoUpdates } = req.body as { 
        listingId: string;
        photoUpdates: { id: string; sortOrder: number }[] 
      };

      // Validate request payload
      if (!listingId || typeof listingId !== 'string') {
        return res.status(400).json({ error: "有効なlistingIdが必要です" });
      }
      
      if (!photoUpdates || !Array.isArray(photoUpdates)) {
        return res.status(400).json({ error: "photoUpdatesの配列が必要です" });
      }

      // Validate each photo update
      for (const update of photoUpdates) {
        if (!update.id || typeof update.id !== 'string' || 
            typeof update.sortOrder !== 'number' || update.sortOrder < 0) {
          return res.status(400).json({ 
            error: "各photoUpdateにはid(文字列)とsortOrder(0以上の数値)が必要です" 
          });
        }
      }

      // Get the listing to verify ownership
      const listing = await storage.getListingById(listingId);
      
      if (!listing) {
        return res.status(404).json({ error: "出品が見つかりません" });
      }
      
      // Only seller or admin can reorder photos
      if (listing.sellerId !== userId && req.user?.claims?.role !== "admin") {
        return res.status(403).json({ error: "この出品の写真を編集する権限がありません" });
      }

      // Verify all photo IDs belong to this listing
      const existingPhotos = await storage.getPhotosByListingId(listingId);
      const existingPhotoIds = new Set(existingPhotos.map(p => p.id));
      
      for (const update of photoUpdates) {
        if (!existingPhotoIds.has(update.id)) {
          return res.status(400).json({ 
            error: `写真ID ${update.id} は出品 ${listingId} に属していません` 
          });
        }
      }

      // Update photo sort orders
      await storage.updatePhotoSortOrder(listingId, photoUpdates);
      
      await storage.logAction({
        actorId: userId,
        action: "photos_reordered",
        entity: "listing",
        entityId: listingId,
        metaJson: { photoCount: photoUpdates.length },
      });

      // Return updated photos
      const updatedListing = await storage.getListingById(listingId);
      res.json({ 
        success: true, 
        photos: updatedListing?.photos || [] 
      });
    } catch (error) {
      console.error("Error reordering photos:", error);
      res.status(500).json({ error: "写真の順序変更に失敗しました" });
    }
  });

  // Create payment intent for bid fee
  app.post("/api/create-bid-fee-payment", [isAuthenticated], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { bidAmount } = req.body;
      const userId = req.user?.claims?.sub;

      if (!bidAmount || !userId) {
        return res.status(400).json({ error: "入札額が必要です" });
      }

      const feeAmount = Math.round(parseFloat(bidAmount) * 0.05 * 100); // 5% fee in cents
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: feeAmount,
        currency: "jpy",
        metadata: {
          type: "bid_fee",
          userId,
          bidAmount: bidAmount.toString(),
        },
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        feeAmount: feeAmount / 100,
      });
    } catch (error: any) {
      console.error("Error creating bid fee payment intent:", error);
      res.status(500).json({ error: "手数料の決済準備に失敗しました" });
    }
  });

  // Stripe Customer and Payment Methods management
  
  // Helper function to get or create Stripe customer
  async function getOrCreateStripeCustomer(userId: string): Promise<string> {
    const user = await storage.getUser(userId);
    if (!user) throw new Error("User not found");
    
    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }
    
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId }
    });
    
    await storage.updateUser(userId, { stripeCustomerId: customer.id });
    return customer.id;
  }

  // Get user's payment methods
  app.get('/api/payment-methods', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "認証が必要です" });
      }

      const customerId = await getOrCreateStripeCustomer(userId);
      
      // Get payment methods and customer info for default payment method
      const [paymentMethods, customer] = await Promise.all([
        stripe.paymentMethods.list({
          customer: customerId,
          type: 'card',
        }),
        stripe.customers.retrieve(customerId)
      ]);

      // Get the default payment method ID from customer settings
      const defaultPaymentMethodId = (customer as any).invoice_settings?.default_payment_method;

      // Add default flag to payment methods
      const enrichedPaymentMethods = paymentMethods.data.map(pm => ({
        ...pm,
        isDefault: pm.id === defaultPaymentMethodId
      }));

      res.json(enrichedPaymentMethods);
    } catch (error: any) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ message: "支払い方法の取得に失敗しました" });
    }
  });

  // Create setup intent for adding new payment method
  app.post('/api/setup-intent', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "認証が必要です" });
      }

      const customerId = await getOrCreateStripeCustomer(userId);
      
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session',
      });

      res.json({ clientSecret: setupIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating setup intent:", error);
      res.status(500).json({ message: "セットアップインテントの作成に失敗しました" });
    }
  });

  // Delete payment method
  app.delete('/api/payment-methods/:paymentMethodId', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "認証が必要です" });
      }

      const { paymentMethodId } = req.params;
      
      // Verify the payment method belongs to the user's customer
      const customerId = await getOrCreateStripeCustomer(userId);
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      
      if (paymentMethod.customer !== customerId) {
        return res.status(403).json({ message: "この支払い方法にアクセスする権限がありません" });
      }

      await stripe.paymentMethods.detach(paymentMethodId);
      
      res.json({ message: "支払い方法を削除しました" });
    } catch (error: any) {
      console.error("Error deleting payment method:", error);
      res.status(500).json({ message: "支払い方法の削除に失敗しました" });
    }
  });

  // Set default payment method
  app.put('/api/payment-methods/:paymentMethodId/default', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "認証が必要です" });
      }

      const { paymentMethodId } = req.params;
      const customerId = await getOrCreateStripeCustomer(userId);
      
      // Verify the payment method belongs to the user's customer
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      if (paymentMethod.customer !== customerId) {
        return res.status(403).json({ message: "この支払い方法にアクセスする権限がありません" });
      }

      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
      
      res.json({ message: "デフォルト支払い方法を設定しました" });
    } catch (error: any) {
      console.error("Error setting default payment method:", error);
      res.status(500).json({ message: "デフォルト支払い方法の設定に失敗しました" });
    }
  });

  // Bidding routes
  app.post("/api/bid", [isAuthenticated, bidRateLimit], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      const { listingId, amount } = req.body;

      if (!listingId || !amount) {
        return res.status(400).json({ error: "listingId and amount are required" });
      }

      const listing = await storage.getListingById(listingId);
      if (!listing) {
        return res.status(404).json({ error: "オークションが見つかりません" });
      }

      if (listing.status !== "published") {
        return res.status(400).json({ error: "このオークションは現在入札を受け付けていません" });
      }

      if (listing.endAt && new Date() > new Date(listing.endAt)) {
        return res.status(400).json({ error: "このオークションは終了しています" });
      }

      // Allow bidding on own listings for testing purposes (admin can test)
      // if (listing.sellerId === userId) {
      //   return res.status(400).json({ error: "自分の出品には入札できません" });
      // }

      // ヤフオクスタイルの入札増額ルールを取得
      const bidIncrementSetting = await storage.getSetting("bid_increments");
      const defaultIncrements = [
        { maxPrice: 1000, increment: 10 },
        { maxPrice: 5000, increment: 50 },
        { maxPrice: 10000, increment: 100 },
        { maxPrice: 50000, increment: 250 },
        { maxPrice: 100000, increment: 500 },
        { maxPrice: 500000, increment: 1000 },
        { maxPrice: 1000000, increment: 2500 },
        { maxPrice: 5000000, increment: 5000 },
        { maxPrice: null, increment: 10000 },
      ];
      const bidIncrements: Array<{ maxPrice: number | null; increment: number }> = 
        (bidIncrementSetting?.valueJson as typeof defaultIncrements) || defaultIncrements;

      // Calculate minimum bid
      const currentPrice = parseFloat(listing.currentPrice);
      const increment = bidIncrements.find((rule) => 
        rule.maxPrice === null || currentPrice < rule.maxPrice
      )?.increment || 50000;

      const minBid = currentPrice + increment;

      if (parseFloat(amount) < minBid) {
        return res.status(400).json({ 
          error: `最低入札額は ¥${minBid.toLocaleString()} です (¥${increment.toLocaleString()} 刻み)` 
        });
      }

      // Get current highest bid to check for outbid notifications
      const previousHighestBid = await storage.getHighestBidForListing(listingId);
      
      // Use transaction for atomic bid placement with proxy bidding
      if (!userId) {
        return res.status(401).json({ error: "User authentication required" });
      }
      const bid = await storage.placeBid({
        listingId,
        bidderId: userId,
        amount: amount.toString(),
        maxBidAmount: amount.toString(), // ユーザーが入力した金額を最大入札額として使用
      });

      // Check if we need to extend auction (soft close)
      if (listing.endAt) {
        const now = new Date();
        const endAt = new Date(listing.endAt);
        const softCloseWindow = parseInt(process.env.SOFT_CLOSE_WINDOW_SEC || "120") * 1000;
        const maxExtensions = parseInt(process.env.SOFT_CLOSE_MAX_EXTENSIONS || "10");

        if (endAt.getTime() - now.getTime() < softCloseWindow && listing.extensionCount < maxExtensions) {
          await storage.extendAuction(listingId, Math.floor(softCloseWindow / 60000));
        }
      }

      await storage.logAction({
        actorId: userId,
        action: "bid_placed",
        entity: "listing",
        entityId: listingId,
        metaJson: { amount, bidId: bid.id },
      });

      // Send email notifications
      try {
        if (!userId) {
          throw new Error('User ID not available for notifications');
        }
        const bidderUser = await storage.getUser(userId);
        const sellerUser = await storage.getUser(listing.sellerId);

        if (bidderUser?.email) {
          // Send bid confirmation to bidder
          await emailService.sendBidConfirmation(bidderUser.email, listing, bid);
        }

        if (sellerUser?.email) {
          // Send new bid notification to seller
          await emailService.sendNewBidNotification(
            sellerUser.email, 
            listing, 
            bid, 
            bidderUser?.email || 'anonymous'
          );
        }

        // Send outbid notification to previous highest bidder
        if (previousHighestBid && previousHighestBid.bidderId !== userId) {
          const previousBidderUser = await storage.getUser(previousHighestBid.bidderId);
          if (previousBidderUser?.email) {
            await emailService.sendOutbidNotification(
              previousBidderUser.email,
              listing,
              previousHighestBid,
              bid
            );
          }
        }
      } catch (emailError) {
        console.error('Email notification error:', emailError);
        // Don't fail the bid if email fails
      }

      // Broadcast to SSE clients
      broadcastToSSE(listingId, {
        type: "bid", 
        data: {
          amount: amount,
          bidder: "anonymous", 
          timestamp: bid.createdAt,
        },
      });

      res.status(201).json(bid);
    } catch (error) {
      console.error("Error placing bid:", error);
      res.status(500).json({ error: "Failed to place bid" });
    }
  });

  // --- 手動入札API（ソフトクローズ込み） ---
  app.post("/api/bids", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { listingId, amount } = req.body as { listingId: string; amount: number };
      const userId = (req as any).user?.claims?.sub;

      // 最新リスティング & 価格
      const listing = await storage.getListingById(listingId);
      if (!listing || listing.status !== "published") {
        return res.status(400).json({ error: "not live" });
      }

      const lastBid = await storage.getHighestBidForListing(listingId);
      const current = lastBid?.amount ? parseFloat(lastBid.amount) : parseFloat(listing.startingPrice);

      const inc = minIncrement(current);
      const need = current + inc;
      if (amount < need) {
        return res.status(400).json({ error: "min increment not met", need });
      }

      // 入札作成
      const bid = await storage.placeBid({
        listingId,
        bidderId: userId,
        amount: amount.toString(),
        maxBidAmount: amount.toString(),
      });

      // ソフトクローズ延長
      const now = Date.now();
      const windowMs = (Number(process.env.SOFT_CLOSE_WINDOW_SEC) || 600) * 1000;
      const extendByMin = Math.floor((Number(process.env.SOFT_CLOSE_EXTEND_BY_SEC) || 600) / 60);
      const maxExt = Number(process.env.SOFT_CLOSE_MAX_EXTENSIONS) || 12;

      let newEndsAt = listing.endAt;
      if (listing.endAt && new Date(listing.endAt).getTime() - now <= windowMs && (listing.extensionCount ?? 0) < maxExt) {
        await storage.extendAuction(listingId, extendByMin);
        const nextEnds = new Date(now + (extendByMin * 60 * 1000)).toISOString();
        newEndsAt = nextEnds as any;
        auctionBus.emit("listing:extended", { listingId, endsAt: newEndsAt });
      }

      // 通知
      auctionBus.emit("bid:created", { listingId, bid: { id: bid.id, amount, userId }, endsAt: newEndsAt });
      res.json({ ok: true, id: bid.id, endsAt: newEndsAt });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "bid failed" });
    }
  });

  // --- 自動入札予約API（ProxyUpTo）---
  app.post("/api/autobids", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { listingId, maxAmount } = req.body as { listingId: string; maxAmount: number };
      const userId = (req as any).user?.claims?.sub;

      const listing = await storage.getListingById(listingId);
      if (!listing || listing.status !== "published") {
        return res.status(400).json({ error: "not live" });
      }

      // しきい値KYC（任意）
      if (maxAmount >= 1_000_000 && (req as any).user?.kycStatus !== "verified") {
        return res.status(403).json({ error: "KYC required" });
      }

      // 同一ユーザー×同一Listingは1件まで
      const existing = await storage.getAutoBidByUserAndListing(userId, listingId);
      if (existing) {
        return res.status(409).json({ error: "already scheduled" });
      }

      const offsetSec = Number(process.env.AUTOBID_FIRE_OFFSET_SEC) || 300;
      const triggerMinutes = Math.floor(offsetSec / 60); // 秒を分に変換

      const ab = await storage.createAutoBid({
        userId,
        listingId,
        maxAmount: maxAmount.toString(),
        triggerMinutes,
        strategyType: "snipe", // ProxyUpToモードはsnipeに対応
        isActive: true
      });

      res.json({ ok: true, id: ab.id });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "autobid failed" });
    }
  });

  app.get("/api/listings/:id/bids", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const bids = await storage.getBidsByListingId(req.params.id);
      res.json(bids);
    } catch (error) {
      console.error("Error fetching bids:", error);
      res.status(500).json({ error: "Failed to fetch bids" });
    }
  });

  // Comments routes
  app.post("/api/comments", [isAuthenticated, commentRateLimit], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      const validatedData = insertCommentSchema.parse({
        ...req.body,
        authorId: userId,
      });

      // Simple spam filter
      const forbiddenWords = ["spam", "fake", "scam"];
      const containsForbiddenWords = forbiddenWords.some(word => 
        validatedData.body.toLowerCase().includes(word)
      );

      if (containsForbiddenWords) {
        return res.status(400).json({ error: "コメントに不適切な内容が含まれています" });
      }

      const comment = await storage.addComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  app.get("/api/listings/:id/comments", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const comments = await storage.getCommentsByListingId(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  // Test email endpoint
  app.post('/api/test-email', async (req, res) => {
    try {
      const { to, subject } = req.body;
      const testHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">ClassicAuction テストメール</h2>
          <p>メール通知システムが正常に動作しています。</p>
          <p>送信時刻: ${new Date().toLocaleString('ja-JP')}</p>
          <hr>
          <p style="font-size: 12px; color: #666;">このメールはClassicAuctionのテスト送信です。</p>
        </div>
      `;
      
      const success = await emailService.sendEmail({
        to: to || 'matsubaryosuke@gmail.com',
        subject: subject || 'ClassicAuction テストメール',
        html: testHtml
      });
      
      res.json({ 
        success,
        message: success ? 'Test email sent successfully' : 'Failed to send test email',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Test email error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Test email failed', details: errorMessage });
    }
  });

  // Watch list routes
  app.post("/api/watch", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      const { listingId } = req.body;

      if (!listingId) {
        return res.status(400).json({ error: "listingId is required" });
      }

      if (!userId) {
        return res.status(401).json({ error: "User ID is required" });
      }
      const watch = await storage.addToWatchList({ listingId, userId });
      res.status(201).json(watch);
    } catch (error) {
      console.error("Error adding to watch list:", error);
      res.status(500).json({ error: "Failed to add to watch list" });
    }
  });

  app.delete("/api/watch/:listingId", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User ID is required" });
      }
      await storage.removeFromWatchList(req.params.listingId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing from watch list:", error);
      res.status(500).json({ error: "Failed to remove from watch list" });
    }
  });

  app.get("/api/watch", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User ID is required" });
      }
      const watchList = await storage.getWatchListByUserId(userId);
      res.json(watchList);
    } catch (error) {
      console.error("Error fetching watch list:", error);
      res.status(500).json({ error: "Failed to fetch watch list" });
    }
  });

  app.get("/api/watch/:listingId/status", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "User ID is required" });
      }
      const isWatching = await storage.isWatching(req.params.listingId, userId);
      res.json({ isWatching });
    } catch (error) {
      console.error("Error checking watch status:", error);
      res.status(500).json({ error: "Failed to check watch status" });
    }
  });

  // Admin routes
  app.get('/api/admin/users', async (req: any, res) => {
    try {
      // Try session auth first
      let userId = null;
      if (req.session?.userId) {
        userId = req.session.userId;
      } else if (req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }

      if (!userId) {
        return res.status(401).json({ message: "認証が必要です" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "管理者権限が必要です" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "ユーザー情報の取得に失敗しました" });
    }
  });

  app.patch('/api/admin/users/:userId/role', async (req: any, res) => {
    try {
      // Try session auth first
      let userId = null;
      if (req.session?.userId) {
        userId = req.session.userId;
      } else if (req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }

      if (!userId) {
        return res.status(401).json({ message: "認証が必要です" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "管理者権限が必要です" });
      }

      const { userId: targetUserId } = req.params;
      const { role } = req.body;

      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: "無効なロールです" });
      }

      await storage.updateUserRole(targetUserId, role);
      res.json({ message: "ロールが更新されました" });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "ロールの更新に失敗しました" });
    }
  });


  app.post("/api/admin/listing/:id/approve", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "認証が必要です" });
      }
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "管理者権限が必要です" });
      }

      await storage.updateListingStatus(req.params.id, "approved", userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error approving listing:", error);
      res.status(500).json({ error: "Failed to approve listing" });
    }
  });

  app.post("/api/admin/listing/:id/reject", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "認証が必要です" });
      }
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "管理者権限が必要です" });
      }

      await storage.updateListingStatus(req.params.id, "rejected", userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error rejecting listing:", error);
      res.status(500).json({ error: "Failed to reject listing" });
    }
  });

  // Admin schedule setting
  app.put("/api/admin/listings/:id/schedule", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "認証が必要です" });
      }
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "管理者権限が必要です" });
      }

      const { startAt, endAt } = req.body;
      const listingId = req.params.id;

      if (!startAt || !endAt) {
        return res.status(400).json({ error: "開始・終了時間が必要です" });
      }

      const startTime = new Date(startAt);
      const endTime = new Date(endAt);

      if (startTime >= endTime) {
        return res.status(400).json({ error: "終了時間は開始時間より後にしてください" });
      }

      const updatedListing = await storage.updateListingSchedule(listingId, startTime, endTime);

      // スケジュール設定時にステータスをapprovedに更新
      await storage.updateListingStatus(listingId, "approved", userId);

      await storage.logAction({
        actorId: userId,
        action: "listing_scheduled",
        entity: "listing",
        entityId: listingId,
      });

      res.json(updatedListing);
    } catch (error) {
      console.error("Admin schedule setting error:", error);
      res.status(500).json({ error: "スケジュール設定に失敗しました" });
    }
  });

  app.post("/api/admin/listing/:id/publish", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "認証が必要です" });
      }
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "管理者権限が必要です" });
      }

      await storage.updateListingStatus(req.params.id, "published", userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error publishing listing:", error);
      res.status(500).json({ error: "Failed to publish listing" });
    }
  });

  app.post("/api/admin/listing/:id/end", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "認証が必要です" });
      }
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "管理者権限が必要です" });
      }
      const listing = await storage.getListingById(req.params.id);
      if (!listing) {
        return res.status(404).json({ error: "オークションが見つかりません" });
      }

      const highestBid = await storage.getHighestBidForListing(req.params.id);
      const hasMetReserve = !listing.reservePrice || 
        (highestBid && parseFloat(highestBid.amount) >= parseFloat(listing.reservePrice));

      await storage.closeAuction(
        req.params.id, 
        hasMetReserve ? highestBid?.bidderId : undefined
      );

      // Send email notifications for manual auction completion
      if (hasMetReserve && highestBid) {
        try {
          const winner = await storage.getUser(highestBid.bidderId);
          const seller = await storage.getUser(listing.sellerId);

          if (winner?.email && seller?.email) {
            // Send winning notification to winner with seller contact info
            await emailService.sendWinningNotification(
              winner.email,
              listing,
              highestBid,
              seller
            );

            // Send auction end notification to seller with winner contact info
            await emailService.sendAuctionEndNotification(
              seller.email,
              listing,
              highestBid,
              winner.email
            );
          }
        } catch (emailError) {
          console.error('Manual auction completion email error:', emailError);
        }
      }

      await storage.logAction({
        actorId: userId,
        action: "listing_force_ended",
        entity: "listing",
        entityId: req.params.id,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error ending listing:", error);
      res.status(500).json({ error: "Failed to end listing" });
    }
  });

  app.delete("/api/admin/listing/:id", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "認証が必要です" });
      }
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "管理者権限が必要です" });
      }

      // This would need to be implemented in storage
      res.status(501).json({ error: "Not implemented" });
    } catch (error) {
      console.error("Error deleting listing:", error);
      res.status(500).json({ error: "Failed to delete listing" });
    }
  });

  app.get("/api/admin/dashboard", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "認証が必要です" });
      }
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "管理者権限が必要です" });
      }

      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.post("/api/admin/comment/:id/hide", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "認証が必要です" });
      }
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "管理者権限が必要です" });
      }
      await storage.hideComment(req.params.id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error hiding comment:", error);
      res.status(500).json({ error: "Failed to hide comment" });
    }
  });

  // SSE route for real-time updates
  app.get("/api/stream/auction/:id", (req, res) => {
    const listingId = req.params.id;
    
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    // Add connection to the set for this listing
    if (!sseConnections.has(listingId)) {
      sseConnections.set(listingId, new Set());
    }
    sseConnections.get(listingId)!.add(res);

    // Send keep-alive
    const keepAlive = setInterval(() => {
      res.write("event: ping\ndata: {}\n\n");
    }, 30000);

    // Clean up on disconnect
    req.on("close", () => {
      clearInterval(keepAlive);
      const connections = sseConnections.get(listingId);
      if (connections) {
        connections.delete(res);
        if (connections.size === 0) {
          sseConnections.delete(listingId);
        }
      }
    });
  });

  // Auto bid endpoints
  app.post("/api/auto-bids", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "認証が必要です" });
      }
      if (!userId) {
        return res.status(401).json({ error: "認証が必要です" });
      }

      const { listingId, maxAmount, triggerMinutes, strategyType, incrementAmount } = req.body;

      // Validate input
      if (!listingId || !maxAmount || !triggerMinutes || !strategyType) {
        return res.status(400).json({ error: "必須フィールドが不足しています" });
      }

      if (triggerMinutes < 3 || triggerMinutes > 10) {
        return res.status(400).json({ error: "実行時間は3分前から10分前の間で設定してください" });
      }

      if (maxAmount < 1000) {
        return res.status(400).json({ error: "最大入札額は1,000円以上で設定してください" });
      }

      const autoBid = await storage.createAutoBid({
        userId,
        listingId,
        maxAmount: maxAmount.toString(),
        triggerMinutes,
        strategyType,
        incrementAmount: incrementAmount ? incrementAmount.toString() : null,
        isActive: true,
      });

      res.json(autoBid);
    } catch (error) {
      console.error("Error creating auto bid:", error);
      res.status(500).json({ error: "自動入札の設定に失敗しました" });
    }
  });

  app.get("/api/auto-bids/listing/:listingId", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "認証が必要です" });
      }
      if (!userId) {
        return res.status(401).json({ error: "認証が必要です" });
      }

      const { listingId } = req.params;
      const autoBid = await storage.getAutoBidByUserAndListing(userId, listingId);
      
      res.json(autoBid);
    } catch (error) {
      console.error("Error getting auto bid:", error);
      res.status(500).json({ error: "自動入札情報の取得に失敗しました" });
    }
  });

  app.put("/api/auto-bids/:id", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "認証が必要です" });
      }
      if (!userId) {
        return res.status(401).json({ error: "認証が必要です" });
      }

      const { id } = req.params;
      const { maxAmount, triggerMinutes, strategyType, incrementAmount, isActive } = req.body;

      const autoBid = await storage.updateAutoBid(id, userId, {
        maxAmount: maxAmount ? maxAmount.toString() : undefined,
        triggerMinutes,
        strategyType,
        incrementAmount: incrementAmount ? incrementAmount.toString() : undefined,
        isActive,
      });

      if (!autoBid) {
        return res.status(404).json({ error: "自動入札設定が見つかりません" });
      }

      res.json(autoBid);
    } catch (error) {
      console.error("Error updating auto bid:", error);
      res.status(500).json({ error: "自動入札の更新に失敗しました" });
    }
  });

  app.delete("/api/auto-bids/:id", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "認証が必要です" });
      }

      const { id } = req.params;
      const success = await storage.deleteAutoBid(id, userId);

      if (!success) {
        return res.status(404).json({ error: "自動入札設定が見つかりません" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting auto bid:", error);
      res.status(500).json({ error: "自動入札の削除に失敗しました" });
    }
  });

  // Internal cron endpoint for auto bids
  app.get("/api/cron/execute-auto-bids", async (req, res) => {
    try {
      await storage.executeAutoBids();
      res.json({ success: true, message: "Auto bids executed successfully" });
    } catch (error) {
      console.error("Error executing auto bids:", error);
      res.status(500).json({ error: "Failed to execute auto bids" });
    }
  });

  // Internal cron endpoint
  app.get("/api/cron/close-expired", async (req, res) => {
    try {
      const expiredAuctions = await storage.getExpiredAuctions();
      
      for (const auction of expiredAuctions) {
        const highestBid = await storage.getHighestBidForListing(auction.id);
        const hasMetReserve = !auction.reservePrice || 
          (highestBid && parseFloat(highestBid.amount) >= parseFloat(auction.reservePrice));

        await storage.closeAuction(
          auction.id,
          hasMetReserve ? highestBid?.bidderId : undefined
        );

        // Send email notifications for auction completion
        if (hasMetReserve && highestBid) {
          try {
            const winner = await storage.getUser(highestBid.bidderId);
            const seller = await storage.getUser(auction.sellerId);

            if (winner?.email && seller?.email) {
              // Send winning notification to winner with seller contact info
              await emailService.sendWinningNotification(
                winner.email,
                auction,
                highestBid,
                seller
              );

              // Send auction end notification to seller with winner contact info
              await emailService.sendAuctionEndNotification(
                seller.email,
                auction,
                highestBid,
                winner.email
              );
            }
          } catch (emailError) {
            console.error('Auction completion email error:', emailError);
          }
        }

        // Broadcast closure to SSE clients
        broadcastToSSE(auction.id, {
          type: "auction_ended",
          data: {
            status: hasMetReserve ? "sold" : "unsold",
            winningBid: hasMetReserve ? highestBid?.amount : null,
          },
        });
      }

      res.json({ processed: expiredAuctions.length });
    } catch (error) {
      console.error("Error processing expired auctions:", error);
      res.status(500).json({ error: "Failed to process expired auctions" });
    }
  });

  // Get bidder profile with bid and comment history
  app.get("/api/users/:userId/profile", async (req, res) => {
    try {
      const { userId } = req.params;
      
      const profile = await storage.getBidderProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(profile);
    } catch (error) {
      console.error("Error fetching bidder profile:", error);
      res.status(500).json({ error: "Failed to fetch bidder profile" });
    }
  });

  // Get seller basic info
  app.get("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Return basic user info (don't expose sensitive data)
      const { password, ...userInfo } = user as any;
      res.json(userInfo);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Get seller's listings
  app.get("/api/users/:id/listings", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verify user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get all listings for this seller
      const allListings = await storage.getListings({});
      const sellerListings = allListings.filter(listing => listing.sellerId === id);
      
      res.json(sellerListings);
    } catch (error) {
      console.error("Error fetching seller listings:", error);
      res.status(500).json({ error: "Failed to fetch seller listings" });
    }
  });

  // Sitemap
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const listings = await storage.getListings({ status: "published", limit: 1000 });
      
      const urls = [
        { loc: "/", changefreq: "daily", priority: "1.0" },
        ...listings.map(listing => ({
          loc: `/listing/${listing.slug}`,
          changefreq: "hourly",
          priority: "0.8",
          lastmod: listing.updatedAt?.toISOString().split('T')[0],
        })),
      ];

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>https://${req.hostname}${url.loc}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`;

      res.set('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).send("Error generating sitemap");
    }
  });

  // Robots.txt
  app.get("/robots.txt", (req, res) => {
    const robotsTxt = `User-agent: *
Allow: /
Sitemap: https://${req.hostname}/sitemap.xml`;
    res.set('Content-Type', 'text/plain');
    res.send(robotsTxt);
  });

  // Email change request endpoint
  app.post("/api/request-email-change", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const validatedData = emailChangeSchema.parse(req.body);
      
      // Check if email is already in use
      const existingUser = await storage.getUserByEmail(validatedData.newEmail);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: "このメールアドレスは既に使用されています" });
      }

      // Generate token and send verification email
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      const updatedUser = await storage.requestEmailChange(userId, validatedData.newEmail, token);
      
      // Send verification email
      await emailService.sendEmailChangeVerification(
        validatedData.newEmail,
        token,
        updatedUser.username || updatedUser.firstName || "ユーザー"
      );
      
      res.json({ 
        success: true, 
        message: "新しいメールアドレスに認証メールを送信しました。メールをご確認ください。"
      });
    } catch (error: any) {
      console.error("Error requesting email change:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: error.errors[0]?.message || "入力データが無効です" });
      }
      res.status(500).json({ error: "メールアドレス変更リクエストに失敗しました" });
    }
  });

  // Email verification endpoint
  app.get("/api/verify-email-change", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== "string") {
        return res.status(400).send(`
          <html>
            <head><title>認証エラー</title></head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; text-align: center;">
              <h2>認証エラー</h2>
              <p>無効な認証トークンです。</p>
              <a href="/">トップページに戻る</a>
            </body>
          </html>
        `);
      }

      const updatedUser = await storage.verifyEmailChange(token);
      
      if (!updatedUser) {
        return res.status(400).send(`
          <html>
            <head><title>認証失敗</title></head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; text-align: center;">
              <h2>認証失敗</h2>
              <p>認証トークンが無効または期限切れです。新しい認証メールをリクエストしてください。</p>
              <a href="/profile">プロフィールページに戻る</a>
            </body>
          </html>
        `);
      }

      res.send(`
        <html>
          <head><title>認証完了</title></head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; text-align: center;">
            <h2>メールアドレス変更完了！</h2>
            <p>メールアドレスが正常に変更されました。</p>
            <p><strong>新しいメールアドレス:</strong> ${updatedUser.email}</p>
            <a href="/profile" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">プロフィールページへ</a>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("Error verifying email change:", error);
      res.status(500).send(`
        <html>
          <head><title>サーバーエラー</title></head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; text-align: center;">
            <h2>サーバーエラー</h2>
            <p>認証処理中にエラーが発生しました。しばらく待ってから再度お試しください。</p>
            <a href="/">トップページに戻る</a>
          </body>
        </html>
      `);
    }
  });

  // Image proxy route to serve object storage files
  app.get("/image/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      
      const objectStorageService = new ObjectStorageService();
      
      try {
        // Try to get the image from object storage
        const imageStream = await objectStorageService.getObject(`uploads/${filename}`, ObjectPermission.READ);
        
        // Set appropriate headers
        res.set('Content-Type', 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        
        // Pipe the image stream to response
        imageStream.pipe(res);
      } catch (error) {
        console.error('Error serving image:', filename, error);
        res.status(404).json({ error: 'Image not found' });
      }
    } catch (error) {
      console.error('Image proxy error:', error);
      res.status(500).json({ error: 'Failed to serve image' });
    }
  });

  // Demo routes for testing
  app.post("/api/demo/start-bidding", async (req, res) => {
    demoBiddingBot.start();
    res.json({ message: "Demo bidding bot started" });
  });

  app.post("/api/demo/stop-bidding", async (req, res) => {
    demoBiddingBot.stop();
    res.json({ message: "Demo bidding bot stopped" });
  });

  // Start demo bot automatically for testing
  setTimeout(() => {
    demoBiddingBot.start();
    console.log("🚀 Demo bidding bot started automatically");
  }, 5000);

  // Auto bid execution cron job - runs every minute
  cron.schedule('* * * * *', async () => {
    try {
      await storage.executeAutoBids();
    } catch (error) {
      console.error('Failed to execute auto bids:', error);
    }
  });

  // Enhanced Vehicle API with Japanese language support and vPIC integration
  type Category = "car" | "motorcycle";
  const vehicleCache = new Map<string, string[]>();

  async function readJsonIfExists(...segments: string[]) {
    try {
      const p = path.resolve(process.cwd(), ...segments);
      console.log(`DEBUG: Attempting to read file at: ${p}`);
      const data = fs.readFileSync(p, 'utf-8');
      const parsed = JSON.parse(data);
      console.log(`DEBUG: Successfully loaded JSON with keys:`, Object.keys(parsed));
      return parsed;
    } catch (err: any) {
      console.log(`DEBUG: Failed to read ${segments.join('/')}: ${err.message}`);
      return null;
    }
  }

  const uniqSort = (arr: string[]) =>
    Array.from(new Set(arr)).filter(Boolean).sort((a, b) => a.localeCompare(b));

  async function fetchModelsFromVPIC(make: string, year: number, category: Category) {
    const base = "https://vpic.nhtsa.dot.gov/api/vehicles";
    const url =
      category === "motorcycle"
        ? `${base}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}/vehicletype/motorcycle?format=json`
        : `${base}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`vPIC error ${res.status}`);
    const j = await res.json();
    return uniqSort(
      (j?.Results ?? [])
        .map((r: any) => (r.Model_Name || r.ModelName || r.Model || "").trim())
    );
  }

  // Health check
  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  // Countries endpoint
  app.get("/api/vehicle/countries", async (req: Request, res: Response) => {
    const countries = [
      { value: "all", label: "すべての国" },
      { value: "japan", label: "日本" },
      { value: "germany", label: "ドイツ" },
      { value: "italy", label: "イタリア" },
      { value: "usa", label: "アメリカ" },
      { value: "france", label: "フランス" },
      { value: "uk", label: "イギリス" },
      { value: "sweden", label: "スウェーデン" }
    ];
    res.json({ countries });
  });

  // Makes endpoint with Japanese display names and country filtering
  app.get("/api/vehicle/makes", async (req: Request, res: Response) => {
    const category = String(req.query.category || "car").toLowerCase() as Category;
    const country = String(req.query.country || "all").toLowerCase();

    // Enhanced Japanese make mapping
    const enToJaMapping: Record<string, string> = {
      "Honda": "ホンダ",
      "Toyota": "トヨタ", 
      "Nissan": "ニッサン",
      "Mazda": "マツダ",
      "Mitsubishi": "三菱",
      "Subaru": "スバル",
      "Suzuki": "スズキ",
      "Daihatsu": "ダイハツ",
      "Isuzu": "いすゞ",
      "Lexus": "レクサス",
      "Hino": "日野",
      "BMW": "BMW",
      "Mercedes-Benz": "メルセデス・ベンツ", 
      "Ford": "フォード",
      "Lincoln": "リンカーン",
      "Mercury": "マーキュリー",
      "Chevrolet": "シボレー",
      "GMC": "GMC",
      "Pontiac": "ポンティアック",
      "Buick": "ビュイック",
      "Oldsmobile": "オールズモビル",
      "Cadillac": "キャデラック",
      "Saturn": "サターン",
      "Geo": "ジオ",
      "Chrysler": "クライスラー",
      "Dodge": "ダッジ",
      "Plymouth": "プリムス",
      "Jeep": "ジープ",
      "Eagle": "イーグル",
      "Audi": "アウディ",
      "Volkswagen": "フォルクスワーゲン",
      "Porsche": "ポルシェ",
      "Jaguar": "ジャガー",
      "Aston Martin": "アストンマーティン",
      "Rolls-Royce": "ロールス・ロイス",
      "Bentley": "ベントレー",
      "Lotus": "ロータス",
      "Ferrari": "フェラーリ",
      "Lamborghini": "ランボルギーニ",
      "Maserati": "マセラティ",
      "Alfa Romeo": "アルファロメオ",
      "Peugeot": "プジョー",
      "Citroën": "シトロエン",
      "Renault": "ルノー",
      "Alpine": "アルピーヌ",
      "Bugatti": "ブガッティ",
      "AMC": "AMC",
      "Studebaker": "スタデベーカー",
      "Packard": "パッカード",
      "Hudson": "ハドソン",
      "Nash": "ナッシュ",
      "Kaiser": "カイザー",
      "Frazer": "フレイザー",
      "Willys": "ウィリス",
      "International Harvester": "インターナショナル・ハーベスター",
      "DeLorean": "デロリアン",
      "AM General": "AMゼネラル",
      // Motorcycle mappings
      "Harley-Davidson": "ハーレーダビッドソン",
      "Ducati": "ドゥカティ",
      "Triumph": "トライアンフ",
      "Kawasaki": "カワサキ",
      "Yamaha": "ヤマハ",
      "Norton": "ノートン",
      "Vespa": "ベスパ",
      "Gilera": "ジレラ",
      "BSA": "BSA",
      "Royal Enfield": "ロイヤルエンフィールド",
      "Ariel": "アリエル",
      "Matchless": "マチレス",
      "AJS": "AJS",
      "Velocette": "ベロセット",
      "Vincent": "ビンセント"
    };

    // Define manufacturers by country
    const makesByCountry = {
      japan: category === "motorcycle" 
        ? ["Honda", "Yamaha", "Kawasaki", "Suzuki"]
        : ["Toyota", "Nissan", "Honda", "Mazda", "Subaru", "Mitsubishi", "Suzuki", "Daihatsu", "Lexus", "Isuzu"],
      germany: category === "motorcycle"
        ? ["BMW"]
        : ["BMW", "Mercedes-Benz", "Audi", "Volkswagen", "Porsche"],
      italy: category === "motorcycle"
        ? ["Ducati", "Aprilia", "Moto Guzzi", "Benelli"]
        : ["Ferrari", "Lamborghini", "Maserati", "Alfa Romeo", "Fiat"],
      usa: category === "motorcycle"
        ? ["Harley-Davidson", "Indian"]
        : ["Ford", "Lincoln", "Mercury", "Chevrolet", "GMC", "Pontiac", "Buick", "Oldsmobile", "Cadillac", "Saturn", "Geo", "Chrysler", "Dodge", "Plymouth", "Jeep", "Eagle", "AMC", "Studebaker", "Packard", "Hudson", "Nash", "Kaiser", "Frazer", "Willys", "International Harvester", "DeLorean", "AM General"],
      france: category === "motorcycle"
        ? []
        : ["Peugeot", "Citroën", "Renault", "Alpine", "Bugatti"],
      uk: category === "motorcycle"
        ? ["Triumph", "Norton"]
        : ["Jaguar", "Aston Martin", "Rolls-Royce", "Bentley", "Lotus"],
      sweden: category === "motorcycle"
        ? []
        : ["Volvo", "Saab"]
    };

    const asset = await readJsonIfExists("attached_assets", "makes.json");
    if (asset && Array.isArray(asset[category])) {
      let filteredMakes = asset[category];
      
      // Apply country filtering if not "all"
      if (country !== "all" && makesByCountry[country as keyof typeof makesByCountry]) {
        const countryMakes = makesByCountry[country as keyof typeof makesByCountry];
        filteredMakes = asset[category].filter(make => countryMakes.includes(make));
      }
      
      const japaneseNames = filteredMakes.map(make => enToJaMapping[make] || make);
      return res.json({ makes: uniqSort(japaneseNames) });
    }

    let fallback: string[] = [];
    if (country === "all" || !makesByCountry[country as keyof typeof makesByCountry]) {
      // Return all manufacturers
      fallback = Object.values(makesByCountry).flat();
    } else {
      // Return only manufacturers from selected country
      fallback = makesByCountry[country as keyof typeof makesByCountry] || [];
    }
    
    // Convert to Japanese names and sort by Japanese manufacturer size
    const japaneseNames = fallback.map(make => enToJaMapping[make] || make);
    
    // Define order for Japanese manufacturers by size (largest first)
    const japaneseOrder = ["トヨタ", "ニッサン", "ホンダ", "マツダ", "スバル", "三菱", "スズキ", "ダイハツ", "レクサス", "いすゞ"];
    const motorcycleOrder = ["ホンダ", "ヤマハ", "カワサキ", "スズキ"];
    
    const ordered = category === "motorcycle" ? motorcycleOrder : japaneseOrder;
    const orderedMakes: string[] = [];
    const remainingMakes: string[] = [];
    
    // First add Japanese manufacturers in order
    for (const make of ordered) {
      if (japaneseNames.includes(make)) {
        orderedMakes.push(make);
      }
    }
    
    // Then add remaining manufacturers alphabetically
    for (const make of japaneseNames) {
      if (!ordered.includes(make)) {
        remainingMakes.push(make);
      }
    }
    
    remainingMakes.sort((a, b) => a.localeCompare(b, "ja"));
    
    res.json({ makes: [...orderedMakes, ...remainingMakes] });
  });

  // Direct models API implementation with enhanced Japanese support
  app.get("/api/models", async (req: Request, res: Response) => {
    const category = String(req.query.category ?? "");
    const make = String(req.query.make ?? "");
    const year = Number(req.query.year ?? 0);

    console.log(`=== Models API Called: ${make} ${category} ${year} ===`);

    if (!category || !make || !year) {
      return res.status(400).json({ message: "category, make, year are required" });
    }

    // Japanese to English mapping for API calls
    const jaToEnMapping: Record<string, string> = {
      "ホンダ": "Honda",
      "トヨタ": "Toyota", 
      "ニッサン": "Nissan",
      "マツダ": "Mazda",
      "三菱": "Mitsubishi",
      "スバル": "Subaru",
      "スズキ": "Suzuki",
      "ダイハツ": "Daihatsu",
      "いすゞ": "Isuzu",
      "レクサス": "Lexus",
      "日野": "Hino",
      "BMW": "BMW",
      "メルセデス・ベンツ": "Mercedes-Benz", 
      "フォード": "Ford",
      "リンカーン": "Lincoln",
      "マーキュリー": "Mercury",
      "シボレー": "Chevrolet",
      "GMC": "GMC",
      "ポンティアック": "Pontiac",
      "ビュイック": "Buick",
      "オールズモビル": "Oldsmobile",
      "キャデラック": "Cadillac",
      "サターン": "Saturn",
      "ジオ": "Geo",
      "クライスラー": "Chrysler",
      "ダッジ": "Dodge",
      "プリムス": "Plymouth",
      "ジープ": "Jeep",
      "イーグル": "Eagle",
      "AMC": "AMC",
      "スタデベーカー": "Studebaker",
      "パッカード": "Packard",
      "ハドソン": "Hudson",
      "ナッシュ": "Nash",
      "カイザー": "Kaiser",
      "フレイザー": "Frazer",
      "ウィリス": "Willys",
      "インターナショナル・ハーベスター": "International Harvester",
      "デロリアン": "DeLorean",
      "AMゼネラル": "AM General",
      "アウディ": "Audi",
      "フォルクスワーゲン": "Volkswagen",
      "ポルシェ": "Porsche",
      "ジャガー": "Jaguar",
      "アストンマーティン": "Aston Martin",
      "ロールス・ロイス": "Rolls-Royce",
      "ベントレー": "Bentley",
      "ロータス": "Lotus",
      "フェラーリ": "Ferrari",
      "ランボルギーニ": "Lamborghini",
      "マセラティ": "Maserati",
      "アルファロメオ": "Alfa Romeo",
      "プジョー": "Peugeot",
      "シトロエン": "Citroën",
      "ルノー": "Renault",
      "アルピーヌ": "Alpine",
      "ブガッティ": "Bugatti",
      "ボルボ": "Volvo",
      "サーブ": "Saab",
      // Motorcycle mappings
      "ハーレーダビッドソン": "Harley-Davidson",
      "ドゥカティ": "Ducati",
      "トライアンフ": "Triumph",
      "カワサキ": "Kawasaki",
      "ヤマハ": "Yamaha",
      "ノートン": "Norton",
      "ベスパ": "Vespa",
      "ジレラ": "Gilera",
      "BSA": "BSA",
      "ロイヤルエンフィールド": "Royal Enfield",
      "アリエル": "Ariel",
      "マチレス": "Matchless",
      "AJS": "AJS",
      "ベロセット": "Velocette",
      "ビンセント": "Vincent"
    };

    // Enhanced Japanese make mapping for database lookup
    const makeMapping: Record<string, string> = {
      "Honda": "ホンダ",
      "Toyota": "トヨタ", 
      "Nissan": "ニッサン",
      "Mazda": "マツダ",
      "Mitsubishi": "三菱",
      "Subaru": "スバル",
      "Suzuki": "スズキ",
      "Daihatsu": "ダイハツ",
      "Isuzu": "いすゞ",
      "Lexus": "レクサス",
      "Hino": "日野",
      "BMW": "BMW",
      "Mercedes-Benz": "メルセデス・ベンツ", 
      "Ford": "フォード",
      "Lincoln": "リンカーン",
      "Mercury": "マーキュリー",
      "Chevrolet": "シボレー",
      "GMC": "GMC",
      "Pontiac": "ポンティアック",
      "Buick": "ビュイック",
      "Oldsmobile": "オールズモビル",
      "Cadillac": "キャデラック",
      "Saturn": "サターン",
      "Geo": "ジオ",
      "Chrysler": "クライスラー",
      "Dodge": "ダッジ",
      "Plymouth": "プリムス",
      "Jeep": "ジープ",
      "Eagle": "イーグル",
      "Audi": "アウディ",
      "Volkswagen": "フォルクスワーゲン",
      "Porsche": "ポルシェ",
      "Jaguar": "ジャガー",
      "Aston Martin": "アストンマーティン",
      "Rolls-Royce": "ロールス・ロイス",
      "Bentley": "ベントレー",
      "Lotus": "ロータス",
      "Ferrari": "フェラーリ",
      "Lamborghini": "ランボルギーニ",
      "Maserati": "マセラティ",
      "Alfa Romeo": "アルファロメオ",
      "Peugeot": "プジョー",
      "Citroën": "シトロエン",
      "Renault": "ルノー",
      "Alpine": "アルピーヌ",
      "Bugatti": "ブガッティ",
      "Volvo": "ボルボ",
      "Saab": "サーブ",
      "AMC": "AMC",
      "Studebaker": "スタデベーカー",
      "Packard": "パッカード",
      "Hudson": "ハドソン",
      "Nash": "ナッシュ",
      "Kaiser": "カイザー",
      "Frazer": "フレイザー",
      "Willys": "ウィリス",
      "International Harvester": "インターナショナル・ハーベスター",
      "DeLorean": "デロリアン",
      "AM General": "AMゼネラル",
      // Motorcycle mappings
      "Harley-Davidson": "ハーレーダビッドソン",
      "Ducati": "ドゥカティ",
      "Triumph": "トライアンフ",
      "Kawasaki": "カワサキ",
      "Yamaha": "ヤマハ",
      "Norton": "ノートン",
      "Vespa": "ベスパ",
      "Gilera": "ジレラ",
      "BSA": "BSA",
      "Royal Enfield": "ロイヤルエンフィールド",
      "Ariel": "アリエル",
      "Matchless": "マチレス",
      "AJS": "AJS",
      "Velocette": "ベロセット",
      "Vincent": "ビンセント"
    };

    try {
      // Convert Japanese make name to English for database lookup
      const makeEn = jaToEnMapping[make] || make;
      const makeJa = makeMapping[makeEn] || makeEn;
      console.log(`Request: make=${make}, makeEn=${makeEn}, makeJa=${makeJa}, category=${category}, year=${year}`);
      
      // Load models.seed.json for both car and motorcycle data
      const seedPath = path.join(process.cwd(), "data", "models.seed.json");
      if (fs.existsSync(seedPath)) {
        const seed = JSON.parse(fs.readFileSync(seedPath, "utf-8"));
        let periods: Array<{model: string, from: number, to: number}> = [];
        
        if (category === "car" && makeJa) {
          periods = (seed.car_periods as Record<string, Array<{model: string, from: number, to: number}>>)?.[makeJa] ?? [];
        } else if (category === "motorcycle") {
          // For motorcycles, try both original make and Japanese mapping
          periods = (seed.motorcycle_periods as Record<string, Array<{model: string, from: number, to: number}>>)?.[make] ?? 
                   (seed.motorcycle_periods as Record<string, Array<{model: string, from: number, to: number}>>)?.[makeJa] ?? [];
        }
        
        const models = new Set<string>();
        console.log(`Looking for models: ${makeJa} (${make}) in year ${year}, found ${periods.length} periods`);
        
        for (const p of periods) {
          if (typeof p.from !== "number" || typeof p.to !== "number") continue;
          if (year >= p.from && year <= p.to) models.add(p.model);
        }
        
        console.log(`Found ${models.size} models matching year ${year} from ${periods.length} total periods`);
        
        if (models.size > 0) {
          const result = Array.from(models).sort((a, b) => a.localeCompare(b, "ja"));
          console.log(`Returning ${result.length} models from Japanese system`);
          return res.json({ models: result });
        }
      }

      // Fallback to old system  
      console.log(`Falling back to old system for ${make}`);
      const modelsPath = path.join(process.cwd(), "data", "models.json");
      const modelsData = JSON.parse(fs.readFileSync(modelsPath, "utf-8"));
      
      const byCat = modelsData[category] ?? {};
      const byMake = byCat[make] ?? {};
      const result: string[] = [];

      for (const range in byMake) {
        const [from, to] = range.split("-").map(Number);
        if (year >= from && year <= to) {
          result.push(...byMake[range]);
        }
      }
      
      console.log(`Old system returned ${result.length} models`);
      res.json({ models: Array.from(new Set(result)) });
    } catch (error) {
      console.error("Failed to load models data:", error);
      res.status(500).json({ message: "Failed to load vehicle models" });
    }
  });

  // Legacy API compatibility endpoints
  app.get("/api/makes", async (req: Request, res: Response) => {
    // Forward to new vehicle API
    const category = String(req.query.category || "car");
    const newReq = { ...req, query: { category } };
    return app._router.handle({ ...newReq, url: "/api/vehicle/makes", method: "GET" } as any, res);
  });

  app.get("/api/years", (req: Request, res: Response) => {
    const category = String(req.query.category || "car");
    
    // Different year ranges for different categories
    const years = [];
    if (category === "car") {
      // Classic cars: 1950-1995 (main historical data range)
      for (let y = 1995; y >= 1950; y--) years.push(y);
    } else if (category === "motorcycle") {
      // Classic motorcycles: 1946-1995 (includes post-war models)
      for (let y = 1995; y >= 1946; y--) years.push(y);
    } else {
      // Default range
      for (let y = 1995; y >= 1950; y--) years.push(y);
    }
    
    res.json({ years });
  });



  const httpServer = createServer(app);

  return httpServer;
}


