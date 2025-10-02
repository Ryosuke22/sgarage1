import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Bell, Palette, Volume2, Mail, Monitor, Smartphone, 
  Settings as SettingsIcon, Loader2, Shield, AlertTriangle, Target, 
  User, MessageSquare, Clock, TestTube, BellRing, Gavel, Trophy,
  Eye, Lock, Megaphone, Wrench, CheckCircle
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { useTheme } from "@/components/ThemeProvider";
import { useSettings } from "@/hooks/useUserSettings";
import { formatCurrency, getCurrencySymbol, CURRENCY_CONFIG, SupportedCurrency } from "@/lib/formatters";
import { useTranslation } from "@/lib/i18n";

export default function Settings() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { theme, setTheme, language, setLanguage, currency, setCurrency } = useTheme();
  const { t } = useTranslation(language);
  
  // User settings hook
  const {
    settings,
    isLoading,
    isError,
    error,
    updateSettings,
    updateSetting,
    isUpdating,
    updateError,
    refetch
  } = useSettings();
  
  
  // Local state for comprehensive notification settings
  const [localSettings, setLocalSettings] = useState({
    // Global settings
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: false,
    
    // Frequency settings (stored in localStorage)
    emailFrequency: "immediate" as "immediate" | "hourly" | "daily" | "disabled",
    pushFrequency: "immediate" as "immediate" | "hourly" | "daily" | "disabled",
    
    // Auction-related notifications
    newBidNotifications: true,
    outbidNotifications: true,
    bidConfirmationNotifications: true,
    auctionEndNotifications: true,
    winningNotifications: true,
    losingNotifications: true,
    reserveMetNotifications: true,
    lastMinuteBidNotifications: true,
    auctionExtensionNotifications: true,
    
    // Listing-related notifications (for sellers)
    listingApprovedNotifications: true,
    listingRejectedNotifications: true,
    firstBidNotifications: true,
    sellerBidUpdateNotifications: true,
    listingExpiredNotifications: true,
    
    // Account-related notifications
    profileUpdateNotifications: true,
    emailChangeNotifications: true,
    passwordChangeNotifications: true,
    
    // Security notifications
    loginNotifications: false,
    newDeviceLoginNotifications: true,
    suspiciousActivityNotifications: true,
    
    // Marketing notifications
    newsletterNotifications: false,
    promotionalNotifications: false,
    weeklyDigestNotifications: false,
    
    // System notifications
    maintenanceNotifications: true,
    systemUpdateNotifications: false,
    
    // Watch list notifications
    watchListBidNotifications: true,
    watchListEndingSoonNotifications: true,
    
    // Display settings
    language: "ja",
    compactView: false,
  });
  
  // Test notification state
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  

  // Load settings from localStorage and server
  useEffect(() => {
    // Load frequency settings from localStorage
    const savedFrequencySettings = {
      emailFrequency: localStorage.getItem('emailFrequency') as "immediate" | "hourly" | "daily" | "disabled" || "immediate",
      pushFrequency: localStorage.getItem('pushFrequency') as "immediate" | "hourly" | "daily" | "disabled" || "immediate",
    };
    
    // Load extended settings from localStorage
    const savedExtendedSettings = localStorage.getItem('extendedNotificationSettings');
    const extendedSettings = savedExtendedSettings ? JSON.parse(savedExtendedSettings) : {};
    
    if (settings) {
      setLocalSettings({
        // Basic settings from server
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        smsNotifications: false, // Will be available when schema is updated
        language: settings.language,
        compactView: settings.compactView,
        
        // Frequency settings from localStorage
        ...savedFrequencySettings,
        
        // Extended notification settings (using defaults if not in localStorage)
        newBidNotifications: extendedSettings.newBidNotifications ?? settings.outbidNotifications,
        outbidNotifications: extendedSettings.outbidNotifications ?? settings.outbidNotifications,
        bidConfirmationNotifications: extendedSettings.bidConfirmationNotifications ?? settings.outbidNotifications,
        auctionEndNotifications: extendedSettings.auctionEndNotifications ?? settings.auctionEndNotifications,
        winningNotifications: extendedSettings.winningNotifications ?? settings.auctionEndNotifications,
        losingNotifications: extendedSettings.losingNotifications ?? settings.auctionEndNotifications,
        reserveMetNotifications: extendedSettings.reserveMetNotifications ?? settings.outbidNotifications,
        lastMinuteBidNotifications: extendedSettings.lastMinuteBidNotifications ?? settings.outbidNotifications,
        auctionExtensionNotifications: extendedSettings.auctionExtensionNotifications ?? settings.auctionEndNotifications,
        
        listingApprovedNotifications: extendedSettings.listingApprovedNotifications ?? settings.emailNotifications,
        listingRejectedNotifications: extendedSettings.listingRejectedNotifications ?? settings.emailNotifications,
        firstBidNotifications: extendedSettings.firstBidNotifications ?? settings.outbidNotifications,
        sellerBidUpdateNotifications: extendedSettings.sellerBidUpdateNotifications ?? settings.outbidNotifications,
        listingExpiredNotifications: extendedSettings.listingExpiredNotifications ?? settings.auctionEndNotifications,
        
        profileUpdateNotifications: extendedSettings.profileUpdateNotifications ?? settings.emailNotifications,
        emailChangeNotifications: extendedSettings.emailChangeNotifications ?? settings.emailNotifications,
        passwordChangeNotifications: extendedSettings.passwordChangeNotifications ?? settings.emailNotifications,
        
        loginNotifications: extendedSettings.loginNotifications ?? false,
        newDeviceLoginNotifications: extendedSettings.newDeviceLoginNotifications ?? settings.emailNotifications,
        suspiciousActivityNotifications: extendedSettings.suspiciousActivityNotifications ?? settings.emailNotifications,
        
        newsletterNotifications: extendedSettings.newsletterNotifications ?? false,
        promotionalNotifications: extendedSettings.promotionalNotifications ?? false,
        weeklyDigestNotifications: extendedSettings.weeklyDigestNotifications ?? false,
        
        maintenanceNotifications: extendedSettings.maintenanceNotifications ?? settings.emailNotifications,
        systemUpdateNotifications: extendedSettings.systemUpdateNotifications ?? false,
        
        watchListBidNotifications: extendedSettings.watchListBidNotifications ?? settings.outbidNotifications,
        watchListEndingSoonNotifications: extendedSettings.watchListEndingSoonNotifications ?? settings.auctionEndNotifications,
      });
      
      // Update theme from settings
      if (settings.theme && settings.theme !== theme) {
        setTheme(settings.theme as "light" | "dark" | "system");
      }
    }
  }, [settings, theme, setTheme]);

  // Save frequency settings to localStorage
  const saveFrequencySettings = () => {
    localStorage.setItem('emailFrequency', localSettings.emailFrequency);
    localStorage.setItem('pushFrequency', localSettings.pushFrequency);
  };
  
  // Save function
  const handleSave = async () => {
    try {
      // Save frequency settings to localStorage
      saveFrequencySettings();
      
      // Save core settings to database (using existing schema fields)
      await updateSettings({
        emailNotifications: localSettings.emailNotifications,
        pushNotifications: localSettings.pushNotifications,
        outbidNotifications: localSettings.newBidNotifications, // Map to existing field
        auctionEndNotifications: localSettings.auctionEndNotifications,
        theme: theme,
        language: localSettings.language,
        compactView: localSettings.compactView,
      });
      
      // Save extended settings to localStorage for now
      const extendedSettings = {
        newBidNotifications: localSettings.newBidNotifications,
        outbidNotifications: localSettings.outbidNotifications,
        bidConfirmationNotifications: localSettings.bidConfirmationNotifications,
        winningNotifications: localSettings.winningNotifications,
        losingNotifications: localSettings.losingNotifications,
        reserveMetNotifications: localSettings.reserveMetNotifications,
        lastMinuteBidNotifications: localSettings.lastMinuteBidNotifications,
        auctionExtensionNotifications: localSettings.auctionExtensionNotifications,
        listingApprovedNotifications: localSettings.listingApprovedNotifications,
        listingRejectedNotifications: localSettings.listingRejectedNotifications,
        firstBidNotifications: localSettings.firstBidNotifications,
        sellerBidUpdateNotifications: localSettings.sellerBidUpdateNotifications,
        listingExpiredNotifications: localSettings.listingExpiredNotifications,
        profileUpdateNotifications: localSettings.profileUpdateNotifications,
        emailChangeNotifications: localSettings.emailChangeNotifications,
        passwordChangeNotifications: localSettings.passwordChangeNotifications,
        loginNotifications: localSettings.loginNotifications,
        newDeviceLoginNotifications: localSettings.newDeviceLoginNotifications,
        suspiciousActivityNotifications: localSettings.suspiciousActivityNotifications,
        newsletterNotifications: localSettings.newsletterNotifications,
        promotionalNotifications: localSettings.promotionalNotifications,
        weeklyDigestNotifications: localSettings.weeklyDigestNotifications,
        maintenanceNotifications: localSettings.maintenanceNotifications,
        systemUpdateNotifications: localSettings.systemUpdateNotifications,
        watchListBidNotifications: localSettings.watchListBidNotifications,
        watchListEndingSoonNotifications: localSettings.watchListEndingSoonNotifications,
      };
      localStorage.setItem('extendedNotificationSettings', JSON.stringify(extendedSettings));
      
      toast({
        title: t('settings.saved'),
        description: t('settings.savedDescription'),
      });
    } catch (error: any) {
      console.error("Settings save error:", error);
      toast({
        title: t('settings.saveError'),
        description: t('settings.saveErrorDescription'),
        variant: "destructive",
      });
    }
  };
  
  // Test notification function
  const handleTestNotification = async (type: 'email' | 'push') => {
    setIsTestingNotification(true);
    
    try {
      // Simulate notification test
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (type === 'push' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(t('settings.testNotificationTitle'), {
            body: t('settings.testNotificationBody'),
            icon: '/favicon.ico'
          });
        } else if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            new Notification(t('settings.testNotificationTitle'), {
              body: t('settings.testNotificationBody'),
              icon: '/favicon.ico'
            });
          }
        }
      }
      
      toast({
        title: type === 'email' ? t('settings.emailTestTitle') : t('settings.pushTestTitle'),
        description: type === 'email' 
          ? t('settings.emailTestDescription')
          : t('settings.pushTestDescription'),
      });
    } catch (error) {
      toast({
        title: t('settings.testErrorTitle'),
        description: t('settings.testErrorDescription'),
        variant: 'destructive',
      });
    } finally {
      setIsTestingNotification(false);
    }
  };
  
  // Update individual setting helper
  const updateLocalSetting = (key: string, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    
    // Provide immediate feedback for important changes
    if (key === 'emailNotifications' || key === 'pushNotifications') {
      toast({
        title: value ? t('settings.notificationEnabled') : t('settings.notificationDisabled'),
        description: value 
          ? (key === 'emailNotifications' ? t('settings.emailNotificationEnabled') : t('settings.pushNotificationEnabled'))
          : (key === 'emailNotifications' ? t('settings.emailNotificationDisabled') : t('settings.pushNotificationDisabled')),
      });
    }
  };


  // Handle theme change
  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    toast({
      title: t('settings.themeChanged'),
      description: newTheme === "light" ? t('settings.themeChangedToLight') : newTheme === "dark" ? t('settings.themeChangedToDark') : t('settings.themeChangedToSystem'),
    });
  };

  // Handle language change
  const handleLanguageChange = (newLanguage: "ja" | "en") => {
    setLanguage(newLanguage);
    toast({
      title: t('settings.languageChanged'),
      description: newLanguage === "ja" ? t('settings.languageChangedToJapanese') : t('settings.languageChangedToEnglish'),
    });
  };

  // Handle currency change
  const handleCurrencyChange = (newCurrency: SupportedCurrency) => {
    setCurrency(newCurrency);
    toast({
      title: t('settings.currencyChanged'),
      description: newCurrency === "JPY" ? t('settings.currencyChangedToJPY') : newCurrency === "USD" ? t('settings.currencyChangedToUSD') : newCurrency === "EUR" ? t('settings.currencyChangedToEUR') : t('settings.currencyChangedToGBP'),
    });
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">{t('settings.loading')}</span>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Show error state
  if (isError) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{t('settings.loadingError')}</p>
            <Button onClick={() => refetch()} variant="outline">
              {t('settings.retry')}
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 mt-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-foreground hover:bg-accent"
            data-testid="button-back-settings"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('settings.back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('settings.title')}</h1>
            <p className="text-muted-foreground">{t('settings.description')}</p>
          </div>
        </div>

        {/* グローバル通知設定 */}
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('settings.globalNotifications')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* メール通知 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t('settings.emailNotification')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.emailHelper')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={localSettings.emailNotifications}
                    onCheckedChange={(checked) => updateLocalSetting('emailNotifications', checked)}
                    data-testid="switch-email-notifications"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestNotification('email')}
                    disabled={!localSettings.emailNotifications || isTestingNotification}
                    data-testid="button-test-email"
                  >
                    {isTestingNotification ? <Loader2 className="h-3 w-3 animate-spin" /> : <TestTube className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              
              {localSettings.emailNotifications && (
                <div className="ml-6 space-y-2">
                  <Label className="text-sm text-muted-foreground">{t('settings.deliveryFrequency')}</Label>
                  <Select 
                    value={localSettings.emailFrequency} 
                    onValueChange={(value) => updateLocalSetting('emailFrequency', value)}
                  >
                    <SelectTrigger className="bg-transparent border-border text-foreground w-48" data-testid="select-email-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">{t('frequency.immediate')}</SelectItem>
                      <SelectItem value="hourly">{t('frequency.hourly')}</SelectItem>
                      <SelectItem value="daily">{t('frequency.daily')}</SelectItem>
                      <SelectItem value="disabled">{t('frequency.disabled')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* プッシュ通知 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    {t('settings.pushNotification')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.pushHelper')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={localSettings.pushNotifications}
                    onCheckedChange={(checked) => updateLocalSetting('pushNotifications', checked)}
                    data-testid="switch-push-notifications"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestNotification('push')}
                    disabled={!localSettings.pushNotifications || isTestingNotification}
                    data-testid="button-test-push"
                  >
                    {isTestingNotification ? <Loader2 className="h-3 w-3 animate-spin" /> : <TestTube className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              
              {localSettings.pushNotifications && (
                <div className="ml-6 space-y-2">
                  <Label className="text-sm text-muted-foreground">{t('settings.deliveryFrequency')}</Label>
                  <Select 
                    value={localSettings.pushFrequency} 
                    onValueChange={(value) => updateLocalSetting('pushFrequency', value)}
                  >
                    <SelectTrigger className="bg-transparent border-border text-foreground w-48" data-testid="select-push-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">{t('frequency.immediate')}</SelectItem>
                      <SelectItem value="hourly">{t('frequency.hourly')}</SelectItem>
                      <SelectItem value="daily">{t('frequency.daily')}</SelectItem>
                      <SelectItem value="disabled">{t('frequency.disabled')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* SMS通知（準備中） */}
            <div className="flex items-center justify-between opacity-50">
              <div className="space-y-0.5">
                <Label className="text-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {t('settings.smsNotification')}
                  <Badge variant="secondary" className="text-xs">{t('settings.comingSoon')}</Badge>
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.smsHelper')}
                </p>
              </div>
              <Switch
                checked={false}
                disabled
                data-testid="switch-sms-notifications"
              />
            </div>
          </CardContent>
        </Card>

        {/* オークション関連通知 */}
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              {t('settings.auctionNotifications')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {[
                { key: 'newBidNotifications', label: t('notification.newBid'), desc: t('notification.newBidDesc'), icon: Target },
                { key: 'outbidNotifications', label: t('notification.outbid'), desc: t('notification.outbidDesc'), icon: AlertTriangle },
                { key: 'bidConfirmationNotifications', label: t('notification.bidConfirmation'), desc: t('notification.bidConfirmationDesc'), icon: BellRing },
                { key: 'auctionEndNotifications', label: t('notification.auctionEnd'), desc: t('notification.auctionEndDesc'), icon: Clock },
                { key: 'winningNotifications', label: t('notification.winning'), desc: t('notification.winningDesc'), icon: Trophy },
                { key: 'losingNotifications', label: t('notification.losing'), desc: t('notification.losingDesc'), icon: Target },
                { key: 'reserveMetNotifications', label: t('notification.reserveMet'), desc: t('notification.reserveMetDesc'), icon: Target },
                { key: 'lastMinuteBidNotifications', label: t('notification.lastMinuteBid'), desc: t('notification.lastMinuteBidDesc'), icon: Clock },
                { key: 'auctionExtensionNotifications', label: t('notification.auctionExtension'), desc: t('notification.auctionExtensionDesc'), icon: Clock }
              ].map(({ key, label, desc, icon: Icon }) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label className="text-foreground flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    checked={localSettings[key as keyof typeof localSettings] as boolean}
                    onCheckedChange={(checked) => updateLocalSetting(key, checked)}
                    data-testid={`switch-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 出品関連通知 */}
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {t('settings.listingNotifications')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {[
                { key: 'listingApprovedNotifications', label: t('notification.listingApproved'), desc: t('notification.listingApprovedDesc'), icon: CheckCircle },
                { key: 'listingRejectedNotifications', label: t('notification.listingRejected'), desc: t('notification.listingRejectedDesc'), icon: AlertTriangle },
                { key: 'firstBidNotifications', label: t('notification.firstBid'), desc: t('notification.firstBidDesc'), icon: BellRing },
                { key: 'sellerBidUpdateNotifications', label: t('notification.sellerBidUpdate'), desc: t('notification.sellerBidUpdateDesc'), icon: Target },
                { key: 'listingExpiredNotifications', label: t('notification.listingExpired'), desc: t('notification.listingExpiredDesc'), icon: Clock }
              ].map(({ key, label, desc, icon: Icon }) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label className="text-foreground flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    checked={localSettings[key as keyof typeof localSettings] as boolean}
                    onCheckedChange={(checked) => updateLocalSetting(key, checked)}
                    data-testid={`switch-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* アカウント・セキュリティ通知 */}
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('settings.accountSecurityNotifications')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {[
                { key: 'profileUpdateNotifications', label: t('notification.profileUpdate'), desc: t('notification.profileUpdateDesc'), icon: User },
                { key: 'emailChangeNotifications', label: t('notification.emailChange'), desc: t('notification.emailChangeDesc'), icon: Mail },
                { key: 'passwordChangeNotifications', label: t('notification.passwordChange'), desc: t('notification.passwordChangeDesc'), icon: Lock },
                { key: 'loginNotifications', label: t('notification.login'), desc: t('notification.loginDesc'), icon: Shield },
                { key: 'newDeviceLoginNotifications', label: t('notification.newDeviceLogin'), desc: t('notification.newDeviceLoginDesc'), icon: Smartphone },
                { key: 'suspiciousActivityNotifications', label: t('notification.suspiciousActivity'), desc: t('notification.suspiciousActivityDesc'), icon: AlertTriangle }
              ].map(({ key, label, desc, icon: Icon }) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label className="text-foreground flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    checked={localSettings[key as keyof typeof localSettings] as boolean}
                    onCheckedChange={(checked) => updateLocalSetting(key, checked)}
                    data-testid={`switch-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ウォッチリスト・マーケティング通知 */}
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {t('settings.watchListMarketingNotifications')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {[
                { key: 'watchListBidNotifications', label: t('notification.watchListBid'), desc: t('notification.watchListBidDesc'), icon: Eye },
                { key: 'watchListEndingSoonNotifications', label: t('notification.watchListEndingSoon'), desc: t('notification.watchListEndingSoonDesc'), icon: Clock },
                { key: 'newsletterNotifications', label: t('notification.newsletter'), desc: t('notification.newsletterDesc'), icon: Mail },
                { key: 'promotionalNotifications', label: t('notification.promotional'), desc: t('notification.promotionalDesc'), icon: Megaphone },
                { key: 'weeklyDigestNotifications', label: t('notification.weeklyDigest'), desc: t('notification.weeklyDigestDesc'), icon: Mail }
              ].map(({ key, label, desc, icon: Icon }) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label className="text-foreground flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    checked={localSettings[key as keyof typeof localSettings] as boolean}
                    onCheckedChange={(checked) => updateLocalSetting(key, checked)}
                    data-testid={`switch-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* システム通知 */}
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              {t('settings.systemNotifications')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {[
                { key: 'maintenanceNotifications', label: t('notification.maintenance'), desc: t('notification.maintenanceDesc'), icon: Wrench },
                { key: 'systemUpdateNotifications', label: t('notification.systemUpdate'), desc: t('notification.systemUpdateDesc'), icon: Bell }
              ].map(({ key, label, desc, icon: Icon }) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label className="text-foreground flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    checked={localSettings[key as keyof typeof localSettings] as boolean}
                    onCheckedChange={(checked) => updateLocalSetting(key, checked)}
                    data-testid={`switch-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 表示設定 */}
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {t('settings.displaySettings')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-foreground">{t('settings.theme')}</Label>
              <Select value={theme} onValueChange={handleThemeChange}>
                <SelectTrigger className="bg-transparent border-border text-foreground" data-testid="select-theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">{t('theme.darkTheme')}</SelectItem>
                  <SelectItem value="light">{t('theme.lightTheme')}</SelectItem>
                  <SelectItem value="system">{t('theme.systemTheme')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {t('settings.themeHelper')}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">{t('settings.language')}</Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="bg-transparent border-border text-foreground" data-testid="select-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ja">{t('language.jaWithFlag')}</SelectItem>
                  <SelectItem value="en">{t('language.enWithFlag')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {t('settings.languageHelper')}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">{t('settings.currency')}</Label>
              <Select value={currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="bg-transparent border-border text-foreground" data-testid="select-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JPY">
                    <div className="flex items-center gap-2">
                      <span>{getCurrencySymbol('JPY')}</span>
                      <span>{t('currency.jpyWithSymbol')}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="USD">
                    <div className="flex items-center gap-2">
                      <span>{getCurrencySymbol('USD')}</span>
                      <span>{t('currency.usdWithSymbol')}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="EUR">
                    <div className="flex items-center gap-2">
                      <span>{getCurrencySymbol('EUR')}</span>
                      <span>{t('currency.eurWithSymbol')}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="GBP">
                    <div className="flex items-center gap-2">
                      <span>{getCurrencySymbol('GBP')}</span>
                      <span>{t('currency.gbpWithSymbol')}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {t('settings.currencyHelper', { example: formatCurrency(1000000, currency) })}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  {t('settings.compactViewLabel')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.compactViewHelper')}
                </p>
              </div>
              <Switch
                checked={localSettings.compactView}
                onCheckedChange={(checked) => updateLocalSetting('compactView', checked)}
                data-testid="switch-compact-view"
              />
            </div>
          </CardContent>
        </Card>


        {/* 保存ボタン */}
        <Card className="glass border-border">
          <CardContent className="pt-6">
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                className="bg-transparent border-border text-foreground hover:bg-accent"
                onClick={() => navigate("/")}
                data-testid="button-cancel-settings"
              >
                {t('settings.cancelButton')}
              </Button>
              <Button
                onClick={handleSave}
                className="btn-premium"
                disabled={isUpdating}
                data-testid="button-save-settings"
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <SettingsIcon className="h-4 w-4 mr-2" />
                )}
                {isUpdating ? t('settings.savingButton') : t('settings.saveSettingsButton')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

    </Layout>
  );
}