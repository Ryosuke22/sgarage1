import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const [authState, setAuthState] = useState<{
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: boolean;
  }>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: false
  });

  useEffect(() => {
    // Development mode: Skip fetch and use mock user
    if (process.env.NODE_ENV === 'development') {
      console.log("Dev mode - using mock authenticated user");
      setAuthState({
        user: {
          id: "samurai-user-1",
          email: "samuraigarage1@gmail.com",
          username: "SamuraiGarage1",
          role: "admin",
          passwordHash: null,
          firstName: null,
          lastName: null,
          firstNameKana: null,
          lastNameKana: null,
          profileImageUrl: null,
          emailVerified: true,
          emailVerificationToken: null,
          pendingEmail: null,
          emailChangeToken: null,
          emailChangeExpires: null,
          passwordResetToken: null,
          passwordResetExpires: null,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          createdAt: new Date(),
          updatedAt: new Date()
        } as User,
        isLoading: false,
        isAuthenticated: true,
        error: false
      });
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/user", {
          credentials: "include",
        });
        
        console.log("Auth fetch - status:", res.status, "ok:", res.ok);
        
        if (res.ok) {
          const text = await res.text();
          console.log("Auth fetch - response text:", text);
          
          if (!text || text.trim() === '') {
            console.log("Auth fetch - empty response");
            setAuthState({
              user: null,
              isLoading: false,
              isAuthenticated: false,
              error: false
            });
            return;
          }
          
          try {
            const user = JSON.parse(text);
            console.log("Auth fetch - user data:", user);
            setAuthState({
              user,
              isLoading: false,
              isAuthenticated: true,
              error: false
            });
          } catch (jsonError) {
            console.log("Auth fetch - JSON parse error:", jsonError, "text:", text);
            setAuthState({
              user: null,
              isLoading: false,
              isAuthenticated: false,
              error: true
            });
          }
        } else if (res.status === 401) {
          console.log("Auth fetch - 401 unauthorized");
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            error: false
          });
        } else {
          console.log("Auth fetch - other error:", res.status);
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            error: true
          });
        }
      } catch (error) {
        console.log("Auth fetch - network error:", error);
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: true
        });
      }
    };

    fetchUser();
  }, []);

  const queryClient = useQueryClient();

  const refetch = () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    // Re-run the effect with same error handling
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/user", {
          credentials: "include",
        });
        
        if (res.ok) {
          const text = await res.text();
          
          if (!text || text.trim() === '') {
            setAuthState({
              user: null,
              isLoading: false,
              isAuthenticated: false,
              error: false
            });
            return;
          }
          
          try {
            const user = JSON.parse(text);
            setAuthState({
              user,
              isLoading: false,
              isAuthenticated: true,
              error: false
            });
          } catch (jsonError) {
            setAuthState({
              user: null,
              isLoading: false,
              isAuthenticated: false,
              error: true
            });
          }
        } else if (res.status === 401) {
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            error: false
          });
        } else {
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            error: true
          });
        }
      } catch (error) {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: true
        });
      }
    };
    
    fetchUser();
  };

  return {
    user: authState.user,
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    refetch,
    error: authState.error,
  };
}
