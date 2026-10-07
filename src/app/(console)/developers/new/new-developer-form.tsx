"use client";

import { useActionState } from "react";
import { createDeveloper } from "@/app/(console)/mutations";
import { ReaderPicker, TapStatus, useCardReader, useChosenReader, type Reader } from "@/app/(console)/cards/card-reader";
import { useLocale } from "@/components/locale-context";
import { ProfileFields, type Choice } from "@/app/(console)/developers/profile-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormState } from "@/lib/form";
import { t } from "@/lib/i18n";

/** The profile in two columns, and beside it the card: tap it on a card assign reader and
 * the developer types their PIN; one button saves everything (or nothing). */
export function NewDeveloperForm({
  buildings,
  departments,
  readers,
}: {
  buildings: Choice[];
  departments: string[];
  readers: Reader[] | null; // null: this account can't assign cards
}) {
  const locale = useLocale();
  const [state, action, pending] = useActionState(createDeveloper, null as FormState);
  const [device, setDevice] = useChosenReader(readers ?? []);
  const { read, problem, clear } = useCardReader(readers ? device : "");
  const card = read?.card;
  const usable = Boolean(card && !card.assigned && card.status === "ACTIVE");
  const errors = (name: string) =>
    state?.fields?.[name]?.map((error) => (
      <p key={error} className="text-destructive text-xs">
        {error}
      </p>
    ));

  const field = (name: string, label: string, props: React.ComponentProps<typeof Input> = {}, wide = false) => (
    <div className={`grid gap-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <Label htmlFor={name}>
        {t(locale, label)}
        {props.required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <Input id={name} name={name} {...props} />
      {errors(name)}
    </div>
  );

  return (
    <form action={action} className="grid gap-4">
      {state?.message ? <p className="text-destructive text-sm">{t(locale, state.message)}</p> : null}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <Card>
          <CardHeader>
            <CardTitle>{t(locale, "Profile")}</CardTitle>
            <CardDescription>{t(locale, "Employee number and full name are required.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileFields buildings={buildings} departments={departments} state={state} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t(locale, "RFID card")}</CardTitle>
            <CardDescription>
              {readers === null
                ? t(locale, "Assign a card later on the Assign card page.")
                : t(locale, "Optional: tap the new developer's card on the card assign reader. They type a purchase PIN twice.")}
            </CardDescription>
          </CardHeader>
          {readers !== null ? (
            <CardContent className="grid gap-4">
              {readers.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t(locale, "No card assign reader is registered (Readers → New device → Card assign reader).")}</p>
              ) : (
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
              )}
              {card && !usable ? (
                <p className="text-destructive text-sm">{t(locale, "This card can't be assigned. Tap another card, or leave it for later.")}</p>
              ) : null}
              {usable && card ? (
                <div className="grid gap-3">
                  <input type="hidden" name="card" value={card.id} />
                  {field("pin", "PIN", { type: "password", required: true, inputMode: "numeric", autoComplete: "off" })}
                  {field("pin_confirm", "PIN again", { type: "password", required: true, inputMode: "numeric", autoComplete: "off" })}
                  <Button type="button" variant="ghost" size="sm" className="justify-self-start" onClick={clear}>
                    {t(locale, "Don't assign a card now")}
                  </Button>
                </div>
              ) : null}
              {errors("card")}
            </CardContent>
          ) : null}
        </Card>
      </div>
      <div>
        <Button type="submit" disabled={pending} size="lg">
          {pending ? t(locale, "Saving…") : t(locale, usable ? "Create developer and assign card" : "Create developer")}
        </Button>
      </div>
    </form>
  );
}
