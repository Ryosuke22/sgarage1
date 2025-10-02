import { Link } from "wouter";

type Props = { rightSlot?: React.ReactNode };

export default function SiteHeader({ rightSlot }: Props) {
  return (
    <header className="glass border-b border-white/10 sticky top-0 z-50">
      {/* 左右の余白と最大幅、スマホ〜PCで一貫 */}
      <div className="mx-auto max-w-7xl h-20 flex items-center px-3 sm:px-5 lg:px-8
                      pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        {/* ロゴは常に左起点・縮まない */}
        <Link 
          href="/landing" 
          className="shrink-0 cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Logo clicked, navigating to landing page');
            window.location.href = "/landing";
          }}
          data-testid="logo"
        >
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gradient font-serif">Samurai Garage</h1>
              <p className="text-xs text-muted-foreground font-medium tracking-wider uppercase">Premium Collection</p>
            </div>
            <span className="bg-orange-500/20 text-orange-300 text-xs px-2 py-1 rounded-full border border-orange-500/30 font-semibold">
              β版
            </span>
          </div>
        </Link>

        {/* 右側は必要なときだけ。ロゴ位置には影響させない */}
        <div className="ml-auto">{rightSlot}</div>
      </div>
    </header>
  );
}