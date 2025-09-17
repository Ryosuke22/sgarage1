import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation, useRouter } from "wouter";
import { Car, Heart, Plus, Shield, LogOut, Menu, Search, User } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UserProfile } from "./UserProfile";
import type { User as UserType } from "@shared/schema";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navigation = [
    { name: "オークション一覧", href: "/", icon: Car },
    { name: "出品する", href: "/create", icon: Plus },
    { name: "ウォッチリスト", href: "/watch", icon: Heart },
  ];

  const adminNavigation = [
    { name: "管理ダッシュボード", href: "/admin", icon: Shield },
    { name: "ユーザー管理", href: "/admin/users", icon: User },
  ];

  const isAdmin = (user as any)?.role === "admin";

  const NavigationItems = ({ mobile = false }) => (
    <>
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.href;
        return (
          <span
            key={item.name}
            className={`${
              mobile
                ? "flex items-center px-2 py-1.5 rounded-md text-sm font-medium"
                : "flex items-center px-2 py-1.5 rounded-md text-xs font-medium"
            } ${
              isActive
                ? "bg-white/10 text-white"
                : "text-gray-300 hover:text-white hover:bg-white/10"
            } cursor-pointer whitespace-nowrap`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Navigation clicked:', item.name, 'to:', item.href);
              navigate(item.href);
              mobile && setMobileMenuOpen(false);
            }}
            data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <Icon className={`${mobile ? "mr-2 h-4 w-4" : "mr-1.5 h-3.5 w-3.5"} flex-shrink-0`} />
            <span className="whitespace-nowrap">{item.name}</span>
          </span>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen gradient-neutral bg-gray-900 scrollbar-hide">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex-shrink-0 cursor-pointer" 
                   onClick={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     console.log('Logo clicked, navigating to landing page');
                     navigate("/landing");
                   }}
                   data-testid="logo">
                <h1 className="text-3xl font-bold text-gradient font-serif">Samurai Garage</h1>
                <p className="text-xs text-muted-foreground font-medium tracking-wider uppercase">Premium Collection</p>
              </div>
              
              <nav className="hidden md:flex space-x-2">
                <NavigationItems />
                {/* Admin navigation for desktop */}
                {isAdmin && (
                  <span
                    className={`flex items-center px-2 py-1.5 rounded-md text-xs font-medium ${
                      location === "/admin" || location.startsWith("/admin/")
                        ? "bg-white/10 text-white"
                        : "text-gray-300 hover:text-white hover:bg-white/10"
                    } cursor-pointer whitespace-nowrap`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate("/admin");
                    }}
                    data-testid="nav-admin-desktop"
                  >
                    <Shield className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" />
                    <span className="whitespace-nowrap">管理画面</span>
                  </span>
                )}
              </nav>
              
              {/* Search Bar */}
              <div className="hidden md:flex items-center flex-1 max-w-sm mx-3">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="車種名、メーカー名で検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-black/20 border-white/20 text-white placeholder-gray-400 focus:border-white/40 focus:ring-white/20"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {!isAuthenticated ? (
                <Button
                  onClick={() => window.location.href = "/api/login"}
                  size="sm"
                  className="btn-premium text-white"
                  data-testid="button-login-header"
                >
                  ログイン
                </Button>
              ) : null}

              {/* Hamburger menu - always visible */}
              <div>
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10"
                      data-testid="button-mobile-menu"
                    >
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent 
                    side="right" 
                    className="w-64 border-white/10 text-white overflow-y-auto scrollbar-hide"
                    style={{ backgroundColor: '#111827' }}
                  >
                    <div className="flex flex-col space-y-4 mt-8 text-white h-full overflow-y-auto scrollbar-hide pb-6">
                      <div className="text-lg font-semibold text-white mb-4">メニュー</div>
                      
                      {/* Navigation Items */}
                      <NavigationItems mobile />
                      
                      {/* Admin Link */}
                      {isAdmin && (
                        <span
                          className="flex items-center px-2 py-1.5 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer whitespace-nowrap"
                          onClick={() => {
                            navigate("/admin");
                            setMobileMenuOpen(false);
                          }}
                          data-testid="nav-admin-mobile"
                        >
                          <Shield className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span className="whitespace-nowrap">管理画面</span>
                        </span>
                      )}
                      
                      {/* Guide Links */}
                      <div className="border-t border-white/10 pt-4">
                        <div className="text-sm font-medium text-gray-400 mb-3">ガイド</div>
                        <div className="space-y-2">
                          <span
                            className="flex items-center px-2 py-1.5 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer"
                            onClick={() => {
                              navigate("/photo-guide");
                              setMobileMenuOpen(false);
                            }}
                          >
                            写真の撮り方
                          </span>
                          <span
                            className="flex items-center px-2 py-1.5 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer"
                            onClick={() => {
                              navigate("/listing-guide");
                              setMobileMenuOpen(false);
                            }}
                          >
                            出品ガイド
                          </span>
                          <span
                            className="flex items-center px-2 py-1.5 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer"
                            onClick={() => {
                              navigate("/company");
                              setMobileMenuOpen(false);
                            }}
                          >
                            会社情報
                          </span>
                        </div>
                      </div>
                      
                      {/* Account Section */}
                      <div className="border-t border-white/10 pt-4">
                        {isAuthenticated ? (
                          <>
                            <div className="text-sm font-medium text-gray-400 mb-3">アカウント</div>
                            <span
                              className="flex items-center px-2 py-1.5 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer mb-2"
                              onClick={() => {
                                navigate("/profile");
                                setMobileMenuOpen(false);
                              }}
                              data-testid="nav-profile-mobile"
                            >
                              <User className="mr-2 h-4 w-4 flex-shrink-0" />
                              プロフィール
                            </span>
                            
                            {/* Admin Link */}
                            {isAdmin && (
                              <span
                                className="flex items-center px-2 py-1.5 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer mb-2"
                                onClick={() => {
                                  navigate("/admin");
                                  setMobileMenuOpen(false);
                                }}
                                data-testid="nav-admin-hamburger"
                              >
                                <Shield className="mr-2 h-4 w-4 flex-shrink-0" />
                                <span className="whitespace-nowrap">管理画面</span>
                              </span>
                            )}
                            
                            <Button
                              variant="ghost"
                              onClick={async () => {
                                try {
                                  await fetch("/api/auth/logout", { method: "POST" });
                                  window.location.href = "/";
                                } catch (error) {
                                  console.error("Logout error:", error);
                                  window.location.href = "/";
                                }
                              }}
                              className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10"
                              data-testid="button-logout-hamburger"
                            >
                              <LogOut className="mr-3 h-5 w-5" />
                              ログアウト
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={() => window.location.href = "/api/login"}
                            className="w-full btn-premium text-white"
                            data-testid="button-login-hamburger"
                          >
                            ログイン
                          </Button>
                        )}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
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
            <div className="text-sm text-gray-400 space-y-1">
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
