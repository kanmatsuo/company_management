import { redirect } from "next/navigation";
import { updateSeller } from "@/app/(console)/mutations";
import type { components } from "@/api/schema";
import { Facts } from "@/components/facts";
import { FieldForm } from "@/components/field-form";
import { LoadError } from "@/components/no-access";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { canManage } from "@/lib/current-user";
import { show, showTime } from "@/lib/load-all";
import { loadOne } from "@/lib/page-data";
import { userChoices } from "@/lib/choices";

type Seller = components["schemas"]["Seller"];

const STATUS = [
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "CLOSED", label: "Closed" },
];

export default async function SellerPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) redirect("/sellers");
  const loaded = await loadOne<Seller>(`/api/v1/sellers/${id}/`);
  if (!loaded.value) return <LoadError title="Seller" message={loaded.error ?? "Not found."} />;
  const seller = loaded.value;
  const manage = canManage(loaded.session.user, ["seller"]);
  const users = manage ? await userChoices(loaded.session.token) : [];
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{seller.name}</h1>
        <p className="text-muted-foreground text-sm">Updated {showTime(seller.updated_at)}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Set status to Closed when the seller stops trading.</CardDescription>
        </CardHeader>
        <CardContent>
          {manage ? (
            <FieldForm
              action={updateSeller.bind(null, seller.id)}
              submitLabel="Save"
              fields={[
                { name: "name", label: "Name", defaultValue: seller.name, required: true },
                { name: "contact_name", label: "Contact name", defaultValue: seller.contact_name ?? "" },
                { name: "email", label: "Email", type: "email", defaultValue: seller.email ?? "" },
                { name: "phone", label: "Phone", defaultValue: seller.phone ?? "" },
                { name: "user", label: "Linked user", type: "select", options: users, defaultValue: seller.user ? String(seller.user) : "" },
                { name: "status", label: "Status", type: "select", options: STATUS, defaultValue: seller.status ?? "ACTIVE" },
                { name: "notes", label: "Notes", type: "textarea", defaultValue: seller.notes ?? "" },
              ]}
            />
          ) : (
            <Facts
              items={[
                { label: "Contact", value: show(seller.contact_name) },
                { label: "Email", value: show(seller.email) },
                { label: "Phone", value: show(seller.phone) },
                { label: "Status", value: show(seller.status) },
                { label: "Notes", value: show(seller.notes) },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
