"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AutoText } from "@/components/auto-text";

/** Reloads the page data every few seconds while switched on (remembered in this browser). */
export function LiveRefresh({ seconds = 3 }: { seconds?: number }) {
  const router = useRouter();
  const [on, setOn] = useState(true);
  useEffect(() => {
    if (!on) return;
    const timer = window.setInterval(() => router.refresh(), seconds * 1000);
    return () => window.clearInterval(timer);
  }, [on, router, seconds]);
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={on} onChange={(event) => setOn(event.target.checked)} />
      <AutoText>Live (refresh every 3 s)</AutoText>
    </label>
  );
}
