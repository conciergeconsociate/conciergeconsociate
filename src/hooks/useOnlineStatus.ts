import { useEffect, useRef, useState } from "react";

/**
 * Tracks online/offline state with event listeners and a periodic connectivity check
 * to a same-origin resource (robots.txt) to avoid CORS issues.
 */
export function useOnlineStatus(pingIntervalMs: number = 15000, timeoutMs: number = 3000) {
  const [online, setOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const abortRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<number | null>(null);

  const checkConnectivity = async () => {
    // Prefer same-origin resource to avoid CORS — public/robots.txt exists
    try {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch("/robots.txt", { cache: "no-store", signal: controller.signal });
      clearTimeout(timeout);
      setOnline(res.ok);
    } catch {
      setOnline(false);
    }
  };

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    // Kick off an immediate check and periodic pings
    checkConnectivity();
    intervalRef.current = window.setInterval(checkConnectivity, pingIntervalMs);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      abortRef.current?.abort();
    };
  }, []);

  return { online, checkConnectivity };
}