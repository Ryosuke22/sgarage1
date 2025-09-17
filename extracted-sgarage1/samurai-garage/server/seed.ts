import { db } from "./db.js";
import { users, listings, bids, watchList, comments } from "../shared/schema.js";
import bcrypt from "bcrypt";

// Sample Japanese classic vehicle data
const sampleUsers = [
  {
    id: "demo-seller-1",
    username: "ClassicCarCollector",
    email: "collector@example.com",
    role: "user" as const,
    bio: "Passionate collector of Japanese classics with 20+ years experience",
    avatarUrl: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null
  },
  {
    id: "demo-seller-2", 
    username: "TokyoDrifter",
    email: "drift@example.com",
    role: "user" as const,
    bio: "JDM enthusiast specializing in 90s performance cars",
    avatarUrl: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null
  },
  {
    id: "demo-buyer-1",
    username: "VintageHunter",
    email: "hunter@example.com", 
    role: "user" as const,
    bio: "Always looking for rare vintage motorcycles",
    avatarUrl: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null
  },
  {
    id: "demo-admin",
    username: "Admin",
    email: "admin@samuraigarage.com",
    role: "admin" as const,
    bio: "Samurai Garage administrator",
    avatarUrl: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null
  },
  {
    id: "samurai-user-1",
    username: "SamuraiGarage1",
    email: "samuraigarage1@gmail.com",
    role: "admin" as const,
    bio: "Japanese classic car enthusiast and platform administrator",
    avatarUrl: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null
  }
];

const sampleListings = [
  {
    id: "listing-1",
    sellerId: "demo-seller-1",
    title: "1993 Honda NSX Type R - Original Paint",
    slug: "1993-honda-nsx-type-r-original-paint",
    description: `Exceptional 1993 Honda NSX Type R in Championship White. This is a genuine Type R with the lightweight package, including aluminum body panels and stripped interior. 

Original paint with minimal wear, 87,000 km on the odometer. Meticulously maintained with full service history. Recent timing belt service completed.

Features:
• Original C30A 3.0L V6 engine
• 5-speed manual transmission  
• Recaro seats with Type R embroidery
• Carbon fiber dashboard
• Original Mugen wheels
• Complete tool kit and spare key

A true collector's piece in pristine condition.`,
    category: "car" as const,
    make: "Honda", 
    model: "NSX",
    year: 1993,
    mileage: 87000,
    locationText: "Tokyo, Japan",
    startingPrice: "65000.00",
    reservePrice: "85000.00",
    currentPrice: "78000.00",
    status: "published" as const,
    startAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    endAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    specifications: JSON.stringify({
      engine: "3.0L V6",
      transmission: "5-speed manual",
      drivetrain: "RWD", 
      fuelType: "Gasoline",
      color: "Championship White",
      interiorColor: "Black"
    })
  },
  {
    id: "listing-2",
    sellerId: "demo-seller-2",
    title: "1994 Mazda RX-7 FD3S Type RZ",
    slug: "1994-mazda-rx7-fd3s-type-rz",
    description: `Stunning 1994 Mazda RX-7 FD3S Type RZ in Vintage Red. This is the top-spec Type RZ model with the twin-turbo 13B-REW rotary engine.

Recent engine rebuild with all new seals and gaskets. Suspension refreshed with Bilstein dampers. Interior is in excellent condition with minimal wear.

Modifications:
• HKS intake system
• Trust intercooler 
• Apexi exhaust system
• Upgraded turbochargers
• Recaro bucket seats

Comprehensive maintenance records available. Ready for the track or weekend drives.`,
    category: "car" as const,
    make: "Mazda",
    model: "RX-7", 
    year: 1994,
    mileage: 125000,
    locationText: "Osaka, Japan",
    startingPrice: "40000.00",
    reservePrice: "55000.00",
    currentPrice: "52000.00",
    status: "published" as const,
    startAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    endAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    specifications: JSON.stringify({
      engine: "1.3L Twin-Turbo Rotary",
      transmission: "5-speed manual",
      drivetrain: "RWD",
      fuelType: "Gasoline", 
      color: "Vintage Red",
      interiorColor: "Black"
    })
  },
  {
    id: "listing-3",
    sellerId: "demo-seller-1",
    title: "1985 Honda VF1000R - Rare Factory Superbike",
    slug: "1985-honda-vf1000r-rare-factory-superbike",
    description: `Extremely rare 1985 Honda VF1000R in original condition. Only 1,500 units produced worldwide, making this one of the most collectible Honda motorcycles.

This example has been carefully preserved with 28,000 original kilometers. All bodywork is original with no modifications. The distinctive 16-valve V4 engine runs perfectly.

Highlights:
• Numbers-matching engine and frame
• Original Comstar wheels
• Complete with owner's manual
• Recent service including new tires
• All lights and electrical systems working
• Clean Japanese title

A true piece of motorcycle history.`,
    category: "motorcycle" as const,
    make: "Honda",
    model: "VF1000R",
    year: 1985, 
    mileage: 28000,
    locationText: "Kyoto, Japan",
    startingPrice: "15000.00",
    reservePrice: "25000.00",
    currentPrice: "18500.00",
    status: "published" as const,
    startAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    endAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    specifications: JSON.stringify({
      engine: "998cc V4",
      transmission: "6-speed manual",
      drivetrain: "Chain",
      fuelType: "Gasoline",
      color: "Red/White/Blue",
      interiorColor: "Black"
    })
  },
  {
    id: "listing-4",
    sellerId: "demo-seller-2", 
    title: "1990 Nissan Skyline GT-R R32 - Unmodified",
    slug: "1990-nissan-skyline-gtr-r32-unmodified",
    description: `Original 1990 Nissan Skyline GT-R R32 in Gun Metallic. This is an increasingly rare unmodified example of the legendary "Godzilla."

The RB26DETT twin-turbo engine is completely stock with no modifications. ATTESA E-TS all-wheel drive system functions perfectly. Interior shows normal wear but is in good condition overall.

Stock Features:
• RB26DETT 2.6L twin-turbo inline-6
• ATTESA E-TS AWD system
• 4-wheel steering (Super HICAS)
• Brembo brakes
• BBS wheels
• All original documentation

A fantastic example of Japan's most iconic sports car.`,
    category: "car" as const,
    make: "Nissan",
    model: "Skyline GT-R",
    year: 1990,
    mileage: 145000,
    locationText: "Hiroshima, Japan",
    startingPrice: "35000.00",
    reservePrice: "45000.00",
    currentPrice: "0.00",
    status: "published" as const, 
    startAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    specifications: JSON.stringify({
      engine: "2.6L Twin-Turbo I6",
      transmission: "5-speed manual",
      drivetrain: "AWD",
      fuelType: "Gasoline",
      color: "Gun Metallic",
      interiorColor: "Charcoal"
    })
  }
];

