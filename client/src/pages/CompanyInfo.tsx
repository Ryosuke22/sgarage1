import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "react-router-dom";

export default function CompanyInfo() {
  const [, navigate] = useLocation();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-white mb-8">
          会社情報
        </h1>

        <div className="space-y-8">
          {/* 会社概要 */}
          <Card className="bg-gray-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-xl">
                Samurai Garage株式会社
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-white font-semibold mb-2">本社所在地</h3>
                    <div className="text-gray-300 text-sm space-y-1">
                      <p>〒100-0001</p>
                      <p>東京都千代田区千代田1-1-1</p>
                      <p>Samuraiビル 5F</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-white font-semibold mb-2">連絡先</h3>
                    <div className="text-gray-300 text-sm space-y-1">
                      <p>電話: 03-1234-5678</p>
                      <p>FAX: 03-1234-5679</p>
                      <p>メール: info@samurai-garage.jp</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-white font-semibold mb-2">営業時間</h3>
                    <div className="text-gray-300 text-sm space-y-1">
                      <p>平日: 9:00 - 18:00</p>
                      <p>土曜: 9:00 - 16:00</p>
                      <p>日曜・祝日: 休業</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-2">設立</h3>
                    <p className="text-gray-300 text-sm">2020年4月1日</p>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-2">資本金</h3>
                    <p className="text-gray-300 text-sm">1,000万円</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 事業内容 */}
          <Card className="bg-gray-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-xl">
                事業内容
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-gray-300 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>クラシックカー・ヴィンテージバイクのオンラインオークション運営</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>2001年以前の日本車・日本製バイクの売買仲介</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>車両査定・鑑定サービス</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>自動車関連コンサルティング</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>輸出入手続き代行サービス</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 許可・認証 */}
          <Card className="bg-gray-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-xl">
                許可・認証
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-400/30 rounded-lg p-4">
                <h3 className="text-blue-300 font-semibold mb-2">古物商許可証</h3>
                <div className="text-blue-200 text-sm space-y-1">
                  <p>許可番号: 東京都公安委員会 第123456789012号</p>
                  <p>許可日: 2020年3月15日</p>
                  <p>品目: 自動車（その部品を含む）</p>
                </div>
              </div>
              
              <div className="text-gray-300 text-sm">
                <p>
                  当社は古物営業法に基づき、東京都公安委員会より古物商許可を取得しており、
                  法令を遵守した適正な営業を行っております。
                </p>
              </div>
            </CardContent>
          </Card>

          {/* お問い合わせ */}
          <Card className="bg-gray-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-xl">
                お問い合わせ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-white font-semibold mb-2">一般的なお問い合わせ</h3>
                    <div className="text-gray-300 text-sm space-y-1">
                      <p>メール: info@samurai-garage.jp</p>
                      <p>電話: 03-1234-5678</p>
                      <p>受付時間: 平日 9:00-18:00</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-2">出品・売却に関するお問い合わせ</h3>
                    <div className="text-gray-300 text-sm space-y-1">
                      <p>メール: sales@samurai-garage.jp</p>
                      <p>電話: 03-1234-5680</p>
                      <p>担当: 営業部</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-white font-semibold mb-2">技術的なサポート</h3>
                    <div className="text-gray-300 text-sm space-y-1">
                      <p>メール: support@samurai-garage.jp</p>
                      <p>電話: 03-1234-5681</p>
                      <p>受付時間: 平日 9:00-17:00</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-2">プレス・メディア関係</h3>
                    <div className="text-gray-300 text-sm space-y-1">
                      <p>メール: press@samurai-garage.jp</p>
                      <p>担当: 広報部</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <div className="bg-yellow-900/20 border border-yellow-400/30 rounded-lg p-4">
                  <h3 className="text-yellow-300 font-semibold mb-2">お問い合わせ時のお願い</h3>
                  <ul className="text-yellow-200 text-sm space-y-1">
                    <li>• お問い合わせの際は、お名前・連絡先を必ずご記載ください</li>
                    <li>• 車両に関するお問い合わせは、車種・年式・車台番号をお教えください</li>
                    <li>• 緊急の場合を除き、メールでのお問い合わせを推奨いたします</li>
                    <li>• 回答までに1-2営業日お時間をいただく場合があります</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SNS・公式サイト */}
          <Card className="bg-gray-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-xl">
                SNS・公式サイト
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <h3 className="text-white font-semibold mb-2">Twitter</h3>
                  <p className="text-gray-300 text-sm">@SamuraiGarage_JP</p>
                  <p className="text-gray-400 text-xs">最新情報・お知らせ</p>
                </div>
                <div className="text-center">
                  <h3 className="text-white font-semibold mb-2">Instagram</h3>
                  <p className="text-gray-300 text-sm">@samurai_garage</p>
                  <p className="text-gray-400 text-xs">車両写真・イベント情報</p>
                </div>
                <div className="text-center">
                  <h3 className="text-white font-semibold mb-2">YouTube</h3>
                  <p className="text-gray-300 text-sm">Samurai Garage Channel</p>
                  <p className="text-gray-400 text-xs">車両紹介・ハウツー動画</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}