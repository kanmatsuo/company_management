import Link from "@/components/app-link";
import type { components } from "@/api/schema";
import { RecordList } from "@/components/record-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { listPath, one, show } from "@/lib/load-all";
import { loadList, loadOne } from "@/lib/page-data";

type Booking = components["schemas"]["Booking"] & {
  date?: string;
  start_time?: string;
  end_time?: string;
  change_count?: number;
};

type Period = { state: string; start_time: string; end_time: string };
type CourtDay = {
  good: number;
  name: string;
  price: string;
  open: boolean;
  opening_time: string;
  closing_time: string;
  slot_minutes: number;
  periods: Period[];
};
type Schedule = { date: string; courts: CourtDay[] };

function tone(state: string) {
  if (state === "FREE") return "border-emerald-600/40 bg-emerald-500/15";
  if (state === "BOOKED") return "border-border bg-muted text-muted-foreground";
  return "border-border text-muted-foreground opacity-60";
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const query = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(query.date ?? "") ? query.date! : today;
  const locale = await getLocale();
  const [schedule, data] = await Promise.all([
    loadOne<Schedule>(`/api/v1/rentals/schedule/?date=${date}`),
    loadList<Booking>(listPath("/api/v1/bookings/", { date: one(query.date) || date })),
  ]);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{t(locale, "Playground desk")}</h1>
        <p className="text-muted-foreground text-sm">{t(locale, "Free time is open. Booked time does not show who. A click starts a card-and-PIN checkout.")}</p>
      </div>
      <form className="flex items-end gap-2" method="get">
        <label className="grid gap-1 text-xs text-muted-foreground">
          {t(locale, "Date")}
          <Input name="date" type="date" defaultValue={date} />
        </label>
        <Button type="submit" variant="outline">{t(locale, "Show range")}</Button>
      </form>
      {schedule.error ? <p className="text-destructive text-sm">{schedule.error}</p> : null}
      {(schedule.value?.courts ?? []).map((court) => (
        <Card key={court.good}>
          <CardHeader>
            <CardTitle>{court.name}</CardTitle>
            <CardDescription>
              {court.price} · {court.slot_minutes} {t(locale, "min")}
              {court.open ? ` · ${court.opening_time.slice(0, 5)}–${court.closing_time.slice(0, 5)}` : ` · ${t(locale, "Closed this day")}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {court.periods.length === 0 ? <p className="text-muted-foreground text-sm">{t(locale, "No periods.")}</p> : null}
            {court.periods.map((period) => {
              const label = `${period.start_time.slice(0, 5)}–${period.end_time.slice(0, 5)} ${t(locale, period.state)}`;
              const className = `rounded-lg border px-3 py-2 text-sm ${tone(period.state)}`;
              return period.state === "FREE" ? (
                <Link key={`${court.good}-${period.start_time}`} href={`/rentals/${court.good}?date=${date}&start=${period.start_time.slice(0, 5)}`} className={className}>
                  {label}
                </Link>
              ) : (
                <span key={`${court.good}-${period.start_time}`} className={className}>{label}</span>
              );
            })}
          </CardContent>
        </Card>
      ))}
      <RecordList
        title="Bookings"
        summary={`${data.count.toLocaleString()} ${t(locale, "bookings")}`}
        description="Paid bookings for this day. A booking can be moved until it starts, at the same price."
        error={data.error}
        empty="No bookings for this day."
        headers={["Date", "Start", "End", "Rental", "Person", "Changes", "Total"]}
        hrefs={data.results.map((booking) => `/bookings/${booking.id}`)}
        rows={data.results.map((booking) => [
          booking.date || booking.start.slice(0, 10),
          booking.start_time || booking.start.slice(11, 16),
          booking.end_time || booking.end.slice(11, 16),
          booking.good_name,
          show(booking.developer?.full_name),
          String(booking.change_count ?? 0),
          `${booking.total} ${booking.currency}`,
        ])}
      />
    </div>
  );
}
