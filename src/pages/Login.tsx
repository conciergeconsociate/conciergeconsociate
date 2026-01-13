import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth.tsx";
import { supabase } from "@/lib/supabaseClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [sendingMagicLink, setSendingMagicLink] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await signIn(email, password);
      if (error) {
        throw error;
      }
      toast({ title: "Welcome", description: "Login successful" });
      
      // Trigger sign-in alert
      try {
        const getVisitorIp = async (): Promise<string> => {
          try {
            let ip = "unknown";
            const ipRes = await fetch("https://api.ipify.org?format=json");
            const ipData = await ipRes.json().catch(() => ({}));
            if (ipData && ipData.ip) ip = ipData.ip;
            if (ip === "unknown") {
              const locRes = await fetch("https://ipapi.co/json/");
              if (locRes.ok) {
                const locData = await locRes.json().catch(() => ({}));
                if (locData && locData.ip) ip = locData.ip;
              }
            }
            return ip;
          } catch {
            return "unknown";
          }
        };
        const ip = await getVisitorIp();
        const fullName = data.user?.user_metadata?.full_name || "User";
        await supabase.functions.invoke("notify", {
          body: {
            type: "signin_alert",
            userEmail: email,
            data: {
              name: fullName,
              time: new Date().toLocaleString(),
              device: navigator.userAgent,
              ip
            }
          }
        });
      } catch (e) { console.error("Failed to send signin alert", e); }

      navigate("/");
    } catch (err: any) {
      toast({
        title: "Login failed",
        description: err?.message ?? "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      toast({ title: "Error", description: "Please enter your email address first", variant: "destructive" });
      return;
    }
    setSendingMagicLink(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
      if (error) throw error;
      toast({ title: "Magic Link Sent", description: "Check your email for the login link." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSendingMagicLink(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: "Error", description: "Please enter your email address first", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      if (error) throw error;
      toast({ title: "Recovery Email Sent", description: "Check your email for the password reset link." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                 <button type="button" onClick={handleForgotPassword} className="text-blue-600 hover:underline">
                   Forgot Password?
                 </button>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Signing in..." : "Sign in"}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button type="button" variant="outline" className="w-full" disabled={sendingMagicLink} onClick={handleMagicLink}>
                {sendingMagicLink ? "Sending..." : "Send Magic Link"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
