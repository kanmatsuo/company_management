"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Draft purchases pick up a card tap that arrives on the till reader. */
export function RefreshDraft() {
  const router = useRouter();
  useEffect(() => {
    const timer = window.setInterval(() => router.refresh(), 2000);
    return () => window.clearInterval(timer);
  }, [router]);
  return null;
}
