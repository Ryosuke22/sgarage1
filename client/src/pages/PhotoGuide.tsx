import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PhotoGuide() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-white mb-8">
          📸 写真の撮り方ガイド
        </h1>

        <div className="space-y-8">
          {/* 概要 */}
          <Card className="bg-gray-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-xl">
                高品質な車両写真を撮影するために
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-4">
              <p>
                車両の魅力を最大限に伝える写真撮影は、オークションの成功において非常に重要です。
                以下のガイドラインに従って、買い手の信頼を得られる写真を撮影しましょう。
              </p>
              <div className="bg-blue-900/20 border border-blue-400/30 rounded-lg p-4">
                <p className="text-blue-300 font-medium">
                  💡 推奨枚数: 合計20-30枚（外装10-12枚、内装8-10枚、エンジン・機械部分6-8枚）
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 外装写真 */}
          <Card className="bg-gray-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <span className="text-blue-400">🚗</span>
                外装写真 (10-12枚)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 必須アングル */}
                <div className="space-y-4">
                  <h3 className="text-white font-semibold">必須アングル</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span><strong>フロント全体:</strong> 正面から車両全体が写るように</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span><strong>リア全体:</strong> 後方から車両全体が写るように</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span><strong>左サイド全体:</strong> 車両の左側面全体</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span><strong>右サイド全体:</strong> 車両の右側面全体</span>
                    </li>
                  </ul>
                </div>

                {/* 3/4アングル */}
                <div className="space-y-4">
                  <h3 className="text-white font-semibold">3/4アングル（斜め）</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span><strong>フロント斜め:</strong> 正面左または右から45度</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span><strong>リア斜め:</strong> 後方左または右から45度</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-white font-semibold">詳細部分</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span><strong>フロントグリル・ヘッドライト:</strong> 近距離でクリアに</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span><strong>リアテールライト:</strong> 両側のテールライト</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span><strong>ホイール・タイヤ:</strong> 4本すべてのホイールとタイヤの状態</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span><strong>キズや損傷:</strong> 小さなキズも含めて正直に撮影</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* 内装写真 */}
          <Card className="bg-gray-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <span className="text-green-400">🪑</span>
                内装写真 (8-10枚)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-white font-semibold">基本撮影</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span><strong>ダッシュボード全体:</strong> 運転席側から全体を撮影</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span><strong>フロントシート:</strong> 運転席・助手席の状態</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span><strong>リアシート:</strong> 後部座席の状態</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span><strong>天井:</strong> ルーフライニングの状態</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-white font-semibold">詳細撮影</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span><strong>メーターパネル:</strong> 走行距離が読めるように</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span><strong>ステアリング:</strong> ハンドルとスイッチ類</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span><strong>センターコンソール:</strong> エアコン・オーディオ操作部</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span><strong>シフトレバー:</strong> MT/ATの操作部</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* エンジン・機械部分 */}
          <Card className="bg-gray-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <span className="text-orange-400">⚙️</span>
                エンジン・機械部分 (6-8枚)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-white font-semibold">エンジンルーム</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-1">•</span>
                      <span><strong>エンジンルーム全体:</strong> ボンネットを開けた状態</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-1">•</span>
                      <span><strong>エンジン本体:</strong> エンジンブロックの状態</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-1">•</span>
                      <span><strong>エンジンナンバー:</strong> 刻印が読めるように</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-white font-semibold">その他の機械部分</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-1">•</span>
                      <span><strong>トランク・カーゴエリア:</strong> 荷室の状態</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-1">•</span>
                      <span><strong>車体下部:</strong> 可能な範囲で下回りの状態</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 mt-1">•</span>
                      <span><strong>エキゾーストパイプ:</strong> マフラーの状態</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 撮影のコツ */}
          <Card className="bg-gray-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <span className="text-yellow-400">💡</span>
                撮影のコツとポイント
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-white font-semibold">照明・環境</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">💡</span>
                      <span><strong>自然光を活用:</strong> 曇りの日の屋外が理想的</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">💡</span>
                      <span><strong>影を避ける:</strong> 直射日光下では影が強くなりすぎる</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">💡</span>
                      <span><strong>背景をシンプルに:</strong> 車両が際立つ背景を選ぶ</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-white font-semibold">撮影技術</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">💡</span>
                      <span><strong>水平を保つ:</strong> 車両が傾いて見えないように</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">💡</span>
                      <span><strong>ブレを防ぐ:</strong> しっかりと構えて撮影</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">💡</span>
                      <span><strong>複数枚撮影:</strong> 同じアングルでも数枚撮って最良の1枚を選ぶ</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-400/30 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">正直な撮影の重要性</h3>
                <p className="text-yellow-300 text-sm">
                  キズや汚れ、使用感も正直に撮影することで、買い手の信頼を得ることができます。
                  隠すのではなく、透明性のある取引を心がけましょう。
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 避けるべきこと */}
          <Card className="bg-gray-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <span className="text-red-400">❌</span>
                避けるべき撮影
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ul className="space-y-3 text-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">❌</span>
                    <span><strong>夜間や暗い場所での撮影:</strong> 色味や状態が正確に伝わらない</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">❌</span>
                    <span><strong>過度の加工:</strong> 実際と異なる印象を与える加工は避ける</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">❌</span>
                    <span><strong>一部分のみの撮影:</strong> 全体像がわからない部分的な写真</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">❌</span>
                    <span><strong>汚れたままの撮影:</strong> 清掃前の撮影は車両の魅力を損なう</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">❌</span>
                    <span><strong>個人情報の写り込み:</strong> ナンバープレートなどは隠すか加工する</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}