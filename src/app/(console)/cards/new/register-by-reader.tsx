"use client";

import { useState } from "react";
import Link from "@/components/app-link";
import { updateCard } from "@/app/(console)/mutations";
import { ReaderPicker, TapStatus, useCardReader, type Reader } from "@/app/(console)/cards/card-reader";
import { FieldForm } from "@/components/field-form";
import { useLocale } from "@/components/locale-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/lib/i18n";

/** New card by tapping it on a card assign reader: the tap registers it; then name it. */
export function RegisterByReader({ readers }: { readers: Reader[] }) {
  const locale = useLocale();
  const [device, setDevice] = useState(readers.length === 1 ? String(readers[0].id) : "");
  const { read, problem, clear } = useCardReader(device);
  const card = read?.card;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(locale, "Tap the card on a reader")}</CardTitle>
        <CardDescription>{t(locale, "A new card is registered as soon as it is tapped. Then add a label or assign it.")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <ReaderPicker
          readers={readers}
          value={device}
          onChange={(value) => {
            setDevice(value);
            clear();
          }}
        />
        {device ? <TapStatus read={read} problem={problem} /> : null}
        {read && card ? (
          card.new ? (
            <FieldForm
              key={read.event}
              action={updateCard.bind(null, card.id)}
              submitLabel="Save"
              fields={[
                { name: "label", label: "Label", defaultValue: card.label ?? "" },
                { name: "notes", label: "Notes", type: "textarea", defaultValue: card.notes ?? "" },
              ]}
            />
          ) : (
            <p className="text-muted-foreground text-sm">{t(locale, "This card was already registered.")}</p>
          )
        ) : null}
        {card && !card.assigned && card.status === "ACTIVE" ? (
          <Button asChild variant="outline" className="w-fit">
            <Link href={`/cards/${card.id}`}>{t(locale, "Assign it now")}</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
