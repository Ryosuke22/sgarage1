import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { type ListingWithBids, type BidWithUser } from "@shared/schema";
import Header from "@/components/header";
import CountdownTimer from "@/components/countdown-timer";
import BidModal from "@/components/bid-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Clock, MapPin, Calendar, Gauge, Heart } from "lucide-react";

export default function VehicleDetail() {
  const [, params] = useRoute("/vehicle/:slug");
  const [showBidModal, setShowBidModal] = useState(false);
  
  const { data: listing, isLoading, refetch } = useQuery<ListingWithBids>({
    queryKey: ["listings", params?.slug],
    queryFn: async () => {
      if (!params?.slug) throw new Error("No slug provided");
      const res = await fetch(`/api/listings/${params.slug}`);
      if (!res.ok) throw new Error("Failed to fetch listing");
      return res.json();
    },
    enabled: !!params?.slug,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
  });
  
  const { data: bids, refetch: refetchBids } = useQuery<BidWithUser[]>({
    queryKey: ["listings", params?.slug, "bids"],
    queryFn: async () => {
      if (!params?.slug) return [];
      const res = await fetch(`/api/listings/${params.slug}/bids`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!params?.slug,
    refetchInterval: 5000, // Refetch bids more frequently
  });


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header onSearch={() => {}} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="w-full h-96 bg-muted rounded-lg mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-20 bg-muted rounded"></div>
                <div className="h-16 bg-muted rounded"></div>
                <div className="h-12 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Header onSearch={() => {}} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <h1 className="jp-title text-2xl font-bold mb-4">車両が見つかりません</h1>
              <p className="jp-body text-muted-foreground">指定された車両は存在しないか、削除されている可能性があります。</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isAuctionEnded = listing.endDate ? new Date() > new Date(listing.endDate) : false;
  const currentPrice = listing.currentBid || listing.reservePrice || "0";
  const displayPrice = parseInt(currentPrice).toLocaleString();

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={() => {}} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Vehicle Images */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <img
                src={listing.featuredImageUrl || "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"}
                alt={listing.title}
                className="w-full h-96 object-cover rounded-lg shadow-lg"
                data-testid="vehicle-image"
              />
            </div>
            {listing.imageUrls && listing.imageUrls.length > 1 && (
              <div className="md:col-span-2 grid grid-cols-3 gap-2">
                {listing.imageUrls.slice(1, 4).map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`${listing.title} - ${index + 2}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Vehicle Details */}
          <div className="space-y-6">
            <div className="flex items-start justify-between mb-4">
              <h1 className="jp-title text-3xl font-bold" data-testid="vehicle-title">
                {listing.title}
              </h1>
              <Badge variant={listing.category === "car" ? "default" : "secondary"} className="jp-caption">
                {listing.category === "car" ? "車" : "バイク"}
              </Badge>
            </div>

            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="jp-subtitle text-lg">基本情報</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <span className="jp-caption text-xs text-muted-foreground block">年式</span>
                      <p className="jp-body font-semibold">{listing.year}年式</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <span className="jp-caption text-xs text-muted-foreground block">走行距離</span>
                      <p className="jp-body font-semibold">{listing.mileage.toLocaleString()}km</p>
                    </div>
                  </div>
                  <div>
                    <span className="jp-caption text-xs text-muted-foreground block">メーカー</span>
                    <p className="jp-body font-semibold">{listing.make}</p>
                  </div>
                  <div>
                    <span className="jp-caption text-xs text-muted-foreground block">モデル</span>
                    <p className="jp-body font-semibold">{listing.model}</p>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <span className="jp-caption text-xs text-muted-foreground block">所在地</span>
                      <p className="jp-body font-semibold">{listing.locationText}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="jp-subtitle text-lg">商品説明</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="jp-body text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {listing.description}
                </p>
              </CardContent>
            </Card>

            {/* Specifications */}
            {listing.specifications && (
              <Card>
                <CardHeader>
                  <CardTitle className="jp-subtitle text-lg">仕様</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="jp-body text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {listing.specifications}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Condition */}
            {listing.condition && (
              <Card>
                <CardHeader>
                  <CardTitle className="jp-subtitle text-lg">状態</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="jp-body text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {listing.condition}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Highlights */}
            {listing.highlights && (
              <Card>
                <CardHeader>
                  <CardTitle className="jp-subtitle text-lg">ポイント</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="jp-body text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {listing.highlights}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Auction Info */}
          <div className="space-y-6">
            {/* Countdown Timer */}
            {listing.endDate && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="jp-caption text-sm text-muted-foreground">オークション終了まで</span>
                  </div>
                  <CountdownTimer 
                    endTime={listing.endDate} 
                    isEnded={isAuctionEnded}
                  />
                </CardContent>
              </Card>
            )}

            {/* Current Price */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="jp-caption text-sm text-muted-foreground mb-2">
                    {listing.currentBid ? "現在価格" : "リザーブ価格"}
                  </div>
                  <div className="jp-title text-4xl font-bold text-primary mb-2" data-testid="current-price">
                    ¥{displayPrice}
                  </div>
                  <div className="jp-caption text-sm text-muted-foreground">
                    入札数: {listing.bidCount || 0}件
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bid Button */}
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowBidModal(true)}
                disabled={isAuctionEnded}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 jp-body"
                data-testid="bid-button"
              >
                {isAuctionEnded ? "オークション終了" : "入札する"}
              </Button>
              <Button
                variant="outline"
                className="px-4 py-3"
                data-testid="favorite-button"
              >
                <Heart className="w-4 h-4" />
              </Button>
            </div>

            {/* Reserve Price */}
            {listing.reservePrice && (
              <Card>
                <CardContent className="pt-6">
                  <div className="jp-caption text-sm text-muted-foreground mb-1">リザーブ価格</div>
                  <div className="jp-subtitle text-xl font-semibold">
                    ¥{parseInt(listing.reservePrice).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bid History */}
            <Card>
              <CardHeader>
                <CardTitle className="jp-subtitle text-lg">入札履歴</CardTitle>
              </CardHeader>
              <CardContent>
                {bids && bids.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {bids.map((bid, index) => (
                      <div key={bid.id} className="flex justify-between items-center py-2 border-b border-border last:border-b-0">
                        <div>
                          <p className="jp-body font-semibold">¥{parseInt(bid.amount).toLocaleString()}</p>
                          <p className="jp-caption text-xs text-muted-foreground">
                            {bid.bidder.firstName || "匿名"} • {new Date(bid.createdAt || "").toLocaleString("ja-JP")}
                          </p>
                        </div>
                        {index === 0 && (
                          <Badge variant="default" className="jp-caption text-xs">
                            最高入札
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="jp-body text-muted-foreground text-center py-4">
                    まだ入札がありません
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Bid Modal */}
      <BidModal
        listing={listing}
        isOpen={showBidModal}
        onClose={() => setShowBidModal(false)}
        onBidSuccess={() => {
          refetch();
          refetchBids();
          setShowBidModal(false);
        }}
      />
    </div>
  );
}
