import { redirect } from "next/navigation";
import { addPurchaseItem, cancelPurchase, confirmPurchase, deletePurchaseItem, updatePurchaseItem } from "@/app/(console)/mutations";
import type { components } from "@/api/schema";
import { Facts } from "@/components/facts";
import { FieldForm } from "@/components/field-form";
import { LoadError } from "@/components/no-access";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canManage } from "@/lib/current-user";
import { show, showTime } from "@/lib/load-all";
import { loadOne } from "@/lib/page-data";
import { goodChoices } from "@/lib/choices";
import { RefreshDraft } from "@/app/(console)/purchases/refresh-draft";

type Purchase = components["schemas"]["Purchase"];

export default async function PurchasePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) redirect("/purchases");
  const loaded = await loadOne<Purchase>(`/api/v1/purchases/${id}/`);
  if (!loaded.value) return <LoadError title="Purchase" message={loaded.error ?? "Not found."} />;
  const purchase = loaded.value;
  const draft = purchase.status === "DRAFT";
  const manage = canManage(loaded.session.user, ["purchase", "seller"]);
  const goods = draft && manage ? await goodChoices(loaded.session.token, purchase.service_position) : [];
  const presented = purchase.presented_card;
  const tappedName = presented && typeof presented.developer === "object" && presented.developer && "full_name" in presented.developer
    ? String(presented.developer.full_name)
    : null;
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Purchase {purchase.id}</h1>
        <p className="text-muted-foreground text-sm">
          {purchase.status} · {purchase.total} {purchase.currency}
          {tappedName ? ` · ${tappedName} tapped in` : ""}
        </p>
      </div>
      {draft ? <RefreshDraft /> : null}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Facts
            items={[
              { label: "Seller", value: show(purchase.seller?.name) },
              { label: "Position", value: show(purchase.service_position_name) },
              { label: "Card", value: show(purchase.card_uid) },
              { label: "Balance after", value: show(purchase.balance_after) },
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
          {purchase.items.length === 0 ? <p className="text-muted-foreground text-sm">No items yet.</p> : (
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
                    <TableCell>{item.good_name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unit_price}</TableCell>
                    <TableCell>{item.line_total}</TableCell>
                    {draft && manage ? (
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
          {draft && manage ? (
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
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Confirm</CardTitle>
              <CardDescription>The developer taps their card on the till reader. This page does not send a card number. Type the PIN they give you.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldForm
                action={confirmPurchase.bind(null, purchase.id)}
                submitLabel="Confirm and charge"
                fields={[{ name: "pin", label: "PIN", type: "password", required: true }]}
              />
            </CardContent>
          </Card>
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
