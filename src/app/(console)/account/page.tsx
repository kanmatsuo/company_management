import { Title, Hint, AutoText } from "@/components/auto-text";
import { redirect } from "next/navigation";
import { changePassword } from "@/app/(console)/mutations";
import { Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldForm } from "@/components/field-form";
import { getSession } from "@/lib/current-user";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { loadCatalog } from "@/lib/permission-catalog";

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const user = session.user;
  const lastLogin = user.last_login ? new Date(user.last_login).toLocaleString() : null;
  const locale = await getLocale();
  const held = new Set(user.permissions);
  const mine = (await loadCatalog(session.token))
    .map((area) => ({ ...area, permissions: area.permissions.filter((permission) => held.has(permission.codename)) }))
    .filter((area) => area.permissions.length > 0);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <Title>Account</Title>
        <Hint>The person signed in on this browser.</Hint>
      </div>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{user.full_name || user.username}</CardTitle>
          <CardDescription>{user.username}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm">
          <div>
            <p className="text-muted-foreground"><AutoText>Roles</AutoText></p>
            <p className="mt-1">{user.roles.length > 0 ? user.roles.join(", ") : <AutoText>None</AutoText>}</p>
          </div>
          <div>
            <p className="text-muted-foreground"><AutoText>Last sign-in</AutoText></p>
            <p className="mt-1">{lastLogin ?? <AutoText>No previous sign-in</AutoText>}</p>
          </div>
          <div>
            <p className="text-muted-foreground"><AutoText>What you can do</AutoText></p>
            {mine.length === 0 ? (
              <p className="mt-1"><AutoText>Only your own records.</AutoText></p>
            ) : (
              <div className="mt-2 grid gap-3">
                {mine.map((area) => (
                  <div key={area.area}>
                    <p className="font-medium text-xs">{t(locale, area.area)}</p>
                    <ul className="mt-1 grid gap-0.5">
                      {area.permissions.map((permission) => (
                        <li key={permission.codename} className="flex items-start gap-2">
                          <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span>{t(locale, permission.description)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
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
    </div>
  );
}
