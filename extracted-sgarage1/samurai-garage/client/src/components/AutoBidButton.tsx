// AutoBidButton.tsx
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AutoBidButton({ listingId }: { listingId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [max, setMax] = useState<number>(500000);

  const createAutoBid = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/autobids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ listingId, maxAmount: max })
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => {
      setOpen(false);
      // 進行中一覧の軽い更新
      qc.invalidateQueries({ queryKey: ["listings", "published"] });
    }
  });

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} data-testid="button-auto-bid">
        自動入札（上限予約）
      </Button>
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-4 rounded w-[360px]">
            <h3 className="text-white font-semibold mb-2">終了5分前に自動入札</h3>
            <p className="text-xs text-gray-400 mb-2">現在価格に応じて「勝てる最小額」で上限まで自動入札します。延長された場合も「終了5分前」に追従。</p>
            <Input 
              type="number" 
              value={max} 
              onChange={(e)=>setMax(parseInt(e.target.value||"0",10))} 
              className="mb-3"
              data-testid="input-max-amount"
            />
            <div className="flex gap-2 justify-end">
              <Button 
                onClick={()=>createAutoBid.mutate()} 
                disabled={createAutoBid.isPending}
                data-testid="button-confirm-auto-bid"
              >
                予約する
              </Button>
              <Button 
                variant="outline" 
                onClick={()=>setOpen(false)}
                data-testid="button-cancel-auto-bid"
              >
                閉じる
              </Button>
            </div>
            {createAutoBid.isError && (
              <div className="text-red-400 text-sm mt-2" data-testid="text-auto-bid-error">
                {(createAutoBid.error as Error).message}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}