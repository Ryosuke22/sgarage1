import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Car, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Settings,
  BarChart3,
  Eye,
  FileText,
  Calendar
} from 'lucide-react';
import { AdminProtectedRoute } from '@/lib/admin-protected-route';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// Type definitions for admin data
interface AdminStats {
  totalUsers: number;
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  totalBids: number;
}

interface AdminListing {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  locationText: string;
  featuredImageUrl?: string;
  status: string;
  reservePrice?: string;
  seller?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
}

interface AdminUser {
  id: string;
  username: string;
  email?: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  createdAt: string;
}

interface AdminListingWithSchedule extends AdminListing {
  endAt: string;
  startAt?: string;
}

// Admin Stats Component
function AdminStats() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: '総ユーザー数',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: '総出品数',
      value: stats?.totalListings || 0,
      icon: Car,
      color: 'text-green-600',
    },
    {
      title: 'アクティブオークション',
      value: stats?.activeListings || 0,
      icon: TrendingUp,
      color: 'text-orange-600',
    },
    {
      title: '承認待ち出品',
      value: stats?.pendingListings || 0,
      icon: Clock,
      color: 'text-yellow-600',
    },
    {
      title: '総入札数',
      value: stats?.totalBids || 0,
      icon: BarChart3,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Schedule Dialog Component for setting auction start/end times
function ScheduleDialog({ 
  listing, 
  open, 
  onOpenChange, 
  onSuccess 
}: { 
  listing: AdminListingWithSchedule | null; 
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
      toast({
        title: "スケジュール設定完了",
        description: "オークションの開始・終了時間を設定しました",
        variant: "default",
      });
      onSuccess();
    },
    onError: (error) => {
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
          <DialogDescription>
            オークションの開始・終了時間を設定します
          </DialogDescription>
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
                  data-testid="input-start-time"
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
                  data-testid="input-end-time"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                キャンセル
              </Button>
              <Button 
                type="submit" 
                disabled={scheduleMutation.isPending}
                data-testid="button-schedule-submit"
              >
                {scheduleMutation.isPending ? "設定中..." : "スケジュール設定"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Document types mapping
const DOCUMENT_TYPE_LABELS: { [key: string]: string } = {
  registration_certificate: '車検証',
  transfer_certificate: '名義変更証',
  registration_seal: '印鑑証明書',
  insurance_certificate: '保険証',
  maintenance_record: '整備記録簿',
  other: 'その他'
};

// Documents Viewer Component
function DocumentsViewer({ listingId, listingTitle }: { listingId: string, listingTitle: string }) {
  const { data: documents, isLoading } = useQuery({
    queryKey: ['/api/listings', listingId, 'documents'],
    queryFn: async () => {
      const response = await fetch(`/api/listings/${listingId}/documents`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>書類がアップロードされていません</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">アップロード済み書類 ({documents.length}件)</h4>
      {documents.map((doc: any) => (
        <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-blue-600" />
            <div>
              <p className="font-medium text-sm">{DOCUMENT_TYPE_LABELS[doc.type] || doc.type}</p>
              <p className="text-xs text-muted-foreground">{doc.fileName}</p>
            </div>
          </div>
          <a 
            href={doc.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            表示
          </a>
        </div>
      ))}
    </div>
  );
}

// Vehicle Approval Component
function VehicleApproval() {
  const { data: pendingListings, isLoading } = useQuery<AdminListing[]>({
    queryKey: ['/api/admin/listings', 'submitted'],
    queryFn: async () => {
      const response = await fetch('/api/admin/listings?status=submitted');
      if (!response.ok) throw new Error('Failed to fetch pending listings');
      return response.json();
    },
  });

  const handleApprove = async (listingId: string) => {
    try {
      const response = await fetch(`/api/admin/listings/${listingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'approved',
          adminNotes: '管理者により承認されました'
        }),
      });
      if (!response.ok) throw new Error('Failed to approve listing');
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error('Error approving listing:', error);
    }
  };

  const handleReject = async (listingId: string) => {
    try {
      const response = await fetch(`/api/admin/listings/${listingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'draft',
          adminNotes: '管理者により却下されました。詳細を確認してください。'
        }),
      });
      if (!response.ok) throw new Error('Failed to reject listing');
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error('Error rejecting listing:', error);
    }
  };

  if (isLoading) {
    return <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="flex gap-2">
              <div className="h-8 bg-gray-200 rounded w-20"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">承認待ちの車両</h3>
        <Badge variant="secondary">{pendingListings?.length || 0}件</Badge>
      </div>
      
      {!pendingListings || pendingListings.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">承認待ちの車両はありません</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingListings.map((listing: any) => (
            <Card key={listing.id} data-testid={`listing-approval-${listing.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      {listing.featuredImageUrl && (
                        <img 
                          src={listing.featuredImageUrl} 
                          alt={listing.title}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      )}
                      <div>
                        <h4 className="font-medium" data-testid={`text-title-${listing.id}`}>
                          {listing.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {listing.make} {listing.model} ({listing.year})
                        </p>
                        <p className="text-sm text-muted-foreground">
                          出品者: {listing.seller?.firstName} {listing.seller?.lastName}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {listing.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span>走行距離: {listing.mileage?.toLocaleString()}km</span>
                      <span>希望価格: ¥{parseFloat(listing.reservePrice || '0').toLocaleString()}</span>
                      <span>場所: {listing.locationText}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          data-testid={`button-documents-${listing.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          書類確認
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>{listing.title} - 提出書類</DialogTitle>
                        </DialogHeader>
                        <DocumentsViewer listingId={listing.id} listingTitle={listing.title} />
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApprove(listing.id)}
                      className="text-green-600 border-green-600 hover:bg-green-50"
                      data-testid={`button-approve-${listing.id}`}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      承認
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(listing.id)}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      data-testid={`button-reject-${listing.id}`}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      却下
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// User Management Component
function UserManagement() {
  const { data: users, isLoading } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/users'],
  });

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!response.ok) throw new Error('Failed to update user role');
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  if (isLoading) {
    return <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-20"></div>
          </CardContent>
        </Card>
      ))}
    </div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">ユーザー管理</h3>
        <Badge variant="secondary">{users?.length || 0}名</Badge>
      </div>
      
      <div className="space-y-2">
        {users?.map((user: any) => (
          <Card key={user.id} data-testid={`user-card-${user.id}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium" data-testid={`text-username-${user.id}`}>
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      (@{user.username})
                    </span>
                    <Badge 
                      variant={user.role === 'admin' ? 'destructive' : 'secondary'}
                      data-testid={`badge-role-${user.id}`}
                    >
                      {user.role === 'admin' ? '管理者' : 'ユーザー'}
                    </Badge>
                  </div>
                  {user.email && (
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    登録日: {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleRole(user.id, user.role)}
                  data-testid={`button-toggle-role-${user.id}`}
                >
                  <Settings className="w-4 h-4 mr-1" />
                  {user.role === 'admin' ? 'ユーザーに変更' : '管理者に昇格'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Schedule Dialog Component  
const ScheduleDialog = ({ listing, open, onOpenChange, onSuccess }: {
  listing: AdminListingWithSchedule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) => {
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (listing && open) {
      // Set default start time to 1 hour from now
      const defaultStart = new Date();
      defaultStart.setHours(defaultStart.getHours() + 1);
      defaultStart.setMinutes(0, 0, 0);
      
      // Set default end time to 7 days from start
      const defaultEnd = new Date(defaultStart);
      defaultEnd.setDate(defaultEnd.getDate() + 7);
      
      setStartAt(defaultStart.toISOString().slice(0, 16));
      setEndAt(defaultEnd.toISOString().slice(0, 16));
    }
  }, [listing, open]);

  const handleSubmit = async () => {
    if (!listing || !startAt || !endAt) return;

    if (new Date(startAt) >= new Date(endAt)) {
      toast({
        title: "入力エラー",
        description: "終了時間は開始時間より後にしてください",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest(`/api/admin/listings/${listing.id}/schedule`, {
        method: 'PUT',
        body: JSON.stringify({
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
        }),
      });

      if (response.ok) {
        toast({
          title: "成功",
          description: "オークションスケジュールを設定しました",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        const error = await response.json();
        toast({
          title: "エラー",
          description: error.error || "スケジュール設定に失敗しました",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Schedule setting error:', error);
      toast({
        title: "エラー", 
        description: "通信エラーが発生しました",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>オークションスケジュール設定</DialogTitle>
        </DialogHeader>
        {listing && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium">{listing.title}</p>
              <p className="text-sm text-muted-foreground">{listing.make} {listing.model} ({listing.year})</p>
            </div>
            <div>
              <Label htmlFor="startAt">開始時刻</Label>
              <input
                id="startAt"
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                data-testid="input-start-time"
              />
            </div>
            <div>
              <Label htmlFor="endAt">終了時刻</Label>
              <input
                id="endAt"
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                data-testid="input-end-time"
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-schedule">
            キャンセル
          </Button>
          <Button onClick={handleSubmit} data-testid="button-save-schedule">
            スケジュール設定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main Admin Dashboard
export default function AdminDashboard() {
  const [selectedListing, setSelectedListing] = useState<AdminListingWithSchedule | null>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query for fetching all listings with schedule information  
  const { data: allListings, isLoading } = useQuery<AdminListingWithSchedule[]>({
    queryKey: ['/api/admin/listings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/listings');
      if (!response.ok) throw new Error('Failed to fetch listings');
      return response.json();
    },
  });

  const handleScheduleSuccess = () => {
    setShowScheduleDialog(false);
    setSelectedListing(null);
    queryClient.invalidateQueries({ queryKey: ['/api/admin/listings'] });
    queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
  };

  return (
    <AdminProtectedRoute>
      <div className="container mx-auto p-6" data-testid="admin-dashboard">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">管理者ダッシュボード</h1>
          <p className="text-muted-foreground">
            侍ガレージの管理機能へようこそ
          </p>
        </div>

        <div className="mb-8">
          <AdminStats />
        </div>

        <Tabs defaultValue="approvals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="approvals" data-testid="tab-approvals">
              車両承認
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              ユーザー管理
            </TabsTrigger>
            <TabsTrigger value="listings" data-testid="tab-listings">
              出品管理
            </TabsTrigger>
          </TabsList>

          <TabsContent value="approvals">
            <VehicleApproval />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="listings">
            <Card>
              <CardHeader>
                <CardTitle>出品管理・オークションスケジュール</CardTitle>
                <CardDescription>
                  すべての出品を管理し、オークション終了時刻を設定できます。
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">読み込み中...</div>
                ) : !allListings || allListings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    出品がありません
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4">
                      {allListings.map((listing) => (
                        <Card key={listing.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-start space-x-4">
                              {listing.featuredImageUrl && (
                                <img 
                                  src={listing.featuredImageUrl} 
                                  alt={listing.title}
                                  className="w-20 h-16 object-cover rounded-md"
                                />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium text-lg" data-testid={`listing-title-${listing.id}`}>
                                    {listing.title}
                                  </h4>
                                  <Badge 
                                    variant={listing.status === 'published' ? 'default' : 'secondary'}
                                    data-testid={`listing-status-${listing.id}`}
                                  >
                                    {listing.status === 'published' ? '進行中' : 
                                     listing.status === 'submitted' ? '審査待ち' :
                                     listing.status === 'approved' ? '承認済み' : 
                                     listing.status === 'ended' ? '終了' : '下書き'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {listing.make} {listing.model} ({listing.year}) - 
                                  走行距離: {listing.mileage?.toLocaleString()}km - 
                                  場所: {listing.locationText}
                                </p>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    終了予定: <span data-testid={`listing-end-time-${listing.id}`}>
                                      {listing.endAt ? new Date(listing.endAt).toLocaleString('ja-JP') : '未設定'}
                                    </span>
                                  </span>
                                  {listing.reservePrice && (
                                    <span>希望価格: ¥{parseFloat(listing.reservePrice).toLocaleString()}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedListing(listing);
                                  setShowScheduleDialog(true);
                                }}
                                data-testid={`button-schedule-${listing.id}`}
                              >
                                <Calendar className="w-4 h-4 mr-1" />
                                スケジュール設定
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Schedule Dialog */}
        <ScheduleDialog
          listing={selectedListing}
          open={showScheduleDialog}
          onOpenChange={setShowScheduleDialog}
          onSuccess={handleScheduleSuccess}
        />
      </div>
    </AdminProtectedRoute>
  );
}