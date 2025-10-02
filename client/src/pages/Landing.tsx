import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Car, Zap, Shield, Clock, Award, Globe, TrendingUp, Users, LogOut, User, Menu, X, Home, Settings } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserProfile } from "@/components/UserProfile";
import SiteHeader from "@/components/SiteHeader";
import { useState, useEffect } from "react";

export default function Landing() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      toast({
        title: "ログアウト完了",
        description: "またのご利用をお待ちしております",
      });
      navigate("/");
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/");
      window.location.reload();
    }
  };
  const headerRightSlot = (
    <div className="flex items-center gap-1 sm:gap-4">
      {!isLoading && isAuthenticated ? (
        <>
          <UserProfile />
          <div className="flex gap-1 sm:gap-2">
            {/* スマホ: アイコンのみ、デスクトップ: テキスト付き */}
            <button 
              onClick={() => navigate('/')}
              className="glass border border-white/20 text-white p-2 sm:px-4 sm:py-2 rounded-lg font-semibold hover:bg-white/10 transition-all flex items-center gap-2"
              data-testid="button-dashboard"
              title="ダッシュボード"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">ダッシュボード</span>
            </button>
            {user && typeof user === 'object' && 'role' in user && user.role === "admin" && (
              <button 
                onClick={() => navigate('/admin/users')}
                className="glass border border-orange-400/20 text-orange-200 p-2 sm:px-4 sm:py-2 rounded-lg font-semibold hover:bg-orange-400/10 transition-all flex items-center gap-2"
                data-testid="button-user-management"
                title="ユーザー管理"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">ユーザー管理</span>
              </button>
            )}
            <button 
              onClick={handleLogout}
              className="glass border border-white/20 text-white p-2 sm:px-4 sm:py-2 rounded-lg font-semibold hover:bg-white/10 transition-all flex items-center gap-2"
              data-testid="button-logout"
              title="ログアウト"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">ログアウト</span>
            </button>
          </div>
        </>
      ) : (
        <Button
          onClick={() => window.location.href = "/api/login"}
          className="btn-premium text-white"
          data-testid="button-login-header"
        >
          ログイン
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen gradient-neutral bg-gray-900">
      <SiteHeader rightSlot={headerRightSlot} />


      {/* Hero Section */}
      <main className="section-padding">
        <div className="container-professional">
          <div className="text-center space-y-8">
            
            {/* β版バッジ */}
            <div className="flex justify-center">
              <span className="bg-orange-500/20 text-orange-300 text-sm px-4 py-2 rounded-full border border-orange-500/30 font-semibold">
                β版
              </span>
            </div>

            {/* デスクトップ用タイトル */}
            <h1 className="hidden sm:block text-6xl sm:text-8xl font-black text-white mb-8 leading-tight tracking-tight">
              クラシックカー専門<br />
              オークション<br />
              <span className="text-gradient font-samurai">サムライガレージ</span>
            </h1>
            
            {/* モバイル用タイトル */}
            <h1 className="block sm:hidden text-4xl font-black text-white mb-8 leading-tight tracking-tight">
              <div>クラシックカー</div>
              <div>専門オークション</div>
              <div className="text-gradient font-samurai">サムライガレージ</div>
            </h1>
            
            <p className="text-2xl sm:text-3xl text-gray-300 mb-12 max-w-5xl mx-auto leading-relaxed font-light">
              <span className="sm:whitespace-nowrap">世界中の厳選された</span>
              <span className="sm:whitespace-nowrap">クラシックカー・オートバイを、</span>
              <br className="hidden sm:block" />
              <span className="sm:whitespace-nowrap">透明で公正な</span>
              <span className="sm:whitespace-nowrap">審査制オークションで。</span>
              <br />
              <span className="sm:whitespace-nowrap">リアルタイム入札システム</span>と
              <span className="sm:whitespace-nowrap">万全のセキュリティで、</span>
              <br className="hidden sm:block" />
              <span className="sm:whitespace-nowrap">あなたの夢の</span>
              <span className="sm:whitespace-nowrap">コレクションを実現します。</span>
            </p>
            
            <div className="flex justify-center items-center">
              <button 
                onClick={() => {
                  console.log('メインボタン: 新規登録ボタンがクリックされました');
                  console.log('現在のパス:', window.location.pathname);
                  navigate('/signup');
                  console.log('navigate(/signup) を実行しました');
                }}
                className="btn-premium text-white px-10 py-4 rounded-xl text-lg font-semibold shadow-lg min-w-[200px]"
                data-testid="button-get-started"
              >
                無料で新規登録
              </button>
            </div>


          </div>
        </div>

      </main>

      {/* Features Section */}
      <section id="features" className="section-padding bg-gray-800">
        <div className="container-professional">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-white mb-6">プロフェッショナルな体験</h2>
            <p className="text-2xl text-gray-300 max-w-4xl mx-auto font-light">
              <span className="whitespace-nowrap">専門性と信頼性を</span><span className="whitespace-nowrap">重視した</span><span className="whitespace-nowrap">オークションプラットフォーム</span>
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="card-professional p-8 text-center">
              <div className="flex items-center justify-center w-16 h-16 gradient-premium rounded-2xl mb-6 mx-auto">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">審査制</h3>
              <p className="text-gray-300 leading-relaxed text-lg">
                <span className="whitespace-nowrap">写真や説明が</span><span className="whitespace-nowrap">出品者まかせではなく、</span><span className="whitespace-nowrap">一定基準でチェック済みの</span><span className="whitespace-nowrap">車両だけを出品</span>
              </p>
            </div>

            <div className="card-professional p-8 text-center">
              <div className="flex items-center justify-center w-16 h-16 gradient-premium rounded-2xl mb-6 mx-auto">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">リアルタイム入札</h3>
              <p className="text-gray-300 leading-relaxed text-lg">
                <span className="whitespace-nowrap">最新技術による</span><span className="whitespace-nowrap">ライブ更新システム。</span><span className="whitespace-nowrap">瞬時に更新される</span><span className="whitespace-nowrap">入札情報で</span><span className="whitespace-nowrap">公正な競争環境を実現</span>
              </p>
            </div>

            <div className="card-professional p-8 text-center">
              <div className="flex items-center justify-center w-16 h-16 gradient-premium rounded-2xl mb-6 mx-auto">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">ソフトクローズ</h3>
              <p className="text-gray-300 leading-relaxed text-lg">
                <span className="whitespace-nowrap">入札終了間際の</span><span className="whitespace-nowrap">駆け込み入札も考慮した</span><span className="whitespace-nowrap">自動延長機能。</span><span className="whitespace-nowrap">全員に公平な</span><span className="whitespace-nowrap">入札機会を保証</span>
              </p>
            </div>

            <div className="card-professional p-8 text-center">
              <div className="flex items-center justify-center w-16 h-16 gradient-premium rounded-2xl mb-6 mx-auto">
                <Car className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">プレミアムコレクション</h3>
              <p className="text-gray-300 leading-relaxed text-lg">
                <span className="whitespace-nowrap">クラシックカーから</span><span className="whitespace-nowrap">ヴィンテージバイクまで。</span><span className="whitespace-nowrap">世界中から集めた</span><span className="whitespace-nowrap">希少車両の</span><span className="whitespace-nowrap">究極コレクション</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Same as Dashboard */}
      <footer className="bg-gray-900 border-t border-white/10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-wrap gap-8 justify-center">
            {/* ナビゲーションタブ */}
            <div className="flex flex-wrap gap-6 text-sm">
              <span
                onClick={() => navigate("/company")}
                className="text-gray-300 hover:text-white cursor-pointer transition-colors border-b border-transparent hover:border-white pb-1"
                data-testid="link-company"
              >
                会社情報
              </span>
              <span
                onClick={() => navigate("/listing-guide")}
                className="text-gray-300 hover:text-white cursor-pointer transition-colors border-b border-transparent hover:border-white pb-1"
                data-testid="link-listing-guide"
              >
                出品ガイド
              </span>
              <span
                onClick={() => navigate("/photo-guide")}
                className="text-gray-300 hover:text-white cursor-pointer transition-colors border-b border-transparent hover:border-white pb-1"
                data-testid="link-photo-guide"
              >
                写真の撮り方
              </span>
              <span
                onClick={() => navigate("/pricing-guide")}
                className="text-gray-300 hover:text-white cursor-pointer transition-colors border-b border-transparent hover:border-white pb-1"
                data-testid="link-pricing-guide"
              >
                価格設定のコツ
              </span>
              <span
                onClick={() => navigate("/terms")}
                className="text-gray-300 hover:text-white cursor-pointer transition-colors border-b border-transparent hover:border-white pb-1"
                data-testid="link-terms"
              >
                利用規約
              </span>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-white/10 mt-8 pt-6 text-center">
            <div className="text-sm text-gray-400 space-y-2">
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 mb-4">
                <p className="text-orange-300 font-semibold">🚧 テスト版について</p>
                <p className="text-orange-200 text-xs mt-1">
                  このサイトは開発中のテスト版です。実際の取引は行われません。
                </p>
              </div>
              <p className="text-white font-medium">Samurai Garage株式会社</p>
              <p>古物商許可: 東京都公安委員会 第123456789012号</p>
              <p>© 2025 Samurai Garage. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
