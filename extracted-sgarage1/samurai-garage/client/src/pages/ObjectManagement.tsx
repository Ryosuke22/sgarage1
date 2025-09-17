import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { formatFileSize } from "@/lib/upload";
import { apiRequest } from "@/lib/queryClient";
import { 
  Scan, 
  Trash2, 
  Move, 
  Eye, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  HardDrive,
  Image
} from "lucide-react";

interface ObjectStats {
  raw: { count: number; totalSize: number };
  public: { count: number; totalSize: number };
  quarantine: { count: number; totalSize: number };
}

interface StorageObject {
  name: string;
  size: number;
  contentType: string;
  created: string;
  updated: string;
  metadata: Record<string, any>;
  publicUrl: string;
}

export default function ObjectManagement() {
  const [activeTab, setActiveTab] = useState<'raw' | 'public' | 'quarantine'>('raw');
  const [selectedObjects] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch object statistics
  const { data: stats = {} as ObjectStats, isLoading: statsLoading } = useQuery<ObjectStats>({
    queryKey: ['/api/admin/objects/stats'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch objects for current tab
  const { data: objectsData = { objects: [] }, isLoading: objectsLoading } = useQuery<{ objects: StorageObject[]; pagination?: any }>({
    queryKey: ['/api/admin/objects', activeTab],
    enabled: !!activeTab
  });

  // Manual scan mutation
  const scanMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/admin/objects/scan'),
    onSuccess: () => {
      toast({
        title: "スキャン開始",
        description: "オブジェクトスキャンを開始しました。",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/objects/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "スキャンエラー",
        description: error.message || "スキャンの開始に失敗しました。",
        variant: "destructive"
      });
    }
  });

  // Cleanup mutation
  const cleanupMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/admin/objects/cleanup'),
    onSuccess: () => {
      toast({
        title: "クリーンアップ開始",
        description: "古い隔離ファイルのクリーンアップを開始しました。",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/objects/stats'] });
    }
  });

  // Thumbnail generation mutation
  const generateThumbnailsMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/admin/thumbnails/generate'),
    onSuccess: () => {
      toast({
        title: "サムネイル生成開始",
        description: "全ての公開画像のサムネイル生成を開始しました。",
      });
    }
  });

  // Single thumbnail generation mutation
  const generateSingleThumbnailMutation = useMutation({
    mutationFn: (filename: string) => apiRequest('POST', `/api/admin/thumbnails/generate/${encodeURIComponent(filename)}`),
    onSuccess: () => {
      toast({
        title: "サムネイル生成完了",
        description: "画像のサムネイルを生成しました。",
      });
    }
  });

  // Move object mutation
  const moveMutation = useMutation({
    mutationFn: ({ filename, destination }: { filename: string; destination: string }) =>
      apiRequest('POST', '/api/admin/objects/move', { filename, destination }),
    onSuccess: () => {
      toast({
        title: "移動完了",
        description: "ファイルを移動しました。",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/objects'] });
    }
  });

  // Delete object mutation
  const deleteMutation = useMutation({
    mutationFn: (filename: string) =>
      apiRequest('DELETE', `/api/admin/objects/${encodeURIComponent(filename)}`),
    onSuccess: () => {
      toast({
        title: "削除完了",
        description: "ファイルを削除しました。",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/objects'] });
    }
  });

  const handleMoveToPublic = (filename: string) => {
    moveMutation.mutate({ filename, destination: 'public' });
  };

  const handleMoveToQuarantine = (filename: string) => {
    moveMutation.mutate({ filename, destination: 'quarantine' });
  };

  const handleDelete = (filename: string) => {
    if (confirm(`${filename} を完全に削除しますか？`)) {
      deleteMutation.mutate(filename);
    }
  };

  const getDirectoryColor = (directory: string) => {
    switch (directory) {
      case 'raw': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'public': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'quarantine': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getDirectoryIcon = (directory: string) => {
    switch (directory) {
      case 'raw': return <Clock className="h-4 w-4" />;
      case 'public': return <CheckCircle className="h-4 w-4" />;
      case 'quarantine': return <AlertTriangle className="h-4 w-4" />;
      default: return <HardDrive className="h-4 w-4" />;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            オブジェクト管理
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            クラウドストレージオブジェクトの監視と管理
          </p>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">合計ファイル</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.raw ? (stats.raw.count + stats.public.count + stats.quarantine.count) : '---'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.raw && formatFileSize(stats.raw.totalSize + stats.public.totalSize + stats.quarantine.totalSize)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">未処理</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.raw?.count || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.raw && formatFileSize(stats.raw.totalSize)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">公開済み</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.public?.count || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.public && formatFileSize(stats.public.totalSize)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">隔離済み</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.quarantine?.count || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.quarantine && formatFileSize(stats.quarantine.totalSize)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <Button 
            onClick={() => scanMutation.mutate()}
            disabled={scanMutation.isPending}
            data-testid="manual-scan-button"
          >
            {scanMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Scan className="h-4 w-4 mr-2" />
            )}
            手動スキャン
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => cleanupMutation.mutate()}
            disabled={cleanupMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            古いファイル削除
          </Button>

          <Button 
            variant="outline"
            onClick={() => generateThumbnailsMutation.mutate()}
            disabled={generateThumbnailsMutation.isPending}
            data-testid="generate-thumbnails-button"
          >
            {generateThumbnailsMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Image className="h-4 w-4 mr-2" />
            )}
            サムネイル生成
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/objects'] })}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            更新
          </Button>
        </div>

        {/* Objects Table */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="raw" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              未処理 ({stats.raw?.count || 0})
            </TabsTrigger>
            <TabsTrigger value="public" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              公開済み ({stats.public?.count || 0})
            </TabsTrigger>
            <TabsTrigger value="quarantine" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              隔離済み ({stats.quarantine?.count || 0})
            </TabsTrigger>
          </TabsList>
          
          {['raw', 'public', 'quarantine'].map(tab => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getDirectoryIcon(tab)}
                    {tab === 'raw' && '未処理ファイル'}
                    {tab === 'public' && '公開ファイル'}
                    {tab === 'quarantine' && '隔離ファイル'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {objectsLoading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p>読み込み中...</p>
                    </div>
                  ) : !objectsData.objects?.length ? (
                    <div className="text-center py-8 text-gray-500">
                      ファイルがありません
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {objectsData.objects.map((object: StorageObject) => (
                        <div 
                          key={object.name}
                          className="flex items-center justify-between p-4 border rounded-lg"
                          data-testid={`object-item-${object.name}`}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <img 
                              src={object.publicUrl}
                              alt={object.name}
                              className="w-16 h-16 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{object.name.split('/').pop()}</p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(object.size)} • {object.contentType}
                              </p>
                              <p className="text-xs text-gray-400">
                                作成: {new Date(object.created).toLocaleString('ja-JP')}
                              </p>
                              {object.metadata.uploadedBy && (
                                <p className="text-xs text-gray-400">
                                  アップロード者: {object.metadata.uploadedBy}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge className={getDirectoryColor(tab)}>
                              {getDirectoryIcon(tab)}
                              <span className="ml-1">
                                {tab === 'raw' && '未処理'}
                                {tab === 'public' && '公開'}
                                {tab === 'quarantine' && '隔離'}
                              </span>
                            </Badge>
                            
                            <div className="flex gap-1">
                              {tab === 'raw' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMoveToPublic(object.name)}
                                    data-testid={`move-to-public-${object.name}`}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMoveToQuarantine(object.name)}
                                    data-testid={`move-to-quarantine-${object.name}`}
                                  >
                                    <AlertTriangle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              
                              {tab === 'quarantine' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMoveToPublic(object.name)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}

                              {/* Show thumbnail generation button for public images */}
                              {tab === 'public' && object.contentType?.startsWith('image/') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => generateSingleThumbnailMutation.mutate(object.name)}
                                  disabled={generateSingleThumbnailMutation.isPending}
                                  data-testid={`generate-thumbnails-${object.name}`}
                                >
                                  <Image className="h-4 w-4" />
                                </Button>
                              )}
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(object.publicUrl, '_blank')}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(object.name)}
                                data-testid={`delete-${object.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* System Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>システム情報</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">自動プロセス</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• オブジェクトスキャン: 10分毎</li>
                  <li>• サムネイル生成: 15分毎</li>
                  <li>• ファイルクリーンアップ: 毎日深夜2-3時</li>
                  <li>• 隔離ファイル: 30日後自動削除</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">ディレクトリ構造</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• <span className="font-mono">raw/</span>: アップロード直後（未検証）</li>
                  <li>• <span className="font-mono">public/</span>: 検証済み（公開可能）</li>
                  <li>• <span className="font-mono">public/thumbnails/</span>: 自動生成サムネイル</li>
                  <li>• <span className="font-mono">quarantine/</span>: 問題ファイル（隔離）</li>
                  <li>• <span className="font-mono">.private/</span>: プライベートファイル</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}