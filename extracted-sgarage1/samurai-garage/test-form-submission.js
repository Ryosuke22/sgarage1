// Test script to submit form data and verify it displays correctly
const testData = {
  title: "テスト車両2025",
  description: "これは実際のテスト用説明文です。フォームから入力されたデータが正しく表示されることを確認します。",
  specifications: "実際のテスト仕様：エンジン、トランスミッション、装備など",
  condition: "テスト用コンディション説明",
  highlights: "テスト用セールスポイント：この車両の魅力について",
  category: "car",
  make: "ホンダ",
  model: "シビック",
  year: 2018,
  mileage: "75000",
  locationText: "神奈川県",
  startingPrice: "800000"
};

fetch('/api/listings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    ...testData,
    photos: ["/uploads/test-placeholder.jpg"],
    sellerId: "46383243",
    startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString()
  })
})
.then(response => response.json())
.then(data => {
  console.log('Created listing:', data);
  // Now fetch and verify the data
  return fetch(`/api/listings/${data.id}`);
})
.then(response => response.json())
.then(listing => {
  console.log('\n=== VERIFICATION ===');
  console.log('Title:', listing.title);
  console.log('Description:', listing.description);
  console.log('Specifications:', listing.specifications);
  console.log('Condition:', listing.condition);
  console.log('Highlights:', listing.highlights);
  
  // Check if data matches what was submitted
  const matches = {
    title: listing.title === testData.title,
    description: listing.description === testData.description,
    specifications: listing.specifications === testData.specifications,
    condition: listing.condition === testData.condition,
    highlights: listing.highlights === testData.highlights
  };
  
  console.log('\n=== DATA MATCH RESULTS ===');
  Object.entries(matches).forEach(([field, isMatch]) => {
    console.log(`${field}: ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
  });
  
  if (Object.values(matches).every(match => match)) {
    console.log('\n🎉 ALL DATA MATCHES! The fix is working.');
  } else {
    console.log('\n⚠️ Some data does not match. Issue still exists.');
  }
})
.catch(error => {
  console.error('Test failed:', error);
});