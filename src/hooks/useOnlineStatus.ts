import { useEffect, useRef, useState } from "react";

/**
 * Tracks online/offline state with event listeners and a periodic connectivity check
 * to a same-origin resource (robots.txt) to avoid CORS issues.
 */
export function useOnlineStatus(pingIntervalMs: number = 15000, timeoutMs: number = 3000) {
  const [online, setOnline] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);
  const intervalRef = useRef<number | null>(null);

  const checkConnectivity = async () => {
    setChecking(true);
    try {
      // Use an image ping to a highly-available external domain to avoid CORS issues.
      // This ensures that in local dev (localhost) we don't falsely detect "online".
      const url = `https://www.cloudflare.com/favicon.ico?ts=${Date.now()}`;
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        const timer = window.setTimeout(() => {
          img.src = "";
          reject(new Error("timeout"));
        }, timeoutMs);
        img.onload = () => {
          window.clearTimeout(timer);
          resolve();
        };
        img.onerror = () => {
          window.clearTimeout(timer);
          reject(new Error("error"));
        };
        img.referrerPolicy = "no-referrer";
        img.src = url;
      });
      setOnline(true);
    } catch {
      setOnline(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    const onOnline = () => {
      // Verify actual internet reachability before marking online
      setOnline(false);
      checkConnectivity();
    };
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
      // nothing to abort for image ping
    };
  }, []);

  return { online, checking, checkConnectivity };
}