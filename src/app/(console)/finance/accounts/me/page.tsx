import { Title } from "@/components/auto-text";
import { setMyPin } from "@/app/(console)/mutations";
import type { components } from "@/api/schema";
import { Facts } from "@/components/facts";
import { FieldForm } from "@/components/field-form";
import { LoadError } from "@/components/no-access";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { show, showTime } from "@/lib/load-all";
import { loadOne } from "@/lib/page-data";

type Account = components["schemas"]["DeveloperAccount"];

export default async function MyWalletPage() {
  const loaded = await loadOne<Account>("/api/v1/finance/accounts/me/");
  if (!loaded.value) return <LoadError title="My wallet" message={loaded.error ?? "No wallet is linked to this account."} />;
  const account = loaded.value;
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <Title>My wallet</Title>
        <p className="text-muted-foreground text-sm">{account.balance} {account.currency} · {account.status}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <Facts
            items={[
              { label: "PIN", value: account.has_pin ? "Set" : "Not set" },
              { label: "PIN locked until", value: showTime(account.pin_locked_until) },
              { label: "Reason", value: show(account.status_reason) },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Spending PIN</CardTitle>
          <CardDescription>Four to six digits. Enter the current PIN when you already have one.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldForm
            action={setMyPin}
            submitLabel="Save PIN"
            fields={[
              { name: "current_pin", label: "Current PIN", type: "password" },
              { name: "pin", label: "New PIN", type: "password", required: true },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
