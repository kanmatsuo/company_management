import { redirect } from "next/navigation";
import { closeAccount, freezeAccount, reopenAccount, resetAccountPin, unfreezeAccount } from "@/app/(console)/mutations";
import type { components } from "@/api/schema";
import { Facts } from "@/components/facts";
import { FieldForm } from "@/components/field-form";
import { LoadError } from "@/components/no-access";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { canManage } from "@/lib/current-user";
import { show, showTime } from "@/lib/load-all";
import { loadOne } from "@/lib/page-data";

type Account = components["schemas"]["DeveloperAccount"];

export default async function FinanceAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) redirect("/finance/accounts");
  const loaded = await loadOne<Account>(`/api/v1/finance/accounts/${id}/`);
  if (!loaded.value) return <LoadError title="Wallet" message={loaded.error ?? "Not found."} />;
  const account = loaded.value;
  const manage = canManage(loaded.session.user, ["finance"]);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{show(account.developer?.full_name)}</h1>
        <p className="text-muted-foreground text-sm">{account.balance} {account.currency} · {account.status}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Facts
            items={[
              { label: "PIN", value: account.has_pin ? "Set" : "Not set" },
              { label: "PIN locked until", value: showTime(account.pin_locked_until) },
              { label: "Reason", value: show(account.status_reason) },
              { label: "Updated", value: showTime(account.updated_at) },
            ]}
          />
        </CardContent>
      </Card>
      {manage ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Freeze</CardTitle>
              <CardDescription>Spending stops. Deposits still work.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldForm action={freezeAccount.bind(null, account.id)} submitLabel="Freeze" fields={[{ name: "reason", label: "Reason" }]} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Unfreeze</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldForm action={unfreezeAccount.bind(null, account.id)} submitLabel="Unfreeze" fields={[{ name: "reason", label: "Reason" }]} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Close</CardTitle>
              <CardDescription>Only a zero balance can be closed.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldForm action={closeAccount.bind(null, account.id)} submitLabel="Close" variant="destructive" fields={[{ name: "reason", label: "Reason" }]} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Reopen</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldForm action={reopenAccount.bind(null, account.id)} submitLabel="Reopen" fields={[{ name: "reason", label: "Reason" }]} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Reset PIN</CardTitle>
              <CardDescription>Clears the spending PIN so the developer can set a new one.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldForm action={resetAccountPin.bind(null, account.id)} submitLabel="Reset PIN" variant="outline" fields={[]} />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
