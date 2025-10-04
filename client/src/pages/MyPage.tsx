import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Package, Gavel, Eye, ArrowLeft } from "lucide-react";
import type { Listing } from "@shared/schema";

function ListingCard({ listing }: { listing: Listing }) {
  const [, navigate] = useLocation();
  
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; variant: any }> = {
      draft: { label: "下書き", variant: "secondary" },
      submitted: { label: "審査待ち", variant: "default" },
      published: { label: "公開中", variant: "default" },
      sold: { label: "落札済み", variant: "default" },
      unsold: { label: "不落札", variant: "destructive" },
      cancelled: { label: "キャンセル", variant: "destructive" },
    };
    
    const badge = badges[status] || { label: status, variant: "outline" };
    return <Badge variant={badge.variant as any}>{badge.label}</Badge>;
  };

  const handleClick = () => {
    if (listing.status === 'draft') {
      navigate(`/preview/${listing.id}`);
    } else {
      navigate(`/listing/${listing.slug || listing.id}`);
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700"
      onClick={handleClick}
      data-testid={`card-listing-${listing.id}`}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {(listing as any).photos?.[0] && (
            <img
              src={(listing as any).photos[0].url}
              alt={listing.title}
              className="w-24 h-24 object-cover rounded-lg"
            />
          )}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-lg dark:text-white">{listing.title}</h3>
              {getStatusBadge(listing.status)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {listing.year} {listing.make} {listing.model}
            </p>
            <p className="text-lg font-bold mt-2 dark:text-white">
              ¥{parseInt(listing.startingPrice).toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BidCard({ bid }: { bid: any }) {
  const [, navigate] = useLocation();

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700"
      onClick={() => navigate(`/listing/${bid.listing.slug || bid.listing.id}`)}
      data-testid={`card-bid-${bid.bid.id}`}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold dark:text-white">{bid.listing.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {new Date(bid.bid.createdAt).toLocaleString('ja-JP')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold dark:text-white">
              ¥{parseInt(bid.bid.amount).toLocaleString()}
            </p>
            <Badge variant="outline" className="mt-1">
              {bid.listing.status === 'published' ? '進行中' : '終了'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: myListings, isLoading: loadingListings } = useQuery<Listing[]>({
    queryKey: [`/api/users/${user?.id}/listings`],
    enabled: !!user?.id,
  });

  const { data: profile, isLoading: loadingProfile } = useQuery<any>({
    queryKey: [`/api/users/${user?.id}/profile`],
    enabled: !!user?.id,
  });

  const { data: watchList, isLoading: loadingWatch } = useQuery<any[]>({
    queryKey: ['/api/watch'],
    enabled: !!user,
  });

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-16">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="text-center p-8">
              <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold dark:text-white mb-2">ログインが必要です</h2>
              <p className="text-gray-400 mb-4">マイページを表示するにはログインしてください</p>
              <Button onClick={() => navigate("/login")} data-testid="button-login">
                ログイン
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="dark:text-white dark:hover:bg-white/10"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
          <div>
            <h1 className="text-3xl font-bold dark:text-white">マイページ</h1>
            <p className="text-gray-400">@{user.username}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                出品数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold dark:text-white">
                  {myListings?.length || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                入札数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Gavel className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold dark:text-white">
                  {profile?.totalBids || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                ウォッチ数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-purple-500" />
                <span className="text-2xl font-bold dark:text-white">
                  {watchList?.length || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="listings" className="space-y-4">
          <TabsList className="dark:bg-gray-800">
            <TabsTrigger value="listings" data-testid="tab-listings">
              出品リスト
            </TabsTrigger>
            <TabsTrigger value="bids" data-testid="tab-bids">
              入札履歴
            </TabsTrigger>
            <TabsTrigger value="watch" data-testid="tab-watch">
              ウォッチリスト
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-4">
            {loadingListings ? (
              <div className="text-center py-8 text-gray-400">読み込み中...</div>
            ) : myListings && myListings.length > 0 ? (
              myListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))
            ) : (
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">まだ出品がありません</p>
                  <Button onClick={() => navigate("/create")} data-testid="button-create-listing">
                    出品を作成
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="bids" className="space-y-4">
            {loadingProfile ? (
              <div className="text-center py-8 text-gray-400">読み込み中...</div>
            ) : profile?.recentBids && profile.recentBids.length > 0 ? (
              profile.recentBids.map((bid: any) => (
                <BidCard key={bid.bid.id} bid={bid} />
              ))
            ) : (
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="text-center py-8">
                  <Gavel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">まだ入札していません</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="watch" className="space-y-4">
            {loadingWatch ? (
              <div className="text-center py-8 text-gray-400">読み込み中...</div>
            ) : watchList && watchList.length > 0 ? (
              watchList.map((watch) => (
                <ListingCard key={watch.listing.id} listing={watch.listing} />
              ))
            ) : (
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="text-center py-8">
                  <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">ウォッチリストが空です</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
