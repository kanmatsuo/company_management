"use client";

import { useLocale } from "@/components/locale-context";
import { t } from "@/lib/i18n";

export function ProgressBar({
  value,
  total,
  caption,
}: {
  value: number;
  total: number;
  caption?: string;
}) {
  const locale = useLocale();
  const whole = Math.max(total, value, 0);
  const ratio = whole === 0 ? 0 : Math.round((value / whole) * 100);
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-semibold text-lg tabular-nums">
          {value.toLocaleString("en-US")}
          <span className="ml-1 font-normal text-muted-foreground text-sm">{t(locale, "of")} {whole.toLocaleString("en-US")}</span>
        </p>
        <p className="font-medium text-sm tabular-nums text-emerald-600">{ratio}%</p>
      </div>
      <div
        className="h-3 overflow-hidden rounded-full bg-zinc-700/80"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={whole}
      >
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${ratio}%` }} />
      </div>
      {caption ? <p className="text-muted-foreground text-sm">{caption}</p> : null}
    </div>
  );
}
