import { DeleteForGood } from "@/components/delete-for-good";
import { AutoText } from "@/components/auto-text";
import { redirect } from "next/navigation";
import { assignReader, assignReaderToSeller, updateSeller } from "@/app/(console)/mutations";
import type { components } from "@/api/schema";
import { Facts } from "@/components/facts";
import { FieldForm } from "@/components/field-form";
import { LoadError } from "@/components/no-access";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { can, canManage, runsStore } from "@/lib/current-user";
import Link from "@/components/app-link";
import { Plus, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { show, showTime } from "@/lib/load-all";
import { loadOne } from "@/lib/page-data";
import { sellerUserChoices, unassignedTillReaderChoices } from "@/lib/choices";
import { djangoFetch } from "@/lib/django";

type Seller = components["schemas"]["Seller"] & { user_username?: string | null };
type Counter = {
  id: number;
  name: string;
  location?: string;
  building_name?: string | null;
  manager_username?: string | null;
  is_active: boolean;
};

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
  const manageReaders = can(loaded.session.user, "reader.manage");
  const readers = await djangoFetch<{ results: { id: number; code: string; name?: string; is_active?: boolean }[] }>(
    `/api/v1/rfid/devices/?purpose=TILL&seller=${seller.id}&ordering=code`,
    { accessToken: loaded.session.token },
  )
    .then((page) => page.results)
    .catch(() => []);
  const spare = manageReaders ? await unassignedTillReaderChoices(loaded.session.token) : [];
  const [counters, goods] = await Promise.all([
    djangoFetch<{ results: Counter[] }>(`/api/v1/service-positions/?seller=${seller.id}&ordering=name&page_size=200`, {
      accessToken: loaded.session.token,
    })
      .then((page) => page.results)
      .catch(() => [] as Counter[]),
    djangoFetch<{ results: { service_position: number }[] }>(`/api/v1/goods/?seller=${seller.id}&page_size=1000`, {
      accessToken: loaded.session.token,
    })
      .then((page) => page.results)
      .catch(() => [] as { service_position: number }[]),
  ]);
  const goodsAt = (counter: number) => goods.filter((good) => good.service_position === counter).length;
  const addCounters = can(loaded.session.user, "counter.manage") || (await runsStore());
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
                { label: "Phone", value: show(seller.phone) },
                { label: "Status", value: show(seller.status) },
                { label: "Notes", value: show(seller.notes) },
              ]}
            />
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1.5">
            <CardTitle>Counters</CardTitle>
            <CardDescription>Where this store sells. Each good belongs to one counter; a counter has a building and can have its own manager.</CardDescription>
          </div>
          {addCounters ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`/positions/new?seller=${seller.id}`}>
                <Plus />
                <AutoText>Add counter</AutoText>
              </Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {counters.length === 0 ? (
            <p className="text-muted-foreground text-sm"><AutoText>No counters yet. Goods need a counter.</AutoText></p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {counters.map((counter) => (
                <li key={counter.id}>
                  <Link href={`/positions/${counter.id}`} className="flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:border-primary/50 hover:bg-muted/40">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Store className="size-4" />
                    </span>
                    <span className="grid min-w-0 flex-1 gap-0.5">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-medium">{counter.name}</span>
                        {counter.is_active ? null : <Badge variant="outline"><AutoText>Inactive</AutoText></Badge>}
                      </span>
                      <span className="truncate text-muted-foreground text-xs">
                        {[counter.building_name, counter.location].filter(Boolean).join(" · ") || "—"}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {goodsAt(counter.id)} <AutoText>goods</AutoText>
                        {counter.manager_username ? <> · <AutoText>Manager</AutoText>: {counter.manager_username}</> : null}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Till readers</CardTitle>
          <CardDescription>The card readers at this store&apos;s tills. Only this store&apos;s purchases use them.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {readers.length === 0 ? <p className="text-muted-foreground text-sm"><AutoText>No till reader assigned yet.</AutoText></p> : null}
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
                <AutoText>Every till reader is assigned. Register a new one under Readers → New device.</AutoText>
              </p>
            )
          ) : null}
        </CardContent>
      </Card>
      {can(loaded.session.user, "system.delete_records") ? (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle>Delete for good</CardTitle>
            <CardDescription>Deletes the seller with its counters, goods, stock history, purchases and bookings. Developers&apos; money stays as it is.</CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteForGood kind="seller" id={seller.id} redirectTo="/sellers" />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
