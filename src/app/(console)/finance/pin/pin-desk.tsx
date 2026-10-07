"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { changePinAtDesk, developerAccount, resetPinAtDesk, type DeskAccount } from "@/app/(console)/mutations";
import { NoReader } from "@/app/(console)/cards/assign/assign-by-reader";
import { ReaderPicker, useCardReader, useChosenReader, type Reader } from "@/app/(console)/cards/card-reader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t, tMessage, type Locale } from "@/lib/i18n";

type Mode = "change" | "reset";

function PinInput({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={6}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
        className="w-40 font-mono tracking-widest"
      />
    </div>
  );
}

/** The developer taps their card on a card assign reader, then changes or resets their PIN. */
export function PinDesk({ locale, readers, canChange, canReset }: { locale: Locale; readers: Reader[]; canChange: boolean; canReset: boolean }) {
  const [mode, setMode] = useState<Mode>(canChange ? "change" : "reset");
  const [scanning, setScanning] = useState(false);
  const [device, setDevice] = useChosenReader(readers);
  // Only taps made after "Tap card" count.
  const { read, problem: readerProblem, clear } = useCardReader(scanning ? device : "");
  const [account, setAccount] = useState<DeskAccount | null>(null);
  const [current, setCurrent] = useState("");
  const [pin, setPin] = useState("");
  const [again, setAgain] = useState("");
  const [problem, setProblem] = useState("");
  const [done, setDone] = useState("");
  const [saving, setSaving] = useState(false);

  const card = read?.card ?? null;
  const developer = card?.developer ?? null;
  const tapProblem = !read
    ? ""
    : !card || !card.assigned
      ? t(locale, "This card is not assigned to anyone. Tap another card.")
      : !developer
        ? t(locale, "This card belongs to a developer of another building.")
        : "";

  useEffect(() => {
    if (!developer) return;
    let stopped = false;
    void developerAccount(developer.id).then((found) => {
      if (!stopped) setAccount(found);
    });
    return () => {
      stopped = true;
    };
  }, [developer]);

  function start() {
    clear();
    setAccount(null);
    setCurrent("");
    setPin("");
    setAgain("");
    setProblem("");
    setDone("");
    setScanning(true);
  }

  function stop() {
    clear();
    setScanning(false);
    setAccount(null);
  }

  async function save() {
    if (!account || !developer) return;
    setSaving(true);
    setProblem("");
    const result = mode === "change"
      ? await changePinAtDesk(account.id, current, pin, again)
      : await resetPinAtDesk(account.id, pin, again);
    setSaving(false);
    if (result.message) {
      setProblem(tMessage(locale, result.message));
      setCurrent("");
      return;
    }
    setDone(`${t(locale, mode === "change" ? "PIN changed for" : "New PIN set for")} ${developer.full_name}.`);
    stop();
  }

  const lockedUntil = account?.pin_locked_until && new Date(account.pin_locked_until) > new Date() ? account.pin_locked_until : null;
  const ready = scanning && developer !== null && tapProblem === "";
  const formOk = /^\d{4,6}$/.test(pin) && pin === again && (mode === "reset" || /^\d{4,6}$/.test(current));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(locale, "PIN desk")}</CardTitle>
        <CardDescription>
          {t(locale, "The developer taps their card on the card assign reader and types the PINs themselves. PINs are 4 to 6 digits, not 1111 or 1234.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid max-w-md gap-4">
        <div className="flex gap-2">
          {canChange ? (
            <Button type="button" size="sm" variant={mode === "change" ? "default" : "outline"} disabled={scanning} onClick={() => setMode("change")}>
              {t(locale, "Change PIN")}
            </Button>
          ) : null}
          {canReset ? (
            <Button type="button" size="sm" variant={mode === "reset" ? "default" : "outline"} disabled={scanning} onClick={() => setMode("reset")}>
              {t(locale, "Forgot PIN")}
            </Button>
          ) : null}
        </div>
        <p className="text-muted-foreground text-sm">
          {mode === "change"
            ? t(locale, "Change: the developer knows the current PIN. A wrong current PIN counts like at the till (5 wrong tries lock it).")
            : t(locale, "Forgot: check the person in front of you, then the developer chooses a new PIN. This also unlocks a locked PIN.")}
        </p>
        {readers.length === 0 ? <NoReader /> : <ReaderPicker readers={readers} value={device} onChange={setDevice} />}
        {done ? <p className="font-medium text-emerald-700 text-sm dark:text-emerald-400">{done}</p> : null}

        {!scanning ? (
          <Button type="button" className="w-fit" disabled={!device} onClick={start}>
            <CreditCard className="size-4" /> {t(locale, "Tap card")}
          </Button>
        ) : !ready ? (
          <div className="grid gap-2 rounded-lg border p-4">
            <p className="text-sm">{t(locale, "Waiting for the card…")}</p>
            {read ? <p className="font-mono text-sm">{read.uid}</p> : null}
            {tapProblem || readerProblem ? <p className="text-destructive text-sm">{tapProblem || t(locale, readerProblem ?? "")}</p> : null}
            <Button type="button" size="sm" variant="outline" className="w-fit" onClick={stop}>{t(locale, "Cancel")}</Button>
          </div>
        ) : (
          <div className="grid gap-3 rounded-lg border p-4">
            <p className="text-sm">
              <span className="font-medium">{developer?.full_name}</span>
              <span className="text-muted-foreground"> · {developer?.employee_number}{developer?.department ? ` · ${developer.department}` : ""}</span>
            </p>
            <p className="text-muted-foreground text-sm">
              {account === null
                ? t(locale, "Loading the wallet…")
                : `${t(locale, "PIN")}: ${t(locale, account.has_pin ? "Set" : "Not set")}${lockedUntil ? ` · ${t(locale, "locked until")} ${new Date(lockedUntil).toLocaleTimeString()}` : ""}`}
            </p>
            {mode === "change" && account && !account.has_pin ? (
              <p className="text-destructive text-sm">{t(locale, "No PIN yet: use Forgot PIN to set one.")}</p>
            ) : null}
            {mode === "change" ? <PinInput id="current-pin" label={t(locale, "Current PIN")} value={current} onChange={setCurrent} /> : null}
            <PinInput id="new-pin" label={t(locale, "New PIN")} value={pin} onChange={setPin} />
            <PinInput id="new-pin-again" label={t(locale, "New PIN again")} value={again} onChange={setAgain} />
            {again && pin !== again ? <p className="text-destructive text-sm">{t(locale, "The PINs don't match.")}</p> : null}
            {problem ? <p className="text-destructive text-sm">{problem}</p> : null}
            <div className="flex gap-2">
              <Button type="button" disabled={!account || !formOk || saving} onClick={() => void save()}>
                {saving ? t(locale, "Saving…") : t(locale, mode === "change" ? "Change PIN" : "Set new PIN")}
              </Button>
              <Button type="button" variant="outline" onClick={stop}>{t(locale, "Cancel")}</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
