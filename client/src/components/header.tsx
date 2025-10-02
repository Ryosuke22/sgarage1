import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Car, Bike, User, LogOut, Settings, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  onSearch: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isLoading, logoutMutation } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-background border-b border-border shadow-sm sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center" data-testid="logo-link">
              <Car className="text-primary text-2xl mr-2" />
              <h1 className="text-xl font-bold text-foreground jp-title">サムライガレージ</h1>
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link 
                to="/" 
                className="nav-link jp-body"
                data-testid="nav-home"
              >
                ホーム
              </Link>
              <Link 
                to="/?category=car" 
                className="nav-link jp-body flex items-center gap-1"
                data-testid="nav-cars"
              >
                <Car className="w-4 h-4" />
                車
              </Link>
              <Link 
                to="/?category=motorcycle" 
                className="nav-link jp-body flex items-center gap-1"
                data-testid="nav-motorcycles"
              >
                <Bike className="w-4 h-4" />
                バイク
              </Link>
              <a 
                href="#" 
                className="nav-link jp-body"
                data-testid="nav-sell"
              >
                出品する
              </a>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="text"
                  placeholder="車種、メーカーで検索"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 pr-10"
                  data-testid="search-input"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  data-testid="search-button"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>
            </div>
            {isLoading ? (
              <Button disabled>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                読み込み中
              </Button>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="jp-body h-8 w-8 rounded-full p-0"
                    data-testid="user-menu"
                  >
                    <User className="w-4 h-4" />
                    <span className="sr-only">アカウントメニュー</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-0.5 leading-none">
                      <p className="font-medium text-sm" data-testid="user-name">
                        {user.firstName ? `${user.firstName} ${user.lastName}` : user.username}
                      </p>
                      {user.email && (
                        <p className="text-xs text-muted-foreground" data-testid="user-email">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem data-testid="menu-settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>設定</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    data-testid="menu-logout"
                    disabled={logoutMutation.isPending}
                  >
                    {logoutMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="mr-2 h-4 w-4" />
                    )}
                    <span>ログアウト</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/auth">
                  <Button 
                    className="bg-primary text-primary-foreground hover:bg-primary/90 jp-body"
                    data-testid="login-button"
                  >
                    <User className="w-4 h-4 mr-2" />
                    ログイン
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button 
                    variant="secondary"
                    className="jp-body"
                    data-testid="register-button"
                  >
                    会員登録
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
