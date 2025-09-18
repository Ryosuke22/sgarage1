import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator, Info } from "lucide-react";

export default function Fees() {
  const [bidAmount, setBidAmount] = useState<number>(500000);
  const [calculation, setCalculation] = useState<any>(null);
  
  const calculateFees = async () => {
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
        setCalculation(data);
      }
    } catch (error) {
      console.error('Fee calculation error:', error);
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const feeStructure = [
    { range: "¥250,000以下", rate: "10%", example: "¥100,000 → ¥10,000" },
    { range: "¥250,001〜¥1,000,000", rate: "5%", example: "¥500,000 → ¥37,500" },
    { range: "¥1,000,001以上", rate: "2%", example: "¥2,000,000 → ¥57,500" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            手数料について
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            透明で公正な手数料体系により、安心してオークションにご参加いただけます。
          </p>
        </div>

        {/* 手数料計算ツール */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              手数料計算ツール
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">
                  入札予定額（円）
                </label>
                <Input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(Number(e.target.value))}
                  min={1000}
                  step={1000}
                  className="text-lg"
                  data-testid="fee-calculator-input"
                />
              </div>
              <Button onClick={calculateFees} data-testid="calculate-fees-button">
                計算する
              </Button>
            </div>
            
            {calculation && (
              <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-lg">
                      <span>入札額:</span>
                      <span className="font-semibold" data-testid="calc-bid-amount">
                        {formatCurrency(bidAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>買い手手数料:</span>
                      <span data-testid="calc-buyers-premium">
                        {formatCurrency(calculation.buyersPremium)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>書類手数料:</span>
                      <span data-testid="calc-documentation-fee">
                        {formatCurrency(calculation.documentationFee)}
                      </span>
                    </div>
                    <hr className="border-blue-300 dark:border-blue-700" />
                    <div className="flex justify-between text-xl font-bold">
                      <span>合計支払額:</span>
                      <span className="text-blue-600 dark:text-blue-400" data-testid="calc-total">
                        {formatCurrency(calculation.totalWithFees)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* 買い手手数料の詳細 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>買い手手数料（階段方式）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">落札額の範囲</th>
                    <th className="text-left py-3 px-4">手数料率</th>
                    <th className="text-left py-3 px-4">計算例</th>
                  </tr>
                </thead>
                <tbody>
                  {feeStructure.map((tier, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4 font-medium">{tier.range}</td>
                      <td className="py-3 px-4">{tier.rate}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {tier.example}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* その他の費用 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>その他の費用</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b">
                <div>
                  <h3 className="font-medium">書類手数料</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    名義変更書類の作成・送付費用
                  </p>
                </div>
                <span className="text-lg font-semibold">¥5,000（固定）</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <div>
                  <h3 className="font-medium">配送費用</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    陸送業者による全国配送（距離・車種により変動）
                  </p>
                </div>
                <span className="text-lg font-semibold">別途見積もり</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <div>
                  <h3 className="font-medium">名義変更代行</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    行政書士による名義変更手続き代行（任意）
                  </p>
                </div>
                <span className="text-lg font-semibold">¥15,000〜</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 重要な注意事項 */}
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Info className="h-5 w-5" />
              重要な注意事項
            </CardTitle>
          </CardHeader>
          <CardContent className="text-amber-700 dark:text-amber-300">
            <ul className="space-y-2">
              <li>• すべての手数料は税込み価格です</li>
              <li>• 手数料は落札確定後、7日以内にお支払いください</li>
              <li>• 配送費用は配送先と車両により異なります</li>
              <li>• 名義変更に必要な書類は別途ご準備いただきます</li>
              <li>• 手数料の計算は入札時にリアルタイムで表示されます</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}