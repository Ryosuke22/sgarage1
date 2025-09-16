import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { type SelectListing } from "@shared/schema";
import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import VehicleCard from "@/components/vehicle-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Filter, Grid, List, AlertCircle } from "lucide-react";

type VehicleWithBids = SelectListing & {
  currentBid?: string | null;
  bidCount?: number;
};

function LoadingSkeleton() {
  return (
    <Card className="vehicle-card p-4 animate-pulse">
      <div className="aspect-[4/3] bg-muted rounded mb-4"></div>
      <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
      <div className="h-8 bg-muted rounded w-1/3"></div>
    </Card>
  );
}

export default function Home() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Get category from URL params
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const categoryFilter = urlParams.get('category') as 'car' | 'motorcycle' | null;

  const { data: listings, isLoading, error } = useQuery<VehicleWithBids[]>({
    queryKey: ["listings", categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categoryFilter) params.set('category', categoryFilter);
      params.set('status', 'published');
      
      const res = await fetch(`/api/listings?${params}`);
      if (!res.ok) throw new Error("Failed to fetch listings");
      return res.json();
    },
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredListings = listings?.filter(listing => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      listing.title.toLowerCase().includes(searchLower) ||
      listing.make.toLowerCase().includes(searchLower) ||
      listing.model.toLowerCase().includes(searchLower)
    );
  });

  const activeListings = filteredListings?.filter(listing => 
    listing.endDate && new Date() < new Date(listing.endDate)
  );
  const endedListings = filteredListings?.filter(listing => 
    !listing.endDate || new Date() >= new Date(listing.endDate)
  );

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header onSearch={handleSearch} />
        <div className="max-w-7xl mx-auto px-4 py-20">
          <Alert className="max-w-md mx-auto border-destructive/50 bg-destructive/10">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="jp-body text-destructive">
              データの読み込み中にエラーが発生しました。ページを再読み込みしてください。
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={handleSearch} />
      
      {!categoryFilter && <HeroSection />}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="jp-title text-3xl font-bold text-foreground mb-2">
              {categoryFilter === 'car' ? '車両オークション' : 
               categoryFilter === 'motorcycle' ? 'バイクオークション' : 
               'オークション一覧'}
            </h1>
            <p className="jp-body text-muted-foreground">
              {filteredListings ? `${filteredListings.length}件の車両が見つかりました` : '車両を読み込み中...'}
            </p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            {/* Category filter buttons */}
            <div className="flex gap-2">
              <Button
                variant={!categoryFilter ? "default" : "outline"}
                size="sm"
                onClick={() => setLocation('/')}
                className="jp-caption"
                data-testid="filter-all"
              >
                すべて
              </Button>
              <Button
                variant={categoryFilter === 'car' ? "default" : "outline"}
                size="sm"
                onClick={() => setLocation('/?category=car')}
                className="jp-caption"
                data-testid="filter-car"
              >
                車
              </Button>
              <Button
                variant={categoryFilter === 'motorcycle' ? "default" : "outline"}
                size="sm"
                onClick={() => setLocation('/?category=motorcycle')}
                className="jp-caption"
                data-testid="filter-motorcycle"
              >
                バイク
              </Button>
            </div>
            
            {/* View mode toggle */}
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="px-3 py-1 rounded-none"
                data-testid="view-grid"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('list')}
                className="px-3 py-1 rounded-none"
                data-testid="view-list"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <LoadingSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Active Auctions */}
        {activeListings && activeListings.length > 0 && (
          <section className="mb-12" data-testid="active-auctions">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="jp-subtitle text-2xl font-semibold text-foreground">開催中のオークション</h2>
              <Badge className="status-live jp-caption">
                {activeListings.length}件
              </Badge>
            </div>
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {activeListings.map((listing) => (
                <VehicleCard key={listing.id} vehicle={listing} />
              ))}
            </div>
          </section>
        )}

        {/* Ended Auctions */}
        {endedListings && endedListings.length > 0 && (
          <section data-testid="ended-auctions">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="jp-subtitle text-2xl font-semibold text-foreground">終了したオークション</h2>
              <Badge variant="secondary" className="jp-caption">
                {endedListings.length}件
              </Badge>
            </div>
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {endedListings.map((listing) => (
                <VehicleCard key={listing.id} vehicle={listing} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {filteredListings && filteredListings.length === 0 && !isLoading && (
          <div className="text-center py-20" data-testid="empty-state">
            <Filter className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="jp-subtitle text-xl text-foreground mb-2">車両が見つかりませんでした</h3>
            <p className="jp-body text-muted-foreground mb-6">
              検索条件を変更してもう一度お試しください。
            </p>
            <Button 
              onClick={() => setLocation('/')}
              variant="outline"
              className="jp-body"
            >
              すべての車両を見る
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
