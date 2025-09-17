// Browser test script for authentication fix
console.log("Testing authentication fix...");

// Simulate form submission from browser
const testSubmission = async () => {
  try {
    const response = await fetch('/api/listings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        title: "ブラウザテスト車両",
        description: "認証修正確認用",
        specifications: "テスト仕様",
        condition: "良好",
        highlights: "修正確認",
        category: "car",
        make: "スバル",
        model: "レガシィ",
        year: 2020,
        mileage: "40000",
        mileageVerified: false,
        ownershipMileage: "4000",
        hasShaken: true,
        shakenYear: "2024",
        shakenMonth: "12",
        isTemporaryRegistration: false,
        locationText: "静岡県",
        city: "静岡市",
        startingPrice: "1800000",
        reservePrice: "2000000",
        preferredDayOfWeek: "sunday",
        preferredStartTime: "18:00",
        auctionDuration: "7days",
        photos: []
      })
    });
    
    const result = await response.json();
    console.log("Response status:", response.status);
    console.log("Response data:", result);
    
    if (response.ok) {
      console.log("✅ Authentication fix successful!");
      console.log("Created listing ID:", result.id);
    } else {
      console.log("❌ Authentication still has issues:", result.error);
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};

// Run test
testSubmission();