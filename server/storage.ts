import { type User, type InsertUser, type Vehicle, type InsertVehicle, type Bid, type InsertBid, type Favorite, type InsertFavorite, type VehicleWithBids, type BidUpdate } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Vehicle methods
  getVehicles(filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    yearFrom?: number;
    yearTo?: number;
    brand?: string;
    search?: string;
  }): Promise<VehicleWithBids[]>;
  getVehicle(id: string): Promise<VehicleWithBids | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehiclePrice(vehicleId: string, newPrice: string, bidCount: number): Promise<void>;

  // Bid methods
  getBidsForVehicle(vehicleId: string): Promise<Bid[]>;
  createBid(bid: InsertBid): Promise<Bid>;
  getLatestBidForVehicle(vehicleId: string): Promise<Bid | undefined>;

  // Favorite methods
  getFavoritesForUser(userId: string): Promise<Favorite[]>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: string, vehicleId: string): Promise<void>;
  isFavorited(userId: string, vehicleId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private vehicles: Map<string, Vehicle>;
  private bids: Map<string, Bid>;
  private favorites: Map<string, Favorite>;

  constructor() {
    this.users = new Map();
    this.vehicles = new Map();
    this.bids = new Map();
    this.favorites = new Map();
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    // Create sample vehicles
    const sampleVehicles: InsertVehicle[] = [
      {
        title: "トヨタ カムリ ハイブリッド",
        description: "2023年式トヨタカムリハイブリッド。走行距離12,000km。車検2年付き。",
        category: "car",
        brand: "トヨタ",
        model: "カムリ",
        year: 2023,
        mileage: 12000,
        imageUrl: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        startingPrice: "2500000",
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        isActive: true,
        sellerId: "seller1",
      },
      {
        title: "ホンダ CBR600RR",
        description: "2022年式ホンダCBR600RR。走行距離8,500km。メンテナンス記録完備。",
        category: "motorcycle",
        brand: "ホンダ",
        model: "CBR600RR",
        year: 2022,
        mileage: 8500,
        imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        startingPrice: "1000000",
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
        isActive: true,
        sellerId: "seller1",
      },
      {
        title: "BMW X5 xDrive35d",
        description: "2021年式BMW X5 xDrive35d。走行距離35,000km。ディーラー整備済み。",
        category: "car",
        brand: "BMW",
        model: "X5",
        year: 2021,
        mileage: 35000,
        imageUrl: "https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        startingPrice: "3800000",
        endTime: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
        isActive: true,
        sellerId: "seller1",
      },
      {
        title: "日産 スカイライン GT-R",
        description: "2020年式日産スカイラインGT-R。走行距離18,000km。限定カラー。",
        category: "car",
        brand: "日産",
        model: "スカイライン GT-R",
        year: 2020,
        mileage: 18000,
        imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        startingPrice: "10000000",
        endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        isActive: true,
        sellerId: "seller1",
      },
      {
        title: "カワサキ Ninja ZX-10R",
        description: "2023年式カワサキNinja ZX-10R。走行距離3,200km。レース用改造パーツ付き。",
        category: "motorcycle",
        brand: "カワサキ",
        model: "Ninja ZX-10R",
        year: 2023,
        mileage: 3200,
        imageUrl: "https://pixabay.com/get/g28f59bb8902e14bb2b1fd95c0d26a68f41565a0de573b10ed0047d0ee9735fa92fb14b8988e5981a28a42b4179a1e73816da4e539f6465d6e241fe9e9e9980d6_1280.jpg",
        startingPrice: "1500000",
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        isActive: true,
        sellerId: "seller1",
      },
      {
        title: "メルセデスベンツ Cクラス",
        description: "2022年式メルセデスベンツCクラス。走行距離22,000km。ワンオーナー車。",
        category: "car",
        brand: "メルセデスベンツ",
        model: "Cクラス",
        year: 2022,
        mileage: 22000,
        imageUrl: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        startingPrice: "4500000",
        endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
        isActive: true,
        sellerId: "seller1",
      },
    ];

    for (const vehicleData of sampleVehicles) {
      const vehicle = await this.createVehicle(vehicleData);
      // Add some initial bids
      const bidAmount = parseInt(vehicleData.startingPrice) + Math.floor(Math.random() * 500000);
      await this.createBid({
        vehicleId: vehicle.id,
        bidderId: "bidder1",
        amount: bidAmount.toString(),
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getVehicles(filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    yearFrom?: number;
    yearTo?: number;
    brand?: string;
    search?: string;
  }): Promise<VehicleWithBids[]> {
    let vehicles = Array.from(this.vehicles.values()).filter(v => v.isActive);

    if (filters) {
      if (filters.category && filters.category !== "all") {
        vehicles = vehicles.filter(v => v.category === filters.category);
      }
      if (filters.minPrice) {
        vehicles = vehicles.filter(v => parseFloat(v.currentPrice) >= filters.minPrice!);
      }
      if (filters.maxPrice) {
        vehicles = vehicles.filter(v => parseFloat(v.currentPrice) <= filters.maxPrice!);
      }
      if (filters.yearFrom) {
        vehicles = vehicles.filter(v => v.year >= filters.yearFrom!);
      }
      if (filters.yearTo) {
        vehicles = vehicles.filter(v => v.year <= filters.yearTo!);
      }
      if (filters.brand && filters.brand !== "all") {
        vehicles = vehicles.filter(v => v.brand === filters.brand);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        vehicles = vehicles.filter(v => 
          v.title.toLowerCase().includes(search) ||
          v.brand.toLowerCase().includes(search) ||
          v.model.toLowerCase().includes(search)
        );
      }
    }

    // Sort by end time (soonest first)
    vehicles.sort((a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime());

    const vehiclesWithBids: VehicleWithBids[] = [];
    for (const vehicle of vehicles) {
      const latestBid = await this.getLatestBidForVehicle(vehicle.id);
      vehiclesWithBids.push({
        ...vehicle,
        latestBid,
      });
    }

    return vehiclesWithBids;
  }

  async getVehicle(id: string): Promise<VehicleWithBids | undefined> {
    const vehicle = this.vehicles.get(id);
    if (!vehicle) return undefined;

    const latestBid = await this.getLatestBidForVehicle(id);
    return {
      ...vehicle,
      latestBid,
    };
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = randomUUID();
    const vehicle: Vehicle = {
      ...insertVehicle,
      id,
      currentPrice: insertVehicle.startingPrice,
      bidCount: 0,
      createdAt: new Date(),
    };
    this.vehicles.set(id, vehicle);
    return vehicle;
  }

  async updateVehiclePrice(vehicleId: string, newPrice: string, bidCount: number): Promise<void> {
    const vehicle = this.vehicles.get(vehicleId);
    if (vehicle) {
      vehicle.currentPrice = newPrice;
      vehicle.bidCount = bidCount;
      this.vehicles.set(vehicleId, vehicle);
    }
  }

  async getBidsForVehicle(vehicleId: string): Promise<Bid[]> {
    return Array.from(this.bids.values())
      .filter(bid => bid.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createBid(insertBid: InsertBid): Promise<Bid> {
    const id = randomUUID();
    const bid: Bid = {
      ...insertBid,
      id,
      createdAt: new Date(),
    };
    this.bids.set(id, bid);
    
    // Update vehicle price and bid count
    const currentBids = await this.getBidsForVehicle(insertBid.vehicleId);
    await this.updateVehiclePrice(
      insertBid.vehicleId,
      insertBid.amount,
      currentBids.length
    );
    
    return bid;
  }

  async getLatestBidForVehicle(vehicleId: string): Promise<Bid | undefined> {
    const bids = await this.getBidsForVehicle(vehicleId);
    return bids[0]; // First one is latest due to sorting
  }

  async getFavoritesForUser(userId: string): Promise<Favorite[]> {
    return Array.from(this.favorites.values()).filter(fav => fav.userId === userId);
  }

  async addFavorite(insertFavorite: InsertFavorite): Promise<Favorite> {
    const id = randomUUID();
    const favorite: Favorite = {
      ...insertFavorite,
      id,
      createdAt: new Date(),
    };
    this.favorites.set(id, favorite);
    return favorite;
  }

  async removeFavorite(userId: string, vehicleId: string): Promise<void> {
    for (const [id, favorite] of this.favorites.entries()) {
      if (favorite.userId === userId && favorite.vehicleId === vehicleId) {
        this.favorites.delete(id);
        break;
      }
    }
  }

  async isFavorited(userId: string, vehicleId: string): Promise<boolean> {
    return Array.from(this.favorites.values()).some(
      fav => fav.userId === userId && fav.vehicleId === vehicleId
    );
  }
}

export const storage = new MemStorage();
