import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

/**
 * Captures visitor IP and coarse location info and posts to Supabase.
 * Logs to console in development or if insert fails.
 */
export default function IpTracker() {
  useEffect(() => {
    const key = "ip-tracker-session";
    if (sessionStorage.getItem(key)) return; // track once per tab session

    const run = async () => {
      try {
        const ua = navigator.userAgent;
        const path = window.location.pathname + window.location.search + window.location.hash;
        const referrer = document.referrer || null;

        // 1. Get IP (reliable)
        let ip = "unknown";
        try {
            const ipRes = await fetch("https://api.ipify.org?format=json");
            const data = await ipRes.json();
            if (data.ip) ip = data.ip;
        } catch (e) {
            console.warn("IP fetch failed", e);
        }

        // 2. Get Location (optional/rate-limited)
        let location: any = {};
        try {
          const locRes = await fetch("https://ipapi.co/json/");
          if (locRes.ok) {
            location = await locRes.json();
            // If ipify failed but ipapi worked, use that IP
            if (ip === "unknown" && location.ip) ip = location.ip;
          }
        } catch {}

        // 3. Insert into Supabase
        const payload = {
          ip,
          country: location?.country_name ?? location?.country ?? null,
          region: location?.region ?? null,
          city: location?.city ?? null,
          path,
          referrer,
          user_agent: ua,
        };

        const { error } = await supabase.from("website_visits").insert(payload);

        if (error) {
            console.warn("Supabase visit tracking failed:", error);
        } else {
            // Only mark session as tracked if successful (or should we mark anyway to avoid retry loops? Mark anyway.)
            sessionStorage.setItem(key, "1");
        }
      } catch (e) {
        console.warn("IP tracking failed:", e);
      }
    };

    run();
  }, []);

  return null;
}