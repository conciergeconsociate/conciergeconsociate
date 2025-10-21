import React, { useEffect } from "react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { Button } from "./ui/button";

/**
 * Renders a full-screen overlay to prevent interaction when offline.
 * Uses the project's design tokens and UI Button.
 */
export default function ConnectivityGate() {
  const { online, checkConnectivity } = useOnlineStatus();

  useEffect(() => {
    // Prevent background scroll while overlay is visible
    if (!online) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [online]);

  if (online) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-background/90 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card text-card-foreground border rounded-xl shadow-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">You’re Offline</h2>
        <p className="text-sm text-muted-foreground">
          We couldn’t detect an internet connection. Navigation and actions are disabled
          until you’re back online.
        </p>
        <div className="flex items-center gap-3">
          <Button onClick={checkConnectivity} variant="default">Retry</Button>
          <Button onClick={() => window.location.reload()} variant="secondary">Reload</Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Tip: check your Wi‑Fi or mobile data, then press Retry.
        </p>
      </div>
    </div>
  );
}