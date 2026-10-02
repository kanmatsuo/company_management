import { Title, Hint } from "@/components/auto-text";
import { CreateUserForm } from "@/app/(console)/users/create-user-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { can, getSession } from "@/lib/current-user";
import { redirect } from "next/navigation";

export default async function NewUserPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session.user, "user.manage")) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No access</CardTitle>
          <CardDescription>Your account cannot create users.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <Title>New user</Title>
        <Hint>The password rules are checked by the server.</Hint>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Email is the sign-in name.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateUserForm />
        </CardContent>
      </Card>
    </div>
  );
}
