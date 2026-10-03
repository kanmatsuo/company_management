"use client";

import { useEffect, useRef, useState } from "react";
import { CreditCard } from "lucide-react";
import { deposit, developerBalance } from "@/app/(console)/mutations";
import { NoReader } from "@/app/(console)/cards/assign/assign-by-reader";
import { ReaderPicker, useCardReader, useChosenReader, type Reader } from "@/app/(console)/cards/card-reader";
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

export function DepositDesk({ locale, readers }: { locale: Locale; readers: Reader[] }) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<"form" | "scan">("form");
  const [device, setDevice] = useChosenReader(readers);
  // Only taps made after "Tap card to deposit" count: the reader is read while scanning.
  const { read, problem: readerProblem, clear } = useCardReader(mode === "scan" ? device : "");
  const [balance, setBalance] = useState<string | null>(null);
  const [problem, setProblem] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [confirming, setConfirming] = useState(false);
  const [posting, setPosting] = useState(false);
  const [idempotency, setIdempotency] = useState("");
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const amountOk = cents(amount) > 0;

  const card = read?.card ?? null;
  const holder: Person | null = card?.developer ?? null;
  const tapProblem = !read
    ? ""
    : !card || !card.assigned
      ? t(locale, "This card is not assigned to anyone. Tap another card.")
      : card.status !== "ACTIVE"
        ? t(locale, "This card is blocked or retired. Tap another card.")
        : !holder
          ? t(locale, "This card belongs to a developer of another building.")
          : "";
  const ready = mode === "scan" && holder !== null && tapProblem === "";

  useEffect(() => {
    const id = holder?.id;
    if (!ready || typeof id !== "number") return;
    void developerBalance(id).then(setBalance);
  }, [ready, holder?.id]);

  function begin() {
    setProblem("");
    setBalance(null);
    clear();
    setMode("scan");
  }

  function stopWaiting() {
    clear();
    setPin(["", "", "", ""]);
    setConfirming(false);
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
            {readers.length === 0 ? (
              <NoReader />
            ) : (
              <ReaderPicker readers={readers} value={device} onChange={setDevice} />
            )}
            {problem ? <p className="text-destructive text-sm">{problem}</p> : null}
            <Button type="button" disabled={!amountOk || !device} onClick={begin}>
              {t(locale, "Tap card to deposit")}
            </Button>
          </>
        ) : null}

        {mode === "scan" && !ready ? (
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
                {read ? <p className="font-mono text-sm">{read.uid}</p> : null}
                {tapProblem || readerProblem ? <p className="text-destructive text-sm">{tapProblem || t(locale, readerProblem ?? "")}</p> : null}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={stopWaiting}>{t(locale, "Cancel")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null}

        {ready && holder ? (
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
              <Button type="button" variant="outline" onClick={stopWaiting}>
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
