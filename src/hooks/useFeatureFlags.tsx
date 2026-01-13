import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Flags = {
  loginVisible: boolean;
  membershipVisible: boolean;
  venueVisible: boolean;
};

type FeatureFlagsContextValue = {
  flags: Flags;
  loading: boolean;
  refresh: () => Promise<void>;
};

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | null>(null);

export const FeatureFlagsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialFlags: Flags = (() => {
    try {
      const raw = localStorage.getItem("featureFlags");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          typeof parsed?.loginVisible === "boolean" &&
          typeof parsed?.membershipVisible === "boolean" &&
          typeof parsed?.venueVisible === "boolean"
        ) {
          return parsed as Flags;
        }
      }
    } catch {}
    // Default to hidden to avoid initial flicker when flags are OFF
    return { loginVisible: false, membershipVisible: false, venueVisible: false };
  })();

  const [flags, setFlags] = useState<Flags>(initialFlags);
  const [loading, setLoading] = useState(true);

  const hasSupabase = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

  const load = async () => {
    if (!hasSupabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key,value_bool")
        .in("key", [
          "auth.login.visible",
          "membership.buttons.visible",
          "venue.buttons.visible",
        ]);
      if (!error && Array.isArray(data)) {
        const map = new Map<string, boolean>((data as any[]).map((d: any) => [d.key, !!d.value_bool]));
        const nextFlags: Flags = {
          loginVisible: !!map.get("auth.login.visible"),
          membershipVisible: !!map.get("membership.buttons.visible"),
          venueVisible: !!map.get("venue.buttons.visible"),
        };
        setFlags(nextFlags);
        try {
          localStorage.setItem("featureFlags", JSON.stringify(nextFlags));
        } catch {}
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const value = useMemo<FeatureFlagsContextValue>(() => ({ flags, loading, refresh: load }), [flags, loading]);

  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
};

export const useFeatureFlags = () => {
  const ctx = useContext(FeatureFlagsContext);
  if (!ctx) {
    // Default hidden when provider is not mounted to avoid flicker
    return { flags: { loginVisible: false, membershipVisible: false, venueVisible: false }, loading: false, refresh: async () => {} };
  }
  return ctx;
};