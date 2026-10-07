"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/components/locale-context";
import type { FormState } from "@/lib/form";
import { t } from "@/lib/i18n";
import { resetData } from "@/app/(console)/mutations";

/** The button only works once the phrase is typed exactly; the server checks it again. */
export function ResetForm({ phrase }: { phrase: string }) {
  const locale = useLocale();
  const [state, action, pending] = useActionState(resetData, null as FormState);
  const [typed, setTyped] = useState("");
  return (
    <form action={action} className="grid max-w-md gap-3">
      {state?.message ? <p className="text-destructive text-sm">{t(locale, state.message)}</p> : null}
      <div className="grid gap-1.5">
        <Label htmlFor="confirm">
          {t(locale, "To confirm, type")} <span className="font-mono font-semibold">{phrase}</span>
        </Label>
        <Input
          id="confirm"
          name="confirm"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          className="font-mono"
        />
      </div>
      <Button type="submit" variant="destructive" disabled={pending || typed !== phrase}>
        {pending ? t(locale, "Backing up and deleting…") : t(locale, "Back up and delete all data")}
      </Button>
    </form>
  );
}
