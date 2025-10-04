import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import Layout from "@/components/Layout";
import { PhotoManager } from "@/components/PhotoManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWatch } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import { insertListingSchema } from "@shared/schema";
import { useMakes, useYears, useModels } from "@/hooks/useVehicleOptions";
import { DocumentUpload } from "@/components/DocumentUpload";
import { validateAndNormalizeVideoUrl, isSupportedVideoUrl } from "@/lib/utils";
import { VideoEmbed } from "@/components/VideoEmbed";


// Create a simplified form schema that matches what the user inputs
const createListingSchema = z.object({
  specifications: z.string().optional(),
  hasAccidentHistory: z.enum(["yes", "no", "unknown"], { required_error: "事故歴を選択してください" }),
  purchaseYear: z.string().optional(),
  modifiedParts: z.string().optional(),
  prePurchaseInfo: z.string().optional(),
  ownerMaintenance: z.string().optional(),
  knownIssues: z.string().optional(),
  highlights: z.string().optional(),
  category: z.enum(["car", "motorcycle"], { required_error: "カテゴリを選択してください" }),
  make: z.string().min(1, "メーカーを入力してください"),
  model: z.string().min(1, "モデルを入力してください"),
  vin: z.string().optional(),
  year: z.number().min(1900, "正しい年式を入力してください").max(2001, "2001年以前の車両のみ出品可能です"),
  mileage: z.string().min(1, "走行距離を入力してください"),
  mileageVerified: z.boolean().optional(),
  ownershipMileage: z.string().optional(),
  hasShaken: z.boolean().optional(),
  shakenYear: z.string().optional(),
  shakenMonth: z.string().optional(),
  isTemporaryRegistration: z.boolean().optional(),
  locationText: z.string().min(1, "都道府県を選択してください"),
  city: z.string().optional(),
  startingPrice: z.string().min(1, "開始価格を入力してください").refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "正しい価格を入力してください"),
  reservePrice: z.string().optional(),
  preferredDayOfWeek: z.string().optional(),
  preferredStartTime: z.string().optional(),
  auctionDuration: z.string().optional(),
  videoUrl: z.string().optional().refine((val) => {
    if (!val || val.trim() === "") return true; // Optional field
    return isSupportedVideoUrl(val);
  }, "YouTube または Vimeo の動画URLを入力してください"),
});

type CreateListingForm = z.infer<typeof createListingSchema>;

