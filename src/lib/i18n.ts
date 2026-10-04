import { koUi } from "@/lib/ko-ui";

export const LOCALE_COOKIE = "locale";
export type Locale = "en" | "ko";

export function parseLocale(value: string | null | undefined): Locale {
  return value === "ko" ? "ko" : "en";
}

/** English UI copy is the key; Korean lives in ko-ui.ts. */
export function t(locale: Locale, text: string) {
  if (locale === "ko") return koUi[text] ?? text;
  return text;
}
