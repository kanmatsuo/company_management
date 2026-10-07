"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** A moment as "YYYY-MM-DD HH:MM" in the viewer's time zone (shown once in the browser). */
export function When({ value }: { value: string | null | undefined }) {
  const inBrowser = useSyncExternalStore(noop, () => true, () => false);
  const date = value ? new Date(value) : null;
  if (!inBrowser || !date || Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("sv-SE").slice(0, 16);
}
