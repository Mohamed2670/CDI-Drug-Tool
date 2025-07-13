import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import axiosInstance from "@/api/axiosInstance";
import { useNavigate } from "react-router-dom";

export const LoginPage = () => {
  const [selectedRole, setSelectedRole] = useState<"guest" | "admin" | null>(
    null
  );
  const [guestName, setGuestName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const { login } = useAuth();

  const navigate = useNavigate();

  const handleGuestLogin = async () => {
    if (!guestName.trim()) return;
    try {
      const res = await axiosInstance.post<{
        accessToken: string;
        role: string;
      }>(
        "/user/guest-login",
        { name: guestName.trim() },
        { withCredentials: true }
      );

      localStorage.setItem("accessToken", res.data.accessToken);

      // Map backend role to expected union type
      const mappedRole: "guest" | "admin" =
        res.data.role.toLowerCase() === "admin" ? "admin" : "guest";

      login(guestName.trim(), mappedRole); // set user context

      // 🚀 redirect based on role
      if (mappedRole === "admin") {
        navigate("/admin");
      } else {
        navigate("/guest");
      }
    } catch (err) {
      alert("Guest login failed.");
    }
  };

  const handleAdminLogin = async () => {
    if (!adminEmail.trim() || !adminPassword.trim()) return;

    try {
      const res = await axiosInstance.post<{
        accessToken: string;
        role: string;
      }>(
        "/user/login",
        {
          email: adminEmail.trim(),
          password: adminPassword,
        },
        { withCredentials: true }
      );

      localStorage.setItem("accessToken", res.data.accessToken);

      // Map backend role to expected union type
      const mappedRole: "guest" | "admin" =
        res.data.role.toLowerCase() === "admin" ? "admin" : "guest";

      login("Administrator", mappedRole);

      // 🚀 redirect based on role
      if (mappedRole === "admin") {
        navigate("/admin");
      } else {
        navigate("/guest");
      }
    } catch (err) {
      console.log(err);
      alert("Incorrect email or password.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-between items-center">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold mb-2">CDI Decision Tool</h1>
            <p className="text-muted-foreground">Choose your access level</p>
          </div>
          <ThemeToggle />
        </div>

        {!selectedRole ? (
          <div className="space-y-4">
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedRole("guest")}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Guest Access
                  <Badge variant="secondary">Quick Entry</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Enter patient data and get routing decisions
                </p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedRole("admin")}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Admin Access
                  <Badge variant="destructive">Restricted</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  View analytics and manage system logs
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {selectedRole === "guest" ? "Guest Login" : "Admin Login"}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRole(null)}
                >
                  Back
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedRole === "guest" ? (
                <>
                  <div>
                    <Label htmlFor="guest-name">Your Name</Label>
                    <Input
                      id="guest-name"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Enter your name"
                      onKeyDown={(e) => e.key === "Enter" && handleGuestLogin()}
                    />
                  </div>
                  <Button
                    onClick={handleGuestLogin}
                    disabled={!guestName.trim()}
                    className="w-full"
                  >
                    Continue as Guest
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="admin-email">Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="Enter admin email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="admin-password">Password</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter admin password"
                      onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                    />
                  </div>
                  <Button
                    onClick={handleAdminLogin}
                    disabled={!adminEmail.trim() || !adminPassword}
                    className="w-full"
                  >
                    Login as Admin
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
