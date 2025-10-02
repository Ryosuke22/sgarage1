import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, loginSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Car } from "lucide-react";
import { useLocation } from "react-router-dom";

type SignupForm = z.infer<typeof signupSchema>;
type LoginForm = z.infer<typeof loginSchema>;

interface AuthProps {
  mode?: 'login' | 'signup';
}

export default function Auth({ mode }: AuthProps = {}) {
  const [location] = useLocation();
  
  // Props、URLパラメータ、URLパスから初期状態を決定
  const getInitialMode = () => {
    // Props優先
    if (mode) return mode === 'login';
    
    // URLパスをチェック
    if (window.location.pathname === '/signup') return false;
    if (window.location.pathname === '/login') return true;
    
    // URLパラメータをチェック
    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get('mode');
    console.log('URL params:', window.location.search, 'mode:', urlMode);
    return urlMode !== 'signup';
  };
  
  const [isLogin, setIsLogin] = useState(() => getInitialMode());
  
  useEffect(() => {
    setIsLogin(getInitialMode());
  }, [location, mode]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      lastName: "",
      firstName: "",
      lastNameKana: "",
      firstNameKana: "",
    },
  });

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSignup = async (data: SignupForm) => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/signup", data);
      toast({
        title: "アカウント作成完了",
        description: "ログインしてサービスをご利用ください",
      });
      setIsLogin(true);
      signupForm.reset();
    } catch (error: any) {
      toast({
        title: "登録エラー",
        description: error.message || "アカウント作成に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onLogin = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/login", data);
      toast({
        title: "ログイン成功",
        description: "Samurai Garageへようこそ",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "ログインエラー",
        description: error.message || "ログインに失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-neutral bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Car className="h-12 w-12 text-white mr-3" />
            <h1 className="text-4xl font-bold text-gradient font-serif">Samurai Garage</h1>
          </div>
          <p className="text-gray-400">プレミアムクラシックカーオークション</p>
        </div>

        <Card className="glass border-white/10">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">
              {isLogin ? "ログイン" : "新規登録"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLogin ? (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">メールアドレス</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="your@email.com"
                            className="bg-black/20 border-white/20 text-white placeholder-gray-400"
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">パスワード</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="パスワード"
                            className="bg-black/20 border-white/20 text-white placeholder-gray-400"
                            data-testid="input-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full btn-premium"
                    disabled={isLoading}
                    data-testid="button-login"
                  >
                    {isLoading ? "ログイン中..." : "ログイン"}
                  </Button>
                </form>
              </Form>
            ) : (
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={signupForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">姓</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="田中"
                              className="bg-black/20 border-white/20 text-white placeholder-gray-400"
                              data-testid="input-lastname"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">名</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="太郎"
                              className="bg-black/20 border-white/20 text-white placeholder-gray-400"
                              data-testid="input-firstname"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={signupForm.control}
                      name="lastNameKana"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">姓（カタカナ）</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="タナカ"
                              className="bg-black/20 border-white/20 text-white placeholder-gray-400"
                              data-testid="input-lastname-kana"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="firstNameKana"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">名（カタカナ）</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="タロウ"
                              className="bg-black/20 border-white/20 text-white placeholder-gray-400"
                              data-testid="input-firstname-kana"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={signupForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">電話番号</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="tel"
                            placeholder="090-1234-5678"
                            className="bg-black/20 border-white/20 text-white placeholder-gray-400"
                            data-testid="input-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={signupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">メールアドレス</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="your@email.com"
                            className="bg-black/20 border-white/20 text-white placeholder-gray-400"
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={signupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">パスワード</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="8文字以上のパスワード"
                            className="bg-black/20 border-white/20 text-white placeholder-gray-400"
                            data-testid="input-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={signupForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">パスワード確認</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="パスワードを再入力"
                            className="bg-black/20 border-white/20 text-white placeholder-gray-400"
                            data-testid="input-confirm-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button
                    type="submit"
                    className="w-full btn-premium"
                    disabled={isLoading}
                    data-testid="button-signup"
                  >
                    {isLoading ? "登録中..." : "アカウント作成"}
                  </Button>
                </form>
              </Form>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-gray-400 hover:text-white transition-colors"
                data-testid="button-toggle-mode"
              >
                {isLogin ? "新規登録はこちら" : "ログインはこちら"}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-gray-500 text-center">
          アカウント作成により、利用規約とプライバシーポリシーに同意したものとみなされます
        </p>
      </div>
    </div>
  );
}