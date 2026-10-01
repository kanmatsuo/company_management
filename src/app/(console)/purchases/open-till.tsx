"use client";

import { useEffect, useState } from "react";
import { createPurchase, detectedReaders, type TillReader } from "@/app/(console)/mutations";
import { FieldForm } from "@/components/field-form";

export function OpenTill({
  positions,
  initial,
}: {
  positions: { value: string; label: string }[];
  initial: { reader: TillReader | null; candidates: TillReader[] };
}) {
  const [detected, setDetected] = useState(initial);
  useEffect(() => {
    const timer = window.setInterval(() => {
      void detectedReaders().then((next) => setDetected(next));
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const readers = detected.candidates ?? [];
  const chosen = readers.length === 1 ? readers[0].code : detected.reader?.code;
  return (
    <div className="grid gap-3">
      <p className="max-w-md text-muted-foreground text-sm">
        {readers.length === 0
          ? "No till reader connected to this PC. You can still open a draft. The first tap from this PC attaches the reader."
          : readers.length === 1
            ? `This PC's reader: ${readers[0].name || readers[0].code}.`
            : "More than one reader is connected to this PC. Choose one."}
      </p>
      <FieldForm
        key={readers.map((reader) => reader.code).join(",")}
        action={createPurchase}
        submitLabel="Open draft"
        fields={[
          { name: "service_position", label: "Service position", type: "select", required: true, options: positions },
          ...(readers.length > 1
            ? [{ name: "reader", label: "Till reader", type: "select" as const, required: true, options: readers.map((reader) => ({ value: reader.code, label: reader.name || reader.code })) }]
            : chosen
              ? [{ name: "reader", label: "Reader", type: "hidden" as const, defaultValue: chosen }]
              : []),
        ]}
      />
    </div>
  );
}
