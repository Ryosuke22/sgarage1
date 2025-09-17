import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Car, Zap, Shield, Clock, Award, Globe, TrendingUp, Users, LogOut, User } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserProfile } from "@/components/UserProfile";

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
  return (
    <div className="min-h-screen gradient-neutral bg-gray-900">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-white/10">
        <div className="container-professional">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0">
              <h1 className="text-3xl font-bold text-gradient font-serif">Samurai Garage</h1>
              <p className="text-xs text-muted-foreground font-medium tracking-wider uppercase">Premium Collection</p>
            </div>
            <div className="flex gap-4 items-center">
              {!isLoading && isAuthenticated ? (
                <>
                  <UserProfile />
                  <button 
                    onClick={() => navigate('/')}
                    className="glass border border-white/20 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-all"
                    data-testid="button-dashboard"
                  >
                    ダッシュボード
                  </button>
                  {user?.role === "admin" && (
                    <button 
                      onClick={() => navigate('/admin/users')}
                      className="glass border border-orange-400/20 text-orange-200 px-6 py-3 rounded-xl font-semibold hover:bg-orange-400/10 transition-all"
                      data-testid="button-user-management"
                    >
                      ユーザー管理
                    </button>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="glass border border-white/20 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-all flex items-center gap-2"
                    data-testid="button-logout"
                  >
                    <LogOut className="h-4 w-4" />
                    ログアウト
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      navigate('/login');
                    }}
                    className="glass border border-white/20 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-all"
                    data-testid="button-login"
                  >
                    ログイン
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/signup');
                    }}
                    className="btn-premium text-white px-6 py-3 rounded-xl font-semibold shadow-lg"
                    data-testid="button-signup"
                  >
                    新規登録
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="section-padding">
        <div className="container-professional">
          <div className="text-center space-y-8">


            <h1 className="text-6xl sm:text-8xl font-black text-white mb-8 leading-tight tracking-tight">
              日本最高級の<br />
              <span className="text-gradient font-serif">クラシックカー</span>
              <span className="whitespace-nowrap">オークション</span><br />
              <span className="whitespace-nowrap">プラットフォーム</span>
            </h1>
            
            <p className="text-2xl sm:text-3xl text-gray-300 mb-12 max-w-5xl mx-auto leading-relaxed font-light">
              <span className="whitespace-nowrap">世界中の厳選された</span><span className="whitespace-nowrap">クラシックカー</span>・<span className="whitespace-nowrap">オートバイを、</span><span className="whitespace-nowrap">透明で公正な</span><span className="whitespace-nowrap">審査制オークションで。</span>
              <br className="hidden sm:block" />
              <span className="whitespace-nowrap">リアルタイム入札システム</span>と<span className="whitespace-nowrap">万全のセキュリティで、</span><span className="whitespace-nowrap">あなたの夢の</span><span className="whitespace-nowrap">コレクションを実現します。</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
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
              <button 
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="glass border border-border/20 text-foreground px-10 py-4 rounded-xl hover:shadow-professional transition-all text-lg font-semibold min-w-[200px]"
                data-testid="button-learn-more"
              >
                サービス詳細を見る
              </button>
            </div>


          </div>
        </div>

      </main>

      {/* Features Section */}
      <section id="features" className="section-padding bg-gray-800">
        <div className="container-professional">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-white mb-6">なぜプロが選ぶのか</h2>
            <p className="text-2xl text-gray-300 max-w-4xl mx-auto font-light">
              <span className="whitespace-nowrap">業界最高水準の</span><span className="whitespace-nowrap">サービス品質と、</span><span className="whitespace-nowrap">他では手に入らない</span><span className="whitespace-nowrap">厳選された</span><span className="whitespace-nowrap">コレクションを</span><span className="whitespace-nowrap">お届けします</span>
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="card-professional p-8 text-center">
              <div className="flex items-center justify-center w-16 h-16 gradient-premium rounded-2xl mb-6 mx-auto">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">厳格な審査制</h3>
              <p className="text-gray-300 leading-relaxed text-lg">
                <span className="whitespace-nowrap">世界的な専門家チーム</span>による<span className="whitespace-nowrap">多段階審査。</span><span className="whitespace-nowrap">真正性・状態・歴史を</span><span className="whitespace-nowrap">徹底検証した車両のみを出品</span>
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

      {/* CTA Section */}
      <section className="section-padding gradient-premium">
        <div className="container-professional text-center">
          <h2 className="text-4xl font-bold text-white mb-6">プレミアム体験を今すぐ開始</h2>
          <p className="text-xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
            <span className="whitespace-nowrap">世界中のコレクターが</span><span className="whitespace-nowrap">信頼するプラットフォーム。</span>
            <br className="hidden sm:block" />
            <span className="whitespace-nowrap">無料アカウント作成で、</span><span className="whitespace-nowrap">厳選された</span><span className="whitespace-nowrap">クラシックカー</span><span className="whitespace-nowrap">オークションへの</span><span className="whitespace-nowrap">扉が開かれます。</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => {
                navigate('/signup');
              }}
              className="glass bg-white/20 text-white border border-white/30 px-12 py-4 rounded-xl hover:bg-white/30 transition-all text-lg font-semibold shadow-lg backdrop-blur"
              data-testid="button-start-now"
            >
              今すぐ無料登録
            </button>
            <button 
              onClick={() => {
                navigate('/login');
              }}
              className="glass border border-white/30 text-white px-12 py-4 rounded-xl hover:bg-white/10 transition-all text-lg font-semibold"
              data-testid="button-existing-login"
            >
              既存アカウントでログイン
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
