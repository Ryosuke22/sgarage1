// client/src/hooks/useAuth.tsx - Updated using blueprint:javascript_auth_all_persistance
import React, { createContext, ReactNode, useContext, ReactElement } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, SessionUser, InsertUser, loginUserSchema } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type AuthContextType = {
  user: SessionUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SessionUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SessionUser, Error, InsertUser>;
};

type LoginData = z.infer<typeof loginUserSchema>;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SessionUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const response = await fetch('/api/user');
        if (response.status === 401) {
          return null;
        }
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        return await response.json();
      } catch (error) {
        if (error instanceof Error && error.message.includes('401')) {
          return null;
        }
        throw error;
      }
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: SessionUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "ログイン成功",
        description: `${user.firstName || user.username}さん、おかえりなさい`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "ログインエラー",
        description: error.message || "ログインに失敗しました",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: SessionUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "アカウント作成完了",
        description: `${user.firstName || user.username}さん、ようこそ侍ガレージへ！`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "アカウント作成エラー",
        description: error.message || "アカウントの作成に失敗しました",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "ログアウト完了",
        description: "またお会いしましょう",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "ログアウトエラー",
        description: error.message || "ログアウトに失敗しました",
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      } satisfies AuthContextType}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
