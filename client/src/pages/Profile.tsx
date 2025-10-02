import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Calendar, Shield, Edit, CheckCircle, ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import Layout from "@/components/Layout";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import PaymentMethodCard from "@/components/PaymentMethodCard";
import AddPaymentMethodDialog from "@/components/AddPaymentMethodDialog";
import { useTheme } from "@/components/ThemeProvider";
import { useTranslation } from "@/lib/i18n";

export default function Profile() {
  const { user, refetch } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [newEmail, setNewEmail] = useState("");
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Theme and translation
  const { language } = useTheme();
  const { t } = useTranslation(language);
  
  // Payment methods hook
  const {
    paymentMethods,
    isLoading: isLoadingPaymentMethods,
    createSetupIntent,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    addPaymentMethod,
    isCreatingSetupIntent,
    isDeletingPaymentMethod,
    isSettingDefault
  } = usePaymentMethods();
  
  // Payment method state
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);
  const [setupIntentClientSecret, setSetupIntentClientSecret] = useState<string | null>(null);

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-16">
          <Card className="glass border-white/10">
            <CardContent className="text-center p-8">
              <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">ログインが必要です</h2>
              <p className="text-gray-400 mb-4">プロフィールを表示するにはログインしてください</p>
              <Button
                onClick={() => navigate("/login")}
                className="btn-premium"
                data-testid="button-login-profile"
              >
                ログイン
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Payment method functions
  const handleAddPaymentMethod = async () => {
    try {
      const { clientSecret } = await createSetupIntent();
      setSetupIntentClientSecret(clientSecret);
      setShowAddPaymentDialog(true);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handlePaymentMethodAdded = async () => {
    await addPaymentMethod();
    setSetupIntentClientSecret(null);
  };

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    try {
      await deletePaymentMethod(paymentMethodId);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleSetDefaultPaymentMethod = async (paymentMethodId: string) => {
    try {
      await setDefaultPaymentMethod(paymentMethodId);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail.trim()) {
      toast({
        title: "エラー",
        description: "新しいメールアドレスを入力してください",
        variant: "destructive"
      });
      return;
    }

    if (newEmail === user?.email) {
      toast({
        title: "エラー",
        description: "現在のメールアドレスと同じです",
        variant: "destructive"
      });
      return;
    }

    setIsChangingEmail(true);
    
    try {
      const response = await apiRequest("POST", "/api/request-email-change", {
        newEmail: newEmail.trim()
      });

      toast({
        title: "認証メール送信",
        description: "新しいメールアドレスに認証メールを送信しました。メールをご確認ください。",
      });

      setIsDialogOpen(false);
      setNewEmail("");
      
      // ユーザー情報を再取得（pendingEmailが更新される可能性があるため）
      setTimeout(() => {
        refetch?.();
      }, 1000);
      
    } catch (error: any) {
      toast({
        title: "メールアドレス変更エラー",
        description: error.message || "メールアドレス変更のリクエストに失敗しました",
        variant: "destructive"
      });
    } finally {
      setIsChangingEmail(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 mt-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-white hover:bg-white/10"
            data-testid="button-back-profile"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">プロフィール</h1>
            <p className="text-gray-400">アカウント情報の確認</p>
          </div>
        </div>

        {/* ユーザーID */}
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5" />
              ユーザーID
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl text-white font-mono">@{user.username}</p>
            <p className="text-sm text-gray-400 mt-1">このIDでユーザーを識別できます</p>
          </CardContent>
        </Card>

        {/* メールアドレス */}
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Mail className="h-5 w-5" />
              メールアドレス
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-xl text-white">{user.email}</p>
                {user.emailVerified && (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                )}
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline" 
                    size="sm"
                    className="bg-transparent border-white/20 text-white hover:bg-white/10"
                    data-testid="button-change-email"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    変更
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass border-white/10 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-white">メールアドレス変更</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      新しいメールアドレスに認証メールを送信します
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleEmailChange} className="space-y-4">
                    <div>
                      <Label htmlFor="current-email" className="text-gray-400">現在のメールアドレス</Label>
                      <Input
                        id="current-email"
                        value={user.email}
                        disabled
                        className="bg-gray-800 border-gray-600 text-gray-300"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="new-email" className="text-white">新しいメールアドレス</Label>
                      <Input
                        id="new-email"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="new-email@example.com"
                        className="bg-transparent border-white/20 text-white placeholder:text-gray-500 focus:border-blue-400"
                        data-testid="input-new-email"
                        required
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        className="bg-transparent border-white/20 text-white hover:bg-white/10"
                        data-testid="button-cancel-email-change"
                      >
                        キャンセル
                      </Button>
                      <Button
                        type="submit"
                        disabled={isChangingEmail}
                        className="btn-premium"
                        data-testid="button-submit-email-change"
                      >
                        {isChangingEmail ? "送信中..." : "認証メール送信"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            
            <p className="text-sm text-gray-400 mt-1">
              {user.emailVerified ? "認証済みのメールアドレスです" : "メール認証が完了していません"}
            </p>
            
            {user.pendingEmail && (
              <div className="mt-3 p-3 bg-blue-900/20 border border-blue-400/20 rounded-lg">
                <p className="text-sm text-blue-300">
                  <strong>変更待ち:</strong> {user.pendingEmail}
                </p>
                <p className="text-xs text-blue-400 mt-1">
                  認証メールをご確認ください（24時間有効）
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 支払い方法管理 */}
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              支払い方法
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingPaymentMethods ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-400">支払い方法を読み込み中...</p>
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">支払い方法が登録されていません</h3>
                <p className="text-gray-400 mb-6" style={{ whiteSpace: 'pre-line' }}>
                  入札や購入に必要な支払い方法を登録してください。{'\n'}登録された情報は安全に暗号化されて保存されます。
                </p>
                <Button
                  onClick={handleAddPaymentMethod}
                  className="btn-premium"
                  disabled={isCreatingSetupIntent}
                  data-testid="button-add-payment-method"
                >
                  {isCreatingSetupIntent ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  支払い方法を追加
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">
                    登録済み支払い方法: {paymentMethods.length}件
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddPaymentMethod}
                    disabled={isCreatingSetupIntent}
                    className="bg-transparent border-white/20 text-white hover:bg-white/10"
                    data-testid="button-add-payment-method-secondary"
                  >
                    {isCreatingSetupIntent ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    新しいカードを追加
                  </Button>
                </div>

                <div className="grid gap-3">
                  {paymentMethods.map((method) => (
                    <PaymentMethodCard
                      key={method.id}
                      paymentMethod={method}
                      onSetDefault={handleSetDefaultPaymentMethod}
                      onDelete={handleDeletePaymentMethod}
                      isLoading={isDeletingPaymentMethod || isSettingDefault}
                    />
                  ))}
                </div>
              </div>
            )}
            
            <div className="border-t border-white/10 pt-4">
              <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-400/20">
                <p className="text-sm text-blue-300">
                  <strong>セキュリティ:</strong> すべての支払い情報は最高レベルの暗号化技術で保護されています。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 氏名情報 */}
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-white">氏名情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-1">姓</h4>
                <p className="text-lg text-white">{user.lastName}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-1">名</h4>
                <p className="text-lg text-white">{user.firstName}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-1">姓（カタカナ）</h4>
                <p className="text-lg text-white">{user.lastNameKana}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-1">名（カタカナ）</h4>
                <p className="text-lg text-white">{user.firstNameKana}</p>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button
                variant="outline" 
                size="sm"
                className="bg-transparent border-white/20 text-white hover:bg-white/10"
                disabled
                data-testid="button-edit-name"
              >
                <Edit className="h-4 w-4 mr-1" />
                変更（準備中）
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* アカウント情報 */}
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-white">アカウント情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-gray-400">アカウントロール</span>
              <Badge 
                variant={user.role === "admin" ? "destructive" : "secondary"}
                className="text-sm"
              >
                <Shield className="h-4 w-4 mr-1" />
                {user.role === "admin" ? "管理者" : "一般ユーザー"}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-gray-400">登録日</span>
              <div className="flex items-center gap-2 text-white">
                <Calendar className="h-4 w-4" />
                {user.createdAt && format(new Date(user.createdAt), "yyyy年MM月dd日", { locale: ja })}
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-400">最終更新</span>
              <div className="flex items-center gap-2 text-white">
                <Calendar className="h-4 w-4" />
                {user.updatedAt && format(new Date(user.updatedAt), "yyyy年MM月dd日", { locale: ja })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* アクション */}
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-white">設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full bg-transparent border-white/20 text-white hover:bg-white/10"
              disabled
              data-testid="button-edit-profile"
            >
              <Edit className="h-4 w-4 mr-2" />
              プロフィール編集（準備中）
            </Button>
            
            <Button
              variant="outline"
              className="w-full bg-transparent border-white/20 text-white hover:bg-white/10"
              disabled
              data-testid="button-change-password"
            >
              <Shield className="h-4 w-4 mr-2" />
              パスワード変更（準備中）
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Add Payment Method Dialog */}
      <AddPaymentMethodDialog
        open={showAddPaymentDialog}
        onOpenChange={setShowAddPaymentDialog}
        onSuccess={handlePaymentMethodAdded}
        setupIntentClientSecret={setupIntentClientSecret || undefined}
      />
    </Layout>
  );
}