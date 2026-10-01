"use client";

import { useEffect, useState } from "react";
import { detectedReaders, openCourtBooking, type TillReader } from "@/app/(console)/mutations";
import { Button } from "@/components/ui/button";

type Slot = { start: string; end: string; available: boolean };

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

function clock(value: string, ready: boolean) {
  if (!ready) return value.slice(11, 16);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString();
}

export function BookCourt({
  goodId,
  court,
  price,
  currency,
  servicePosition,
  maxPerBooking,
  slots,
  reader,
}: {
  goodId: number;
  court: string;
  price: string;
  currency: string;
  servicePosition: number | null;
  maxPerBooking: number;
  slots: Slot[];
  reader: TillReader | null;
}) {
  const [ready, setReady] = useState(false);
  const [start, setStart] = useState("");
  const [count, setCount] = useState(1);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [connected, setConnected] = useState(reader);
  useEffect(() => setReady(true), []);
  useEffect(() => {
    const timer = window.setInterval(() => {
      void detectedReaders().then((next) => setConnected(next.reader));
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const cost = cents(price) * count;
  const canOpen = Boolean(servicePosition && start && count >= 1 && count <= maxPerBooking);

  async function open() {
    setPending(true);
    setMessage("");
    const data = new FormData();
    data.set("service_position", String(servicePosition));
    data.set("good", String(goodId));
    data.set("start", start);
    data.set("slots", String(count));
    if (connected?.code) data.set("reader", connected.code);
    const result = await openCourtBooking(null, data);
    setPending(false);
    if (result?.message) setMessage(result.message);
  }

  if (!servicePosition) {
    return <p className="text-sm">This court cannot be opened from this account. The playground desk has to sell it.</p>;
  }

  return (
    <div className="grid max-w-md gap-4">
      <p className="text-sm">
        {connected
          ? `Reader on this PC: ${connected.name || connected.code}.`
          : "No till reader is connected to this PC yet. The first card tap can still attach one."}
      </p>
      <p className="text-sm">Up to {maxPerBooking} slots in one booking. Who is booking is known after the card tap.</p>
      <label className="grid gap-1 text-sm">
        First slot
        <select className="h-8 rounded-lg border border-input bg-transparent px-2" value={start} onChange={(event) => setStart(event.target.value)}>
          <option value="">Choose a time</option>
          {slots.map((slot) => (
            <option key={slot.start} value={slot.start} disabled={!slot.available}>
              {clock(slot.start, ready)} – {clock(slot.end, ready)}{slot.available ? "" : " · taken"}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        How many slots
        <input
          type="number"
          min={1}
          max={maxPerBooking}
          value={count}
          className="h-8 rounded-lg border border-input bg-transparent px-2"
          onChange={(event) => setCount(Math.max(1, Number(event.target.value) || 1))}
        />
      </label>
      <p className="text-sm">{court}: {money(cost)} {currency}. The developer taps their card and PIN on the next screen.</p>
      {message ? <p className="text-destructive text-sm">{message}</p> : null}
      <Button type="button" disabled={!canOpen || pending} onClick={() => void open()}>
        {pending ? "Opening" : "Scan card to book"}
      </Button>
    </div>
  );
}
