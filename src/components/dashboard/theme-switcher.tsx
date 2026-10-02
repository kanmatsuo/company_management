"use client";

import { Moon, Sun } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useLocale } from "@/components/locale-context";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

export function ThemeSwitcher() {
  const { themeMode, setPreference } = usePreferencesStore(
    useShallow((state) => ({
      themeMode: state.values.theme_mode,
      setPreference: state.setPreference,
    })),
  );

  const nextTheme = themeMode === "dark" ? "light" : "dark";
  const locale = useLocale();

  return (
    <Button size="icon" variant="ghost" onClick={() => setPreference("theme_mode", nextTheme)} aria-label={`${t(locale, "Theme")}: ${t(locale, themeMode === "dark" ? "Dark" : "Light")}`}>
      <Sun className="hidden dark:block" />
      <Moon className="block dark:hidden" />
    </Button>
  );
}
