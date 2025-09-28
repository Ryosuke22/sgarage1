import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import AuctionCard from "@/components/AuctionCard";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { ListingWithDetails } from "@shared/schema";

export default function Home() {
  const [location] = useLocation();
  const [sortBy, setSortBy] = useState<"endingSoon" | "newest">("endingSoon");
  const [category, setCategory] = useState<"" | "car" | "motorcycle">("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);

  // URLパラメータから検索語を読み取る
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [location]);

  const { data: listings, isLoading } = useQuery({
    queryKey: ["/api/listings", { status: showResults ? "ended" : "published", sortBy, category, searchTerm }],
    queryFn: async () => {
      const params = new URLSearchParams({ 
        status: showResults ? "ended" : "published",
        sort: sortBy,
        ...(category && { category }),
        ...(searchTerm && { search: searchTerm }),
      });
      const response = await fetch(`/api/listings?${params}`);
      if (!response.ok) throw new Error("Failed to fetch listings");
      return response.json() as Promise<ListingWithDetails[]>;
    },
    staleTime: 0, // Force fresh data every time
  });

  return (
    <Layout>
      <main className="min-h-screen">
        <div className="space-y-6 scrollbar-hide px-8 sm:px-12 lg:px-16 max-w-7xl mx-auto">
        {/* ヘッダー部分 */}
        <div className="py-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 md:items-center">
            {/* 左側: タイトル */}
            <div className="sm:col-span-6">
              <h1 
                className="text-2xl lg:text-3xl font-bold text-white whitespace-nowrap"
                style={{
                  textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, -1px 0 0 #000, 1px 0 0 #000, 0 -1px 0 #000, 0 1px 0 #000, 0 0 8px rgba(0, 0, 0, 0.9)'
                }}
              >
                {showResults ? "落札結果" : "進行中のオークション"}
              </h1>
              <p className="text-gray-300 mt-1">
                {showResults 
                  ? `${listings?.length || 0}件のオークションが終了しました`
                  : `${listings?.length || 0}件のオークションが進行中です`
                }
              </p>
            </div>
            
            {/* 右側: 検索とボタン */}
            <div className="sm:col-span-6 sm:justify-self-end flex flex-col space-y-3 lg:space-y-0 lg:flex-row lg:items-center lg:space-x-4">
              {/* 検索ボックス */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="メーカー・モデル・車種で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  data-testid="input-search"
                />
              </div>
              
              {/* ボタン群 */}
              <div className="flex space-x-2">
                <Button
                  variant={!showResults ? "default" : "outline"}
                  onClick={() => setShowResults(false)}
                  size="sm"
                  data-testid="button-active-auctions"
                >
                  進行中
                </Button>
                <Button
                  variant={showResults ? "default" : "outline"}
                  onClick={() => setShowResults(true)}
                  size="sm"
                  data-testid="button-auction-results"
                >
                  落札結果
                </Button>
                {!showResults && (
                  <>
                    <Button
                      variant={sortBy === "endingSoon" ? "secondary" : "outline"}
                      onClick={() => setSortBy("endingSoon")}
                      size="sm"
                      data-testid="button-sort-ending"
                    >
                      終了間近
                    </Button>
                    <Button
                      variant={sortBy === "newest" ? "secondary" : "outline"}
                      onClick={() => setSortBy("newest")}
                      size="sm"
                      data-testid="button-sort-newest"
                    >
                      新着順
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger 
              value="all" 
              onClick={() => setCategory("")}
              data-testid="tab-all"
            >
              すべて
            </TabsTrigger>
            <TabsTrigger 
              value="car" 
              onClick={() => setCategory("car")}
              data-testid="tab-cars"
            >
              クラシックカー
            </TabsTrigger>
            <TabsTrigger 
              value="motorcycle" 
              onClick={() => setCategory("motorcycle")}
              data-testid="tab-motorcycles"
            >
              オートバイ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-700 h-48 rounded-lg mb-4"></div>
                    <div className="space-y-2">
                      <div className="bg-gray-700 h-4 rounded w-3/4"></div>
                      <div className="bg-gray-700 h-3 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : listings && listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 scrollbar-hide overflow-auto">
                {listings.map((listing) => (
                  <AuctionCard 
                    key={listing.id} 
                    listing={listing} 
                    data-testid={`card-listing-${listing.id}`}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-300 text-lg">
                  {showResults 
                    ? "落札結果がありません" 
                    : "現在進行中のオークションはありません"
                  }
                </div>
                <p className="text-gray-400 mt-2">
                  {showResults 
                    ? "終了したオークションがまだありません"
                    : "新しいオークションが開始されるまでお待ちください"
                  }
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="car" className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-700 h-48 rounded-lg mb-4"></div>
                    <div className="space-y-2">
                      <div className="bg-gray-700 h-4 rounded w-3/4"></div>
                      <div className="bg-gray-700 h-3 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : listings && listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 scrollbar-hide overflow-auto">
                {listings.map((listing) => (
                  <AuctionCard 
                    key={listing.id} 
                    listing={listing} 
                    data-testid={`card-listing-${listing.id}`}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-300 text-lg">
                  {showResults 
                    ? "落札結果（クラシックカー）がありません" 
                    : "現在進行中のクラシックカーオークションはありません"
                  }
                </div>
                <p className="text-gray-400 mt-2">
                  {showResults 
                    ? "終了したクラシックカーオークションがまだありません"
                    : "新しいクラシックカーオークションが開始されるまでお待ちください"
                  }
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="motorcycle" className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-700 h-48 rounded-lg mb-4"></div>
                    <div className="space-y-2">
                      <div className="bg-gray-700 h-4 rounded w-3/4"></div>
                      <div className="bg-gray-700 h-3 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : listings && listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 scrollbar-hide overflow-auto">
                {listings.map((listing) => (
                  <AuctionCard 
                    key={listing.id} 
                    listing={listing} 
                    data-testid={`card-listing-${listing.id}`}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-300 text-lg">
                  {showResults 
                    ? "落札結果（オートバイ）がありません" 
                    : "現在進行中のオートバイオークションはありません"
                  }
                </div>
                <p className="text-gray-400 mt-2">
                  {showResults 
                    ? "終了したオートバイオークションがまだありません"
                    : "新しいオートバイオークションが開始されるまでお待ちください"
                  }
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-900 border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-xl font-bold text-white mb-4 font-serif">Samurai Garage</h3>
              <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                日本のクラシックカー・バイクに特化したオークションプラットフォーム。<br className="hidden sm:block" />
                1960年から2000年までの名車を、<br className="hidden sm:block" />
                authentic Japaneseな体験でお届けします。
              </p>
              <div className="flex space-x-4">
                <span className="text-gray-400 text-xs">© 2024 Samurai Garage</span>
                <span className="bg-orange-500/20 text-orange-300 text-xs px-2 py-1 rounded-full border border-orange-500/30 font-semibold">
                  β版
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </Layout>
  );
}
