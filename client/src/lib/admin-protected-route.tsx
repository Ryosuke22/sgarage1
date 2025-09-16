import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { ReactNode } from "react";

interface AdminProtectedRouteProps {
  children: ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user) {
    setLocation('/auth');
    return null;
  }

  if (user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">アクセス拒否</h1>
          <p className="text-gray-600 mb-4">このページにアクセスするには管理者権限が必要です。</p>
          <a href="/" className="text-red-600 hover:underline">ホームに戻る</a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}