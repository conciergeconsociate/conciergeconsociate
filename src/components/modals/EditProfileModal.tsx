import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";

type EditProfileModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditProfileModal({ open, onOpenChange }: EditProfileModalProps) {
  const { toast } = useToast();
  const { userId, email } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  const [profile, setProfile] = useState<{ id: string; email: string; full_name: string; phone: string; role?: string } | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [newEmail, setNewEmail] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [changingEmail, setChangingEmail] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [plans, setPlans] = useState<any[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);

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

      try {
        // Load avatar URL from localStorage (if previously saved)
        if (userId) {
          const stored = typeof localStorage !== "undefined" ? localStorage.getItem(`avatar_url:${userId}`) : null;
          if (stored) setAvatarUrl(stored);
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

  const uploadAvatar = async () => {
    try {
      setUploadingAvatar(true);
      if (!avatarFile) return;
      if (!hasSupabase || !supabase?.storage) {
        throw new Error("Storage not configured");
      }
      const bucket = "media";
      const path = `avatars/${userId ?? "anon"}/${Date.now()}-${Math.random().toString(36).slice(2)}-${avatarFile.name}`;
      const { error } = await supabase.storage.from(bucket).upload(path, avatarFile, { upsert: true });
      if (error) throw error;
      const { data } = await supabase.storage.from(bucket).getPublicUrl(path);
      if (data?.publicUrl) {
        setAvatarUrl(data.publicUrl);
        // Persist locally since profiles table has no avatar field
        if (userId && typeof localStorage !== "undefined") localStorage.setItem(`avatar_url:${userId}`, data.publicUrl);
      }
      toast({ title: "Uploaded", description: "Avatar updated" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message ?? "Storage error", variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
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
        const { data: sessionRes } = await supabase.auth.getSession();
        const accessToken = sessionRes?.session?.access_token;
        if (!accessToken) throw new Error("Not authenticated");
        const resp = await fetch(`/api/auth/change-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ newEmail, redirectTo: `${window.location.origin}/login` }),
        });
        const json = await resp.json().catch(() => ({}));
        if (!resp.ok || json?.ok !== true) throw new Error(json?.error || `Request failed (${resp.status})`);
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

  const upgradeToNextPlan = async () => {
    try {
      if (!userId || !nextPlan || !hasSupabase) return;
      setUpgrading(true);
      // Revoke existing active plan (if any)
      const { data: existing } = await supabase
        .from("user_memberships")
        .select("id")
        .eq("user_id", userId)
        .eq("active", true)
        .limit(1);
      if (existing && existing.length > 0) {
        await supabase
          .from("user_memberships")
          .update({ active: false, revoked_at: new Date().toISOString() })
          .eq("id", existing[0].id);
      }
      // Assign next plan
      const { error } = await supabase
        .from("user_memberships")
        .insert({ user_id: userId, plan_id: nextPlan.id, active: true });
      if (error) throw new Error(error.message);
      setCurrentPlanId(nextPlan.id);
      toast({ title: "Upgraded", description: `You are now on ${nextPlan.name}` });
    } catch (e: any) {
      toast({ title: "Upgrade failed", description: e?.message ?? "Could not upgrade", variant: "destructive" });
    } finally {
      setUpgrading(false);
    }
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
                {avatarUrl ? <AvatarImage src={avatarUrl} alt="Avatar" /> : null}
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
              <Label htmlFor="avatar">Avatar image</Label>
              <Input id="avatar" type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />
              <div className="flex gap-2">
                <Button variant="outline" onClick={uploadAvatar} disabled={!avatarFile || uploadingAvatar}>
                  {uploadingAvatar ? "Uploading..." : "Upload avatar"}
                </Button>
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
              <Input id="newPwd" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPwd">Confirm password</Label>
              <Input id="confirmPwd" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
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
                <div className="text-base font-medium">{`${nextPlan.name} — ${nextPlan.currency || "USD"} ${nextPlan.price}`}</div>
                <Button onClick={upgradeToNextPlan} disabled={upgrading}>
                  {upgrading ? "Upgrading..." : "Upgrade to next plan"}
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