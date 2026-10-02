"use client";

import { AutoText } from "@/components/auto-text";

import { useActionState } from "react";
import { assignRole, removeRole, updateUser, type FormState } from "@/app/(console)/users/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EditUserForm({
  id,
  fullName,
  isActive,
}: {
  id: number;
  fullName: string;
  isActive: boolean;
}) {
  const action = updateUser.bind(null, id);
  const [state, formAction, pending] = useActionState(action, null as FormState);

  return (
    <form action={formAction} className="grid max-w-md gap-4">
      {state?.message ? <p className="text-destructive text-sm">{state.message}</p> : null}
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
  const available = roles.filter((role) => !current.includes(role.code));

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        {current.length === 0 ? <p className="text-muted-foreground text-sm"><AutoText>No roles.</AutoText></p> : null}
        {current.map((code) => (
          <form key={code} action={removeRole.bind(null, id, code)}>
            <Button type="submit" size="sm" variant="outline">
              {code} · Remove
            </Button>
          </form>
        ))}
      </div>
      {available.length > 0 ? (
        <form action={formAction} className="flex flex-wrap items-end gap-2">
          <div className="grid gap-1.5">
            <Label htmlFor="role">Add role</Label>
            <select id="role" name="role" className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm">
              {available.map((role) => (
                <option key={role.code} value={role.code}>
                  {role.name} ({role.code})
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" size="sm" disabled={pending}>Add</Button>
          {state?.message ? <p className="text-destructive text-sm">{state.message}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
