// Lightweight internationalization system
export type Language = 'ja' | 'en';

// Translation strings
export const translations = {
  ja: {
    // BidBar translations
    'bidbar.currentPrice': '現在価格',
    'bidbar.timeRemaining': '残り時間',
    'bidbar.ended': '終了',
    'bidbar.submit': '入札する',
    'bidbar.submitting': '入札中...',
    'bidbar.auctionEnded': 'オークション終了',
    'bidbar.minimumBidError': '入札額が不足しています',
    'bidbar.minimumBidDescription': '最低入札額は {amount} です。',
    'bidbar.minimumBidPlaceholder': '最低入札額: {amount}',
    'bidbar.bidSuccess': '入札が完了しました',
    'bidbar.bidSuccessDescription': '{amount} で入札しました。',
    'bidbar.bidError': '入札に失敗しました',
    'bidbar.bidErrorDescription': '再度お試しください。',
    'bidbar.networkError': '入札エラー',
    'bidbar.networkErrorDescription': 'ネットワークエラーが発生しました。',
    
    // AuctionCard translations
    'auctioncard.classicCar': 'クラシックカー',
    'auctioncard.motorcycle': 'オートバイ',
    'auctioncard.currentPrice': '現在価格',
    'auctioncard.bidCount': '{count}件の入札',
    'auctioncard.bids': '件の入札',
    'auctioncard.live': 'ライブ',
    'auctioncard.reserveMet': 'リザーブ達成',
    'auctioncard.reserveNotMet': 'リザーブ未達成',
    
    // Time formatting
    'time.ended': '終了',
    'time.remaining': '残り',
    'time.days': '日',
    'time.hours': '時間',
    'time.minutes': '分',
    'time.seconds': '秒',
    'time.ago': '前',
    
    // Settings page translations
    'settings.title': '設定',
    'settings.save': '保存',
    'settings.saving': '保存中...',
    'settings.saved': '設定が保存されました',
    'settings.savedDescription': '変更内容が正常に保存されました。',
    'settings.saveError': '保存に失敗しました',
    'settings.saveErrorDescription': '設定の保存中にエラーが発生しました。しばらく待ってから再試行してください。',
    'settings.loading': '設定を読み込み中...',
    'settings.loadingError': '設定の読み込みに失敗しました',
    'settings.retry': '再試行',
    'settings.back': '戻る',
    'settings.description': 'アプリケーションの設定を管理',
    'settings.comingSoon': '準備中',
    'settings.display': '表示設定',
    'settings.theme': 'テーマ',
    'settings.language': '言語',
    'settings.currency': '通貨',
    'settings.notifications': '通知設定',
    'settings.emailNotifications': 'メール通知',
    'settings.pushNotifications': 'プッシュ通知',
    'settings.testNotifications': 'テスト通知',
    'settings.testEmail': 'メールテスト',
    'settings.testPush': 'プッシュテスト',
    
    // Payment method translations
    'payment.title': '支払い方法管理',
    'payment.loading': '支払い方法を読み込んでいます...',
    'payment.emptyStateTitle': '支払い方法が未設定',
    'payment.emptyStateDescription': 'オークションの参加や手数料の支払いのために\n支払い方法を追加してください',
    'payment.registeredCount': '登録済みの支払い方法: {count}件',
    'payment.addCard': '新しいカードを追加',
    'payment.addCardButton': 'カードを追加',
    'payment.addMethod': '支払い方法を追加',
    'payment.cancel': 'キャンセル',
    'payment.processing': '処理中...',
    'payment.cardAdded': '支払い方法を追加しました',
    'payment.cardAddedDescription': '新しい支払い方法が正常に追加されました。',
    'payment.addCardError': 'カードの追加に失敗しました',
    'payment.addCardErrorDescription': '支払い方法の追加中にエラーが発生しました。しばらく待ってから再試行してください。',
    'payment.securityInfo': 'セキュリティについて',
    'payment.securityDescription': 'カード情報は暗号化され、Stripeによって安全に処理されます。当サイトにカード情報は保存されません。',
    'payment.loadingError': 'Stripeが読み込まれていません',
    'payment.loadingErrorDescription': 'しばらく待ってから再度お試しください。',
    'payment.default': 'デフォルト',
    'payment.setDefault': 'デフォルトに設定',
    'payment.delete': '削除',
    'payment.expiryDate': '有効期限',
    'payment.cardholderName': 'カード名義',
    'payment.defaultSet': 'デフォルト支払い方法を設定しました',
    'payment.deleted': '支払い方法を削除しました',
    'payment.error': 'エラー',
    'payment.success': '成功',
    'payment.setupIntentFailed': 'カード追加の準備に失敗しました',
    'payment.deleteFailed': '支払い方法の削除に失敗しました',
    'payment.setDefaultFailed': 'デフォルト支払い方法の設定に失敗しました',
    
    // Theme options
    'theme.light': 'ライト',
    'theme.dark': 'ダーク',
    'theme.system': 'システム',
    
    // Language options
    'language.ja': '日本語',
    'language.en': 'English',
    
    // Currency options
    'currency.JPY': '日本円 (¥)',
    'currency.USD': '米ドル ($)',
    'currency.EUR': 'ユーロ (€)',
    'currency.GBP': '英ポンド (£)',
    
    // Settings notification sections
    'settings.globalNotifications': 'グローバル通知設定',
    'settings.emailNotification': 'メール通知',
    'settings.pushNotification': 'プッシュ通知',
    'settings.smsNotification': 'SMS通知',
    'settings.auctionNotifications': 'オークション関連通知',
    'settings.listingNotifications': '出品関連通知',
    'settings.accountSecurityNotifications': 'アカウント・セキュリティ通知',
    'settings.watchListMarketingNotifications': 'ウォッチリスト・マーケティング通知',
    'settings.systemNotifications': 'システム通知',
    'settings.displaySettings': '表示設定',
    
    // Helper texts
    'settings.emailHelper': '重要な更新をメールで受け取る',
    'settings.pushHelper': 'ブラウザ通知を受け取る',
    'settings.smsHelper': 'SMS（ショートメッセージ）で緊急通知を受け取る',
    'settings.themeHelper': 'アプリケーションの外観を変更',
    'settings.languageHelper': '表示言語を変更',
    'settings.currencyHelper': '価格表示に使用する通貨 例: {example}',
    'settings.compactViewLabel': 'コンパクト表示',
    'settings.compactViewHelper': 'リスト表示を密にする',
    
    // Delivery frequency
    'settings.deliveryFrequency': '配信頻度',
    'frequency.immediate': '即座に送信',
    'frequency.hourly': '1時間ごと',
    'frequency.daily': '1日1回まとめて',
    'frequency.disabled': '無効',
    
    // Theme options
    'theme.darkTheme': 'ダークテーマ',
    'theme.lightTheme': 'ライトテーマ',
    'theme.systemTheme': 'システム設定に従う',
    
    // Language options with flags
    'language.jaWithFlag': '🇯🇵 日本語',
    'language.enWithFlag': '🇺🇸 English',
    
    // Currency options with symbols
    'currency.jpyWithSymbol': '日本円 (JPY)',
    'currency.usdWithSymbol': '米ドル (USD)',
    'currency.eurWithSymbol': 'ユーロ (EUR)',
    'currency.gbpWithSymbol': '英ポンド (GBP)',
    
    // Notification test messages
    'settings.testNotificationTitle': 'テスト通知',
    'settings.testNotificationBody': 'プッシュ通知が正常に動作しています。',
    'settings.emailTestTitle': 'メールテスト送信',
    'settings.pushTestTitle': 'プッシュ通知テスト',
    'settings.emailTestDescription': 'テストメールを送信しました。メールボックスをご確認ください。',
    'settings.pushTestDescription': 'プッシュ通知をテストしました。',
    'settings.testErrorTitle': 'テスト送信エラー',
    'settings.testErrorDescription': '通知テストに失敗しました。しばらく待ってから再試行してください。',
    
    // Toast messages for toggles
    'settings.notificationEnabled': '通知を有効にしました',
    'settings.notificationDisabled': '通知を無効にしました',
    'settings.emailNotificationEnabled': 'メール通知が有効になりました。',
    'settings.emailNotificationDisabled': 'メール通知が無効になりました。',
    'settings.pushNotificationEnabled': 'プッシュ通知が有効になりました。',
    'settings.pushNotificationDisabled': 'プッシュ通知が無効になりました。',
    
    // Theme change messages
    'settings.themeChanged': 'テーマを変更しました',
    'settings.themeChangedToLight': 'ライトテーマ に切り替えました。',
    'settings.themeChangedToDark': 'ダークテーマ に切り替えました。',
    'settings.themeChangedToSystem': 'システム設定 に切り替えました。',
    
    // Language change messages
    'settings.languageChanged': '言語を変更しました',
    'settings.languageChangedToJapanese': '日本語 に切り替えました。',
    'settings.languageChangedToEnglish': 'English に切り替えました。',
    
    // Currency change messages
    'settings.currencyChanged': '通貨を変更しました',
    'settings.currencyChangedToJPY': '日本円 での表示に切り替えました。',
    'settings.currencyChangedToUSD': '米ドル での表示に切り替えました。',
    'settings.currencyChangedToEUR': 'ユーロ での表示に切り替えました。',
    'settings.currencyChangedToGBP': '英ポンド での表示に切り替えました。',
    
    // Button texts
    'settings.addNewCard': '新しいカードを追加',
    'settings.cancelButton': 'キャンセル',
    'settings.saveSettingsButton': '設定を保存',
    'settings.savingButton': '保存中...',
    
    // Security information
    'settings.securityTitle': '安全について',
    'settings.securityDescription': 'すべての支払い情報はStripeによって暗号化され、安全に処理されます。カード情報は当サービスのサーバーには保存されません。',
    
    // Individual notification settings - Auction related
    'notification.newBid': '新規入札通知',
    'notification.newBidDesc': '誰かがあなたの出品に入札した時',
    'notification.outbid': '上回られ通知', 
    'notification.outbidDesc': 'あなたの入札が他の人に上回られた時',
    'notification.bidConfirmation': '入札確認通知',
    'notification.bidConfirmationDesc': 'あなたが入札した時の確認通知',
    'notification.auctionEnd': 'オークション終了通知',
    'notification.auctionEndDesc': 'オークションが終了した時',
    'notification.winning': '落札通知',
    'notification.winningDesc': 'あなたがオークションに勝利した時',
    'notification.losing': '落札失敗通知',
    'notification.losingDesc': 'オークションで負けた時',
    'notification.reserveMet': 'リザーブ達成通知',
    'notification.reserveMetDesc': 'リザーブ価格に達した時',
    'notification.lastMinuteBid': '終了間際入札通知',
    'notification.lastMinuteBidDesc': 'オークション終了5分前の入札通知',
    'notification.auctionExtension': '延長通知',
    'notification.auctionExtensionDesc': 'オークション時間が延長された時',
    
    // Listing related notifications
    'notification.listingApproved': '出品承認通知',
    'notification.listingApprovedDesc': 'あなたの出品が承認された時',
    'notification.listingRejected': '出品拒否通知',
    'notification.listingRejectedDesc': 'あなたの出品が拒否された時',
    'notification.firstBid': '初回入札通知',
    'notification.firstBidDesc': 'あなたの出品に初めて入札があった時',
    'notification.sellerBidUpdate': '入札更新通知',
    'notification.sellerBidUpdateDesc': '出品物の入札状況が更新された時',
    'notification.listingExpired': '出品期限通知',
    'notification.listingExpiredDesc': '出品の有効期限が近づいた時',
    
    // Account and security notifications
    'notification.profileUpdate': 'プロフィール更新通知',
    'notification.profileUpdateDesc': 'プロフィール情報が変更された時',
    'notification.emailChange': 'メールアドレス変更通知',
    'notification.emailChangeDesc': 'メールアドレスが変更された時',
    'notification.passwordChange': 'パスワード変更通知',
    'notification.passwordChangeDesc': 'パスワードが変更された時',
    'notification.login': 'ログイン通知',
    'notification.loginDesc': 'アカウントにログインした時（毎回）',
    'notification.newDeviceLogin': '新しいデバイスログイン通知',
    'notification.newDeviceLoginDesc': '新しいデバイスからログインした時',
    'notification.suspiciousActivity': '不審なアクティビティ通知',
    'notification.suspiciousActivityDesc': '疑わしい活動が検出された時',
    
    // Watch list and marketing notifications
    'notification.watchListBid': 'ウォッチリスト入札通知',
    'notification.watchListBidDesc': 'ウォッチリストの車両に入札があった時',
    'notification.watchListEndingSoon': 'ウォッチリスト終了間際通知',
    'notification.watchListEndingSoonDesc': 'ウォッチリストの車両がもうすぐ終了する時',
    'notification.newsletter': 'ニューズレター',
    'notification.newsletterDesc': '月間ニューズレターを受け取る',
    'notification.promotional': 'プロモーション通知',
    'notification.promotionalDesc': 'セールやキャンペーン情報を受け取る',
    'notification.weeklyDigest': '週間ダイジェスト',
    'notification.weeklyDigestDesc': 'おすすめの車両や活動要約を受け取る',
    
    // System notifications
    'notification.maintenance': 'メンテナンス通知',
    'notification.maintenanceDesc': 'システムメンテナンスの予定とお知らせ',
    'notification.systemUpdate': 'システム更新通知',
    'notification.systemUpdateDesc': '新機能やシステム更新のお知らせ',
  },
  en: {
    // BidBar translations
    'bidbar.currentPrice': 'Current Price',
    'bidbar.timeRemaining': 'Time Remaining',
    'bidbar.ended': 'Ended',
    'bidbar.submit': 'Place Bid',
    'bidbar.submitting': 'Bidding...',
    'bidbar.auctionEnded': 'Auction Ended',
    'bidbar.minimumBidError': 'Bid amount insufficient',
    'bidbar.minimumBidDescription': 'Minimum bid is {amount}.',
    'bidbar.minimumBidPlaceholder': 'Minimum bid: {amount}',
    'bidbar.bidSuccess': 'Bid placed successfully',
    'bidbar.bidSuccessDescription': 'Your bid of {amount} has been placed.',
    'bidbar.bidError': 'Bid failed',
    'bidbar.bidErrorDescription': 'Please try again.',
    'bidbar.networkError': 'Bid Error',
    'bidbar.networkErrorDescription': 'A network error occurred.',
    
    // AuctionCard translations
    'auctioncard.classicCar': 'Classic Car',
    'auctioncard.motorcycle': 'Motorcycle',
    'auctioncard.currentPrice': 'Current Price',
    'auctioncard.bidCount': '{count} bids',
    'auctioncard.bids': 'bids',
    'auctioncard.live': 'Live',
    'auctioncard.reserveMet': 'Reserve met',
    'auctioncard.reserveNotMet': 'Reserve not met',
    
    // Time formatting
    'time.ended': 'Ended',
    'time.remaining': 'Remaining',
    'time.days': 'days',
    'time.hours': 'hours',
    'time.minutes': 'minutes',
    'time.seconds': 'seconds',
    'time.ago': 'ago',
    
    // Settings page translations
    'settings.title': 'Settings',
    'settings.save': 'Save',
    'settings.saving': 'Saving...',
    'settings.saved': 'Settings saved',
    'settings.savedDescription': 'Your changes have been saved successfully.',
    'settings.saveError': 'Save failed',
    'settings.saveErrorDescription': 'An error occurred while saving settings. Please try again later.',
    'settings.loading': 'Loading settings...',
    'settings.loadingError': 'Failed to load settings',
    'settings.retry': 'Retry',
    'settings.back': 'Back',
    'settings.description': 'Manage application settings',
    'settings.comingSoon': 'Coming Soon',
    'settings.display': 'Display Settings',
    'settings.theme': 'Theme',
    'settings.language': 'Language',
    'settings.currency': 'Currency',
    'settings.notifications': 'Notifications',
    'settings.emailNotifications': 'Email Notifications',
    'settings.pushNotifications': 'Push Notifications',
    'settings.testNotifications': 'Test Notifications',
    'settings.testEmail': 'Test Email',
    'settings.testPush': 'Test Push',
    
    // Payment method translations
    'payment.title': 'Payment Method Management',
    'payment.loading': 'Loading payment methods...',
    'payment.emptyStateTitle': 'No payment methods set up',
    'payment.emptyStateDescription': 'Please add a payment method for auction participation\nand fee payments',
    'payment.registeredCount': 'Registered payment methods: {count}',
    'payment.addCard': 'Add New Card',
    'payment.addCardButton': 'Add Card',
    'payment.addMethod': 'Add Payment Method',
    'payment.cancel': 'Cancel',
    'payment.processing': 'Processing...',
    'payment.cardAdded': 'Payment method added',
    'payment.cardAddedDescription': 'New payment method has been added successfully.',
    'payment.addCardError': 'Failed to add card',
    'payment.addCardErrorDescription': 'An error occurred while adding the payment method. Please try again later.',
    'payment.securityInfo': 'Security Information',
    'payment.securityDescription': 'Card information is encrypted and securely processed by Stripe. No card information is stored on our site.',
    'payment.loadingError': 'Stripe not loaded',
    'payment.loadingErrorDescription': 'Please wait and try again.',
    'payment.default': 'Default',
    'payment.setDefault': 'Set as Default',
    'payment.delete': 'Delete',
    'payment.expiryDate': 'Expiry Date',
    'payment.cardholderName': 'Cardholder Name',
    'payment.defaultSet': 'Default payment method set',
    'payment.deleted': 'Payment method deleted',
    'payment.error': 'Error',
    'payment.success': 'Success',
    'payment.setupIntentFailed': 'Failed to prepare card addition',
    'payment.deleteFailed': 'Failed to delete payment method',
    'payment.setDefaultFailed': 'Failed to set default payment method',
    
    // Theme options
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'System',
    
    // Language options
    'language.ja': '日本語',
    'language.en': 'English',
    
    // Currency options
    'currency.JPY': 'Japanese Yen (¥)',
    'currency.USD': 'US Dollar ($)',
    'currency.EUR': 'Euro (€)',
    'currency.GBP': 'British Pound (£)',
    
    // Settings notification sections
    'settings.globalNotifications': 'Global Notification Settings',
    'settings.emailNotification': 'Email Notifications',
    'settings.pushNotification': 'Push Notifications',
    'settings.smsNotification': 'SMS Notifications',
    'settings.auctionNotifications': 'Auction Notifications',
    'settings.listingNotifications': 'Listing Notifications',
    'settings.accountSecurityNotifications': 'Account & Security Notifications',
    'settings.watchListMarketingNotifications': 'Watch List & Marketing Notifications',
    'settings.systemNotifications': 'System Notifications',
    'settings.displaySettings': 'Display Settings',
    
    // Helper texts
    'settings.emailHelper': 'Receive important updates via email',
    'settings.pushHelper': 'Receive browser notifications',
    'settings.smsHelper': 'Receive urgent notifications via SMS',
    'settings.themeHelper': 'Change application appearance',
    'settings.languageHelper': 'Change display language',
    'settings.currencyHelper': 'Currency for price display e.g.: {example}',
    'settings.compactViewLabel': 'Compact View',
    'settings.compactViewHelper': 'Make list displays more compact',
    
    // Delivery frequency
    'settings.deliveryFrequency': 'Delivery Frequency',
    'frequency.immediate': 'Send immediately',
    'frequency.hourly': 'Every hour',
    'frequency.daily': 'Daily digest',
    'frequency.disabled': 'Disabled',
    
    // Theme options
    'theme.darkTheme': 'Dark Theme',
    'theme.lightTheme': 'Light Theme',
    'theme.systemTheme': 'Follow System',
    
    // Language options with flags
    'language.jaWithFlag': '🇯🇵 日本語',
    'language.enWithFlag': '🇺🇸 English',
    
    // Currency options with symbols
    'currency.jpyWithSymbol': 'Japanese Yen (JPY)',
    'currency.usdWithSymbol': 'US Dollar (USD)',
    'currency.eurWithSymbol': 'Euro (EUR)',
    'currency.gbpWithSymbol': 'British Pound (GBP)',
    
    // Notification test messages
    'settings.testNotificationTitle': 'Test Notification',
    'settings.testNotificationBody': 'Push notifications are working correctly.',
    'settings.emailTestTitle': 'Email Test Sent',
    'settings.pushTestTitle': 'Push Notification Test',
    'settings.emailTestDescription': 'Test email has been sent. Please check your mailbox.',
    'settings.pushTestDescription': 'Push notification test completed.',
    'settings.testErrorTitle': 'Test Send Error',
    'settings.testErrorDescription': 'Notification test failed. Please wait and try again.',
    
    // Toast messages for toggles
    'settings.notificationEnabled': 'Notifications enabled',
    'settings.notificationDisabled': 'Notifications disabled',
    'settings.emailNotificationEnabled': 'Email notifications have been enabled.',
    'settings.emailNotificationDisabled': 'Email notifications have been disabled.',
    'settings.pushNotificationEnabled': 'Push notifications have been enabled.',
    'settings.pushNotificationDisabled': 'Push notifications have been disabled.',
    
    // Theme change messages
    'settings.themeChanged': 'Theme changed',
    'settings.themeChangedToLight': 'Switched to Light Theme.',
    'settings.themeChangedToDark': 'Switched to Dark Theme.',
    'settings.themeChangedToSystem': 'Switched to System Settings.',
    
    // Language change messages
    'settings.languageChanged': 'Language changed',
    'settings.languageChangedToJapanese': 'Switched to Japanese.',
    'settings.languageChangedToEnglish': 'Switched to English.',
    
    // Currency change messages
    'settings.currencyChanged': 'Currency changed',
    'settings.currencyChangedToJPY': 'Switched to Japanese Yen display.',
    'settings.currencyChangedToUSD': 'Switched to US Dollar display.',
    'settings.currencyChangedToEUR': 'Switched to Euro display.',
    'settings.currencyChangedToGBP': 'Switched to British Pound display.',
    
    // Button texts
    'settings.addNewCard': 'Add New Card',
    'settings.cancelButton': 'Cancel',
    'settings.saveSettingsButton': 'Save Settings',
    'settings.savingButton': 'Saving...',
    
    // Security information
    'settings.securityTitle': 'Security Information',
    'settings.securityDescription': 'All payment information is encrypted and securely processed by Stripe. No card information is stored on our servers.',
    
    // Individual notification settings - Auction related
    'notification.newBid': 'New Bid Notifications',
    'notification.newBidDesc': 'When someone bids on your listing',
    'notification.outbid': 'Outbid Notifications',
    'notification.outbidDesc': 'When your bid is outbid by someone else',
    'notification.bidConfirmation': 'Bid Confirmation Notifications',
    'notification.bidConfirmationDesc': 'Confirmation when you place a bid',
    'notification.auctionEnd': 'Auction End Notifications',
    'notification.auctionEndDesc': 'When an auction ends',
    'notification.winning': 'Winning Notifications',
    'notification.winningDesc': 'When you win an auction',
    'notification.losing': 'Losing Notifications',
    'notification.losingDesc': 'When you lose an auction',
    'notification.reserveMet': 'Reserve Met Notifications',
    'notification.reserveMetDesc': 'When reserve price is reached',
    'notification.lastMinuteBid': 'Last Minute Bid Notifications',
    'notification.lastMinuteBidDesc': 'Bid notifications in final 5 minutes',
    'notification.auctionExtension': 'Extension Notifications',
    'notification.auctionExtensionDesc': 'When auction time is extended',
    
    // Listing related notifications
    'notification.listingApproved': 'Listing Approved Notifications',
    'notification.listingApprovedDesc': 'When your listing is approved',
    'notification.listingRejected': 'Listing Rejected Notifications',
    'notification.listingRejectedDesc': 'When your listing is rejected',
    'notification.firstBid': 'First Bid Notifications',
    'notification.firstBidDesc': 'When your listing receives its first bid',
    'notification.sellerBidUpdate': 'Bid Update Notifications',
    'notification.sellerBidUpdateDesc': 'When bid status updates on your listings',
    'notification.listingExpired': 'Listing Expiry Notifications',
    'notification.listingExpiredDesc': 'When your listing expiration approaches',
    
    // Account and security notifications
    'notification.profileUpdate': 'Profile Update Notifications',
    'notification.profileUpdateDesc': 'When your profile information is changed',
    'notification.emailChange': 'Email Change Notifications',
    'notification.emailChangeDesc': 'When your email address is changed',
    'notification.passwordChange': 'Password Change Notifications',
    'notification.passwordChangeDesc': 'When your password is changed',
    'notification.login': 'Login Notifications',
    'notification.loginDesc': 'Every time you log into your account',
    'notification.newDeviceLogin': 'New Device Login Notifications',
    'notification.newDeviceLoginDesc': 'When you log in from a new device',
    'notification.suspiciousActivity': 'Suspicious Activity Notifications',
    'notification.suspiciousActivityDesc': 'When suspicious activity is detected',
    
    // Watch list and marketing notifications
    'notification.watchListBid': 'Watch List Bid Notifications',
    'notification.watchListBidDesc': 'When someone bids on watched vehicles',
    'notification.watchListEndingSoon': 'Watch List Ending Soon Notifications',
    'notification.watchListEndingSoonDesc': 'When watched vehicles are ending soon',
    'notification.newsletter': 'Newsletter',
    'notification.newsletterDesc': 'Receive monthly newsletter',
    'notification.promotional': 'Promotional Notifications',
    'notification.promotionalDesc': 'Receive sales and campaign information',
    'notification.weeklyDigest': 'Weekly Digest',
    'notification.weeklyDigestDesc': 'Receive recommended vehicles and activity summary',
    
    // System notifications
    'notification.maintenance': 'Maintenance Notifications',
    'notification.maintenanceDesc': 'System maintenance schedules and announcements',
    'notification.systemUpdate': 'System Update Notifications',
    'notification.systemUpdateDesc': 'New features and system update announcements',
  },
} as const;

