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
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="off" required />
        {state?.fields?.email?.map((error) => (
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
