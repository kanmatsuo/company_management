"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Package, Plus, Search } from "lucide-react";
import { addPurchaseItem } from "@/app/(console)/mutations";
import { useLocale } from "@/components/locale-context";
import { Input } from "@/components/ui/input";
import type { TillGood } from "@/lib/choices";
import type { FormState } from "@/lib/form";
import { t } from "@/lib/i18n";

function money(value: string) {
  return Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Tile({ good, inBasket, soldOut }: { good: TillGood; inBasket: number; soldOut: boolean }) {
  const locale = useLocale();
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={soldOut || pending}
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-xl border bg-card text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md disabled:pointer-events-none disabled:opacity-50"
    >
      <div className="relative grid aspect-[4/3] place-items-center bg-linear-to-br from-primary/10 via-muted to-muted">
        {good.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={good.image} alt="" className="size-full object-cover" />
        ) : (
          <Package className="size-8 text-primary/40" />
        )}
        {inBasket ? (
          <span className="absolute top-2 left-2 rounded-full bg-primary px-2 py-0.5 font-semibold text-primary-foreground text-xs tabular-nums shadow">
            × {inBasket}
          </span>
        ) : null}
        <span className="absolute right-2 bottom-2 grid size-7 place-items-center rounded-full bg-primary text-primary-foreground opacity-0 shadow transition group-hover:opacity-100">
          <Plus className="size-4" />
        </span>
      </div>
      <div className="grid flex-1 gap-0.5 p-2.5">
        <span className="line-clamp-2 font-medium text-sm leading-tight">{good.name}</span>
        <span className="mt-auto flex items-baseline justify-between gap-2">
          <span className="font-semibold tabular-nums">{money(good.price)}</span>
          {good.track_stock ? (
            <span className={`text-xs ${soldOut ? "text-destructive" : "text-muted-foreground"}`}>
              {soldOut ? t(locale, "Sold out") : `${good.quantity} ${t(locale, "left")}`}
            </span>
          ) : null}
        </span>
      </div>
    </button>
  );
}

/** The counter's goods as tiles: one click adds one to the basket. */
export function GoodsGrid({ purchaseId, goods, inBasket }: { purchaseId: number; goods: TillGood[]; inBasket: Record<number, number> }) {
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const shown = goods.filter((good) => !needle || good.name.toLowerCase().includes(needle));
  // One action for every tile; a problem (e.g. not enough stock) shows above the grid.
  const [state, add] = useActionState(addPurchaseItem.bind(null, purchaseId), null as FormState);
  const problem = state?.message || Object.values(state?.fields ?? {})[0]?.[0];
  return (
    <div className="grid gap-3">
      {problem ? <p className="text-destructive text-sm">{t(locale, problem)}</p> : null}
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t(locale, "Search goods")} className="pl-8" />
      </div>
      {goods.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t(locale, "This counter has no goods for sale yet.")}</p>
      ) : shown.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t(locale, "Nothing matches this search.")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {shown.map((good) => {
            const taken = inBasket[good.id] ?? 0;
            const soldOut = good.track_stock && good.quantity - taken <= 0;
            return (
              <form key={good.id} action={add} className="h-full">
                <input type="hidden" name="good" value={good.id} />
                <input type="hidden" name="quantity" value="1" />
                <Tile good={good} inBasket={taken} soldOut={soldOut} />
              </form>
            );
          })}
        </div>
      )}
    </div>
  );
}
