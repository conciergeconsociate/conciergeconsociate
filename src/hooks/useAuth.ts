import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type UserRole = "admin" | "member" | "user" | null;

export function useAuth() {
  // Initialize from dev session if Supabase isn't configured to avoid header flicker
  const hasSupabase = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
  const devRaw = !hasSupabase && typeof localStorage !== "undefined" ? localStorage.getItem("dev_admin_session") : null;
  const devSession = (() => { try { return devRaw ? JSON.parse(devRaw) : null; } catch { return null; } })();

  const [userId, setUserId] = useState<string | null>(devSession?.userId || null);
  const [email, setEmail] = useState<string | null>(devSession?.email || null);
  const [role, setRole] = useState<UserRole>(devSession ? "admin" : null);
  const [loading, setLoading] = useState(!devSession);

  const DEV_ADMIN_EMAIL = "eudaimontech@gmail.com";
  const SUPABASE_CONFIGURED = hasSupabase;

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session ?? null;
        const uid = session?.user?.id ?? null;
        const userEmail = session?.user?.email ?? null;
        if (isMounted) {
          setUserId(uid);
          setEmail(userEmail);
        }
        if (uid) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", uid)
            .maybeSingle();
          if (isMounted) setRole((profile?.role as UserRole) ?? null);
        }
      } catch {
        // ignore
      } finally {
        // Dev fallback: restore admin session if Supabase is not configured
        if (!SUPABASE_CONFIGURED && isMounted && devSession?.email === DEV_ADMIN_EMAIL) {
          setUserId(devSession.userId || "dev-admin");
          setEmail(devSession.email);
          setRole("admin");
        }
        if (isMounted) setLoading(false);
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const uid = session?.user?.id ?? null;
      const userEmail = session?.user?.email ?? null;
      setUserId(uid);
      setEmail(userEmail);
      if (uid) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", uid)
          .maybeSingle();
        setRole((profile?.role as UserRole) ?? null);
      } else {
        // Preserve dev admin session across route changes when Supabase is not configured
        if (!SUPABASE_CONFIGURED && devSession?.email === DEV_ADMIN_EMAIL) {
          setUserId(devSession.userId || "dev-admin");
          setEmail(devSession.email);
          setRole("admin");
        } else {
          setRole(null);
        }
      }
    });
    return () => {
      listener.subscription.unsubscribe();
      isMounted = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await supabase.auth.signInWithPassword({ email, password });
    // Dev fallback for admin when Supabase is not configured
    if (res?.error?.message === "Supabase not configured" && email === DEV_ADMIN_EMAIL && !SUPABASE_CONFIGURED) {
      const fakeSession = { user: { id: "dev-admin", email } };
      setUserId("dev-admin");
      setEmail(email);
      setRole("admin");
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("dev_admin_session", JSON.stringify({ userId: "dev-admin", email }));
        }
      } catch {}
      return { data: { session: fakeSession }, error: null } as any;
    }
    // minimal visit log on login
    try {
      await supabase.from("website_visits").insert({
        path: "/login",
        referrer: typeof document !== "undefined" ? document.referrer : null,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      });
    } catch {}
    return res;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    if (!SUPABASE_CONFIGURED) {
      try {
        if (typeof localStorage !== "undefined") localStorage.removeItem("dev_admin_session");
      } catch {}
      setUserId(null);
      setEmail(null);
      setRole(null);
    }
  };

  const isAdmin = useMemo(() => role === "admin", [role]);

  return { userId, email, role, isAdmin, loading, signIn, signOut };
}