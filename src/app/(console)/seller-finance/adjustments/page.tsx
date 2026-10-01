import { adjustSeller } from "@/app/(console)/mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldForm } from "@/components/field-form";
import { NoAccess } from "@/components/no-access";
import { canManage } from "@/lib/current-user";
import { requireSession } from "@/lib/page-data";
import { sellerChoices } from "@/lib/choices";

export default async function SellerAdjustmentPage() {
  const session = await requireSession();
  if (!canManage(session.user, ["seller", "finance"])) return <NoAccess description="Your account cannot adjust seller balances." />;
  const sellers = await sellerChoices(session.token);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Seller adjustment</h1>
        <p className="text-muted-foreground text-sm">A debit cannot use money already reserved by open payouts.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Correction</CardTitle>
          <CardDescription>Positive credits the seller. Negative debits them. A reason is required.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldForm
            action={adjustSeller}
            submitLabel="Post adjustment"
            fields={[
              { name: "seller", label: "Seller", type: "select", required: true, options: sellers },
              { name: "amount", label: "Amount", required: true, placeholder: "10.00 or -10.00" },
              { name: "reason", label: "Reason", required: true },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
