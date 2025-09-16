// client/src/lib/queryClient.ts - Updated for authentication
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { 
      retry: 1, 
      refetchOnWindowFocus: false,
      queryFn: async ({ queryKey: [url] }) => {
        const response = await fetch(url as string, {
          credentials: 'include', // Include cookies for session management
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
      },
    },
    mutations: { retry: 0 },
  },
});

// Helper function to create query functions with authentication handling
export function getQueryFn(options?: { on401?: "returnNull" | "throw" }) {
  return async ({ queryKey: [url] }: { queryKey: [string] }) => {
    const response = await fetch(url, {
      credentials: 'include', // Include cookies for session management
    });

    if (response.status === 401) {
      if (options?.on401 === "returnNull") {
        return null;
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };
}

export async function apiRequest(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  url: string,
  data?: unknown,
) {
  const config: RequestInit = {
    method,
    credentials: 'include', // Include cookies for session management
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    if (response.headers.get("content-type")?.includes("application/json")) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response;
}
