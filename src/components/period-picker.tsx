import Link from "@/components/app-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { presets, type Period } from "@/lib/period";

/** Quick ranges plus a From/To form, the same on every statistics page. `keep` holds other
 * query parameters (e.g. a building filter) that a range change should keep. */
export function PeriodPicker({
  path,
  period,
  today,
  locale,
  keep = {},
}: {
  path: string;
  period: Period;
  today: string;
  locale: Locale;
  keep?: Record<string, string | undefined>;
}) {
  const kept = Object.entries(keep).filter((entry): entry is [string, string] => Boolean(entry[1]));
  const href = (start: string, end: string) => `${path}?${new URLSearchParams([...kept, ["from", start], ["to", end]])}`;
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex flex-wrap gap-2">
        {presets(today).map((preset) => (
          <Button key={preset.label} asChild size="sm" variant={preset.start === period.start && preset.end === period.end ? "default" : "outline"}>
            <Link href={href(preset.start, preset.end)}>{t(locale, preset.label)}</Link>
          </Button>
        ))}
      </div>
      <form className="flex flex-wrap items-end gap-2" method="get" action={path}>
        {kept.map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <label className="grid gap-1 text-sm">
          {t(locale, "From")}
          <Input type="date" name="from" defaultValue={period.start} max={today} required />
        </label>
        <label className="grid gap-1 text-sm">
          {t(locale, "To")}
          <Input type="date" name="to" defaultValue={period.end} max={today} required />
        </label>
        <Button type="submit" size="sm" variant="outline">{t(locale, "Show range")}</Button>
      </form>
    </div>
  );
}
