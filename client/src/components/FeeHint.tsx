import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator } from "lucide-react";

interface FeeCalculation {
  buyersPremium: number;
  documentationFee: number;
  totalFees: number;
  totalWithFees: number;
}

interface FeeHintProps {
  bidAmount: number;
  className?: string;
}

export function FeeHint({ bidAmount, className = "" }: FeeHintProps) {
  const [fees, setFees] = useState<FeeCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (bidAmount <= 0) {
      setFees(null);
      return;
    }
    
    const calculateFees = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/fees/calculate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ bidAmount }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setFees(data);
        }
      } catch (error) {
        console.error('Fee calculation error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // デバウンス（500ms後に計算）
    const timer = setTimeout(calculateFees, 500);
    return () => clearTimeout(timer);
  }, [bidAmount]);
  
  if (!fees || bidAmount <= 0) {
    return null;
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  return (
    <Card className={`bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 ${className}`} data-testid="fee-hint">
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 text-sm">
            <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              手数料概算
            </div>
            <div className="space-y-1 text-blue-700 dark:text-blue-300">
              <div className="flex justify-between">
                <span>入札額:</span>
                <span data-testid="fee-bid-amount">{formatCurrency(bidAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>買い手手数料:</span>
                <span data-testid="fee-buyers-premium">{formatCurrency(fees.buyersPremium)}</span>
              </div>
              <div className="flex justify-between">
                <span>書類手数料:</span>
                <span data-testid="fee-documentation">{formatCurrency(fees.documentationFee)}</span>
              </div>
              <hr className="border-blue-300 dark:border-blue-700" />
              <div className="flex justify-between font-semibold">
                <span>合計支払額:</span>
                <span data-testid="fee-total">{formatCurrency(fees.totalWithFees)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}