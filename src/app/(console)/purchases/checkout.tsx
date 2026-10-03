"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { confirmPurchase, developerBalance, stopWaitingForCard, waitForCard } from "@/app/(console)/mutations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditCard } from "lucide-react";
import { TapSimulator } from "@/app/(console)/purchases/tap-simulator";
import { AutoText } from "@/components/auto-text";
import { t, type Locale } from "@/lib/i18n";

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
  waitingForCard = false,
  simulator = false,
  verb = "buy",
  locale = "en",
}: {
  purchaseId: number;
  positionId: number;
  socketBase: string;
  items: Item[];
  total: string;
  currency: string;
  presented: Presented;
  /** The server still holds this purchase as the one waiting on its reader. */
  waitingForCard?: boolean;
  simulator?: boolean;
  verb?: "buy" | "book";
  locale?: Locale;
}) {
  const router = useRouter();
  const [chosenMode, setMode] = useState<"basket" | "waiting" | "ready">(presented?.developer ? "ready" : "basket");
  const [live, setLive] = useState("Waiting for the card");
  const [problem, setProblem] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [balance, setBalance] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [selling, setSelling] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const developer = presented?.developer ?? null;
  // Waiting ends as soon as the tapped card shows up on the purchase.
  const mode = chosenMode === "waiting" && developer ? "ready" : chosenMode;

  // The wait ends without a tap when another purchase starts waiting on the same reader
  // or the 2 minutes run out: say so instead of waiting forever.
  const [seenWaiting, setSeenWaiting] = useState(false);
  if (mode === "waiting" && waitingForCard && !seenWaiting) setSeenWaiting(true);
  const waitEnded = mode === "waiting" && seenWaiting && !waitingForCard && !developer;

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

  async function startScan() {
    if (developer) {
      setMode("ready");
      return;
    }
    setSeenWaiting(false);
    // Only a purchase waiting for a card on its reader takes the next tap.
    setProblem("");
    const result = await waitForCard(purchaseId);
    if (result.message) {
      setProblem(result.message);
      return;
    }
    setMode("waiting");
  }

  function stopScan() {
    void stopWaitingForCard(purchaseId);
    setMode("basket");
  }

  if (mode === "basket") {
    return (
      <div className="grid justify-items-start gap-2">
        <Button type="button" disabled={items.length === 0} onClick={() => void startScan()}>
          {t(locale, verb === "book" ? "Scan card to book" : "Scan card to buy")}
        </Button>
        {problem ? <p className="text-destructive text-sm">{problem}</p> : null}
      </div>
    );
  }

  if (mode === "waiting" || !developer) {
    return (
      <Dialog open onOpenChange={(open) => { if (!open) stopScan(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t(locale, "Waiting for the card")}</DialogTitle>
            <DialogDescription>{t(locale, "Hold the card on the reader. This closes when the card is recognized.")}</DialogDescription>
          </DialogHeader>
          <div className="grid place-items-center gap-3 py-2">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CreditCard className="size-6" />
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label={t(locale, "Waiting for the card")}
            >
              <div className="h-full w-1/3 rounded-full bg-primary motion-safe:animate-[indeterminate_1.4s_ease-in-out_infinite]" />
            </div>
            <p className="text-muted-foreground text-xs">{t(locale, live)}</p>
            {problem ? <p className="text-destructive text-sm">{problem}</p> : null}
            {waitEnded ? (
              <div className="grid justify-items-center gap-2">
                <p className="text-destructive text-sm">
                  {t(locale, "No longer waiting: another purchase is scanning on this reader, or 2 minutes passed.")}
                </p>
                <Button type="button" size="sm" onClick={() => void startScan()}>{t(locale, "Scan again")}</Button>
              </div>
            ) : null}
          </div>
          {simulator ? <TapSimulator purchaseId={purchaseId} /> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={stopScan}>{t(locale, "Cancel")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
          <p className="text-sm"><span className="text-muted-foreground"><AutoText>Developer ·</AutoText> </span>{developer.full_name || "—"}</p>
          <p className="text-sm"><span className="text-muted-foreground"><AutoText>Employee number ·</AutoText> </span>{developer.employee_number || "—"}</p>
          <p className="text-sm"><span className="text-muted-foreground"><AutoText>Department ·</AutoText> </span>{developer.department || "—"}</p>
          <p className="text-sm"><span className="text-muted-foreground"><AutoText>Card ·</AutoText> </span><AutoText>Recognized</AutoText>{presented?.presented_at ? ` ${new Date(presented.presented_at).toLocaleTimeString()}` : ""}</p>
          <p className="text-sm"><span className="text-muted-foreground"><AutoText>Current balance ·</AutoText> </span>{balance === null ? t(locale, "Not available for this account") : `${balance} ${currency}`}</p>
          <p className="text-sm"><span className="text-muted-foreground"><AutoText>Balance after pay ·</AutoText> </span>{after === null ? "—" : `${after} ${currency}`}</p>
          <p className="text-sm"><span className="text-muted-foreground"><AutoText>To pay ·</AutoText> </span>{total} {currency}</p>
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
        <Button type="button" disabled={!pinReady || selling} onClick={() => setConfirming(true)}>{t(locale, verb === "book" ? "Book and pay" : "Sell")}</Button>
        {confirming ? (
          <div className="grid gap-3 rounded-lg border p-4">
            <p className="text-sm">{t(locale, verb === "book" ? "Book and pay" : "Sell")} {total} {currency}. {developer.full_name || t(locale, "this developer")}. {t(locale, "This payment cannot be undone.")}</p>
            <div className="flex gap-2">
              <Button type="button" disabled={selling} onClick={() => void sell()}>{selling ? t(locale, "Paying") : t(locale, "OK")}</Button>
              <Button type="button" variant="outline" disabled={selling} onClick={() => setConfirming(false)}>{t(locale, "Cancel")}</Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
