// Test script to submit a listing programmatically
const testData = {
  title: "テスト車両出品",
  description: "プログラムからのテスト出品です",
  specifications: "テスト仕様書",
  condition: "良好な状態",
  highlights: "テスト用のアピールポイント",
  category: "car",
  make: "トヨタ",
  model: "プリウス",
  year: 2020,
  mileage: "50000",
  mileageVerified: false,
  ownershipMileage: "5000",
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
  photos: ["/uploads/test.jpg"]
};

console.log("Test data:", JSON.stringify(testData, null, 2));