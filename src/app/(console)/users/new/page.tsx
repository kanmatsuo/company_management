import { Title, Hint } from "@/components/auto-text";
import { CreateUserForm } from "@/app/(console)/users/create-user-form";
import { NoAccess } from "@/components/no-access";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { can, getSession } from "@/lib/current-user";
import { djangoFetch } from "@/lib/django";
import { redirect } from "next/navigation";

export default async function NewUserPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session.user, "user.manage")) return <NoAccess description="Your account cannot create users." />;
  const roles = can(session.user, "role.assign")
    ? await djangoFetch<{ code: string; name: string }[] | { results: { code: string; name: string }[] }>("/api/v1/roles/", {
        accessToken: session.token,
      })
        .then((body) => (Array.isArray(body) ? body : body.results).map((role) => ({ value: role.code, label: `${role.name} (${role.code})` })))
        .catch(() => [])
    : null;
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <Title>New user</Title>
        <Hint>The password rules are checked by the server.</Hint>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>The username is the sign-in name.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateUserForm roles={roles} />
        </CardContent>
      </Card>
    </div>
  );
}
