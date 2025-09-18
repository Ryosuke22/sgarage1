import { Router } from "express";
import * as fs from "fs";
import * as path from "path";
import seed from "../../data/models.seed.json" assert { type: "json" };

export const modelsRouter = Router();

// English to Japanese make mapping
const makeMapping: Record<string, string> = {
  "Honda": "ホンダ",
  "Toyota": "トヨタ", 
  "Daihatsu": "ダイハツ",
  "Nissan": "ニッサン",
  "Mazda": "マツダ",
  "Mitsubishi": "ミツビシ",
  "Subaru": "スバル",
  "Suzuki": "スズキ",
  "Isuzu": "いすゞ",
  "Lexus": "レクサス",
  "Hino": "日野",
  "Mercedes-Benz": "メルセデス・ベンツ",
  "BMW": "BMW",
  "Ford": "フォード",
  "Lincoln": "リンカーン",
  "Mercury": "マーキュリー",
  "Chevrolet": "シボレー",
  "GMC": "GMC",
  "Pontiac": "ポンティアック",
  "Buick": "ビュイック",
  "Oldsmobile": "オールズモビル",
  "Cadillac": "キャデラック",
  "Saturn": "サターン",
  "Geo": "ジオ",
  "Chrysler": "クライスラー",
  "Dodge": "ダッジ",
  "Plymouth": "プリムス",
  "Jeep": "ジープ",
  "Eagle": "イーグル",
  "AMC": "AMC",
  "Studebaker": "スタデベーカー",
  "Packard": "パッカード",
  "Hudson": "ハドソン",
  "Nash": "ナッシュ",
  "Kaiser": "カイザー",
  "Frazer": "フレイザー",
  "Willys": "ウィリス",
  "International Harvester": "インターナショナル・ハーベスター",
  "DeLorean": "デロリアン",
  "AM General": "AMゼネラル"
};

function loadModelsData() {
  try {
    const modelsPath = path.join(process.cwd(), "data", "models.json");
    const data = fs.readFileSync(modelsPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to load models data:", error);
    return { car: {}, motorcycle: {} };
  }
}

function modelsForYear(makeJa: string, year: number, category: string = "car"): string[] {
  const periodsKey = category === "motorcycle" ? "motorcycle_periods" : "car_periods";
  const periods = (seed[periodsKey] as Record<string, Array<{model: string, from: number, to: number}>>)?.[makeJa] ?? [];
  const models = new Set<string>();
  console.log(`Looking for ${category} models: ${makeJa} in year ${year}, found ${periods.length} periods`);
  for (const p of periods) {
    if (typeof p.from !== "number" || typeof p.to !== "number") continue;
    if (year >= p.from && year <= p.to) models.add(p.model);
  }
  console.log(`Found ${models.size} models for ${makeJa} ${year}`);
  return Array.from(models).sort((a, b) => a.localeCompare(b, "ja"));
}

modelsRouter.get("/", (req, res) => {
  const category = String(req.query.category ?? "");
  const make = String(req.query.make ?? "");
  const year = Number(req.query.year ?? 0);

  console.log(`=== Models API Called: ${make} ${category} ${year} ===`);

  if (!category || !make || !year) {
    return res.status(400).json({ message: "category, make, year are required" });
  }

  // Try new Japanese system first
  const makeJa = makeMapping[make];
  console.log(`Request: make=${make}, makeJa=${makeJa}, category=${category}, year=${year}`);
  console.log(`Available makes: ${Object.keys(makeMapping).join(", ")}`);
  
  if (makeJa && (category === "car" || category === "motorcycle")) {
    const list = modelsForYear(makeJa, year, category);
    if (list.length > 0) {
      console.log(`Returning ${list.length} ${category} models from new system`);
      return res.json({ models: list });
    } else {
      console.log(`No models found in new system for ${makeJa} ${year} ${category}`);
    }
  }

  // Fallback to old system
  console.log(`Falling back to old system for ${make}`);
  const models = loadModelsData();
  const byCat = models[category] ?? {};
  const byMake = byCat[make] ?? {};
  const result: string[] = [];

  for (const range in byMake) {
    const [from, to] = range.split("-").map(Number);
    if (year >= from && year <= to) result.push(...byMake[range]);
  }
  console.log(`Old system returned ${result.length} models`);
  res.json({ models: Array.from(new Set(result)) });
});