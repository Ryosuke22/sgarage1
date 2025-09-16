import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Car, Bike, User } from "lucide-react";

interface HeaderProps {
  onSearch: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <header className="bg-background border-b border-border shadow-sm sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center" data-testid="logo-link">
              <Car className="text-primary text-2xl mr-2" />
              <h1 className="text-xl font-bold text-foreground jp-title">サムライガレージ</h1>
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link 
                href="/" 
                className="nav-link jp-body"
                data-testid="nav-home"
              >
                ホーム
              </Link>
              <Link 
                href="/?category=car" 
                className="nav-link jp-body flex items-center gap-1"
                data-testid="nav-cars"
              >
                <Car className="w-4 h-4" />
                車
              </Link>
              <Link 
                href="/?category=motorcycle" 
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
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90 jp-body"
              data-testid="login-button"
            >
              <User className="w-4 h-4 mr-2" />
              ログイン
            </Button>
            <Button 
              variant="secondary"
              className="jp-body"
              data-testid="register-button"
            >
              会員登録
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
