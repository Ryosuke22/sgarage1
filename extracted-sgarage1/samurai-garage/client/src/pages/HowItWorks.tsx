import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Gavel, CreditCard, Truck } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: <Search className="h-8 w-8 text-blue-600" />,
      title: "1. 車両を探す",
      description: "厳選された日本のクラシックカー・バイクのオークションを閲覧します。詳細な写真、車歴、整備記録をご確認ください。"
    },
    {
      icon: <FileText className="h-8 w-8 text-green-600" />,
      title: "2. 登録・認証",
      description: "アカウントを作成し、本人確認を完了します。初回登録後、すぐに入札を開始できます。"
    },
    {
      icon: <Gavel className="h-8 w-8 text-purple-600" />,
      title: "3. 入札参加", 
      description: "リアルタイムでオークションに参加します。ソフトクローズ機能により、終了間際の入札で自動延長されます。"
    },
    {
      icon: <CreditCard className="h-8 w-8 text-orange-600" />,
      title: "4. 決済完了",
      description: "落札後、買い手手数料を含む総額をお支払いいただきます。安全な決済システムを採用しています。"
    },
    {
      icon: <Truck className="h-8 w-8 text-red-600" />,
      title: "5. 配送・引き取り",
      description: "全国対応の配送サービス、または出品者との直接引き取りをお選びいただけます。"
    }
  ];

  const features = [
    {
      title: "厳格な審査",
      description: "すべての出品車両は詳細な審査を通過したもののみ掲載しています。"
    },
    {
      title: "リアルタイム入札",
      description: "最新の入札状況がリアルタイムで反映されます。"
    },
    {
      title: "ソフトクローズ",
      description: "終了30秒前の入札で自動的に120秒延長され、スナイプ入札を防ぎます。"
    },
    {
      title: "透明な手数料",
      description: "買い手手数料は事前に明示され、隠れた費用はありません。"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            オークションの仕組み
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Samurai Garageは、日本のクラシックカー・バイク愛好家のための
            プレミアムオークションプラットフォームです。
          </p>
          <Badge variant="secondary" className="mt-4">
            2001年以前の車両限定
          </Badge>
        </div>

        {/* オークションの流れ */}
        <div className="mb-16">
          <h2 className="text-3xl font-semibold text-center mb-8 text-gray-900 dark:text-white">
            オークションの流れ
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {steps.map((step, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-center mb-3">
                    {step.icon}
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 主な特徴 */}
        <div className="mb-16">
          <h2 className="text-3xl font-semibold text-center mb-8 text-gray-900 dark:text-white">
            主な特徴
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 注意事項 */}
        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="text-yellow-800 dark:text-yellow-200">
              重要な注意事項
            </CardTitle>
          </CardHeader>
          <CardContent className="text-yellow-700 dark:text-yellow-300">
            <ul className="space-y-2">
              <li>• 入札は法的拘束力のある契約行為です</li>
              <li>• 落札後のキャンセルはできません</li>
              <li>• 車両の状態は必ず事前にご確認ください</li>
              <li>• 配送費用は別途かかります</li>
              <li>• 名義変更などの手続きは落札者様の責任となります</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}