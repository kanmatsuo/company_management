import "server-only";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, parseLocale, type Locale } from "@/lib/i18n";

export async function getLocale(): Promise<Locale> {
  return parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
}
