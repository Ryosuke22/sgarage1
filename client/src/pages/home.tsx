import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type VehicleWithBids } from "@shared/schema";
import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import FiltersSidebar from "@/components/filters-sidebar";
import VehicleCard from "@/components/vehicle-card";
import { useWebSocket } from "@/hooks/use-websocket";

export default function Home() {
  const [filters, setFilters] = useState<{
    category: string;
    minPrice?: number;
    maxPrice?: number;
    yearFrom?: number;
    yearTo?: number;
    brand: string;
    search: string;
  }>({
    category: "all",
    brand: "all",
    search: "",
  });

  const [activeTab, setActiveTab] = useState("all");

  const { data: vehicles = [], isLoading } = useQuery<VehicleWithBids[]>({
    queryKey: ["/api/vehicles", filters],
    enabled: true,
  });

  // WebSocket connection for real-time updates
  useWebSocket();

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    if (activeTab === "car") return vehicle.category === "car";
    if (activeTab === "motorcycle") return vehicle.category === "motorcycle";
    return true;
  });

  const carCount = vehicles.filter(v => v.category === "car").length;
  const motorcycleCount = vehicles.filter(v => v.category === "motorcycle").length;

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={(search) => setFilters({...filters, search})} />
      <HeroSection />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-1/4">
            <FiltersSidebar filters={filters} onFiltersChange={handleFilterChange} />
          </aside>
          
          <main className="lg:w-3/4">
            {/* Category Tabs */}
            <div className="mb-6">
              <div className="border-b border-border">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`border-b-2 py-2 px-1 font-medium ${
                      activeTab === "all"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid="tab-all"
                  >
                    すべて ({vehicles.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("car")}
                    className={`border-b-2 py-2 px-1 font-medium ${
                      activeTab === "car"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid="tab-cars"
                  >
                    車 ({carCount})
                  </button>
                  <button
                    onClick={() => setActiveTab("motorcycle")}
                    className={`border-b-2 py-2 px-1 font-medium ${
                      activeTab === "motorcycle"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid="tab-motorcycles"
                  >
                    バイク ({motorcycleCount})
                  </button>
                </nav>
              </div>
            </div>

            {/* Sort Options */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-muted-foreground">
                {filteredVehicles.length}件の商品が見つかりました
              </p>
              <select 
                className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                data-testid="sort-select"
              >
                <option>終了時間が近い順</option>
                <option>価格が安い順</option>
                <option>価格が高い順</option>
                <option>年式が新しい順</option>
              </select>
            </div>

            {/* Vehicle Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-card border border-border rounded-lg overflow-hidden shadow-sm animate-pulse">
                    <div className="w-full h-48 bg-muted"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="h-12 bg-muted rounded"></div>
                      <div className="h-8 bg-muted rounded w-1/3"></div>
                      <div className="h-10 bg-muted rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">該当する車両が見つかりませんでした。</p>
                <p className="text-muted-foreground">フィルター条件を変更してお試しください。</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredVehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {filteredVehicles.length > 0 && (
              <div className="flex justify-center mt-8">
                <nav className="flex items-center space-x-2">
                  <button 
                    className="px-3 py-2 border border-border rounded-lg hover:bg-secondary"
                    data-testid="pagination-prev"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <button 
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                    data-testid="pagination-1"
                  >
                    1
                  </button>
                  <button 
                    className="px-4 py-2 border border-border rounded-lg hover:bg-secondary"
                    data-testid="pagination-2"
                  >
                    2
                  </button>
                  <button 
                    className="px-4 py-2 border border-border rounded-lg hover:bg-secondary"
                    data-testid="pagination-3"
                  >
                    3
                  </button>
                  <button 
                    className="px-3 py-2 border border-border rounded-lg hover:bg-secondary"
                    data-testid="pagination-next"
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </nav>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-secondary border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <i className="fas fa-car text-primary text-xl mr-2"></i>
                <h3 className="text-lg font-bold">カーオークション</h3>
              </div>
              <p className="text-muted-foreground text-sm">
                日本最大級の車・バイクオークションサイト。安心・安全な取引をサポートします。
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">サービス</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">車を探す</a></li>
                <li><a href="#" className="hover:text-foreground">バイクを探す</a></li>
                <li><a href="#" className="hover:text-foreground">出品する</a></li>
                <li><a href="#" className="hover:text-foreground">査定サービス</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">サポート</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">ヘルプセンター</a></li>
                <li><a href="#" className="hover:text-foreground">利用規約</a></li>
                <li><a href="#" className="hover:text-foreground">プライバシーポリシー</a></li>
                <li><a href="#" className="hover:text-foreground">お問い合わせ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">フォローする</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  <i className="fab fa-twitter text-xl"></i>
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  <i className="fab fa-facebook text-xl"></i>
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  <i className="fab fa-instagram text-xl"></i>
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  <i className="fab fa-youtube text-xl"></i>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-muted-foreground">© 2024 カーオークション. All rights reserved.</p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground">利用規約</a>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground">プライバシーポリシー</a>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Cookie設定</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
