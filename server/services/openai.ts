import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ListingInfo {
  category: "car" | "motorcycle";
  make: string;
  model: string;
  year: number;
  mileage: number;
  specifications?: string;
  highlights?: string;
  hasAccidentHistory?: string;
  modifiedParts?: string;
  knownIssues?: string;
  locationText?: string;
  startingPrice?: string;
}

interface GeneratedContent {
  title: string;
  description: string;
  specifications: string;
  highlights: string;
}

export async function generateListingContent(
  listingInfo: ListingInfo
): Promise<GeneratedContent> {
  const categoryText = listingInfo.category === "car" ? "車" : "バイク";
  
  const prompt = `あなたは日本の車両オークションプラットフォームの出品担当者です。以下の情報を元に、魅力的で詳細な出品情報を日本語で作成してください。

【車両情報】
カテゴリ: ${categoryText}
メーカー: ${listingInfo.make}
モデル: ${listingInfo.model}
年式: ${listingInfo.year}年
走行距離: ${listingInfo.mileage.toLocaleString()}km
${listingInfo.locationText ? `所在地: ${listingInfo.locationText}` : ""}
${listingInfo.startingPrice ? `開始価格: ¥${parseInt(listingInfo.startingPrice).toLocaleString()}` : ""}

【追加情報】
${listingInfo.specifications ? `仕様: ${listingInfo.specifications}` : ""}
${listingInfo.highlights ? `特徴: ${listingInfo.highlights}` : ""}
${listingInfo.hasAccidentHistory ? `事故歴: ${listingInfo.hasAccidentHistory === "yes" ? "あり" : listingInfo.hasAccidentHistory === "no" ? "なし" : "不明"}` : ""}
${listingInfo.modifiedParts ? `改造パーツ: ${listingInfo.modifiedParts}` : ""}
${listingInfo.knownIssues ? `既知の問題: ${listingInfo.knownIssues}` : ""}

以下の形式でJSONを返してください：
{
  "title": "魅力的なタイトル（50文字以内、年式・メーカー・モデルを含む）",
  "description": "詳細な説明文（300-500文字、車両の魅力を伝え、購入を検討している人に向けた文章）",
  "specifications": "技術仕様の詳細（エンジン、トランスミッション、装備など、200文字程度）",
  "highlights": "この車両の最大の魅力ポイント（3-5個の箇条書き、各50文字以内）"
}

注意事項：
- すべて日本語で記述
- 専門用語は適度に使用し、一般の購入者にも分かりやすく
- ポジティブかつ正確な表現を心がける
- 既知の問題がある場合は正直に記載
- オークション形式に適した魅力的な文章にする`;

  try {
    console.log("Calling OpenAI API with model: gpt-5");
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "あなたは日本の車両オークションの専門家で、魅力的な出品情報を作成するエキスパートです。正確で魅力的、かつプロフェッショナルな文章を作成してください。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    console.log("OpenAI API response received:", {
      id: response.id,
      model: response.model,
      choices: response.choices?.length,
      hasContent: !!response.choices[0]?.message?.content
    });

    const content = response.choices[0].message.content;
    if (!content) {
      console.error("OpenAI returned empty content. Full response:", JSON.stringify(response, null, 2));
      throw new Error("OpenAI returned empty content");
    }

    const result = JSON.parse(content);
    
    return {
      title: result.title || `${listingInfo.year} ${listingInfo.make} ${listingInfo.model}`,
      description: result.description || "",
      specifications: result.specifications || "",
      highlights: result.highlights || "",
    };
  } catch (error) {
    console.error("Error generating listing content:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw new Error(`AI生成に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`);
  }
}
