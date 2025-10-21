import { useEffect } from "react";

/**
 * Captures visitor IP and coarse location info and optionally posts to a backend.
 * If `VITE_TRACK_IP_ENDPOINT` is defined, data is POSTed to that URL as JSON.
 * Otherwise, it logs to console only.
 */
export default function IpTracker() {
  useEffect(() => {
    const key = "ip-tracker-session";
    if (sessionStorage.getItem(key)) return; // track once per tab session

    const run = async () => {
      try {
        const ua = navigator.userAgent;
        const path = window.location.pathname + window.location.search + window.location.hash;

        const ipRes = await fetch("https://api.ipify.org?format=json");
        const { ip } = await ipRes.json();

        // ipapi is convenient; gracefully handle failures
        let location: any = null;
        try {
          const locRes = await fetch("https://ipapi.co/json/");
          if (locRes.ok) {
            location = await locRes.json();
          }
        } catch {}

        const payload = {
          ip,
          path,
          user_agent: ua,
          timestamp: new Date().toISOString(),
          city: location?.city ?? null,
          region: location?.region ?? null,
          country: location?.country_name ?? location?.country ?? null,
          latitude: location?.latitude ?? null,
          longitude: location?.longitude ?? null,
          org: location?.org ?? null,
        };

        const endpoint = import.meta.env.VITE_TRACK_IP_ENDPOINT as string | undefined;
        if (endpoint) {
          try {
            await fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
          } catch (e) {
            console.warn("IP tracking endpoint failed:", e);
          }
        } else {
          console.info("Visitor payload:", payload);
        }

        sessionStorage.setItem(key, "1");
      } catch (e) {
        console.warn("IP tracking failed:", e);
      }
    };

    run();
  }, []);

  return null;
}