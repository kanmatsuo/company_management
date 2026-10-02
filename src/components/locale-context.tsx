"use client";

import { createContext, use } from "react";
import type { Locale } from "@/lib/i18n";

export const LocaleContext = createContext<Locale>("en");

export function useLocale() {
  return use(LocaleContext);
}
