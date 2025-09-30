import { useLocation, useRoute } from "wouter";
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
      <div className="max-w-6xl mx-auto p-6">
        {/* Preview Header */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h1 className="text-xl font-bold text-blue-900 mb-2">
            プレビュー - 出品確認
          </h1>
          <p className="text-blue-700">
            以下が実際の出品ページでの表示内容です。問題がなければ「出品を確定」ボタンを押してください。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images */}
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

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Title and Basic Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
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
                <CardTitle className="text-2xl">{listing.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">メーカー:</span>
                    <p className="font-medium">{listing.make}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">モデル:</span>
                    <p className="font-medium">{listing.model}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">年式:</span>
                    <p className="font-medium">{listing.year}年</p>
                  </div>
                  <div>
                    <span className="text-gray-500">走行距離:</span>
                    <p className="font-medium">
                      {listing.mileage ? listing.mileage.toLocaleString() : '記載なし'} km
                      {listing.mileageVerified && <span className="ml-2 text-green-600">✓認証済み</span>}
                    </p>
                  </div>
                  {listing.ownershipMileage && (
                    <div className="col-span-2">
                      <span className="text-gray-500">所有期間中走行距離:</span>
                      <p className="font-medium">{listing.ownershipMileage.toLocaleString()} km</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">車検:</span>
                    <p className="font-medium">
                      {listing.hasShaken ? 'あり' : 'なし'}
                      {listing.hasShaken && listing.shakenYear && listing.shakenMonth && 
                        ` (${listing.shakenYear}年${listing.shakenMonth}月まで)`}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">仮登録:</span>
                    <p className="font-medium">{listing.isTemporaryRegistration ? 'はい' : 'いいえ'}</p>
                  </div>
                </div>

                <div className="flex items-center text-gray-600">
                  <MapPinIcon className="h-4 w-4 mr-2" />
                  <span>{listing.locationText}{(listing as any).city ? ` - ${(listing as any).city}` : ''}</span>
                </div>

                {(listing as any).vin && (
                  <div className="pt-2 border-t">
                    <span className="text-gray-500 text-sm">VIN番号:</span>
                    <p className="font-mono text-sm">{(listing as any).vin}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>価格情報</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-500 text-sm">開始価格</span>
                    <p className="text-2xl font-bold text-green-600">
                      {formatPrice(parseInt(listing.startingPrice))}
                    </p>
                  </div>
                  {listing.reservePrice && (
                    <div>
                      <span className="text-gray-500 text-sm">リザーブ価格</span>
                      <p className="text-lg font-semibold">
                        {formatPrice(parseInt(listing.reservePrice))}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Auction Timing */}
            <Card>
              <CardHeader>
                <CardTitle>オークション期間</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <div>
                      <span className="text-gray-500 text-sm">開始:</span>
                      <p className="font-medium">
                        {new Date(listing.startAt).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <div>
                      <span className="text-gray-500 text-sm">終了:</span>
                      <p className="font-medium">
                        {new Date(listing.endAt).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>基本説明</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{listing.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Specifications */}
            {listing.specifications && (
              <Card>
                <CardHeader>
                  <CardTitle>仕様・装備</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{listing.specifications}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Condition */}
            {listing.condition && (
              <Card>
                <CardHeader>
                  <CardTitle>コンディション</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{listing.condition}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Highlights */}
            {listing.highlights && (
              <Card>
                <CardHeader>
                  <CardTitle>セールスポイント</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{listing.highlights}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Vehicle History */}
            {((listing as any).hasAccidentHistory || (listing as any).purchaseYear) && (
              <Card>
                <CardHeader>
                  <CardTitle>車両履歴</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(listing as any).hasAccidentHistory && (
                    <div>
                      <span className="text-gray-500 text-sm">事故歴:</span>
                      <p className="font-medium">
                        {(listing as any).hasAccidentHistory === 'yes' ? 'あり' : 
                         (listing as any).hasAccidentHistory === 'no' ? 'なし' : '不明'}
                      </p>
                    </div>
                  )}
                  {(listing as any).purchaseYear && (
                    <div>
                      <span className="text-gray-500 text-sm">購入した年:</span>
                      <p className="font-medium">{(listing as any).purchaseYear}年</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Modified Parts */}
            {(listing as any).modifiedParts && (
              <Card>
                <CardHeader>
                  <CardTitle>改造されている場所</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{(listing as any).modifiedParts}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pre-Purchase Info */}
            {(listing as any).prePurchaseInfo && (
              <Card>
                <CardHeader>
                  <CardTitle>購入前情報</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{(listing as any).prePurchaseInfo}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Owner Maintenance */}
            {(listing as any).ownerMaintenance && (
              <Card>
                <CardHeader>
                  <CardTitle>メンテナンス情報</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{(listing as any).ownerMaintenance}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Known Issues */}
            {(listing as any).knownIssues && (
              <Card>
                <CardHeader>
                  <CardTitle>車両の問題点</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{(listing as any).knownIssues}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Video URL */}
            {(listing as any).videoUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>動画</CardTitle>
                </CardHeader>
                <CardContent>
                  <a 
                    href={(listing as any).videoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    {(listing as any).videoUrl}
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </CardContent>
              </Card>
            )}

            {/* Auction Preferences */}
            {((listing as any).preferredDayOfWeek || (listing as any).preferredStartTime || (listing as any).auctionDuration) && (
              <Card>
                <CardHeader>
                  <CardTitle>オークション希望設定</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(listing as any).preferredDayOfWeek && (
                    <div>
                      <span className="text-gray-500 text-sm">希望開始曜日:</span>
                      <p className="font-medium">
                        {(listing as any).preferredDayOfWeek === 'monday' ? '月曜日' :
                         (listing as any).preferredDayOfWeek === 'tuesday' ? '火曜日' :
                         (listing as any).preferredDayOfWeek === 'wednesday' ? '水曜日' :
                         (listing as any).preferredDayOfWeek === 'thursday' ? '木曜日' :
                         (listing as any).preferredDayOfWeek === 'friday' ? '金曜日' :
                         (listing as any).preferredDayOfWeek === 'saturday' ? '土曜日' :
                         (listing as any).preferredDayOfWeek === 'sunday' ? '日曜日' : '未設定'}
                      </p>
                    </div>
                  )}
                  {(listing as any).preferredStartTime && (
                    <div>
                      <span className="text-gray-500 text-sm">希望開始時刻:</span>
                      <p className="font-medium">{(listing as any).preferredStartTime}</p>
                    </div>
                  )}
                  {(listing as any).auctionDuration && (
                    <div>
                      <span className="text-gray-500 text-sm">オークション期間:</span>
                      <p className="font-medium">{(listing as any).auctionDuration}日間</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => navigate("/create")}
            data-testid="button-edit"
          >
            編集に戻る
          </Button>
          <Button 
            onClick={() => submitListing()}
            disabled={submitMutation.isPending}
            data-testid="button-confirm"
          >
            {submitMutation.isPending ? "提出中..." : "出品を確定"}
          </Button>
        </div>
      </div>
    </Layout>
  );
}