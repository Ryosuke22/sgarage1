import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { type VehicleWithBids } from "@shared/schema";
import Header from "@/components/header";
import CountdownTimer from "@/components/countdown-timer";
import BidModal from "@/components/bid-modal";
import { useWebSocket } from "@/hooks/use-websocket";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export default function VehicleDetail() {
  const [, params] = useRoute("/vehicles/:id");
  const [showBidModal, setShowBidModal] = useState(false);
  
  const { data: vehicle, isLoading } = useQuery<VehicleWithBids>({
    queryKey: [`/api/vehicles/${params?.id}`],
    enabled: !!params?.id,
  });

  // WebSocket connection for real-time updates
  useWebSocket();

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

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background">
        <Header onSearch={() => {}} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <h1 className="text-2xl font-bold mb-4">車両が見つかりません</h1>
              <p className="text-muted-foreground">指定された車両は存在しないか、削除されている可能性があります。</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isAuctionEnded = new Date() > new Date(vehicle.endTime);

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={() => {}} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Vehicle Image */}
        <div className="mb-8">
          <img
            src={vehicle.imageUrl}
            alt={vehicle.title}
            className="w-full h-96 object-cover rounded-lg shadow-lg"
            data-testid="vehicle-image"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Vehicle Details */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-3xl font-bold" data-testid="vehicle-title">
                {vehicle.title}
              </h1>
              <Badge variant={vehicle.category === "car" ? "default" : "secondary"}>
                {vehicle.category === "car" ? "車" : "バイク"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-sm text-muted-foreground">年式</span>
                <p className="font-semibold">{vehicle.year}年式</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">走行距離</span>
                <p className="font-semibold">{vehicle.mileage.toLocaleString()}km</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">メーカー</span>
                <p className="font-semibold">{vehicle.brand}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">モデル</span>
                <p className="font-semibold">{vehicle.model}</p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">商品説明</h2>
              <p className="text-muted-foreground leading-relaxed">
                {vehicle.description}
              </p>
            </div>
          </div>

          {/* Auction Info */}
          <div className="space-y-6">
            {/* Countdown Timer */}
            <Card>
              <CardContent className="pt-6">
                <CountdownTimer 
                  endTime={vehicle.endTime} 
                  isEnded={isAuctionEnded}
                />
              </CardContent>
            </Card>

            {/* Current Price */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-2">現在価格</div>
                  <div className="text-4xl font-bold text-primary mb-2" data-testid="current-price">
                    ¥{parseInt(vehicle.currentPrice).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    入札数: {vehicle.bidCount}件
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bid Button */}
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowBidModal(true)}
                disabled={isAuctionEnded}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3"
                data-testid="bid-button"
              >
                {isAuctionEnded ? "オークション終了" : "入札する"}
              </Button>
              <Button
                variant="outline"
                className="px-4 py-3"
                data-testid="favorite-button"
              >
                <i className="far fa-heart"></i>
              </Button>
            </div>

            {/* Starting Price */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">開始価格</div>
                <div className="text-xl font-semibold">
                  ¥{parseInt(vehicle.startingPrice).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Bid Modal */}
      <BidModal
        vehicle={vehicle}
        isOpen={showBidModal}
        onClose={() => setShowBidModal(false)}
      />
    </div>
  );
}
