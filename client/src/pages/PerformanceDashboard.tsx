import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Zap, 
  Database, 
  Globe, 
  Timer, 
  MemoryStick,
  Gauge,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import { measurePerformance, type PerformanceMetrics } from "@/utils/performance";
import { queryClient } from "@/lib/queryClient";

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [cacheStats, setCacheStats] = useState({
    queries: 0,
    mutations: 0,
    size: 0
  });

  const updateMetrics = () => {
    const newMetrics = measurePerformance();
    if (newMetrics) {
      setMetrics(newMetrics);
    }

    // Get TanStack Query cache stats
    const queryCache = queryClient.getQueryCache();
    const mutationCache = queryClient.getMutationCache();
    
    setCacheStats({
      queries: queryCache.getAll().length,
      mutations: mutationCache.getAll().length,
      size: JSON.stringify(queryCache.getAll()).length
    });
  };

  useEffect(() => {
    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const getScoreColor = (score: number) => {
    if (score < 1000) return "text-green-600";
    if (score < 2500) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score < 1000) return { label: "優秀", variant: "default" as const };
    if (score < 2500) return { label: "良好", variant: "secondary" as const };
    return { label: "要改善", variant: "destructive" as const };
  };

  const clearCache = () => {
    queryClient.clear();
    updateMetrics();
    console.log("Query cache cleared");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            パフォーマンスダッシュボード
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            アプリケーションの読み込み速度とキャッシュ状況を監視
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <Button onClick={updateMetrics} data-testid="refresh-metrics">
            <RefreshCw className="h-4 w-4 mr-2" />
            メトリクス更新
          </Button>
          <Button variant="outline" onClick={clearCache}>
            <Database className="h-4 w-4 mr-2" />
            キャッシュクリア
          </Button>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ページ読み込み時間</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(metrics?.pageLoadTime || 0)}`}>
                {metrics ? `${metrics.pageLoadTime.toFixed(0)}ms` : '---'}
              </div>
              {metrics && (
                <Badge {...getScoreBadge(metrics.pageLoadTime)} className="mt-2">
                  {getScoreBadge(metrics.pageLoadTime).label}
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">First Contentful Paint</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(metrics?.firstContentfulPaint || 0)}`}>
                {metrics ? `${metrics.firstContentfulPaint.toFixed(0)}ms` : '---'}
              </div>
              {metrics && (
                <Badge {...getScoreBadge(metrics.firstContentfulPaint)} className="mt-2">
                  {getScoreBadge(metrics.firstContentfulPaint).label}
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time to Interactive</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(metrics?.timeToInteractive || 0)}`}>
                {metrics ? `${metrics.timeToInteractive.toFixed(0)}ms` : '---'}
              </div>
              {metrics && (
                <Badge {...getScoreBadge(metrics.timeToInteractive)} className="mt-2">
                  {getScoreBadge(metrics.timeToInteractive).label}
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">メモリ使用量</CardTitle>
              <MemoryStick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics ? `${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB` : '---'}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                JSヒープサイズ
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Cache Statistics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              キャッシュ統計
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {cacheStats.queries}
                </div>
                <p className="text-sm text-muted-foreground">アクティブクエリ</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {cacheStats.mutations}
                </div>
                <p className="text-sm text-muted-foreground">実行中ミューテーション</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {(cacheStats.size / 1024).toFixed(1)}KB
                </div>
                <p className="text-sm text-muted-foreground">キャッシュサイズ</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              パフォーマンス最適化機能
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  実装済み最適化
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>✓ ルートベースのコード分割</li>
                  <li>✓ インテリジェントクエリキャッシュ</li>
                  <li>✓ 遅延ローディング（Lazy Loading）</li>
                  <li>✓ 画像最適化（WebP/JPEG）</li>
                  <li>✓ サムネイル自動生成</li>
                  <li>✓ 接続速度対応ローディング</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  推奨パフォーマンス目標
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• ページ読み込み: &lt; 1000ms</li>
                  <li>• First Contentful Paint: &lt; 1000ms</li>
                  <li>• Time to Interactive: &lt; 2500ms</li>
                  <li>• メモリ使用量: &lt; 50MB</li>
                  <li>• キャッシュヒット率: &gt; 90%</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Performance Monitor */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>リアルタイム監視</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>ページ読み込み速度</span>
                  <span>{metrics ? `${metrics.pageLoadTime.toFixed(0)}ms` : '---'}</span>
                </div>
                <Progress 
                  value={metrics ? Math.min((3000 - metrics.pageLoadTime) / 3000 * 100, 100) : 0} 
                  className="h-2"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>メモリ効率</span>
                  <span>{metrics ? `${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB` : '---'}</span>
                </div>
                <Progress 
                  value={metrics ? Math.min((100 - metrics.memoryUsage / 1024 / 1024) / 100 * 100, 100) : 0} 
                  className="h-2"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>キャッシュ効率</span>
                  <span>{cacheStats.queries > 0 ? '良好' : '初期化中'}</span>
                </div>
                <Progress 
                  value={cacheStats.queries > 0 ? 85 : 0} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}