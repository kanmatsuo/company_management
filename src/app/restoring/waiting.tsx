"use client";

import { useEffect, useState } from "react";

/** Polls /api/system-up; when the backend answers again (twice), goes back to Backups. */
export function Waiting({ label }: { label: string }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    let upCount = 0;
    let wentDown = false;
    const started = Date.now();
    const timer = window.setInterval(async () => {
      setSeconds(Math.round((Date.now() - started) / 1000));
      try {
        const response = await fetch("/api/system-up", { cache: "no-store" });
        const body = (await response.json()) as { up?: boolean };
        if (!body.up) wentDown = true;
        upCount = body.up ? upCount + 1 : 0;
      } catch {
        wentDown = true;
        upCount = 0;
      }
      // Back up for a moment after having been down, or never down after 3 minutes
      // (the restore stopped before touching anything): back to the page either way.
      if ((wentDown && upCount >= 2) || (!wentDown && Date.now() - started > 180_000)) {
        window.location.href = "/backups?restored=1";
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <p className="text-muted-foreground text-sm tabular-nums">
      {label}: {seconds} s
    </p>
  );
}
