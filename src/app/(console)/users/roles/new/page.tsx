import { createRole } from "@/app/(console)/users/roles/actions";
import { RoleForm } from "@/app/(console)/users/roles/role-form";
import { Title, Hint } from "@/components/auto-text";
import { NoAccess } from "@/components/no-access";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { can } from "@/lib/current-user";
import { loadCatalog } from "@/lib/permission-catalog";
import { requireSession } from "@/lib/page-data";

export default async function NewRolePage() {
  const session = await requireSession();
  if (!can(session.user, "role.manage")) return <NoAccess description="Your account cannot create roles." />;
  const catalog = await loadCatalog(session.token);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <Title>New role</Title>
        <Hint>A role is a set of permissions. Give it to users on their page.</Hint>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Role</CardTitle>
          <CardDescription>You can only give permissions you have yourself.</CardDescription>
        </CardHeader>
        <CardContent>
          <RoleForm action={createRole} catalog={catalog} create defaults={{ name: "", description: "", permissions: [] }} />
        </CardContent>
      </Card>
    </div>
  );
}
