// client/src/pages/auth.tsx - Authentication page with Japanese UI
import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, loginUserSchema, InsertUser } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Car, Shield, Trophy, Users } from "lucide-react";
import { z } from "zod";

type LoginData = z.infer<typeof loginUserSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("login");

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  // Login form
  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      firstName: "",
      lastName: "",
    },
  });

  const handleLogin = (data: LoginData) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        setLocation("/");
      },
    });
  };

  const handleRegister = (data: InsertUser) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        setLocation("/");
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Authentication forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">侍ガレージ</h1>
            <p className="text-muted-foreground">
              日本の名車オークションサイト
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2" data-testid="tabs-auth">
              <TabsTrigger value="login" data-testid="tab-login">
                ログイン
              </TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">
                新規登録
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>ログイン</CardTitle>
                  <CardDescription>
                    既存のアカウントでログインしてください
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username">ユーザー名</Label>
                      <Input
                        id="login-username"
                        data-testid="input-login-username"
                        placeholder="ユーザー名を入力"
                        {...loginForm.register("username")}
                        className={loginForm.formState.errors.username ? "border-destructive" : ""}
                      />
                      {loginForm.formState.errors.username && (
                        <p className="text-sm text-destructive">
                          {loginForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">パスワード</Label>
                      <Input
                        id="login-password"
                        type="password"
                        data-testid="input-login-password"
                        placeholder="パスワードを入力"
                        {...loginForm.register("password")}
                        className={loginForm.formState.errors.password ? "border-destructive" : ""}
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-destructive">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                      data-testid="button-login"
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ログイン中...
                        </>
                      ) : (
                        "ログイン"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>新規アカウント作成</CardTitle>
                  <CardDescription>
                    新しいアカウントを作成してオークションに参加しましょう
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-firstName">姓</Label>
                        <Input
                          id="register-firstName"
                          data-testid="input-register-firstName"
                          placeholder="田中"
                          {...registerForm.register("firstName")}
                          className={registerForm.formState.errors.firstName ? "border-destructive" : ""}
                        />
                        {registerForm.formState.errors.firstName && (
                          <p className="text-sm text-destructive">
                            {registerForm.formState.errors.firstName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-lastName">名</Label>
                        <Input
                          id="register-lastName"
                          data-testid="input-register-lastName"
                          placeholder="太郎"
                          {...registerForm.register("lastName")}
                          className={registerForm.formState.errors.lastName ? "border-destructive" : ""}
                        />
                        {registerForm.formState.errors.lastName && (
                          <p className="text-sm text-destructive">
                            {registerForm.formState.errors.lastName.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-username">ユーザー名</Label>
                      <Input
                        id="register-username"
                        data-testid="input-register-username"
                        placeholder="tanaka_taro"
                        {...registerForm.register("username")}
                        className={registerForm.formState.errors.username ? "border-destructive" : ""}
                      />
                      {registerForm.formState.errors.username && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email">
                        メールアドレス <span className="text-muted-foreground">(任意)</span>
                      </Label>
                      <Input
                        id="register-email"
                        type="email"
                        data-testid="input-register-email"
                        placeholder="tanaka@example.com"
                        {...registerForm.register("email")}
                        className={registerForm.formState.errors.email ? "border-destructive" : ""}
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password">パスワード</Label>
                      <Input
                        id="register-password"
                        type="password"
                        data-testid="input-register-password"
                        placeholder="8文字以上のパスワード"
                        {...registerForm.register("password")}
                        className={registerForm.formState.errors.password ? "border-destructive" : ""}
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-destructive">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                      data-testid="button-register"
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          アカウント作成中...
                        </>
                      ) : (
                        "アカウント作成"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero section */}
      <div className="hidden lg:flex lg:w-1/2 bg-muted relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background/50 to-secondary/20" />
        <div className="relative z-10 flex flex-col justify-center p-12 text-center">
          <div className="mb-8">
            <Car className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h2 className="text-4xl font-bold text-foreground mb-4">
              日本の名車オークション
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              希少な日本車をオークション形式で売買
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 max-w-md mx-auto">
            <div className="flex items-center space-x-3">
              <Shield className="h-6 w-6 text-primary flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold">安全な取引</p>
                <p className="text-sm text-muted-foreground">
                  セキュアな認証システム
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Trophy className="h-6 w-6 text-primary flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold">厳選された車両</p>
                <p className="text-sm text-muted-foreground">
                  歴史ある日本車のみを出品
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-primary flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold">コミュニティ</p>
                <p className="text-sm text-muted-foreground">
                  車好きが集まる場所
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}