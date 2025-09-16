import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-r from-primary to-blue-600 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            日本最大級の車・バイクオークション
          </h2>
          <p className="text-xl mb-8 opacity-90">
            信頼できる競売システムで理想の愛車を見つけよう
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button 
              className="bg-white text-primary px-8 py-3 hover:bg-gray-50 font-semibold"
              data-testid="hero-find-cars"
            >
              車を探す
            </Button>
            <Button 
              variant="outline"
              className="border-2 border-white text-white px-8 py-3 hover:bg-white hover:text-primary font-semibold bg-transparent"
              data-testid="hero-find-motorcycles"
            >
              バイクを探す
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
