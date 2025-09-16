// client/src/App.tsx - Updated with authentication using blueprint:javascript_auth_all_persistance
import React from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/lib/protected-route";
import Home from "@/pages/home";
import VehicleDetail from "@/pages/vehicle-detail";
import AuthPage from "@/pages/auth";
import NotFound from "@/pages/not-found";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/vehicle/:slug" component={VehicleDetail} />
            <Route path="/auth" component={AuthPage} />
            <Route><NotFound /></Route>
          </Switch>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

