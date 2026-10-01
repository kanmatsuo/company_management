import { adjustBalance } from "@/app/(console)/mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldForm } from "@/components/field-form";
import { NoAccess } from "@/components/no-access";
import { canManage } from "@/lib/current-user";
import { requireSession } from "@/lib/page-data";
import { developerChoices } from "@/lib/choices";

export default async function AdjustmentPage() {
  const session = await requireSession();
  if (!canManage(session.user, ["finance"])) return <NoAccess description="Your account cannot adjust balances." />;
  const developers = await developerChoices(session.token);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Adjustment</h1>
        <p className="text-muted-foreground text-sm">Positive amounts credit the wallet. Negative amounts debit it.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Correct a balance</CardTitle>
          <CardDescription>A reason is required.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldForm
            action={adjustBalance}
            submitLabel="Post adjustment"
            fields={[
              { name: "developer", label: "Developer", type: "select", required: true, options: developers },
              { name: "amount", label: "Amount", required: true, placeholder: "10.00 or -10.00" },
              { name: "reason", label: "Reason", required: true },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
