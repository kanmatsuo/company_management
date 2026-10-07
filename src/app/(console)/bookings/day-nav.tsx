"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/date-picker";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

function shiftDay(date: string, days: number) {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + days);
  return day.toISOString().slice(0, 10);
}

/** Previous day, date box, next day and Today; changes ?date= on the current page. */
export function DayNav({ date, today, locale = "en" }: { date: string; today: string; locale?: Locale }) {
  const router = useRouter();
  const go = (day: string) => router.push(`?date=${day}`);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="icon" onClick={() => go(shiftDay(date, -1))} aria-label={t(locale, "Previous day")}>
        <ChevronLeft />
      </Button>
      <DatePicker value={date} required locale={locale} className="w-40" onValueChange={(day) => day && go(day)} />
      <Button type="button" variant="outline" size="icon" onClick={() => go(shiftDay(date, 1))} aria-label={t(locale, "Next day")}>
        <ChevronRight />
      </Button>
      {date !== today ? (
        <Button type="button" variant="ghost" onClick={() => go(today)}>
          {t(locale, "Today")}
        </Button>
      ) : null}
    </div>
  );
}
