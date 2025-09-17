import { Car, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserProfile } from "./UserProfile";

export function GlobalHeader() {
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
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="glass sticky top-0 z-50 border-b border-white/10">
      <div className="container-professional">
        <div className="flex justify-between items-center h-20">
          <div 
            className="flex-shrink-0 cursor-pointer"
            onClick={() => {
              console.log("Logo clicked, navigating to landing page");
              navigate("/");
            }}
          >
            <div className="flex items-center gap-3">
              <Car className="h-12 w-12 text-white" />
              <div>
                <h1 className="text-3xl font-bold text-gradient font-serif">Samurai Garage</h1>
                <p className="text-xs text-muted-foreground font-medium tracking-wider uppercase">Premium Collection</p>
              </div>
            </div>
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
                  onClick={() => navigate('/login')}
                  className="glass border border-white/20 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-all"
                  data-testid="button-login"
                >
                  ログイン
                </button>
                <button 
                  onClick={() => navigate('/signup')}
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
  );
}