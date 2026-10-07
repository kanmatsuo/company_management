"use client";

import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { t, type Locale } from "@/lib/i18n";

/** The app's one dropdown: a button that opens a list (with search when it is long).
 * Uncontrolled (`defaultValue`, submits under `name`) or controlled (`value` +
 * `onValueChange`). */
export function SearchSelect({
  id,
  name,
  required,
  defaultValue = "",
  value: controlled,
  options,
  locale,
  onValueChange,
  placeholder = "Choose",
  disabled,
  className,
}: {
  id?: string;
  name?: string;
  required?: boolean;
  defaultValue?: string;
  value?: string;
  options: { value: string; label: string; disabled?: boolean }[];
  locale: Locale;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [own, setOwn] = useState(defaultValue);
  const value = controlled ?? own;
  const setValue = (next: string) => {
    if (controlled === undefined) setOwn(next);
  };
  const selected = options.find((option) => option.value === value);
  const needle = query.trim().toLowerCase();
  const shown = options.filter((option) => {
    if (!needle) return true;
    const label = t(locale, option.label).toLowerCase();
    return label.includes(needle) || option.label.toLowerCase().includes(needle);
  });

  function choose(next: string) {
    setValue(next);
    setQuery("");
    setOpen(false);
    onValueChange?.(next);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {name ? (
        <input className="sr-only" tabIndex={-1} name={name} value={value} required={required} onChange={() => undefined} onInvalid={() => setOpen(true)} />
      ) : null}
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" disabled={disabled} className={`h-8 w-full justify-between px-2.5 font-normal ${className ?? ""}`}>
          <span className={`truncate ${selected ? "" : "text-muted-foreground"}`}>{selected ? selected.label : t(locale, placeholder)}</span>
          <ChevronsUpDown className="size-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-56 gap-2 p-2">
        {options.length > 8 ? (
          <Input
            value={query}
            placeholder="Search"
            autoFocus
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              const first = shown.find((option) => !option.disabled);
              if (event.key === "Enter" && first) {
                event.preventDefault();
                choose(first.value);
              }
            }}
          />
        ) : null}
        <div className="max-h-60 overflow-y-auto">
          {shown.length === 0 ? (
            <p className="px-2 py-3 text-muted-foreground text-sm">{t(locale, "Nothing matches this search.")}</p>
          ) : (
            shown.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                className={`flex w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted disabled:pointer-events-none disabled:opacity-40 ${option.value === value ? "bg-muted" : ""}`}
                onClick={() => choose(option.value)}
              >
                {option.label}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
