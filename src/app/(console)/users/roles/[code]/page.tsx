import type { components } from "@/api/schema";
import { deleteRole, updateRole } from "@/app/(console)/users/roles/actions";
import { RoleForm } from "@/app/(console)/users/roles/role-form";
import { FieldForm } from "@/components/field-form";
import { LoadError } from "@/components/no-access";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { can } from "@/lib/current-user";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { loadCatalog } from "@/lib/permission-catalog";
import { loadOne } from "@/lib/page-data";

type Role = components["schemas"]["Role"] & { user_count?: number };

const SCOPED = new Set(["BUILDING_MANAGER", "BUILDING_OWNER"]);
const SELF_SERVICE = new Set(["DEVELOPER", "SELLER"]);

export default async function RoleDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const code = decodeURIComponent((await params).code);
  const loaded = await loadOne<Role>(`/api/v1/roles/${encodeURIComponent(code)}/`);
  if (!loaded.value) return <LoadError title="Role" message={loaded.error ?? "Not found."} />;
  const role = loaded.value;
  const locale = await getLocale();
  const manage = can(loaded.session.user, "role.manage");
  const catalog = await loadCatalog(loaded.session.token);
  const total = catalog.reduce((sum, area) => sum + area.permissions.length, 0);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{t(locale, role.name)}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
          <code className="font-mono">{role.code}</code>
          <Badge variant={role.is_system ? "outline" : "secondary"}>{t(locale, role.is_system ? "Built-in" : "Custom")}</Badge>
          <span>
            · {role.permissions.length}/{total} {t(locale, "permissions")} · {role.user_count ?? 0} {t(locale, "users")}
          </span>
        </div>
      </div>
      {SCOPED.has(role.code) ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          {t(locale, "Everything this role allows is limited to the buildings the person manages or owns (set on each building).")}
        </p>
      ) : null}
      {SELF_SERVICE.has(role.code) ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          {t(locale, "This role works on the person's own records without any permission here. A permission added here applies to everyone's records, not only their own.")}
        </p>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>{t(locale, "Permissions")}</CardTitle>
          <CardDescription>
            {manage
              ? t(locale, "Tick what this role may do. Saving changes it for everyone with this role. You can only give permissions you have yourself.")
              : t(locale, role.description ?? "")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoleForm
            action={manage ? updateRole.bind(null, role.code) : undefined}
            catalog={catalog}
            locked={role.code === "ADMIN"}
            readOnly={!manage}
            defaults={{ name: role.name, description: role.description ?? "", permissions: role.permissions }}
          />
        </CardContent>
      </Card>
      {manage && !role.is_system ? (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle>{t(locale, "Delete role")}</CardTitle>
            <CardDescription>{t(locale, "Only a role nobody has can be deleted. Take it away from its users first.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldForm action={deleteRole.bind(null, role.code)} submitLabel="Delete role" variant="destructive" fields={[]} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
