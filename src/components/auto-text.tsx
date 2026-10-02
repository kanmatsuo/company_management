"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/components/locale-context";
import { t } from "@/lib/i18n";

function translateString(locale: ReturnType<typeof useLocale>, value: string) {
  const trimmed = value.trim();
  if (!trimmed) return value;
  const translated = t(locale, trimmed);
  return translated === trimmed ? value : translated;
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <h1 className="font-semibold text-2xl tracking-tight">
      <AutoText>{children}</AutoText>
    </h1>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return (
    <p className="text-muted-foreground text-sm">
      <AutoText>{children}</AutoText>
    </p>
  );
}

export function AutoText({ children }: { children: ReactNode }) {
  const locale = useLocale();
  if (typeof children === "string") return translateString(locale, children);
  if (typeof children === "number") return children;
  if (!Array.isArray(children)) return children;
  return children.map((child, index) =>
    typeof child === "string" ? <span key={index}>{translateString(locale, child)}</span> : child,
  );
}
