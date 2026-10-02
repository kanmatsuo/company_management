import { AutoText } from "@/components/auto-text";
import { redirect } from "next/navigation";
import { addPurchaseItem, cancelPurchase, deletePurchaseItem, updatePurchaseItem } from "@/app/(console)/mutations";
import { PurchaseReader } from "@/app/(console)/purchases/purchase-reader";
import type { components } from "@/api/schema";
import { Facts } from "@/components/facts";
import { FieldForm } from "@/components/field-form";
import { LoadError } from "@/components/no-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canManage, runsStore } from "@/lib/current-user";
import { getSocketBase } from "@/lib/socket-url";
import { show, showTime } from "@/lib/load-all";
import { loadOne } from "@/lib/page-data";
import { goodChoices } from "@/lib/choices";
import { Checkout } from "@/app/(console)/purchases/checkout";
import { getLocale } from "@/lib/locale";

type Purchase = components["schemas"]["Purchase"] & { kind?: string };

export default async function PurchasePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) redirect("/purchases");
  const loaded = await loadOne<Purchase>(`/api/v1/purchases/${id}/`);
  if (!loaded.value) return <LoadError title="Purchase" message={loaded.error ?? "Not found."} />;
  const purchase = loaded.value;
  const draft = purchase.status === "DRAFT";
  const booking = purchase.kind === "BOOKING";
  const manage = canManage(loaded.session.user, ["purchase", "seller"]) || await runsStore();
  const goods = draft && manage ? await goodChoices(loaded.session.token, purchase.service_position) : [];
  const presented = purchase.presented_card as {
    developer?: { id?: number; full_name?: string; employee_number?: string; department?: string } | null;
    presented_at?: string;
    expires_at?: string;
  } | null;
  const socketBase = await getSocketBase();
  const locale = await getLocale();
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight"><AutoText>{booking ? "Booking" : "Purchase"}</AutoText> {purchase.id}</h1>
        <p className="text-muted-foreground text-sm">
          {purchase.status} · {purchase.total} {purchase.currency}
          {!draft && purchase.developer?.full_name ? ` · ${purchase.developer.full_name}` : ""}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Facts
            items={[
              { label: "Seller", value: show(purchase.seller?.name) },
              { label: "Position", value: show(purchase.service_position_name) },
              { label: "Till reader", value: show(purchase.reader) },
              { label: "Card", value: draft ? "Shown after the card is scanned" : show(purchase.card_uid) },
              { label: "Developer", value: draft ? "Shown after the card is scanned" : show(purchase.developer?.full_name) },
              { label: "Balance after", value: draft ? "Shown after payment" : show(purchase.balance_after) },
              { label: "Created", value: showTime(purchase.created_at) },
              { label: "Confirmed", value: showTime(purchase.confirmed_at) },
              { label: "Cancelled", value: showTime(purchase.cancelled_at) },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {purchase.items.length === 0 ? <p className="text-muted-foreground text-sm"><AutoText>No items yet.</AutoText></p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Good</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Line</TableHead>
                  {draft && manage ? <TableHead /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchase.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.good_name}
                      {item.start ? ` · ${item.start.slice(11, 16)}–${item.end ? item.end.slice(11, 16) : ""}` : ""}
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unit_price}</TableCell>
                    <TableCell>{item.line_total}</TableCell>
                    {draft && manage && !booking ? (
                      <TableCell className="w-56">
                        <FieldForm
                          action={updatePurchaseItem.bind(null, purchase.id, item.id)}
                          submitLabel="Update qty"
                          fields={[{ name: "quantity", label: "Quantity", type: "number", defaultValue: String(item.quantity), required: true }]}
                        />
                        <div className="mt-2">
                          <FieldForm action={deletePurchaseItem.bind(null, purchase.id, item.id)} submitLabel="Remove" variant="outline" fields={[]} />
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {draft && manage && !booking ? (
            <FieldForm
              action={addPurchaseItem.bind(null, purchase.id)}
              submitLabel="Add item"
              fields={[
                { name: "good", label: "Good", type: "select", required: true, options: goods },
                { name: "quantity", label: "Quantity", type: "number" },
              ]}
            />
          ) : null}
        </CardContent>
      </Card>
      {draft && manage ? (
        <div className="grid gap-4">
          <PurchaseReader purchaseId={purchase.id} current={purchase.reader ?? null} />
          <Checkout
            purchaseId={purchase.id}
            positionId={purchase.service_position}
            socketBase={socketBase}
            items={purchase.items}
            total={purchase.total}
            currency={purchase.currency}
            presented={presented}
            simulator={process.env.TAP_SIMULATOR === "true"}
            verb={booking ? "book" : "buy"}
            locale={locale}
          />
          <Card>
            <CardHeader>
              <CardTitle>Cancel draft</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldForm action={cancelPurchase.bind(null, purchase.id)} submitLabel="Cancel purchase" variant="destructive" fields={[]} />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
