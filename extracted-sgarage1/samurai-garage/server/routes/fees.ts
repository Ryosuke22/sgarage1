import type { Express } from "express";
import { calculateFees } from "../utils/pricing";

export function registerFeesRoutes(app: Express) {
  // 手数料計算API
  app.post("/api/fees/calculate", (req, res) => {
    try {
      const { bidAmount } = req.body;
      
      if (!bidAmount || typeof bidAmount !== 'number' || bidAmount <= 0) {
        return res.status(400).json({ 
          error: "Valid bid amount is required" 
        });
      }
      
      const fees = calculateFees(bidAmount);
      res.json(fees);
    } catch (error) {
      console.error('Fee calculation error:', error);
      res.status(500).json({ 
        error: "Internal server error" 
      });
    }
  });
  
  // 手数料構造の説明API
  app.get("/api/fees/structure", (req, res) => {
    res.json({
      buyersPremium: {
        tiers: [
          { min: 0, max: 250000, rate: 0.10, description: "25万円以下：10%" },
          { min: 250001, max: 1000000, rate: 0.05, description: "25万円超100万円以下：5%（25万円までの10%に追加）" },
          { min: 1000001, max: null, rate: 0.02, description: "100万円超：2%（100万円までの手数料に追加）" }
        ]
      },
      documentationFee: {
        amount: 5000,
        description: "書類手数料（固定）"
      }
    });
  });
}