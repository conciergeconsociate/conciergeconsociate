import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";

// Force rebuild comment
export type UserRole = "admin" | "member" | "user" | null;

interface AuthContextType {
  userId: string | null;
  email: string | null;
  role: UserRole;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch role from profiles
  const fetchRole = async (uid: string) => {
    try {
      // 1. Try direct select first (faster, leverages existing RLS)
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', uid)
        .single();

      if (!error && data) {
        console.log("Role fetched via select:", data.role);
        setRole(data.role as UserRole);
        return;
      }

      // 2. Fallback to RPC if select fails
      console.log("Direct select failed, trying RPC...");
      const { data: rpcData, error: rpcError } = await supabase.rpc("get_user_role");
      
      if (!rpcError && rpcData) {
        console.log("Role fetched via RPC:", rpcData);
        setRole(rpcData as UserRole);
      } else {
        console.warn("No role found, defaulting to user");
        setRole("user");
      }
    } catch (err) {
      console.error("Exception in fetchRole:", err);
      setRole("user");
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. Check active session
    const initSession = async () => {
      try {
        // Get session from local storage
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
          setUserId(session.user.id);
          setEmail(session.user.email ?? null);
          await fetchRole(session.user.id);
        } else if (mounted) {
           // No session found
           setUserId(null);
           setEmail(null);
           setRole(null);
        }
      } catch (e) {
        console.error("Error getting session:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initSession();

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event);
      
      if (!mounted) return;

      if (session?.user) {
        setUserId(session.user.id);
        setEmail(session.user.email ?? null);
        
        // On initial load, initSession handles it. 
        // We only need to fetch role if it's a new sign in or token refresh that might imply role change
        // Or if we don't have a role yet.
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || !role) {
           // We don't await here to avoid blocking UI, but we could set loading if needed
           // For smoother UX, we let it update in background unless it's critical
           fetchRole(session.user.id);
        }
      } else {
        setUserId(null);
        setEmail(null);
        setRole(null);
        // Ensure loading is false if we are logged out
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const res = await supabase.auth.signInWithPassword({ email, password });
    if (res.data.session) {
        // Manually update state for immediate feedback if needed, 
        // though onAuthStateChange will also catch it.
        // We'll let onAuthStateChange handle the state update to be single source of truth,
        // but we might want to wait for role fetch?
        // Actually, let's just return the result. The component can handle navigation.
    }
    setLoading(false);
    return res;
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    // State will be cleared by onAuthStateChange
    setLoading(false);
  };

  const isAdmin = role === "admin";

  const value = { userId, email, role, isAdmin, loading, signIn, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