export default function CreateListing() {
  console.log("CreateListing component is rendering!");
  
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedPhotos, setUploadedPhotos] = useState<{id: string; url: string; sortOrder: number}[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<{type: string, fileName: string, url: string}[]>([]);
  
  // Get edit ID from URL parameters
  const editId = new URLSearchParams(window.location.search).get('edit');
  
  // Fetch existing listing data if editing
  const { data: existingListing } = useQuery({
    queryKey: [`/api/listings/${editId}`],
    enabled: !!editId,
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isLoading, isAuthenticated } = useAuth();
  
  console.log("Router state:", { isAuthenticated, isLoading });
  console.log("Current path:", window.location.pathname);

  const form = useForm<CreateListingForm>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      specifications: "",
      hasAccidentHistory: "no",
      purchaseYear: "",
      modifiedParts: "",
      prePurchaseInfo: "",
      ownerMaintenance: "",
      knownIssues: "",
      highlights: "",
      category: "car",
      make: "",
      model: "",
      vin: "",
      year: 2001,
      mileage: "",
      mileageVerified: false,
      ownershipMileage: "",
      hasShaken: false,
      shakenYear: "",
      shakenMonth: "",
      isTemporaryRegistration: false,
      locationText: "",
      city: "",
      startingPrice: "",
      reservePrice: "",
      preferredDayOfWeek: "",
      preferredStartTime: "",
      auctionDuration: "",
      videoUrl: "",
    },
  });

  const watchedCategory = useWatch({ control: form.control, name: "category" });
  const watchedMake = useWatch({ control: form.control, name: "make" });
  const watchedYear = useWatch({ control: form.control, name: "year" });
  const watchedLocation = useWatch({ control: form.control, name: "locationText" });

  // Load existing listing data into form when editing
  useEffect(() => {
    if (existingListing) {
      const listing = existingListing as any;
      form.reset({
        specifications: listing.specifications || "",
        hasAccidentHistory: listing.hasAccidentHistory || "unknown",
        purchaseYear: listing.purchaseYear || "",
        modifiedParts: listing.modifiedParts || "",
        prePurchaseInfo: listing.prePurchaseInfo || "",
        ownerMaintenance: listing.ownerMaintenance || "",
        knownIssues: listing.knownIssues || "",
        highlights: listing.highlights || "",
        category: listing.category,
        make: listing.make,
        model: listing.model,
        vin: listing.vin || "",
        year: listing.year,
        mileage: listing.mileage?.toString() || "",
        mileageVerified: listing.mileageVerified || false,
        ownershipMileage: listing.ownershipMileage?.toString() || "",
        hasShaken: listing.hasShaken || false,
        shakenYear: listing.shakenYear || "",
        shakenMonth: listing.shakenMonth || "",
        isTemporaryRegistration: listing.isTemporaryRegistration || false,
        locationText: listing.locationText || "",
        city: listing.city || "",
        startingPrice: listing.startingPrice || "",
        reservePrice: listing.reservePrice || "",
        preferredDayOfWeek: listing.preferredDayOfWeek || "",
        preferredStartTime: listing.preferredStartTime || "",
        auctionDuration: listing.auctionDuration || "",
        videoUrl: listing.videoUrl || "",
      });
      
      // Load photos if available
      if (listing.photos && Array.isArray(listing.photos)) {
        const photos = listing.photos.map((photo: any, index: number) => ({
          id: `photo-${Date.now()}-${index}`,
          url: photo.url || photo,
          sortOrder: photo.sortOrder ?? index
        }));
        setUploadedPhotos(photos);
      }
      
      // Load documents if available
      if (listing.documents && Array.isArray(listing.documents)) {
        setUploadedDocuments(listing.documents);
      }
    }
  }, [existingListing, form]);

  const [selectedCountry, setSelectedCountry] = useState<string>("all");

  // Vehicle data hooks
  const { data: countriesData } = useQuery({ 
    queryKey: ['/api/vehicle/countries'], 
    staleTime: Infinity 
  });
  const { data: makesData, isLoading: makesLoading } = useQuery({ 
    queryKey: ['/api/vehicle/makes', watchedCategory, selectedCountry],
    queryFn: () => fetch(`/api/vehicle/makes?category=${watchedCategory}&country=${selectedCountry}`).then(r => r.json()),
    enabled: !!watchedCategory
  });
  const { data: yearsData, isLoading: yearsLoading } = useYears(watchedCategory, watchedMake);
  const { data: modelsData, isLoading: modelsLoading } = useModels(watchedCategory, watchedMake, watchedYear);

  // 都道府県と市町村のマッピング
  const cityData: Record<string, string[]> = {
    "北海道": ["札幌市", "函館市", "小樽市", "旭川市", "室蘭市", "釧路市", "帯広市", "北見市", "夕張市", "岩見沢市", "網走市", "留萌市", "苫小牧市", "稚内市", "美唄市", "芦別市", "江別市", "赤平市", "紋別市", "士別市", "名寄市", "三笠市", "根室市", "千歳市", "滝川市", "砂川市", "歌志内市", "深川市", "富良野市", "登別市", "恵庭市", "伊達市", "北広島市", "石狩市", "北斗市"],
    "青森県": ["青森市", "弘前市", "八戸市", "黒石市", "五所川原市", "十和田市", "三沢市", "むつ市", "つがる市", "平川市"],
    "岩手県": ["盛岡市", "宮古市", "大船渡市", "花巻市", "北上市", "久慈市", "遠野市", "一関市", "陸前高田市", "釜石市", "二戸市", "八幡平市", "奥州市", "滝沢市"],
    "宮城県": ["仙台市", "石巻市", "塩竈市", "気仙沼市", "白石市", "名取市", "角田市", "多賀城市", "岩沼市", "登米市", "栗原市", "東松島市", "大崎市", "富谷市"],
    "秋田県": ["秋田市", "能代市", "横手市", "大館市", "男鹿市", "湯沢市", "鹿角市", "由利本荘市", "潟上市", "大仙市", "北秋田市", "にかほ市", "仙北市"],
    "山形県": ["山形市", "米沢市", "鶴岡市", "酒田市", "新庄市", "寒河江市", "上山市", "村山市", "長井市", "天童市", "東根市", "尾花沢市", "南陽市"],
    "福島県": ["福島市", "会津若松市", "郡山市", "いわき市", "白河市", "須賀川市", "喜多方市", "相馬市", "二本松市", "田村市", "南相馬市", "伊達市", "本宮市"],
    "茨城県": ["水戸市", "日立市", "土浦市", "古河市", "石岡市", "結城市", "龍ケ崎市", "下妻市", "常総市", "常陸太田市", "高萩市", "北茨城市", "笠間市", "取手市", "牛久市", "つくば市", "ひたちなか市", "鹿嶋市", "潮来市", "守谷市", "常陸大宮市", "那珂市", "筑西市", "坂東市", "稲敷市", "かすみがうら市", "桜川市", "神栖市", "行方市", "鉾田市", "つくばみらい市", "小美玉市"],
    "栃木県": ["宇都宮市", "足利市", "栃木市", "佐野市", "鹿沼市", "日光市", "小山市", "真岡市", "大田原市", "矢板市", "那須塩原市", "さくら市", "那須烏山市", "下野市"],
    "群馬県": ["前橋市", "高崎市", "桐生市", "伊勢崎市", "太田市", "沼田市", "館林市", "渋川市", "藤岡市", "富岡市", "安中市", "みどり市"],
    "埼玉県": ["さいたま市", "川越市", "熊谷市", "川口市", "行田市", "秩父市", "所沢市", "飯能市", "加須市", "本庄市", "東松山市", "春日部市", "狭山市", "羽生市", "鴻巣市", "深谷市", "上尾市", "草加市", "越谷市", "蕨市", "戸田市", "入間市", "朝霞市", "志木市", "和光市", "新座市", "桶川市", "久喜市", "北本市", "八潮市", "富士見市", "三郷市", "蓮田市", "坂戸市", "幸手市", "鶴ヶ島市", "日高市", "吉川市", "ふじみ野市", "白岡市"],
    "千葉県": ["千葉市", "銚子市", "市川市", "船橋市", "館山市", "木更津市", "松戸市", "野田市", "茂原市", "成田市", "佐倉市", "東金市", "旭市", "習志野市", "柏市", "勝浦市", "市原市", "流山市", "八千代市", "我孫子市", "鴨川市", "鎌ケ谷市", "君津市", "富津市", "浦安市", "四街道市", "袖ケ浦市", "八街市", "印西市", "白井市", "富里市", "南房総市", "匝瑳市", "香取市", "山武市", "いすみ市", "大網白里市"],
    "東京都": ["千代田区", "中央区", "港区", "新宿区", "文京区", "台東区", "墨田区", "江東区", "品川区", "目黒区", "大田区", "世田谷区", "渋谷区", "中野区", "杉並区", "豊島区", "北区", "荒川区", "板橋区", "練馬区", "足立区", "葛飾区", "江戸川区", "八王子市", "立川市", "武蔵野市", "三鷹市", "青梅市", "府中市", "昭島市", "調布市", "町田市", "小金井市", "小平市", "日野市", "東村山市", "国分寺市", "国立市", "福生市", "狛江市", "東大和市", "清瀬市", "東久留米市", "武蔵村山市", "多摩市", "稲城市", "羽村市", "あきる野市", "西東京市"],
    "神奈川県": ["横浜市", "川崎市", "相模原市", "横須賀市", "平塚市", "鎌倉市", "藤沢市", "小田原市", "茅ヶ崎市", "逗子市", "三浦市", "秦野市", "厚木市", "大和市", "伊勢原市", "海老名市", "座間市", "南足柄市", "綾瀬市"],
    "新潟県": ["新潟市", "長岡市", "三条市", "柏崎市", "新発田市", "小千谷市", "加茂市", "十日町市", "見附市", "村上市", "燕市", "糸魚川市", "妙高市", "五泉市", "上越市", "阿賀野市", "佐渡市", "魚沼市", "南魚沼市", "胎内市"],
    "富山県": ["富山市", "高岡市", "魚津市", "氷見市", "滑川市", "黒部市", "砺波市", "小矢部市", "南砺市", "射水市"],
    "石川県": ["金沢市", "七尾市", "小松市", "輪島市", "珠洲市", "加賀市", "羽咋市", "かほく市", "白山市", "能美市", "野々市市"],
    "福井県": ["福井市", "敦賀市", "小浜市", "大野市", "勝山市", "鯖江市", "あわら市", "越前市", "坂井市"],
    "山梨県": ["甲府市", "富士吉田市", "都留市", "山梨市", "大月市", "韮崎市", "南アルプス市", "北杜市", "甲斐市", "笛吹市", "上野原市", "甲州市", "中央市"],
    "長野県": ["長野市", "松本市", "上田市", "岡谷市", "飯田市", "諏訪市", "須坂市", "小諸市", "伊那市", "駒ヶ根市", "中野市", "大町市", "飯山市", "茅野市", "塩尻市", "佐久市", "千曲市", "東御市", "安曇野市"],
    "岐阜県": ["岐阜市", "大垣市", "高山市", "多治見市", "関市", "中津川市", "美濃市", "瑞浪市", "羽島市", "恵那市", "美濃加茂市", "土岐市", "各務原市", "可児市", "山県市", "瑞穂市", "飛騨市", "本巣市", "郡上市", "下呂市", "海津市"],
    "静岡県": ["静岡市", "浜松市", "沼津市", "熱海市", "三島市", "富士宮市", "伊東市", "島田市", "富士市", "磐田市", "焼津市", "掛川市", "藤枝市", "御殿場市", "袋井市", "下田市", "裾野市", "湖西市", "伊豆市", "御前崎市", "菊川市", "伊豆の国市", "牧之原市"],
    "愛知県": ["名古屋市", "豊橋市", "岡崎市", "一宮市", "瀬戸市", "半田市", "春日井市", "豊川市", "津島市", "碧南市", "刈谷市", "豊田市", "安城市", "西尾市", "蒲郡市", "犬山市", "常滑市", "江南市", "小牧市", "稲沢市", "新城市", "東海市", "大府市", "知多市", "知立市", "尾張旭市", "高浜市", "岩倉市", "豊明市", "日進市", "田原市", "愛西市", "清須市", "北名古屋市", "弥富市", "みよし市", "あま市", "長久手市"],
    "三重県": ["津市", "四日市市", "伊勢市", "松阪市", "桑名市", "鈴鹿市", "名張市", "尾鷲市", "亀山市", "鳥羽市", "熊野市", "いなべ市", "志摩市", "伊賀市"],
    "滋賀県": ["大津市", "彦根市", "長浜市", "近江八幡市", "草津市", "守山市", "栗東市", "甲賀市", "野洲市", "湖南市", "高島市", "東近江市", "米原市"],
    "京都府": ["京都市", "福知山市", "舞鶴市", "綾部市", "宇治市", "宮津市", "亀岡市", "城陽市", "向日市", "長岡京市", "八幡市", "京田辺市", "京丹後市", "南丹市", "木津川市"],
    "大阪府": ["大阪市", "堺市", "岸和田市", "豊中市", "池田市", "吹田市", "泉大津市", "高槻市", "貝塚市", "守口市", "枚方市", "茨木市", "八尾市", "泉佐野市", "富田林市", "寝屋川市", "河内長野市", "松原市", "大東市", "和泉市", "箕面市", "柏原市", "羽曳野市", "門真市", "摂津市", "高石市", "藤井寺市", "東大阪市", "泉南市", "四條畷市", "交野市", "大阪狭山市", "阪南市"],
    "兵庫県": ["神戸市", "姫路市", "尼崎市", "明石市", "西宮市", "洲本市", "芦屋市", "伊丹市", "相生市", "豊岡市", "加古川市", "赤穂市", "西脇市", "宝塚市", "三木市", "高砂市", "川西市", "小野市", "三田市", "加西市", "篠山市", "養父市", "丹波市", "南あわじ市", "朝来市", "淡路市", "宍粟市", "加東市", "たつの市"],
    "奈良県": ["奈良市", "大和高田市", "大和郡山市", "天理市", "橿原市", "桜井市", "五條市", "御所市", "生駒市", "香芝市", "葛城市", "宇陀市"],
    "和歌山県": ["和歌山市", "海南市", "橋本市", "有田市", "御坊市", "田辺市", "新宮市", "紀の川市", "岩出市"],
    "鳥取県": ["鳥取市", "米子市", "倉吉市", "境港市"],
    "島根県": ["松江市", "浜田市", "出雲市", "益田市", "大田市", "安来市", "江津市", "雲南市"],
    "岡山県": ["岡山市", "倉敷市", "津山市", "玉野市", "笠岡市", "井原市", "総社市", "高梁市", "新見市", "備前市", "瀬戸内市", "赤磐市", "真庭市", "美作市", "浅口市"],
    "広島県": ["広島市", "呉市", "竹原市", "三原市", "尾道市", "福山市", "府中市", "三次市", "庄原市", "大竹市", "東広島市", "廿日市市", "安芸高田市", "江田島市"],
    "山口県": ["下関市", "宇部市", "山口市", "萩市", "防府市", "下松市", "岩国市", "光市", "長門市", "柳井市", "美祢市", "周南市", "山陽小野田市"],
    "徳島県": ["徳島市", "鳴門市", "小松島市", "阿南市", "吉野川市", "阿波市", "美馬市", "三好市"],
    "香川県": ["高松市", "丸亀市", "坂出市", "善通寺市", "観音寺市", "さぬき市", "東かがわ市", "三豊市"],
    "愛媛県": ["松山市", "今治市", "宇和島市", "八幡浜市", "新居浜市", "西条市", "大洲市", "伊予市", "四国中央市", "西予市", "東温市"],
    "高知県": ["高知市", "室戸市", "安芸市", "南国市", "土佐市", "須崎市", "宿毛市", "土佐清水市", "四万十市", "香南市", "香美市"],
    "福岡県": ["北九州市", "福岡市", "大牟田市", "久留米市", "直方市", "飯塚市", "田川市", "柳川市", "八女市", "筑後市", "大川市", "行橋市", "豊前市", "中間市", "小郡市", "筑紫野市", "春日市", "大野城市", "宗像市", "太宰府市", "古賀市", "福津市", "うきは市", "宮若市", "嘉麻市", "朝倉市", "みやま市", "糸島市"],
    "佐賀県": ["佐賀市", "唐津市", "鳥栖市", "多久市", "伊万里市", "武雄市", "鹿島市", "小城市", "嬉野市", "神埼市"],
    "長崎県": ["長崎市", "佐世保市", "島原市", "諫早市", "大村市", "平戸市", "松浦市", "対馬市", "壱岐市", "五島市", "西海市", "雲仙市", "南島原市"],
    "熊本県": ["熊本市", "八代市", "人吉市", "荒尾市", "水俣市", "玉名市", "山鹿市", "菊池市", "宇土市", "上天草市", "宇城市", "阿蘇市", "天草市", "合志市"],
    "大分県": ["大分市", "別府市", "中津市", "日田市", "佐伯市", "臼杵市", "津久見市", "竹田市", "豊後高田市", "杵築市", "宇佐市", "豊後大野市", "由布市", "国東市"],
    "宮崎県": ["宮崎市", "都城市", "延岡市", "日南市", "小林市", "日向市", "串間市", "西都市", "えびの市"],
    "鹿児島県": ["鹿児島市", "鹿屋市", "枕崎市", "阿久根市", "出水市", "指宿市", "西之表市", "垂水市", "薩摩川内市", "日置市", "曽於市", "霧島市", "いちき串木野市", "南さつま市", "志布志市", "奄美市", "南九州市", "伊佐市", "姶良市"],
    "沖縄県": ["那覇市", "宜野湾市", "石垣市", "浦添市", "名護市", "糸満市", "沖縄市", "豊見城市", "うるま市", "宮古島市", "南城市"]
  };

  const createListingMutation = useMutation({
    mutationFn: async (data: CreateListingForm) => {
      // Create a complete listing object with all required fields
      const listingData = {
        title: `${data.year} ${data.make} ${data.model}`,
        description: data.specifications || `${data.year} ${data.make} ${data.model}の出品です。`,
        specifications: data.specifications || "",
        highlights: data.highlights || "",
        category: data.category,
        make: data.make,
        model: data.model,
        year: parseInt(data.year.toString()),
        mileage: parseInt(data.mileage.toString()) || 0,
        mileageVerified: data.mileageVerified || false,
        ownershipMileage: data.ownershipMileage ? parseInt(data.ownershipMileage.toString()) : null,
        hasShaken: data.hasShaken || false,
        shakenYear: data.shakenYear || "",
        shakenMonth: data.shakenMonth || "",
        isTemporaryRegistration: data.isTemporaryRegistration || false,
        locationText: data.locationText,
        city: data.city || "",
        startingPrice: data.startingPrice.toString(),
        reservePrice: data.reservePrice || null,
        preferredDayOfWeek: data.preferredDayOfWeek || "saturday",
        preferredStartTime: data.preferredStartTime || "19:00",
        auctionDuration: data.auctionDuration || "7days",
        vin: data.vin || "",
        hasAccidentHistory: data.hasAccidentHistory || "unknown",
        purchaseYear: data.purchaseYear || "",
        modifiedParts: data.modifiedParts || "",
        prePurchaseInfo: data.prePurchaseInfo || "",
        ownerMaintenance: data.ownerMaintenance || "",
        knownIssues: data.knownIssues || "",
        videoUrl: data.videoUrl || "",
        photos: uploadedPhotos.map(photo => ({ url: photo.url, sortOrder: photo.sortOrder })),
        sellerId: (user as any)?.id || "",
        startAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      };
      
      console.log("Sending listing data:", listingData);
      
      const response = await apiRequest("POST", "/api/listings", listingData);
      return response.json();
    },
    onSuccess: async (listing) => {
      try {
        // Save documents if any were uploaded
        if (uploadedDocuments.length > 0) {
          console.log("Saving documents for listing:", listing.id);
          
          for (const doc of uploadedDocuments) {
            await apiRequest("POST", `/api/listings/${listing.id}/documents`, {
              type: doc.type,
              fileName: doc.fileName,
              url: doc.url,
            });
          }
          
          console.log("All documents saved successfully");
        }

        toast({
          title: "出品を作成しました",
          description: "プレビューページで確認できます",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
        navigate(`/preview/${listing?.id || ''}`);
      } catch (docError) {
        console.error("Error saving documents:", docError);
        toast({
          title: "書類保存エラー", 
          description: "出品は作成されましたが、書類の保存に失敗しました。後で再アップロードしてください。",
          variant: "destructive",
        });
        navigate(`/preview/${listing?.id || ''}`);
      }
    },
    onError: (error: any) => {
      console.error("Listing creation error:", error);
      
      // Extract specific error message if available
      let errorMessage = "出品の作成に失敗しました";
      
      if (error?.response?.text) {
        try {
          const errorData = JSON.parse(error.response.text);
          if (errorData.details && Array.isArray(errorData.details)) {
            // Parse validation errors from Zod
            const validationErrors = errorData.details.map((detail: any) => {
              const field = detail.path?.[0];
              switch(field) {
                case 'year': return '年式: 正しい数値を入力してください';
                case 'mileage': return '走行距離: 正しい値を入力してください';
                case 'startAt': return 'オークション開始日: システムエラー';
                case 'endAt': return 'オークション終了日: システムエラー';
                default: return `${field}: ${detail.message}`;
              }
            });
            errorMessage = validationErrors.join('\n');
          } else {
            errorMessage = errorData.error || errorMessage;
          }
        } catch {
          errorMessage = error.response.text;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "出品作成エラー",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handlePhotoUpload = (photos: {id: string; url: string; sortOrder: number}[]) => {
    setUploadedPhotos(photos);
  };

  const onSubmit = async (data: CreateListingForm) => {
    console.log("Form submitted with data:", data);
    console.log("Uploaded photos:", uploadedPhotos);
    console.log("Form validation errors:", form.formState.errors);
    console.log("Form is valid:", form.formState.isValid);
    
    // Force validation trigger
    const isValid = await form.trigger();
    console.log("Manual validation result:", isValid);
    console.log("Form errors after trigger:", form.formState.errors);
    
    if (uploadedPhotos.length === 0) {
      toast({
        title: "画像が必要です",
        description: "少なくとも1枚の画像をアップロードしてください",
        variant: "destructive",
      });
      return;
    }

    // Check for specific validation errors and provide detailed feedback
    if (!isValid || !form.formState.isValid) {
      console.log("Detailed form errors:", form.formState.errors);
      
      // Create a user-friendly error message for each field
      const errorsList: string[] = [];
      const errors = form.formState.errors;
      
      if (errors.category) errorsList.push(`• カテゴリ: ${errors.category.message}`);
      if (errors.make) errorsList.push(`• メーカー: ${errors.make.message}`);
      if (errors.model) errorsList.push(`• モデル: ${errors.model.message}`);
      if (errors.year) errorsList.push(`• 年式: ${errors.year.message}`);
      if (errors.mileage) errorsList.push(`• 走行距離: ${errors.mileage.message}`);
      if (errors.hasAccidentHistory) errorsList.push(`• 事故歴: ${errors.hasAccidentHistory.message}`);
      if (errors.locationText) errorsList.push(`• 所在地: ${errors.locationText.message}`);
      if (errors.startingPrice) errorsList.push(`• 開始価格: ${errors.startingPrice.message}`);
      
      // Check for missing required fields
      if (!data.category) errorsList.push("• カテゴリ: 選択してください");
      if (!data.make?.trim()) errorsList.push("• メーカー: 入力してください");
      if (!data.model?.trim()) errorsList.push("• モデル: 入力してください");
      if (!data.year || data.year < 1900) errorsList.push("• 年式: 正しい年式を入力してください");
      if (!data.mileage?.trim()) errorsList.push("• 走行距離: 入力してください");
      if (!data.locationText?.trim()) errorsList.push("• 所在地: 都道府県を選択してください");
      if (!data.startingPrice?.trim()) errorsList.push("• 開始価格: 入力してください");
      
      if (errorsList.length > 0) {
        // Remove duplicates
        const uniqueErrors = Array.from(new Set(errorsList));
        
        toast({
          title: "入力エラーがあります",
          description: uniqueErrors.slice(0, 5).join("\n") + (uniqueErrors.length > 5 ? "\n...他" : ""),
          variant: "destructive",
        });
        return;
      }
    }

    // Add uploaded photos and normalize video URL if provided
    const normalizedVideoUrl = data.videoUrl ? validateAndNormalizeVideoUrl(data.videoUrl) : null;
    
    const dataWithPhotos = {
      ...data,
      photos: uploadedPhotos.map(photo => ({ url: photo.url, sortOrder: photo.sortOrder })), // Send URL and sortOrder
      videoUrl: normalizedVideoUrl || undefined, // Send embed URL or undefined
    };
    
    console.log("Submitting user form data:", dataWithPhotos);
    
    // Submit the actual user form data instead of test data
    createListingMutation.mutate(dataWithPhotos);
  };

  // Document upload handlers
  const handleDocumentUpload = (type: string, url: string, fileName: string) => {
    setUploadedDocuments(prev => [...prev, { type, fileName, url }]);
  };

  const handleDocumentRemove = (type: string) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.type !== type));
  };

  const getDocumentTypeName = (type: string) => {
    const names: Record<string, string> = {
      'registration_certificate': '車検証',
      'transfer_certificate': '譲渡証明書',
      'registration_seal': '印鑑証明書',
      'insurance_certificate': '自賠責保険証明書',
      'maintenance_record': '整備記録簿',
      'other': 'その他書類'
    };
    return names[type] || type;
  };

  // カスケード対応テストデータ生成関数
  const generateTestData = async () => {
    try {
      // 基本データをランダム生成
      const category = Math.random() > 0.5 ? "car" : "motorcycle";
      
      // 国データを取得して適切なIDを選択
      const countries = (countriesData as any)?.countries || [
        { value: "all", label: "すべての国" },
        { value: "japan", label: "日本" },
        { value: "germany", label: "ドイツ" },
        { value: "italy", label: "イタリア" },
        { value: "france", label: "フランス" },
        { value: "usa", label: "アメリカ" },
        { value: "uk", label: "イギリス" }
      ];
      const randomCountryObj = countries[Math.floor(Math.random() * countries.length)];
      const randomCountry = randomCountryObj.value;
      
      // フェッチ関数
      const fetchMakes = async (category: string, country: string) => {
        const response = await fetch(`/api/vehicle/makes?category=${category}&country=${country}`);
        if (!response.ok) throw new Error('メーカー取得に失敗');
        return response.json();
      };
      
      const fetchYears = async (category: string, make: string) => {
        const response = await fetch(`/api/years?category=${category}&make=${encodeURIComponent(make)}`);
        if (!response.ok) throw new Error('年式取得に失敗');
        return response.json();
      };
      
      const fetchModels = async (category: string, make: string, year: number) => {
        const response = await fetch(`/api/models?category=${category}&make=${encodeURIComponent(make)}&year=${year}`);
        if (!response.ok) throw new Error('モデル取得に失敗');
        return response.json();
      };
      
      // 1. カテゴリーをセット
      form.setValue('category', category, { shouldDirty: true, shouldValidate: true });
      
      // 2. 国選択（フィルタリング用）
      setSelectedCountry(randomCountry);
      
      // 3. そのカテゴリ・国のメーカー候補が揃うまで待つ
      const makesData = await queryClient.ensureQueryData({
        queryKey: ['/api/vehicle/makes', category, randomCountry],
        queryFn: () => fetchMakes(category, randomCountry),
      });
      
      if (!makesData.makes || makesData.makes.length === 0) {
        throw new Error('利用可能なメーカーが見つかりません');
      }
      
      // 4. ランダムメーカーをセット
      const randomMake = makesData.makes[Math.floor(Math.random() * makesData.makes.length)];
      setSelectedMaker(randomMake);
      form.setValue('make', randomMake, { shouldDirty: true, shouldValidate: true });
      
      // 5. そのメーカーの年式候補が揃うまで待つ
      const yearsData = await queryClient.ensureQueryData({
        queryKey: ['years', category, randomMake],
        queryFn: () => fetchYears(category, randomMake),
      });
      
      if (!yearsData.years || yearsData.years.length === 0) {
        throw new Error('利用可能な年式が見つかりません');
      }
      
      // 6. ランダム年式をセット
      const randomYear = yearsData.years[Math.floor(Math.random() * yearsData.years.length)];
      form.setValue('year', randomYear, { shouldDirty: true, shouldValidate: true });
      
      // 7. そのメーカー・年式のモデル候補が揃うまで待つ
      const modelsData = await queryClient.ensureQueryData({
        queryKey: ['models', category, randomMake, randomYear],
        queryFn: () => fetchModels(category, randomMake, randomYear),
      });
      
      // 8. モデルをセット（利用可能な場合のみ）
      if (modelsData.models && modelsData.models.length > 0) {
        const randomModel = modelsData.models[Math.floor(Math.random() * modelsData.models.length)];
        form.setValue('model', randomModel, { shouldDirty: true, shouldValidate: true });
        setIsCustomModel(false);
      } else {
        // モデルが見つからない場合は空にする
        form.setValue('model', '', { shouldDirty: true, shouldValidate: true });
        setIsCustomModel(false);
      }
      
      // 9. その他のフィールドをランダム生成して設定
      console.log("Step 9: Generating other fields");
      const randomMileage = Math.floor(Math.random() * 200000) + 1000;
      const randomStartPrice = (Math.floor(Math.random() * 50) + 1) * 10000;
      const randomReservePrice = Math.floor(randomStartPrice * (1.2 + Math.random() * 0.3));
      
      console.log("Accessing cityData...");
      const prefectures = Object.keys(cityData);
      console.log("Prefectures:", prefectures.length);
      const randomPrefecture = prefectures[Math.floor(Math.random() * prefectures.length)];
      console.log("Random prefecture:", randomPrefecture);
      const cities = cityData[randomPrefecture];
      console.log("Cities for", randomPrefecture, ":", cities?.length);
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      console.log("Random city:", randomCity);
      
      const testSpecs = [
        "エンジン良好、メンテナンス記録あり",
        "車検付き、修復歴なし、ワンオーナー",
        "カスタムパーツ装着、改造申請済み",
        "オリジナル状態維持、コレクター向け",
        "レストア済み、完全整備",
        "走行少なめ、ガレージ保管"
      ];
      
      const testHighlights = [
        "希少モデル、当時物パーツ付属",
        "メンテナンス記録簿完備", 
        "人気カラー、限定モデル",
        "スポーツパッケージ、オプション多数",
        "コンディション良好、即乗車可能"
      ];
      
      const modifiedPartsOptions = [
        "エアロパーツ、マフラー交換済み",
        "社外ホイール装着",
        "車高調整済み",
        "オリジナル状態（改造なし）",
        "エキゾーストシステム交換",
        "ブレーキシステム強化",
        "サスペンション改良"
      ];
      
      const knownIssuesOptions = [
        "小キズあり、動作に問題なし",
        "年式相応の使用感あり",
        "エアコン要修理",
        "特になし、良好な状態",
        "タイヤ交換推奨",
        "バッテリー交換推奨",
        "定期メンテナンス必要"
      ];
      
      // その他のフィールドを設定
      const hasShaken = Math.random() > 0.5;
      const currentYear = new Date().getFullYear();
      const shakenYears = [currentYear, currentYear + 1, currentYear + 2];
      const randomShakenYear = shakenYears[Math.floor(Math.random() * shakenYears.length)];
      const shakenMonths = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
      const randomShakenMonth = shakenMonths[Math.floor(Math.random() * shakenMonths.length)];
      
      const otherFields = {
        mileage: randomMileage.toString(),
        specifications: testSpecs[Math.floor(Math.random() * testSpecs.length)],
        highlights: testHighlights[Math.floor(Math.random() * testHighlights.length)],
        hasAccidentHistory: ["yes", "no", "unknown"][Math.floor(Math.random() * 3)] as "yes" | "no" | "unknown",
        purchaseYear: (randomYear + Math.floor(Math.random() * 5)).toString(),
        modifiedParts: modifiedPartsOptions[Math.floor(Math.random() * modifiedPartsOptions.length)],
        prePurchaseInfo: "ディーラー購入、点検記録あり",
        ownerMaintenance: "定期点検実施、オイル交換記録あり",
        knownIssues: knownIssuesOptions[Math.floor(Math.random() * knownIssuesOptions.length)],
        locationText: randomPrefecture,
        city: randomCity,
        startingPrice: randomStartPrice.toString(),
        reservePrice: randomReservePrice.toString(),
        mileageVerified: Math.random() > 0.5,
        ownershipMileage: (randomMileage + Math.floor(Math.random() * 10000)).toString(),
        hasShaken: hasShaken,
        shakenYear: hasShaken ? randomShakenYear.toString() : "",
        shakenMonth: hasShaken ? randomShakenMonth : "",
        isTemporaryRegistration: Math.random() > 0.9,
        preferredDayOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"][Math.floor(Math.random() * 7)],
        preferredStartTime: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"][Math.floor(Math.random() * 13)],
        auctionDuration: ["3minutes", "5minutes", "30minutes", "5days", "7days", "10days", "14days"][Math.floor(Math.random() * 7)],
        vin: `TEST${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        videoUrl: ""
      };
      
      console.log("Setting otherFields:", otherFields);
      console.log("City value:", otherFields.city);
      console.log("PurchaseYear value:", otherFields.purchaseYear);
      
      // まずlocationText（都道府県）を設定
      form.setValue('locationText', otherFields.locationText, { shouldDirty: true, shouldValidate: true });
      
      // locationText以外のフィールドを設定（cityは後で設定）
      Object.entries(otherFields).forEach(([key, value]) => {
        if (key !== 'locationText' && key !== 'city') {
          form.setValue(key as keyof CreateListingForm, value as any, { shouldDirty: true });
          if (key === 'purchaseYear') {
            console.log(`Set ${key} to:`, value);
          }
        }
      });
      
      // 最後にcity（市町村）を設定（locationTextが設定された後なので有効化される）
      setTimeout(() => {
        form.setValue('city', otherFields.city, { shouldDirty: true, shouldValidate: true });
        console.log(`Set city to:`, otherFields.city);
      }, 100);
      
      toast({
        title: "テストデータを入力しました",
        description: `${category === "car" ? "車" : "バイク"}の実際のデータベースから連動してテストデータを生成しました。市町村: ${otherFields.city}, 購入年: ${otherFields.purchaseYear}`,
      });
      
    } catch (error) {
      console.error("テストデータ生成エラー:", error);
      console.error("エラーの詳細:", JSON.stringify(error, null, 2));
      console.error("エラーメッセージ:", error instanceof Error ? error.message : String(error));
      console.error("エラースタック:", error instanceof Error ? error.stack : 'スタックなし');
      toast({
        title: "エラー",
        description: `テストデータの生成に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  };

  console.log("All hooks initialized successfully");

  // Comprehensive Japanese and international car makers and their models
  const carMakersAndModels = {
    "トヨタ": ["プリウス", "カムリ", "カローラ", "クラウン", "ヴィッツ", "アクア", "ヴォクシー", "ノア", "ハイエース", "ランドクルーザー", "86", "スープラ", "ヤリス", "C-HR", "RAV4", "ハリアー", "アルファード", "ヴェルファイア", "エスティマ", "プラド", "ハイラックス", "シエンタ", "パッソ", "ポルテ", "スペイド", "タンク", "ルーミー", "ピクシス", "アリオン", "プレミオ", "マークX", "マークII", "チェイサー", "クレスタ", "ソアラ", "セリカ", "MR2", "スターレット", "ヴィオス", "カローラスポーツ", "カローラツーリング", "カローラクロス", "ライズ", "ヤリスクロス", "グランエース", "センチュリー", "bZ4X"],
    "ホンダ": ["シビック", "アコード", "フィット", "フリード", "ステップワゴン", "ヴェゼル", "CR-V", "オデッセイ", "インサイト", "レジェンド", "NSX", "S660", "N-BOX", "N-WGN", "N-ONE", "N-VAN", "フリードスパイク", "エリシオン", "ラグレイト", "パイロット", "リッジライン", "パスポート", "CR-Z", "シビックタイプR", "インテグラ", "プレリュード", "S2000", "ビート", "CR-X", "シティ", "ライフ", "ゼスト", "バモス", "アクティ", "ストリーム", "エアウェイブ", "モビリオ", "フィットシャトル", "グレイス", "シャトル", "ジェイド", "e:HEV", "HR-V"],
    "日産": ["ノート", "セレナ", "エクストレイル", "スカイライン", "フェアレディZ", "GT-R", "リーフ", "マーチ", "ジューク", "デイズ", "ルークス", "キューブ", "ティーダ", "シルビア", "ティアナ", "フーガ", "シーマ", "エルグランド", "キャラバン", "NV200", "アリア", "キックス", "ローグ", "ムラーノ", "パスファインダー", "アルティマ", "インフィニティ", "180SX", "200SX", "240SX", "300ZX", "350Z", "370Z", "ブルーバード", "サニー", "パルサー", "アベニール", "プリメーラ", "セフィーロ", "ローレル", "グロリア", "スタンザ", "バサラ", "ラフェスタ", "リバティ", "プレサージュ", "ムラーノ", "デュアリス", "ラティオ", "アルメーラ"],
    "マツダ": ["デミオ", "アクセラ", "アテンザ", "CX-3", "CX-5", "CX-8", "ロードスター", "プレマシー", "ビアンテ", "RX-7", "RX-8", "CX-30", "CX-60", "CX-90", "MAZDA2", "MAZDA3", "MAZDA6", "MX-30", "ファミリア", "カペラ", "ランティス", "ユーノス", "コスモ", "サバンナ", "ルーチェ", "センティア", "MPV", "トリビュート", "ベリーサ", "AZ-ワゴン", "AZ-オフロード", "キャロル", "フレア", "フレアワゴン", "フレアクロスオーバー", "スクラム", "ボンゴ", "タイタン", "ロードスターRF"],
    "スバル": ["インプレッサ", "レガシィ", "フォレスター", "アウトバック", "BRZ", "レヴォーグ", "XV", "WRX", "アセント", "レックス", "ヴィヴィオ", "プレオ", "ステラ", "R1", "R2", "サンバー", "ディアス", "ドミンゴ", "リベロ", "トラヴィック", "エクシーガ", "トレジア", "ジャスティ", "アルシオーネ", "SVX", "バハ", "サンバー", "ルクラ", "ソルテラ", "レガシィアウトバック", "レガシィB4"],
    "三菱": ["ランサー", "パジェロ", "デリカ", "アウトランダー", "RVR", "コルト", "ギャラン", "エクリプス", "ミラージュ", "eKワゴン", "eKスペース", "eKクロス", "アイ", "ミニキャブ", "タウンボックス", "トッポ", "ekアクティブ", "アウトランダーPHEV", "リベロ", "スタリオン", "3000GT", "GTO", "FTO", "ランサーエボリューション", "ディアマンテ", "シグマ", "デボネア", "プラウディア", "グランディス", "シャリオ", "エアトレック", "チャレンジャー", "パジェロミニ", "パジェロイオ", "ピニンファリーナ", "エテルナ"],
    "スズキ": ["スイフト", "ワゴンR", "アルト", "ジムニー", "ハスラー", "スペーシア", "エスクード", "バレーノ", "イグニス", "クロスビー", "ソリオ", "ランディ", "SX4", "キザシ", "スプラッシュ", "MRワゴン", "ラパン", "パレット", "セルボ", "Kei", "ツイン", "カプチーノ", "アルトワークス", "スイフトスポーツ", "ジムニーシエラ", "エブリイ", "キャリイ", "アクロス", "ヴィターラ", "グランドエスクード", "カルタス", "スイフトGTi", "X-90", "エリオ", "エスクードノマド"],
    "ダイハツ": ["タント", "ムーヴ", "ミラ", "コペン", "ウェイク", "キャスト", "ブーン", "トール", "ロッキー", "タフト", "ハイゼット", "アトレー", "ピクシス", "ソニカ", "エッセ", "MAX", "オプティ", "リーザ", "シャレード", "アプローズ", "フェロー", "コンソルテ", "テリオス", "ビーゴ", "ネイキッド", "ムーヴラテ", "YRV", "ストーリア", "ミラココア", "ミライース", "ミラトコット", "ムーヴコンテ", "ムーヴキャンバス"],
    "レクサス": ["LS", "GS", "ES", "IS", "LC", "RC", "NX", "RX", "GX", "LX", "UX", "LFA", "SC", "GX", "LBX", "RZ", "NX450h+", "RX500h", "LS500h", "LC500", "RC F", "GS F", "IS F", "LX600", "GX550"],
    "BMW": ["1シリーズ", "2シリーズ", "3シリーズ", "4シリーズ", "5シリーズ", "6シリーズ", "7シリーズ", "8シリーズ", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "Z3", "Z4", "Z8", "i3", "i4", "i7", "i8", "iX", "iX3", "M1", "M2", "M3", "M4", "M5", "M6", "M8", "X3 M", "X4 M", "X5 M", "X6 M", "Z4 M", "MINI Cooper", "MINI Countryman", "MINI Clubman", "MINI Convertible"],
    "メルセデス・ベンツ": ["Aクラス", "Bクラス", "Cクラス", "CLSクラス", "Eクラス", "Sクラス", "Gクラス", "GLAクラス", "GLBクラス", "GLCクラス", "GLEクラス", "GLSクラス", "Vクラス", "Xクラス", "AMG GT", "SLクラス", "SLCクラス", "CLクラス", "CLKクラス", "SLKクラス", "EQAクラス", "EQBクラス", "EQCクラス", "EQEクラス", "EQSクラス", "EQV", "AMG C63", "AMG E63", "AMG S63", "AMG G63", "AMG GT 63", "マイバッハ Sクラス", "マイバッハ GLS"],
    "アウディ": ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q4", "Q5", "Q7", "Q8", "TT", "R8", "e-tron GT", "Q4 e-tron", "RS3", "RS4", "RS5", "RS6", "RS7", "RS Q3", "RS Q8", "S3", "S4", "S5", "S6", "S7", "S8", "SQ2", "SQ5", "SQ7", "SQ8"],
    "フォルクスワーゲン": ["up!", "ポロ", "ゴルフ", "ジェッタ", "パサート", "アルテオン", "ティグアン", "トゥアレグ", "T-Cross", "T-Roc", "ID.3", "ID.4", "ID.5", "ID.7", "ザ・ビートル", "ゴルフR", "ゴルフGTI", "ポロGTI", "シロッコ", "トゥーラン", "シャラン", "カラベル", "クラフター", "アマロック"],
    "ポルシェ": ["911", "718 Boxster", "718 Cayman", "パナメーラ", "マカン", "カイエン", "タイカン", "911 GT3", "911 GT2", "911 Turbo", "Carrera GT", "918 Spyder"],
    "フェラーリ": ["488", "F8", "SF90", "F12", "812", "ポルトフィーノ", "ローマ", "プロサングエ", "ラ フェラーリ", "エンツォ", "360", "430", "458", "599", "カリフォルニア", "FF", "GTC4ルッソ"],
    "ランボルギーニ": ["ウラカン", "アヴェンタドール", "ウルス", "レヴエルト", "ガヤルド", "ムルシエラゴ", "ディアブロ", "カウンタック"],
    "マクラーレン": ["570S", "600LT", "650S", "675LT", "720S", "750S", "P1", "Senna", "Speedtail", "Artura"],
    "アストンマーティン": ["DB11", "DBS", "ヴァンテージ", "ヴァンキッシュ", "ラピード", "DBX"],
    "ベントレー": ["コンチネンタル", "フライングスパー", "ベンテイガ", "ミュルザンヌ"],
    "ロールスロイス": ["ファントム", "ゴースト", "レイス", "ドーン", "カリナン", "スペクター"],
    "ジャガー": ["XE", "XF", "XJ", "F-PACE", "E-PACE", "I-PACE", "F-TYPE"],
    "ランドローバー": ["ディフェンダー", "ディスカバリー", "レンジローバー", "レンジローバースポーツ", "レンジローバーイヴォーク", "レンジローバーヴェラール"],
    "ボルボ": ["S60", "S90", "V60", "V90", "XC40", "XC60", "XC90", "C40", "EX30", "EX90"],
    "アルファロメオ": ["ジュリア", "ステルヴィオ", "トナーレ", "4C", "ジュリエッタ", "ミト"],
    "フィアット": ["500", "500X", "500L", "パンダ", "プント", "ティーポ"],
    "マセラティ": ["ギブリ", "クアトロポルテ", "レヴァンテ", "MC20", "グラントゥーリズモ", "グランカブリオ"],
    "テスラ": ["Model S", "Model 3", "Model X", "Model Y", "Cybertruck", "Roadster"],
    "その他": ["自由入力"]
  };

  const motorcycleMakersAndModels = {
    "ホンダ": ["CBR125R", "CBR150R", "CBR250R", "CBR250RR", "CBR300R", "CBR400R", "CBR500R", "CBR600RR", "CBR650R", "CBR1000RR", "CBR1000RR-R", "CB125R", "CB150R", "CB250R", "CB300R", "CB400SF", "CB400X", "CB500F", "CB500X", "CB650F", "CB650R", "CB1000R", "CB1300SF", "CB1300SB", "CRF250L", "CRF250M", "CRF250Rally", "CRF300L", "CRF450L", "CRF1000L", "CRF1100L", "NC750S", "NC750X", "VFR800X", "VFR1200X", "GL1800", "CTX700", "CTX1300", "Rebel 300", "Rebel 500", "Rebel 1100", "Shadow", "VTX1300", "Fury", "Stateline", "PCX125", "PCX150", "PCX160", "Forza 125", "Forza 250", "Forza 300", "Forza 350", "Forza 750", "SH125i", "SH150i", "SH300i", "Lead 125", "Vario 125", "Vario 150", "Beat", "Scoopy", "Genio", "スーパーカブ50", "スーパーカブ110", "スーパーカブ125", "クロスカブ50", "クロスカブ110", "モンキー125", "ゴリラ", "ダックス125", "CT125ハンターカブ", "グロム", "MSX125", "Z125 Pro", "CRF50F", "CRF110F", "XR650L", "ゴールドウイング", "ワルキューレ", "DN-01"],
    "ヤマハ": ["YZF-R125", "YZF-R15", "YZF-R25", "YZF-R3", "YZF-R6", "YZF-R1", "YZF-R1M", "MT-125", "MT-15", "MT-25", "MT-03", "MT-07", "MT-09", "MT-10", "MT-10 SP", "FZ25", "FZ-X", "XSR125", "XSR155", "XSR700", "XSR900", "SCR950", "Bolt", "VMAX", "FJR1300", "Super Ténéré", "Ténéré 700", "WR250R", "WR250X", "WR450F", "YZ250F", "YZ450F", "Serow 250", "Tricker", "XT250", "XT660Z", "TW200", "TW225", "SR400", "SR500", "XV950", "XV1700", "XV1900", "Virago", "Dragstar", "Royal Star", "Venture", "TMAX 530", "TMAX 560", "XMAX 125", "XMAX 250", "XMAX 300", "NMAX 125", "NMAX 155", "NMAX 160", "Aerox 155", "Ray ZR", "Fascino", "Saluto", "Alpha", "マジェスティS", "マジェスティ125", "マジェスティ250", "シグナスX", "アクシスZ", "アクシストリート", "ビーノ", "VOX", "ジョグ", "ジョグZR", "ヤマハ・EC-05"],
    "スズキ": ["GSX-R125", "GSX-R150", "GSX-R250", "GSX-R600", "GSX-R750", "GSX-R1000", "GSX-R1000R", "GSX-S125", "GSX-S150", "GSX-S250", "GSX-S300", "GSX-S750", "GSX-S1000", "GSX-S1000F", "SV650", "SV650X", "TU250X", "GW250", "Inazuma 250", "Gladius", "Bandit 250", "Bandit 400", "Bandit 600", "Bandit 650", "Bandit 1200", "Bandit 1250", "ハヤブサ", "GSX1300R", "TL1000S", "TL1000R", "GSX1400", "B-King", "Katana", "GSR250", "GSR400", "GSR600", "GSR750", "GSX250R", "Gixxer", "DR-Z125L", "DR-Z250", "DR-Z400S", "DR-Z400SM", "DR650S", "LTR450", "LTZ400", "King Quad", "Boulevard M109R", "Boulevard C90", "Intruder", "Marauder", "V-Strom 250", "V-Strom 650", "V-Strom 1000", "V-Strom 1050", "DL250", "DL650", "DL1000", "Address 110", "Address 125", "Burgman 125", "Burgman 200", "Burgman 400", "Burgman 650", "スカイウェイブ250", "スカイウェイブ400", "スカイウェイブ650", "アヴェニス125", "アヴェニス150", "レッツ", "レッツ4", "チョイノリ", "セピア", "アドレスV50", "アドレスV100", "アドレスV125"],
    "カワサキ": ["Ninja 125", "Ninja 250", "Ninja 300", "Ninja 400", "Ninja 500", "Ninja 650", "Ninja 1000SX", "Ninja ZX-6R", "Ninja ZX-10R", "Ninja ZX-10RR", "Ninja ZX-14R", "Ninja H2", "Ninja H2R", "Ninja H2 SX", "Z125 Pro", "Z250", "Z300", "Z400", "Z500", "Z650", "Z800", "Z900", "Z900RS", "Z1000", "Z1000SX", "ZRX1200", "ZRX1200R", "ZRX1200S", "ZRX1200 DAEG", "ER-4n", "ER-6n", "ER-6f", "Versys 300", "Versys 650", "Versys 1000", "KLR650", "KLX110", "KLX125", "KLX230", "KLX250", "KLX300R", "KLX450R", "KX65", "KX85", "KX100", "KX250", "KX250F", "KX450", "KX450F", "Vulcan S", "Vulcan 650", "Vulcan 900", "Vulcan 1500", "Vulcan 1600", "Vulcan 1700", "Vulcan 2000", "Mean Streak", "Nomad", "Drifter", "Eliminator", "W175", "W250", "W400", "W650", "W800", "Estrella", "250TR", "D-Tracker", "D-Tracker X", "スーパーシェルパ", "KLX250 Final Edition"],
    "ドゥカティ": ["Panigale V2", "Panigale V4", "Panigale V4S", "Panigale V4R", "Panigale V4 SP", "SuperSport", "SuperSport S", "Monster 797", "Monster 821", "Monster 937", "Monster 1200", "Monster 1200S", "Monster SP", "Streetfighter V2", "Streetfighter V4", "Streetfighter V4S", "Diavel 1260", "Diavel 1260S", "XDiavel", "XDiavel S", "Multistrada 950", "Multistrada V2", "Multistrada V4", "Multistrada V4S", "Multistrada 1260", "Multistrada 1260S", "Hypermotard 950", "Hypermotard 950RVE", "Hypermotard 950SP", "Hyperstrada", "Scrambler Icon", "Scrambler Cafe Racer", "Scrambler Desert Sled", "Scrambler Full Throttle", "Scrambler Sixty2", "Scrambler 1100", "DesertX"],
    "BMW": ["G310R", "G310GS", "F900R", "F900XR", "S1000R", "S1000RR", "S1000XR", "M1000RR", "R1250R", "R1250RS", "R1250RT", "R1250GS", "R1250GS Adventure", "R1200GS", "R1200GS Adventure", "R1200R", "R1200RS", "R1200RT", "F850GS", "F850GS Adventure", "F750GS", "F700GS", "R nineT", "R nineT Pure", "R nineT Racer", "R nineT Urban G/S", "R nineT Scrambler", "K1600GT", "K1600GTL", "K1600B", "K1600 Grand America", "C400X", "C400GT", "C650GT", "C650 Sport", "C evolution"],
    "KTM": ["125 Duke", "200 Duke", "250 Duke", "390 Duke", "690 Duke", "790 Duke", "890 Duke", "1290 Super Duke", "RC 125", "RC 200", "RC 390", "690 SMC R", "701 Supermoto", "1290 Super Adventure", "890 Adventure", "790 Adventure", "690 Enduro R", "500 EXC-F", "450 EXC-F", "350 EXC-F", "300 EXC", "250 EXC-F", "125 EXC", "85 SX", "65 SX", "50 SX"],
    "ハーレーダビッドソン": ["Sportster Iron 883", "Sportster Iron 1200", "Sportster Forty-Eight", "Sportster 1200 Custom", "Street 500", "Street 750", "Street Rod", "Dyna Fat Bob", "Dyna Low Rider", "Dyna Wide Glide", "Dyna Street Bob", "Dyna Super Glide", "Softail Fat Boy", "Softail Heritage Classic", "Softail Deluxe", "Softail Breakout", "Softail Fat Bob", "Softail Low Rider", "Softail Slim", "Softail Standard", "Touring Road King", "Touring Street Glide", "Touring Electra Glide", "Touring Road Glide", "Touring Ultra Limited", "LiveWire", "Pan America", "Bronx", "Sportster S"],
    "トライアンフ": ["Bonneville T100", "Bonneville T120", "Bonneville Bobber", "Bonneville Speedmaster", "Bonneville Street Twin", "Street Triple R", "Street Triple RS", "Speed Triple 1200 R", "Speed Triple 1200 RS", "Daytona 675", "Daytona 765 Moto2", "Tiger 900", "Tiger 1200", "Rocket 3", "Rocket 3 R", "Rocket 3 GT", "Thruxton R", "Thruxton RS", "Scrambler 900", "Scrambler 1200"],
    "アプリリア": ["RS 125", "RS 250", "RS 660", "RS4 125", "Tuono V4", "Tuono 660", "RSV4", "Shiver 900", "Dorsoduro 900", "Caponord 1200", "SR 150", "SXR 160"],
    "モトグッツィ": ["V7 Stone", "V7 Special", "V7 Racer", "V85 TT", "V9 Bobber", "V9 Roamer", "Griso", "California", "MGX-21"],
    "その他": ["自由入力"]
  };

  const [selectedMaker, setSelectedMaker] = useState<string>("");
  const [isCustomModel, setIsCustomModel] = useState(false);

  // Historical vehicle model data with year ranges
  const historicalModels: Record<string, Record<string, Array<{ name: string; startYear: number; endYear?: number }>>> = {
    motorcycle: {
      "カワサキ": [
        // 1960s models - the beginning
        { name: "B8 (125cc)", startYear: 1962, endYear: 1967 },
        { name: "C2SS (120cc)", startYear: 1967, endYear: 1969 },
        { name: "F3 (100cc)", startYear: 1967, endYear: 1970 },
        { name: "F4 (100cc)", startYear: 1970, endYear: 1973 },
        { name: "F5 (100cc)", startYear: 1970, endYear: 1975 },
        { name: "F6 (125cc)", startYear: 1971, endYear: 1973 },
        { name: "F7 (175cc)", startYear: 1971, endYear: 1975 },
        { name: "F8 (250cc)", startYear: 1971, endYear: 1973 },
        { name: "F9 (350cc)", startYear: 1972, endYear: 1975 },
        { name: "G31M", startYear: 1969, endYear: 1973 },
        { name: "G5 (100cc)", startYear: 1968, endYear: 1972 },
        { name: "G7 (100cc)", startYear: 1968, endYear: 1970 },
        { name: "A1 250SS Samurai", startYear: 1966, endYear: 1971 },
        { name: "A7 350SS Avenger", startYear: 1967, endYear: 1971 },
        { name: "W1 650SS", startYear: 1966, endYear: 1975 },
        { name: "W2 650SS Commander", startYear: 1968, endYear: 1975 },
        
        // Early 1970s 2-strokes
        { name: "H1 500SS Mach III", startYear: 1969, endYear: 1975 },
        { name: "H1R Mach III (レーサー)", startYear: 1970, endYear: 1972 },
        { name: "H2 750SS Mach IV", startYear: 1972, endYear: 1975 },
        { name: "H2R Mach IV (レーサー)", startYear: 1972, endYear: 1975 },
        { name: "S1 250SS Mach I", startYear: 1972, endYear: 1975 },
        { name: "S2 350SS Mach II", startYear: 1972, endYear: 1975 },
        { name: "S3 400SS Mach II", startYear: 1974, endYear: 1975 },
        
        // Classic 4-stroke Z-series
        { name: "Z1 900 Super Four", startYear: 1972, endYear: 1976 },
        { name: "Z1A 900", startYear: 1974, endYear: 1975 },
        { name: "Z1B 900", startYear: 1975, endYear: 1976 },
        { name: "Z900 A4", startYear: 1976, endYear: 1977 },
        { name: "Z1000 A1", startYear: 1977, endYear: 1979 },
        { name: "Z1000 A2", startYear: 1978, endYear: 1979 },
        { name: "Z1000 Mk II", startYear: 1979, endYear: 1980 },
        { name: "Z1-R 1000", startYear: 1978, endYear: 1980 },
        { name: "Z1-R TC", startYear: 1979, endYear: 1980 },
        { name: "Z650 B1", startYear: 1976, endYear: 1978 },
        { name: "Z650 B2", startYear: 1977, endYear: 1978 },
        { name: "Z650 B3", startYear: 1978, endYear: 1979 },
        { name: "Z650 C1", startYear: 1976, endYear: 1978 },
        { name: "Z650 C2", startYear: 1977, endYear: 1978 },
        { name: "Z650 C3", startYear: 1978, endYear: 1979 },
        { name: "Z650 SR", startYear: 1978, endYear: 1983 },
        { name: "Z400 A3", startYear: 1974, endYear: 1978 },
        { name: "Z400 D3", startYear: 1974, endYear: 1979 },
        { name: "Z250 A1", startYear: 1979, endYear: 1982 },
        { name: "Z200 A1", startYear: 1977, endYear: 1980 },
        
        // Mid-1970s smaller models
        { name: "KE125", startYear: 1974, endYear: 1985 },
        { name: "KE175", startYear: 1979, endYear: 1983 },
        { name: "KE250", startYear: 1982, endYear: 1984 },
        { name: "KM100", startYear: 1976, endYear: 1981 },
        { name: "KH100", startYear: 1976, endYear: 1981 },
        { name: "KH125", startYear: 1976, endYear: 1982 },
        { name: "KH250", startYear: 1976, endYear: 1982 },
        { name: "KH400", startYear: 1976, endYear: 1980 },
        { name: "KH500", startYear: 1976, endYear: 1977 },
        
        // Late 1970s developments
        { name: "KZ200", startYear: 1977, endYear: 1984 },
        { name: "KZ250", startYear: 1979, endYear: 1988 },
        { name: "KZ400", startYear: 1974, endYear: 1984 },
        { name: "KZ440", startYear: 1980, endYear: 1987 },
        { name: "KZ550", startYear: 1980, endYear: 1984 },
        { name: "KZ650", startYear: 1977, endYear: 1983 },
        { name: "KZ750", startYear: 1976, endYear: 1988 },
        { name: "KZ1000", startYear: 1977, endYear: 1982 },
        { name: "KZ1000 A1", startYear: 1977, endYear: 1978 },
        { name: "KZ1000 A2", startYear: 1978, endYear: 1979 },
        { name: "KZ1000 B1", startYear: 1978, endYear: 1979 },
        { name: "KZ1000 B2", startYear: 1979, endYear: 1980 },
        { name: "KZ1000 C1 Police", startYear: 1978, endYear: 1981 },
        { name: "KZ1000 D1 Z1-R", startYear: 1978, endYear: 1980 },
        { name: "KZ1000 E1", startYear: 1979, endYear: 1980 },
        { name: "KZ1000 G1 Classic", startYear: 1979, endYear: 1980 },
        { name: "KZ1000 H1 Ltd", startYear: 1980, endYear: 1981 },
        { name: "KZ1000 J1", startYear: 1981, endYear: 1982 },
        { name: "KZ1000 K1 Ltd", startYear: 1981, endYear: 1982 },
        { name: "KZ1000 M1 CSR", startYear: 1982, endYear: 1982 },
        { name: "KZ1000 R1 Eddie Lawson", startYear: 1982, endYear: 1983 },
        
        // 1980s KZ series
        { name: "KZ1000", startYear: 1977, endYear: 1982 },
        { name: "KZ1000R", startYear: 1982, endYear: 1983 },
        { name: "KZ1100", startYear: 1981, endYear: 1983 },
        { name: "KZ750", startYear: 1976, endYear: 1988 },
        { name: "KZ650", startYear: 1977, endYear: 1983 },
        { name: "KZ400", startYear: 1974, endYear: 1984 },
        { name: "KZ250", startYear: 1979, endYear: 1988 },
        
        // Z-series 1980s
        { name: "Z400FX", startYear: 1979, endYear: 1987 },
        { name: "Z500", startYear: 1979, endYear: 1982 },
        { name: "Z550FX", startYear: 1980, endYear: 1985 },
        { name: "Z650FX", startYear: 1979, endYear: 1983 },
        { name: "Z750FX", startYear: 1979, endYear: 1982 },
        { name: "Z1000R", startYear: 1982, endYear: 1986 },
        { name: "Z1000J", startYear: 1981, endYear: 1982 },
        { name: "Z1100R", startYear: 1984, endYear: 1985 },
        
        // GPZ series 1980s
        { name: "GPZ250", startYear: 1983, endYear: 1985 },
        { name: "GPZ400", startYear: 1985, endYear: 1986 },
        { name: "GPZ400R", startYear: 1985, endYear: 1987 },
        { name: "GPZ600R", startYear: 1985, endYear: 1997 },
        { name: "GPZ750", startYear: 1982, endYear: 1987 },
        { name: "GPZ750R", startYear: 1985, endYear: 1987 },
        { name: "GPZ900R Ninja", startYear: 1984, endYear: 1990 },
        { name: "GPZ1000RX", startYear: 1986, endYear: 1988 },
        
        // ZXR series 1990s
        { name: "ZXR250", startYear: 1989, endYear: 1999 },
        { name: "ZXR400", startYear: 1989, endYear: 1999 },
        { name: "ZXR750", startYear: 1989, endYear: 1995 },
        { name: "ZXR750R", startYear: 1991, endYear: 1992 },
        
        // ZZ-R series
        { name: "ZZ-R250", startYear: 1990, endYear: 2007 },
        { name: "ZZ-R400", startYear: 1990, endYear: 2006 },
        { name: "ZZ-R600", startYear: 1990, endYear: 2008 },
        { name: "ZZ-R1100", startYear: 1990, endYear: 2001 },
        { name: "ZZ-R1200", startYear: 2002, endYear: 2005 },
        
        // Modern Ninja series
        { name: "Ninja 250R", startYear: 1986, endYear: 2012 },
        { name: "Ninja 300", startYear: 2013, endYear: 2017 },
        { name: "Ninja 400", startYear: 2018 },
        { name: "Ninja 500", startYear: 1994, endYear: 2009 },
        { name: "Ninja 650", startYear: 2006 },
        { name: "Ninja ZX-6R", startYear: 1995 },
        { name: "Ninja ZX-9R", startYear: 1994, endYear: 2003 },
        { name: "Ninja ZX-10R", startYear: 2004 },
        { name: "Ninja ZX-12R", startYear: 2000, endYear: 2006 },
        { name: "Ninja ZX-14R", startYear: 2006 },
        { name: "Ninja H2", startYear: 2015 },
        { name: "Ninja H2R", startYear: 2015 },
        { name: "Ninja H2 SX", startYear: 2018 },
        
        // Modern Z series
        { name: "Z125 Pro", startYear: 2017 },
        { name: "Z250", startYear: 2013 },
        { name: "Z300", startYear: 2015, endYear: 2016 },
        { name: "Z400", startYear: 2018 },
        { name: "Z650", startYear: 2017 },
        { name: "Z800", startYear: 2013, endYear: 2016 },
        { name: "Z900", startYear: 2017 },
        { name: "Z900RS", startYear: 2018 },
        { name: "Z1000", startYear: 2003, endYear: 2020 },
        { name: "Z1000SX", startYear: 2011 },
        
        // Versys series
        { name: "Versys 300", startYear: 2017 },
        { name: "Versys 650", startYear: 2007 },
        { name: "Versys 1000", startYear: 2012 },
        
        // Off-road models
        { name: "KLR650", startYear: 1987 },
        { name: "KLX110", startYear: 2010 },
        { name: "KLX125", startYear: 2003, endYear: 2006 },
        { name: "KLX230", startYear: 2020 },
        { name: "KLX250", startYear: 1993 },
        { name: "KLX300R", startYear: 2020 },
        { name: "KLX450R", startYear: 2008, endYear: 2015 },
        { name: "KDX200", startYear: 1983, endYear: 2006 },
        { name: "KDX220", startYear: 1997, endYear: 2005 },
        
        // Retro models
        { name: "W175", startYear: 2018 },
        { name: "W250", startYear: 2019 },
        { name: "W400", startYear: 1999, endYear: 2008 },
        { name: "W650", startYear: 1999, endYear: 2008 },
        { name: "W800", startYear: 2011 },
        { name: "Estrella", startYear: 1992, endYear: 2017 },
        { name: "250TR", startYear: 2002, endYear: 2017 },
        
        // Cruisers
        { name: "Vulcan 500", startYear: 1990, endYear: 2009 },
        { name: "Vulcan 650S", startYear: 2015 },
        { name: "Vulcan 800", startYear: 1995, endYear: 2006 },
        { name: "Vulcan 900", startYear: 2006 },
        { name: "Vulcan 1500", startYear: 1987, endYear: 2008 },
        { name: "Vulcan 1600", startYear: 2003, endYear: 2008 },
        { name: "Vulcan 1700", startYear: 2009 },
        { name: "Vulcan 2000", startYear: 2004, endYear: 2010 }
      ],
      "ホンダ": [
        // 1950s-1960s Early Honda models
        { name: "Dream D-Type (98cc)", startYear: 1949, endYear: 1951 },
        { name: "Dream E-Type (146cc)", startYear: 1951, endYear: 1955 },
        { name: "Benly J (90cc)", startYear: 1953, endYear: 1958 },
        { name: "Benly JA (125cc)", startYear: 1956, endYear: 1959 },
        { name: "Benly JB (125cc)", startYear: 1959, endYear: 1962 },
        { name: "Benly JC56 (125cc)", startYear: 1956, endYear: 1959 },
        { name: "Benly JC58 (125cc)", startYear: 1958, endYear: 1962 },
        { name: "Super Cub C100", startYear: 1958, endYear: 1967 },
        { name: "Super Cub C102", startYear: 1960, endYear: 1963 },
        { name: "Super Cub C105", startYear: 1967, endYear: 1983 },
        { name: "Monkey Z100", startYear: 1961, endYear: 1969 },
        { name: "CB72 Super Sport (247cc)", startYear: 1960, endYear: 1968 },
        { name: "CB77 Super Hawk (305cc)", startYear: 1961, endYear: 1969 },
        { name: "CB92 Benly Super Sport (125cc)", startYear: 1959, endYear: 1966 },
        { name: "CA72 Dream (250cc)", startYear: 1960, endYear: 1968 },
        { name: "CA77 Dream (305cc)", startYear: 1961, endYear: 1969 },
        { name: "CA95 Benly (150cc)", startYear: 1959, endYear: 1966 },
        { name: "CB160", startYear: 1965, endYear: 1969 },
        { name: "CL72 Scrambler (250cc)", startYear: 1962, endYear: 1968 },
        { name: "CL77 Scrambler (305cc)", startYear: 1965, endYear: 1969 },
        
        // Late 1960s-Early 1970s expansion
        { name: "CB175", startYear: 1968, endYear: 1973 },
        { name: "CB350", startYear: 1968, endYear: 1973 },
        { name: "CB350K0", startYear: 1968, endYear: 1969 },
        { name: "CB350K1", startYear: 1969, endYear: 1970 },
        { name: "CB350K2", startYear: 1970, endYear: 1971 },
        { name: "CB350K3", startYear: 1971, endYear: 1972 },
        { name: "CB350K4", startYear: 1972, endYear: 1973 },
        { name: "CB450 Black Bomber", startYear: 1965, endYear: 1974 },
        { name: "CB450K0", startYear: 1965, endYear: 1966 },
        { name: "CB450K1", startYear: 1967, endYear: 1967 },
        { name: "CB450K2", startYear: 1968, endYear: 1969 },
        { name: "CB450K3", startYear: 1970, endYear: 1970 },
        { name: "CB450K4", startYear: 1971, endYear: 1971 },
        { name: "CB450K5", startYear: 1972, endYear: 1972 },
        { name: "CB450K6", startYear: 1973, endYear: 1973 },
        { name: "CB450K7", startYear: 1974, endYear: 1974 },
        { name: "CB500T Twin", startYear: 1975, endYear: 1976 },
        { name: "SL175", startYear: 1970, endYear: 1973 },
        { name: "SL350", startYear: 1969, endYear: 1973 },
        { name: "CL175", startYear: 1968, endYear: 1973 },
        { name: "CL350", startYear: 1968, endYear: 1973 },
        { name: "CL450", startYear: 1967, endYear: 1974 },
        
        // CB Four series - The revolutionary inline-4s
        { name: "CB750 Four K0", startYear: 1969, endYear: 1969 },
        { name: "CB750 Four K1", startYear: 1970, endYear: 1971 },
        { name: "CB750 Four K2", startYear: 1971, endYear: 1972 },
        { name: "CB750 Four K3", startYear: 1973, endYear: 1973 },
        { name: "CB750 Four K4", startYear: 1974, endYear: 1974 },
        { name: "CB750 Four K5", startYear: 1975, endYear: 1975 },
        { name: "CB750 Four K6", startYear: 1976, endYear: 1976 },
        { name: "CB750 Four K7", startYear: 1977, endYear: 1978 },
        { name: "CB750A Hondamatic", startYear: 1976, endYear: 1978 },
        { name: "CB750F Super Sport", startYear: 1975, endYear: 1978 },
        { name: "CB750F2", startYear: 1977, endYear: 1978 },
        { name: "CB750K", startYear: 1979, endYear: 1982 },
        { name: "CB750F", startYear: 1979, endYear: 1982 },
        { name: "CB750L", startYear: 1979, endYear: 1979 },
        { name: "CB500 Four K0", startYear: 1971, endYear: 1972 },
        { name: "CB500 Four K1", startYear: 1972, endYear: 1973 },
        { name: "CB500 Four K2", startYear: 1973, endYear: 1978 },
        { name: "CB550 Four K0", startYear: 1974, endYear: 1975 },
        { name: "CB550 Four K1", startYear: 1975, endYear: 1976 },
        { name: "CB550 Four K2", startYear: 1976, endYear: 1977 },
        { name: "CB550 Four K3", startYear: 1977, endYear: 1978 },
        { name: "CB400 Four", startYear: 1975, endYear: 1977 },
        { name: "CB400A Hondamatic", startYear: 1978, endYear: 1981 },
        
        // 1970s CB singles and twins development
        { name: "CB100", startYear: 1970, endYear: 1973 },
        { name: "CB125S", startYear: 1973, endYear: 1985 },
        { name: "CB200", startYear: 1974, endYear: 1976 },
        { name: "CB200T", startYear: 1976, endYear: 1976 },
        { name: "CB250", startYear: 1991, endYear: 1996 },
        { name: "CB360", startYear: 1974, endYear: 1976 },
        { name: "CB360G", startYear: 1974, endYear: 1976 },
        { name: "CB360T", startYear: 1975, endYear: 1976 },
        { name: "CB400T Twin", startYear: 1978, endYear: 1981 },
        { name: "CB400N", startYear: 1978, endYear: 1986 },
        { name: "CB650", startYear: 1979, endYear: 1982 },
        { name: "CB650C Custom", startYear: 1980, endYear: 1981 },
        { name: "CB750C Custom", startYear: 1980, endYear: 1982 },
        { name: "CB900C Custom", startYear: 1980, endYear: 1982 },
        { name: "CB900F", startYear: 1979, endYear: 1983 },
        { name: "CB1000C", startYear: 1983, endYear: 1987 },
        { name: "CB1100F", startYear: 1983, endYear: 1984 },
        
        // Off-road and dual-purpose 1970s
        { name: "XL125", startYear: 1974, endYear: 1987 },
        { name: "XL175", startYear: 1973, endYear: 1978 },
        { name: "XL250", startYear: 1972, endYear: 1987 },
        { name: "XL350", startYear: 1974, endYear: 1985 },
        { name: "XL500S", startYear: 1979, endYear: 1981 },
        { name: "XR75", startYear: 1973, endYear: 1978 },
        { name: "XR80", startYear: 1979, endYear: 1984 },
        { name: "XR200", startYear: 1980, endYear: 1984 },
        { name: "CR125M", startYear: 1973, endYear: 1978 },
        { name: "CR250M", startYear: 1973, endYear: 1978 },
        
        // CBX series - The legendary 6-cylinder
        { name: "CBX 1000", startYear: 1979, endYear: 1982 },
        { name: "CBX-B", startYear: 1981, endYear: 1982 },
        { name: "CBX400F", startYear: 1981, endYear: 1985 },
        { name: "CBX550F", startYear: 1982, endYear: 1986 },
        { name: "CBX650F", startYear: 1983, endYear: 1985 },
        { name: "CBX750F", startYear: 1984, endYear: 1987 },
        
        // Modern CB series
        { name: "CB250", startYear: 1991, endYear: 1996 },
        { name: "CB400SF", startYear: 1992 },
        { name: "CB400SB", startYear: 2005 },
        { name: "CB600F Hornet", startYear: 1998, endYear: 2006 },
        { name: "CB750", startYear: 1992, endYear: 2003 },
        { name: "CB900F Hornet", startYear: 2002, endYear: 2007 },
        { name: "CB1000R", startYear: 2008 },
        { name: "CB1100", startYear: 2010 },
        { name: "CB1300SF", startYear: 1998 },
        { name: "CB1300SB", startYear: 2005 },
        
        // CBR sport bikes
        { name: "CBR250R", startYear: 1987, endYear: 2012 },
        { name: "CBR250RR", startYear: 1990, endYear: 1999 },
        { name: "CBR300R", startYear: 2015 },
        { name: "CBR400R", startYear: 1986, endYear: 1999 },
        { name: "CBR600F", startYear: 1987, endYear: 1990 },
        { name: "CBR600F2", startYear: 1991, endYear: 1994 },
        { name: "CBR600F3", startYear: 1995, endYear: 1998 },
        { name: "CBR600F4", startYear: 1999, endYear: 2000 },
        { name: "CBR600F4i", startYear: 2001, endYear: 2006 },
        { name: "CBR600RR", startYear: 2003 },
        { name: "CBR650R", startYear: 2019 },
        { name: "CBR900RR FireBlade", startYear: 1992, endYear: 1999 },
        { name: "CBR929RR", startYear: 2000, endYear: 2001 },
        { name: "CBR954RR", startYear: 2002, endYear: 2003 },
        { name: "CBR1000RR", startYear: 2004 },
        { name: "CBR1100XX Super Blackbird", startYear: 1997, endYear: 2007 },
        
        // VFR V4 series
        { name: "VF500F", startYear: 1984, endYear: 1986 },
        { name: "VF1000F", startYear: 1984, endYear: 1985 },
        { name: "VF1000R", startYear: 1985, endYear: 1987 },
        { name: "VFR400R", startYear: 1986, endYear: 1992 },
        { name: "VFR750F", startYear: 1986, endYear: 1997 },
        { name: "VFR800", startYear: 1998 },
        { name: "VFR1200F", startYear: 2010, endYear: 2017 },
        
        // VTR V-twin series
        { name: "VTR250", startYear: 1998 },
        { name: "VTR1000F FireStorm", startYear: 1997, endYear: 2005 },
        { name: "VTR1000SP-1", startYear: 2000, endYear: 2001 },
        { name: "VTR1000SP-2", startYear: 2002, endYear: 2006 },
        
        // Adventure and touring
        { name: "XL125", startYear: 1974, endYear: 1985 },
        { name: "XL185", startYear: 1979, endYear: 1983 },
        { name: "XL250", startYear: 1972, endYear: 1982 },
        { name: "XL350", startYear: 1974, endYear: 1978 },
        { name: "XL500", startYear: 1979, endYear: 1982 },
        { name: "XL600", startYear: 1983, endYear: 1987 },
        { name: "XR250", startYear: 1979, endYear: 2004 },
        { name: "XR400", startYear: 1996, endYear: 2004 },
        { name: "XR600", startYear: 1985, endYear: 2000 },
        { name: "XR650L", startYear: 1993 },
        
        // Modern adventure
        { name: "NC700X", startYear: 2012, endYear: 2014 },
        { name: "NC750X", startYear: 2014 },
        { name: "CRF250L", startYear: 2012 },
        { name: "CRF300L", startYear: 2021 },
        { name: "CRF450L", startYear: 2019 },
        { name: "CRF1000L Africa Twin", startYear: 2016 },
        { name: "CRF1100L Africa Twin", startYear: 2020 },
        
        // Cruisers
        { name: "Shadow 125", startYear: 1999, endYear: 2007 },
        { name: "Shadow 400", startYear: 1997, endYear: 2008 },
        { name: "Shadow 600", startYear: 1988, endYear: 2003 },
        { name: "Shadow 750", startYear: 1983, endYear: 2014 },
        { name: "Shadow 1100", startYear: 1985, endYear: 1996 },
        { name: "VTX1300", startYear: 2003, endYear: 2009 },
        { name: "VTX1800", startYear: 2002, endYear: 2008 },
        { name: "Fury", startYear: 2010, endYear: 2016 },
        { name: "Rebel 125", startYear: 1985, endYear: 2001 },
        { name: "Rebel 250", startYear: 1985, endYear: 2016 },
        { name: "Rebel 300", startYear: 2017 },
        { name: "Rebel 500", startYear: 2017 },
        { name: "Rebel 1100", startYear: 2021 },
        
        // Touring
        { name: "Gold Wing GL1000", startYear: 1975, endYear: 1979 },
        { name: "Gold Wing GL1100", startYear: 1980, endYear: 1983 },
        { name: "Gold Wing GL1200", startYear: 1984, endYear: 1987 },
        { name: "Gold Wing GL1500", startYear: 1988, endYear: 2000 },
        { name: "Gold Wing GL1800", startYear: 2001 },
        
        // Scooters
        { name: "PCX125", startYear: 2010 },
        { name: "PCX150", startYear: 2012 },
        { name: "Forza 125", startYear: 2015 },
        { name: "Forza 300", startYear: 2013 }
      ],
      "ヤマハ": [
        // 1950s-1960s Early Yamaha history
        { name: "YA-1 Red Dragonfly (125cc)", startYear: 1955, endYear: 1958 },
        { name: "YC-1 (180cc)", startYear: 1956, endYear: 1958 },
        { name: "YD-1 (250cc)", startYear: 1957, endYear: 1959 },
        { name: "YD-2 (250cc)", startYear: 1959, endYear: 1962 },
        { name: "YD-3 (250cc)", startYear: 1962, endYear: 1965 },
        { name: "YDS-1 (250cc)", startYear: 1959, endYear: 1962 },
        { name: "YDS-2 (250cc)", startYear: 1962, endYear: 1964 },
        { name: "YDS-3 (250cc)", startYear: 1964, endYear: 1967 },
        { name: "YDS-5 (250cc)", startYear: 1967, endYear: 1968 },
        { name: "YDS-6 (250cc)", startYear: 1968, endYear: 1969 },
        { name: "YDS-7 (250cc)", startYear: 1969, endYear: 1970 },
        { name: "YM-1 (305cc)", startYear: 1960, endYear: 1962 },
        { name: "YM-2C (305cc)", startYear: 1963, endYear: 1966 },
        { name: "YR-1 (350cc)", startYear: 1967, endYear: 1968 },
        { name: "YR-2 (350cc)", startYear: 1968, endYear: 1970 },
        { name: "YR-2C (350cc)", startYear: 1969, endYear: 1970 },
        { name: "YR-3 (350cc)", startYear: 1970, endYear: 1972 },
        { name: "YL-1 (100cc)", startYear: 1966, endYear: 1967 },
        { name: "YL-2 (100cc)", startYear: 1967, endYear: 1968 },
        { name: "YL-2C (100cc)", startYear: 1968, endYear: 1970 },
        { name: "U5 (125cc)", startYear: 1967, endYear: 1971 },
        { name: "MJ1 Towny (50cc)", startYear: 1963, endYear: 1966 },
        { name: "MJ2 Towny (50cc)", startYear: 1966, endYear: 1971 },
        { name: "YF1 (80cc)", startYear: 1963, endYear: 1966 },
        { name: "YG1 (80cc)", startYear: 1964, endYear: 1967 },
        
        // Late 1960s-Early 1970s 2-stroke development
        { name: "R3 (350cc)", startYear: 1968, endYear: 1969 },
        { name: "R5 (350cc)", startYear: 1970, endYear: 1972 },
        { name: "DS7 (250cc)", startYear: 1970, endYear: 1972 },
        { name: "RD125", startYear: 1973, endYear: 1982 },
        { name: "RD200", startYear: 1974, endYear: 1976 },
        { name: "RD250", startYear: 1973, endYear: 1979 },
        { name: "RD350", startYear: 1973, endYear: 1975 },
        { name: "RD400", startYear: 1976, endYear: 1979 },
        { name: "RD400C", startYear: 1976, endYear: 1978 },
        { name: "RD400D", startYear: 1978, endYear: 1979 },
        { name: "RD400E", startYear: 1979, endYear: 1980 },
        { name: "RD400F Daytona Special", startYear: 1979, endYear: 1980 },
        
        // 4-stroke XS series development
        { name: "XS-1 (650cc)", startYear: 1970, endYear: 1971 },
        { name: "XS-1B (650cc)", startYear: 1971, endYear: 1972 },
        { name: "XS2 (650cc)", startYear: 1972, endYear: 1973 },
        { name: "XS650", startYear: 1970, endYear: 1985 },
        { name: "XS650B", startYear: 1974, endYear: 1975 },
        { name: "XS650C", startYear: 1975, endYear: 1976 },
        { name: "XS650D", startYear: 1976, endYear: 1977 },
        { name: "XS650E", startYear: 1978, endYear: 1979 },
        { name: "XS650F", startYear: 1979, endYear: 1980 },
        { name: "XS650G", startYear: 1980, endYear: 1981 },
        { name: "XS650H Heritage Special", startYear: 1981, endYear: 1983 },
        { name: "XS650SG", startYear: 1981, endYear: 1982 },
        { name: "XS650SK", startYear: 1982, endYear: 1984 },
        { name: "TX650", startYear: 1973, endYear: 1974 },
        { name: "TX500", startYear: 1973, endYear: 1976 },
        { name: "XS500", startYear: 1975, endYear: 1978 },
        { name: "XS360", startYear: 1976, endYear: 1977 },
        { name: "XS400", startYear: 1977, endYear: 1982 },
        
        // Triple and big bike development
        { name: "TX750", startYear: 1973, endYear: 1974 },
        { name: "XS750", startYear: 1977, endYear: 1979 },
        { name: "XS1100", startYear: 1978, endYear: 1982 },
        { name: "XS1100E", startYear: 1978, endYear: 1979 },
        { name: "XS1100F", startYear: 1979, endYear: 1980 },
        { name: "XS1100G", startYear: 1980, endYear: 1981 },
        { name: "XS1100H", startYear: 1981, endYear: 1982 },
        { name: "XS1100LG Midnight Special", startYear: 1980, endYear: 1981 },
        { name: "XS1100LH Midnight Special", startYear: 1981, endYear: 1982 },
        { name: "XS1100S", startYear: 1979, endYear: 1981 },
        
        // 1980s development
        { name: "XJ400", startYear: 1980, endYear: 1987 },
        { name: "XJ550", startYear: 1981, endYear: 1983 },
        { name: "XJ650", startYear: 1980, endYear: 1984 },
        { name: "XJ650 Turbo", startYear: 1982, endYear: 1984 },
        { name: "XJ750", startYear: 1981, endYear: 1983 },
        { name: "XJ900", startYear: 1983, endYear: 1994 },
        { name: "XZ550", startYear: 1982, endYear: 1985 },
        { name: "RZ250", startYear: 1980, endYear: 1990 },
        { name: "RZ350", startYear: 1984, endYear: 1986 },
        { name: "RZ500", startYear: 1984, endYear: 1986 },
        
        // Sport bike revolution
        { name: "FZ400", startYear: 1986, endYear: 1989 },
        { name: "FZ600", startYear: 1986, endYear: 1988 },
        { name: "FZ750", startYear: 1985, endYear: 1991 },
        { name: "FZR250", startYear: 1986, endYear: 1994 },
        { name: "FZR400", startYear: 1986, endYear: 1995 },
        { name: "FZR600", startYear: 1989, endYear: 1999 },
        { name: "FZR750", startYear: 1987, endYear: 1988 },
        { name: "FZR1000", startYear: 1987, endYear: 1995 },
        
        // Off-road development
        { name: "DT125", startYear: 1974, endYear: 1987 },
        { name: "DT175", startYear: 1974, endYear: 1981 },
        { name: "DT250", startYear: 1974, endYear: 1979 },
        { name: "DT400", startYear: 1975, endYear: 1977 },
        { name: "IT175", startYear: 1977, endYear: 1983 },
        { name: "IT250", startYear: 1977, endYear: 1983 },
        { name: "IT400", startYear: 1976, endYear: 1979 },
        { name: "IT425", startYear: 1980, endYear: 1981 },
        { name: "IT465", startYear: 1981, endYear: 1982 },
        { name: "XT225", startYear: 1992, endYear: 2007 },
        { name: "XT250", startYear: 1980, endYear: 1989 },
        { name: "XT500", startYear: 1976, endYear: 1981 },
        { name: "XT550", startYear: 1982, endYear: 1983 },
        { name: "XT600", startYear: 1984, endYear: 2003 },
        { name: "TT500", startYear: 1976, endYear: 1981 },
        { name: "TT600", startYear: 1983, endYear: 1986 },
        
        // Motocross development
        { name: "YZ125", startYear: 1974, endYear: 1987 },
        { name: "YZ250", startYear: 1974, endYear: 1987 },
        { name: "YZ400", startYear: 1976, endYear: 1979 },
        { name: "YZ465", startYear: 1980, endYear: 1981 },
        { name: "YZ490", startYear: 1982, endYear: 1990 },
        
        // Cruiser development
        { name: "XS850", startYear: 1980, endYear: 1981 },
        { name: "VMAX", startYear: 1985, endYear: 2007 },
        { name: "Virago 250", startYear: 1995, endYear: 2017 },
        { name: "Virago 535", startYear: 1987, endYear: 2003 },
        { name: "Virago 700", startYear: 1984, endYear: 1987 },
        { name: "Virago 750", startYear: 1981, endYear: 1997 },
        { name: "Virago 920", startYear: 1982, endYear: 1983 },
        { name: "Virago 1000", startYear: 1984, endYear: 1985 },
        { name: "Virago 1100", startYear: 1986, endYear: 1999 },
        
        // 1990s and modern sport bikes
        { name: "YZF750R", startYear: 1993, endYear: 1998 },
        { name: "YZF1000R Thunderace", startYear: 1996, endYear: 2003 },
        { name: "YZF-R1", startYear: 1998 },
        { name: "YZF-R6", startYear: 1999 },
        { name: "YZF-R25", startYear: 2014 },
        { name: "YZF-R3", startYear: 2015 },
        { name: "YZF-R7", startYear: 2022 },
        
        // Modern naked bikes
        { name: "MT-07", startYear: 2014 },
        { name: "MT-09", startYear: 2014 },
        { name: "MT-10", startYear: 2016 },
        { name: "XSR700", startYear: 2016 },
        { name: "XSR900", startYear: 2016 },
        
        // Adventure touring
        { name: "Super Ténéré XT750Z", startYear: 1989, endYear: 1997 },
        { name: "Super Ténéré XT1200Z", startYear: 2010 },
        { name: "Ténéré 700", startYear: 2019 },
        
        // Modern off-road
        { name: "WR250F", startYear: 2001 },
        { name: "WR250R", startYear: 2008 },
        { name: "WR250X", startYear: 2008 },
        { name: "WR450F", startYear: 2003 },
        
        // Modern cruisers
        { name: "VMAX (2nd gen)", startYear: 2009, endYear: 2020 },
        { name: "Bolt", startYear: 2014 },
        { name: "SCR950", startYear: 2017 }
      ],
      "スズキ": [
        // 1950s-1960s Early Suzuki history
        { name: "Power Free (36cc)", startYear: 1952, endYear: 1954 },
        { name: "Diamond Free (60cc)", startYear: 1954, endYear: 1956 },
        { name: "Colleda COX (125cc)", startYear: 1954, endYear: 1958 },
        { name: "Colleda ST (125cc)", startYear: 1958, endYear: 1962 },
        { name: "Colleda Selmate (125cc)", startYear: 1960, endYear: 1965 },
        { name: "M15 Sportsman (250cc)", startYear: 1965, endYear: 1967 },
        { name: "M12 (50cc)", startYear: 1964, endYear: 1968 },
        { name: "M31 (250cc)", startYear: 1965, endYear: 1968 },
        { name: "B100P (100cc)", startYear: 1966, endYear: 1969 },
        { name: "B105P (105cc)", startYear: 1967, endYear: 1970 },
        { name: "K10 (80cc)", startYear: 1967, endYear: 1969 },
        { name: "K11 (80cc)", startYear: 1968, endYear: 1971 },
        { name: "A50 (50cc)", startYear: 1967, endYear: 1970 },
        { name: "A100 (100cc)", startYear: 1969, endYear: 1973 },
        
        // Late 1960s 2-stroke revolution
        { name: "T10 (250cc)", startYear: 1963, endYear: 1967 },
        { name: "T20 Super Six (250cc)", startYear: 1967, endYear: 1969 },
        { name: "T21 Super Six (250cc)", startYear: 1968, endYear: 1970 },
        { name: "T125 Stinger", startYear: 1969, endYear: 1972 },
        { name: "T200", startYear: 1968, endYear: 1969 },
        { name: "T250", startYear: 1969, endYear: 1972 },
        { name: "T305", startYear: 1969, endYear: 1971 },
        { name: "T350", startYear: 1969, endYear: 1972 },
        { name: "T500 Titan", startYear: 1968, endYear: 1976 },
        { name: "T500 Cobra", startYear: 1969, endYear: 1975 },
        
        // 1970s trail and enduro development
        { name: "TC90", startYear: 1970, endYear: 1972 },
        { name: "TC100", startYear: 1973, endYear: 1977 },
        { name: "TC120", startYear: 1971, endYear: 1972 },
        { name: "TC125", startYear: 1973, endYear: 1977 },
        { name: "TC185", startYear: 1971, endYear: 1975 },
        { name: "TC250", startYear: 1972, endYear: 1975 },
        { name: "TS50", startYear: 1971, endYear: 1979 },
        { name: "TS75", startYear: 1972, endYear: 1974 },
        { name: "TS90", startYear: 1970, endYear: 1977 },
        { name: "TS100", startYear: 1973, endYear: 1981 },
        { name: "TS125", startYear: 1971, endYear: 1981 },
        { name: "TS185", startYear: 1971, endYear: 1981 },
        { name: "TS250", startYear: 1972, endYear: 1981 },
        { name: "TS400", startYear: 1971, endYear: 1977 },
        
        // GT street series (1970s)
        { name: "GT125", startYear: 1974, endYear: 1978 },
        { name: "GT185", startYear: 1973, endYear: 1977 },
        { name: "GT250", startYear: 1973, endYear: 1978 },
        { name: "GT380", startYear: 1972, endYear: 1978 },
        { name: "GT500", startYear: 1976, endYear: 1977 },
        { name: "GT550", startYear: 1972, endYear: 1977 },
        { name: "GT750 Water Buffalo", startYear: 1972, endYear: 1977 },
        
        // 4-stroke development (1970s-1980s)
        { name: "GS400", startYear: 1977, endYear: 1979 },
        { name: "GS425", startYear: 1979, endYear: 1979 },
        { name: "GS450", startYear: 1980, endYear: 1988 },
        { name: "GS500", startYear: 1989, endYear: 2009 },
        { name: "GS550", startYear: 1977, endYear: 1986 },
        { name: "GS650", startYear: 1981, endYear: 1984 },
        { name: "GS700E", startYear: 1985, endYear: 1985 },
        { name: "GS750", startYear: 1977, endYear: 1982 },
        { name: "GS850G", startYear: 1979, endYear: 1988 },
        { name: "GS1000", startYear: 1978, endYear: 1981 },
        { name: "GS1000S", startYear: 1979, endYear: 1981 },
        { name: "GS1000E", startYear: 1978, endYear: 1980 },
        { name: "GS1000G", startYear: 1980, endYear: 1981 },
        { name: "GS1000L", startYear: 1979, endYear: 1980 },
        { name: "GS1100E", startYear: 1980, endYear: 1983 },
        { name: "GS1100G", startYear: 1982, endYear: 1983 },
        { name: "GS1100L", startYear: 1980, endYear: 1982 },
        
        // Sport bike development (1980s)
        { name: "GSX250", startYear: 1980, endYear: 1987 },
        { name: "GSX400", startYear: 1980, endYear: 1987 },
        { name: "GSX550", startYear: 1983, endYear: 1987 },
        { name: "GSX600F", startYear: 1988, endYear: 1997 },
        { name: "GSX750", startYear: 1982, endYear: 1984 },
        { name: "GSX750F", startYear: 1989, endYear: 2006 },
        { name: "GSX1100", startYear: 1980, endYear: 1984 },
        { name: "GSX1100E", startYear: 1980, endYear: 1988 },
        { name: "GSX1100S Katana", startYear: 1981, endYear: 1984 },
        
        // GSXR revolution
        { name: "GSX-R250", startYear: 1987, endYear: 1995 },
        { name: "GSX-R400", startYear: 1984, endYear: 1987 },
        { name: "GSX-R600", startYear: 1992 },
        { name: "GSX-R750", startYear: 1985 },
        { name: "GSX-R1000", startYear: 2001 },
        { name: "GSX-R1100", startYear: 1986, endYear: 1998 },
        
        // Motocross development
        { name: "TM75", startYear: 1973, endYear: 1975 },
        { name: "TM100", startYear: 1973, endYear: 1975 },
        { name: "TM125", startYear: 1973, endYear: 1975 },
        { name: "TM250", startYear: 1972, endYear: 1975 },
        { name: "TM400", startYear: 1971, endYear: 1975 },
        { name: "RM50", startYear: 1978, endYear: 1982 },
        { name: "RM80", startYear: 1977, endYear: 2001 },
        { name: "RM100", startYear: 1976, endYear: 1981 },
        { name: "RM125", startYear: 1975, endYear: 2008 },
        { name: "RM250", startYear: 1976, endYear: 2008 },
        { name: "RM370", startYear: 1976, endYear: 1976 },
        { name: "RM400", startYear: 1978, endYear: 1980 },
        { name: "RM465", startYear: 1981, endYear: 1982 },
        { name: "RM500", startYear: 1983, endYear: 1984 },
        
        // Enduro/trail development
        { name: "PE175", startYear: 1978, endYear: 1984 },
        { name: "PE250", startYear: 1976, endYear: 1984 },
        { name: "PE400", startYear: 1980, endYear: 1981 },
        { name: "DR200", startYear: 1986, endYear: 1988 },
        { name: "DR250", startYear: 1982, endYear: 1995 },
        { name: "DR350", startYear: 1990, endYear: 1999 },
        { name: "DR370", startYear: 1978, endYear: 1979 },
        { name: "DR400", startYear: 1980, endYear: 1981 },
        { name: "DR500", startYear: 1981, endYear: 1983 },
        { name: "DR600", startYear: 1985, endYear: 1989 },
        { name: "DR650", startYear: 1990 },
        { name: "DR750 Big", startYear: 1988, endYear: 1989 },
        { name: "DR800 Big", startYear: 1990, endYear: 1997 },
        
        // Cruiser development
        { name: "GS450L", startYear: 1982, endYear: 1988 },
        { name: "GS550L", startYear: 1979, endYear: 1986 },
        { name: "GS650L", startYear: 1981, endYear: 1984 },
        { name: "GS850GL", startYear: 1979, endYear: 1988 },
        { name: "Intruder VS700", startYear: 1987, endYear: 1991 },
        { name: "Intruder VS750", startYear: 1988, endYear: 1991 },
        { name: "Intruder VS800", startYear: 1992, endYear: 2009 },
        { name: "Intruder VS1400", startYear: 1987, endYear: 2009 },
        { name: "Boulevard M50", startYear: 2005, endYear: 2014 },
        { name: "Boulevard M90", startYear: 2009, endYear: 2016 },
        { name: "Boulevard M109R", startYear: 2006 },
        { name: "Boulevard C50", startYear: 2001, endYear: 2017 },
        { name: "Boulevard C90", startYear: 2005, endYear: 2019 },
        { name: "Boulevard S40", startYear: 2005, endYear: 2017 },
        { name: "Boulevard S50", startYear: 2005, endYear: 2014 },
        { name: "Boulevard S83", startYear: 2005, endYear: 2014 },
        
        // Adventure/touring
        { name: "V-Strom DL650", startYear: 2004 },
        { name: "V-Strom DL1000", startYear: 2002 },
        { name: "V-Strom DL250", startYear: 2017 },
        
        // Naked/standard bikes
        { name: "Bandit GSF400", startYear: 1989, endYear: 1997 },
        { name: "Bandit GSF600", startYear: 1995, endYear: 2004 },
        { name: "Bandit GSF650", startYear: 2005, endYear: 2012 },
        { name: "Bandit GSF1200", startYear: 1996, endYear: 2006 },
        { name: "Bandit GSF1250", startYear: 2007, endYear: 2016 },
        { name: "SV650", startYear: 1999 },
        { name: "SV1000", startYear: 2003, endYear: 2007 },
        { name: "GSR250", startYear: 2012, endYear: 2017 },
        { name: "GSR400", startYear: 2008, endYear: 2010 },
        { name: "GSR600", startYear: 2006, endYear: 2011 },
        { name: "GSR750", startYear: 2011, endYear: 2016 },
        { name: "GSX250R", startYear: 2017 },
        { name: "GSX-S125", startYear: 2017 },
        { name: "GSX-S150", startYear: 2017 },
        { name: "GSX-S250", startYear: 2017 },
        { name: "GSX-S300", startYear: 2018 },
        { name: "GSX-S750", startYear: 2015 },
        { name: "GSX-S1000", startYear: 2015 },
        
        // Sport touring
        { name: "GSX650F", startYear: 2008, endYear: 2016 },
        { name: "GSX1250FA", startYear: 2010, endYear: 2016 },
        
        // Supermoto/supermotard
        { name: "DR-Z400SM", startYear: 2005, endYear: 2009 },
        { name: "DRZ400S", startYear: 2000 },
        { name: "DRZ400E", startYear: 2000, endYear: 2007 },
        
        // Scooters
        { name: "Address V50", startYear: 1991, endYear: 2007 },
        { name: "Address V100", startYear: 1991, endYear: 2008 },
        { name: "Address V125", startYear: 2005 },
        { name: "Burgman 125", startYear: 2007 },
        { name: "Burgman 200", startYear: 2007, endYear: 2013 },
        { name: "Burgman 400", startYear: 1999, endYear: 2006 },
        { name: "Burgman 650", startYear: 2003 },
        { name: "Skywave 250", startYear: 1998, endYear: 2009 },
        { name: "Skywave 400", startYear: 1999, endYear: 2008 },
        { name: "Skywave 650", startYear: 2003, endYear: 2012 }
      ]
    },
    car: {
      "ホンダ": [
        { name: "N360", startYear: 1967, endYear: 1972 },
        { name: "N600", startYear: 1967, endYear: 1973 },
        { name: "Z360", startYear: 1970, endYear: 1974 },
        { name: "ライフ (初代)", startYear: 1971, endYear: 1974 },
        { name: "シビック (初代)", startYear: 1972, endYear: 1979 },
        { name: "アコード (初代)", startYear: 1976, endYear: 1981 },
        { name: "プレリュード (初代)", startYear: 1978, endYear: 1982 },
        { name: "シティ", startYear: 1981, endYear: 1994 },
        { name: "シビック (2代目)", startYear: 1979, endYear: 1983 },
        { name: "アコード (2代目)", startYear: 1981, endYear: 1985 },
        { name: "CR-X", startYear: 1983, endYear: 1991 },
        { name: "インテグラ (初代)", startYear: 1985, endYear: 1989 },
        { name: "NSX (初代)", startYear: 1990, endYear: 2005 },
        { name: "S2000", startYear: 1999, endYear: 2009 },
        { name: "シビック タイプR (EK9)", startYear: 1997, endYear: 2000 },
        { name: "シビック タイプR (EP3)", startYear: 2001, endYear: 2005 },
        { name: "シビック タイプR (FD2)", startYear: 2007, endYear: 2010 },
        { name: "シビック タイプR (FK2)", startYear: 2015, endYear: 2017 },
        { name: "シビック タイプR (FK8)", startYear: 2017, endYear: 2021 },
        { name: "インテグラ タイプR (DC2)", startYear: 1995, endYear: 2001 },
        { name: "インテグラ タイプR (DC5)", startYear: 2001, endYear: 2006 },
        { name: "フィット (初代)", startYear: 2001, endYear: 2007 },
        { name: "フィット (2代目)", startYear: 2007, endYear: 2013 },
        { name: "フィット (3代目)", startYear: 2013, endYear: 2020 },
        { name: "フィット (4代目)", startYear: 2020 }
      ],
      "トヨタ": [
        { name: "コロナ", startYear: 1957, endYear: 2001 },
        { name: "カローラ (初代)", startYear: 1966, endYear: 1970 },
        { name: "セリカ (初代)", startYear: 1970, endYear: 1977 },
        { name: "カリーナ", startYear: 1970, endYear: 2001 },
        { name: "スープラ (初代 A40/A50)", startYear: 1978, endYear: 1981 },
        { name: "スープラ (2代目 A60)", startYear: 1981, endYear: 1986 },
        { name: "スープラ (3代目 A70)", startYear: 1986, endYear: 1993 },
        { name: "スープラ (4代目 A80)", startYear: 1993, endYear: 2002 },
        { name: "スープラ (5代目 A90)", startYear: 2019 },
        { name: "AE86 (ハチロク)", startYear: 1983, endYear: 1987 },
        { name: "MR2 (初代 SW20)", startYear: 1989, endYear: 1999 },
        { name: "MR2 (2代目 SW30)", startYear: 1999, endYear: 2007 },
        { name: "86 (ZN6)", startYear: 2012, endYear: 2021 },
        { name: "GR86 (ZN8)", startYear: 2021 },
        { name: "プリウス (初代)", startYear: 1997, endYear: 2003 },
        { name: "プリウス (2代目)", startYear: 2003, endYear: 2009 },
        { name: "プリウス (3代目)", startYear: 2009, endYear: 2015 },
        { name: "プリウス (4代目)", startYear: 2015 },
        { name: "レクサス LFA", startYear: 2010, endYear: 2012 },
        { name: "ランドクルーザー 40系", startYear: 1960, endYear: 1984 },
        { name: "ランドクルーザー 60系", startYear: 1980, endYear: 1990 },
        { name: "ランドクルーザー 70系", startYear: 1984 },
        { name: "ランドクルーザー 80系", startYear: 1990, endYear: 1998 },
        { name: "ランドクルーザー 100系", startYear: 1998, endYear: 2007 },
        { name: "ランドクルーザー 200系", startYear: 2007, endYear: 2021 },
        { name: "ランドクルーザー 300系", startYear: 2021 }
      ],
      "日産": [
        { name: "スカイライン (初代 ALSI)", startYear: 1957, endYear: 1963 },
        { name: "スカイライン (2代目 S50)", startYear: 1963, endYear: 1968 },
        { name: "スカイライン GT-R (初代 PGC10)", startYear: 1969, endYear: 1972 },
        { name: "スカイライン (3代目 C10)", startYear: 1968, endYear: 1972 },
        { name: "スカイライン (4代目 C110)", startYear: 1972, endYear: 1977 },
        { name: "スカイライン (5代目 C210)", startYear: 1977, endYear: 1981 },
        { name: "スカイライン (6代目 R30)", startYear: 1981, endYear: 1985 },
        { name: "スカイライン (7代目 R31)", startYear: 1985, endYear: 1989 },
        { name: "スカイライン GT-R (R32)", startYear: 1989, endYear: 1994 },
        { name: "スカイライン GT-R (R33)", startYear: 1995, endYear: 1998 },
        { name: "スカイライン GT-R (R34)", startYear: 1999, endYear: 2002 },
        { name: "スカイライン GT-R (R35)", startYear: 2007 },
        { name: "フェアレディZ (初代 S30)", startYear: 1969, endYear: 1978 },
        { name: "フェアレディZ (2代目 S130)", startYear: 1978, endYear: 1983 },
        { name: "フェアレディZ (3代目 Z31)", startYear: 1983, endYear: 1989 },
        { name: "フェアレディZ (4代目 Z32)", startYear: 1989, endYear: 2000 },
        { name: "フェアレディZ (5代目 Z33)", startYear: 2002, endYear: 2008 },
        { name: "フェアレディZ (6代目 Z34)", startYear: 2008, endYear: 2022 },
        { name: "フェアレディZ (7代目 Z)", startYear: 2022 },
        { name: "シルビア (初代 CSP311)", startYear: 1965, endYear: 1968 },
        { name: "シルビア S10", startYear: 1975, endYear: 1979 },
        { name: "シルビア S12", startYear: 1983, endYear: 1988 },
        { name: "シルビア S13", startYear: 1988, endYear: 1993 },
        { name: "シルビア S14", startYear: 1993, endYear: 1998 },
        { name: "シルビア S15", startYear: 1999, endYear: 2002 },
        { name: "180SX", startYear: 1989, endYear: 1998 },
        { name: "200SX", startYear: 1995, endYear: 1998 },
        { name: "240SX", startYear: 1989, endYear: 1998 },
        { name: "プリメーラ", startYear: 1990, endYear: 2005 },
        { name: "マーチ (初代 K10)", startYear: 1982, endYear: 1992 },
        { name: "マーチ (2代目 K11)", startYear: 1992, endYear: 2002 },
        { name: "マーチ (3代目 K12)", startYear: 2002, endYear: 2010 },
        { name: "マーチ (4代目 K13)", startYear: 2010 }
      ]
    }
  };



  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <div className="max-w-md mx-auto text-center">
            <p>認証状態を確認中...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">ログインが必要です</h2>
          <p className="mb-6">出品するにはログインしてください。</p>
          <button 
            onClick={() => {
              // Use the actual Replit domain for authentication
              window.open(`https://fc5ec327-a1c2-4205-8ffd-44af65f60450-00-2ubrjzzw9v54d.pike.replit.dev/api/auth/login`, '_self');
            }}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ログイン
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            出品を作成
          </h1>
          <Button
            type="button"
            onClick={generateTestData}
            variant="outline"
            className="bg-blue-600/20 border-blue-500 text-blue-300 hover:bg-blue-600/30 hover:text-blue-200"
            data-testid="button-generate-test-data"
          >
            🎲 テストデータ入力
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Vehicle Details */}
            <Card className="bg-gray-800/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">車両詳細</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">カテゴリー</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          // カテゴリが変更されたらすべてリセット
                          setSelectedMaker("");

                          form.setValue("make", "");
                          form.setValue("year", 2001);
                          form.setValue("model", "");
                          setIsCustomModel(false);
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="カテゴリーを選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="car">自動車</SelectItem>
                          <SelectItem value="motorcycle">バイク</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Country Selection */}
                <FormItem>
                  <FormLabel className="text-sm font-medium text-white">
                    国・地域
                  </FormLabel>
                  <Select 
                    value={selectedCountry} 
                    onValueChange={(value) => {
                      setSelectedCountry(value);
                      // Reset make when country changes
                      setSelectedMaker("");
                      form.setValue("make", "");
                      form.setValue("year", 2001);
                      form.setValue("model", "");
                      setIsCustomModel(false);
                    }}
                  >
                    <SelectTrigger data-testid="select-country">
                      <SelectValue placeholder="国・地域を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {(countriesData as any)?.countries?.map((country: any) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      )) || (
                        <>
                          <SelectItem value="all">すべての国</SelectItem>
                          <SelectItem value="japan">日本</SelectItem>
                          <SelectItem value="germany">ドイツ</SelectItem>
                          <SelectItem value="italy">イタリア</SelectItem>
                          <SelectItem value="usa">アメリカ</SelectItem>
                          <SelectItem value="france">フランス</SelectItem>
                          <SelectItem value="uk">イギリス</SelectItem>
                          <SelectItem value="sweden">スウェーデン</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </FormItem>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="make"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-white">
                          メーカー <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select 
                          value={field.value} 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedMaker(value);
                            // Reset dependent fields when maker changes
                            form.setValue("year", 2001);
                            form.setValue("model", "");
                            setIsCustomModel(false);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-make" className={form.formState.errors.make ? "border-red-500" : ""}>
                              <SelectValue placeholder={
                                form.watch("category") ? (makesLoading ? "読み込み中..." : "メーカーを選択") : "カテゴリを先に選択してください"
                              } />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[200px]">
                            {makesLoading ? (
                              <SelectItem value="loading" disabled>読み込み中...</SelectItem>
                            ) : makesData && makesData.makes.length > 0 ? (
                              makesData.makes.map((maker: string) => (
                                <SelectItem key={maker} value={maker}>
                                  {maker}
                                </SelectItem>
                              ))
                            ) : form.watch("category") ? (
                              <SelectItem value="none" disabled>メーカーが見つかりません</SelectItem>
                            ) : (
                              <SelectItem value="none" disabled>カテゴリを先に選択してください</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-500 text-xs mt-1" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-white">
                          年式 <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select 
                          value={field.value?.toString() || ""} 
                          onValueChange={(value) => {
                            const year = parseInt(value);
                            field.onChange(year);
                            // Reset model when year changes
                            form.setValue("model", "");
                            setIsCustomModel(false);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-year" className={form.formState.errors.year ? "border-red-500" : ""}>
                              <SelectValue placeholder={
                                selectedMaker ? "年式を選択" : "メーカーを先に選択してください"
                              } />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[200px]">
                            {yearsLoading ? (
                              <SelectItem value="loading" disabled>読み込み中...</SelectItem>
                            ) : yearsData && yearsData.years.length > 0 ? (
                              yearsData.years.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}年
                                </SelectItem>
                              ))
                            ) : selectedMaker ? (
                              <SelectItem value="none" disabled>年式が見つかりません</SelectItem>
                            ) : (
                              <SelectItem value="none" disabled>メーカーを先に選択してください</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-500 text-xs mt-1" />
                      </FormItem>
                    )}
                  />

                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-white">
                          モデル <span className="text-red-500">*</span>
                        </FormLabel>
                        {isCustomModel ? (
                          <FormControl>
                            <Input 
                              placeholder="モデル名を入力"
                              {...field}
                              data-testid="input-model-custom"
                              className={form.formState.errors.model ? "border-red-500" : ""}
                            />
                          </FormControl>
                        ) : (
                          <Select 
                            value={field.value} 
                            onValueChange={(value) => {
                              if (value === "自由入力") {
                                setIsCustomModel(true);
                                field.onChange("");
                              } else {
                                setIsCustomModel(false);
                                field.onChange(value);
                              }
                            }}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-model" className={form.formState.errors.model ? "border-red-500" : ""}>
                                <SelectValue placeholder={
                                  selectedMaker && form.watch("year") ? "モデルを選択" : 
                                  !selectedMaker ? "メーカーを先に選択してください" :
                                  "年式を先に選択してください"
                                } />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[200px]">
                              {modelsLoading ? (
                                <SelectItem value="loading" disabled>読み込み中...</SelectItem>
                              ) : modelsData && modelsData.models.length > 0 ? (
                                <>
                                  {modelsData.models.map((model) => (
                                    <SelectItem key={model} value={model}>
                                      {model}
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="自由入力">
                                    自由入力
                                  </SelectItem>
                                </>
                              ) : selectedMaker && form.watch("year") ? (
                                <SelectItem value="none" disabled>モデルが見つかりません</SelectItem>
                              ) : !selectedMaker ? (
                                <SelectItem value="none" disabled>メーカーを先に選択してください</SelectItem>
                              ) : (
                                <SelectItem value="none" disabled>年式を先に選択してください</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        )}

                        {isCustomModel && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomModel(false);
                              form.setValue("model", "");
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                          >
                            ← ドロップダウンに戻る
                          </button>
                        )}
                        <FormMessage className="text-red-500 text-xs mt-1" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="vin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-white">
                        車体番号 (VIN/シャシーナンバー)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="例: JH4DC1340MS123456"
                          {...field}
                          data-testid="input-vin"
                          className="uppercase"
                        />
                      </FormControl>
                      <p className="text-xs text-gray-300">
                        車体番号は車検証に記載されています。記載がある場合は入力してください。
                      </p>
                      <FormMessage className="text-red-500 text-xs mt-1" />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="mileage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">走行距離 (km)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="例: 85000"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
                            data-testid="input-mileage"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mileageVerified"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-mileage-verified"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal text-white">
                            この走行距離は正確であることを確認しました
                          </FormLabel>
                          <p className="text-xs text-gray-300">
                            メーターの改ざんがなく、記録された走行距離が実際の距離であることを保証します
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ownershipMileage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">所有期間中に追加した走行距離 (km)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="例: 15000"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
                            data-testid="input-ownership-mileage"
                          />
                        </FormControl>
                        <p className="text-xs text-gray-300">
                          あなたが所有していた期間中に走行した距離を入力してください
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card className="bg-gray-800/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">基本情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="specifications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">仕様・装備</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="エンジン仕様、トランスミッション、装備品、オプション、改造点などを記載してください..."
                            className="min-h-[120px]"
                            data-testid="textarea-specifications"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />



                  <FormField
                    control={form.control}
                    name="hasAccidentHistory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-white">
                          事故歴(フレーム修復に及ぶような事故) <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-accident-history">
                              <SelectValue placeholder="事故歴を選択してください" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="no">ない</SelectItem>
                            <SelectItem value="yes">ある</SelectItem>
                            <SelectItem value="unknown">わからない</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="purchaseYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">購入した年</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-purchase-year">
                              <SelectValue placeholder="購入年を選択してください" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 30 }, (_, i) => {
                              const year = new Date().getFullYear() - i;
                              return (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}年
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="modifiedParts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">改造されている場所</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="エアロパーツ、エンジン改造、足回り変更など..."
                            className="min-h-[100px]"
                            {...field}
                            data-testid="textarea-modified-parts"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="prePurchaseInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">購入以前の知っている情報</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="前オーナーの使用状況、メンテナンス歴など..."
                            className="min-h-[100px]"
                            {...field}
                            data-testid="textarea-pre-purchase-info"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ownerMaintenance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">出品者がしたメンテナンス</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="オイル交換、部品交換、修理など..."
                            className="min-h-[100px]"
                            {...field}
                            data-testid="textarea-owner-maintenance"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="knownIssues"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">車両の問題点</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="気になる点、修理が必要な箇所など..."
                            className="min-h-[100px]"
                            {...field}
                            data-testid="textarea-known-issues"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="highlights"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">アピールポイント</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="この車両の魅力的なポイント、レア度、投資価値、希少性などをアピールしてください..."
                            className="min-h-[100px]"
                            data-testid="textarea-highlights"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>



                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="locationText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">都道府県</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            // 都道府県が変更されたら市町村をリセット
                            form.setValue('city', '');
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-location">
                              <SelectValue placeholder="都道府県を選択" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="北海道">北海道</SelectItem>
                            <SelectItem value="青森県">青森県</SelectItem>
                            <SelectItem value="岩手県">岩手県</SelectItem>
                            <SelectItem value="宮城県">宮城県</SelectItem>
                            <SelectItem value="秋田県">秋田県</SelectItem>
                            <SelectItem value="山形県">山形県</SelectItem>
                            <SelectItem value="福島県">福島県</SelectItem>
                            <SelectItem value="茨城県">茨城県</SelectItem>
                            <SelectItem value="栃木県">栃木県</SelectItem>
                            <SelectItem value="群馬県">群馬県</SelectItem>
                            <SelectItem value="埼玉県">埼玉県</SelectItem>
                            <SelectItem value="千葉県">千葉県</SelectItem>
                            <SelectItem value="東京都">東京都</SelectItem>
                            <SelectItem value="神奈川県">神奈川県</SelectItem>
                            <SelectItem value="新潟県">新潟県</SelectItem>
                            <SelectItem value="富山県">富山県</SelectItem>
                            <SelectItem value="石川県">石川県</SelectItem>
                            <SelectItem value="福井県">福井県</SelectItem>
                            <SelectItem value="山梨県">山梨県</SelectItem>
                            <SelectItem value="長野県">長野県</SelectItem>
                            <SelectItem value="岐阜県">岐阜県</SelectItem>
                            <SelectItem value="静岡県">静岡県</SelectItem>
                            <SelectItem value="愛知県">愛知県</SelectItem>
                            <SelectItem value="三重県">三重県</SelectItem>
                            <SelectItem value="滋賀県">滋賀県</SelectItem>
                            <SelectItem value="京都府">京都府</SelectItem>
                            <SelectItem value="大阪府">大阪府</SelectItem>
                            <SelectItem value="兵庫県">兵庫県</SelectItem>
                            <SelectItem value="奈良県">奈良県</SelectItem>
                            <SelectItem value="和歌山県">和歌山県</SelectItem>
                            <SelectItem value="鳥取県">鳥取県</SelectItem>
                            <SelectItem value="島根県">島根県</SelectItem>
                            <SelectItem value="岡山県">岡山県</SelectItem>
                            <SelectItem value="広島県">広島県</SelectItem>
                            <SelectItem value="山口県">山口県</SelectItem>
                            <SelectItem value="徳島県">徳島県</SelectItem>
                            <SelectItem value="香川県">香川県</SelectItem>
                            <SelectItem value="愛媛県">愛媛県</SelectItem>
                            <SelectItem value="高知県">高知県</SelectItem>
                            <SelectItem value="福岡県">福岡県</SelectItem>
                            <SelectItem value="佐賀県">佐賀県</SelectItem>
                            <SelectItem value="長崎県">長崎県</SelectItem>
                            <SelectItem value="熊本県">熊本県</SelectItem>
                            <SelectItem value="大分県">大分県</SelectItem>
                            <SelectItem value="宮崎県">宮崎県</SelectItem>
                            <SelectItem value="鹿児島県">鹿児島県</SelectItem>
                            <SelectItem value="沖縄県">沖縄県</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">市町村</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={!watchedLocation || !cityData[watchedLocation]}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-city">
                              <SelectValue placeholder={
                                watchedLocation && cityData[watchedLocation] 
                                  ? "市町村を選択" 
                                  : "都道府県を先に選択してください"
                              } />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[200px]">
                            {watchedLocation && cityData[watchedLocation] ? (
                              cityData[watchedLocation].map((city) => (
                                <SelectItem key={city} value={city}>
                                  {city}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>都道府県を選択してください</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Photos */}
            <Card className="bg-gray-800/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">画像</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <PhotoManager
                    photos={uploadedPhotos}
                    onPhotosChange={handlePhotoUpload}
                    maxFiles={10}
                    className="w-full"
                  />

                </div>
              </CardContent>
            </Card>

            {/* Video URL */}
            <Card className="bg-gray-800/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">🎬 動画リンク (任意)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="videoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">動画URL</FormLabel>
                      <FormControl>
                        <Input 
                          type="url"
                          placeholder="例: https://www.youtube.com/watch?v=VIDEO_ID または https://vimeo.com/VIDEO_ID"
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          {...field}
                          data-testid="input-video-url"
                        />
                      </FormControl>
                      <div className="text-sm text-gray-300">
                        <p>YouTube、Vimeoの動画URLを入力してください。</p>
                        <p>対応形式：</p>
                        <ul className="list-disc list-inside ml-2 text-xs">
                          <li>YouTube: https://www.youtube.com/watch?v=...</li>
                          <li>YouTube Shorts: https://www.youtube.com/shorts/...</li>
                          <li>YouTube短縮: https://youtu.be/...</li>
                          <li>Vimeo: https://vimeo.com/...</li>
                        </ul>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {form.watch("videoUrl") && validateAndNormalizeVideoUrl(form.watch("videoUrl") || "") && (
                  <div className="mt-4 space-y-3">
                    <div className="p-3 bg-green-900/30 border border-green-700/50 rounded-lg">
                      <p className="text-sm text-green-300 flex items-center gap-2">
                        ✓ 有効な動画URLです - 出品ページに埋め込みで表示されます
                      </p>
                    </div>
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-300 mb-3">プレビュー:</p>
                      <VideoEmbed videoUrl={form.watch("videoUrl") || ""} title="動画プレビュー" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents */}
            <Card className="bg-gray-800/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">車検・書類情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 車検情報 */}
                <div className="space-y-4 p-4 border rounded-lg bg-gray-800 border-gray-600">
                  <h4 className="font-medium text-white">車検情報</h4>
                  
                  <FormField
                    control={form.control}
                    name="hasShaken"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-white">車検状況</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={field.value === true}
                                onChange={() => field.onChange(true)}
                                className="w-4 h-4"
                                data-testid="radio-shaken-yes"
                              />
                              <span className="text-sm text-white">車検あり</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={field.value === false}
                                onChange={() => field.onChange(false)}
                                className="w-4 h-4"
                                data-testid="radio-shaken-no"
                              />
                              <span className="text-sm text-white">車検なし</span>
                            </label>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("hasShaken") === true && (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="shakenYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">車検有効期限（年）</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-gray-700 border-white/20 text-white" data-testid="select-shaken-year">
                                  <SelectValue placeholder="年を選択" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.from({ length: 4 }, (_, i) => {
                                  const year = new Date().getFullYear() + i;
                                  return (
                                    <SelectItem key={year} value={year.toString()}>
                                      {year}年
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="shakenMonth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">車検有効期限（月）</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-gray-700 border-white/20 text-white" data-testid="select-shaken-month">
                                  <SelectValue placeholder="月を選択" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => {
                                  const month = (i + 1).toString().padStart(2, '0');
                                  return (
                                    <SelectItem key={month} value={month}>
                                      {i + 1}月
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="isTemporaryRegistration"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-temporary-registration"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal text-white">
                            一時抹消登録済み
                          </FormLabel>
                          <p className="text-xs text-gray-300">
                            車両が一時的に使用停止状態にある場合はチェックしてください
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 車検証 */}
                  <DocumentUpload
                    documentType="registration_certificate"
                    title="車検証"
                    icon="📋"
                    onUploadComplete={(url, fileName) => handleDocumentUpload('registration_certificate', url, fileName)}
                    existingDocument={uploadedDocuments.find(doc => doc.type === 'registration_certificate')}
                    onRemove={() => handleDocumentRemove('registration_certificate')}
                  />

                  {/* 譲渡証明書 */}
                  <DocumentUpload
                    documentType="transfer_certificate"
                    title="譲渡証明書"
                    icon="📄"
                    onUploadComplete={(url, fileName) => handleDocumentUpload('transfer_certificate', url, fileName)}
                    existingDocument={uploadedDocuments.find(doc => doc.type === 'transfer_certificate')}
                    onRemove={() => handleDocumentRemove('transfer_certificate')}
                  />

                  {/* 印鑑証明書 */}
                  <DocumentUpload
                    documentType="registration_seal"
                    title="印鑑証明書"
                    icon="🔖"
                    onUploadComplete={(url, fileName) => handleDocumentUpload('registration_seal', url, fileName)}
                    existingDocument={uploadedDocuments.find(doc => doc.type === 'registration_seal')}
                    onRemove={() => handleDocumentRemove('registration_seal')}
                  />

                  {/* 自賠責保険証明書 */}
                  <DocumentUpload
                    documentType="insurance_certificate"
                    title="自賠責保険証明書"
                    icon="🛡️"
                    onUploadComplete={(url, fileName) => handleDocumentUpload('insurance_certificate', url, fileName)}
                    existingDocument={uploadedDocuments.find(doc => doc.type === 'insurance_certificate')}
                    onRemove={() => handleDocumentRemove('insurance_certificate')}
                  />

                  {/* 整備記録簿 */}
                  <DocumentUpload
                    documentType="maintenance_record"
                    title="整備記録簿"
                    icon="🔧"
                    onUploadComplete={(url, fileName) => handleDocumentUpload('maintenance_record', url, fileName)}
                    existingDocument={uploadedDocuments.find(doc => doc.type === 'maintenance_record')}
                    onRemove={() => handleDocumentRemove('maintenance_record')}
                  />

                  {/* その他書類 */}
                  <DocumentUpload
                    documentType="other"
                    title="その他書類"
                    icon="📎"
                    onUploadComplete={(url, fileName) => handleDocumentUpload('other', url, fileName)}
                    existingDocument={uploadedDocuments.find(doc => doc.type === 'other')}
                    onRemove={() => handleDocumentRemove('other')}
                  />
                </div>

                {uploadedDocuments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-white">アップロード済み書類</h4>
                    <div className="grid gap-2">
                      {uploadedDocuments.map((doc, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                          <span>📄</span>
                          <div className="flex-1">
                            <span className="text-sm font-medium">{getDocumentTypeName(doc.type)}</span>
                            <p className="text-xs text-gray-500">{doc.fileName}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-200">
                    <strong>書類について</strong><br/>
                    • 必要に応じて関連書類をアップロードしてください<br/>
                    • JPEGまたはPDFファイルをアップロードしてください<br/>
                    • ファイルサイズは10MB以下でお願いします
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card className="bg-gray-800/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">価格設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startingPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">開始価格 (¥)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="例: 1000000"
                            {...field}
                            data-testid="input-starting-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reservePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">リザーブ価格 (¥) - 任意</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="例: 3000000"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-reserve-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">オークションスケジュールの希望</h3>
                  <p className="text-sm text-gray-300">
                    希望の曜日と時間を選択してください。最終的なスケジュールは管理者が決定します。
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="preferredDayOfWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">希望曜日</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="曜日を選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="sunday">日曜日</SelectItem>
                              <SelectItem value="monday">月曜日</SelectItem>
                              <SelectItem value="tuesday">火曜日</SelectItem>
                              <SelectItem value="wednesday">水曜日</SelectItem>
                              <SelectItem value="thursday">木曜日</SelectItem>
                              <SelectItem value="friday">金曜日</SelectItem>
                              <SelectItem value="saturday">土曜日</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="preferredStartTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">希望開始時間</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="開始時間を選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="09:00">09:00</SelectItem>
                              <SelectItem value="10:00">10:00</SelectItem>
                              <SelectItem value="11:00">11:00</SelectItem>
                              <SelectItem value="12:00">12:00</SelectItem>
                              <SelectItem value="13:00">13:00</SelectItem>
                              <SelectItem value="14:00">14:00</SelectItem>
                              <SelectItem value="15:00">15:00</SelectItem>
                              <SelectItem value="16:00">16:00</SelectItem>
                              <SelectItem value="17:00">17:00</SelectItem>
                              <SelectItem value="18:00">18:00</SelectItem>
                              <SelectItem value="19:00">19:00</SelectItem>
                              <SelectItem value="20:00">20:00</SelectItem>
                              <SelectItem value="21:00">21:00</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="auctionDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">希望オークション期間</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="期間を選択" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="3minutes">3分間（デモ用）</SelectItem>
                            <SelectItem value="5minutes">5分間</SelectItem>
                            <SelectItem value="30minutes">30分間</SelectItem>
                            <SelectItem value="5days">5日間</SelectItem>
                            <SelectItem value="7days">7日間（推奨）</SelectItem>
                            <SelectItem value="10days">10日間</SelectItem>
                            <SelectItem value="14days">14日間</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex space-x-4">
              <Button 
                type="button"
                variant="outline"
                className="text-gray-300 border-white/20 hover:bg-white/10 hover:text-white"
                onClick={() => navigate("/")}
                data-testid="button-cancel"
              >
                キャンセル
              </Button>
              <Button 
                type="submit"
                className="btn-premium text-white"
                disabled={createListingMutation.isPending}
                data-testid="button-submit"
                onClick={(e) => {
                  console.log("Submit button clicked");
                  console.log("Form is valid:", form.formState.isValid);
                  console.log("Form errors:", form.formState.errors);
                }}
              >
                {createListingMutation.isPending ? "作成中..." : "出品を作成"}
              </Button>
                </div>
              </form>
            </Form>
      </div>
    </Layout>
  );
}