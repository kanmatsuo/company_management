"use client";

import { useState } from "react";
import { ChevronsUpDown, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { t, type Locale } from "@/lib/i18n";

/** A dropdown of known values (e.g. departments) that also takes a new one: type to
 * filter, Enter or "Add" to use what you typed. Submits the text under `name`. */
export function CreatableSelect({
  id,
  name,
  required,
  defaultValue = "",
  values,
  placeholder = "Choose",
  locale,
}: {
  id?: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  values: string[];
  placeholder?: string;
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [value, setValue] = useState(defaultValue);
  const typed = query.trim();
  const needle = typed.toLowerCase();
  const shown = values.filter((option) => !needle || option.toLowerCase().includes(needle));
  const exists = values.some((option) => option.toLowerCase() === needle);

  function choose(next: string) {
    setValue(next);
    setQuery("");
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <input className="sr-only" tabIndex={-1} name={name} value={value} required={required} onChange={() => undefined} onInvalid={() => setOpen(true)} />
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" className="h-8 w-full justify-between px-2.5 font-normal">
          <span className={`truncate ${value ? "" : "text-muted-foreground"}`}>{value || t(locale, placeholder)}</span>
          <ChevronsUpDown className="size-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-56 gap-2 p-2">
        <Input
          value={query}
          placeholder={t(locale, "Search, or type a new one")}
          autoFocus
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            if (typed && !exists && shown.length === 0) choose(typed);
            else if (shown[0]) choose(typed && exists ? values.find((v) => v.toLowerCase() === needle) ?? shown[0] : shown[0]);
            else if (typed) choose(typed);
          }}
        />
        <div className="max-h-60 overflow-y-auto">
          {typed && !exists ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left font-medium text-primary text-sm hover:bg-muted"
              onClick={() => choose(typed)}
            >
              <Plus className="size-3.5" />
              {t(locale, "Add")} &ldquo;{typed}&rdquo;
            </button>
          ) : null}
          {shown.map((option) => (
            <button
              key={option}
              type="button"
              className={`flex w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted ${option === value ? "bg-muted" : ""}`}
              onClick={() => choose(option)}
            >
              {option}
            </button>
          ))}
          {!typed && shown.length === 0 ? (
            <p className="px-2 py-3 text-muted-foreground text-sm">{t(locale, "None yet: type a new one.")}</p>
          ) : null}
          {value && !required ? (
            <button
              type="button"
              className="mt-1 flex w-full items-center gap-2 rounded-md border-t px-2 py-1.5 text-left text-muted-foreground text-sm hover:bg-muted"
              onClick={() => choose("")}
            >
              <X className="size-3.5" />
              {t(locale, "Clear")}
            </button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
