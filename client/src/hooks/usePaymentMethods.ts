import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { useTheme } from "@/components/ThemeProvider";

// Types for Stripe Payment Methods
export interface PaymentMethod {
  id: string;
  object: 'payment_method';
  billing_details: {
    address: any;
    email: string | null;
    name: string | null;
    phone: string | null;
  };
  card: {
    brand: string;
    checks: any;
    country: string;
    exp_month: number;
    exp_year: number;
    fingerprint: string;
    funding: string;
    generated_from: any;
    last4: string;
    networks: any;
    three_d_secure_usage: any;
    wallet: any;
  };
  created: number;
  customer: string;
  livemode: boolean;
  metadata: any;
  type: 'card';
  isDefault?: boolean; // Added for default payment method identification
}

export interface SetupIntent {
  clientSecret: string;
}

export function usePaymentMethods() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { language } = useTheme();
  const { t } = useTranslation(language);

  // Fetch payment methods
  const {
    data: paymentMethods = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<PaymentMethod[]>({
    queryKey: ['/api/payment-methods'],
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Create setup intent for adding new card
  const createSetupIntentMutation = useMutation({
    mutationFn: async (): Promise<SetupIntent> => {
      const response = await apiRequest("POST", "/api/setup-intent");
      return response.json();
    },
    onError: (error: any) => {
      console.error("Setup intent creation failed:", error);
      toast({
        title: t('payment.error'),
        description: t('payment.setupIntentFailed'),
        variant: "destructive",
      });
    },
  });

  // Delete payment method
  const deletePaymentMethodMutation = useMutation({
    mutationFn: async (paymentMethodId: string): Promise<void> => {
      await apiRequest("DELETE", `/api/payment-methods/${paymentMethodId}`);
    },
    onSuccess: (_, paymentMethodId) => {
      // Remove from cache
      queryClient.setQueryData<PaymentMethod[]>(['/api/payment-methods'], (oldData) => 
        oldData ? oldData.filter(pm => pm.id !== paymentMethodId) : []
      );
      
      toast({
        title: t('payment.success'),
        description: t('payment.deleted'),
      });
    },
    onError: (error: any) => {
      console.error("Payment method deletion failed:", error);
      toast({
        title: t('payment.error'),
        description: t('payment.deleteFailed'),
        variant: "destructive",
      });
    },
  });

  // Set default payment method
  const setDefaultPaymentMethodMutation = useMutation({
    mutationFn: async (paymentMethodId: string): Promise<void> => {
      await apiRequest("PUT", `/api/payment-methods/${paymentMethodId}/default`);
    },
    onSuccess: () => {
      // Refresh payment methods to get updated default status
      refetch();
      
      toast({
        title: t('payment.success'),
        description: t('payment.defaultSet'),
      });
    },
    onError: (error: any) => {
      console.error("Default payment method setting failed:", error);
      toast({
        title: t('payment.error'),
        description: t('payment.setDefaultFailed'),
        variant: "destructive",
      });
    },
  });

  // Add new payment method (after Stripe Elements confirmation)
  const addPaymentMethodMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      // This will be called after Stripe Elements confirms the setup intent
      await refetch();
    },
    onSuccess: () => {
      toast({
        title: t('payment.success'),
        description: t('payment.cardAdded'),
      });
    },
    onError: (error: any) => {
      console.error("Payment method addition failed:", error);
      toast({
        title: t('payment.error'),
        description: t('payment.addCardError'),
        variant: "destructive",
      });
    },
  });

  return {
    paymentMethods,
    isLoading,
    isError,
    error,
    refetch,
    createSetupIntent: createSetupIntentMutation.mutateAsync,
    isCreatingSetupIntent: createSetupIntentMutation.isPending,
    deletePaymentMethod: deletePaymentMethodMutation.mutateAsync,
    isDeletingPaymentMethod: deletePaymentMethodMutation.isPending,
    setDefaultPaymentMethod: setDefaultPaymentMethodMutation.mutateAsync,
    isSettingDefault: setDefaultPaymentMethodMutation.isPending,
    addPaymentMethod: addPaymentMethodMutation.mutateAsync,
    isAddingPaymentMethod: addPaymentMethodMutation.isPending,
  };
}

// Helper function to get card brand icon/name
export function getCardBrandInfo(brand: string) {
  const brandMap: Record<string, { name: string; icon: string }> = {
    visa: { name: "Visa", icon: "💳" },
    mastercard: { name: "Mastercard", icon: "💳" },
    amex: { name: "American Express", icon: "💳" },
    discover: { name: "Discover", icon: "💳" },
    diners: { name: "Diners Club", icon: "💳" },
    jcb: { name: "JCB", icon: "💳" },
    unionpay: { name: "UnionPay", icon: "💳" },
    unknown: { name: "Unknown", icon: "💳" },
  };
  
  return brandMap[brand] || brandMap.unknown;
}

// Helper function to format expiry date
export function formatExpiryDate(month: number, year: number): string {
  return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
}