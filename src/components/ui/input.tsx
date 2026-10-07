"use client";

import * as React from "react"
import { cn } from "cn"
import { useLocale } from "@/components/locale-context"
import { t } from "@/lib/i18n"

function Input({ className, type, placeholder, "aria-label": ariaLabel, ...props }: React.ComponentProps<"input">) {
  const locale = useLocale();
  return (
    <input
      type={type}
      data-slot="input"
      placeholder={typeof placeholder === "string" ? t(locale, placeholder) : placeholder}
      aria-label={typeof ariaLabel === "string" ? t(locale, ariaLabel) : ariaLabel}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:mr-3 file:inline-flex file:h-6 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary/10 file:px-2.5 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/15 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
