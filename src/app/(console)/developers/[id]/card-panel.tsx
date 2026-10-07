"use client";

import { useActionState, useState } from "react";
import Link from "@/components/app-link";
import { assignTappedCard, replaceDeveloperCard, unassignDeveloperCard } from "@/app/(console)/mutations";
import { ReaderPicker, TapStatus, useCardReader, useChosenReader, type Reader } from "@/app/(console)/cards/card-reader";
import { useLocale } from "@/components/locale-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormState } from "@/lib/form";
import { t } from "@/lib/i18n";

export type CurrentCard = { id: number; uid: string; label?: string | null; status?: string; assigned_at?: string | null };

/** The developer's card: shown with Unassign and Replace, or, without one, tap a card on
 * the card assign reader and the developer types their PIN. */
export function CardPanel({ developerId, current, readers }: { developerId: number; current: CurrentCard | null; readers: Reader[] | null }) {
  const locale = useLocale();
  const [replacing, setReplacing] = useState(false);
  const listening = readers !== null && (current === null || replacing);
  const [device, setDevice] = useChosenReader(readers ?? []);
  const { read, problem, clear } = useCardReader(listening ? device : "");
  const [assignState, assignAction, assigning] = useActionState(assignTappedCard.bind(null, developerId), null as FormState);
  const [unassignState, unassignAction, unassigning] = useActionState(
    unassignDeveloperCard.bind(null, developerId, current?.id ?? 0),
    null as FormState,
  );
  const [replaceState, replaceAction, replacingNow] = useActionState(
    replaceDeveloperCard.bind(null, developerId, current?.id ?? 0),
    null as FormState,
  );
  const tapped = read?.card;
  const message = assignState?.message || unassignState?.message || replaceState?.message;
  const fieldErrors = (name: string) =>
    assignState?.fields?.[name]?.map((error) => (
      <p key={error} className="text-destructive text-xs">
        {error}
      </p>
    ));

  const reader = (
    <div className="grid gap-3">
      {readers && readers.length ? (
        <>
          <ReaderPicker
            readers={readers}
            value={device}
            onChange={(value) => {
              setDevice(value);
              clear();
            }}
          />
          {device ? <TapStatus read={read} problem={problem} /> : null}
        </>
      ) : (
        <p className="text-muted-foreground text-sm">{t(locale, "No card assign reader is registered (Readers → New device → Card assign reader).")}</p>
      )}
    </div>
  );

  return (
    <div className="grid gap-4">
      {message ? <p className="text-destructive text-sm">{t(locale, message)}</p> : null}
      {current ? (
        <div className="grid gap-3 rounded-xl border bg-linear-to-br from-primary/10 via-card to-card p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="grid gap-0.5">
              <span className="text-muted-foreground text-xs">{t(locale, "Card UID")}</span>
              <Link href={`/cards/${current.id}`} className="font-mono font-semibold text-lg tracking-wider underline-offset-4 hover:underline">
                {current.uid}
              </Link>
            </div>
            {current.status ? (
              <Badge variant={current.status === "ACTIVE" ? "secondary" : "destructive"}>{t(locale, current.status)}</Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span>
              <span className="text-muted-foreground">{t(locale, "Label")}: </span>
              {current.label || "—"}
            </span>
            {current.assigned_at ? (
              <span>
                <span className="text-muted-foreground">{t(locale, "Since")}: </span>
                {current.assigned_at.slice(0, 10)}
              </span>
            ) : null}
          </div>
          {readers !== null && !replacing ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setReplacing(true)}>
                {t(locale, "Replace with a new card")}
              </Button>
              <form action={unassignAction}>
                <Button type="submit" variant="ghost" size="sm" disabled={unassigning}>
                  {t(locale, "Unassign")}
                </Button>
              </form>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed p-4 text-muted-foreground text-sm">
          {t(locale, readers === null ? "No card. Your account can't assign cards." : "No card yet. Tap one on the card assign reader to assign it.")}
        </p>
      )}

      {current && replacing ? (
        <form action={replaceAction} className="grid gap-3 rounded-xl border p-4">
          <p className="font-medium text-sm">{t(locale, "Tap the new card. The old one is retired; the PIN stays.")}</p>
          {reader}
          {tapped && !tapped.assigned && tapped.status === "ACTIVE" ? <input type="hidden" name="new_card_uid" value={read?.uid ?? ""} /> : null}
          {tapped && (tapped.assigned || tapped.status !== "ACTIVE") ? (
            <p className="text-destructive text-sm">{t(locale, "This card can't be used. Tap another card.")}</p>
          ) : null}
          <div className="grid gap-1.5">
            <Label htmlFor="reason">{t(locale, "Reason")}</Label>
            <Input id="reason" name="reason" placeholder={t(locale, "Lost, broken, …")} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={replacingNow || !tapped || tapped.assigned || tapped.status !== "ACTIVE"}>
              {t(locale, "Replace card")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setReplacing(false);
                clear();
              }}
            >
              {t(locale, "Cancel")}
            </Button>
          </div>
        </form>
      ) : null}

      {!current && readers !== null ? (
        <form action={assignAction} className="grid gap-3">
          {reader}
          {tapped && (tapped.assigned || tapped.status !== "ACTIVE") ? (
            <p className="text-destructive text-sm">{t(locale, "This card can't be assigned. Tap another card.")}</p>
          ) : null}
          {tapped && !tapped.assigned && tapped.status === "ACTIVE" ? (
            <div className="grid gap-3">
              <input type="hidden" name="card" value={tapped.id} />
              <div className="grid gap-1.5">
                <Label htmlFor="pin">{t(locale, "PIN")}</Label>
                <Input id="pin" name="pin" type="password" inputMode="numeric" autoComplete="off" required />
                {fieldErrors("pin")}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pin_confirm">{t(locale, "PIN again")}</Label>
                <Input id="pin_confirm" name="pin_confirm" type="password" inputMode="numeric" autoComplete="off" required />
                {fieldErrors("pin_confirm")}
              </div>
              <Button type="submit" disabled={assigning} className="justify-self-start">
                {assigning ? t(locale, "Saving…") : t(locale, "Assign card")}
              </Button>
            </div>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
