import Link from "next/link";
import { redirect } from "next/navigation";
import { changePassword } from "@/app/(console)/mutations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldForm } from "@/components/field-form";
import { getSession } from "@/lib/current-user";

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const user = session.user;
  const lastLogin = user.last_login ? new Date(user.last_login).toLocaleString() : "No previous sign-in";

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Account</h1>
        <p className="text-muted-foreground text-sm">The person signed in on this browser.</p>
      </div>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{user.full_name || user.email}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Roles</p>
            <p className="mt-1">{user.roles.length > 0 ? user.roles.join(", ") : "None"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Last sign-in</p>
            <p className="mt-1">{lastLogin}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Permissions</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {user.permissions.length > 0 ? (
                user.permissions.map((code) => (
                  <Badge key={code} variant="secondary" className="font-mono">
                    {code}
                  </Badge>
                ))
              ) : (
                <span>None</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change the password for this account.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldForm
            action={changePassword}
            submitLabel="Update password"
            fields={[
              { name: "old_password", label: "Current password", type: "password", required: true },
              { name: "new_password", label: "New password", type: "password", required: true },
            ]}
          />
        </CardContent>
      </Card>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Your records</CardTitle>
          <CardDescription>These use the signed-in account. The server returns an error if you have no matching profile.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm"><Link href="/developers/me">My developer profile</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href="/attendance/me">My attendance</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href="/attendance/records/me">My attendance records</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href="/finance/accounts/me">My wallet</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href="/finance/transactions/me">My transactions</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href="/purchases/me">My purchases</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href="/sellers/me">My seller profile</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href="/seller-finance/accounts/me">My seller balance</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
