import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Car, Heart, Plus, Shield, LogOut, Menu, User, Settings } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UserProfile } from "./UserProfile";
import SiteHeader from "./SiteHeader";
import type { User as UserType } from "@shared/schema";
import { lazyWithPreload } from 'react-lazy-with-preload';

// Preload-enabled CreateListing component
const CreateListing = lazyWithPreload(() => import("@/pages/CreateListing"));

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        const isActive = location.pathname === item.href;
        return (
          <span
            key={item.name}
            className={`${
              mobile
                ? "flex items-center px-2 py-1.5 rounded-md text-sm font-medium"
                : "flex items-center px-2 py-1.5 rounded-md text-xs font-medium"
            } ${
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            } cursor-pointer whitespace-nowrap`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Navigation clicked:', item.name, 'to:', item.href);
              navigate(item.href);
              mobile && setMobileMenuOpen(false);
            }}
            onMouseEnter={() => {
              // Preload CreateListing page when hovering over 出品する button
              if (item.href === "/create") {
                CreateListing.preload();
              }
            }}
            onFocus={() => {
              // Preload CreateListing page when focusing on 出品する button
              if (item.href === "/create") {
                CreateListing.preload();
              }
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

  const headerRightSlot = (
    <div className="flex items-center space-x-6">
      {/* Desktop Navigation */}
      <nav className="hidden md:flex space-x-2">
        <NavigationItems />
        {/* Admin navigation for desktop */}
        {isAdmin && (
          <span
            className={`flex items-center px-2 py-1.5 rounded-md text-xs font-medium ${
              location.pathname === "/admin" || location.pathname.startsWith("/admin/")
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
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

      <div className="flex items-center space-x-3">
        {!isAuthenticated ? (
          <Button
            onClick={() => window.location.href = "/api/login"}
            size="sm"
            className="btn-premium text-primary-foreground"
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
              className="text-foreground hover:bg-accent"
              data-testid="button-mobile-menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="right" 
            className="w-64 border-border text-foreground overflow-y-auto scrollbar-hide bg-background"
          >
            <div className="flex flex-col space-y-4 mt-8 text-foreground h-full overflow-y-auto scrollbar-hide pb-6">
              <div className="text-lg font-semibold text-foreground mb-4">メニュー</div>
              
              {/* Navigation Items */}
              <NavigationItems mobile />
              
              {/* Settings Link */}
              <span
                className="flex items-center px-2 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer whitespace-nowrap"
                onClick={() => {
                  navigate("/settings");
                  setMobileMenuOpen(false);
                }}
                data-testid="nav-settings-mobile"
              >
                <Settings className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="whitespace-nowrap">設定</span>
              </span>

              {/* Admin Link */}
              {isAdmin && (
                <span
                  className="flex items-center px-2 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer whitespace-nowrap"
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

              {/* User Profile - bottom of menu */}
              {isAuthenticated && user && (
                <>
                  <div className="mt-auto pt-6 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center space-x-3 cursor-pointer hover:bg-accent/50 rounded-lg p-2 -m-2 transition-colors"
                        onClick={() => {
                          navigate("/profile");
                          setMobileMenuOpen(false);
                        }}
                        data-testid="user-profile-click"
                      >
                        <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-primary-foreground text-sm font-medium">
                            {user.username?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{user.username || "ユーザー"}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          window.location.href = "/api/logout";
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background scrollbar-hide">
      {/* Use new SiteHeader component */}
      <SiteHeader rightSlot={headerRightSlot} />

      {/* Main Content */}
      <main className="min-h-screen">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-xl font-bold text-foreground mb-4 font-serif">Samurai Garage</h3>
              <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                日本のクラシックカー・バイクに特化したオークションプラットフォーム。<br className="hidden sm:block" />
                1960年から2000年までの名車を、authentic Japaneseな体験でお届けします。
              </p>
              <div className="flex space-x-4">
                <span className="text-muted-foreground text-xs">© 2024 Samurai Garage</span>
                <span className="bg-orange-500/20 text-orange-300 text-xs px-2 py-1 rounded-full border border-orange-500/30 font-semibold">
                  β版
                </span>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">サービス</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">オークションの流れ</Link></li>
                <li><Link to="/fees" className="text-muted-foreground hover:text-foreground transition-colors">手数料について</Link></li>
                <li><Link to="/listing-guide" className="text-muted-foreground hover:text-foreground transition-colors">出品ガイド</Link></li>
                <li><Link to="/photo-guide" className="text-muted-foreground hover:text-foreground transition-colors">写真撮影ガイド</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">企業情報</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/company" className="text-muted-foreground hover:text-foreground transition-colors">会社概要</Link></li>
                <li><Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">利用規約</Link></li>
                <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">プライバシーポリシー</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}