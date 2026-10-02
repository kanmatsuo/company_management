import { Title } from "@/components/auto-text";
import type { components } from "@/api/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { DjangoError, djangoFetch } from "@/lib/django";
import { can, getSession } from "@/lib/current-user";
import { redirect } from "next/navigation";

type Role = components["schemas"]["Role"];

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

  let roles: Role[] = [];
  let error: string | null = null;
  try {
    roles = await djangoFetch<Role[]>("/api/v1/roles/", { accessToken: session.token });
  } catch (caught) {
    error = caught instanceof DjangoError ? caught.message : "Could not load roles.";
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <Title>Roles</Title>
        <p className="text-muted-foreground text-sm">{roles.length} roles</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Permission sets</CardTitle>
          <CardDescription>Roles are assigned on a user. They are not deleted here.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-destructive text-sm">{error}</p>
          ) : (
            <DataTable
              headers={["Code", "Name", "Permissions"]}
              rows={roles.map((role) => [role.code, role.name, role.permissions.join(", ")])}
              hrefs={roles.map((role) => `/users/roles/${role.code}`)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
