"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-context";
import type { FormState } from "@/lib/form";
import { t } from "@/lib/i18n";
import { runBackup } from "@/app/(console)/mutations";

/** "Back up now"; while a backup runs, the page reloads every 3 seconds. */
export function RunButton({ running }: { running: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  const [state, action, pending] = useActionState(runBackup, null as FormState);
  const busy = running || pending;
  useEffect(() => {
    if (state?.notice) router.refresh(); // shows it running
  }, [state, router]);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => router.refresh(), 3000);
    return () => window.clearInterval(timer);
  }, [running, router]);
  return (
    <form action={action} className="grid gap-2">
      <div>
        <Button type="submit" disabled={busy}>
          {running ? t(locale, "Backing up…") : t(locale, "Back up now")}
        </Button>
      </div>
      {state?.message ? <p className="text-destructive text-sm">{t(locale, state.message)}</p> : null}
      {state?.notice && !running ? <p className="text-muted-foreground text-sm">{t(locale, state.notice)}</p> : null}
    </form>
  );
}