const sampleBids = [
  // Bids for NSX (listing-1)
  { id: "bid-1", listingId: "listing-1", bidderId: "demo-buyer-1", amount: "75000", createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
  { id: "bid-2", listingId: "listing-1", bidderId: "demo-seller-2", amount: "76500", createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
  { id: "bid-3", listingId: "listing-1", bidderId: "demo-buyer-1", amount: "78000", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
  
  // Bids for RX-7 (listing-2)
  { id: "bid-4", listingId: "listing-2", bidderId: "demo-buyer-1", amount: "50000", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
  { id: "bid-5", listingId: "listing-2", bidderId: "demo-seller-1", amount: "52000", createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
  
  // Bids for VF1000R (listing-3)
  { id: "bid-6", listingId: "listing-3", bidderId: "demo-buyer-1", amount: "18500", createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) }
];

const sampleWatches = [
  { id: "watch-1", userId: "demo-buyer-1", listingId: "listing-1" },
  { id: "watch-2", userId: "demo-buyer-1", listingId: "listing-2" },
  { id: "watch-3", userId: "demo-seller-1", listingId: "listing-3" },
  { id: "watch-4", userId: "demo-buyer-1", listingId: "listing-4" }
];

const sampleComments = [
  {
    id: "comment-1",
    listingId: "listing-1", 
    userId: "demo-buyer-1",
    content: "Beautiful example! Can you provide more details about the maintenance history?",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    id: "comment-2",
    listingId: "listing-1",
    userId: "demo-seller-1", 
    content: "Thank you! The car has been serviced at an authorized Honda dealer every year. I have all maintenance records available.",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  },
  {
    id: "comment-3",
    listingId: "listing-2",
    userId: "demo-buyer-1",
    content: "What compression numbers did you get after the rebuild?",
    timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000)
  },
  {
    id: "comment-4", 
    listingId: "listing-3",
    userId: "demo-seller-2",
    content: "Incredibly rare bike! GLWS!",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
  }
];

export async function seedDatabase() {
  console.log("🌱 Starting database seeding...");
  
  try {
    // Clear existing data
    console.log("🗑️ Clearing existing data...");
    await db.delete(comments);
    await db.delete(watchList);
    await db.delete(bids);
    await db.delete(listings);
    await db.delete(users);
    
    // Insert users
    console.log("👥 Creating sample users...");
    
    // Hash password for the samuraigarage1@gmail.com user
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    for (const user of sampleUsers) {
      const userData = {
        ...user,
        passwordHash: user.email === "samuraigarage1@gmail.com" ? hashedPassword : null
      };
      await db.insert(users).values(userData).onConflictDoNothing();
    }
    
    // Insert listings  
    console.log("🏎️ Creating sample listings...");
    for (const listing of sampleListings) {
      await db.insert(listings).values(listing).onConflictDoNothing();
    }
    
    // Insert bids
    console.log("💰 Creating sample bids...");
    for (const bid of sampleBids) {
      await db.insert(bids).values(bid).onConflictDoNothing();
    }
    
    // Insert watches
    console.log("👀 Creating sample watchlist items...");
    for (const watch of sampleWatches) {
      await db.insert(watchList).values(watch).onConflictDoNothing();
    }
    
    // Insert comments
    console.log("💬 Creating sample comments...");
    for (const comment of sampleComments) {
      await db.insert(comments).values({
        ...comment,
        authorId: comment.userId,
        body: comment.content,
        createdAt: comment.timestamp
      }).onConflictDoNothing();
    }
    
    console.log("✅ Database seeding completed successfully!");
    console.log(`Created:
    - ${sampleUsers.length} users
    - ${sampleListings.length} listings  
    - ${sampleBids.length} bids
    - ${sampleWatches.length} watchlist items
    - ${sampleComments.length} comments`);
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log("🎉 Seeding completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding failed:", error);
      process.exit(1);
    });
}