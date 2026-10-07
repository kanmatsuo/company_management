"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/components/locale-context";
import type { FormState } from "@/lib/form";
import { t } from "@/lib/i18n";
import { restoreBackup } from "@/app/(console)/mutations";

/** "Restore" opens a dialog; typing RESTORE enables the button that replaces all data. */
export function RestoreButton({ file, disabled }: { file: string; disabled: boolean }) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [state, action, pending] = useActionState(restoreBackup.bind(null, file), null as FormState);
  return (
    <>
      <Button variant="outline" size="sm" disabled={disabled} onClick={() => setOpen(true)}>
        {t(locale, "Restore")}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (pending) return; // the restore is starting: keep it open until the page changes
          setOpen(next);
          if (!next) setTyped("");
        }}
      >
        <DialogContent className="max-w-md">
          <form action={action} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>{t(locale, "Restore this backup")}</DialogTitle>
              <DialogDescription className="break-all font-mono text-xs">{file}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 text-sm">
              <p>{t(locale, "All current data is replaced by this backup. The current data is backed up first and kept, so this can be undone.")}</p>
              <p className="text-muted-foreground">
                {t(locale, "The system is offline while it runs (usually one to a few minutes): doors and tills don't answer.")}
              </p>
            </div>
            <label className="grid gap-1.5 text-sm">
              <span>
                {t(locale, "To confirm, type")} <span className="font-mono font-semibold">RESTORE</span>
              </span>
              <Input
                name="confirm"
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                autoComplete="off"
                spellCheck={false}
                autoFocus
                className="font-mono"
              />
            </label>
            {state?.message ? <p className="text-destructive text-sm">{t(locale, state.message)}</p> : null}
            <DialogFooter>
              <Button type="button" variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
                {t(locale, "Cancel")}
              </Button>
              <Button type="submit" variant="destructive" disabled={pending || typed !== "RESTORE"}>
                {pending ? t(locale, "Starting…") : t(locale, "Restore this backup")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
