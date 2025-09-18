import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreVertical, CreditCard, Star, Trash2 } from "lucide-react";
import { PaymentMethod, getCardBrandInfo, formatExpiryDate } from "@/hooks/usePaymentMethods";
import { useTheme } from "@/components/ThemeProvider";
import { useTranslation } from "@/lib/i18n";

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  onSetDefault: (paymentMethodId: string) => Promise<void>;
  onDelete: (paymentMethodId: string) => Promise<void>;
  isLoading?: boolean;
}

export default function PaymentMethodCard({
  paymentMethod,
  onSetDefault,
  onDelete,
  isLoading = false
}: PaymentMethodCardProps) {
  const [isActionLoading, setIsActionLoading] = useState(false);
  const cardInfo = getCardBrandInfo(paymentMethod.card.brand);
  const { language } = useTheme();
  const { t } = useTranslation(language);
  const isDefault = paymentMethod.isDefault || false;

  const handleSetDefault = async () => {
    setIsActionLoading(true);
    try {
      await onSetDefault(paymentMethod.id);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsActionLoading(true);
    try {
      await onDelete(paymentMethod.id);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <Card className="relative bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white border-slate-700">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <span className="font-medium text-sm">{cardInfo.name}</span>
            {isDefault && (
              <Badge 
                variant="secondary" 
                className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                data-testid={`badge-default-${paymentMethod.id}`}
              >
                <Star className="h-3 w-3 mr-1" />
                {t('payment.default')}
              </Badge>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-white hover:bg-white/10"
                disabled={isLoading || isActionLoading}
                data-testid={`dropdown-menu-${paymentMethod.id}`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
              {!isDefault && (
                <DropdownMenuItem 
                  onClick={handleSetDefault}
                  disabled={isActionLoading}
                  className="text-white hover:bg-slate-700"
                  data-testid={`button-set-default-${paymentMethod.id}`}
                >
                  <Star className="h-4 w-4 mr-2" />
                  {t('payment.setDefault')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={handleDelete}
                disabled={isActionLoading}
                className="text-red-300 hover:bg-red-500/20 hover:text-red-200"
                data-testid={`button-delete-${paymentMethod.id}`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('payment.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          <div className="text-lg font-mono tracking-wider">
            •••• •••• •••• {paymentMethod.card.last4}
          </div>
          
          <div className="flex justify-between text-sm text-slate-300">
            <span>{t('payment.expiryDate')}</span>
            <span className="font-mono">
              {formatExpiryDate(paymentMethod.card.exp_month, paymentMethod.card.exp_year)}
            </span>
          </div>
          
          {paymentMethod.billing_details.name && (
            <div className="text-sm text-slate-300">
              <span>{t('payment.cardholderName')}: {paymentMethod.billing_details.name}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}