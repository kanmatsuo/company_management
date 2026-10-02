"use client";

import { Settings } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLocale } from "@/components/locale-context";
import { t } from "@/lib/i18n";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

export function LayoutControls() {
  const { values, setPreference, resetPreferences } = usePreferencesStore(
    useShallow((state) => ({
      values: state.values,
      setPreference: state.setPreference,
      resetPreferences: state.resetPreferences,
    })),
  );

  const locale = useLocale();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" aria-label={t(locale, "Layout settings")}>
          <Settings />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="flex flex-col gap-5">
          <div className="space-y-1.5">
            <h4 className="font-medium text-sm leading-none">{t(locale, "Preferences")}</h4>
            <p className="text-muted-foreground text-xs">{t(locale, "Theme and sidebar behavior.")}</p>
          </div>
          <div className="space-y-3 **:data-[slot=toggle-group]:w-full **:data-[slot=toggle-group-item]:flex-1 **:data-[slot=toggle-group-item]:text-xs">
            <div className="space-y-1">
              <Label className="font-medium text-xs">{t(locale, "Theme")}</Label>
              <ToggleGroup
                size="sm"
                spacing={0}
                variant="outline"
                type="single"
                value={values.theme_mode}
                onValueChange={(mode) => {
                  if (mode === "light" || mode === "dark") {
                    setPreference("theme_mode", mode);
                  }
                }}
              >
                <ToggleGroupItem value="light">{t(locale, "Light")}</ToggleGroupItem>
                <ToggleGroupItem value="dark">{t(locale, "Dark")}</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="space-y-1">
              <Label className="font-medium text-xs">{t(locale, "Sidebar style")}</Label>
              <ToggleGroup
                size="sm"
                spacing={0}
                variant="outline"
                type="single"
                value={values.sidebar_variant}
                onValueChange={(value) => {
                  if (value === "sidebar" || value === "inset" || value === "floating") {
                    setPreference("sidebar_variant", value);
                  }
                }}
              >
                <ToggleGroupItem value="sidebar">{t(locale, "Sidebar")}</ToggleGroupItem>
                <ToggleGroupItem value="inset">{t(locale, "Inset")}</ToggleGroupItem>
                <ToggleGroupItem value="floating">{t(locale, "Floating")}</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="space-y-1">
              <Label className="font-medium text-xs">{t(locale, "Sidebar collapse")}</Label>
              <ToggleGroup
                size="sm"
                spacing={0}
                variant="outline"
                type="single"
                value={values.sidebar_collapsible}
                onValueChange={(value) => {
                  if (value === "icon" || value === "offcanvas") {
                    setPreference("sidebar_collapsible", value);
                  }
                }}
              >
                <ToggleGroupItem value="icon">{t(locale, "Icon")}</ToggleGroupItem>
                <ToggleGroupItem value="offcanvas">{t(locale, "Hide")}</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <Button type="button" size="sm" variant="outline" className="w-full text-xs" onClick={resetPreferences}>
              {t(locale, "Restore defaults")}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
