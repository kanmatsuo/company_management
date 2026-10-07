import { Check, Plus } from "lucide-react";
import Link from "@/components/app-link";
import { Title } from "@/components/auto-text";
import type { components } from "@/api/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DjangoError, djangoFetch } from "@/lib/django";
import { can, getSession } from "@/lib/current-user";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { loadCatalog } from "@/lib/permission-catalog";
import { PAGES } from "@/lib/permission-pages";
import { redirect } from "next/navigation";

type Role = components["schemas"]["Role"] & { user_count?: number };

export default async function RolesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session.user, "role.view")) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No access</CardTitle>
          <CardDescription>Your account cannot open roles.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const locale = await getLocale();
  let roles: Role[] = [];
  let error: string | null = null;
  try {
    roles = await djangoFetch<Role[]>("/api/v1/roles/", { accessToken: session.token });
  } catch (caught) {
    error = caught instanceof DjangoError ? caught.message : "Could not load roles.";
  }
  const catalog = await loadCatalog(session.token);
  const has = new Map(roles.map((role) => [role.code, new Set(role.permissions)]));

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Title>Roles</Title>
          <p className="text-muted-foreground text-sm">
            {roles.length.toLocaleString()} {t(locale, "roles")} · {catalog.reduce((sum, area) => sum + area.permissions.length, 0)} {t(locale, "permissions")}
          </p>
        </div>
        {can(session.user, "role.manage") ? (
          <Button asChild>
            <Link href="/users/roles/new">
              <Plus />
              {t(locale, "New role")}
            </Link>
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {roles.map((role) => (
          <Link key={role.code} href={`/users/roles/${role.code}`} className="group">
            <Card className="h-full py-4 transition-colors group-hover:border-primary/50">
              <CardContent className="grid gap-1 px-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{t(locale, role.name)}</span>
                  {role.is_system ? <Badge variant="outline">{t(locale, "Built-in")}</Badge> : <Badge variant="secondary">{t(locale, "Custom")}</Badge>}
                </div>
                <p className="line-clamp-2 text-muted-foreground text-xs">{t(locale, role.description ?? "")}</p>
                <p className="text-xs tabular-nums">
                  {role.permissions.length} {t(locale, "permissions")} · {role.user_count ?? 0} {t(locale, "users")}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t(locale, "Who can do what")}</CardTitle>
          <CardDescription>
            {t(locale, "Every permission and the roles that have it. Building managers and building owners only see their own buildings. Open a role to change it.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[56rem] border-collapse text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b">
                <th className="py-2 pr-3 text-left font-medium text-muted-foreground text-xs">{t(locale, "Permission")}</th>
                {roles.map((role) => (
                  <th key={role.code} className="w-20 px-1 py-2 text-center align-bottom font-medium text-xs">
                    <Link href={`/users/roles/${role.code}`} className="hover:underline">
                      {t(locale, role.name)}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            {catalog.map((area) => (
              <tbody key={area.area}>
                <tr>
                  <th colSpan={roles.length + 1} className="bg-muted/50 px-2 py-1.5 text-left font-semibold text-xs">
                    {t(locale, area.area)}
                  </th>
                </tr>
                {area.permissions.map((permission) => (
                  <tr key={permission.codename} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-1.5 pr-3">
                      <span className="block">{t(locale, permission.description)}</span>
                      <span className="text-muted-foreground text-xs">
                        {PAGES[permission.codename] ? `${t(locale, PAGES[permission.codename])} · ` : ""}
                        <code className="font-mono">{permission.codename}</code>
                      </span>
                    </td>
                    {roles.map((role) => (
                      <td key={role.code} className="text-center">
                        {has.get(role.code)?.has(permission.codename) ? (
                          <Check className="mx-auto size-4 text-emerald-600 dark:text-emerald-400" aria-label={t(locale, "Yes")} />
                        ) : (
                          <span className="text-muted-foreground/30">·</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
