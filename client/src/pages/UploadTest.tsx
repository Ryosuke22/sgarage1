import Layout from "@/components/Layout";
import { CloudUpload } from "@/components/CloudUpload";
import { DirectUpload } from "@/components/DirectUpload";
import UploadDoc from "@/components/UploadDoc";
import Uploader from "@/components/Uploader";
import PhotoUploader from "@/components/PhotoUploader";
import DocUploader from "@/components/DocUploader";
import ShakenUpload from "@/components/ShakenUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export default function UploadTest() {
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const handleUploadComplete = (publicUrl: string) => {
    setUploadedUrls(prev => [...prev, publicUrl]);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            クラウドストレージテスト
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Google Cloud Storage統合機能をテストできます
          </p>
          <Badge variant="secondary" className="mt-2">
            企業グレード機能
          </Badge>
        </div>

        <Tabs defaultValue="simple" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="simple">シンプル</TabsTrigger>
            <TabsTrigger value="photos">複数画像</TabsTrigger>
            <TabsTrigger value="docs">PDF文書</TabsTrigger>
            <TabsTrigger value="signed-url">署名URL方式</TabsTrigger>
            <TabsTrigger value="direct">ダイレクトアップロード</TabsTrigger>
            <TabsTrigger value="simple-test">高度なテスト</TabsTrigger>
          </TabsList>
          
          <TabsContent value="simple" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>ローカルファイルアップロード</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Uploader />
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>使い方</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 text-sm">
                      <p>最もシンプルなアップロード方法です：</p>
                      <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                        <li>• ファイルを選択するだけで自動アップロード</li>
                        <li>• 設定不要で即座に利用可能</li>
                        <li>• 最大50MBまでのファイルに対応</li>
                        <li>• アップロード完了後にURLを表示</li>
                      </ul>
                      <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                        <p className="text-green-700 dark:text-green-300 text-xs">
                          <strong>推奨:</strong> GCS設定が不要で、すぐに動作します。ローカル開発やテストに最適です。
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="photos" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>複数画像アップロード</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PhotoUploader />
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>特徴</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 text-sm">
                      <p>専用の画像アップロード機能です：</p>
                      <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                        <li>• 最大20枚の画像を同時アップロード</li>
                        <li>• JPEG, PNG, WebP, HEIC, HEIF対応</li>
                        <li>• 最大200MB/ファイルまで対応</li>
                        <li>• アップロード後に画像リンクを表示</li>
                        <li>• 日付別フォルダに自動整理</li>
                      </ul>
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <p className="text-blue-700 dark:text-blue-300 text-xs">
                          <strong>画像専用:</strong> 写真や画像ファイル専用の高性能アップロード機能です。
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="docs" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>PDF文書アップロード</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium mb-3">基本アップロード</h4>
                        <DocUploader />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-3">車検証専用アップロード</h4>
                        <ShakenUpload onUploadComplete={(data) => console.log("車検証アップロード完了:", data)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>用途・特徴</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 text-sm">
                      <p>車検証やその他の重要文書用：</p>
                      <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                        <li>• 車検証、自賠責保険証明書</li>
                        <li>• 整備記録、修理履歴書類</li>
                        <li>• 譲渡証明書、印鑑証明書</li>
                        <li>• PDFファイル専用（100MB上限）</li>
                        <li>• 日付別フォルダに安全保管</li>
                      </ul>
                      <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                        <p className="text-yellow-700 dark:text-yellow-300 text-xs">
                          <strong>重要文書:</strong> 車両売買に必要な法的文書を安全にアップロード・保管できます。
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="signed-url" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <CloudUpload
                  onUploadComplete={handleUploadComplete}
                  maxFiles={5}
                  purpose="listing"
                />
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>署名URLアップロード結果</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {uploadedUrls.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        まだファイルがアップロードされていません
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {uploadedUrls.map((url, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <img 
                              src={url} 
                              alt={`Upload ${index + 1}`}
                              className="w-full h-32 object-cover rounded mb-2"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <p className="text-xs text-gray-500 break-all">
                              {url}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="direct" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <DirectUpload
                  onUploadComplete={(result) => handleUploadComplete(result.publicUrl)}
                  multiple={false}
                  purpose="listing"
                />
                
                <DirectUpload
                  onUploadComplete={(result) => handleUploadComplete(result.publicUrl)}
                  multiple={true}
                  maxFiles={3}
                  purpose="listing"
                />
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>ダイレクトアップロード結果</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {uploadedUrls.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        まだファイルがアップロードされていません
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {uploadedUrls.map((url, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <img 
                              src={url} 
                              alt={`Direct Upload ${index + 1}`}
                              className="w-full h-32 object-cover rounded mb-2"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <p className="text-xs text-gray-500 break-all">
                              {url}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="simple-test" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>シンプルアップロードテスト</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <UploadDoc />
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>テスト方法</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 text-sm">
                      <p>この簡単なテストでは：</p>
                      <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                        <li>• PDF、JPEG、PNG、WebPファイルを選択</li>
                        <li>• 署名URL取得から実際のアップロードまでの全工程を確認</li>
                        <li>• ステップごとの詳細なステータス表示</li>
                        <li>• アップロード完了後にパブリックURLを表示</li>
                      </ul>
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <p className="text-blue-700 dark:text-blue-300 text-xs">
                          <strong>注意:</strong> このテストを使用するには、GCP認証情報（GCP_PROJECT_ID、GCS_BUCKET、GCP_SERVICE_ACCOUNT_JSON）が正しく設定されている必要があります。
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Technical Details */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>技術仕様</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">サポートファイル形式</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• JPEG (.jpg, .jpeg)</li>
                  <li>• PNG (.png)</li>
                  <li>• WebP (.webp)</li>
                  <li>• AVIF (.avif)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">技術仕様</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• 最大ファイルサイズ: 10MB</li>
                  <li>• 署名URL方式: ブラウザから直接クラウドへ</li>
                  <li>• ダイレクト方式: サーバー経由でアップロード</li>
                  <li>• 署名URL有効期限: 5分</li>
                  <li>• 複数ファイル同時対応</li>
                  <li>• セキュア接続のみ対応</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}