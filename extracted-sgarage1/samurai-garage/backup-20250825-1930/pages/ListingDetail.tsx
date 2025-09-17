import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useSSE } from "@/hooks/useSSE";
import { useAuctionSSE } from "@/hooks/useAuctionSSE";
import Layout from "@/components/Layout";
import ImageGallery from "@/components/ImageGallery";
import BiddingForm from "@/components/BiddingForm";
import CountdownTimer from "@/components/CountdownTimer";
import BidderProfileModal from "@/components/BidderProfileModal";
import AutoBidModal from "@/components/AutoBidModal";
import { AutoBidButton } from "@/components/AutoBidButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Share2 } from "lucide-react";
import { ListingWithDetails } from "@shared/schema";
import { formatCurrency } from "@/lib/formatters";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ListingDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [isWatching, setIsWatching] = useState(false);
  const [selectedBidderId, setSelectedBidderId] = useState<string | null>(null);
  const [selectedBidderName, setSelectedBidderName] = useState<string>("");
  const [currentEndsAt, setCurrentEndsAt] = useState<string>("");
  const [currentBids, setCurrentBids] = useState<any[]>([]);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["/api/listings", slug],
    queryFn: async () => {
      const response = await fetch(`/api/listings/${slug}`);
      if (!response.ok) throw new Error("Failed to fetch listing");
      return response.json() as Promise<ListingWithDetails>;
    },
    enabled: !!slug,
  });

  const { data: watchStatus } = useQuery({
    queryKey: ["/api/watch", listing?.id, "status"],
    queryFn: async () => {
      if (!listing?.id) return { isWatching: false };
      const response = await fetch(`/api/watch/${listing.id}/status`);
      if (!response.ok) return { isWatching: false };
      return response.json();
    },
    enabled: !!listing?.id && !!user,
  });

  // Initialize state when listing loads
  if (listing && !currentEndsAt) {
    setCurrentEndsAt(listing.endAt);
    setCurrentBids(listing.bids || []);
  }

  // Real-time updates via new SSE hook
  useAuctionSSE(listing?.id || "", {
    onBid: (bidData) => {
      // Update bids list and endsAt in real-time
      setCurrentBids(prev => [bidData.bid, ...prev.slice(0, 9)]); // Keep latest 10 bids
      if (bidData.endsAt) setCurrentEndsAt(bidData.endsAt);
      // Also refresh the full listing data
      queryClient.invalidateQueries({
        queryKey: ["/api/listings", slug],
      });
    },
    onExtended: (extData) => {
      setCurrentEndsAt(extData.endsAt);
      toast({
        title: "オークション延長",
        description: `終了時間が${extData.extensionMinutes}分延長されました`,
      });
    }
  });

  const commentMutation = useMutation({
    mutationFn: async (body: string) => {
      return await apiRequest("POST", "/api/comments", {
        listingId: listing!.id,
        body,
      });
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({
        queryKey: ["/api/listings", slug],
      });
      toast({
        title: "コメントを投稿しました",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const watchMutation = useMutation({
    mutationFn: async () => {
      if (watchStatus?.isWatching) {
        await apiRequest("DELETE", `/api/watch/${listing!.id}`, {});
        return false;
      } else {
        await apiRequest("POST", "/api/watch", { listingId: listing!.id });
        return true;
      }
    },
    onSuccess: (isWatching) => {
      setIsWatching(isWatching);
      toast({
        title: isWatching ? "ウォッチリストに追加しました" : "ウォッチリストから削除しました",
        variant: "default",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/watch", listing?.id, "status"],
      });
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
        <div className="animate-pulse space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-200 h-96 rounded-lg"></div>
            <div className="space-y-4">
              <div className="bg-gray-200 h-8 rounded w-3/4"></div>
              <div className="bg-gray-200 h-4 rounded w-1/2"></div>
              <div className="bg-gray-200 h-32 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!listing) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">オークションが見つかりません</div>
        </div>
      </Layout>
    );
  }

  const hasReserve = listing.reservePrice && parseFloat(listing.reservePrice) > 0;
  const reserveMet = hasReserve ? 
    parseFloat(listing.currentPrice) >= parseFloat(listing.reservePrice!) : true;

  return (
    <Layout>
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <ImageGallery 
            photos={listing.photos} 
            title={listing.title}
            data-testid="gallery-main"
          />

          {/* Auction Info & Bidding */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid="text-title">
                {listing.title}
              </h1>
              <p className="text-lg text-gray-600 mt-1" data-testid="text-details">
                {listing.locationText} • 走行距離: {listing.mileage.toLocaleString()}km
              </p>
            </div>

            {/* Current Bid & Timer */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide">現在価格</p>
                    <p className="text-4xl font-bold text-gray-900" data-testid="text-current-price">
                      {formatCurrency(parseFloat(listing.currentPrice))}
                    </p>
                    <p className="text-sm text-gray-600 mt-1" data-testid="text-bid-count">
                      {listing._count.bids}入札
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide">残り時間</p>
                    <CountdownTimer 
                      endTime={new Date(currentEndsAt || listing.endAt)} 
                      data-testid="timer-countdown"
                    />
                    {hasReserve && (
                      <Badge 
                        variant={reserveMet ? "default" : "secondary"}
                        className={reserveMet ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                        data-testid={`badge-reserve-${reserveMet ? "met" : "not-met"}`}
                      >
                        {reserveMet ? "Reserve met" : "Reserve not met"}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bidding Form */}
            {user && listing.status === "published" && new Date() < new Date(listing.endAt) && (
              <div className="space-y-4">
                <BiddingForm 
                  listing={listing} 
                  currentUserId={user.id}
                  data-testid="form-bidding"
                />
                
                {/* Auto Bid Buttons */}
                <div className="flex justify-center space-x-4">
                  <AutoBidModal
                    listingId={listing.id}
                    currentPrice={parseFloat(listing.currentPrice)}
                    endTime={currentEndsAt || listing.endAt}
                  />
                  <AutoBidButton listingId={listing.id} />
                </div>
              </div>
            )}

            {/* Auction Actions */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => watchMutation.mutate()}
                disabled={!user || watchMutation.isPending}
                className="flex-1"
                data-testid="button-watch"
              >
                <Heart className={`mr-2 h-4 w-4 ${watchStatus?.isWatching ? 'fill-current text-red-500' : ''}`} />
                {watchStatus?.isWatching ? 'ウォッチリスト解除' : 'ウォッチリスト追加'}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                data-testid="button-share"
                onClick={() => {
                  navigator.share?.({ 
                    title: listing.title, 
                    url: window.location.href 
                  }) || navigator.clipboard.writeText(window.location.href);
                  toast({ title: "リンクをコピーしました" });
                }}
              >
                <Share2 className="mr-2 h-4 w-4" />
                シェア
              </Button>
            </div>
          </div>
        </div>

        {/* Bid History */}
        <Card>
          <CardHeader>
            <CardTitle>入札履歴</CardTitle>
          </CardHeader>
          <CardContent>
            {(currentBids.length > 0 || listing.bids.length > 0) ? (
              <div className="divide-y divide-gray-200">
                {(currentBids.length > 0 ? currentBids : listing.bids).map((bid) => (
                  <div 
                    key={bid.id} 
                    className="py-4 flex justify-between items-center"
                    data-testid={`bid-${bid.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-700">
                          {bid.bidder.firstName?.[0] || 'U'}
                        </span>
                      </div>
                      <div>
                        <button
                          onClick={() => {
                            setSelectedBidderId(bid.bidderId);
                            setSelectedBidderName(bid.bidder.firstName || 'Anonymous');
                          }}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                          data-testid={`button-bidder-${bid.id}`}
                        >
                          {bid.bidder.firstName || 'Anonymous'}****{bid.bidderId.slice(-3)}
                        </button>
                        <p className="text-sm text-gray-500" data-testid={`text-bid-time-${bid.id}`}>
                          {new Date(bid.createdAt!).toLocaleString('ja-JP')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900" data-testid={`text-bid-amount-${bid.id}`}>
                        {formatCurrency(parseFloat(bid.amount))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8" data-testid="text-no-bids">
                まだ入札がありません
              </p>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Details & Comments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Vehicle Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>車両詳細</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">メーカー</dt>
                  <dd className="text-sm font-medium text-gray-900" data-testid="text-make">
                    {listing.make}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">モデル</dt>
                  <dd className="text-sm font-medium text-gray-900" data-testid="text-model">
                    {listing.model}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">年式</dt>
                  <dd className="text-sm font-medium text-gray-900" data-testid="text-year">
                    {listing.year}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">走行距離</dt>
                  <dd className="text-sm font-medium text-gray-900" data-testid="text-mileage">
                    {listing.mileage.toLocaleString()}km
                    {listing.mileageVerified && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        実測値
                      </Badge>
                    )}
                  </dd>
                </div>
                {listing.ownershipMileage && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">所有期間中の走行距離</dt>
                    <dd className="text-sm font-medium text-gray-900" data-testid="text-ownership-mileage">
                      {listing.ownershipMileage.toLocaleString()}km
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">車検</dt>
                  <dd className="text-sm font-medium text-gray-900" data-testid="text-shaken">
                    {listing.hasShaken ? (
                      listing.shakenYear && listing.shakenMonth ? 
                        `${listing.shakenYear}年${listing.shakenMonth}月まで` : 
                        "あり"
                    ) : (
                      listing.isTemporaryRegistration ? "仮ナンバー" : "なし"
                    )}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">所在地</dt>
                  <dd className="text-sm font-medium text-gray-900" data-testid="text-location">
                    {listing.locationText}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">リザーブ価格</dt>
                  <dd className="text-sm font-medium text-gray-900" data-testid="text-reserve">
                    {hasReserve ? "設定あり" : "設定なし"}
                  </dd>
                </div>
              </dl>
              
              <div className="mt-6 space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">説明</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap" data-testid="text-description">
                    {listing.description}
                  </p>
                </div>

                {listing.specifications && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">仕様・装備</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap" data-testid="text-specifications">
                      {listing.specifications}
                    </p>
                  </div>
                )}

                {listing.condition && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">状態・コンディション</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap" data-testid="text-condition">
                      {listing.condition}
                    </p>
                  </div>
                )}

                {listing.highlights && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">セールスポイント</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap" data-testid="text-highlights">
                      {listing.highlights}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle>コメント</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                {listing.comments.length > 0 ? (
                  listing.comments.map((comment) => (
                    <div 
                      key={comment.id} 
                      className="flex space-x-3"
                      data-testid={`comment-${comment.id}`}
                    >
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-gray-700">
                          {comment.author.firstName?.[0] || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedBidderId(comment.authorId);
                              setSelectedBidderName(comment.author.firstName || 'Anonymous');
                            }}
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-sm transition-colors"
                            data-testid={`button-comment-author-${comment.id}`}
                          >
                            {comment.author.firstName || 'Anonymous'}
                          </button>
                          <p className="text-xs text-gray-500" data-testid={`text-comment-time-${comment.id}`}>
                            {new Date(comment.createdAt!).toLocaleString('ja-JP')}
                          </p>
                        </div>
                        <p className="text-sm text-gray-700 mt-1" data-testid={`text-comment-body-${comment.id}`}>
                          {comment.body}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4" data-testid="text-no-comments">
                    まだコメントがありません
                  </p>
                )}
              </div>
              
              {user && (
                <div className="border-t pt-4">
                  <div className="flex space-x-3">
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-white">
                        {user.firstName?.[0] || 'U'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="コメントを投稿..."
                        rows={2}
                        className="mb-2"
                        data-testid="input-comment"
                      />
                      <Button
                        onClick={() => commentMutation.mutate(comment)}
                        disabled={!comment.trim() || commentMutation.isPending}
                        size="sm"
                        data-testid="button-submit-comment"
                      >
                        投稿
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Documents Section */}
        {listing.documents && listing.documents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>関連書類</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {listing.documents.map((doc) => (
                  <div 
                    key={doc.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    data-testid={`document-${doc.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {doc.type === "registration_certificate" ? "車検" :
                           doc.type === "transfer_certificate" ? "譲渡" :
                           doc.type === "registration_seal" ? "印鑑" :
                           doc.type === "insurance_certificate" ? "自賠" :
                           doc.type === "maintenance_record" ? "整備" : "書類"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate" data-testid={`text-doc-name-${doc.id}`}>
                          {doc.fileName}
                        </p>
                        <p className="text-xs text-gray-500" data-testid={`text-doc-type-${doc.id}`}>
                          {doc.type === "registration_certificate" ? "車検証" :
                           doc.type === "transfer_certificate" ? "譲渡証明書" :
                           doc.type === "registration_seal" ? "印鑑証明書" :
                           doc.type === "insurance_certificate" ? "自賠責保険証明書" :
                           doc.type === "maintenance_record" ? "整備記録簿" : "その他書類"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => window.open(doc.url, '_blank')}
                        data-testid={`button-view-doc-${doc.id}`}
                      >
                        表示
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Bidder Profile Modal */}
        <BidderProfileModal
          bidderId={selectedBidderId || ""}
          bidderName={selectedBidderName}
          open={!!selectedBidderId}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedBidderId(null);
              setSelectedBidderName("");
            }
          }}
        />
      </div>
    </Layout>
  );
}