// Translation function with interpolation support
export function translate(key: keyof typeof translations.ja, language: Language, params?: Record<string, string | number>): string {
  const translation: string = translations[language][key] || translations.ja[key] || key;
  
  if (!params) return translation;
  
  // Simple interpolation - replace {key} with value
  let result: string = translation;
  Object.entries(params).forEach(([paramKey, value]) => {
    result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
  });
  return result;
}

// Hook for easy translation access
export function useTranslation(language: Language) {
  return {
    t: (key: keyof typeof translations.ja, params?: Record<string, string | number>) => 
      translate(key, language, params),
    language,
  };
}

// Format time remaining with translation support
export function formatTimeRemaining(endTime: Date, language: Language): string {
  const { t } = useTranslation(language);
  const now = new Date();
  const timeRemaining = endTime.getTime() - now.getTime();

  if (timeRemaining <= 0) {
    return t('time.ended');
  }

  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

  if (days > 0) {
    return `${t('time.remaining')} ${days}${t('time.days')} ${hours}${t('time.hours')}`;
  } else if (hours > 0) {
    return `${t('time.remaining')} ${hours}${t('time.hours')} ${minutes}${t('time.minutes')}`;
  } else if (minutes > 0) {
    return `${t('time.remaining')} ${minutes}${t('time.minutes')} ${seconds}${t('time.seconds')}`;
  } else {
    return `${t('time.remaining')} ${seconds}${t('time.seconds')}`;
  }
}

// Format relative time with translation support
export function formatRelativeTime(date: Date, language: Language): string {
  const { t } = useTranslation(language);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}${t('time.seconds')}${t('time.ago')}`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}${t('time.minutes')}${t('time.ago')}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}${t('time.hours')}${t('time.ago')}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}${t('time.days')}${t('time.ago')}`;
  }

  // For older dates, show the actual date
  const locale = language === 'ja' ? 'ja-JP' : 'en-US';
  return date.toLocaleDateString(locale);
}