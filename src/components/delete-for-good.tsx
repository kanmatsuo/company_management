"use client";

import { useActionState, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/components/locale-context";
import type { FormState } from "@/lib/form";
import { t } from "@/lib/i18n";
import { deleteForGood, previewDelete, type DeletePreview } from "@/app/(console)/mutations";

const DELETES: Record<string, string> = {
  scans: "Scans",
  attendance_records: "Attendance records",
  attendance_days: "Attendance days",
  card_assignments: "Card assignments",
  transactions: "Money transactions",
  purchases: "Purchases",
  bookings: "Bookings",
  tcp_log: "TCP log entries",
  service_positions: "Counters",
  goods: "Goods",
  stock_movements: "Stock movements",
  roles: "Roles",
};
const KEEPS: Record<string, string> = {
  login: "Their login (user account)",
  purchases: "Purchases made with it (kept without it)",
  money_transactions: "Developers' money transactions for these purchases",
  readers: "Till readers (kept, no longer assigned)",
  actions: "What this user did (kept under their name)",
  developer_profile: "Developer profile (kept, no longer linked)",
  seller_profile: "Seller profile (kept, no longer linked)",
};

/** "Delete for good": shows what goes and what stays, then asks for DELETE. Admin only. */
export function DeleteForGood({ kind, id, redirectTo, icon = false }: { kind: string; id: number; redirectTo: string; icon?: boolean }) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [preview, setPreview] = useState<DeletePreview | null>(null);
  const [loading, startLoading] = useTransition();
  const [state, action, pending] = useActionState(deleteForGood.bind(null, kind, id, redirectTo), null as FormState);

  function show() {
    setOpen(true);
    setTyped("");
    setPreview(null);
    startLoading(async () => setPreview(await previewDelete(kind, id)));
  }

  const deletes = Object.entries(preview?.deletes ?? {}).filter(([, n]) => n > 0);
  const keeps = Object.entries(preview?.keeps ?? {}).filter(([, n]) => n > 0);
  const ready = preview && !preview.message;

  return (
    <>
      {icon ? (
        <Button type="button" size="icon-sm" variant="outline" onClick={show} aria-label={t(locale, "Delete for good")} title={t(locale, "Delete for good")}>
          <Trash2 />
        </Button>
      ) : (
        <Button type="button" variant="destructive" onClick={show}>
          {t(locale, "Delete for good")}
        </Button>
      )}
      <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
        <DialogContent className="max-w-md">
          <form action={action} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>{t(locale, "Delete for good")}</DialogTitle>
              <DialogDescription>{preview?.label ?? "…"}</DialogDescription>
            </DialogHeader>
            {loading ? <p className="text-muted-foreground text-sm">{t(locale, "Counting its history…")}</p> : null}
            {preview?.message ? <p className="text-destructive text-sm">{t(locale, preview.message)}</p> : null}
            {ready ? (
              <div className="grid gap-3 text-sm">
                <div>
                  <p className="font-medium">{t(locale, "Deleted with it")}</p>
                  {deletes.length ? (
                    <ul className="mt-1 list-disc pl-5">
                      {deletes.map(([key, count]) => (
                        <li key={key}>
                          {t(locale, DELETES[key] ?? key)}: <span className="tabular-nums">{count.toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">{t(locale, "No history: only the record itself.")}</p>
                  )}
                </div>
                {keeps.length ? (
                  <div>
                    <p className="font-medium">{t(locale, "Stays")}</p>
                    <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                      {keeps.map(([key, count]) => (
                        <li key={key}>
                          {t(locale, KEEPS[key] ?? key)}: <span className="tabular-nums">{count.toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <p className="text-muted-foreground">
                  {t(locale, "This can't be undone here. A database backup is made first (restore it on the Backups page if needed).")}
                </p>
                <label className="grid gap-1.5">
                  <span>
                    {t(locale, "To confirm, type")} <span className="font-mono font-semibold">DELETE</span>
                  </span>
                  <Input name="confirm" value={typed} onChange={(event) => setTyped(event.target.value)} autoComplete="off" spellCheck={false} autoFocus className="font-mono" />
                </label>
              </div>
            ) : null}
            {state?.message ? <p className="text-destructive text-sm">{t(locale, state.message)}</p> : null}
            <DialogFooter>
              <Button type="button" variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
                {t(locale, "Cancel")}
              </Button>
              <Button type="submit" variant="destructive" disabled={!ready || pending || typed !== "DELETE"}>
                {pending ? t(locale, "Deleting…") : t(locale, "Delete for good")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
