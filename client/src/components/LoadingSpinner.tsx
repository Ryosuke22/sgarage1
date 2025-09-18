import { RefreshCw } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function LoadingSpinner({ 
  message = "読み込み中...", 
  size = "md",
  className = "" 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-[200px] ${className}`}>
      <RefreshCw className={`${sizeClasses[size]} animate-spin text-primary mb-4`} />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}

// Minimal page-level loading component
export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="text-center">
        <RefreshCw className="h-12 w-12 animate-spin text-white mb-4 mx-auto" />
        <p className="text-white text-lg">ページを読み込み中...</p>
      </div>
    </div>
  );
}

// Component-level loading
export function ComponentLoading({ message = "読み込み中..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <RefreshCw className="h-6 w-6 animate-spin text-primary mr-2" />
      <span className="text-muted-foreground">{message}</span>
    </div>
  );
}