"use client";

import { useEffect, useState } from "react";
import { setPurchaseReader, tillReaders, type TillReader } from "@/app/(console)/mutations";
import { FieldForm } from "@/components/field-form";

/** The purchase's till reader, chosen among its seller's readers. */
export function PurchaseReader({ purchaseId, positionId, current }: { purchaseId: number; positionId: number; current: string | null }) {
  const [readers, setReaders] = useState<TillReader[] | null>(null);
  useEffect(() => {
    let stopped = false;
    void tillReaders(positionId).then((list) => {
      if (!stopped) setReaders(list);
    });
    return () => {
      stopped = true;
    };
  }, [positionId]);
  const list = readers ?? [];
  return (
    <div className="grid gap-2">
      <p className="text-muted-foreground text-sm">
        {current ? `This purchase uses ${current}.` : "No till reader is on this purchase yet: choose one before scanning."}
        {readers !== null && list.length === 0 ? " This seller has no till reader; ask an admin to assign one." : ""}
      </p>
      {list.length > 1 || (list.length === 1 && current !== list[0].code) ? (
        <FieldForm
          key={list.map((reader) => reader.code).join(",")}
          action={setPurchaseReader.bind(null, purchaseId)}
          submitLabel="Use this reader"
          variant="outline"
          fields={[{
            name: "reader",
            label: "Till reader",
            type: "select",
            required: true,
            defaultValue: current && list.some((reader) => reader.code === current) ? current : list[0]?.code,
            options: list.map((reader) => ({ value: reader.code, label: reader.name ? `${reader.name} · ${reader.code}` : reader.code })),
          }]}
        />
      ) : null}
    </div>
  );
}
