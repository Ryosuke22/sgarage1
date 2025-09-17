import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import AuctionCard from "@/components/AuctionCard";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { ListingWithDetails } from "@shared/schema";

export default function Home() {
  const [sortBy, setSortBy] = useState<"endingSoon" | "newest">("endingSoon");
  const [category, setCategory] = useState<"" | "car" | "motorcycle">("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);

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
      <div className="space-y-6 scrollbar-hide">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {showResults ? "落札結果" : "進行中のオークション"}
            </h1>
            <p className="text-gray-300 mt-1">
              {showResults 
                ? `${listings?.length || 0}件のオークションが終了しました`
                : `${listings?.length || 0}件のオークションが進行中です`
              }
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
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
    </Layout>
  );
}
