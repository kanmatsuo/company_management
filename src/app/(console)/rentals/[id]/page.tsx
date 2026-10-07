import { redirect } from "next/navigation";
import { BookCourt } from "@/app/(console)/rentals/book-court";
import type { components } from "@/api/schema";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";
import { LoadError } from "@/components/no-access";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadList, loadOne } from "@/lib/page-data";
import { getLocale } from "@/lib/locale";
import Link from "@/components/app-link";
import { can, runsStore } from "@/lib/current-user";

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
  const manage = can(loaded.session.user, "court.manage") || (await runsStore());
  const slots = await loadList<Slot>(`/api/v1/rentals/${id}/availability/?date=${date}`);

  const last = new Date(`${today}T00:00:00Z`);
  last.setUTCDate(last.getUTCDate() + (rental.rental.max_days_ahead ?? 30));
  const lastDay = last.toISOString().slice(0, 10);
  const time = (value?: string | null) => (value ? value.slice(0, 5) : "—");

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">{rental.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
            <Badge variant="secondary" className="tabular-nums">{rental.price} {rental.currency} / {rental.rental.slot_minutes} min</Badge>
            <span>{time(rental.rental.opening_time)} – {time(rental.rental.closing_time)}</span>
            {rental.location ? <span>· {rental.location}</span> : null}
            {rental.seller?.name ? <span>· {rental.seller.name}</span> : null}
          </div>
        </div>
        {manage ? (
          <Button asChild variant="outline">
            <Link href={`/goods/${rental.id}`}>Edit court</Link>
          </Button>
        ) : null}
      </div>
      <BookCourt
        key={date}
        goodId={rental.id}
        court={rental.name}
        price={rental.price}
        currency={rental.currency}
        date={date}
        today={today}
        lastDay={lastDay}
        maxPerBooking={rental.rental.max_slots_per_booking ?? 1}
        slots={slots.results}
        error={slots.error}
        initialStart={query.start ?? ""}
        locale={locale}
      >
        <Card>
          <CardHeader>
            <CardTitle>Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-2 text-sm">
              {[
                ["Open", `${time(rental.rental.opening_time)} – ${time(rental.rental.closing_time)}`],
                ["Slot", `${rental.rental.slot_minutes} min`],
                ["Max slots per booking", String(rental.rental.max_slots_per_booking ?? "—")],
                ["Max slots per person per day", String(rental.rental.max_slots_per_day ?? "—")],
                ["Book ahead", rental.rental.max_days_ahead ? `${rental.rental.max_days_ahead} ${t(locale, "days")}` : "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{t(locale, label)}</dt>
                  <dd className="font-medium tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </BookCourt>
    </div>
  );
}
