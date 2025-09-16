import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ListingWithBids } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Gavel } from "lucide-react";

interface BidModalProps {
  listing: ListingWithBids;
  isOpen: boolean;
  onClose: () => void;
  onBidSuccess?: () => void;
}

export default function BidModal({ listing, isOpen, onClose, onBidSuccess }: BidModalProps) {
  const [bidAmount, setBidAmount] = useState<string>("");
  const [error, setError] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const bidMutation = useMutation({
    mutationFn: async (amount: string) => {
      const response = await fetch(`/api/listings/${listing.slug}/bids`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          // Note: bidderId is now handled securely server-side
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "入札に失敗しました");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "入札完了",
        description: `¥${parseInt(bidAmount.replace(/,/g, "")).toLocaleString()} で入札しました。`,
        className: "jp-body",
      });
      
      queryClient.invalidateQueries({ queryKey: ["listings", listing.slug] });
      queryClient.invalidateQueries({ queryKey: ["listings", listing.slug, "bids"] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      
      if (onBidSuccess) onBidSuccess();
      setBidAmount("");
      setError("");
      onClose();
    },
    onError: (error: Error) => {
      setError(error.message);
      toast({
        title: "入札エラー",
        description: error.message,
        variant: "destructive",
        className: "jp-body",
      });
    },
  });

  const currentPrice = parseInt(listing.currentBid || listing.reservePrice || "0");
  const minimumBid = currentPrice + 10000; // Minimum bid increment of 10,000 yen
  const isAuctionEnded = listing.endDate ? new Date() > new Date(listing.endDate) : false;

  const formatNumber = (value: string) => {
    const number = value.replace(/\D/g, "");
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    setBidAmount(formatted);
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const amount = parseInt(bidAmount.replace(/,/g, ""));
    
    if (isNaN(amount) || amount <= 0) {
      setError("有効な金額を入力してください");
      return;
    }

    if (amount < minimumBid) {
      setError(`最低入札額は ¥${minimumBid.toLocaleString()} です`);
      return;
    }

    // Enforce exact 10,000 yen increments
    if ((amount - currentPrice) % 10000 !== 0) {
      setError("入札額は現在価格から1万円単位で入力してください");
      return;
    }

    bidMutation.mutate(bidAmount.replace(/,/g, ""));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="jp-subtitle text-lg flex items-center gap-2">
            <Gavel className="w-5 h-5" />
            入札する
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Vehicle Info */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="jp-body font-semibold mb-2 truncate">{listing.title}</h3>
              <div className="flex justify-between items-center text-sm">
                <span className="jp-caption text-muted-foreground">現在価格</span>
                <span className="jp-body font-semibold">¥{currentPrice.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Auction Status Warning */}
          {isAuctionEnded && (
            <Alert className="border-destructive/50 bg-destructive/10">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="jp-body text-destructive">
                このオークションは終了しています。
              </AlertDescription>
            </Alert>
          )}

          {/* Bid Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="bidAmount" className="jp-body">
                入札金額
              </Label>
              <div className="mt-1">
                <Input
                  id="bidAmount"
                  type="text"
                  value={bidAmount}
                  onChange={handleAmountChange}
                  placeholder={`最低 ¥${minimumBid.toLocaleString()}`}
                  disabled={isAuctionEnded || bidMutation.isPending}
                  className="jp-body"
                  data-testid="bid-amount-input"
                />
              </div>
              <p className="jp-caption text-xs text-muted-foreground mt-1">
                最低入札額: ¥{minimumBid.toLocaleString()}
              </p>
            </div>

            {error && (
              <Alert className="border-destructive/50 bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription className="jp-body text-destructive">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 jp-body"
                disabled={bidMutation.isPending}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={isAuctionEnded || !bidAmount || bidMutation.isPending}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white jp-body"
                data-testid="submit-bid-button"
              >
                {bidMutation.isPending ? "入札中..." : "入札する"}
              </Button>
            </div>
          </form>

          {/* Quick Bid Buttons */}
          <div className="border-t pt-4">
            <p className="jp-caption text-xs text-muted-foreground mb-2">クイック入札</p>
            <div className="grid grid-cols-3 gap-2">
              {[10000, 50000, 100000].map((increment) => {
                const quickBidAmount = currentPrice + increment;
                return (
                  <Button
                    key={increment}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBidAmount(quickBidAmount.toLocaleString())}
                    disabled={isAuctionEnded || bidMutation.isPending}
                    className="jp-caption text-xs"
                  >
                    +¥{increment.toLocaleString()}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
