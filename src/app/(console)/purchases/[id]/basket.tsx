import { ShoppingBasket } from "lucide-react";
import { QuantityControls, RemoveLine } from "@/app/(console)/purchases/[id]/line-controls";
import { AutoText } from "@/components/auto-text";

type Item = {
  id: number;
  good?: number;
  good_name?: string;
  quantity: number;
  unit_price?: string | null;
  line_total?: string | null;
  start?: string | null;
  end?: string | null;
};

function money(value: string | number | null | undefined) {
  return value == null || value === "" ? "—" : Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** The purchase's lines: − / + and remove while it is a draft (`editable`), a receipt after. */
export function Basket({
  purchaseId,
  items,
  total,
  currency,
  editable,
  prices,
}: {
  purchaseId: number;
  items: Item[];
  total: string | null | undefined;
  currency?: string;
  editable: boolean;
  /** Draft lines have no fixed price yet: the good's current price, by good id. */
  prices?: Record<number, string>;
}) {
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const price = (item: Item) => item.unit_price ?? (item.good != null ? prices?.[item.good] : null) ?? null;
  const line = (item: Item) => item.line_total ?? (price(item) != null ? String(Number(price(item)) * item.quantity) : null);
  const shownTotal = total && Number(total) > 0 ? total : String(items.reduce((sum, item) => sum + Number(line(item) ?? 0), 0));
  return (
    <div className="grid gap-3">
      {items.length === 0 ? (
        <div className="grid place-items-center gap-2 rounded-xl border border-dashed py-10 text-center text-muted-foreground text-sm">
          <ShoppingBasket className="size-8 text-primary/40" />
          <AutoText>{editable ? "Empty. Click a good to add it." : "No items."}</AutoText>
        </div>
      ) : (
        <ul className="grid divide-y rounded-xl border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-3 py-2.5">
              <div className="grid min-w-0 flex-1 gap-0.5">
                <span className="truncate font-medium text-sm">{item.good_name}</span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {item.start ? `${item.start.slice(11, 16)}–${item.end ? item.end.slice(11, 16) : ""} · ` : ""}
                  {money(price(item))} × {item.quantity}
                </span>
              </div>
              {editable && !item.start ? <QuantityControls purchaseId={purchaseId} itemId={item.id} quantity={item.quantity} /> : null}
              <span className="w-20 text-right font-semibold text-sm tabular-nums">{money(line(item))}</span>
              {editable && !item.start ? <RemoveLine purchaseId={purchaseId} itemId={item.id} /> : null}
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-end justify-between rounded-xl bg-linear-to-r from-primary/10 to-transparent px-3 py-3">
        <span className="text-muted-foreground text-sm">
          <AutoText>Total</AutoText> · {count} <AutoText>{count === 1 ? "item" : "items"}</AutoText>
        </span>
        <span className="font-semibold text-2xl tabular-nums tracking-tight">
          {money(shownTotal)} <span className="font-normal text-muted-foreground text-sm">{currency}</span>
        </span>
      </div>
    </div>
  );
}
