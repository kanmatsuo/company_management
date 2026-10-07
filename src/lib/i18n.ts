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

/**
 * Translate a message that may already have numbers/dates filled in
 * (e.g. API/Django explain strings). Tries an exact key, then known templates.
 */
export function tMessage(locale: Locale, message: string) {
  if (!message) return message;
  const exact = t(locale, message);
  if (locale !== "ko" || exact !== message) return exact;

  let match: RegExpExecArray | null;
  if ((match = /^Wrong PIN\. (\d+) attempts left\.$/.exec(message))) {
    return t(locale, "Wrong PIN. {n} attempts left.").replace("{n}", match[1]);
  }
  if ((match = /^PIN locked until (.+)\.$/.exec(message))) {
    return t(locale, "PIN locked until {when}.").replace("{when}", match[1]);
  }
  if ((match = /^Not enough balance\. Balance (.+)\. This sale needs (.+)\.$/.exec(message))) {
    return t(locale, "Not enough balance. Balance {balance}. This sale needs {required}.")
      .replace("{balance}", match[1])
      .replace("{required}", match[2]);
  }
  // Text the server writes into records.
  if ((match = /^Purchase at (.+)$/.exec(message))) {
    return t(locale, "Purchase at {store}").replace("{store}", match[1]);
  }
  if ((match = /^Registered by tapping on (.+)$/.exec(message))) {
    return t(locale, "Registered by tapping on {reader}").replace("{reader}", match[1]);
  }
  return message;
}
