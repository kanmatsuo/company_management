"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LOCALE_COOKIE, type Locale, t } from "@/lib/i18n";

const YEAR = 60 * 60 * 24 * 365;

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  function choose(next: Locale) {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${YEAR}; SameSite=Lax${secure}`;
    router.refresh();
  }
  return (
    <div className="flex items-center gap-1" aria-label={t(locale, "Language")}>
      {(["en", "ko"] as const).map((choice) => (
        <Button key={choice} type="button" size="sm" variant={choice === locale ? "default" : "outline"} onClick={() => choose(choice)}>
          {choice === "en" ? "EN" : "KO"}
        </Button>
      ))}
    </div>
  );
}
