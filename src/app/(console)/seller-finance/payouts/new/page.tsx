import { Title, Hint } from "@/components/auto-text";
import { requestPayout } from "@/app/(console)/mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldForm } from "@/components/field-form";
import { sellerChoices } from "@/lib/choices";
import { requireSession } from "@/lib/page-data";

export default async function NewPayoutPage() {
  const session = await requireSession();
  const sellers = await sellerChoices(session.token);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <Title>Request payout</Title>
        <Hint>The amount cannot exceed the available balance. Leave the seller empty to use your own seller.</Hint>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Payout</CardTitle>
          <CardDescription>You cannot approve a payout you requested.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldForm
            action={requestPayout}
            submitLabel="Request"
            fields={[
              { name: "seller", label: "Seller", type: "select", options: sellers },
              { name: "amount", label: "Amount", required: true },
              { name: "note", label: "Note" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
