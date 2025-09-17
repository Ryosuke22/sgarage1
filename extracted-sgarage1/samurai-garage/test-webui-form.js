// Test script to simulate real user form submission
const testRealFormSubmission = async () => {
  console.log("Testing real form submission with detailed content...");
  
  const formData = {
    title: "実際のフォームテスト車両",
    description: "ユーザーが実際にフォームで入力する詳細説明です。この車両は丁寧に使用されており、定期的なメンテナンスを実施しています。",
    specifications: "エンジン: 2.0L DOHC\nトランスミッション: CVT\n駆動方式: 4WD\n装備: ナビ、ETC、バックカメラ、LEDヘッドライト",
    condition: "外装: 年式相応の小傷あり\n内装: 良好（喫煙なし）\nエンジン: 異音なし、好調\nタイヤ: 6分山程度",
    highlights: "・ワンオーナー車\n・禁煙車\n・定期メンテナンス実施\n・車検2年付き\n・整備記録簿完備",
    category: "car",
    make: "スバル",
    model: "フォレスター",
    year: 2020,
    mileage: "45000",
    mileageVerified: true,
    ownershipMileage: "4500",
    hasShaken: true,
    shakenYear: "2025",
    shakenMonth: "12",
    isTemporaryRegistration: false,
    locationText: "埼玉県",
    city: "さいたま市",
    startingPrice: "2800000",
    reservePrice: "3000000",
    preferredDayOfWeek: "saturday",
    preferredStartTime: "19:00",
    auctionDuration: "7days",
    photos: []
  };

  try {
    const response = await fetch('/api/listings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(formData)
    });

    const result = await response.json();
    console.log("Response status:", response.status);
    
    if (response.ok) {
      console.log("✅ Form submission successful!");
      console.log("Created listing ID:", result.id);
      console.log("Title:", result.title);
      console.log("Description:", result.description);
      console.log("Specifications:", result.specifications);
      console.log("Condition:", result.condition);
      console.log("Highlights:", result.highlights);
      
      // Navigate to preview
      window.location.href = `/preview/${result.id}`;
    } else {
      console.log("❌ Form submission failed:", result);
    }
  } catch (error) {
    console.error("❌ Request failed:", error);
  }
};

console.log("WebUI form test script loaded. Call testRealFormSubmission() to run.");