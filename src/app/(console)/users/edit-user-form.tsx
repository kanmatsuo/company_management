"use client";

import { SearchSelect } from "@/components/search-select";
import { AutoText } from "@/components/auto-text";

import { useActionState } from "react";
import { assignRole, removeRole, updateUser, type FormState } from "@/app/(console)/users/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/components/locale-context";
import { t } from "@/lib/i18n";

export function EditUserForm({
  id,
  username,
  fullName,
  isActive,
}: {
  id: number;
  username: string;
  fullName: string;
  isActive: boolean;
}) {
  const action = updateUser.bind(null, id);
  const [state, formAction, pending] = useActionState(action, null as FormState);

  return (
    <form action={formAction} className="grid max-w-md gap-4">
      {state?.message ? <p className="text-destructive text-sm">{state.message}</p> : null}
      <div className="grid gap-1.5">
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" defaultValue={username} required autoComplete="off" pattern="[A-Za-z0-9._\-]{3,150}" />
        {state?.fields?.username?.map((error) => (
          <p key={error} className="text-destructive text-xs">{error}</p>
        ))}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" defaultValue={fullName} />
        {state?.fields?.full_name?.map((error) => (
          <p key={error} className="text-destructive text-xs">{error}</p>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input name="is_active" type="checkbox" defaultChecked={isActive} className="size-4" />
        Active
      </label>
      {state?.fields?.is_active?.map((error) => (
        <p key={error} className="text-destructive text-xs">{error}</p>
      ))}
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
    </form>
  );
}

export function RoleForm({
  id,
  roles,
  current,
}: {
  id: number;
  roles: { code: string; name: string }[];
  current: string[];
}) {
  const action = assignRole.bind(null, id);
  const [state, formAction, pending] = useActionState(action, null as FormState);
  const locale = useLocale();
  const available = roles.filter((role) => !current.includes(role.code));

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        {current.length === 0 ? <p className="text-muted-foreground text-sm"><AutoText>No roles.</AutoText></p> : null}
        {current.map((code) => (
          <form key={code} action={removeRole.bind(null, id, code)}>
            <Button type="submit" size="sm" variant="outline">
              {code} · {t(locale, "Remove")}
            </Button>
          </form>
        ))}
      </div>
      {available.length > 0 ? (
        <form action={formAction} className="flex flex-wrap items-end gap-2">
          <div className="grid w-64 gap-1.5">
            <Label htmlFor="role">Add role</Label>
            <SearchSelect
              id="role"
              name="role"
              locale={locale}
              defaultValue={available[0]?.code ?? ""}
              options={available.map((role) => ({ value: role.code, label: `${role.name} (${role.code})` }))}
            />
          </div>
          <Button type="submit" size="sm" disabled={pending}>{t(locale, "Add")}</Button>
          {state?.message ? <p className="text-destructive text-sm">{state.message}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
