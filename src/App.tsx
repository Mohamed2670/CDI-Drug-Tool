import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/components/LoginPage";
import { GuestWorkflow } from "@/components/GuestWorkflow";
import { AdminDashboard } from "@/components/AdminDashboard";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: JSX.Element; allowedRoles: string[] }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const role = user.role?.toLowerCase();
  if (!allowedRoles.includes(role)) {
    return (
      <div className="text-center p-8 text-red-600 font-bold">
        Unknown or unauthorized role: {user.role}
      </div>
    );
  }

  return children;
};

const AppRoutes = () => {
  return (
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

      {/* Default route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Router>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </Router>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
