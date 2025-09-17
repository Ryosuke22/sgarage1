import { User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export function UserProfile() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  if (!user) return null;

  return (
    <button 
      className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
      onClick={() => navigate("/profile")}
      data-testid="button-user-profile"
    >
      <User className="h-4 w-4" />
      <span className="text-sm">@{user.username}</span>
    </button>
  );
}