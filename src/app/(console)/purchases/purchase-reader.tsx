"use client";

import { useEffect, useState } from "react";
import { detectedReaders, setPurchaseReader, type TillReader } from "@/app/(console)/mutations";
import { FieldForm } from "@/components/field-form";

export function PurchaseReader({ purchaseId, current }: { purchaseId: number; current: string | null }) {
  const [readers, setReaders] = useState<TillReader[]>([]);
  useEffect(() => {
    let stopped = false;
    async function load() {
      const detected = await detectedReaders();
      if (!stopped) setReaders(detected.candidates ?? []);
    }
    void load();
    const timer = window.setInterval(() => void load(), 30_000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, []);
  return (
    <div className="grid gap-2">
      <p className="text-muted-foreground text-sm">
        {current ? `This purchase uses ${current}.` : "No till reader is on this purchase yet."}
        {readers.length === 0 ? " No till reader is connected to this PC." : ` Connected now: ${readers.map((reader) => reader.name || reader.code).join(", ")}.`}
      </p>
      {readers.length > 0 ? (
        <FieldForm
          key={readers.map((reader) => reader.code).join(",")}
          action={setPurchaseReader.bind(null, purchaseId)}
          submitLabel="Use this reader"
          variant="outline"
          fields={[{
            name: "reader",
            label: "Till reader",
            type: "select",
            required: true,
            defaultValue: current && readers.some((reader) => reader.code === current) ? current : readers[0]?.code,
            options: readers.map((reader) => ({ value: reader.code, label: reader.name || reader.code })),
          }]}
        />
      ) : null}
    </div>
  );
}
