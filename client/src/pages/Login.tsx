import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Car } from "lucide-react";
import { useLocation } from "wouter";

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

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
            <CardTitle className="text-2xl text-white">ログイン</CardTitle>
          </CardHeader>
          <CardContent>
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

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate("/signup")}
                className="text-gray-400 hover:text-white transition-colors"
                data-testid="button-to-signup"
              >
                新規登録はこちら
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}