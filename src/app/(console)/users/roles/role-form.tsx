"use client";

import { useActionState, useState } from "react";
import { useLocale } from "@/components/locale-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormState } from "@/lib/form";
import { t } from "@/lib/i18n";
import type { CatalogArea } from "@/lib/permission-catalog";
import { PAGES } from "@/lib/permission-pages";

/** A role's name, description and permissions, grouped by area. `locked`: the Admin
 * role, which always has every permission. `readOnly`: shown without inputs. */
export function RoleForm({
  action,
  catalog,
  create = false,
  locked = false,
  readOnly = false,
  defaults,
}: {
  action?: (prev: FormState, data: FormData) => Promise<FormState>;
  catalog: CatalogArea[];
  create?: boolean;
  locked?: boolean;
  readOnly?: boolean;
  defaults: { name: string; description: string; permissions: string[] };
}) {
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(action ?? (async () => null), null as FormState);
  const [chosen, setChosen] = useState(() => new Set(defaults.permissions));
  const fixed = locked || readOnly;
  const toggle = (codes: string[], on: boolean) =>
    setChosen((current) => {
      const next = new Set(current);
      for (const code of codes) {
        if (on) next.add(code);
        else next.delete(code);
      }
      return next;
    });
  const error = (name: string) => state?.fields?.[name]?.map((message) => <p key={message} className="text-destructive text-xs">{message}</p>);

  return (
    <form action={formAction} className="grid gap-5">
      {state?.message ? <p className="text-destructive text-sm">{state.message}</p> : null}
      {state?.notice ? <p className="text-emerald-600 text-sm dark:text-emerald-400">{t(locale, state.notice)}</p> : null}
      {readOnly ? null : (
        <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
          {create ? (
            <div className="grid gap-1.5">
              <Label htmlFor="code">{t(locale, "Code")}</Label>
              <Input id="code" name="code" required placeholder="NIGHT_GUARD" className="font-mono uppercase" />
              <p className="text-muted-foreground text-xs">{t(locale, "Capital letters, digits and _. It cannot change later.")}</p>
              {error("code")}
            </div>
          ) : null}
          <div className="grid content-start gap-1.5">
            <Label htmlFor="name">{t(locale, "Name")}</Label>
            <Input id="name" name="name" required defaultValue={defaults.name} />
            {error("name")}
          </div>
          <div className="grid content-start gap-1.5 sm:col-span-2">
            <Label htmlFor="description">{t(locale, "Description")}</Label>
            <Input id="description" name="description" defaultValue={defaults.description} placeholder="Who gets this role and why" />
          </div>
        </div>
      )}
      {locked ? (
        <>
          <input type="hidden" name="locked" value="1" />
          <p className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
            {t(locale, "The Admin role always has every permission, so nobody can lock themselves out.")}
          </p>
        </>
      ) : null}
      {error("permissions")}
      <div className="grid gap-4 lg:grid-cols-2">
        {catalog.map((area) => {
          const codes = area.permissions.map((permission) => permission.codename);
          const count = codes.filter((code) => chosen.has(code)).length;
          return (
            <fieldset key={area.area} className="grid content-start gap-1 rounded-lg border p-3">
              <legend className="flex w-full items-center justify-between gap-2 px-1">
                <span className="font-medium text-sm">
                  {t(locale, area.area)}{" "}
                  <span className="font-normal text-muted-foreground text-xs tabular-nums">
                    {count}/{codes.length}
                  </span>
                </span>
              </legend>
              {fixed ? null : (
                <div className="flex gap-1 pb-1">
                  <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => toggle(codes, true)}>
                    {t(locale, "All")}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => toggle(codes, false)}>
                    {t(locale, "None")}
                  </Button>
                </div>
              )}
              {area.permissions.map((permission) => {
                const on = locked || chosen.has(permission.codename);
                return (
                  <label
                    key={permission.codename}
                    className={`flex items-start gap-2.5 rounded-md px-1.5 py-1.5 ${fixed ? "" : "cursor-pointer hover:bg-muted/50"} ${on ? "" : "opacity-60"}`}
                  >
                    <input
                      type="checkbox"
                      name="permissions"
                      value={permission.codename}
                      checked={on}
                      disabled={fixed}
                      onChange={(event) => toggle([permission.codename], event.target.checked)}
                      className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
                    />
                    <span className="grid gap-0.5">
                      <span className="text-sm">{t(locale, permission.description)}</span>
                      <span className="text-muted-foreground text-xs">
                        {PAGES[permission.codename] ? `${t(locale, PAGES[permission.codename])} · ` : ""}
                        <code className="font-mono">{permission.codename}</code>
                      </span>
                    </span>
                  </label>
                );
              })}
            </fieldset>
          );
        })}
      </div>
      {readOnly || !action ? null : (
        <Button type="submit" disabled={pending} className="min-w-40 justify-self-start">
          {pending ? t(locale, "Saving…") : t(locale, create ? "Create role" : "Save")}
        </Button>
      )}
    </form>
  );
}
