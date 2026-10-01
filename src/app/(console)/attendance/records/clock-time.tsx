"use client";

import { useEffect, useState } from "react";

export function ClockTime({ value }: { value: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const date = new Date(value);
    setLabel(Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString());
  }, [value]);
  return label || "—";
}
