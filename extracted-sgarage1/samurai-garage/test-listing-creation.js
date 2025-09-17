// Direct test of listing creation to identify the exact issue
console.log("Testing listing creation...");

// Test data that should work
const testData = {
  title: "APIテスト車両",
  description: "APIから直接作成されたテスト出品",
  specifications: "テスト仕様書",
  condition: "優良",
  highlights: "テストのハイライト",
  category: "car",
  make: "トヨタ",
  model: "プリウス", 
  year: 2020,
  mileage: 50000,
  mileageVerified: false,
  ownershipMileage: 5000,
  hasShaken: true,
  shakenYear: "2024",
  shakenMonth: "12", 
  isTemporaryRegistration: false,
  locationText: "東京都",
  city: "渋谷区",
  startingPrice: "1000000",
  reservePrice: "1200000",
  preferredDayOfWeek: "saturday",
  preferredStartTime: "19:00",
  auctionDuration: "7days",
  photos: [],
  sellerId: "46383243", // Direct user ID
  startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  endAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString()
};

console.log("Test data:", JSON.stringify(testData, null, 2));