import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FiltersSidebarProps {
  filters: {
    category: string;
    minPrice?: number;
    maxPrice?: number;
    yearFrom?: number;
    yearTo?: number;
    brand: string;
    search: string;
  };
  onFiltersChange: (filters: any) => void;
}

export default function FiltersSidebar({ filters, onFiltersChange }: FiltersSidebarProps) {
  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    if (type === 'min') {
      handleFilterChange('minPrice', numValue);
    } else {
      handleFilterChange('maxPrice', numValue);
    }
  };

  const handleYearChange = (type: 'from' | 'to', value: string) => {
    const numValue = (value && value !== 'all') ? parseInt(value) : undefined;
    if (type === 'from') {
      handleFilterChange('yearFrom', numValue);
    } else {
      handleFilterChange('yearTo', numValue);
    }
  };

  return (
    <Card className="sticky top-24">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">検索・絞り込み</h3>
        
        {/* Category Filter */}
        <div className="mb-6">
          <Label className="block text-sm font-medium mb-2">カテゴリ</Label>
          <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
            <SelectTrigger data-testid="category-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="car">車</SelectItem>
              <SelectItem value="motorcycle">バイク</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Price Range */}
        <div className="mb-6">
          <Label className="block text-sm font-medium mb-2">価格帯</Label>
          <div className="flex space-x-2">
            <Input
              type="number"
              placeholder="最低価格"
              value={filters.minPrice || ''}
              onChange={(e) => handlePriceChange('min', e.target.value)}
              data-testid="min-price-input"
            />
            <span className="self-center">〜</span>
            <Input
              type="number"
              placeholder="最高価格"
              value={filters.maxPrice || ''}
              onChange={(e) => handlePriceChange('max', e.target.value)}
              data-testid="max-price-input"
            />
          </div>
        </div>
        
        {/* Year Filter */}
        <div className="mb-6">
          <Label className="block text-sm font-medium mb-2">年式</Label>
          <div className="flex space-x-2">
            <Select value={filters.yearFrom?.toString() || 'all'} onValueChange={(value) => handleYearChange('from', value)}>
              <SelectTrigger data-testid="year-from-select">
                <SelectValue placeholder="年式（から）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">年式（から）</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
                <SelectItem value="2021">2021</SelectItem>
                <SelectItem value="2020">2020</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.yearTo?.toString() || 'all'} onValueChange={(value) => handleYearChange('to', value)}>
              <SelectTrigger data-testid="year-to-select">
                <SelectValue placeholder="年式（まで）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">年式（まで）</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
                <SelectItem value="2021">2021</SelectItem>
                <SelectItem value="2020">2020</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Brand Filter */}
        <div className="mb-6">
          <Label className="block text-sm font-medium mb-2">メーカー</Label>
          <Select value={filters.brand} onValueChange={(value) => handleFilterChange('brand', value)}>
            <SelectTrigger data-testid="brand-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべてのメーカー</SelectItem>
              <SelectItem value="トヨタ">トヨタ</SelectItem>
              <SelectItem value="ホンダ">ホンダ</SelectItem>
              <SelectItem value="日産">日産</SelectItem>
              <SelectItem value="マツダ">マツダ</SelectItem>
              <SelectItem value="BMW">BMW</SelectItem>
              <SelectItem value="メルセデスベンツ">メルセデスベンツ</SelectItem>
              <SelectItem value="ヤマハ">ヤマハ</SelectItem>
              <SelectItem value="カワサキ">カワサキ</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => {/* Filters are applied automatically */}}
          data-testid="apply-filters-button"
        >
          検索する
        </Button>
      </CardContent>
    </Card>
  );
}
