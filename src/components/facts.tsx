import type { ReactNode } from "react";
import { AutoText } from "@/components/auto-text";

export function Facts({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-muted-foreground text-sm"><AutoText>{item.label}</AutoText></dt>
          <dd className="mt-1 text-sm">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
