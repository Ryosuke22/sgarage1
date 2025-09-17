import { useState } from "react";
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatters";

interface BidFeePaymentProps {
  bidAmount: number;
  feeAmount: number;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

export default function BidFeePayment({ 
  bidAmount, 
  feeAmount, 
  onPaymentSuccess, 
  onCancel 
}: BidFeePaymentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "決済エラー",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "手数料支払い完了",
          description: "入札手数料の支払いが完了しました",
        });
        onPaymentSuccess();
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "決済エラー",
        description: "決済処理中にエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 手数料説明 */}
      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          入札手数料について
        </h3>
        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <p>入札額: {formatCurrency(bidAmount)}</p>
          <p>手数料 (5%): {formatCurrency(feeAmount)}</p>
          <p className="mt-2 text-xs">
            ※ 手数料は入札成立時にのみ課金されます
          </p>
        </div>
      </div>

      {/* 決済フォーム */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <PaymentElement />
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1"
            data-testid="button-cancel-payment"
          >
            キャンセル
          </Button>
          
          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="flex-1"
            data-testid="button-submit-payment"
          >
            {isProcessing ? "処理中..." : `手数料を支払う (${formatCurrency(feeAmount)})`}
          </Button>
        </div>
      </form>
    </div>
  );
}