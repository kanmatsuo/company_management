"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/(console)/users/actions";
import { createUser } from "@/app/(console)/users/actions";
import { useLocale } from "@/components/locale-context";
import { SearchSelect } from "@/components/search-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/lib/i18n";

/** Username, name, password twice and (optionally) the first role, in two columns. */
export function CreateUserForm({ roles }: { roles: { value: string; label: string }[] | null }) {
  const locale = useLocale();
  const [state, action, pending] = useActionState(createUser, null as FormState);
  const errors = (name: string) =>
    state?.fields?.[name]?.map((error) => (
      <p key={error} className="text-destructive text-xs">
        {error}
      </p>
    ));
  return (
    <form action={action} className="grid max-w-3xl gap-4 sm:grid-cols-2">
      {state?.message ? <p className="text-destructive text-sm sm:col-span-2">{t(locale, state.message)}</p> : null}
      <div className="grid content-start gap-1.5">
        <Label htmlFor="username">
          {t(locale, "Username")}
          <span className="text-destructive"> *</span>
        </Label>
        <Input
          id="username"
          name="username"
          autoComplete="off"
          required
          minLength={3}
          maxLength={150}
          pattern="[A-Za-z0-9._\-]{3,150}"
          title={t(locale, "3 to 150 letters, digits, dots, underscores or hyphens")}
        />
        {errors("username")}
      </div>
      <div className="grid content-start gap-1.5">
        <Label htmlFor="full_name">{t(locale, "Full name")}</Label>
        <Input id="full_name" name="full_name" />
        {errors("full_name")}
      </div>
      <div className="grid content-start gap-1.5">
        <Label htmlFor="password">
          {t(locale, "Password")}
          <span className="text-destructive"> *</span>
        </Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
        {errors("password")}
      </div>
      <div className="grid content-start gap-1.5">
        <Label htmlFor="password_confirm">
          {t(locale, "Password again")}
          <span className="text-destructive"> *</span>
        </Label>
        <Input id="password_confirm" name="password_confirm" type="password" autoComplete="new-password" required />
        {errors("password_confirm")}
      </div>
      {roles ? (
        <div className="grid content-start gap-1.5">
          <Label htmlFor="role">{t(locale, "Role")}</Label>
          <SearchSelect id="role" name="role" locale={locale} defaultValue="" options={[{ value: "", label: t(locale, "No role yet") }, ...roles]} />
          <p className="text-muted-foreground text-xs">{t(locale, "More roles can be added on the user's page.")}</p>
        </div>
      ) : null}
      <Button type="submit" disabled={pending} className="min-w-40 justify-self-start sm:col-span-2">
        {pending ? t(locale, "Creating…") : t(locale, "Create user")}
      </Button>
    </form>
  );
}
