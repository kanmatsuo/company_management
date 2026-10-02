"use client";

import Link from "@/components/app-link";
import { useActionState, useState } from "react";
import { Pencil, Trash2, UserX } from "lucide-react";
import { deactivateUser, deleteUser, type FormState } from "@/app/(console)/users/actions";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export function UserRowActions({
  id,
  active,
  nextPath,
  showEdit = true,
  locale = "en",
}: {
  id: number;
  active: boolean;
  nextPath: string;
  showEdit?: boolean;
  locale?: Locale;
}) {
  const deactivate = deactivateUser.bind(null, id, nextPath);
  const remove = deleteUser.bind(null, id);
  const [deactivateState, deactivateAction, deactivating] = useActionState(deactivate, null as FormState);
  const [deleteState, deleteAction, deleting] = useActionState(remove, null as FormState);
  const [confirming, setConfirming] = useState(false);
  const message = deleteState?.message || deactivateState?.message;

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {showEdit ? (
        <Button asChild size="icon-sm" variant="outline">
          <Link href={`/users/${id}`} aria-label={t(locale, "Edit")}>
            <Pencil />
          </Link>
        </Button>
      ) : null}
      <form action={deactivateAction}>
        <Button
          type="submit"
          size="icon-sm"
          variant="outline"
          disabled={deactivating || !active}
          aria-label={active ? t(locale, "Deactivate") : t(locale, "Already inactive")}
          title={active ? t(locale, "Deactivate") : t(locale, "Already inactive")}
        >
          <UserX />
        </Button>
      </form>
      {confirming ? (
        <form action={deleteAction} className="flex items-center gap-1">
          <span className="text-muted-foreground text-xs">{t(locale, "Delete permanently?")}</span>
          <Button type="button" size="sm" variant="outline" onClick={() => setConfirming(false)}>
            {t(locale, "Cancel")}
          </Button>
          <Button type="submit" size="sm" variant="destructive" disabled={deleting}>
            {t(locale, "Delete")}
          </Button>
        </form>
      ) : (
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label={t(locale, "Delete")}
          title={t(locale, "Delete permanently")}
          onClick={() => setConfirming(true)}
        >
          <Trash2 />
        </Button>
      )}
      {message ? <p className="basis-full text-right text-destructive text-xs">{message}</p> : null}
    </div>
  );
}
