"use client";

import { Settings } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

export function LayoutControls() {
  const { values, setPreference, resetPreferences } = usePreferencesStore(
    useShallow((state) => ({
      values: state.values,
      setPreference: state.setPreference,
      resetPreferences: state.resetPreferences,
    })),
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Layout settings">
          <Settings />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="flex flex-col gap-5">
          <div className="space-y-1.5">
            <h4 className="font-medium text-sm leading-none">Preferences</h4>
            <p className="text-muted-foreground text-xs">Theme and sidebar behavior.</p>
          </div>
          <div className="space-y-3 **:data-[slot=toggle-group]:w-full **:data-[slot=toggle-group-item]:flex-1 **:data-[slot=toggle-group-item]:text-xs">
            <div className="space-y-1">
              <Label className="font-medium text-xs">Theme</Label>
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
                <ToggleGroupItem value="light">Light</ToggleGroupItem>
                <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="space-y-1">
              <Label className="font-medium text-xs">Sidebar style</Label>
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
                <ToggleGroupItem value="sidebar">Sidebar</ToggleGroupItem>
                <ToggleGroupItem value="inset">Inset</ToggleGroupItem>
                <ToggleGroupItem value="floating">Floating</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="space-y-1">
              <Label className="font-medium text-xs">Sidebar collapse</Label>
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
                <ToggleGroupItem value="icon">Icon</ToggleGroupItem>
                <ToggleGroupItem value="offcanvas">Hide</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <Button type="button" size="sm" variant="outline" className="w-full text-xs" onClick={resetPreferences}>
              Restore defaults
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
