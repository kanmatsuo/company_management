"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** Time of day in the browser's time zone, e.g. "16:30:05" (shown only in the browser). */
export function ClockTime({ value }: { value: string }) {
  const inBrowser = useSyncExternalStore(noop, () => true, () => false);
  if (!inBrowser) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString("sv-SE");
}
