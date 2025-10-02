import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Car, Bike, ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-background via-background to-secondary py-20 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 border border-primary rounded-full"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 border border-primary rounded-full"></div>
        <div className="absolute top-40 right-40 w-16 h-16 border border-primary rounded-full"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            <span className="bg-gradient-to-r from-primary to-green-400 bg-clip-text text-transparent">
              サムライガレージ
            </span>
          </h1>
          <h2 className="jp-title text-2xl md:text-3xl text-foreground mb-4">
            日本最高峰のクラシックカー・オートバイ専門オークション
          </h2>
          <p className="jp-body text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            2001年以前の名車・旧車専門。厳選されたコレクションから、あなたの理想の愛車を見つけてください。
            信頼性の高い入札システムで安心してオークションに参加できます。
          </p>
        </div>
        
        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 mb-12">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">100+</div>
            <div className="jp-caption text-muted-foreground">出品車両</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">50+</div>
            <div className="jp-caption text-muted-foreground">アクティブオークション</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">1000+</div>
            <div className="jp-caption text-muted-foreground">登録ユーザー</div>
          </div>
        </div>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
          <Button 
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 jp-body group"
            data-testid="hero-find-cars"
          >
            <Link to="/?category=car">
              <Car className="w-5 h-5 mr-2" />
              車を探す
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button 
            asChild
            variant="outline"
            size="lg"
            className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-4 jp-body group"
            data-testid="hero-find-motorcycles"
          >
            <Link to="/?category=motorcycle">
              <Bike className="w-5 h-5 mr-2" />
              バイクを探す
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
        
        {/* Additional info */}
        <div className="text-center">
          <p className="jp-caption text-muted-foreground">
            ※ 当サイトでは2001年以前の歴史的価値のある車両のみを取り扱っております
          </p>
        </div>
      </div>
    </section>
  );
}
