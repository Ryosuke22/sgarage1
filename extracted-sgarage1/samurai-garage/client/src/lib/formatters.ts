// Currency configuration
export const CURRENCY_CONFIG = {
  JPY: {
    locale: 'ja-JP',
    currency: 'JPY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  },
  USD: {
    locale: 'en-US',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
  EUR: {
    locale: 'de-DE',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
  GBP: {
    locale: 'en-GB',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
} as const;

export type SupportedCurrency = keyof typeof CURRENCY_CONFIG;

// Dynamic currency formatter
export function formatCurrency(amount: number, currencyCode: SupportedCurrency = 'JPY'): string {
  const config = CURRENCY_CONFIG[currencyCode];
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: config.minimumFractionDigits,
    maximumFractionDigits: config.maximumFractionDigits,
  }).format(amount);
}

// Get currency symbol only
export function getCurrencySymbol(currencyCode: SupportedCurrency = 'JPY'): string {
  const config = CURRENCY_CONFIG[currencyCode];
  const parts = new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
  }).formatToParts(0);
  
  const symbolPart = parts.find(part => part.type === 'currency');
  return symbolPart?.value || currencyCode;
}

// Convert amount between currencies (placeholder - real implementation would need exchange rates)
export function convertCurrency(amount: number, fromCurrency: SupportedCurrency, toCurrency: SupportedCurrency): number {
  // This is a placeholder implementation - in a real app, you'd use live exchange rates
  if (fromCurrency === toCurrency) return amount;
  
  // Placeholder conversion rates (these would come from an API in production)
  const rates: Record<SupportedCurrency, Record<SupportedCurrency, number>> = {
    JPY: { USD: 0.0067, EUR: 0.0062, GBP: 0.0053, JPY: 1 },
    USD: { JPY: 149.5, EUR: 0.92, GBP: 0.79, USD: 1 },
    EUR: { JPY: 162.9, USD: 1.09, GBP: 0.86, EUR: 1 },
    GBP: { JPY: 189.2, USD: 1.27, EUR: 1.16, GBP: 1 },
  };
  
  return Math.round(amount * rates[fromCurrency][toCurrency] * 100) / 100;
}

// Note: This function is replaced by formatRelativeTime in i18n.ts for language support
// Keeping this for backward compatibility - use formatRelativeTime from i18n.ts instead
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}秒前`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分前`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}時間前`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}日前`;
  }

  // For older dates, show the actual date
  return date.toLocaleDateString('ja-JP');
}

// Note: This function is replaced by formatTimeRemaining in i18n.ts for language support
// Keeping this for backward compatibility - use formatTimeRemaining from i18n.ts instead
export function formatTimeRemaining(endTime: Date): string {
  const now = new Date();
  const timeRemaining = endTime.getTime() - now.getTime();

  if (timeRemaining <= 0) {
    return "終了";
  }

  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `残り ${days}日 ${hours}時間`;
  } else if (hours > 0) {
    return `残り ${hours}時間 ${minutes}分`;
  } else {
    return `残り ${minutes}分`;
  }
}

export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

export function formatSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .substring(0, 50);
}
