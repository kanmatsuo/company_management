"use client";

import { useEffect, useState } from "react";
import { createPurchase, tillReaders, type TillReader } from "@/app/(console)/mutations";
import { FieldForm } from "@/components/field-form";
import { AutoText } from "@/components/auto-text";

const REMEMBER = "till-reader:";

function remembered(positionId: string) {
  try {
    return window.localStorage.getItem(REMEMBER + positionId);
  } catch {
    return null;
  }
}

function remember(positionId: string, code: string) {
  try {
    window.localStorage.setItem(REMEMBER + positionId, code);
  } catch {
    // private window or blocked storage: the choice just isn't kept
  }
}

/** Pick the counter, then one of its seller's till readers (readers are assigned to sellers). */
export function OpenTill({ positions }: { positions: { value: string; label: string }[] }) {
  const [position, setPosition] = useState(positions.length === 1 ? positions[0].value : "");
  const [readers, setReaders] = useState<TillReader[] | null>(null);
  const [reader, setReader] = useState("");

  useEffect(() => {
    if (!position) return;
    let stopped = false;
    void tillReaders(Number(position)).then((list) => {
      if (stopped) return;
      setReaders(list);
      const kept = remembered(position);
      setReader(list.some((r) => r.code === kept) ? kept ?? "" : list.length === 1 ? list[0].code : "");
    });
    return () => {
      stopped = true;
    };
  }, [position]);

  const list = position ? readers ?? [] : [];
  return (
    <div className="grid max-w-md gap-4">
      <label className="grid gap-1.5 text-sm">
        <AutoText>Service position</AutoText>
        <select
          className="h-8 rounded-lg border border-input bg-transparent px-2"
          value={position}
          onChange={(event) => {
            setReaders(null);
            setPosition(event.target.value);
          }}
        >
          <option value="">—</option>
          {positions.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </label>
      {position && readers !== null ? (
        list.length === 0 ? (
          <p className="text-destructive text-sm">
            <AutoText>This seller has no till reader. Ask an admin to assign one (Readers → the reader&apos;s Seller).</AutoText>
          </p>
        ) : list.length === 1 ? (
          <p className="text-muted-foreground text-sm">
            <AutoText>Till reader</AutoText>: {list[0].name || list[0].code} ({list[0].code})
          </p>
        ) : (
          <label className="grid gap-1.5 text-sm">
            <AutoText>Till reader</AutoText>
            <select
              className="h-8 rounded-lg border border-input bg-transparent px-2"
              value={reader}
              onChange={(event) => {
                setReader(event.target.value);
                remember(position, event.target.value);
              }}
            >
              <option value="">—</option>
              {list.map((r) => (
                <option key={r.code} value={r.code}>{r.name ? `${r.name} · ${r.code}` : r.code}</option>
              ))}
            </select>
          </label>
        )
      ) : null}
      {position && list.length > 0 && reader ? (
        <FieldForm
          key={`${position}:${reader}`}
          action={createPurchase}
          submitLabel="Open draft"
          fields={[
            { name: "service_position", label: "Service position", type: "hidden", defaultValue: position },
            { name: "reader", label: "Till reader", type: "hidden", defaultValue: reader },
          ]}
        />
      ) : null}
    </div>
  );
}
