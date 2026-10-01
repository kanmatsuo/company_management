import type { components } from "@/api/schema";
import { Facts } from "@/components/facts";
import { LoadError } from "@/components/no-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { showTime } from "@/lib/load-all";
import { loadOne } from "@/lib/page-data";

type Account = components["schemas"]["SellerAccount"];

export default async function MySellerBalancePage() {
  const loaded = await loadOne<Account>("/api/v1/seller-finance/accounts/me/");
  if (!loaded.value) return <LoadError title="My seller balance" message={loaded.error ?? "No seller balance is linked to this account."} />;
  const account = loaded.value;
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">My seller balance</h1>
        <p className="text-muted-foreground text-sm">{account.available_balance} {account.currency} available</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <Facts
            items={[
              { label: "Balance", value: account.balance },
              { label: "Reserved", value: account.reserved },
              { label: "Available", value: account.available_balance },
              { label: "Updated", value: showTime(account.updated_at) },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
