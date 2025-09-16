import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type VehicleWithBids } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface BidModalProps {
  vehicle: VehicleWithBids;
  isOpen: boolean;
  onClose: () => void;
}

export default function BidModal({ vehicle, isOpen, onClose }: BidModalProps) {
  const [bidAmount, setBidAmount] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const bidMutation = useMutation({
    mutationFn: async (amount: string) => {
      const response = await apiRequest("POST", `/api/vehicles/${vehicle.id}/bids`, {
        amount,
        bidderId: "anonymous",
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "入札完了",
        description: "入札が正常に処理されました。",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles", vehicle.id] });
      setBidAmount("");
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "入札エラー",
        description: error.message || "入札に失敗しました。再度お試しください。",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(bidAmount);
    const currentPrice = parseFloat(vehicle.currentPrice);
    
    if (!amount || amount <= currentPrice) {
      toast({
        title: "入札金額エラー",
        description: "入札金額は現在価格より高く設定してください。",
        variant: "destructive",
      });
      return;
    }

    bidMutation.mutate(bidAmount);
  };

  const suggestedBid = Math.ceil(parseFloat(vehicle.currentPrice) / 10000) * 10000 + 10000;
  const minBid = parseFloat(vehicle.currentPrice) + 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>入札する</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">{vehicle.title}</h3>
            <p className="text-sm text-muted-foreground">
              {vehicle.year}年式 • {vehicle.mileage.toLocaleString()}km
            </p>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">現在価格</div>
            <div className="text-2xl font-bold">
              ¥{parseInt(vehicle.currentPrice).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              入札数: {vehicle.bidCount}件
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="bidAmount">入札金額</Label>
              <Input
                id="bidAmount"
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`¥${minBid.toLocaleString()} 以上`}
                min={minBid}
                step="1000"
                data-testid="bid-amount-input"
              />
              <p className="text-xs text-muted-foreground mt-1">
                最低入札額: ¥{minBid.toLocaleString()}
              </p>
            </div>

            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBidAmount(suggestedBid.toString())}
                data-testid="suggested-bid-button"
              >
                推奨: ¥{suggestedBid.toLocaleString()}
              </Button>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                data-testid="cancel-bid-button"
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={bidMutation.isPending}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                data-testid="submit-bid-button"
              >
                {bidMutation.isPending ? "入札中..." : "入札する"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
