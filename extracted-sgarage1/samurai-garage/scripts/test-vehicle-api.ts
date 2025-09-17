// Quick test of vehicle APIs
import { readFile } from "node:fs/promises";

const VPIC = "https://vpic.nhtsa.dot.gov/api/vehicles";

async function testAPI() {
  try {
    console.log("Testing vPIC API with Toyota 1995...");
    const url = `${VPIC}/GetModelsForMakeYear/make/Toyota/modelyear/1995?format=json`;
    const response = await fetch(url);
    const data = await response.json();
    console.log("Success! Found", data.Results?.length || 0, "models");
    console.log("Sample models:", data.Results?.slice(0, 3).map((r: any) => r.Model_Name));
    
    // Test existing JSON
    console.log("\nTesting existing JSON...");
    const jsonPath = "attached_assets/vehicle-index.json";
    try {
      const json = await readFile(jsonPath, "utf-8");
      const data = JSON.parse(json);
      console.log("Existing JSON loaded, car makes:", Object.keys(data.car || {}).length);
    } catch (e) {
      console.log("No existing JSON found (that's OK)");
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testAPI();