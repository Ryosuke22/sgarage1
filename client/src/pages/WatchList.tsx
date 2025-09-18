import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import AuctionCard from "@/components/AuctionCard";
import { Heart } from "lucide-react";

export default function WatchList() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "ログインが必要です",
        description: "ウォッチリストを見るにはログインしてください",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [user, isLoading, toast]);

  const { data: watchList, isLoading: watchListLoading } = useQuery({
    queryKey: ["/api/watch"],
    queryFn: async () => {
      const response = await fetch("/api/watch");
      if (!response.ok) throw new Error("Failed to fetch watch list");
      return response.json();
    },
    enabled: !!user,
  });

  if (isLoading || !user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">読み込み中...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Heart className="h-8 w-8 text-red-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ウォッチリスト</h1>
            <p className="text-gray-600 mt-1">
              お気に入りのオークションを追跡
            </p>
          </div>
        </div>

        {watchListLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                <div className="space-y-2">
                  <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                  <div className="bg-gray-200 h-3 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : watchList && watchList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {watchList.map((watchItem: any) => (
              <AuctionCard 
                key={watchItem.id} 
                listing={watchItem.listing}
                data-testid={`watch-card-${watchItem.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <div className="text-gray-500 text-lg mb-2">
              ウォッチリストは空です
            </div>
            <p className="text-gray-400 mb-6">
              気になるオークションをウォッチリストに追加して、簡単に追跡できます
            </p>
            <a 
              href="/" 
              className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
              data-testid="link-browse-auctions"
            >
              オークションを見る
            </a>
          </div>
        )}
      </div>
    </Layout>
  );
}
