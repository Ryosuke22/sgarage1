import { useLocation, useRoute } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/Layout";
import { CalendarIcon, MapPinIcon, CarIcon, BikeIcon } from "lucide-react";
import type { Listing } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const formatPrice = (price: number) => `¥${price.toLocaleString()}`;

export default function ListingPreview() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/preview/:id");
  const { toast } = useToast();
  
  const { data: listing, isLoading } = useQuery<Listing>({
    queryKey: [`/api/listings/${params?.id}`],
    enabled: !!params?.id,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", `/api/listings/${params?.id}`, {
        status: "submitted"
      });
    },
    onSuccess: () => {
      toast({
        title: "出品を確定しました",
        description: "審査後に公開されます"
      });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const submitListing = () => {
    submitMutation.mutate();
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!listing) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            出品が見つかりません
          </h1>
          <Button onClick={() => navigate("/")}>
            ホームに戻る
          </Button>
        </div>
      </Layout>
    );
  }

  const CategoryIcon = listing.category === "car" ? CarIcon : BikeIcon;

  // Debug logging for photos
  console.log("Listing data:", listing);
  console.log("Photos array:", (listing as any).photos);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Preview Header */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h1 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2">
            プレビュー - 出品確認
          </h1>
          <p className="text-blue-700 dark:text-blue-300">
            以下が実際の出品ページでの表示内容です。問題がなければ「出品を確定」ボタンを押してください。
          </p>
        </div>

        {/* Top Section: Images and Key Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left: Images */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                {(listing as any).photos && (listing as any).photos.length > 0 ? (
                  <div className="space-y-4">
                    {/* Main Image */}
                    <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                      <img
                        src={(() => {
                          const photo = (listing as any).photos[0];
                          if (typeof photo === 'string') return photo;
                          if (typeof photo.url === 'string') return photo.url;
                          return photo.url.url; // Handle nested url object
                        })()}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Thumbnail Gallery */}
                    {(listing as any).photos.length > 1 && (
                      <div className="grid grid-cols-4 gap-2 p-4">
                        {(listing as any).photos.slice(1, 9).map((photo: any, index: number) => (
                          <div key={index} className="aspect-square bg-gray-100 rounded overflow-hidden">
                            <img
                              src={(() => {
                                if (typeof photo === 'string') return photo;
                                if (typeof photo.url === 'string') return photo.url;
                                return photo.url.url; // Handle nested url object
                              })()}
                              alt={`${listing.title} - 画像 ${index + 2}`}
                              className="w-full h-full object-cover cursor-pointer hover:opacity-75 transition-opacity"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 rounded-t-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <CategoryIcon className="mx-auto h-16 w-16 mb-4" />
                      <p>画像がアップロードされていません</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Key Info */}
          <div className="space-y-4">
            {/* Title and Category */}
            <Card className="dark:bg-gray-800/50 dark:border-white/10">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={listing.category === "car" ? "default" : "secondary"}>
                    {listing.category === "car" ? "自動車" : "バイク"}
                  </Badge>
                  <Badge variant="outline">
                    {listing.status === "draft" ? "下書き" : 
                     listing.status === "submitted" ? "審査中" :
                     listing.status === "approved" ? "承認済み" :
                     listing.status === "published" ? "公開中" : "終了"}
                  </Badge>
                </div>
                <CardTitle className="text-2xl dark:text-white">{listing.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">メーカー</span>
                    <p className="font-medium dark:text-white">{listing.make}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">モデル</span>
                    <p className="font-medium dark:text-white">{listing.model}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">年式</span>
                    <p className="font-medium dark:text-white">{listing.year}年</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">走行距離</span>
                    <p className="font-medium dark:text-white">
                      {listing.mileage ? listing.mileage.toLocaleString() : '記載なし'} km
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">車検</span>
                    <p className="font-medium dark:text-white">
                      {listing.hasShaken ? 'あり' : 'なし'}
                      {listing.hasShaken && listing.shakenYear && listing.shakenMonth && 
                        ` (${listing.shakenYear}年${listing.shakenMonth}月)`}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">所在地</span>
                    <p className="font-medium dark:text-white">{listing.locationText}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-green-900 dark:text-green-100">価格情報</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-green-700 dark:text-green-300">開始価格</span>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {formatPrice(parseInt(listing.startingPrice))}
                    </p>
                  </div>
                  {listing.reservePrice && (
                    <div>
                      <span className="text-sm text-green-700 dark:text-green-300">リザーブ価格</span>
                      <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                        {formatPrice(parseInt(listing.reservePrice))}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Auction Info */}
            <Card className="dark:bg-gray-800/50 dark:border-white/10">
              <CardHeader>
                <CardTitle className="dark:text-white">オークション期間</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CalendarIcon className="h-4 w-4 mt-1 text-gray-500 dark:text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">開始</span>
                    <p className="font-medium dark:text-white">
                      {new Date(listing.startAt).toLocaleString('ja-JP')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CalendarIcon className="h-4 w-4 mt-1 text-gray-500 dark:text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">終了</span>
                    <p className="font-medium dark:text-white">
                      {new Date(listing.endAt).toLocaleString('ja-JP')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section: Detailed Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Description */}
          {listing.description && (
            <Card className="dark:bg-gray-800/50 dark:border-white/10">
              <CardHeader>
                <CardTitle className="text-base dark:text-white">基本説明</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap dark:text-gray-300">{listing.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Specifications */}
          {listing.specifications && (
            <Card className="dark:bg-gray-800/50 dark:border-white/10">
              <CardHeader>
                <CardTitle className="text-base dark:text-white">仕様・装備</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap dark:text-gray-300">{listing.specifications}</p>
              </CardContent>
            </Card>
          )}

          {/* Highlights */}
          {listing.highlights && (
            <Card className="dark:bg-gray-800/50 dark:border-white/10">
              <CardHeader>
                <CardTitle className="text-base dark:text-white">セールスポイント</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap dark:text-gray-300">{listing.highlights}</p>
              </CardContent>
            </Card>
          )}

          {/* Vehicle History */}
          {((listing as any).hasAccidentHistory || (listing as any).purchaseYear) && (
            <Card className="dark:bg-gray-800/50 dark:border-white/10">
              <CardHeader>
                <CardTitle className="text-base dark:text-white">車両履歴</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {(listing as any).hasAccidentHistory && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">事故歴:</span>
                    <span className="ml-2 font-medium dark:text-white">
                      {(listing as any).hasAccidentHistory === 'yes' ? 'あり' : 
                       (listing as any).hasAccidentHistory === 'no' ? 'なし' : '不明'}
                    </span>
                  </div>
                )}
                {(listing as any).purchaseYear && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">購入年:</span>
                    <span className="ml-2 font-medium dark:text-white">{(listing as any).purchaseYear}年</span>
                  </div>
                )}
                {listing.ownershipMileage && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">所有期間走行:</span>
                    <span className="ml-2 font-medium dark:text-white">{listing.ownershipMileage.toLocaleString()} km</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Modified Parts */}
          {(listing as any).modifiedParts && (
            <Card className="dark:bg-gray-800/50 dark:border-white/10">
              <CardHeader>
                <CardTitle className="text-base dark:text-white">改造箇所</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap dark:text-gray-300">{(listing as any).modifiedParts}</p>
              </CardContent>
            </Card>
          )}

          {/* Pre-Purchase Info */}
          {(listing as any).prePurchaseInfo && (
            <Card className="dark:bg-gray-800/50 dark:border-white/10">
              <CardHeader>
                <CardTitle className="text-base dark:text-white">購入前情報</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap dark:text-gray-300">{(listing as any).prePurchaseInfo}</p>
              </CardContent>
            </Card>
          )}

          {/* Maintenance */}
          {(listing as any).ownerMaintenance && (
            <Card className="dark:bg-gray-800/50 dark:border-white/10">
              <CardHeader>
                <CardTitle className="text-base dark:text-white">メンテナンス</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap dark:text-gray-300">{(listing as any).ownerMaintenance}</p>
              </CardContent>
            </Card>
          )}

          {/* Known Issues */}
          {(listing as any).knownIssues && (
            <Card className="dark:bg-gray-800/50 dark:border-white/10">
              <CardHeader>
                <CardTitle className="text-base dark:text-white">問題点</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap dark:text-gray-300">{(listing as any).knownIssues}</p>
              </CardContent>
            </Card>
          )}

          {/* VIN & Other Details */}
          {((listing as any).vin || (listing as any).videoUrl || listing.isTemporaryRegistration) && (
            <Card className="dark:bg-gray-800/50 dark:border-white/10">
              <CardHeader>
                <CardTitle className="text-base dark:text-white">その他情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {(listing as any).vin && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">VIN:</span>
                    <p className="font-mono dark:text-white">{(listing as any).vin}</p>
                  </div>
                )}
                {listing.isTemporaryRegistration && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">一時抹消:</span>
                    <span className="ml-2 font-medium dark:text-white">登録済み</span>
                  </div>
                )}
                {(listing as any).videoUrl && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">動画:</span>
                    <a 
                      href={(listing as any).videoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 dark:text-blue-400 hover:underline text-sm"
                    >
                      視聴する
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-4 -mx-6 px-6">
          <div className="max-w-7xl mx-auto flex justify-end gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate("/create")}
              data-testid="button-edit"
              className="dark:border-white/20 dark:text-white dark:hover:bg-white/10"
            >
              編集に戻る
            </Button>
            <Button 
              onClick={() => submitListing()}
              disabled={submitMutation.isPending}
              data-testid="button-confirm"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              {submitMutation.isPending ? "提出中..." : "出品を確定"}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}