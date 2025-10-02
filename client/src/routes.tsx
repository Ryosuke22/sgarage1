import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PageLoading } from "@/components/LoadingSpinner";
import { logPerformanceMetrics, preloadCriticalResources } from "@/utils/performance";
import { lazyWithPreload } from 'react-lazy-with-preload';

// Lazy load all major pages with preload support for popular pages
const Landing = lazy(() => import("@/pages/Landing"));
const Home = lazyWithPreload(() => import("@/pages/Home"));
const Auth = lazy(() => import("@/pages/Auth"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const ListingDetail = lazyWithPreload(() => import("@/pages/ListingDetail"));
const ListingDetailPage = lazy(() => import("@/pages/ListingDetailPage"));
const ListingPreview = lazy(() => import("@/pages/ListingPreview"));
const CreateListing = lazyWithPreload(() => import("@/pages/CreateListing"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const UserManagement = lazy(() => import("@/pages/UserManagement"));
const ObjectManagement = lazy(() => import("@/pages/ObjectManagement"));
const Profile = lazy(() => import("@/pages/Profile"));
const Settings = lazy(() => import("@/pages/Settings"));
const WatchList = lazy(() => import("@/pages/WatchList"));
const PhotoGuide = lazy(() => import("@/pages/PhotoGuide"));
const CompanyInfo = lazy(() => import("@/pages/CompanyInfo"));
const ListingGuide = lazy(() => import("@/pages/ListingGuide"));
const HowItWorks = lazy(() => import("@/pages/HowItWorks"));
const Fees = lazy(() => import("@/pages/Fees"));
const UploadTest = lazy(() => import("@/pages/UploadTest"));
const PerformanceDashboard = lazy(() => import("@/pages/PerformanceDashboard"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Create a login prompt component
const LoginPrompt = lazy(() => import("@/components/LoginPrompt"));

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoading />}>
      {children}
    </Suspense>
  );
}

export function AppRoutes() {
  const { isAuthenticated, isLoading, user, error } = useAuth();

  console.log("Router state:", { isAuthenticated, isLoading, user: !!user, error: !!error });
  console.log("User data:", user);
  console.log("Current path:", window.location.pathname);

  // Initialize performance monitoring and preloading
  useEffect(() => {
    logPerformanceMetrics();
    preloadCriticalResources();
    
    // Preload critical pages based on user context
    const timer = setTimeout(() => {
      // Always preload CreateListing (most important for conversions)
      CreateListing.preload();
      
      // Preload Home page if not already there
      if (window.location.pathname !== '/') {
        Home.preload();
      }
      
      // Preload ListingDetail (users often browse listings)
      setTimeout(() => {
        ListingDetail.preload();
      }, 1000);
    }, 1500); // 1.5秒後にプリロード開始（さらに早く）
    
    return () => clearTimeout(timer);
  }, []);

  // Only show loading for brief initial load
  if (isLoading && !user && !error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">読み込み中...</div>
      </div>
    );
  }

  // Development mode: Force authentication to bypass issues
  const forceAuthenticated = process.env.NODE_ENV === 'development' ? true : !!user;

  if (!(isAuthenticated || forceAuthenticated)) {
    return (
      <SuspenseWrapper>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route 
            path="/create" 
            element={<LoginPrompt message="出品を作成するにはログインが必要です" />} 
          />
          <Route path="/photo-guide" element={<PhotoGuide />} />
          <Route path="/company" element={<CompanyInfo />} />
          <Route path="/listing-guide" element={<ListingGuide />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/fees" element={<Fees />} />
          <Route path="/pricing-guide" element={<div>価格設定ガイド（準備中）</div>} />
          <Route path="/terms" element={<div>利用規約（準備中）</div>} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </SuspenseWrapper>
    );
  }

  return (
    <SuspenseWrapper>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Home />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/listing/:slug" element={<ListingDetailPage />} />
        <Route path="/listing/new" element={<CreateListing />} />
        <Route path="/create" element={<CreateListing />} />
        <Route path="/create-listing" element={<CreateListing />} />
        <Route path="/preview/:id" element={<ListingPreview />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/objects" element={<ObjectManagement />} />
        <Route path="/admin/performance" element={<PerformanceDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/watch" element={<WatchList />} />
        <Route path="/photo-guide" element={<PhotoGuide />} />
        <Route path="/company" element={<CompanyInfo />} />
        <Route path="/listing-guide" element={<ListingGuide />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/fees" element={<Fees />} />
        <Route path="/upload-test" element={<UploadTest />} />
        <Route path="/pricing-guide" element={<div>価格設定ガイド（準備中）</div>} />
        <Route path="/terms" element={<div>利用規約（準備中）</div>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SuspenseWrapper>
  );
}