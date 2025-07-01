import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/components/LoginPage";
import { GuestWorkflow } from "@/components/GuestWorkflow";
import { AdminDashboard } from "@/components/AdminDashboard";

const queryClient = new QueryClient();

type UserRole = "admin" | "guest" | "user";

const AppContent = () => {
  const { user } = useAuth();

  if (!user) return <LoginPage />;

  const role = user.role?.toLowerCase() as UserRole;

  if (role === "admin") return <AdminDashboard />;
  if (role === "guest" || role === "user") return <GuestWorkflow />;

  return (
    <div className="text-center p-8 text-red-600 font-bold">
      Unknown role: {user.role}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
