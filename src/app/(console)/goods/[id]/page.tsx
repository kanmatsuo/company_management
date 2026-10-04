import { AutoText } from "@/components/auto-text";
import { redirect } from "next/navigation";
import { changeStock, deleteGood, deleteImage, updateGood, uploadImage } from "@/app/(console)/mutations";
import type { components } from "@/api/schema";
import { FieldForm } from "@/components/field-form";
import { LoadError } from "@/components/no-access";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { canManage, runsStore } from "@/lib/current-user";
import { show } from "@/lib/load-all";
import { loadOne } from "@/lib/page-data";
import { positionChoices } from "@/lib/choices";

type Good = components["schemas"]["Good"];

export default async function GoodPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) redirect("/goods");
  const loaded = await loadOne<Good>(`/api/v1/goods/${id}/`);
  if (!loaded.value) return <LoadError title="Good" message={loaded.error ?? "Not found."} />;
  const good = loaded.value;
  const manage = canManage(loaded.session.user, ["goods", "good", "seller"]) || await runsStore();
  const positions = manage ? await positionChoices(loaded.session.token) : [];
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{good.name}</h1>
        <p className="text-muted-foreground text-sm">
          {good.price} {good.currency} · {show(good.seller?.name)} · {show(good.position_detail?.name)}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>{good.track_stock ? `${good.quantity} in stock` : "Stock is not tracked."}</CardDescription>
        </CardHeader>
        <CardContent>
          {manage ? (
            <FieldForm
              action={updateGood.bind(null, good.id)}
              submitLabel="Save"
              fields={[
                { name: "name", label: "Name", defaultValue: good.name, required: true },
                { name: "price", label: "Price", defaultValue: good.price, required: true },
                { name: "kind", label: "Kind", type: "select", options: [
                  { value: "PRODUCT", label: "Product" },
                  { value: "SERVICE", label: "Service" },
                  { value: "RENTAL", label: "Rental" },
                ], defaultValue: good.kind },
                { name: "service_position", label: "Service position", type: "select", options: positions, defaultValue: String(good.service_position) },
                { name: "description", label: "Description", type: "textarea", defaultValue: good.description ?? "" },
                { name: "slot_minutes", label: "Rental slot minutes", type: "number", defaultValue: good.rental?.slot_minutes ? String(good.rental.slot_minutes) : "", visibleWhen: { name: "kind", value: "RENTAL" } },
                { name: "opening_time", label: "Rental opens", defaultValue: good.rental?.opening_time ?? "", visibleWhen: { name: "kind", value: "RENTAL" } },
                { name: "closing_time", label: "Rental closes", defaultValue: good.rental?.closing_time ?? "", visibleWhen: { name: "kind", value: "RENTAL" } },
                { name: "max_slots_per_booking", label: "Max slots per booking", type: "number", defaultValue: good.rental?.max_slots_per_booking ? String(good.rental.max_slots_per_booking) : "", visibleWhen: { name: "kind", value: "RENTAL" } },
                { name: "max_slots_per_day", label: "Max slots per person per day", type: "number", defaultValue: good.rental?.max_slots_per_day ? String(good.rental.max_slots_per_day) : "", visibleWhen: { name: "kind", value: "RENTAL" } },
                { name: "max_days_ahead", label: "Max days ahead", type: "number", defaultValue: good.rental?.max_days_ahead ? String(good.rental.max_days_ahead) : "", visibleWhen: { name: "kind", value: "RENTAL" } },
                { name: "is_active", label: "Active", type: "checkbox", defaultValue: good.is_active ? "on" : "" },
                { name: "track_stock", label: "Track stock", type: "checkbox", defaultValue: good.track_stock ? "on" : "" },
              ]}
            />
          ) : (
            <p className="text-sm">{show(good.description)}</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {good.images.length === 0 ? <p className="text-muted-foreground text-sm"><AutoText>No images.</AutoText></p> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            {good.images.map((image) => (
              <div key={image.id} className="grid gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.image} alt={image.alt_text || good.name} className="h-40 w-full rounded-lg object-cover" />
                {manage ? (
                  <FieldForm action={deleteImage.bind(null, good.id, image.id)} submitLabel="Remove image" variant="outline" fields={[]} />
                ) : null}
              </div>
            ))}
          </div>
          {manage ? (
            <FieldForm
              action={uploadImage.bind(null, good.id)}
              submitLabel="Upload image"
              fields={[
                { name: "image", label: "Image", type: "file", required: true },
                { name: "alt_text", label: "Alt text" },
                { name: "position", label: "Position", type: "number" },
              ]}
            />
          ) : null}
        </CardContent>
      </Card>
      {manage ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Stock</CardTitle>
              <CardDescription>Restock adds quantity. Damage subtracts it. Adjustment sets the counted quantity.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldForm
                action={changeStock.bind(null, good.id)}
                submitLabel="Record stock change"
                fields={[
                  { name: "kind", label: "Kind", type: "select", required: true, options: [
                    { value: "RESTOCK", label: "Restock" },
                    { value: "DAMAGE", label: "Damage" },
                    { value: "ADJUSTMENT", label: "Counted adjustment" },
                  ] },
                  { name: "quantity", label: "Quantity", type: "number" },
                  { name: "counted_quantity", label: "Counted quantity", type: "number" },
                  { name: "reason", label: "Reason" },
                ]}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Remove</CardTitle>
              <CardDescription>Soft-deletes this good.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldForm action={deleteGood.bind(null, good.id)} submitLabel="Delete good" variant="destructive" fields={[]} />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
