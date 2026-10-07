"use client";

import { createContext, use } from "react";
import type { Locale } from "@/lib/i18n";

export const LocaleContext = createContext<Locale>("en");

export function useLocale() {
  return use(LocaleContext);
}

/** Provides the locale from a server component (a context's .Provider can't be used there). */
export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}
