import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Car, Clock, DollarSign, TrendingUp, Eye, Check, X, Square, ArrowLeft, Calendar, Users, Database } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListingWithDetails } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/formatters";
import { isUnauthorizedError } from "@/lib/authUtils";

// Schedule Dialog Component
function ScheduleDialog({ 
  listing, 
  open, 
  onOpenChange, 
  onSuccess 
}: { 
  listing: ListingWithDetails | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onSuccess: () => void; 
}) {
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (listing && open) {
      // Set default start time to 1 hour from now
      const defaultStart = new Date();
      defaultStart.setHours(defaultStart.getHours() + 1);
      defaultStart.setMinutes(0, 0, 0); // Round to the hour
      
      // Set default end time to 7 days from start
      const defaultEnd = new Date(defaultStart);
      defaultEnd.setDate(defaultEnd.getDate() + 7);
      
      setStartAt(defaultStart.toISOString().slice(0, 16));
      setEndAt(defaultEnd.toISOString().slice(0, 16));
    }
  }, [listing, open]);

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      if (!listing) throw new Error("No listing selected");
      
      const response = await apiRequest("PUT", `/api/admin/listings/${listing.id}/schedule`, {
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
      });
      return response;
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "認証エラー",
          description: "ログインしてください",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "エラー",
        description: "スケジュール設定に失敗しました",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startAt || !endAt) {
      toast({
        title: "入力エラー",
        description: "開始・終了時間を入力してください",
        variant: "destructive",
      });
      return;
    }

    if (new Date(startAt) >= new Date(endAt)) {
      toast({
        title: "入力エラー",
        description: "終了時間は開始時間より後にしてください",
        variant: "destructive",
      });
      return;
    }

    scheduleMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>オークションスケジュール設定</DialogTitle>
        </DialogHeader>
        
        {listing && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-900">{listing.title}</p>
              <p className="text-xs text-gray-500">{listing.make} {listing.model} ({listing.year})</p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="start-time">開始日時</Label>
                <Input
                  id="start-time"
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="end-time">終了日時</Label>
                <Input
                  id="end-time"
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                キャンセル
              </Button>
              <Button type="submit" disabled={scheduleMutation.isPending}>
                {scheduleMutation.isPending ? "設定中..." : "スケジュール設定"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedListing, setSelectedListing] = useState<ListingWithDetails | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      toast({
        title: "アクセス拒否",
        description: "管理者権限が必要です",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    }
  }, [user, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/dashboard"],
    queryFn: async () => {
      const response = await fetch("/api/admin/dashboard");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
    enabled: !!user && user.role === "admin",
  });

  const { data: allListings, isLoading: listingsLoading } = useQuery({
    queryKey: ["/api/admin/listings"],
    queryFn: async () => {
      const response = await fetch("/api/admin/listings");
      if (!response.ok) throw new Error("Failed to fetch listings");
      return response.json() as Promise<ListingWithDetails[]>;
    },
    enabled: !!user && user.role === "admin",
  });

  const listingActionMutation = useMutation({
    mutationFn: async ({ listingId, action }: { listingId: string; action: string }) => {
      return await apiRequest("POST", `/api/admin/listing/${listingId}/${action}`, {});
    },
    onSuccess: (_, { action }) => {
      const actionNames: Record<string, string> = {
        approve: "承認",
        publish: "公開",
        end: "終了",
        reject: "却下",
      };
      
      toast({
        title: `${actionNames[action]}しました`,
        variant: "default",
      });
      
      setShowDetailDialog(false);
      setSelectedListing(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "認証エラー",
          description: "ログインし直してください",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "操作エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const seedTestDataMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/seed-test-data", {});
    },
    onSuccess: (data) => {
      toast({
        title: "テストデータ作成完了",
        description: `${data.listings}件の出品データを作成しました`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "認証エラー",
          description: "ログインし直してください",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "エラー",
        description: "テストデータの作成に失敗しました",
        variant: "destructive",
      });
    },
  });

  if (isLoading || (!user || user.role !== "admin")) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">読み込み中...</div>
        </div>
      </Layout>
    );
  }

  const pendingListings = allListings?.filter(l => l.status === "submitted") || [];
  const approvedListings = allListings?.filter(l => l.status === "approved") || [];
  const activeListings = allListings?.filter(l => l.status === "published") || [];
  const endedListings = allListings?.filter(l => l.status === "ended") || [];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: "outline" as const, text: "下書き", className: "" },
      submitted: { variant: "secondary" as const, text: "審査待ち", className: "bg-yellow-100 text-yellow-800" },
      approved: { variant: "secondary" as const, text: "承認済み", className: "bg-blue-100 text-blue-800" },
      published: { variant: "default" as const, text: "進行中", className: "bg-green-100 text-green-800" },
      ended: { variant: "outline" as const, text: "終了", className: "bg-gray-100 text-gray-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.text}
      </Badge>
    );
  };

  const ListingTable = ({ listings, showActions = true }: { listings: ListingWithDetails[]; showActions?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>車両</TableHead>
          <TableHead>ステータス</TableHead>
          <TableHead>現在価格</TableHead>
          <TableHead>終了予定</TableHead>
          {showActions && <TableHead>操作</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {listings.map((listing) => (
          <TableRow 
            key={listing.id}
            className="cursor-pointer hover:bg-gray-50"
            onClick={() => {
              setSelectedListing(listing);
              setShowDetailDialog(true);
            }}
          >
            <TableCell>
              <div className="flex items-center space-x-3">
                {listing.photos[0] ? (
                  <img
                    src={listing.photos[0].url}
                    alt={listing.title}
                    className="w-12 h-8 rounded object-cover"
                  />
                ) : (
                  <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
                    <Car className="h-4 w-4 text-gray-400" />
                  </div>
                )}
                <div>
                  <div className="font-medium text-sm" data-testid={`text-title-${listing.id}`}>
                    {listing.title}
                  </div>
                  <div className="text-xs text-gray-500" data-testid={`text-seller-${listing.id}`}>
                    {listing.seller.email}
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell data-testid={`status-${listing.id}`}>
              {getStatusBadge(listing.status)}
            </TableCell>
            <TableCell data-testid={`price-${listing.id}`}>
              {formatCurrency(parseFloat(listing.currentPrice))}
            </TableCell>
            <TableCell data-testid={`end-time-${listing.id}`}>
              {new Date(listing.endAt).toLocaleString('ja-JP')}
            </TableCell>
            {showActions && (
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedListing(listing);
                      setShowDetailDialog(true);
                    }}
                    data-testid={`button-detail-${listing.id}`}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    詳細
                  </Button>
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
          <div className="ml-6 md:ml-0">
            <h1 className="text-2xl md:text-3xl font-bold text-white">管理画面</h1>
            <p className="text-gray-300 mt-1 text-sm md:text-base">
              オークションサイトの管理・監視
            </p>
          </div>
          <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-3">
            <Button
              onClick={() => seedTestDataMutation.mutate()}
              disabled={seedTestDataMutation.isPending}
              className="btn-premium text-white"
              data-testid="button-seed-test-data"
            >
              <Database className="h-4 w-4 mr-2" />
              {seedTestDataMutation.isPending ? "作成中..." : "テストデータ作成"}
            </Button>
            <Button
              onClick={() => window.location.href = "/admin/users"}
              className="btn-premium text-white"
              data-testid="button-user-management"
            >
              <Users className="h-4 w-4 mr-2" />
              ユーザー管理
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setActiveTab("active")}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Car className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">進行中オークション</p>
                  <p className="text-2xl font-semibold text-gray-900" data-testid="stat-active">
                    {statsLoading ? "..." : stats?.activeAuctions || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setActiveTab("pending")}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">審査待ち</p>
                  <p className="text-2xl font-semibold text-gray-900" data-testid="stat-pending">
                    {statsLoading ? "..." : stats?.pendingApproval || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setActiveTab("ended")}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">今月の売上</p>
                  <p className="text-2xl font-semibold text-gray-900" data-testid="stat-sales">
                    {statsLoading ? "..." : stats?.monthlySales || "¥0M"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setActiveTab("all")}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">成約率</p>
                  <p className="text-2xl font-semibold text-gray-900" data-testid="stat-conversion">
                    {statsLoading ? "..." : stats?.conversionRate || "0%"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Listings Management */}
        <Card>
          <CardHeader>
            <CardTitle>出品管理</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="pending" data-testid="tab-pending">
                  審査待ち ({pendingListings.length})
                </TabsTrigger>
                <TabsTrigger value="approved" data-testid="tab-approved">
                  承認済み ({approvedListings.length})
                </TabsTrigger>
                <TabsTrigger value="active" data-testid="tab-active">
                  進行中 ({activeListings.length})
                </TabsTrigger>
                <TabsTrigger value="ended" data-testid="tab-ended">
                  終了 ({endedListings.length})
                </TabsTrigger>
                <TabsTrigger value="all" data-testid="tab-all">
                  すべて ({allListings?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-6">
                {listingsLoading ? (
                  <div className="text-center py-8">読み込み中...</div>
                ) : pendingListings.length > 0 ? (
                  <ListingTable listings={pendingListings} />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    審査待ちの出品はありません
                  </div>
                )}
              </TabsContent>

              <TabsContent value="approved" className="mt-6">
                {listingsLoading ? (
                  <div className="text-center py-8">読み込み中...</div>
                ) : approvedListings.length > 0 ? (
                  <ListingTable listings={approvedListings} />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    承認済みの出品はありません
                  </div>
                )}
              </TabsContent>

              <TabsContent value="active" className="mt-6">
                {listingsLoading ? (
                  <div className="text-center py-8">読み込み中...</div>
                ) : activeListings.length > 0 ? (
                  <ListingTable listings={activeListings} />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    進行中のオークションはありません
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ended" className="mt-6">
                {listingsLoading ? (
                  <div className="text-center py-8">読み込み中...</div>
                ) : endedListings.length > 0 ? (
                  <ListingTable listings={endedListings} showActions={false} />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    終了したオークションはありません
                  </div>
                )}
              </TabsContent>

              <TabsContent value="all" className="mt-6">
                {listingsLoading ? (
                  <div className="text-center py-8">読み込み中...</div>
                ) : allListings && allListings.length > 0 ? (
                  <ListingTable listings={allListings} />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    出品がありません
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetailDialog(false)}
                  className="mr-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                出品詳細 - {selectedListing?.title}
              </DialogTitle>
              <DialogDescription>
                審査のため出品内容を確認し、承認または却下を決定してください
              </DialogDescription>
            </DialogHeader>
            
            {selectedListing && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">基本情報</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">タイトル:</span> {selectedListing.title}</div>
                      <div><span className="font-medium">メーカー:</span> {selectedListing.make}</div>
                      <div><span className="font-medium">モデル:</span> {selectedListing.model}</div>
                      <div><span className="font-medium">年式:</span> {selectedListing.year}</div>
                      <div><span className="font-medium">走行距離:</span> {selectedListing.mileage?.toLocaleString()} km</div>
                      <div><span className="font-medium">ステータス:</span> {getStatusBadge(selectedListing.status)}</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">価格・オークション情報</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">開始価格:</span> {formatCurrency(parseFloat(selectedListing.startingPrice))}</div>
                      <div><span className="font-medium">現在価格:</span> {formatCurrency(parseFloat(selectedListing.currentPrice))}</div>
                      {selectedListing.reservePrice && (
                        <div><span className="font-medium">リザーブ価格:</span> {formatCurrency(parseFloat(selectedListing.reservePrice))}</div>
                      )}
                      <div><span className="font-medium">終了予定:</span> {new Date(selectedListing.endAt).toLocaleString('ja-JP')}</div>
                      <div><span className="font-medium">出品者:</span> {selectedListing.seller.email}</div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">説明文</h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap">
                    {selectedListing.description || "説明文がありません"}
                  </div>
                </div>

                {/* Photos */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">写真 ({selectedListing.photos.length}枚)</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedListing.photos.map((photo, index) => (
                      <div key={photo.id} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={photo.url}
                          alt={`${selectedListing.title} - 写真 ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {selectedListing.photos.length === 0 && (
                      <div className="col-span-3 text-center text-gray-500 py-8">
                        写真がアップロードされていません
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {selectedListing.status === "submitted" && (
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => listingActionMutation.mutate({ 
                        listingId: selectedListing.id, 
                        action: "reject" 
                      })}
                      disabled={listingActionMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4 mr-2" />
                      却下
                    </Button>
                    <Button
                      onClick={() => listingActionMutation.mutate({ 
                        listingId: selectedListing.id, 
                        action: "approve" 
                      })}
                      disabled={listingActionMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      承認
                    </Button>
                  </div>
                )}
                
                {selectedListing.status === "approved" && (
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowScheduleDialog(true);
                      }}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      スケジュール設定
                    </Button>
                    <Button
                      onClick={() => listingActionMutation.mutate({ 
                        listingId: selectedListing.id, 
                        action: "publish" 
                      })}
                      disabled={listingActionMutation.isPending || !selectedListing.startAt || !selectedListing.endAt}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      公開
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Schedule Dialog */}
        <ScheduleDialog
          listing={selectedListing}
          open={showScheduleDialog}
          onOpenChange={setShowScheduleDialog}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
            setShowScheduleDialog(false);
            toast({
              title: "スケジュール設定完了",
              description: "オークションのスケジュールが設定されました",
            });
          }}
        />
      </div>
    </Layout>
  );
}
