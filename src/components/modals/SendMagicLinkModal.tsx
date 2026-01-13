import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

export function SendMagicLinkModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const hasSupabase = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
  const FLOW = (import.meta.env.VITE_EMAIL_FLOW as string) || "api"; // 'api' | 'client' | 'strict_api'
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!cooldownUntil) return;
    const tick = () => {
      const ms = cooldownUntil - Date.now();
      setRemaining(ms > 0 ? Math.ceil(ms / 1000) : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  const handleSend = async () => {
    if (cooldownUntil && Date.now() < cooldownUntil) return;
    setError(null);
    setMessage(null);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    setSending(true);
    try {
      const redirectTo = `${window.location.origin}/login`;
      if (FLOW === "client" && hasSupabase) {
        const { error: otpError } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
        if (otpError) throw new Error(otpError.message);
        setMessage("If an account exists for this email, a magic link has been sent.");
        setCooldownUntil(Date.now() + 60_000);
      } else {
        const resp = await fetch(`/api/auth/magic-link`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, redirectTo }),
        });
        const json = await resp.json().catch(() => ({}));
        if (!resp.ok || json?.ok !== true) {
          const msg = (json?.error as string) || `Request failed (${resp.status})`;
          if (resp.status === 429 || /rate|too many/i.test(msg)) {
            setError("Too many requests. Please try again in 60 seconds.");
            setCooldownUntil(Date.now() + 60_000);
            return;
          }
          // Optional fallback: only if not strict_api
          if (hasSupabase && FLOW !== "strict_api") {
            const { error: otpError } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
            if (otpError) throw new Error(otpError.message);
          } else {
            throw new Error(msg);
          }
        }
        setMessage("If an account exists for this email, a magic link has been sent.");
        setCooldownUntil(Date.now() + 60_000);
      }
    } catch (e: any) {
      setError(e?.message ?? "Unable to send magic link");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Magic Link</DialogTitle>
          <DialogDescription>We’ll email a one-time sign-in link.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Enter your email and we’ll send you a one-time sign-in link.
          </p>
          <div>
            <label className="block text-sm mb-1">Email Address</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" disabled={cooldownUntil ? Date.now() < cooldownUntil : false} />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          {message && <div className="text-sm text-green-600">{message}</div>}
          {cooldownUntil && Date.now() < cooldownUntil && (
            <div className="text-sm text-muted-foreground">Try again in {remaining}s</div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>Cancel</Button>
          <Button onClick={handleSend} disabled={sending || (cooldownUntil ? Date.now() < cooldownUntil : false)}>{sending ? "Sending…" : "Send Magic Link"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}