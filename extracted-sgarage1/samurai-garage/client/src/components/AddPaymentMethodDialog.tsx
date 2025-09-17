import { useState, useEffect } from "react";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, CreditCard } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/ThemeProvider";
import { useTranslation } from "@/lib/i18n";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface AddPaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
  setupIntentClientSecret?: string;
}

// Stripe Elements component that handles the secure card input
function PaymentMethodForm({ 
  onSuccess, 
  onCancel,
  setupIntentClientSecret 
}: {
  onSuccess: () => Promise<void>;
  onCancel: () => void;
  setupIntentClientSecret?: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { language } = useTheme();
  const { t } = useTranslation(language);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!stripe || !elements) {
      setError(t('payment.loadingError'));
      return;
    }

    if (!setupIntentClientSecret) {
      setError(t('payment.addCardError'));
      return;
    }

    setIsProcessing(true);

    try {
      // Confirm the SetupIntent to save the payment method
      const { error: stripeError } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/profile`, // Return to profile page
        },
        redirect: 'if_required',
      });

      if (stripeError) {
        console.error("Stripe error:", stripeError);
        setError(stripeError.message || t('payment.addCardError'));
      } else {
        // Payment method was successfully added
        toast({
          title: t('payment.cardAdded'),
          description: t('payment.cardAddedDescription'),
        });
        await onSuccess();
      }
    } catch (err: any) {
      console.error("Payment method setup error:", err);
      setError(err.message || t('payment.addCardError'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Secure Stripe Elements card input */}
      <div className="border border-border rounded-lg p-4 bg-background">
        <PaymentElement 
          options={{
            fields: {
              billingDetails: {
                name: 'auto',
                email: 'never',
                phone: 'never',
                address: {
                  country: 'never',
                  city: 'never',
                  state: 'never',
                  postalCode: 'never',
                  line1: 'never',
                  line2: 'never',
                }
              }
            }
          }}
        />
      </div>

      {/* Security information */}
      <div className="bg-blue-50 dark:bg-blue-950/50 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>{t('payment.securityInfo')}:</strong> {t('payment.securityDescription')}
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
          data-testid="button-cancel-add-card"
        >
          {t('payment.cancel')}
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1"
          data-testid="button-add-card"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('payment.processing')}
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              {t('payment.addCardButton')}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default function AddPaymentMethodDialog({
  open,
  onOpenChange,
  onSuccess,
  setupIntentClientSecret
}: AddPaymentMethodDialogProps) {
  const { language } = useTheme();
  const { t } = useTranslation(language);

  const handleSuccess = async () => {
    await onSuccess();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  // Don't render the dialog if we don't have a setup intent client secret
  if (!setupIntentClientSecret) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t('payment.addCard')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {t('payment.addCardErrorDescription')}
              </AlertDescription>
            </Alert>
            
            <Button
              onClick={handleCancel}
              className="w-full"
              data-testid="button-close-error"
            >
              {t('payment.cancel')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t('payment.addCard')}
          </DialogTitle>
        </DialogHeader>

        {/* Wrap the form in Stripe Elements provider */}
        <Elements 
          stripe={stripePromise}
          options={{
            clientSecret: setupIntentClientSecret,
            appearance: {
              theme: 'stripe', // Can be 'stripe', 'night', or 'flat'
              variables: {
                colorPrimary: '#0570de',
                colorBackground: 'var(--background)',
                colorText: 'var(--foreground)',
                colorDanger: '#df1b41',
                fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                spacingUnit: '2px',
                borderRadius: '8px',
              }
            }
          }}
        >
          <PaymentMethodForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            setupIntentClientSecret={setupIntentClientSecret}
          />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}