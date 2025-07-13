import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/components/LoginPage";
import { GuestWorkflow } from "@/components/GuestWorkflow";
import { AdminDashboard } from "@/components/AdminDashboard";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: JSX.Element; allowedRoles: string[] }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  const role = user.role?.toLowerCase();
  if (!allowedRoles.includes(role)) {
    return (
      <div className="text-center p-8 text-red-600 font-bold">
        Unauthorized: role {user.role}
      </div>
    );
  }

  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route
      path="/admin"
      element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/guest"
      element={
        <ProtectedRoute allowedRoles={["guest", "user"]}>
          <GuestWorkflow />
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<Navigate to="/login" />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
