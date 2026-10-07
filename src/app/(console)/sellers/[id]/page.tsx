import { DeleteForGood } from "@/components/delete-for-good";
import { AutoText } from "@/components/auto-text";
import { redirect } from "next/navigation";
import { assignReader, assignReaderToSeller, updateSeller } from "@/app/(console)/mutations";
import type { components } from "@/api/schema";
import { Facts } from "@/components/facts";
import { FieldForm } from "@/components/field-form";
import { LoadError } from "@/components/no-access";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { can, canManage } from "@/lib/current-user";
import { show, showTime } from "@/lib/load-all";
import { loadOne } from "@/lib/page-data";
import { sellerUserChoices, unassignedTillReaderChoices } from "@/lib/choices";
import { djangoFetch } from "@/lib/django";

type Seller = components["schemas"]["Seller"] & { user_username?: string | null };

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
  const users = manage ? await sellerUserChoices(loaded.session.token) : [];
  const manageReaders = can(loaded.session.user, "rfid.device.manage");
  const readers = await djangoFetch<{ results: { id: number; code: string; name?: string; is_active?: boolean }[] }>(
    `/api/v1/rfid/devices/?purpose=TILL&seller=${seller.id}&ordering=code`,
    { accessToken: loaded.session.token },
  )
    .then((page) => page.results)
    .catch(() => []);
  const spare = manageReaders ? await unassignedTillReaderChoices(loaded.session.token) : [];
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{seller.name}</h1>
        <p className="text-muted-foreground text-sm">
          {seller.user_username ? (
            <>
              <AutoText>Store login</AutoText>: {seller.user_username}
            </>
          ) : (
            <AutoText>No store login yet</AutoText>
          )}
          {" · "}Updated {showTime(seller.updated_at)}
        </p>
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
                { name: "user", label: "Store login (SELLER role)", type: "select", options: [{ value: "", label: "No login" }, ...users], defaultValue: seller.user ? String(seller.user) : "" },
                { name: "status", label: "Status", type: "select", options: STATUS, defaultValue: seller.status ?? "ACTIVE" },
                { name: "notes", label: "Notes", type: "textarea", defaultValue: seller.notes ?? "" },
              ]}
            />
          ) : (
            <Facts
              items={[
                { label: "Store login", value: show(seller.user_username) },
                { label: "Email", value: show(seller.email) },
                { label: "Phone", value: show(seller.phone) },
                { label: "Status", value: show(seller.status) },
                { label: "Notes", value: show(seller.notes) },
              ]}
            />
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Till readers</CardTitle>
          <CardDescription>The card readers at this store&apos;s tills. Only this store&apos;s purchases use them.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {readers.length === 0 ? <p className="text-muted-foreground text-sm">No till reader assigned yet.</p> : null}
          {readers.map((reader) => (
            <div key={reader.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
              <a href={`/readers/${reader.id}`} className="font-medium underline-offset-4 hover:underline">
                {reader.code}
                {reader.name && reader.name !== reader.code ? <span className="text-muted-foreground"> · {reader.name}</span> : null}
              </a>
              {manageReaders ? (
                <FieldForm action={assignReader.bind(null, reader.id, `/sellers/${seller.id}`)} submitLabel="Unassign" variant="outline" fields={[]} />
              ) : null}
            </div>
          ))}
          {manageReaders ? (
            spare.length ? (
              <FieldForm
                action={assignReaderToSeller.bind(null, seller.id)}
                submitLabel="Assign"
                fields={[{ name: "reader", label: "Assign a till reader", type: "select", required: true, options: spare }]}
              />
            ) : (
              <p className="text-muted-foreground text-sm">
                Every till reader is assigned. Register a new one under Readers → New device.
              </p>
            )
          ) : null}
        </CardContent>
      </Card>
      {can(loaded.session.user, "system.delete_records") ? (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle>Delete for good</CardTitle>
            <CardDescription>Deletes the seller with its service positions, goods, stock history, purchases and bookings. Developers&apos; money stays as it is.</CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteForGood kind="seller" id={seller.id} redirectTo="/sellers" />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
