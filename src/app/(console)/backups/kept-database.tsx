"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-context";
import type { FormState } from "@/lib/form";
import { t } from "@/lib/i18n";
import { deleteKeptDatabase } from "@/app/(console)/mutations";

/** A database kept by a restore (the way back), with Delete once the restored data is fine. */
export function KeptDatabase({ name }: { name: string }) {
  const locale = useLocale();
  const [state, action, pending] = useActionState(deleteKeptDatabase.bind(null, name), null as FormState);
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(t(locale, "Delete this copy? The restore can then no longer be undone."))) event.preventDefault();
      }}
      className="flex flex-wrap items-center justify-between gap-2"
    >
      <span className="font-mono text-xs">{name}</span>
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {t(locale, "Delete")}
      </Button>
      {state?.message ? <p className="w-full text-destructive text-sm">{t(locale, state.message)}</p> : null}
    </form>
  );
}
