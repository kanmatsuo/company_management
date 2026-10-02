import { redirect } from "next/navigation";
import { detectedReaders } from "@/app/(console)/mutations";
import { BookCourt } from "@/app/(console)/rentals/book-court";
import type { components } from "@/api/schema";
import { Facts } from "@/components/facts";
import { LoadError } from "@/components/no-access";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { show } from "@/lib/load-all";
import { loadList, loadOne } from "@/lib/page-data";
import { getLocale } from "@/lib/locale";

type Rental = components["schemas"]["Rental"];
type Slot = components["schemas"]["Slot"] & { start_time?: string; end_time?: string; state?: string };

export default async function RentalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string; start?: string }>;
}) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) redirect("/rentals");
  const query = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const date = query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date) ? query.date : today;
  const loaded = await loadOne<Rental>(`/api/v1/rentals/${id}/`);
  if (!loaded.value) return <LoadError title="Rental" message={loaded.error ?? "Not found."} />;
  const rental = loaded.value;
  const locale = await getLocale();
  const [slots, detected] = await Promise.all([
    loadList<Slot>(`/api/v1/rentals/${id}/availability/?date=${date}`),
    detectedReaders(),
  ]);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{rental.name}</h1>
        <p className="text-muted-foreground text-sm">{rental.price} {rental.currency} per {rental.rental.slot_minutes} minutes · {show(rental.location)}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <Facts
            items={[
              { label: "Opens", value: rental.rental.opening_time },
              { label: "Closes", value: rental.rental.closing_time },
              { label: "Max slots per booking", value: String(rental.rental.max_slots_per_booking ?? "—") },
              { label: "Max slots per day", value: String(rental.rental.max_slots_per_day ?? "—") },
              { label: "Book ahead", value: rental.rental.max_days_ahead ? `${rental.rental.max_days_ahead} days` : "—" },
              { label: "Seller", value: show(rental.seller?.name) },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Day</CardTitle>
          <CardDescription>Pick a free stretch on the slot grid. The developer taps their card on the desk reader, then enters their PIN.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form className="flex items-end gap-2" method="get">
            <label className="grid gap-1 text-xs text-muted-foreground">
              Date
              <Input name="date" type="date" defaultValue={date} />
            </label>
            <Button type="submit" variant="outline">Show slots</Button>
          </form>
          {slots.error ? <p className="text-destructive text-sm">{slots.error}</p> : null}
          <BookCourt
            goodId={rental.id}
            court={rental.name}
            price={rental.price}
            currency={rental.currency}
            date={date}
            maxPerBooking={rental.rental.max_slots_per_booking ?? 1}
            slots={slots.results}
            reader={detected.reader}
            initialStart={query.start ?? ""}
            locale={locale}
          />
        </CardContent>
      </Card>
    </div>
  );
}
