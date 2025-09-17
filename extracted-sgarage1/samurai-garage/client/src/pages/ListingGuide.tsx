import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

export default function ListingGuide() {
  const [, navigate] = useLocation();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-white mb-8">
          📋 出品ガイド
        </h1>

        <div className="space-y-8">
          {/* 概要 */}
          <Card className="bg-gray-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-xl">
                Samurai Garageでの出品について
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-4">
              <p>
                Samurai Garageは2001年以前の日本の名車とバイクに特化したオークションプラットフォームです。
                お客様の大切な車両を適正価格で売却していただくため、以下のガイドラインをご確認ください。
              </p>
              <div className="bg-blue-900/20 border border-blue-400/30 rounded-lg p-4">
                <p className="text-blue-300 font-medium">
                  💡 出品には事前審査があります。審査通過後にオークションが開始されます。
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 出品可能な車両 */}
          <Card className="bg-gray-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <span className="text-green-400">✅</span>
                出品可能な車両
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-white font-semibold">対象車両</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span><strong>製造年:</strong> 2001年以前の車両のみ</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span><strong>メーカー:</strong> 主に日本メーカー（ホンダ、トヨタ、日産、マツダ、スバル、三菱、スズキ、ダイハツ、ヤマハ、カワサキ等）</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span><strong>車種:</strong> 乗用車、商用車、バイク、スクーター</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span><strong>状態:</strong> 動作する車両、レストア対象車両</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-white font-semibold">人気カテゴリー</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>スポーツカー（NSX、スープラ、GT-R等）</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>クラシックカー（シビック、カローラ、スカイライン等）</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>バイク（CBシリーズ、RZシリーズ、Z2等）</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>軽自動車（ビート、カプチーノ、アルトワークス等）</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 出品の流れ */}
          <Card className="bg-gray-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <span className="text-orange-400">🔄</span>
                出品の流れ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  { step: 1, title: "車両情報の入力", description: "メーカー、車種、年式、走行距離等の基本情報を入力", time: "約10分" },
                  { step: 2, title: "詳細情報の記載", description: "車両の特徴、装備、メンテナンス履歴、問題点等を詳しく記載", time: "約15分" },
                  { step: 3, title: "写真の撮影・アップロード", description: "外装、内装、エンジンルーム等の高品質な写真を20-30枚", time: "約30分" },
                  { step: 4, title: "書類の準備・撮影", description: "車検証、譲渡証明書、整備記録簿等の必要書類", time: "約10分" },
                  { step: 5, title: "価格・期間の設定", description: "開始価格、リザーブ価格、オークション期間の設定", time: "約5分" },
                  { step: 6, title: "出品申請", description: "入力内容を確認し、審査のための申請を送信", time: "約2分" },
                  { step: 7, title: "審査・承認", description: "専門スタッフによる車両・情報の審査", time: "1-3営業日" },
                  { step: 8, title: "オークション開始", description: "承認後、設定した日時にオークション開始", time: "自動" }
                ].map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {item.step}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">{item.title}</h3>
                      <p className="text-gray-300 text-sm mt-1">{item.description}</p>
                      <span className="text-orange-400 text-xs">所要時間: {item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 必要書類 */}
          <Card className="bg-gray-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <span className="text-yellow-400">📄</span>
                必要書類
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-white font-semibold">自動車の場合</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">📋</span>
                      <span><strong>車検証:</strong> 現在有効なもの（コピー可）</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">📋</span>
                      <span><strong>譲渡証明書:</strong> 実印押印済み</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">📋</span>
                      <span><strong>印鑑証明書:</strong> 発行から3ヶ月以内</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">📋</span>
                      <span><strong>自賠責保険証:</strong> 残期間があるもの</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">📋</span>
                      <span><strong>リサイクル券:</strong> 該当する場合</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-white font-semibold">バイクの場合</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">📋</span>
                      <span><strong>車検証 または 軽自動車届出済証:</strong> 排気量により異なる</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">📋</span>
                      <span><strong>譲渡証明書:</strong> 認印押印済み</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">📋</span>
                      <span><strong>自賠責保険証:</strong> 残期間があるもの</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">📋</span>
                      <span><strong>ナンバープレート:</strong> 返納が必要な場合</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-400/30 rounded-lg p-4">
                <h3 className="text-yellow-300 font-semibold mb-2">書類に関する注意事項</h3>
                <ul className="text-yellow-200 text-sm space-y-1">
                  <li>• 書類は鮮明に撮影し、文字が読めることを確認してください</li>
                  <li>• 個人情報部分は一部マスキングしていただいても構いません</li>
                  <li>• 書類に不備がある場合、オークション開始が遅れる可能性があります</li>
                  <li>• 名義変更に必要な書類は落札後に原本をお送りいただきます</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* 価格設定のコツ */}
          <Card className="bg-gray-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <span className="text-green-400">💰</span>
                価格設定のコツ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-white font-semibold">開始価格の設定</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span><strong>低めの設定:</strong> 入札者を増やし、注目度を上げる</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span><strong>市場価格の参考:</strong> 類似車両の落札価格を調査</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span><strong>手数料を考慮:</strong> 落札価格から手数料を差し引いた金額</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-white font-semibold">リザーブ価格（希望最低落札価格）</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span><strong>最低希望金額:</strong> この価格未満では売却しない金額</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span><strong>非公開設定:</strong> 入札者からは見えない設定</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span><strong>適正な設定:</strong> 高すぎると入札が集まらない</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 出品時の注意点 */}
          <Card className="bg-gray-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <span className="text-red-400">⚠️</span>
                出品時の注意点
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="bg-red-900/20 border border-red-400/30 rounded-lg p-4">
                  <h3 className="text-red-300 font-semibold mb-2">禁止事項</h3>
                  <ul className="text-red-200 text-sm space-y-1">
                    <li>• 虚偽の情報での出品（年式、走行距離、事故歴等）</li>
                    <li>• 盗難車・不正な手段で入手した車両の出品</li>
                    <li>• 車検証の名義と出品者が異なる場合の無断出品</li>
                    <li>• 重大な欠陥・問題を隠しての出品</li>
                    <li>• 同一車両の重複出品</li>
                  </ul>
                </div>

                <div className="bg-orange-900/20 border border-orange-400/30 rounded-lg p-4">
                  <h3 className="text-orange-300 font-semibold mb-2">推奨事項</h3>
                  <ul className="text-orange-200 text-sm space-y-1">
                    <li>• 可能な限り詳細な情報を記載する</li>
                    <li>• 修復歴・事故歴は正直に申告する</li>
                    <li>• メンテナンス記録があれば添付する</li>
                    <li>• 質問への迅速かつ丁寧な回答</li>
                    <li>• 高品質な写真を多数掲載する</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 手数料について */}
          <Card className="bg-gray-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <span className="text-blue-400">💳</span>
                手数料について
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-white font-semibold">出品手数料</h3>
                  <div className="text-gray-300 text-sm space-y-2">
                    <p><strong>出品料:</strong> 無料</p>
                    <p><strong>成約手数料:</strong> 落札価格の5%（税別）</p>
                    <p><strong>最低手数料:</strong> 10,000円（税別）</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-white font-semibold">その他費用</h3>
                  <div className="text-gray-300 text-sm space-y-2">
                    <p><strong>陸送費:</strong> 落札者負担</p>
                    <p><strong>名義変更費:</strong> 落札者負担</p>
                    <p><strong>書類郵送費:</strong> 出品者負担</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-400/30 rounded-lg p-4">
                <h3 className="text-blue-300 font-semibold mb-2">手数料の例</h3>
                <div className="text-blue-200 text-sm space-y-1">
                  <p>落札価格 100万円の場合: 成約手数料 50,000円（税別）</p>
                  <p>落札価格 50万円の場合: 成約手数料 25,000円（税別）</p>
                  <p>落札価格 10万円の場合: 成約手数料 10,000円（税別・最低手数料適用）</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* よくある質問 */}
          <Card className="bg-gray-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <span className="text-purple-400">❓</span>
                よくある質問
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {[
                  {
                    q: "出品後にキャンセルはできますか？",
                    a: "オークション開始前であればキャンセル可能です。開始後は原則として不可ですが、やむを得ない事情がある場合はご相談ください。"
                  },
                  {
                    q: "希望価格に達しなかった場合はどうなりますか？",
                    a: "リザーブ価格を設定している場合、その価格に達しなければ売却義務はありません。再出品も可能です。"
                  },
                  {
                    q: "出品車両の保管はどうすればよいですか？",
                    a: "オークション期間中も出品者様で保管していただきます。落札後の引き渡しまで安全に保管してください。"
                  },
                  {
                    q: "落札後の手続きはどのように進みますか？",
                    a: "落札後48時間以内に落札者と連絡を取り、代金決済と車両引き渡しの手続きを進めます。詳細は落札後にご案内いたします。"
                  }
                ].map((faq, index) => (
                  <div key={index} className="border-l-4 border-purple-400 pl-4">
                    <h3 className="text-white font-semibold mb-1">Q: {faq.q}</h3>
                    <p className="text-gray-300 text-sm">A: {faq.a}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}