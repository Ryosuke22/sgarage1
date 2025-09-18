import { lazy, Suspense, useEffect } from "react";
import { Switch, Route } from "wouter";
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

export function Routes() {
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

  return (
    <SuspenseWrapper>
      <Switch>
        {!(isAuthenticated || forceAuthenticated) ? (
          <>
            <Route path="/" component={Landing} />
            <Route path="/auth" component={() => <Auth />} />
            <Route path="/login" component={Login} />
            <Route path="/signup" component={Signup} />
            <Route 
              path="/create" 
              component={() => <LoginPrompt message="出品を作成するにはログインが必要です" />} 
            />
            <Route path="/photo-guide" component={PhotoGuide} />
            <Route path="/company" component={CompanyInfo} />
            <Route path="/listing-guide" component={ListingGuide} />
            <Route path="/how-it-works" component={HowItWorks} />
            <Route path="/fees" component={Fees} />
            <Route path="/pricing-guide" component={() => <div>価格設定ガイド（準備中）</div>} />
            <Route path="/terms" component={() => <div>利用規約（準備中）</div>} />
            <Route component={Landing} />
          </>
        ) : (
          <>
            <Route path="/" component={Home} />
            <Route path="/dashboard" component={Home} />
            <Route path="/landing" component={Landing} />
            <Route path="/listing/:slug" component={ListingDetail} />
            <Route path="/listing/new" component={CreateListing} />
            <Route path="/create" component={CreateListing} />
            <Route path="/create-listing" component={CreateListing} />
            <Route path="/preview/:id" component={ListingPreview} />
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/admin/users" component={UserManagement} />
            <Route path="/admin/objects" component={ObjectManagement} />
            <Route path="/admin/performance" component={PerformanceDashboard} />
            <Route path="/profile" component={Profile} />
            <Route path="/settings" component={Settings} />
            <Route path="/watch" component={WatchList} />
            <Route path="/photo-guide" component={PhotoGuide} />
            <Route path="/company" component={CompanyInfo} />
            <Route path="/listing-guide" component={ListingGuide} />
            <Route path="/how-it-works" component={HowItWorks} />
            <Route path="/fees" component={Fees} />
            <Route path="/upload-test" component={UploadTest} />
            <Route path="/pricing-guide" component={() => <div>価格設定ガイド（準備中）</div>} />
            <Route path="/terms" component={() => <div>利用規約（準備中）</div>} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
    </SuspenseWrapper>
  );
}