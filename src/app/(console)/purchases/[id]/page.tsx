import { AutoText } from "@/components/auto-text";
import { redirect } from "next/navigation";
import { cancelPurchase } from "@/app/(console)/mutations";
import { PurchaseReader } from "@/app/(console)/purchases/purchase-reader";
import { Basket } from "@/app/(console)/purchases/[id]/basket";
import { GoodsGrid } from "@/app/(console)/purchases/[id]/goods-grid";
import type { components } from "@/api/schema";
import { FieldForm } from "@/components/field-form";
import { LoadError } from "@/components/no-access";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { canManage, runsStore } from "@/lib/current-user";
import { getSocketBase } from "@/lib/socket-url";
import { show, showTime } from "@/lib/load-all";
import { loadOne } from "@/lib/page-data";
import { tillGoods } from "@/lib/choices";
import { Checkout } from "@/app/(console)/purchases/checkout";
import { getLocale } from "@/lib/locale";

type Purchase = components["schemas"]["Purchase"] & { kind?: string };

const STATUS_STYLE: Record<string, "secondary" | "outline" | "destructive"> = {
  DRAFT: "outline",
  CONFIRMED: "secondary",
  CANCELLED: "destructive",
};

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-0.5">
      <span className="text-muted-foreground text-xs">
        <AutoText>{label}</AutoText>
      </span>
      <span className="truncate font-medium text-sm">{value}</span>
    </div>
  );
}

export default async function PurchasePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) redirect("/purchases");
  const loaded = await loadOne<Purchase>(`/api/v1/purchases/${id}/`);
  if (!loaded.value) return <LoadError title="Purchase" message={loaded.error ?? "Not found."} />;
  const purchase = loaded.value;
  const draft = purchase.status === "DRAFT";
  const booking = purchase.kind === "BOOKING";
  const manage = canManage(loaded.session.user, ["purchase", "seller"]) || (await runsStore());
  const selling = draft && manage && !booking;
  const goods = selling ? await tillGoods(loaded.session.token, purchase.service_position) : [];
  const prices = Object.fromEntries(goods.map((good) => [good.id, good.price]));
  const inBasket = Object.fromEntries(purchase.items.map((item) => [(item as { good?: number }).good ?? 0, item.quantity]));
  const presented = purchase.presented_card as {
    developer?: { id?: number; full_name?: string; employee_number?: string; department?: string } | null;
    presented_at?: string;
    expires_at?: string;
  } | null;
  const socketBase = await getSocketBase();
  const locale = await getLocale();
  const status = String(purchase.status);

  const facts = (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
      <Fact label="Seller" value={show(purchase.seller?.name)} />
      <Fact label="Counter" value={show(purchase.service_position_name)} />
      <Fact label="Till reader" value={show(purchase.reader)} />
      <Fact label="Created" value={showTime(purchase.created_at)} />
      {!draft ? (
        <>
          <Fact label="Developer" value={show(purchase.developer?.full_name)} />
          <Fact label="Card" value={show(purchase.card_uid)} />
          <Fact label="Balance after" value={show(purchase.balance_after)} />
          <Fact label={status === "CANCELLED" ? "Cancelled" : "Confirmed"} value={showTime(status === "CANCELLED" ? purchase.cancelled_at : purchase.confirmed_at)} />
        </>
      ) : null}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">
            <AutoText>{booking ? "Booking" : "Purchase"}</AutoText> {purchase.id}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
            <Badge variant={STATUS_STYLE[status] ?? "outline"}>
              <AutoText>{status}</AutoText>
            </Badge>
            {purchase.seller?.name ? <span>{purchase.seller.name}</span> : null}
            {!draft && purchase.developer?.full_name ? <span>· {purchase.developer.full_name}</span> : null}
          </div>
        </div>
        <div className="text-right">
          <span className="text-muted-foreground text-xs">
            <AutoText>Total</AutoText>
          </span>
          <p className="font-semibold text-3xl tabular-nums tracking-tight">
            {Number(purchase.total ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
            <span className="font-normal text-base text-muted-foreground">{purchase.currency}</span>
          </p>
        </div>
      </div>

      <Card size="sm">
        <CardContent>{facts}</CardContent>
      </Card>

      {selling ? (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <Card>
            <CardHeader>
              <CardTitle>Goods</CardTitle>
              <CardDescription>Click a good to add one. Click again for more.</CardDescription>
            </CardHeader>
            <CardContent>
              <GoodsGrid purchaseId={purchase.id} goods={goods} inBasket={inBasket} />
            </CardContent>
          </Card>
          <div className="grid gap-4 lg:sticky lg:top-16">
            <Card>
              <CardHeader>
                <CardTitle>Items</CardTitle>
                <CardDescription>Prices are fixed when the card is scanned.</CardDescription>
              </CardHeader>
              <CardContent>
                <Basket purchaseId={purchase.id} items={purchase.items} total={purchase.total} currency={purchase.currency} editable prices={prices} />
              </CardContent>
            </Card>
            <PurchaseReader purchaseId={purchase.id} positionId={purchase.service_position} current={purchase.reader ?? null} />
            <Checkout
              purchaseId={purchase.id}
              positionId={purchase.service_position}
              socketBase={socketBase}
              items={purchase.items}
              total={purchase.total}
              currency={purchase.currency}
              presented={presented}
              waitingForCard={Boolean((purchase as { waiting_for_card?: boolean }).waiting_for_card)}
              simulator={process.env.TAP_SIMULATOR === "true"}
              verb="buy"
              locale={locale}
            />
            <Card size="sm">
              <CardContent className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground text-sm">
                  <AutoText>Not buying after all?</AutoText>
                </span>
                <FieldForm action={cancelPurchase.bind(null, purchase.id)} submitLabel="Cancel purchase" variant="destructive" fields={[]} />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,40rem)]">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Basket purchaseId={purchase.id} items={purchase.items} total={purchase.total} currency={purchase.currency} editable={false} />
            </CardContent>
          </Card>
          {draft && manage ? (
            <div className="grid gap-4">
              <Checkout
                purchaseId={purchase.id}
                positionId={purchase.service_position}
                socketBase={socketBase}
                items={purchase.items}
                total={purchase.total}
                currency={purchase.currency}
                presented={presented}
                waitingForCard={Boolean((purchase as { waiting_for_card?: boolean }).waiting_for_card)}
                simulator={process.env.TAP_SIMULATOR === "true"}
                verb={booking ? "book" : "buy"}
                locale={locale}
              />
              <FieldForm action={cancelPurchase.bind(null, purchase.id)} submitLabel="Cancel purchase" variant="destructive" fields={[]} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
