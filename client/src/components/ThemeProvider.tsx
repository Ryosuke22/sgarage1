import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSettings } from "@/hooks/useUserSettings";

type Theme = "dark" | "light" | "system";
type Language = "ja" | "en";
type Currency = "JPY" | "USD" | "EUR" | "GBP";

type ThemeProviderContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  currentTheme: "dark" | "light"; // The actual resolved theme
  language: Language;
  setLanguage: (language: Language) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  isLoading: boolean;
  isOnline: boolean;
  syncPending: boolean;
};

const ThemeProviderContext = createContext<ThemeProviderContextType | undefined>(undefined);

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultLanguage?: Language;
  defaultCurrency?: Currency;
  storageKey?: string;
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultLanguage = "ja",
  defaultCurrency = "JPY",
  storageKey = "samurai-garage-settings",
}: ThemeProviderProps) {
  // Use settings hook for API integration
  const { settings, updateSetting, isLoading, isUpdating } = useSettings();
  
  // Track online status
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncPending, setSyncPending] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<"dark" | "light">("dark");

  // Get initial values from localStorage or API
  const getInitialValue = useCallback(<T,>(key: keyof typeof settings, fallback: T): T => {
    // First try API data if available
    if (settings && settings[key] !== undefined) {
      return settings[key] as T;
    }
    
    // Fallback to localStorage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const localSettings = JSON.parse(stored);
          return localSettings[key] || fallback;
        } catch {
          return fallback;
        }
      }
    }
    
    return fallback;
  }, [settings, storageKey]);

  // Initialize state values
  const [theme, setThemeState] = useState<Theme>(() => 
    getInitialValue('theme', defaultTheme) as Theme
  );
  const [language, setLanguageState] = useState<Language>(() => 
    getInitialValue('language', defaultLanguage) as Language
  );
  const [currency, setCurrencyState] = useState<Currency>(() => 
    getInitialValue('currency', defaultCurrency) as Currency
  );

  // Update local state when API data is available
  useEffect(() => {
    if (settings) {
      if (settings.theme && settings.theme !== theme) {
        setThemeState(settings.theme as Theme);
      }
      if (settings.language && settings.language !== language) {
        setLanguageState(settings.language as Language);
      }
      if (settings.currency && settings.currency !== currency) {
        setCurrencyState(settings.currency as Currency);
      }
    }
  }, [settings, theme, language, currency]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Apply theme to DOM
  useEffect(() => {
    const root = window.document.documentElement;

    // Remove existing theme classes
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      setCurrentTheme(systemTheme);
    } else {
      root.classList.add(theme);
      setCurrentTheme(theme);
    }
  }, [theme]);

  // Listen for system theme changes when using system theme
  useEffect(() => {
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      
      const handleChange = (e: MediaQueryListEvent) => {
        const systemTheme = e.matches ? "dark" : "light";
        const root = window.document.documentElement;
        
        root.classList.remove("light", "dark");
        root.classList.add(systemTheme);
        setCurrentTheme(systemTheme);
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  // Helper function to save to localStorage immediately
  const saveToLocalStorage = useCallback((updates: Partial<{ theme: Theme; language: Language; currency: Currency }>) => {
    try {
      const currentLocal = localStorage.getItem(storageKey);
      const currentSettings = currentLocal ? JSON.parse(currentLocal) : {};
      const newSettings = { ...currentSettings, ...updates };
      localStorage.setItem(storageKey, JSON.stringify(newSettings));
    } catch (error) {
      console.warn("Failed to save to localStorage:", error);
    }
  }, [storageKey]);

  // Helper function to sync to API with error handling
  const syncToAPI = useCallback(async (key: string, value: any) => {
    if (!isOnline) {
      setSyncPending(true);
      return;
    }

    try {
      await updateSetting(key as any, value);
      setSyncPending(false);
    } catch (error) {
      console.warn(`Failed to sync ${key} to API:`, error);
      setSyncPending(true);
    }
  }, [isOnline, updateSetting]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    saveToLocalStorage({ theme: newTheme });
    syncToAPI('theme', newTheme);
  }, [saveToLocalStorage, syncToAPI]);

  const setLanguage = useCallback((newLanguage: Language) => {
    setLanguageState(newLanguage);
    saveToLocalStorage({ language: newLanguage });
    syncToAPI('language', newLanguage);
  }, [saveToLocalStorage, syncToAPI]);

  const setCurrency = useCallback((newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    saveToLocalStorage({ currency: newCurrency });
    syncToAPI('currency', newCurrency);
  }, [saveToLocalStorage, syncToAPI]);

  const value = {
    theme,
    setTheme,
    currentTheme,
    language,
    setLanguage,
    currency,
    setCurrency,
    isLoading,
    isOnline,
    syncPending: syncPending || isUpdating,
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};