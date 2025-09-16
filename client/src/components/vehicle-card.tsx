import { Link } from "wouter";
import { type VehicleWithBids } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CountdownTimer from "./countdown-timer";
import BidModal from "./bid-modal";
import { useState } from "react";

interface VehicleCardProps {
  vehicle: VehicleWithBids;
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  const [showBidModal, setShowBidModal] = useState(false);
  const isAuctionEnded = new Date() > new Date(vehicle.endTime);

  return (
    <>
      <Card className="vehicle-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
        <Link href={`/vehicles/${vehicle.id}`}>
          <img
            src={vehicle.imageUrl}
            alt={vehicle.title}
            className="w-full h-48 object-cover cursor-pointer"
            data-testid={`vehicle-image-${vehicle.id}`}
          />
        </Link>
        
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <Link href={`/vehicles/${vehicle.id}`}>
              <h3 className="font-semibold text-lg hover:text-primary cursor-pointer">
                {vehicle.title}
              </h3>
            </Link>
            <Badge variant={vehicle.category === "car" ? "default" : "secondary"}>
              {vehicle.category === "car" ? "車" : "バイク"}
            </Badge>
          </div>
          
          <p className="text-muted-foreground text-sm mb-3">
            {vehicle.year}年式 • 走行距離 {vehicle.mileage.toLocaleString()}km
          </p>
          
          <div className="mb-3">
            <CountdownTimer endTime={vehicle.endTime} isEnded={isAuctionEnded} />
          </div>
          
          <div className="mb-4">
            <div className="text-sm text-muted-foreground">現在価格</div>
            <div 
              className="text-2xl font-bold text-primary"
              data-testid={`vehicle-price-${vehicle.id}`}
            >
              ¥{parseInt(vehicle.currentPrice).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              入札数: {vehicle.bidCount}件
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowBidModal(true);
              }}
              disabled={isAuctionEnded}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-2 px-4 rounded-lg transition-opacity hover:opacity-90"
              data-testid={`bid-button-${vehicle.id}`}
            >
              {isAuctionEnded ? "終了" : "入札する"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-3 py-2"
              data-testid={`favorite-button-${vehicle.id}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <i className="far fa-heart"></i>
            </Button>
          </div>
        </CardContent>
      </Card>

      <BidModal
        vehicle={vehicle}
        isOpen={showBidModal}
        onClose={() => setShowBidModal(false)}
      />
    </>
  );
}
