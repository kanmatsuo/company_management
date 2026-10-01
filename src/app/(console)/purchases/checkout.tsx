"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { confirmPurchase, developerBalance } from "@/app/(console)/mutations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TapSimulator } from "@/app/(console)/purchases/tap-simulator";

type Person = {
  id?: number;
  full_name?: string;
  employee_number?: string;
  department?: string;
};

type Presented = {
  developer?: Person | null;
  presented_at?: string;
  expires_at?: string;
} | null;

type Item = { id: number; good_name: string; quantity: number; unit_price: string; line_total: string; start?: string | null; end?: string | null };

function cents(value: string) {
  const [whole, fraction = "00"] = value.split(".");
  const sign = whole.startsWith("-") ? -1 : 1;
  const digits = whole.replace("-", "");
  return sign * (Number(digits) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2)));
}

function money(value: number) {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export function Checkout({
  purchaseId,
  positionId,
  socketBase,
  items,
  total,
  currency,
  presented,
  simulator = false,
}: {
  purchaseId: number;
  positionId: number;
  socketBase: string;
  items: Item[];
  total: string;
  currency: string;
  presented: Presented;
  simulator?: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"basket" | "waiting" | "ready">(presented?.developer ? "ready" : "basket");
  const [live, setLive] = useState("Waiting for the card");
  const [problem, setProblem] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [balance, setBalance] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [selling, setSelling] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const developer = presented?.developer ?? null;

  useEffect(() => {
    if (mode === "waiting" && developer) setMode("ready");
  }, [mode, developer]);

  useEffect(() => {
    const id = developer?.id;
    if (mode !== "ready" || typeof id !== "number") return;
    void developerBalance(id).then(setBalance);
  }, [mode, developer?.id]);

  useEffect(() => {
    if (mode !== "waiting") return;
    let stopped = false;
    let socket: WebSocket | null = null;
    let wait = 1000;
    let timer = 0;

    async function connect() {
      const response = await fetch("/api/realtime/ticket", { method: "POST" });
      if (!response.ok || stopped) {
        setLive("Live updates need permission to watch this counter");
        return;
      }
      const body = (await response.json()) as { ticket?: string };
      if (!body.ticket || stopped) return;
      socket = new WebSocket(`${socketBase}/ws/counters/${positionId}/?ticket=${encodeURIComponent(body.ticket)}`);
      socket.onopen = () => setLive("Waiting for the card");
      socket.onmessage = (event) => {
        const message = JSON.parse(String(event.data)) as {
          type?: string;
          data?: { accepted?: boolean; display_message?: string; purchase?: number | null };
        };
        if (message.type !== "card_tapped" || !message.data) return;
        if (message.data.purchase != null && message.data.purchase !== purchaseId) return;
        if (!message.data.accepted) {
          setProblem(message.data.display_message || "Card was not accepted");
          return;
        }
        setProblem("");
        router.refresh();
      };
      socket.onclose = () => {
        if (!stopped) timer = window.setTimeout(connect, wait);
        wait = Math.min(wait * 2, 10000);
      };
    }

    const poll = window.setInterval(() => router.refresh(), 1000);
    void connect();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      window.clearInterval(poll);
      socket?.close();
    };
  }, [mode, positionId, purchaseId, router, socketBase]);

  function typeDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...pin];
    next[index] = digit;
    setPin(next);
    if (digit && index < 3) inputs.current[index + 1]?.focus();
  }

  async function sell() {
    setSelling(true);
    setProblem("");
    const data = new FormData();
    data.set("pin", pin.join(""));
    const result = await confirmPurchase(purchaseId, null, data);
    setSelling(false);
    setConfirming(false);
    setPin(["", "", "", ""]);
    if (result?.message) setProblem(result.message);
  }

  if (mode === "basket") {
    return (
      <Button type="button" disabled={items.length === 0} onClick={() => setMode(developer ? "ready" : "waiting")}>
        Scan card to buy
      </Button>
    );
  }

  if (mode === "waiting" || !developer) {
    return (
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Waiting for the card</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <p className="text-sm">{live}. Ask the developer to tap their card on the till reader.</p>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-emerald-500" />
            </div>
            {problem ? <p className="text-destructive text-sm">{problem}</p> : null}
          </CardContent>
        </Card>
        {simulator ? <TapSimulator purchaseId={purchaseId} /> : null}
      </div>
    );
  }

  const after = balance === null ? null : money(cents(balance) - cents(total));
  const pinReady = pin.every((digit) => digit.length === 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buyer</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <p className="text-sm"><span className="text-muted-foreground">Developer · </span>{developer.full_name || "—"}</p>
          <p className="text-sm"><span className="text-muted-foreground">Employee number · </span>{developer.employee_number || "—"}</p>
          <p className="text-sm"><span className="text-muted-foreground">Department · </span>{developer.department || "—"}</p>
          <p className="text-sm"><span className="text-muted-foreground">Card · </span>Recognized{presented?.presented_at ? ` at ${new Date(presented.presented_at).toLocaleTimeString()}` : ""}</p>
          <p className="text-sm"><span className="text-muted-foreground">Current balance · </span>{balance === null ? "Not available for this account" : `${balance} ${currency}`}</p>
          <p className="text-sm"><span className="text-muted-foreground">Balance after pay · </span>{after === null ? "—" : `${after} ${currency}`}</p>
          <p className="text-sm"><span className="text-muted-foreground">To pay · </span>{total} {currency}</p>
        </div>
        <ul className="grid gap-1 text-sm">
          {items.map((item) => (
            <li key={item.id}>
              {item.good_name}
              {item.start ? ` · ${new Date(item.start).toLocaleTimeString()}–${item.end ? new Date(item.end).toLocaleTimeString() : ""}` : ""}
              {" · "}{item.quantity} × {item.unit_price} = {item.line_total}
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={(node) => { inputs.current[index] = node; }}
              value={digit}
              inputMode="numeric"
              autoComplete="off"
              maxLength={1}
              aria-label={`PIN digit ${index + 1}`}
              className="h-12 w-12 rounded-lg border border-input text-center text-lg"
              onChange={(event) => typeDigit(index, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Backspace" && !pin[index] && index > 0) inputs.current[index - 1]?.focus();
              }}
            />
          ))}
        </div>
        {problem ? <p className="text-destructive text-sm">{problem}</p> : null}
        <Button type="button" disabled={!pinReady || selling} onClick={() => setConfirming(true)}>Sell</Button>
        {confirming ? (
          <div className="grid gap-3 rounded-lg border p-4">
            <p className="text-sm">Sell {total} {currency} to {developer.full_name || "this developer"}? This payment cannot be undone.</p>
            <div className="flex gap-2">
              <Button type="button" disabled={selling} onClick={() => void sell()}>{selling ? "Paying" : "OK"}</Button>
              <Button type="button" variant="outline" disabled={selling} onClick={() => setConfirming(false)}>Cancel</Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
