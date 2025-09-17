// Test script to verify all listing details are displayed
const testListingDisplay = () => {
  console.log("Testing listing display fix...");
  
  // Check if all sections are present
  const sections = [
    { name: "基本説明", selector: "h3, h4" },
    { name: "仕様・装備", selector: "h3, h4" },
    { name: "コンディション", selector: "h3, h4" },
    { name: "セールスポイント", selector: "h3, h4" }
  ];
  
  sections.forEach(section => {
    const elements = Array.from(document.querySelectorAll(section.selector))
      .filter(el => el.textContent.includes(section.name));
    
    if (elements.length > 0) {
      console.log(`✅ ${section.name} section found`);
      
      // Find the content after this heading
      const heading = elements[0];
      const content = heading.parentElement?.nextElementSibling?.textContent || 
                     heading.nextElementSibling?.textContent ||
                     "No content found";
      
      console.log(`   Content: ${content.substring(0, 50)}...`);
    } else {
      console.log(`❌ ${section.name} section NOT found`);
    }
  });
  
  // Check for data attributes that should show the values
  const testData = {
    specifications: "テスト仕様",
    condition: "良好", 
    highlights: "テストポイント",
    description: "自動テスト用の出品です"
  };
  
  Object.entries(testData).forEach(([key, expectedValue]) => {
    const hasValue = document.body.textContent.includes(expectedValue);
    console.log(`${hasValue ? '✅' : '❌'} ${key}: ${expectedValue} ${hasValue ? 'found' : 'missing'}`);
  });
};

console.log("Display test script loaded. Call testListingDisplay() to run.");