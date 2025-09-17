// Debug script to check content display on preview page
console.log("=== CONTENT DISPLAY DEBUG ===");

// Check if content sections exist
const checkSection = (sectionName, expectedContent) => {
  console.log(`\n--- Checking ${sectionName} ---`);
  
  // Look for section headings
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
    .filter(h => h.textContent.includes(sectionName));
  
  if (headings.length > 0) {
    console.log(`✅ Found heading: "${headings[0].textContent}"`);
    
    // Find content after the heading
    const heading = headings[0];
    let contentElement = heading.parentElement?.nextElementSibling;
    if (!contentElement) {
      contentElement = heading.nextElementSibling;
    }
    
    if (contentElement) {
      const content = contentElement.textContent || contentElement.innerText;
      console.log(`Content: "${content.substring(0, 100)}..."`);
      
      if (expectedContent && content.includes(expectedContent)) {
        console.log(`✅ Expected content found: "${expectedContent}"`);
      } else if (expectedContent) {
        console.log(`❌ Expected content missing: "${expectedContent}"`);
      }
    } else {
      console.log(`❌ No content found after heading`);
    }
  } else {
    console.log(`❌ Section heading not found`);
  }
};

// Check all sections
checkSection("基本説明", "自動テスト用の出品です");
checkSection("仕様・装備", "テスト仕様");
checkSection("コンディション", "良好");
checkSection("セールスポイント", "テストポイント");

// Check raw page content
console.log("\n--- RAW CONTENT CHECK ---");
const bodyText = document.body.textContent;
console.log(`Page contains "自動テスト用の出品です": ${bodyText.includes("自動テスト用の出品です")}`);
console.log(`Page contains "テスト仕様": ${bodyText.includes("テスト仕様")}`);
console.log(`Page contains "良好": ${bodyText.includes("良好")}`);
console.log(`Page contains "テストポイント": ${bodyText.includes("テストポイント")}`);

console.log("=== DEBUG COMPLETE ===");