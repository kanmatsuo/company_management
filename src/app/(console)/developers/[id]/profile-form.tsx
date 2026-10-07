"use client";

import { useActionState } from "react";
import { updateDeveloper } from "@/app/(console)/mutations";
import { ProfileFields, type Choice, type ProfileDefaults } from "@/app/(console)/developers/profile-fields";
import { useLocale } from "@/components/locale-context";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/form";
import { t } from "@/lib/i18n";

export function ProfileForm({ id, defaults, buildings, departments }: { id: number; defaults: ProfileDefaults; buildings: Choice[]; departments: string[] }) {
  const locale = useLocale();
  const [state, action, pending] = useActionState(updateDeveloper.bind(null, id), null as FormState);
  return (
    <form action={action} className="grid gap-4">
      {state?.message ? <p className="text-destructive text-sm">{t(locale, state.message)}</p> : null}
      <ProfileFields defaults={defaults} buildings={buildings} departments={departments} state={state} />
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? t(locale, "Saving…") : t(locale, "Save")}
        </Button>
      </div>
    </form>
  );
}
