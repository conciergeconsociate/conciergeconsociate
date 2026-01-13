import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth.tsx";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

type EditProfileModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditProfileModal({ open, onOpenChange }: EditProfileModalProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { userId, email } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  const [profile, setProfile] = useState<{ id: string; email: string; full_name: string; phone: string; role?: string } | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [newEmail, setNewEmail] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [plans, setPlans] = useState<any[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);

  const hasSupabase = useMemo(() => !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY, []);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        if (userId && hasSupabase) {
          const { data: p } = await supabase
            .from("profiles")
            .select("id,email,full_name,phone,role")
            .eq("id", userId)
            .maybeSingle();
          if (p) {
            setProfile(p);
            setFullName(p.full_name ?? "");
            setPhone(p.phone ?? "");
          } else {
            setProfile({ id: userId, email: email || "", full_name: "", phone: "" });
          }
        } else {
          // Dev fallback
          setProfile({ id: userId || "dev", email: email || "", full_name: "", phone: "" });
        }
      } catch {}

      try {
        // Load membership plans ordered by price asc
        if (hasSupabase) {
          const { data: mp } = await supabase
            .from("membership_plans")
            .select("id,name,price,duration,currency,benefits,cover_image,show_on_website")
            .order("price", { ascending: true });
          setPlans(Array.isArray(mp) ? mp : []);
        } else {
          setPlans([]);
        }
      } catch {}

      try {
        // Load current active membership
        if (userId && hasSupabase) {
          const { data: um } = await supabase
            .from("user_memberships")
            .select("plan_id,user_id,active")
            .eq("user_id", userId)
            .eq("active", true)
            .limit(1);
          setCurrentPlanId(um && um.length > 0 ? um[0].plan_id : null);
        } else {
          setCurrentPlanId(null);
        }
      } catch {}
    })();
  }, [open, userId, email, hasSupabase]);

  const currentPlan = useMemo(() => plans.find((p) => p.id === currentPlanId) || null, [plans, currentPlanId]);
  const nextPlan = useMemo(() => {
    if (!currentPlan) return plans[0] || null; // if none, next is the lowest tier
    const sorted = [...plans].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    const idx = sorted.findIndex((p) => p.id === currentPlan.id);
    return idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;
  }, [plans, currentPlan]);

  const saveProfile = async () => {
    try {
      setSavingProfile(true);
      if (!userId) return;
      if (hasSupabase) {
        const { error } = await supabase
          .from("profiles")
          .update({ full_name: fullName, phone })
          .eq("id", userId);
        if (error) throw new Error(error.message);
      } else {
        // Dev fallback: persist locally
        if (typeof localStorage !== "undefined") {
          localStorage.setItem(`profile:${userId}`, JSON.stringify({ full_name: fullName, phone }));
        }
      }
      toast({ title: "Saved", description: "Profile updated" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Failed to update", variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const changeEmail = async () => {
    try {
      setChangingEmail(true);
      const isValidEmail = /.+@.+\..+/.test(newEmail);
      if (!newEmail || !isValidEmail) {
        toast({ title: "Invalid email", description: "Please enter a valid email", variant: "destructive" });
        return;
      }
      if (!newEmail) return;
      if (hasSupabase) {
        const { error } = await supabase.auth.updateUser({ email: newEmail });
        if (error) throw new Error(error.message);
      } else if (userId) {
        // Dev fallback: persist locally
        if (typeof localStorage !== "undefined") {
          const raw = localStorage.getItem(`profile:${userId}`);
          const curr = raw ? JSON.parse(raw) : {};
          localStorage.setItem(`profile:${userId}`, JSON.stringify({ ...curr, email: newEmail }));
        }
      }
      toast({ title: "Email updated", description: "Check your inbox to confirm changes" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Failed to update email", variant: "destructive" });
    } finally {
      setChangingEmail(false);
    }
  };

  const changePassword = async () => {
    try {
      setChangingPassword(true);
      if (!newPassword || newPassword !== confirmPassword) {
        toast({ title: "Mismatch", description: "Passwords do not match", variant: "destructive" });
        return;
      }
      if (newPassword.length < 8) {
        toast({ title: "Weak password", description: "Use at least 8 characters", variant: "destructive" });
        return;
      }
      if (hasSupabase) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw new Error(error.message);
      } else {
        // Dev fallback: no-op but show success
      }
      toast({ title: "Password updated", description: "Your password has been changed" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Failed to update password", variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleUpgradeClick = () => {
    onOpenChange(false);
    navigate("/membership");
    setTimeout(() => {
      const element = document.getElementById("plans");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const initials = (profile?.full_name || profile?.email || "User").split(" ").map((p) => p[0]).slice(0, 2).join("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Manage your account settings and membership.</DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="plan">My Plan</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 pt-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button onClick={saveProfile} disabled={savingProfile}>
                  {savingProfile ? "Saving..." : "Save profile"}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="newEmail">New email</Label>
              <Input id="newEmail" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder={profile?.email || email || ""} />
            </div>
            <Button onClick={changeEmail} disabled={!newEmail || changingEmail}>
              {changingEmail ? "Updating..." : "Change email"}
            </Button>
          </TabsContent>

          <TabsContent value="password" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="newPwd">New password</Label>
              <div className="relative">
                <Input
                  id="newPwd"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPwd">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirmPwd"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button onClick={changePassword} disabled={!newPassword || !confirmPassword || changingPassword}>
              {changingPassword ? "Updating..." : "Change password"}
            </Button>
          </TabsContent>

          <TabsContent value="plan" className="space-y-4 pt-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Current plan</div>
              <div className="text-base font-medium">{currentPlan ? `${currentPlan.name} — ${currentPlan.currency || "USD"} ${currentPlan.price}` : "None"}</div>
            </div>
            {nextPlan ? (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Next plan available</div>
                <div className="text-base font-medium">{`${nextPlan.name} — ${nextPlan.currency || "USD"} ${nextPlan.price} / ${nextPlan.duration} days`}</div>
                <Button onClick={handleUpgradeClick}>
                  Upgrade to next plan
                </Button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">You are on the highest available plan.</div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}