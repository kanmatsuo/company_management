import { Title, Hint } from "@/components/auto-text";
import { createSeller } from "@/app/(console)/mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldForm } from "@/components/field-form";
import { NoAccess } from "@/components/no-access";
import { canManage } from "@/lib/current-user";
import { requireSession } from "@/lib/page-data";
import { sellerUserChoices } from "@/lib/choices";

const STATUS = [
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "CLOSED", label: "Closed" },
];

export default async function NewSellerPage() {
  const session = await requireSession();
  if (!canManage(session.user, ["seller"])) return <NoAccess description="Your account cannot create sellers." />;
  const users = await sellerUserChoices(session.token);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <Title>New seller</Title>
        <Hint>Close a seller later by setting status to Closed.</Hint>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Seller</CardTitle>
          <CardDescription>Name is required.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldForm
            action={createSeller}
            submitLabel="Create seller"
            fields={[
              { name: "name", label: "Name", required: true },
              { name: "contact_name", label: "Contact name" },
              { name: "email", label: "Email", type: "email" },
              { name: "phone", label: "Phone" },
              { name: "user", label: "Store login (SELLER role)", type: "select", options: [{ value: "", label: "No login" }, ...users] },
              { name: "status", label: "Status", type: "select", options: STATUS, defaultValue: "ACTIVE" },
              { name: "notes", label: "Notes", type: "textarea" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
