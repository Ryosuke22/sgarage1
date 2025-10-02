import { Link } from "wouter";
import { type SelectListing } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CountdownTimer from "./countdown-timer";
import { useState } from "react";
import { Heart, MapPin } from "lucide-react";

interface VehicleCardProps {
  vehicle: SelectListing & {
    currentBid?: string | null;
    bidCount?: number;
  };
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const isAuctionEnded = vehicle.endDate ? new Date() > new Date(vehicle.endDate) : false;

  const currentPrice = vehicle.currentBid || vehicle.reservePrice || "0";
  const displayPrice = parseInt(currentPrice).toLocaleString();
  
  return (
    <Card className="vehicle-card group">
      <div className="relative">
        <Link href={`/vehicle/${vehicle.slug}`}>
          <div className="aspect-[4/3] overflow-hidden">
            <img
              src={vehicle.featuredImageUrl || "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"}
              alt={vehicle.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
              data-testid={`vehicle-image-${vehicle.slug}`}
            />
          </div>
        </Link>
        
        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <Badge 
            variant={vehicle.category === "car" ? "default" : "secondary"}
            className="jp-caption bg-black/70 text-white border-0"
          >
            {vehicle.category === "car" ? "車" : "バイク"}
          </Badge>
        </div>

        {/* Auction status */}
        {vehicle.endDate && (
          <div className="absolute top-3 right-3">
            <Badge 
              className={isAuctionEnded ? "status-sold" : "status-live"}
            >
              {isAuctionEnded ? "終了" : "オークション中"}
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="mb-3">
          <Link href={`/vehicle/${vehicle.slug}`}>
            <h3 className="jp-subtitle hover:text-primary cursor-pointer transition-colors mb-1">
              {vehicle.title}
            </h3>
          </Link>
          <div className="flex items-center gap-2 text-muted-foreground jp-caption">
            <span>{vehicle.year}年式</span>
            <span>•</span>
            <span>{vehicle.mileage.toLocaleString()}km</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{vehicle.locationText}</span>
            </div>
          </div>
        </div>
        
        {vehicle.endDate && !isAuctionEnded && (
          <div className="mb-3">
            <CountdownTimer endTime={vehicle.endDate} isEnded={isAuctionEnded} />
          </div>
        )}
        
        <div className="mb-4">
          <div className="jp-caption text-muted-foreground mb-1">
            {vehicle.currentBid ? "現在価格" : "リザーブ価格"}
          </div>
          <div 
            className="price-display jp-title"
            data-testid={`vehicle-price-${vehicle.slug}`}
          >
            ¥{displayPrice}
          </div>
          {vehicle.bidCount !== undefined && (
            <div className="jp-caption text-muted-foreground">
              入札数: {vehicle.bidCount || 0}件
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            asChild
            disabled={isAuctionEnded}
            className="flex-1 bg-primary hover:bg-primary/90 jp-body"
            data-testid={`bid-button-${vehicle.slug}`}
          >
            <Link href={`/vehicle/${vehicle.slug}`}>
              {isAuctionEnded ? "詳細を見る" : "入札する"}
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="px-3"
            data-testid={`favorite-button-${vehicle.slug}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsFavorited(!isFavorited);
            }}
          >
            <Heart 
              className={`w-4 h-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} 
            />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
