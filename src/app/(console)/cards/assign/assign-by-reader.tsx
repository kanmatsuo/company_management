"use client";

import { assignCard } from "@/app/(console)/mutations";
import { ReaderPicker, TapStatus, useCardReader, useChosenReader, type Reader } from "@/app/(console)/cards/card-reader";
import { FieldForm } from "@/components/field-form";
import { useLocale } from "@/components/locale-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/lib/i18n";

type Choice = { value: string; label: string };

export function AssignByReader({ readers, developers, buildings }: { readers: Reader[]; developers: Choice[]; buildings: Choice[] }) {
  const locale = useLocale();
  const [device, setDevice] = useChosenReader(readers);
  const { read, problem, clear } = useCardReader(device);

  if (readers.length === 0) return <NoReader />;

  const card = read?.card;
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t(locale, "1. Tap the card")}</CardTitle>
          <CardDescription>{t(locale, "The card's UID appears here as soon as the reader sends it.")}</CardDescription>
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
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t(locale, "2. Assign")}</CardTitle>
          <CardDescription>{t(locale, "The developer types a new 4-6 digit purchase PIN twice.")}</CardDescription>
        </CardHeader>
        <CardContent>
          {read && card && !card.assigned && card.status === "ACTIVE" ? (
            <FieldForm
              key={read.event}
              action={assignCard.bind(null, card.id)}
              submitLabel="Assign"
              fields={[
                { name: "developer", label: "Developer", type: "select", required: true, options: developers },
                { name: "building", label: "Building", type: "select", options: [{ value: "", label: "Keep current building" }, ...buildings] },
                { name: "pin", label: "PIN", type: "password", required: true },
                { name: "pin_confirm", label: "PIN again", type: "password", required: true },
              ]}
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              {t(locale, card ? "This card can't be assigned. Unassign it on the card page first, or tap another card." : "Tap a card first.")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function NoReader() {
  const locale = useLocale();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(locale, "No card assign reader")}</CardTitle>
        <CardDescription>
          {t(locale, "Register one under Readers → New device with the kind Card assign reader and the ID it sends (e.g. Master1).")}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
