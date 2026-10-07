"use client";

import { useActionState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { deletePurchaseItem, updatePurchaseItem } from "@/app/(console)/mutations";
import { useLocale } from "@/components/locale-context";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/form";
import { t } from "@/lib/i18n";

/** − / + on a basket line (− on the last one removes it), and the remove button. */
export function QuantityControls({ purchaseId, itemId, quantity }: { purchaseId: number; itemId: number; quantity: number }) {
  const locale = useLocale();
  const [changed, change, changing] = useActionState(updatePurchaseItem.bind(null, purchaseId, itemId), null as FormState);
  const [removed, remove, removing] = useActionState(deletePurchaseItem.bind(null, purchaseId, itemId), null as FormState);
  const busy = changing || removing;
  const problem = changed?.message || Object.values(changed?.fields ?? {})[0]?.[0] || removed?.message;
  return (
    <div className="grid justify-items-end gap-1">
      <div className="flex items-center gap-1">
        <form action={quantity > 1 ? change : remove}>
          <input type="hidden" name="quantity" value={quantity - 1} />
          <Button type="submit" size="icon-xs" variant="outline" disabled={busy} aria-label={t(locale, "One less")}>
            <Minus />
          </Button>
        </form>
        <span className="w-7 text-center font-semibold text-sm tabular-nums">{quantity}</span>
        <form action={change}>
          <input type="hidden" name="quantity" value={quantity + 1} />
          <Button type="submit" size="icon-xs" variant="outline" disabled={busy} aria-label={t(locale, "One more")}>
            <Plus />
          </Button>
        </form>
      </div>
      {problem ? <p className="max-w-40 text-right text-destructive text-xs">{t(locale, problem)}</p> : null}
    </div>
  );
}

export function RemoveLine({ purchaseId, itemId }: { purchaseId: number; itemId: number }) {
  const locale = useLocale();
  const [, remove, removing] = useActionState(deletePurchaseItem.bind(null, purchaseId, itemId), null as FormState);
  return (
    <form action={remove}>
      <Button type="submit" size="icon-xs" variant="ghost" disabled={removing} aria-label={t(locale, "Remove")} className="text-muted-foreground hover:text-destructive">
        <Trash2 />
      </Button>
    </form>
  );
}
