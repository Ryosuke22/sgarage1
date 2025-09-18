import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReserveBadge } from "./ReserveBadge";
import { FeeHint } from "./FeeHint";
import { getRealtimeClient } from "@/lib/realtime";
import { Clock, TrendingUp, Gavel } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatters";
import { useTheme } from "@/components/ThemeProvider";
import { useTranslation, formatTimeRemaining } from "@/lib/i18n";

interface BidBarProps {
  listingId: string;
  currentPrice: number;
  minIncrement: number;
  endAtISO: string;
  reserveState: 'none' | 'met' | 'not_met';
  onBidPlaced?: (newPrice: number) => void;
}

export function BidBar({ 
  listingId, 
  currentPrice: initialPrice, 
  minIncrement, 
  endAtISO, 
  reserveState: initialReserveState,
  onBidPlaced 
}: BidBarProps) {
  const { currency, language } = useTheme();
  const { t } = useTranslation(language);
  const [currentPrice, setCurrentPrice] = useState(initialPrice);
  const [bidAmount, setBidAmount] = useState(initialPrice + minIncrement);
  const [endAt, setEndAt] = useState(new Date(endAtISO));
  const [reserveState, setReserveState] = useState(initialReserveState);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // 時間表示更新
  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      const remaining = endAt.getTime() - now.getTime();
      
      const formattedTime = formatTimeRemaining(endAt, language);
      setTimeRemaining(formattedTime);
    };
    
    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    
    return () => clearInterval(interval);
  }, [endAt, language]);
  
  // リアルタイム更新の購読
  useEffect(() => {
    const realtimeClient = getRealtimeClient();
    
    // 入札更新イベントを購読
    const handleBidUpdate = (event: any) => {
      if (event.listingId === listingId) {
        setCurrentPrice(event.currentPrice);
        setEndAt(new Date(event.endAt));
        setReserveState(event.reserveState);
        setBidAmount(event.currentPrice + minIncrement);
      }
    };
    
    realtimeClient.on('bid_placed', handleBidUpdate);
    realtimeClient.subscribeListing(listingId);
    
    return () => {
      realtimeClient.off('bid_placed', handleBidUpdate);
      realtimeClient.unsubscribeListing(listingId);
    };
  }, [listingId, minIncrement]);
  
  // 入札送信
  const handleBid = async () => {
    if (isSubmitting) return;
    
    const minimumBid = currentPrice + minIncrement;
    if (bidAmount < minimumBid) {
      toast({
        title: t('bidbar.minimumBidError'),
        description: t('bidbar.minimumBidDescription', { amount: formatCurrency(minimumBid, currency) }),
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId,
          amount: bidAmount
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: t('bidbar.bidSuccess'),
          description: t('bidbar.bidSuccessDescription', { amount: formatCurrency(bidAmount, currency) }),
        });
        
        // 入札成功時のコールバック
        onBidPlaced?.(bidAmount);
        
        // UI は WebSocket 経由で更新される
      } else {
        toast({
          title: t('bidbar.bidError'),
          description: data.error || t('bidbar.bidErrorDescription'),
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Bid submission error:', error);
      toast({
        title: t('bidbar.networkError'),
        description: t('bidbar.networkErrorDescription'),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  
  const isAuctionEnded = new Date() > endAt;
  const minimumBid = currentPrice + minIncrement;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 shadow-lg z-50" data-testid="bid-bar">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* ステータス行 */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400" data-testid="current-price">
              <TrendingUp className="h-4 w-4" />
              <span>{t('bidbar.currentPrice')}: </span>
              <span className="font-semibold text-lg text-black dark:text-white">
                {formatCurrency(currentPrice, currency)}
              </span>
            </div>
            <ReserveBadge reserveState={reserveState} />
          </div>
          
          <div className="flex items-center gap-1" data-testid="time-remaining">
            <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <span className={`font-medium ${
              timeRemaining === t('time.ended') 
                ? 'text-red-600 dark:text-red-400' 
                : 'text-gray-900 dark:text-gray-100'
            }`}>
              {timeRemaining}
            </span>
          </div>
        </div>
        
        {/* 入札フォーム */}
        {!isAuctionEnded && (
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(Number(e.target.value))}
                min={minimumBid}
                step={minIncrement}
                placeholder={t('bidbar.minimumBidPlaceholder', { amount: formatCurrency(minimumBid, currency) })}
                className="text-lg font-medium"
                data-testid="bid-amount-input"
              />
            </div>
            <Button 
              onClick={handleBid}
              disabled={isSubmitting || bidAmount < minimumBid}
              size="lg"
              className="min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="submit-bid-button"
            >
              <Gavel className="h-4 w-4 mr-2" />
              {isSubmitting ? t('bidbar.submitting') : t('bidbar.submit')}
            </Button>
          </div>
        )}
        
        {isAuctionEnded && (
          <div className="text-center py-2">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {t('bidbar.auctionEnded')}
            </Badge>
          </div>
        )}
        
        {/* 手数料ヒント */}
        {!isAuctionEnded && bidAmount > 0 && (
          <FeeHint bidAmount={bidAmount} />
        )}
      </div>
    </div>
  );
}