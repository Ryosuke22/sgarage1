import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Package, Clock } from "lucide-react";
import { Link } from "wouter";

interface Seller {
  id: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: string;
}

interface Listing {
  id: string;
  title: string;
  category: string;
  make: string;
  model: string;
  year: number;
  startingPrice: string;
  status: string;
  createdAt: string;
  photos?: { url: string }[];
}

export default function SellerProfile() {
  const [, params] = useRoute("/seller/:id");
  const sellerId = params?.id;

  const { data: seller, isLoading: sellerLoading } = useQuery<Seller>({
    queryKey: [`/api/users/${sellerId}`],
    enabled: !!sellerId,
  });

  const { data: listings, isLoading: listingsLoading } = useQuery<Listing[]>({
    queryKey: [`/api/users/${sellerId}/listings`],
    enabled: !!sellerId,
  });

  if (sellerLoading || listingsLoading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!seller) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto p-6 text-center">
          <p className="text-lg dark:text-white">出品者が見つかりませんでした</p>
        </div>
      </Layout>
    );
  }

  const displayName = seller.username || `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || '匿名ユーザー';
  const memberSince = new Date(seller.createdAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="max-w-6xl mx-auto p-6">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold dark:text-white mb-2">{displayName}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {memberSince}から出品
                  </span>
                  <Badge variant="outline" className="dark:border-gray-600">
                    <Package className="w-3 h-3 mr-1" />
                    {listings?.length || 0}件の出品
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seller Info */}
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">出品者について</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                こちらは{displayName}の出品者ページです。以下の出品履歴をご覧いただけます。
              </p>
            </CardContent>
          </Card>

          {/* Listings History */}
          <div>
            <h2 className="text-2xl font-bold mb-4 dark:text-white">出品履歴</h2>
            {!listings || listings.length === 0 ? (
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-8 text-center text-gray-500 dark:text-gray-400">
                  まだ出品がありません
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => (
                  <Link key={listing.id} href={`/listing/${listing.id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700">
                      {listing.photos && listing.photos.length > 0 && (
                        <img
                          src={listing.photos[0].url}
                          alt={listing.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                      )}
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2 dark:text-white line-clamp-2">{listing.title}</h3>
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <p>{listing.make} {listing.model}</p>
                          <p className="font-medium text-green-600 dark:text-green-400">
                            開始価格: ¥{parseInt(listing.startingPrice).toLocaleString()}
                          </p>
                        </div>
                        <div className="mt-3">
                          <Badge 
                            variant={listing.status === 'active' ? 'default' : 'outline'}
                            className="dark:border-gray-600"
                          >
                            {listing.status === 'active' ? 'オークション中' : 
                             listing.status === 'pending' ? '審査中' : 
                             listing.status === 'sold' ? '落札済み' : '終了'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
