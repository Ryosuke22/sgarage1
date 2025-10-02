import { Link } from "react-router-dom";
import { Car } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ListingWithDetails } from "@shared/schema";
import { formatCurrency } from "@/lib/formatters";
import { convertImageUrl } from "@/lib/imageUtils";
import { useTheme } from "@/components/ThemeProvider";
import { useTranslation } from "@/lib/i18n";

interface AuctionCardProps {
  listing: ListingWithDetails;
}

export default function AuctionCard({ listing }: AuctionCardProps) {
  const { currency, language } = useTheme();
  const { t } = useTranslation(language);
  const hasReserve = listing.reservePrice && parseFloat(listing.reservePrice) > 0;
  const reserveMet = hasReserve ? 
    parseFloat(listing.currentPrice) >= parseFloat(listing.reservePrice!) : true;

  const endTime = new Date(listing.endAt);
  const now = new Date();
  const timeRemaining = endTime.getTime() - now.getTime();
  const isEnded = timeRemaining <= 0;

  const formatTimeRemainingLocal = (ms: number) => {
    if (ms <= 0) return t('time.ended');
    
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${t('time.remaining')} ${days}${t('time.days')} ${hours}${t('time.hours')}`;
    } else if (hours > 0) {
      return `${t('time.remaining')} ${hours}${t('time.hours')} ${minutes}${t('time.minutes')}`;
    } else {
      return `${t('time.remaining')} ${minutes}${t('time.minutes')}`;
    }
  };

  const mainPhoto = listing.photos?.[0];

  return (
    <div 
      className="group cursor-pointer overflow-hidden rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-105"
      style={{ 
        backgroundColor: 'white', 
        border: '1px solid #e5e7eb',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      }}
    >
      <Link href={`/listing/${listing.slug}`} data-testid={`link-listing-${listing.id}`}>
        {/* Image */}
        <div className="relative h-56 overflow-hidden">
          {mainPhoto ? (
            <img
              src={convertImageUrl(mainPhoto.url)}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              data-testid={`img-listing-${listing.id}`}
              onError={(e) => {
                console.error('Image failed to load:', mainPhoto.url);
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div 
              className="w-full h-full gradient-neutral flex items-center justify-center"
              data-testid={`placeholder-listing-${listing.id}`}
            >
              <Car className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          
          {/* Premium overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Category badge */}
          <div className="absolute top-4 left-4">
            <div className="gradient-premium px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-lg">
              {listing.category === "car" ? t('auctioncard.classicCar') : t('auctioncard.motorcycle')}
            </div>
          </div>

          {/* Status indicator */}
          <div className="absolute top-4 right-4">
            <div className={`w-3 h-3 rounded-full shadow-lg ${isEnded ? 'bg-gray-400' : 'bg-green-500'}`} />
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-6">
        <Link href={`/listing/${listing.slug}`} data-testid={`link-title-${listing.id}`}>
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors mb-2 leading-tight">
            {listing.title}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-600 mb-4" data-testid={`text-location-${listing.id}`}>
          {listing.locationText}
        </p>

        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-3xl font-bold text-gradient mb-1" data-testid={`text-price-${listing.id}`}>
              {formatCurrency(Number(listing.currentPrice ?? listing.startingPrice ?? 0), currency)}
            </p>
            <p className="text-xs text-gray-500 font-medium">{t('auctioncard.currentPrice')}</p>
          </div>
          <div className="text-right">
            <p 
              className={`text-sm font-semibold ${isEnded ? 'text-gray-500' : 'text-red-600'} mb-1`}
              data-testid={`text-time-${listing.id}`}
            >
              {formatTimeRemainingLocal(timeRemaining)}
            </p>
            <p className="text-xs text-gray-500" data-testid={`text-bid-count-${listing.id}`}>
              {t('auctioncard.bidCount', { count: listing._count?.bids ?? (Array.isArray((listing as any).bids) ? (listing as any).bids.length : 0) })}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-start gap-2">
          {hasReserve && (
            <Badge 
              variant={reserveMet ? "default" : "secondary"}
              className={`text-xs font-medium ${
                reserveMet 
                  ? "gradient-premium text-white border-0" 
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
              }`}
              data-testid={`badge-reserve-${listing.id}`}
            >
              {reserveMet ? t('auctioncard.reserveMet') : t('auctioncard.reserveNotMet')}
            </Badge>
          )}
          
          {!isEnded && (
            <Badge className="gradient-premium text-white border-0 text-xs font-medium">
              {t('auctioncard.live')}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}