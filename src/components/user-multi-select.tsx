"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { t, type Locale } from "@/lib/i18n";

export function UserMultiSelect({
  name,
  options,
  defaultValue = "",
  locale,
}: {
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  locale: Locale;
}) {
  const initial = defaultValue.split(/[,\s]+/).filter(Boolean);
  const [picked, setPicked] = useState<string[]>(initial);
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const shown = useMemo(
    () => options.filter((option) => !needle || option.label.toLowerCase().includes(needle)),
    [needle, options],
  );

  function toggle(value: string) {
    setPicked((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

  return (
    <div className="grid gap-2">
      <input type="hidden" name={name} value={picked.join(",")} />
      {options.length > 8 ? (
        <Input value={query} placeholder="Search" onChange={(event) => setQuery(event.target.value)} />
      ) : null}
      <div className="grid max-h-48 gap-1 overflow-y-auto rounded-lg border p-2">
        {shown.length === 0 ? <p className="text-muted-foreground text-sm">{t(locale, "Nothing matches this search.")}</p> : null}
        {shown.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4" checked={picked.includes(option.value)} onChange={() => toggle(option.value)} />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}
