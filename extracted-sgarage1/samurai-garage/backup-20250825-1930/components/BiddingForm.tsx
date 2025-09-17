import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ListingWithDetails } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatters";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import BidFeePayment from "./BidFeePayment";

// Initialize Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface BiddingFormProps {
  listing: ListingWithDetails;
  currentUserId: string;
}

export default function BiddingForm({ listing, currentUserId }: BiddingFormProps) {
  const [bidAmount, setBidAmount] = useState("");
  const [showFeePayment, setShowFeePayment] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [feeAmount, setFeeAmount] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get bid increment rules - Yahoo Auction style
  const { data: bidIncrements } = useQuery({
    queryKey: ["/api/settings/bid_increments"],
    queryFn: async () => {
      // Yahoo Auction style bid increments
      return [
        { maxPrice: 1000, increment: 10 },
        { maxPrice: 5000, increment: 100 },
        { maxPrice: 10000, increment: 250 },
        { maxPrice: 50000, increment: 500 },
        { maxPrice: 100000, increment: 1000 },
        { maxPrice: 1000000, increment: 5000 },
        { maxPrice: 5000000, increment: 10000 },
        { maxPrice: null, increment: 50000 },
      ];
    },
  });

  // Create payment intent for bid fee
  const createPaymentMutation = useMutation({
    mutationFn: async (bidAmount: string) => {
      const response = await apiRequest("POST", "/api/create-bid-fee-payment", {
        bidAmount: parseFloat(bidAmount),
      });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setFeeAmount(data.feeAmount);
      setShowFeePayment(true);
    },
    onError: (error) => {
      toast({
        title: "決済準備エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bidMutation = useMutation({
    mutationFn: async (amount: string) => {
      return await apiRequest("POST", "/api/bid", {
        listingId: listing.id,
        amount: parseFloat(amount),
      });
    },
    onSuccess: () => {
      setBidAmount("");
      setShowFeePayment(false);
      setClientSecret("");
      queryClient.invalidateQueries({
        queryKey: ["/api/listings", listing.slug],
      });
      toast({
        title: "入札が完了しました",
        description: "新しい最高入札者になりました",
        variant: "default",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "認証エラー",
          description: "ログインし直してください",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "入札エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate minimum bid amount
  const currentPrice = parseFloat(listing.currentPrice);
  const increment = bidIncrements?.find(rule => 
    rule.maxPrice === null || currentPrice < rule.maxPrice
  )?.increment || 50000;
  const minBid = currentPrice + increment;

  // Check if user is the seller
  // Allow bidding on own listings for testing purposes
  // if (listing.sellerId === currentUserId) {
  //   return (
  //     <Card>
  //       <CardContent className="p-6">
  //         <p className="text-gray-500 text-center">
  //           自分の出品には入札できません
  //         </p>
  //       </CardContent>
  //     </Card>
  //   );
  // }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(bidAmount.replace(/[,¥\s]/g, ""));
    
    if (isNaN(amount) || amount < minBid) {
      toast({
        title: "入札金額エラー",
        description: `最低入札額は ${formatCurrency(minBid)} です`,
        variant: "destructive",
      });
      return;
    }

    // Show fee payment dialog
    createPaymentMutation.mutate(amount.toString());
  };

  const handlePaymentSuccess = () => {
    const amount = parseFloat(bidAmount.replace(/[,¥\s]/g, ""));
    bidMutation.mutate(amount.toString());
  };

  const handlePaymentCancel = () => {
    setShowFeePayment(false);
    setClientSecret("");
  };

  const formatBidAmount = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, "");
    if (!numericValue) return "";
    return parseInt(numericValue).toLocaleString();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>入札する</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                入札金額
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  ¥
                </span>
                <Input
                  type="text"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(formatBidAmount(e.target.value))}
                  placeholder={minBid.toLocaleString()}
                  className="pl-8"
                  data-testid="input-bid-amount"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                最低入札額: {formatCurrency(minBid)} (¥{increment.toLocaleString()}刻み)
              </p>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={createPaymentMutation.isPending || bidMutation.isPending || !bidAmount}
              data-testid="button-place-bid"
            >
              {createPaymentMutation.isPending ? "手数料計算中..." : 
               bidMutation.isPending ? "入札中..." : "入札する (手数料5%)" }
            </Button>
            
            <p className="text-xs text-gray-500 text-center">
              入札は取り消しできません・手数料が発生します
            </p>
          </form>
        </CardContent>
      </Card>

      {/* Fee Payment Dialog */}
      <Dialog open={showFeePayment} onOpenChange={setShowFeePayment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>入札手数料の支払い</DialogTitle>
          </DialogHeader>
          
          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <BidFeePayment
                bidAmount={parseFloat(bidAmount.replace(/[,¥\s]/g, "")) || 0}
                feeAmount={feeAmount}
                onPaymentSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
