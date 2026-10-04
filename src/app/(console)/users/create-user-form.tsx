"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/(console)/users/actions";
import { createUser } from "@/app/(console)/users/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateUserForm() {
  const [state, action, pending] = useActionState(createUser, null as FormState);

  return (
    <form action={action} className="grid max-w-md gap-4">
      {state?.message ? <p className="text-destructive text-sm">{state.message}</p> : null}
      <div className="grid gap-1.5">
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" autoComplete="off" required minLength={3} maxLength={150} pattern="[A-Za-z0-9._\-]{3,150}" title="3 to 150 letters, digits, dots, underscores or hyphens" />
        {state?.fields?.username?.map((error) => (
          <p key={error} className="text-destructive text-xs">{error}</p>
        ))}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" />
        {state?.fields?.full_name?.map((error) => (
          <p key={error} className="text-destructive text-xs">{error}</p>
        ))}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
        {state?.fields?.password?.map((error) => (
          <p key={error} className="text-destructive text-xs">{error}</p>
        ))}
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create user"}</Button>
    </form>
  );
}
