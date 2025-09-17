import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { User, TrendingUp, MessageSquare, Calendar } from "lucide-react";

interface BidderProfileModalProps {
  bidderId: string;
  bidderName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BidderProfile {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    createdAt: string;
  };
  totalBids: number;
  totalComments: number;
  recentBids: Array<{
    id: string;
    amount: string;
    createdAt: string;
    listing: {
      id: string;
      title: string;
      slug: string;
      status: string;
    };
  }>;
  recentComments: Array<{
    id: string;
    body: string;
    createdAt: string;
    listing: {
      id: string;
      title: string;
      slug: string;
    };
  }>;
}

export default function BidderProfileModal({ 
  bidderId, 
  bidderName, 
  open, 
  onOpenChange 
}: BidderProfileModalProps) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/users", bidderId, "profile"],
    queryFn: async () => {
      const response = await fetch(`/api/users/${bidderId}/profile`);
      if (!response.ok) throw new Error("Failed to fetch bidder profile");
      return response.json() as Promise<BidderProfile>;
    },
    enabled: open && !!bidderId,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="modal-bidder-profile">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span data-testid="text-bidder-name">{bidderName}</span>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900" data-testid="text-total-bids">
                    {profile.totalBids}
                  </div>
                  <div className="text-sm text-gray-500">総入札数</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <MessageSquare className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900" data-testid="text-total-comments">
                    {profile.totalComments}
                  </div>
                  <div className="text-sm text-gray-500">総コメント数</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Calendar className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900" data-testid="text-member-since">
                    {new Date(profile.user.createdAt).getFullYear()}
                  </div>
                  <div className="text-sm text-gray-500">参加年</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Bids */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">最近の入札履歴</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {profile.recentBids.length > 0 ? (
                      profile.recentBids.map((bid) => (
                        <div 
                          key={bid.id} 
                          className="border-l-4 border-blue-500 pl-4 pb-4"
                          data-testid={`bid-history-${bid.id}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <a
                                href={`/listing/${bid.listing.slug}`}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 line-clamp-2"
                                data-testid={`link-bid-listing-${bid.id}`}
                              >
                                {bid.listing.title}
                              </a>
                              <p className="text-xs text-gray-500 mt-1" data-testid={`text-bid-date-${bid.id}`}>
                                {new Date(bid.createdAt).toLocaleString('ja-JP')}
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-semibold text-gray-900" data-testid={`text-bid-amount-${bid.id}`}>
                                {formatCurrency(parseFloat(bid.amount))}
                              </p>
                              <Badge
                                variant={bid.listing.status === "ended" ? "secondary" : "default"}
                                className="text-xs"
                                data-testid={`badge-bid-status-${bid.id}`}
                              >
                                {bid.listing.status === "ended" ? "終了" : "進行中"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8" data-testid="text-no-bids">
                        入札履歴がありません
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Comments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">最近のコメント履歴</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {profile.recentComments.length > 0 ? (
                      profile.recentComments.map((comment) => (
                        <div 
                          key={comment.id} 
                          className="border-l-4 border-green-500 pl-4 pb-4"
                          data-testid={`comment-history-${comment.id}`}
                        >
                          <a
                            href={`/listing/${comment.listing.slug}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 line-clamp-1"
                            data-testid={`link-comment-listing-${comment.id}`}
                          >
                            {comment.listing.title}
                          </a>
                          <p className="text-sm text-gray-700 mt-2 line-clamp-3" data-testid={`text-comment-body-${comment.id}`}>
                            {comment.body}
                          </p>
                          <p className="text-xs text-gray-500 mt-1" data-testid={`text-comment-date-${comment.id}`}>
                            {new Date(comment.createdAt).toLocaleString('ja-JP')}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8" data-testid="text-no-comments">
                        コメント履歴がありません
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">プロファイルを読み込めませんでした</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}