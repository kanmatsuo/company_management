import { deposit } from "@/app/(console)/mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldForm } from "@/components/field-form";
import { NoAccess } from "@/components/no-access";
import { canManage } from "@/lib/current-user";
import { requireSession } from "@/lib/page-data";
import { developerChoices } from "@/lib/choices";

export default async function DepositPage() {
  const session = await requireSession();
  if (!canManage(session.user, ["finance"])) return <NoAccess description="Your account cannot post deposits." />;
  const developers = await developerChoices(session.token);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Deposit</h1>
        <p className="text-muted-foreground text-sm">Each submission carries its own idempotency key.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Add money</CardTitle>
          <CardDescription>Amount is a decimal, such as 25.00.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldForm
            action={deposit}
            submitLabel="Post deposit"
            fields={[
              { name: "developer", label: "Developer", type: "select", required: true, options: developers },
              { name: "amount", label: "Amount", required: true },
              { name: "description", label: "Description" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
