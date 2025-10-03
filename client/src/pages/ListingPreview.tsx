import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { ArrowLeft, CheckCircle } from "lucide-react";
import type { Listing } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const formatPrice = (price: number) => `¥${price.toLocaleString()}`;

function ImageGallery({ photos }: { photos: any[] }) {
  if (!photos || photos.length === 0) {
    return (
      <div className="aspect-[16/10] bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">画像がアップロードされていません</p>
      </div>
    );
  }

  const getPhotoUrl = (photo: any) => {
    if (typeof photo === 'string') return photo;
    if (typeof photo.url === 'string') return photo.url;
    return photo.url?.url || '';
  };

  return (
    <div className="grid gap-3 md:grid-cols-12">
      <div className="md:col-span-9">
        <img
          src={getPhotoUrl(photos[0])}
          alt="メイン画像"
          className="w-full aspect-[16/10] object-cover rounded-2xl shadow-lg"
          loading="eager"
        />
      </div>
      <div className="md:col-span-3 grid grid-cols-3 md:grid-cols-1 gap-3">
        {photos.slice(1, 5).map((photo, i) => (
          <img
            key={i}
            src={getPhotoUrl(photo)}
            alt={`サムネイル ${i + 1}`}
            className="w-full aspect-video object-cover rounded-xl border dark:border-gray-700"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl md:text-2xl font-bold tracking-tight dark:text-white">{children}</h2>;
}

function SpecTable({ specs }: { specs?: Record<string, string | number | boolean | null | undefined> }) {
  const entries = Object.entries(specs ?? {}).filter(([, v]) => v !== null && v !== undefined && v !== '');
  
  if (!entries.length) return null;
  
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border dark:border-gray-700 bg-white dark:bg-gray-800">
      <dl className="divide-y dark:divide-gray-700">
        {entries.map(([k, v]) => (
          <div key={k} className="grid grid-cols-3 gap-2 p-3">
            <dt className="col-span-1 text-sm text-gray-500 dark:text-gray-400">{k}</dt>
            <dd className="col-span-2 font-medium dark:text-white">{String(v)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

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

  if (isLoading) {
    return (
      <Layout>
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="animate-pulse grid gap-6 md:grid-cols-12">
            <div className="md:col-span-8 space-y-4">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
              <div className="h-56 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
            </div>
            <div className="md:col-span-4 h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!listing) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="text-lg dark:text-white">商品が見つかりませんでした。</p>
          <Button onClick={() => navigate("/")} className="mt-4">
            ホームに戻る
          </Button>
        </div>
      </Layout>
    );
  }

  // Build specs object
  const specs: Record<string, string | number> = {
    カテゴリー: listing.category === 'car' ? '自動車' : 'バイク',
    年式: listing.year,
    メーカー: listing.make,
    モデル: listing.model,
    走行距離: `${listing.mileage?.toLocaleString()} km`,
  };

  if (listing.mileageVerified) {
    specs['走行距離認証'] = '認証済み ✓';
  }

  if (listing.ownershipMileage) {
    specs['所有期間走行'] = `${listing.ownershipMileage.toLocaleString()} km`;
  }

  if (listing.hasShaken) {
    specs['車検'] = listing.shakenYear && listing.shakenMonth 
      ? `${listing.shakenYear}年${listing.shakenMonth}月まで`
      : 'あり';
  } else {
    specs['車検'] = 'なし';
  }

  if (listing.isTemporaryRegistration) {
    specs['登録状態'] = '一時抹消';
  }

  if ((listing as any).vin) {
    specs['VIN'] = (listing as any).vin;
  }

  specs['所在地'] = listing.locationText;

  if ((listing as any).city) {
    specs['市区町村'] = (listing as any).city;
  }

  // Build highlights array
  const highlights: string[] = [];
  if (listing.highlights) {
    highlights.push(...listing.highlights.split('\n').filter(h => h.trim()));
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Preview Header */}
        <div className="border-b bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="mx-auto max-w-6xl px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-blue-600 text-white">プレビュー</Badge>
                  <Badge variant="outline" className="border-blue-600 text-blue-600 dark:text-blue-400">
                    {listing.category === "car" ? "自動車" : "バイク"}
                  </Badge>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  以下が実際の出品ページでの表示内容です。問題がなければ「出品を確定」ボタンを押してください。
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => navigate(`/create?edit=${listing.id}`)}
                data-testid="button-back-edit"
                className="hidden md:flex items-center gap-2 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
              >
                <ArrowLeft className="w-4 h-4" />
                編集に戻る
              </Button>
            </div>
          </div>
        </div>

        {/* Page Header */}
        <div className="border-b bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight dark:text-white">
                  {listing.title}
                </h1>
                {listing.locationText && (
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    📍 {listing.locationText}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-6xl px-4 py-8 grid gap-8 md:grid-cols-12">
          {/* Left Column */}
          <div className="md:col-span-8 space-y-8">
            <ImageGallery photos={(listing as any).photos || []} />

            {highlights.length > 0 && (
              <section>
                <SectionTitle>ハイライト</SectionTitle>
                <ul className="mt-3 grid gap-2 md:grid-cols-2">
                  {highlights.map((h, i) => (
                    <li key={i} className="rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm dark:text-gray-300">
                      ✓ {h}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {listing.description && (
              <section>
                <SectionTitle>車両説明</SectionTitle>
                <div className="mt-3 bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 p-5 leading-relaxed text-gray-800 dark:text-gray-300 whitespace-pre-wrap">
                  {listing.description}
                </div>
              </section>
            )}

            <section>
              <SectionTitle>仕様</SectionTitle>
              <Card className="mt-3 dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-xl dark:text-white">車両詳細</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">カテゴリー:</span>
                      <p className="font-medium dark:text-white">{listing.category === 'car' ? '自動車' : 'バイク'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">メーカー:</span>
                      <p className="font-medium dark:text-white">{listing.make}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">モデル:</span>
                      <p className="font-medium dark:text-white">{listing.model}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">年式:</span>
                      <p className="font-medium dark:text-white">{listing.year}年</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">走行距離:</span>
                      <p className="font-medium dark:text-white">
                        {listing.mileage ? listing.mileage.toLocaleString() : '記載なし'} km
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">実走行フラグ:</span>
                      <p className="font-medium dark:text-white">{listing.mileageVerified ? '実走行' : '不明'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">所有期間の走行距離:</span>
                      <p className="font-medium dark:text-white">
                        {typeof (listing as any).ownershipMileage === 'number'
                          ? (listing as any).ownershipMileage.toLocaleString() + ' km'
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">フレームNo.:</span>
                      <p className="font-medium dark:text-white">{(listing as any).vin || '—'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">事故歴:</span>
                      <p className="font-medium dark:text-white">
                        {((listing as any).hasAccidentHistory === 'yes' && 'あり') ||
                         ((listing as any).hasAccidentHistory === 'no' && 'なし') ||
                         ((listing as any).hasAccidentHistory === 'unknown' && '不明') ||
                         '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">車検:</span>
                      <p className="font-medium dark:text-white">
                        {listing.hasShaken
                          ? `${(listing as any).shakenYear || '—'}年${(listing as any).shakenMonth || '—'}月`
                          : 'なし'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">一時抹消:</span>
                      <p className="font-medium dark:text-white">{(listing as any).isTemporaryRegistration ? 'はい' : 'いいえ'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">購入年:</span>
                      <p className="font-medium dark:text-white">{(listing as any).purchaseYear ? `${(listing as any).purchaseYear}年` : '—'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">所在地:</span>
                      <p className="font-medium dark:text-white">{listing.locationText}</p>
                    </div>
                    {(listing as any).city && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">市区町村:</span>
                        <p className="font-medium dark:text-white">{(listing as any).city}</p>
                      </div>
                    )}
                    {(listing as any).videoUrl && (
                      <div className="col-span-2">
                        <span className="text-gray-500 dark:text-gray-400">動画:</span>
                        <p className="font-medium dark:text-white">
                          <a className="underline text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300" href={(listing as any).videoUrl} target="_blank" rel="noreferrer">
                            {(listing as any).videoUrl}
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>

            {listing.specifications && (
              <section>
                <SectionTitle>仕様・装備</SectionTitle>
                <div className="mt-3 bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 p-5 leading-relaxed text-gray-800 dark:text-gray-300 whitespace-pre-wrap">
                  {listing.specifications}
                </div>
              </section>
            )}

            {((listing as any).modifiedParts || (listing as any).prePurchaseInfo ||
              (listing as any).ownerMaintenance || (listing as any).knownIssues) && (
              <section>
                <SectionTitle>詳細情報</SectionTitle>
                <div className="mt-3 space-y-3">
                  {(listing as any).modifiedParts && (
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                      <CardHeader>
                        <CardTitle>改造箇所</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="whitespace-pre-wrap text-sm dark:text-gray-300">{(listing as any).modifiedParts}</p>
                      </CardContent>
                    </Card>
                  )}
                  {(listing as any).prePurchaseInfo && (
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                      <CardHeader>
                        <CardTitle>購入前情報</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="whitespace-pre-wrap text-sm dark:text-gray-300">{(listing as any).prePurchaseInfo}</p>
                      </CardContent>
                    </Card>
                  )}
                  {(listing as any).ownerMaintenance && (
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                      <CardHeader>
                        <CardTitle>メンテナンス</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="whitespace-pre-wrap text-sm dark:text-gray-300">{(listing as any).ownerMaintenance}</p>
                      </CardContent>
                    </Card>
                  )}
                  {(listing as any).knownIssues && (
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                      <CardHeader>
                        <CardTitle>既知の不具合</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="whitespace-pre-wrap text-sm dark:text-gray-300">{(listing as any).knownIssues}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </section>
            )}

          </div>

          {/* Right Column */}
          <div className="md:col-span-4">
            <div className="sticky top-6 space-y-4">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                <CardContent className="p-5">
                  <div className="text-sm text-green-700 dark:text-green-300">開始価格</div>
                  <div className="text-3xl font-extrabold tracking-tight mt-1 text-green-600 dark:text-green-400">
                    {formatPrice(parseInt(listing.startingPrice))}
                  </div>
                  {listing.reservePrice && (
                    <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700">
                      <div className="text-sm text-green-700 dark:text-green-300">リザーブ価格</div>
                      <div className="text-xl font-semibold text-green-600 dark:text-green-400">
                        {formatPrice(parseInt(listing.reservePrice))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-5">
                  <div className="text-sm text-gray-500 dark:text-gray-400">オークション期間</div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">開始:</span>
                      <div className="font-medium dark:text-white">
                        {new Date(listing.startAt).toLocaleString('ja-JP')}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">終了:</span>
                      <div className="font-medium dark:text-white">
                        {new Date(listing.endAt).toLocaleString('ja-JP')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {((listing as any).preferredDayOfWeek || (listing as any).preferredStartTime || (listing as any).auctionDuration) && (
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-5">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">希望設定</div>
                    <div className="space-y-2 text-sm">
                      {(listing as any).preferredDayOfWeek && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">希望曜日:</span>
                          <span className="ml-2 font-medium dark:text-white">{(listing as any).preferredDayOfWeek}</span>
                        </div>
                      )}
                      {(listing as any).preferredStartTime && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">希望時刻:</span>
                          <span className="ml-2 font-medium dark:text-white">{(listing as any).preferredStartTime}</span>
                        </div>
                      )}
                      {(listing as any).auctionDuration && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">期間:</span>
                          <span className="ml-2 font-medium dark:text-white">{(listing as any).auctionDuration}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
                data-testid="button-confirm"
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-6 text-lg font-semibold rounded-xl shadow-lg"
              >
                {submitMutation.isPending ? (
                  "提出中..."
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    出品を確定
                  </span>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate(`/create?edit=${listing.id}`)}
                data-testid="button-edit"
                className="w-full dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
              >
                編集に戻る
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
