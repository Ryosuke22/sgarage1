import { User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export function UserProfile() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  if (!user) return null;

  return (
    <button 
      className="flex items-center gap-1 sm:gap-2 text-white hover:text-gray-300 transition-colors"
      onClick={() => navigate("/profile")}
      data-testid="button-user-profile"
    >
      <User className="h-3 w-3 sm:h-4 sm:w-4" />
      <span className="text-xs sm:text-sm hidden sm:inline">@{user.username}</span>
    </button>
  );
}