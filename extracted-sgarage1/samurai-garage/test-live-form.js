// Live form test script
const testFormSubmission = async () => {
  const testData = {
    title: "ライブテスト車両2025",
    description: "実際のWebUIからの動作確認テスト",
    specifications: "テスト仕様詳細",
    condition: "優良",
    highlights: "WebUI確認ポイント",
    category: "car",
    make: "レクサス",
    model: "IS",
    year: 2023,
    mileage: "8000",
    mileageVerified: true,
    ownershipMileage: "800",
    hasShaken: true,
    shakenYear: "2026",
    shakenMonth: "3",
    isTemporaryRegistration: false,
    locationText: "愛知県",
    city: "名古屋市",
    startingPrice: "3500000",
    reservePrice: "3800000",
    preferredDayOfWeek: "saturday",
    preferredStartTime: "19:00",
    auctionDuration: "7days",
    photos: []
  };

  try {
    console.log("Testing with auth session...");
    const response = await fetch('/api/listings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log("Status:", response.status);
    console.log("Result:", result);
    
    return { status: response.status, data: result };
  } catch (error) {
    console.error("Test failed:", error);
    return { error: error.message };
  }
};

console.log("Form test script loaded. Call testFormSubmission() to run.");