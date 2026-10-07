"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Minus, Plus, ScanLine } from "lucide-react";
import { openCourtBooking } from "@/app/(console)/mutations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/date-picker";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");

type Slot = {
  start: string;
  end: string;
  available: boolean;
  start_time?: string;
  end_time?: string;
  state?: string;
};

function cents(value: string) {
  const [whole, fraction = "00"] = value.split(".");
  const sign = whole.startsWith("-") ? -1 : 1;
  return sign * (Number(whole.replace("-", "")) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2)));
}

function money(value: number) {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

function hhmm(value: string | undefined, fallback: string) {
  if (value) return value.slice(0, 5);
  return fallback.length > 10 ? fallback.slice(11, 16) : fallback.slice(0, 5);
}

function stateOf(slot: Slot) {
  return slot.state ?? (slot.available ? "FREE" : "BOOKED");
}

function shiftDay(date: string, days: number) {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + days);
  return day.toISOString().slice(0, 10);
}

const STATE_LABEL: Record<string, string> = { BOOKED: "Booked", PAST: "Past", NOT_YET_OPEN: "Not open yet" };

export function BookCourt({
  goodId,
  court,
  price,
  currency,
  date,
  today,
  lastDay,
  maxPerBooking,
  slots,
  error,
  initialStart = "",
  locale = "en",
  children,
}: {
  goodId: number;
  court: string;
  price: string;
  currency: string;
  date: string;
  today: string;
  lastDay: string;
  maxPerBooking: number;
  slots: Slot[];
  error?: string | null;
  initialStart?: string;
  locale?: Locale;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const times = slots.map((slot) => hhmm(slot.start_time, slot.start));
  const initial = times.indexOf(initialStart.slice(0, 5));
  const [startIndex, setStartIndex] = useState(initial >= 0 && stateOf(slots[initial]) === "FREE" ? initial : -1);
  const [count, setCount] = useState(1);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const free = (index: number) => index < slots.length && stateOf(slots[index]) === "FREE";
  const freeRun = (from: number, length: number) => Array.from({ length }, (_, i) => from + i).every(free);
  const chosen = startIndex >= 0 && freeRun(startIndex, count);
  const start = startIndex >= 0 ? times[startIndex] : "";
  const last = chosen ? slots[startIndex + count - 1] : null;
  const endTime = last ? hhmm(last.end_time, last.end) : "";
  const canGrow = chosen && count < maxPerBooking && free(startIndex + count);

  function go(day: string) {
    if (day < today || day > lastDay) return;
    router.push(`?date=${day}`);
  }

  function pick(index: number) {
    if (!free(index)) return;
    setMessage("");
    // A later free slot within the limit extends the booking; anything else starts over.
    const length = index - startIndex + 1;
    if (startIndex >= 0 && index > startIndex && length <= maxPerBooking && freeRun(startIndex, length)) {
      setCount(length);
    } else {
      setStartIndex(index);
      setCount(1);
    }
  }

  async function open() {
    if (!chosen) return;
    setPending(true);
    setMessage("");
    const data = new FormData();
    data.set("good", String(goodId));
    data.set("date", date);
    data.set("start_time", start);
    data.set("end_time", endTime);
    const result = await openCourtBooking(null, data);
    setPending(false);
    if (result?.message) setMessage(result.message);
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <Card>
        <CardHeader>
          <CardTitle>Pick a time</CardTitle>
          <CardDescription>{t(locale, "Click a free slot to start, then a later one to book up to {n} in a row.").replace("{n}", String(maxPerBooking))}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="icon" disabled={date <= today} onClick={() => go(shiftDay(date, -1))} aria-label={t(locale, "Previous day")}>
              <ChevronLeft />
            </Button>
            <DatePicker value={date} min={today} max={lastDay} required locale={locale} className="w-40" onValueChange={(day) => day && go(day)} />
            <Button type="button" variant="outline" size="icon" disabled={date >= lastDay} onClick={() => go(shiftDay(date, 1))} aria-label={t(locale, "Next day")}>
              <ChevronRight />
            </Button>
            {date !== today ? (
              <Button type="button" variant="ghost" onClick={() => go(today)}>
                {t(locale, "Today")}
              </Button>
            ) : null}
            <div className="ml-auto flex flex-wrap items-center gap-3 text-muted-foreground text-xs">
              <Legend className="border-primary/40 bg-primary/5" label={t(locale, "Free")} />
              <Legend className="border-primary bg-primary" label={t(locale, "Chosen")} />
              <Legend className="border-border bg-muted" label={t(locale, "Booked")} />
            </div>
          </div>

          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          {!error && slots.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm">{t(locale, "The court is closed on this day.")}</p>
          ) : null}

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6">
            {slots.map((slot, index) => {
              const state = stateOf(slot);
              const inChoice = chosen && index >= startIndex && index < startIndex + count;
              return (
                <button
                  key={slot.start}
                  type="button"
                  disabled={state !== "FREE"}
                  onClick={() => pick(index)}
                  className={cn(
                    "flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors",
                    state === "FREE" && !inChoice && "border-primary/40 bg-primary/5 hover:border-primary hover:bg-primary/10",
                    inChoice && "border-primary bg-primary text-primary-foreground shadow-sm",
                    state === "BOOKED" && "cursor-not-allowed border-border bg-muted text-muted-foreground",
                    (state === "PAST" || state === "NOT_YET_OPEN") && "cursor-not-allowed border-dashed text-muted-foreground/60",
                  )}
                >
                  <span className="font-semibold text-sm tabular-nums">{times[index]}</span>
                  <span className={cn("text-xs tabular-nums", inChoice ? "text-primary-foreground/80" : "text-muted-foreground")}>
                    {state === "FREE" ? `– ${hhmm(slot.end_time, slot.end)}` : t(locale, STATE_LABEL[state] ?? state)}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:sticky lg:top-4">
        <Card>
          <CardHeader>
            <CardTitle>Booking</CardTitle>
            <CardDescription>The developer taps their card on the seller&apos;s till reader, then enters their PIN.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <dl className="grid gap-2 text-sm">
              <Row label={t(locale, "Court")} value={court} />
              <Row label={t(locale, "Date")} value={date} />
              <Row label={t(locale, "Time")} value={chosen ? `${start} – ${endTime}` : "—"} />
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">{t(locale, "Slots")}</dt>
                <dd className="flex items-center gap-1">
                  <Button type="button" variant="outline" size="icon" className="size-7" disabled={!chosen || count <= 1} onClick={() => setCount(count - 1)} aria-label={t(locale, "Fewer slots")}>
                    <Minus />
                  </Button>
                  <span className="w-8 text-center font-medium tabular-nums">{chosen ? count : 0}</span>
                  <Button type="button" variant="outline" size="icon" className="size-7" disabled={!canGrow} onClick={() => setCount(count + 1)} aria-label={t(locale, "More slots")}>
                    <Plus />
                  </Button>
                </dd>
              </div>
            </dl>
            <div className="flex items-baseline justify-between border-t pt-4">
              <span className="text-muted-foreground text-sm">{t(locale, "Total")}</span>
              <span className="font-semibold text-2xl tabular-nums">
                {money(chosen ? cents(price) * count : 0)} <span className="font-normal text-muted-foreground text-sm">{currency}</span>
              </span>
            </div>
            {message ? <p className="text-destructive text-sm">{message}</p> : null}
            <Button type="button" size="lg" disabled={!chosen || pending} onClick={() => void open()}>
              <ScanLine />
              {pending ? t(locale, "Opening") : t(locale, "Scan card to book")}
            </Button>
            {!chosen ? <p className="text-center text-muted-foreground text-xs">{t(locale, "Choose a free slot first.")}</p> : null}
          </CardContent>
        </Card>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-3 rounded-sm border", className)} />
      {label}
    </span>
  );
}
