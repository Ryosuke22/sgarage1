# Samurai Garage - コードバックアップ

**作成日時**: 2025/08/25 19:30  
**状態**: リアルタイム入札機能実装完了済み

## 📁 バックアップ内容

### 🖼️ フロントエンド（画面表示）
- `pages/Home.tsx` - メインページ（オークション一覧、検索機能、落札結果タブ）
- `pages/AdminDashboard.tsx` - 管理者画面（テストデータ作成ボタン）
- `pages/ListingDetail.tsx` - オークション詳細ページ（**SSE統合済み**）
- `components/AuctionCard.tsx` - オークションカード表示
- `components/AutoBidButton.tsx` - **新規追加**: 自動入札ボタン
- `hooks/useAuctionSSE.ts` - **新規追加**: リアルタイム更新フック

### ⚙️ バックエンド（サーバー処理）
- `server/routes.ts` - API処理（検索、データ取得、**入札API追加**）
- `server/storage.ts` - データベース操作（**リアルタイム機能追加**）
- `server/index.ts` - サーバー起動
- `server/realtime.ts` - **新規追加**: SSEイベントハブ
- `server/cronJobs.ts` - **新規追加**: 自動入札実行・オークション終了処理
- `server/db.ts` - **新規追加**: ルート互換用DB関数

### 📊 データベース構造
- `shared/schema.ts` - データベース設計（車、オークション、入札データ、**自動入札テーブル追加**）

### 🔧 設定ファイル
- `package.json` - 使用ライブラリ一覧
- `vite.config.ts` - 開発環境設定

## 🚀 実装済み機能（このバックアップ時点）

### ✅ リアルタイム入札システム
- **SSE（Server-Sent Events）**: `/api/stream/auction/:id` でlive更新
- **手動入札API**: `/api/bids` で入札刻み検証
- **自動入札API**: `/api/autobids` でスナイプ入札予約
- **ソフトクローズ**: 終了10分以内入札で自動延長（10分）
- **Cron処理**: 自動入札実行と終了確定（1分間隔）

### ✅ フロントエンド統合
- **useAuctionSSE hook**: リアルタイムbid/extended イベント受信
- **AutoBidButton**: 簡易自動入札設定モーダル
- **ListingDetail**: ライブカウントダウン・入札履歴更新

### ✅ 認証・セキュリティ
- **CORS**: credentials:'include' 対応
- **認証ミドルウェア**: 入札・自動入札API保護
- **KYC要件**: 100万円以上の自動入札は要認証

## 🧪 テスト状況

### テスト用データ
- `test-auction-001`: Honda NSX 1991（通常テスト用）
- `test-auction-002`: Honda NSX 1992（ソフトクローズテスト用）

### 受け入れテスト結果
- ✅ CORS/認証: credentials付きfetch通信
- ✅ 入札刻み検証: 不正額拒否・正常額受理
- ✅ SSE接続: ping/dataイベント受信確認
- ✅ API稼働: 入札・自動入札エンドポイント

## 🔄 復元方法

1. **ファイル復元**:
   ```bash
   cp -r backup-YYYYMMDD-HHMM/* ./
   ```

2. **依存関係インストール**:
   ```bash
   npm install
   ```

3. **データベース同期**:
   ```bash
   npm run db:push
   ```

4. **サーバー起動**:
   ```bash
   npm run dev
   ```

## 📝 注意事項

- このバックアップは **リアルタイム入札機能実装完了後** の状態です
- 実装前の状態に戻したい場合は、新規追加ファイルを削除し、既存ファイルから新機能部分を除去する必要があります
- データベースには `auto_bids` テーブルが追加されています

---
*Samurai Garage - Japanese Classic Car Auction Platform*