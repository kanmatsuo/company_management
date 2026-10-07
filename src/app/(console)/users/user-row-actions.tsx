"use client";

import Link from "@/components/app-link";
import { useActionState } from "react";
import { Pencil, UserX } from "lucide-react";
import { deactivateUser, type FormState } from "@/app/(console)/users/actions";
import { DeleteForGood } from "@/components/delete-for-good";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export function UserRowActions({
  id,
  active,
  nextPath,
  showEdit = true,
  canDelete = false,
  locale = "en",
}: {
  id: number;
  active: boolean;
  nextPath: string;
  showEdit?: boolean;
  canDelete?: boolean;
  locale?: Locale;
}) {
  const deactivate = deactivateUser.bind(null, id, nextPath);
  const [deactivateState, deactivateAction, deactivating] = useActionState(deactivate, null as FormState);
  const message = deactivateState?.message;

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
      {canDelete ? <DeleteForGood kind="user" id={id} redirectTo={nextPath} icon /> : null}
      {message ? <p className="basis-full text-right text-destructive text-xs">{message}</p> : null}
    </div>
  );
}
