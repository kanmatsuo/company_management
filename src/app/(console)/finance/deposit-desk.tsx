"use client";

import { useEffect, useRef, useState } from "react";
import { CreditCard } from "lucide-react";
import { cancelDepositHold, deposit, developerBalance, openDepositHold, presentedDeveloper } from "@/app/(console)/mutations";
import { TapSimulator } from "@/app/(console)/purchases/tap-simulator";
import { AutoText } from "@/components/auto-text";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t, type Locale } from "@/lib/i18n";

type Person = { id?: number; full_name?: string; employee_number?: string; department?: string };

function cents(value: string) {
  const [whole, fraction = "00"] = value.split(".");
  const sign = whole.startsWith("-") ? -1 : 1;
  return sign * (Number(whole.replace("-", "")) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2)));
}

function newKey() {
  const bytes = new Uint8Array(16);
  try {
    crypto.getRandomValues(bytes);
  } catch {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function money(value: number) {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export function DepositDesk({ locale, socketBase, simulator = false }: { locale: Locale; socketBase: string; simulator?: boolean }) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<"form" | "waiting" | "ready">("form");
  const [hold, setHold] = useState<{ id: number; positionId: number } | null>(null);
  const [holder, setHolder] = useState<Person | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [problem, setProblem] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [confirming, setConfirming] = useState(false);
  const [posting, setPosting] = useState(false);
  const [idempotency, setIdempotency] = useState("");
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const amountOk = cents(amount) > 0;

  useEffect(() => {
    const id = holder?.id;
    if (mode !== "ready" || typeof id !== "number") return;
    void developerBalance(id).then(setBalance);
  }, [mode, holder?.id]);

  useEffect(() => {
    if (mode !== "waiting" || !hold) return;
    const purchaseId = hold.id;
    const positionId = hold.positionId;
    let stopped = false;
    let socket: WebSocket | null = null;
    let wait = 1000;
    let timer = 0;

    function accept(person: Person) {
      if (stopped || typeof person.id !== "number") return;
      setHolder(person);
      setProblem("");
      setMode("ready");
    }

    async function poll() {
      const person = await presentedDeveloper(purchaseId);
      if (person?.id) accept(person);
    }

    async function connect() {
      const response = await fetch("/api/realtime/ticket", { method: "POST" });
      if (!response.ok || stopped) return;
      const body = (await response.json()) as { ticket?: string };
      if (!body.ticket || stopped) return;
      socket = new WebSocket(`${socketBase}/ws/counters/${positionId}/?ticket=${encodeURIComponent(body.ticket)}`);
      socket.onmessage = (event) => {
        const message = JSON.parse(String(event.data)) as { type?: string; data?: { accepted?: boolean; display_message?: string } };
        if (message.type !== "card_tapped" || !message.data) return;
        if (!message.data.accepted) {
          setProblem(message.data.display_message || "Card was not accepted");
          return;
        }
        void poll();
      };
      socket.onclose = () => {
        if (!stopped) timer = window.setTimeout(connect, wait);
        wait = Math.min(wait * 2, 10000);
      };
    }

    const timerPoll = window.setInterval(() => void poll(), 1000);
    void poll();
    void connect();
    return () => {
      stopped = true;
      window.clearInterval(timerPoll);
      window.clearTimeout(timer);
      socket?.close();
    };
  }, [hold, mode, socketBase]);

  async function begin() {
    setProblem("");
    const opened = await openDepositHold();
    if ("error" in opened) {
      setProblem(opened.error);
      return;
    }
    setHold(opened);
    setMode("waiting");
  }

  function stopWaiting() {
    if (hold) void cancelDepositHold(hold.id);
    setHold(null);
    setMode("form");
  }

  function typeDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...pin];
    next[index] = digit;
    setPin(next);
    if (digit && index < 3) inputs.current[index + 1]?.focus();
  }

  async function post() {
    if (!holder?.id) return;
    setPosting(true);
    setProblem("");
    if (hold) await cancelDepositHold(hold.id);
    const data = new FormData();
    data.set("developer", String(holder.id));
    data.set("amount", amount);
    data.set("description", description);
    data.set("idempotency", idempotency);
    data.set("pin", pin.join(""));
    const result = await deposit(null, data);
    setPosting(false);
    setConfirming(false);
    setPin(["", "", "", ""]);
    if (result?.message) setProblem(result.message);
  }

  const after = balance === null || !amountOk ? null : money(cents(balance) + cents(amount));
  const pinReady = pin.every((digit) => digit.length === 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(locale, "Add money")}</CardTitle>
        <CardDescription>{t(locale, "Amount is a decimal, such as 25.00.")}</CardDescription>
      </CardHeader>
      <CardContent className="grid max-w-md gap-4">
        {mode === "form" ? (
          <>
            <div className="grid gap-1.5">
              <Label htmlFor="amount">{t(locale, "Amount")}</Label>
              <Input id="amount" inputMode="decimal" value={amount} required onChange={(event) => setAmount(event.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="description">{t(locale, "Description")}</Label>
              <Input id="description" value={description} onChange={(event) => setDescription(event.target.value)} />
            </div>
            {problem ? <p className="text-destructive text-sm">{problem}</p> : null}
            <Button type="button" disabled={!amountOk} onClick={() => void begin()}>
              {t(locale, "Tap card to deposit")}
            </Button>
          </>
        ) : null}

        {mode === "waiting" && hold ? (
          <Dialog open onOpenChange={(open) => { if (!open) stopWaiting(); }}>
            <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t(locale, "Waiting for the card")}</DialogTitle>
                <DialogDescription>{t(locale, "Hold the card on the reader. This closes when the card is recognized.")}</DialogDescription>
              </DialogHeader>
              <div className="grid place-items-center gap-3 py-2">
                <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CreditCard className="size-6" />
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={t(locale, "Waiting for the card")}>
                  <div className="h-full w-1/3 rounded-full bg-primary motion-safe:animate-[indeterminate_1.4s_ease-in-out_infinite]" />
                </div>
                <p className="text-sm">{amount}</p>
                {problem ? <p className="text-destructive text-sm">{problem}</p> : null}
              </div>
              {simulator ? <TapSimulator purchaseId={hold.id} /> : null}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={stopWaiting}>{t(locale, "Cancel")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null}

        {mode === "ready" && holder ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <p className="text-sm"><span className="text-muted-foreground"><AutoText>Developer ·</AutoText> </span>{holder.full_name || "—"}</p>
              <p className="text-sm"><span className="text-muted-foreground"><AutoText>Employee number ·</AutoText> </span>{holder.employee_number || "—"}</p>
              <p className="text-sm"><span className="text-muted-foreground"><AutoText>Department ·</AutoText> </span>{holder.department || "—"}</p>
              <p className="text-sm"><span className="text-muted-foreground"><AutoText>To pay ·</AutoText> </span>{amount}</p>
              <p className="text-sm"><span className="text-muted-foreground"><AutoText>Current balance ·</AutoText> </span>{balance === null ? t(locale, "Not available for this account") : balance}</p>
              <p className="text-sm"><span className="text-muted-foreground"><AutoText>Balance after deposit</AutoText> </span>{after ?? "—"}</p>
            </div>
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
            <div className="flex gap-2">
              <Button
                type="button"
                disabled={!pinReady || posting}
                onClick={() => {
                  setIdempotency(newKey());
                  setConfirming(true);
                }}
              >
                {t(locale, "Deposit")}
              </Button>
              <Button type="button" variant="outline" onClick={() => { if (hold) void cancelDepositHold(hold.id); setHold(null); setMode("form"); setHolder(null); setPin(["", "", "", ""]); }}>
                {t(locale, "Cancel")}
              </Button>
            </div>
            {confirming ? (
              <div className="grid gap-3 rounded-lg border p-4">
                <p className="text-sm">{t(locale, "Post this deposit")} {amount} · {holder.full_name || "—"}. {t(locale, "This deposit cannot be undone.")}</p>
                <div className="flex gap-2">
                  <Button type="button" disabled={posting} onClick={() => void post()}>{posting ? t(locale, "Paying") : t(locale, "OK")}</Button>
                  <Button type="button" variant="outline" disabled={posting} onClick={() => setConfirming(false)}>{t(locale, "Cancel")}</Button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
