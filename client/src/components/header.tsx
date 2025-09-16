import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <header className="bg-white border-b border-border shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center" data-testid="logo-link">
              <i className="fas fa-car text-primary text-2xl mr-2"></i>
              <h1 className="text-xl font-bold text-foreground">カーオークション</h1>
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link 
                href="/" 
                className="text-foreground hover:text-primary font-medium"
                data-testid="nav-home"
              >
                ホーム
              </Link>
              <a 
                href="#" 
                className="text-foreground hover:text-primary font-medium"
                data-testid="nav-cars"
              >
                車
              </a>
              <a 
                href="#" 
                className="text-foreground hover:text-primary font-medium"
                data-testid="nav-motorcycles"
              >
                バイク
              </a>
              <a 
                href="#" 
                className="text-foreground hover:text-primary font-medium"
                data-testid="nav-sell"
              >
                出品
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
                  <i className="fas fa-search"></i>
                </button>
              </form>
            </div>
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="login-button"
            >
              ログイン
            </Button>
            <Button 
              variant="secondary"
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
