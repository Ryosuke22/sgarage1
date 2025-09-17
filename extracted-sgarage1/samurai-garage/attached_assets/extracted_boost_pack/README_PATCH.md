# Garages Boost Pack（Replitに貼って使える強化セット）

このパックは **商用CVRに直結**する以下を追加します：
- モバイル **Sticky入札バー**（Reserveバッジ・残り時間・手数料ヒント）
- **手数料API**（概算表示）
- **入札API（メモリ版）**＋ **ソフトクローズ**（入札スナイプ対策）
- **WebSocketリアルタイム**（入札/延長を即時反映）
- 必須の静的ページ雛形：HowItWorks / Fees / TrustSafety / Shipping

---

## 1) 追加ファイルをコピー

以下のフォルダ構成を、あなたのリポに**そのまま**追加します。

```
client/src/components/BidBar.tsx
client/src/components/ReserveBadge.tsx
client/src/components/FeeHint.tsx
client/src/lib/realtime.ts
client/src/pages/HowItWorks.tsx
client/src/pages/Fees.tsx
client/src/pages/TrustSafety.tsx
client/src/pages/Shipping.tsx

server/utils/pricing.ts
server/routes/fees.ts
server/routes/auction.memory.ts
server/realtime/ws.ts

shared/schema.additions.ts   // Drizzle移行用（任意）
```

> 既存の構成が `Express + Vite + React(wouter)` の場合を想定しています。

---

## 2) サーバへルーティングを登録

`server/index.ts`（Expressのエントリ）で、**追加ルート**と**WebSocket**を登録します：

```ts
import express from 'express';
import http from 'http';
import { registerFeesRoutes } from './routes/fees';
import { registerAuctionMemoryRoutes } from './routes/auction.memory';
import { attachRealtime } from './realtime/ws';

const app = express();
app.use(express.json());

// 既存の registerRoutes(app) があれば併用OK
registerFeesRoutes(app);

// ↓ HTTPサーバを作ってからWSをアタッチ
const server = http.createServer(app);
const rt = attachRealtime(server);

// メモリ版の入札API（DBできたら置換）
registerAuctionMemoryRoutes(app, rt.broadcast);

// 既存の Vite or 静的配信の設定を server.listen の前に配置
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('listening on ' + PORT);
});
```

> すでに `http` サーバ経由で `app` を listen している場合は、`attachRealtime(existingServer)` を呼ぶだけでOK。

---

## 3) 詳細ページに Sticky 入札バーを表示

`client/src/pages/ListingDetail.tsx`（または該当の詳細ページ）で：

```tsx
import { BidBar } from '@/components/BidBar';

// listingId, currentPrice, minIncrement, endAtISO, reserveState をサーバから取得している前提で
<BidBar
  listingId={data.id}
  currentPrice={data.currentPrice}
  minIncrement={data.minIncrement}
  endAtISO={data.endAt}
  reserveState={data.reserveState} // 'none' | 'met' | 'not_met'
/>
```

> お試し用に `/api/listings/demo-1` を `auction.memory.ts` 側で用意してあるため、
> `listingId="demo-1"` で**動作確認**できます（デモ: 現在価格 $10,000 / +$250 刻み / 15分残）。

---

## 4) 料金ページ等のルーティング

`client/src/App.tsx`（wouter など）に以下のようなルートを追加：

```tsx
<Route path="/how-it-works" component={HowItWorks} />
<Route path="/fees" component={Fees} />
<Route path="/trust-safety" component={TrustSafety} />
<Route path="/shipping" component={Shipping} />
```

---

## 5) Drizzle に切り替える（任意）

後で本番DBに移行する場合：

1. `shared/schema.additions.ts` の `bids / watches / savedSearches` を既存 `schema.ts` へ移植
2. マイグレーション実行（例：`drizzle-kit push`）
3. `server/routes/auction.memory.ts` を、DBを使う実装に差し替え（`db.insert(bids)` / `db.update(listings)` など）
4. 入札確定時に `rt.broadcast(...)` を呼ぶのは同じ

---

## 6) 動作確認のコツ

- **WS動作**：同じ listing を2つのブラウザで開き、一方で入札→もう一方の価格と残り時間が即更新されればOK
- **ソフトクローズ**：終了30秒前で入札→終了時刻が+120秒延長されることを確認
- **手数料**：入札額を変更→FeeHint の合計が更新されること

---

## よくある質問

- Q: 既存の `registerRoutes(app)` と競合しませんか？  
  A: しません。`/api/fees/*` と `/api/bids` を追加で生やすだけです。

- Q: 認証やKYCは？  
  A: このパックには含みません。入札API前に `auth` ミドルウェアを追加するのが推奨です。

- Q: 刻み幅・手数料率は？  
  A: `auction.memory.ts` の `minInc`、`pricing.ts` の率・上限を編集してください。
```

