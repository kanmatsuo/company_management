import { EditUserForm, RoleForm } from "@/app/(console)/users/edit-user-form";
import { UserRowActions } from "@/app/(console)/users/user-row-actions";
import type { components } from "@/api/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DjangoError, djangoFetch } from "@/lib/django";
import { can, getSession } from "@/lib/current-user";
import { t } from "@/lib/i18n";
import { showTime } from "@/lib/load-all";
import { getLocale } from "@/lib/locale";
import { redirect } from "next/navigation";

type User = components["schemas"]["User"];
type Role = components["schemas"]["Role"];

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = Number(id);
  if (!Number.isInteger(userId)) redirect("/users");
  const session = await getSession();
  if (!session) redirect("/login");
  const locale = await getLocale();
  if (!can(session.user, "user.view")) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No access</CardTitle>
          <CardDescription>Your account cannot open users.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  let user: User;
  try {
    user = await djangoFetch<User>(`/api/v1/users/${userId}/`, { accessToken: session.token });
  } catch (error) {
    const message = error instanceof DjangoError ? error.message : t(locale, "Could not load this user.");
    return (
      <Card>
        <CardHeader>
          <CardTitle>User</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  let roles: Role[] = [];
  if (can(session.user, "role.view")) {
    try {
      roles = await djangoFetch<Role[]>("/api/v1/roles/", { accessToken: session.token });
    } catch {
      roles = [];
    }
  }
  const canManage = can(session.user, "user.manage");
  const canAssign = can(session.user, "role.assign");

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{user.full_name || user.username}</h1>
        <p className="text-muted-foreground text-sm">
          {user.username} · {t(locale, "Joined")} {showTime(user.date_joined)} · {t(locale, "Last sign-in")} {showTime(user.last_login)}
        </p>
      </div>
      {canManage ? <UserRowActions id={user.id} active={user.is_active} nextPath="/users" showEdit={false} locale={locale} canDelete={can(session.user, "system.delete_records") && user.id !== session.user.id} /> : null}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            {canManage
              ? t(locale, "Deactivate stops sign-in and keeps the account. Delete asks you to confirm, then removes it if the server allows that.")
              : t(locale, "You can view this account. Changing it needs user.manage.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canManage ? (
            <EditUserForm id={user.id} username={user.username} fullName={user.full_name} isActive={user.is_active} />
          ) : (
            <p className="text-sm">{t(locale, user.is_active ? "Active" : "Inactive")}</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <CardDescription>A user can have several roles. You can only grant roles you are allowed to grant.</CardDescription>
        </CardHeader>
        <CardContent>
          {canAssign ? (
            <RoleForm id={user.id} roles={roles} current={user.roles} />
          ) : (
            <p className="text-sm">{user.roles.length > 0 ? user.roles.join(", ") : "No roles."}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
