import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

type Doc = { name: string; url: string };
type FAQ = { q: string; a: string };
type Seller = { name: string; note?: string };
type Listing = {
  title: string;
  locationText?: string;
  currentBid: number;
  currency?: "JPY" | "USD";
  endsAt: string; // ISO
  mileage?: number | string;
  year?: number;
  make?: string;
  model?: string;
  images: string[];
  highlights: string[];
  specs?: Record<string, string | number | boolean | null | undefined>;
  description?: string;
  seller?: Seller;
  documents?: Doc[];
  faqs?: FAQ[];
};

function formatCurrency(value: number, currency: "JPY" | "USD" = "JPY") {
  // JPY デフォルト（小数無し）。USD の場合は小数2桁。
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(value);
}

function ImageGallery({ images }: { images: string[] }) {
  if (!images?.length) return null;
  return (
    <div className="grid gap-3 md:grid-cols-12">
      <div className="md:col-span-9">
        <img
          src={images[0]}
          alt="メイン画像"
          className="w-full aspect-[16/10] object-cover rounded-2xl shadow"
          loading="eager"
        />
      </div>
      <div className="md:col-span-3 grid grid-cols-3 md:grid-cols-1 gap-3">
        {images.slice(1, 5).map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`サムネイル ${i + 1}`}
            className="w-full aspect-video object-cover rounded-xl border"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl md:text-2xl font-bold tracking-tight">{children}</h2>;
}

function SpecTable({ specs }: { specs?: Listing["specs"] }) {
  const entries = useMemo(
    () =>
      Object.entries(specs ?? {}).filter(([, v]) => v !== null && v !== undefined && v !== ""),
    [specs]
  );
  if (!entries.length) return null;
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border bg-white">
      <dl className="divide-y">
        {entries.map(([k, v]) => (
          <div key={k} className="grid grid-cols-3 gap-2 p-3">
            <dt className="col-span-1 text-sm text-gray-500">{k}</dt>
            <dd className="col-span-2 font-medium">{String(v)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function BidPanel({
  currentBid,
  currency,
  endsAt,
}: {
  currentBid: number;
  currency?: "JPY" | "USD";
  endsAt: string;
}) {
  const [bid, setBid] = useState<number | "">("");

  return (
    <aside className="sticky top-6 rounded-2xl border p-5 shadow-sm bg-white">
      <div className="text-sm text-gray-500">現在の入札額</div>
      <div className="text-3xl font-extrabold tracking-tight mt-1">
        {formatCurrency(currentBid, currency ?? "JPY")}
      </div>
      <div className="mt-2 text-sm text-gray-600">終了: {new Date(endsAt).toLocaleString()}</div>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          // TODO: 実装例
          // await fetch("/api/bids", { method: "POST", body: JSON.stringify({ bid }) })
          alert(`入札額: ${bid}`);
        }}
      >
        <input
          type="number"
          inputMode="numeric"
          placeholder="入札額を入力"
          className="flex-1 rounded-xl border px-3 py-2"
          value={bid}
          onChange={(e) => setBid(e.target.value === "" ? "" : Number(e.target.value))}
          required
        />
        <button
          type="submit"
          className="rounded-xl px-4 py-2 font-semibold shadow bg-black text-white hover:opacity-90"
        >
          入札する
        </button>
      </form>
      <p className="mt-3 text-xs text-gray-500">＊入札はキャンセルできません。利用規約をご確認ください。</p>
    </aside>
  );
}

export default function ListingDetailPage() {
  const { slug = "" } = useParams();
  const [data, setData] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const ctrl = new AbortController();
    (async () => {
      try {
        // 本番では /api/listings/:slug を叩く想定
        const res = await fetch(`/api/listings/${slug}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error("not ok");
        const json = (await res.json()) as Listing;
        if (!ignore) setData(json);
      } catch {
        // フォールバック（デモ用データ）
        if (!ignore) {
          setData({
            title: "1997 Kawasaki ZRX1100",
            locationText: "愛知県",
            currentBid: 1280000,
            currency: "JPY",
            endsAt: new Date(Date.now() + 36 * 3600 * 1000).toISOString(),
            mileage: "24,500 km",
            year: 1997,
            make: "Kawasaki",
            model: "ZRX1100",
            images: [
              "https://images.unsplash.it/800/500?image=1067",
              "https://images.unsplash.it/400/250?image=1070",
              "https://images.unsplash.it/400/250?image=1069",
              "https://images.unsplash.it/400/250?image=1068",
              "https://images.unsplash.it/400/250?image=1071",
            ],
            highlights: [
              "ワンオーナー・実走行 24,500km",
              "純正外装セット＋書類揃い",
              "直近でタイヤ・ブレーキ整備済み",
            ],
            specs: {
              年式: 1997,
              メーカー: "Kawasaki",
              モデル: "ZRX1100",
              走行距離: "24,500 km",
              登録状態: "抹消",
              車検: "なし",
            },
            description:
              "人気のZRX1100。機関良好・外装極上。始動/走行動画あり。下取り・陸送手配も可能です。",
            seller: { name: "Vanguard Venture", note: "個人出品／倉庫保管。即時引き渡し可。" },
            documents: [
              { name: "整備記録（PDF）", url: "#" },
              { name: "車検証（写）", url: "#" },
            ],
            faqs: [
              { q: "下取りは可能ですか？", a: "はい、可能です。お問い合わせください。" },
              { q: "名義変更は必要ですか？", a: "抹消済みのため、登録時に名義登録が必要です。" },
            ],
          });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
      ctrl.abort();
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="animate-pulse grid gap-6 md:grid-cols-12">
          <div className="md:col-span-8 space-y-4">
            <div className="h-64 bg-gray-200 rounded-2xl" />
            <div className="h-40 bg-gray-200 rounded-2xl" />
            <div className="h-56 bg-gray-200 rounded-2xl" />
          </div>
          <div className="md:col-span-4 h-64 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg">商品が見つかりませんでした。</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー（ページタイトル） */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{data.title}</h1>
              {data.locationText && (
                <div className="mt-2 text-sm text-gray-600">{data.locationText}</div>
              )}
            </div>
            <div className="hidden md:block">
              <button className="rounded-xl border px-4 py-2 text-sm font-semibold">♥ ウォッチ</button>
            </div>
          </div>
        </div>
      </div>

      {/* 本文 */}
      <div className="mx-auto max-w-6xl px-4 py-8 grid gap-8 md:grid-cols-12">
        {/* 左カラム */}
        <div className="md:col-span-8 space-y-8">
          <ImageGallery images={data.images} />

          <section>
            <H2>ハイライト</H2>
            <ul className="mt-3 grid gap-2 md:grid-cols-2">
              {data.highlights.map((h, i) => (
                <li key={i} className="rounded-xl border bg-white p-3">
                  {h}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <H2>車両説明</H2>
            <div className="mt-3 bg-white rounded-2xl border p-5 leading-relaxed text-gray-800">
              {data.description}
            </div>
          </section>

          <section>
            <H2>仕様</H2>
            <SpecTable specs={data.specs} />
          </section>

          <section>
            <H2>書類 / メディア</H2>
            <div className="mt-3 grid gap-2">
              {(data.documents ?? []).map((d, i) => (
                <a key={i} href={d.url} className="rounded-xl border p-3 bg-white hover:bg-gray-50">
                  {d.name}
                </a>
              ))}
            </div>
          </section>

          <section>
            <H2>よくある質問</H2>
            <div className="mt-3 space-y-3">
              {(data.faqs ?? []).map((f, i) => (
                <details key={i} className="rounded-xl border bg-white p-4">
                  <summary className="font-semibold">{f.q}</summary>
                  <p className="mt-2 text-gray-700">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>

        {/* 右カラム（CTA） */}
        <div className="md:col-span-4">
          <BidPanel currentBid={data.currentBid} currency={data.currency} endsAt={data.endsAt} />

          <div className="mt-6 rounded-2xl border bg-white p-5">
            <div className="text-sm text-gray-500">出品者</div>
            <div className="mt-1 font-semibold">{data.seller?.name ?? "-"}</div>
            {data.seller?.note && <div className="mt-1 text-sm text-gray-600">{data.seller.note}</div>}
            <button className="mt-4 w-full rounded-xl border px-4 py-2 font-semibold">
              出品者に質問する
            </button>
          </div>

          <div className="mt-6 rounded-2xl border bg-white p-5">
            <div className="font-semibold">配送目安</div>
            <div className="mt-2 text-sm text-gray-600">全国 陸送手配可</div>
          </div>
        </div>
      </div>
    </div>
  );
}
