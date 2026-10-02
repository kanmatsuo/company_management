"use client";

import { useEffect, useState } from "react";
import { detectedReaders, openCourtBooking, type TillReader } from "@/app/(console)/mutations";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

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

function openSlot(slot: Slot) {
  if (slot.state) return slot.state === "FREE";
  return slot.available;
}

export function BookCourt({
  goodId,
  court,
  price,
  currency,
  date,
  maxPerBooking,
  slots,
  reader,
  initialStart = "",
  locale = "en",
}: {
  goodId: number;
  court: string;
  price: string;
  currency: string;
  date: string;
  maxPerBooking: number;
  slots: Slot[];
  reader: TillReader | null;
  initialStart?: string;
  locale?: Locale;
}) {
  const [start, setStart] = useState(initialStart.slice(0, 5));
  const [count, setCount] = useState(1);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [connected, setConnected] = useState(reader);
  useEffect(() => {
    const timer = window.setInterval(() => {
      void detectedReaders().then((next) => setConnected(next.reader));
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const startIndex = slots.findIndex((slot) => hhmm(slot.start_time, slot.start) === start);
  const chosen = startIndex >= 0 ? slots.slice(startIndex, startIndex + count) : [];
  const onGrid = chosen.length === count && chosen.every(openSlot);
  const endTime = chosen.length === count ? hhmm(chosen[count - 1].end_time, chosen[count - 1].end) : "";
  const cost = cents(price) * count;

  async function open() {
    if (!onGrid) return;
    setPending(true);
    setMessage("");
    const data = new FormData();
    data.set("good", String(goodId));
    data.set("date", date);
    data.set("start_time", start);
    data.set("end_time", endTime);
    if (connected?.code) data.set("reader", connected.code);
    const result = await openCourtBooking(null, data);
    setPending(false);
    if (result?.message) setMessage(result.message);
  }

  return (
    <div className="grid max-w-md gap-4">
      <p className="text-sm">
        {connected
          ? `${t(locale, "Reader on this PC")}: ${connected.name || connected.code}.`
          : t(locale, "No till reader is connected to this PC yet. The first card tap can still attach one.")}
      </p>
      <p className="text-sm">{t(locale, "Up to")} {maxPerBooking} {t(locale, "slots in one booking. Who is booking is known after the card tap.")}</p>
      <label className="grid gap-1 text-sm">
        {t(locale, "Start")}
        <select className="h-8 rounded-lg border border-input bg-transparent px-2" value={start} onChange={(event) => setStart(event.target.value)}>
          <option value="">{t(locale, "Choose a time")}</option>
          {slots.map((slot) => {
            const label = hhmm(slot.start_time, slot.start);
            return (
              <option key={slot.start} value={label} disabled={!openSlot(slot)}>
                {label} – {hhmm(slot.end_time, slot.end)}{openSlot(slot) ? "" : ` · ${t(locale, "taken")}`}
              </option>
            );
          })}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        {t(locale, "How many slots")}
        <input
          type="number"
          min={1}
          max={maxPerBooking}
          value={count}
          className="h-8 rounded-lg border border-input bg-transparent px-2"
          onChange={(event) => setCount(Math.max(1, Math.min(maxPerBooking, Number(event.target.value) || 1)))}
        />
      </label>
      <p className="text-sm">
        {court}: {money(cost)} {currency}
        {endTime ? ` · ${date} ${start}–${endTime}` : ""}. {t(locale, "The developer taps their card and PIN on the next screen.")}
      </p>
      {start && !onGrid ? <p className="text-destructive text-sm">{t(locale, "That stretch includes a time that is taken or closed.")}</p> : null}
      {message ? <p className="text-destructive text-sm">{message}</p> : null}
      <Button type="button" disabled={!onGrid || pending} onClick={() => void open()}>
        {pending ? t(locale, "Opening") : t(locale, "Scan card to book")}
      </Button>
    </div>
  );
}
