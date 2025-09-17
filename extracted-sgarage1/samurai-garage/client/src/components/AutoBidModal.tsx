import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Zap, Timer, TrendingUp } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { AutoBid } from "@shared/schema";

interface AutoBidModalProps {
  listingId: string;
  currentPrice: number;
  endTime: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export default function AutoBidModal({ 
  listingId, 
  currentPrice, 
  endTime, 
  isOpen, 
  onOpenChange,
  trigger 
}: AutoBidModalProps) {
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [triggerMinutes, setTriggerMinutes] = useState<string>("5");
  const [strategyType, setStrategyType] = useState<"snipe" | "incremental">("snipe");
  const [incrementAmount, setIncrementAmount] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get existing auto bid
  const { data: existingAutoBid, isLoading } = useQuery({
    queryKey: ["/api/auto-bids/listing", listingId],
    enabled: modalOpen || isOpen,
  });

  // Create auto bid mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/auto-bids`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast({
        title: "自動入札設定完了",
        description: "自動入札が正常に設定されました",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auto-bids/listing", listingId] });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast({
        title: "設定エラー",
        description: error.message || "自動入札の設定に失敗しました",
        variant: "destructive",
      });
    },
  });

  // Update auto bid mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/auto-bids/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast({
        title: "設定更新完了",
        description: "自動入札設定が更新されました",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auto-bids/listing", listingId] });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast({
        title: "更新エラー",
        description: error.message || "設定の更新に失敗しました",
        variant: "destructive",
      });
    },
  });

  // Delete auto bid mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/auto-bids/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      toast({
        title: "自動入札削除完了",
        description: "自動入札設定が削除されました",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auto-bids/listing", listingId] });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast({
        title: "削除エラー",
        description: error.message || "削除に失敗しました",
        variant: "destructive",
      });
    },
  });

  // Load existing data when modal opens
  useEffect(() => {
    if (existingAutoBid) {
      setMaxAmount(parseFloat(existingAutoBid.maxAmount).toString());
      setTriggerMinutes(existingAutoBid.triggerMinutes.toString());
      setStrategyType(existingAutoBid.strategyType);
      setIncrementAmount(existingAutoBid.incrementAmount ? parseFloat(existingAutoBid.incrementAmount).toString() : "");
      setIsActive(existingAutoBid.isActive);
    } else {
      // Reset form for new auto bid
      setMaxAmount((currentPrice + 50000).toString());
      setTriggerMinutes("5");
      setStrategyType("snipe");
      setIncrementAmount("10000");
      setIsActive(true);
    }
  }, [existingAutoBid, currentPrice]);

  const handleCloseModal = () => {
    if (onOpenChange) {
      onOpenChange(false);
    } else {
      setModalOpen(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const maxAmountNum = parseInt(maxAmount);
    const incrementAmountNum = strategyType === "incremental" ? parseInt(incrementAmount) : undefined;

    if (maxAmountNum <= currentPrice) {
      toast({
        title: "入力エラー",
        description: "最大入札額は現在価格より高く設定してください",
        variant: "destructive",
      });
      return;
    }

    const data = {
      listingId,
      maxAmount: maxAmountNum,
      triggerMinutes: parseInt(triggerMinutes),
      strategyType,
      incrementAmount: incrementAmountNum,
      isActive,
    };

    if (existingAutoBid) {
      updateMutation.mutate({ id: existingAutoBid.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (existingAutoBid) {
      deleteMutation.mutate(existingAutoBid.id);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getTimeUntilEnd = () => {
    const now = new Date();
    const end = new Date(endTime);
    const diffMinutes = Math.floor((end.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}分`;
    } else if (diffMinutes < 1440) {
      return `${Math.floor(diffMinutes / 60)}時間${diffMinutes % 60}分`;
    } else {
      return `${Math.floor(diffMinutes / 1440)}日`;
    }
  };

  const modalContent = (
    <DialogContent className="sm:max-w-[600px] bg-gray-900 border-white/10">
      <DialogHeader>
        <DialogTitle className="text-white flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-400" />
          自動入札設定
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6">
        {/* オークション情報 */}
        <Card className="bg-gray-800/50 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm">オークション情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">現在価格:</span>
              <span className="text-white font-semibold">{formatPrice(currentPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">終了まで:</span>
              <span className="text-white font-semibold">{getTimeUntilEnd()}</span>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 戦略選択 */}
          <div className="space-y-3">
            <Label className="text-white">入札戦略</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={`cursor-pointer border rounded-lg p-4 transition-all ${
                  strategyType === "snipe" 
                    ? "border-blue-400 bg-blue-900/20" 
                    : "border-white/10 bg-gray-800/50 hover:border-white/20"
                }`}
                onClick={() => setStrategyType("snipe")}
              >
                <div className="flex items-center gap-3">
                  <Timer className="h-5 w-5 text-blue-400" />
                  <div>
                    <h3 className="text-white font-semibold">スナイピング入札</h3>
                    <p className="text-gray-400 text-xs">指定時間前に1回だけ入札</p>
                  </div>
                </div>
              </div>

              <div
                className={`cursor-pointer border rounded-lg p-4 transition-all ${
                  strategyType === "incremental" 
                    ? "border-green-400 bg-green-900/20" 
                    : "border-white/10 bg-gray-800/50 hover:border-white/20"
                }`}
                onClick={() => setStrategyType("incremental")}
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  <div>
                    <h3 className="text-white font-semibold">段階的自動入札</h3>
                    <p className="text-gray-400 text-xs">他の入札者に抜かれたら再入札</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 最大入札額 */}
          <div className="space-y-2">
            <Label htmlFor="maxAmount" className="text-white">
              最大入札額 (円)
            </Label>
            <Input
              id="maxAmount"
              type="number"
              min={currentPrice + 1000}
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="bg-gray-800 border-white/10 text-white"
              placeholder="1,000,000"
              required
            />
            <p className="text-xs text-gray-400">
              現在価格: {formatPrice(currentPrice)} より高く設定してください
            </p>
          </div>

          {/* 実行タイミング */}
          <div className="space-y-2">
            <Label htmlFor="triggerMinutes" className="text-white">
              実行タイミング (終了何分前)
            </Label>
            <Select value={triggerMinutes} onValueChange={setTriggerMinutes}>
              <SelectTrigger className="bg-gray-800 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-white/10">
                {[3, 4, 5, 6, 7, 8, 9, 10].map((minutes) => (
                  <SelectItem key={minutes} value={minutes.toString()} className="text-white">
                    {minutes}分前
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 段階的入札の設定 */}
          {strategyType === "incremental" && (
            <div className="space-y-2">
              <Label htmlFor="incrementAmount" className="text-white">
                増額幅 (円)
              </Label>
              <Input
                id="incrementAmount"
                type="number"
                min={1000}
                value={incrementAmount}
                onChange={(e) => setIncrementAmount(e.target.value)}
                className="bg-gray-800 border-white/10 text-white"
                placeholder="10,000"
                required
              />
              <p className="text-xs text-gray-400">
                他の入札者に抜かれた場合にこの金額ずつ上乗せして再入札します
              </p>
            </div>
          )}

          {/* アクティブ切り替え */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="isActive" className="text-white">
              自動入札を有効にする
            </Label>
          </div>

          {/* ボタン */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {existingAutoBid ? "設定を更新" : "自動入札を設定"}
            </Button>
            
            {existingAutoBid && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                削除
              </Button>
            )}
          </div>
        </form>

        {/* 既存設定の表示 */}
        {existingAutoBid && (
          <Card className="bg-gray-800/50 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">現在の設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">戦略:</span>
                <span className="text-white">
                  {existingAutoBid.strategyType === "snipe" ? "スナイピング入札" : "段階的自動入札"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">最大額:</span>
                <span className="text-white">{formatPrice(parseFloat(existingAutoBid.maxAmount))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">実行:</span>
                <span className="text-white">{existingAutoBid.triggerMinutes}分前</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">状態:</span>
                <span className={existingAutoBid.isActive ? "text-green-400" : "text-red-400"}>
                  {existingAutoBid.isActive ? "有効" : "無効"}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DialogContent>
  );

  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        {modalContent}
      </Dialog>
    );
  }

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-yellow-400/30 bg-yellow-900/20 text-yellow-300 hover:bg-yellow-900/40"
          data-testid="button-auto-bid"
        >
          <Zap className="h-4 w-4 mr-2" />
          自動入札
        </Button>
      </DialogTrigger>
      {modalContent}
    </Dialog>
  );
}