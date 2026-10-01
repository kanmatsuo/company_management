"use client";

import { Moon, Sun } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
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

  return (
    <Button size="icon" variant="ghost" onClick={() => setPreference("theme_mode", nextTheme)} aria-label={`Theme: ${themeMode}`}>
      <Sun className="hidden dark:block" />
      <Moon className="block dark:hidden" />
    </Button>
  );
}
