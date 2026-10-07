import Link from "@/components/app-link";
import type { components } from "@/api/schema";
import { DayNav } from "@/app/(console)/bookings/day-nav";
import { DataTable } from "@/components/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
type Cell = { state: string; start: number; end: number };

const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const clock = (value: number) => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;

/** Each period split into the court's slots, so every free slot is its own link. */
function cells(court: CourtDay): Cell[] {
  return court.periods.flatMap((period) => {
    const out: Cell[] = [];
    for (let start = minutes(period.start_time); start < minutes(period.end_time); start += court.slot_minutes) {
      out.push({ state: period.state, start, end: Math.min(start + court.slot_minutes, minutes(period.end_time)) });
    }
    return out;
  });
}

function tone(state: string) {
  if (state === "FREE") return "border-primary/40 bg-primary/10 text-primary hover:border-primary hover:bg-primary hover:text-primary-foreground";
  if (state === "BOOKED") return "border-amber-500/50 bg-amber-500/20 text-amber-900 dark:text-amber-200";
  return "border-dashed border-border bg-muted/40 text-muted-foreground/60";
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

  const courts = schedule.value?.courts ?? [];
  const open = courts.filter((court) => court.open && court.periods.length > 0);
  const dayStart = open.length ? Math.min(...open.map((court) => minutes(court.opening_time))) : 8 * 60;
  const dayEnd = open.length ? Math.max(...open.map((court) => minutes(court.closing_time))) : 20 * 60;
  const span = Math.max(dayEnd - dayStart, 60);
  const at = (value: number) => `${((value - dayStart) / span) * 100}%`;
  const hours = Array.from({ length: Math.floor(span / 60) + 1 }, (_, i) => Math.ceil(dayStart / 60) * 60 + i * 60).filter((h) => h < dayEnd);
  const freeSlots = open.reduce((sum, court) => sum + cells(court).filter((cell) => cell.state === "FREE").length, 0);
  const bookedSlots = open.reduce((sum, court) => sum + cells(court).filter((cell) => cell.state === "BOOKED").length, 0);
  const takings = data.results.reduce((sum, booking) => sum + Number(booking.total), 0);
  const currency = data.results[0]?.currency ?? "";

  const stats = [
    { label: "Courts open", value: `${open.length} / ${courts.length}` },
    { label: "Bookings", value: data.count.toLocaleString() },
    { label: "Free slots", value: freeSlots.toLocaleString() },
    { label: "Booked slots", value: bookedSlots.toLocaleString() },
    { label: "Takings", value: `${takings.toFixed(2)} ${currency}`.trim() },
  ];

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">{t(locale, "Playground desk")}</h1>
          <p className="text-muted-foreground text-sm">{t(locale, "Click a free slot to book it. The developer pays with a card tap and PIN.")}</p>
        </div>
        <DayNav date={date} today={today} locale={locale} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label} className="gap-1 py-4">
            <CardContent className="px-4">
              <p className="text-muted-foreground text-xs">{t(locale, stat.label)}</p>
              <p className="font-semibold text-xl tabular-nums">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Courts</CardTitle>
          <CardDescription>Booked time does not show who booked it.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {schedule.error ? <p className="text-destructive text-sm">{schedule.error}</p> : null}
          {!schedule.error && courts.length === 0 ? <p className="text-muted-foreground text-sm">{t(locale, "No courts are bookable.")}</p> : null}
          {courts.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="grid min-w-[44rem] grid-cols-[11rem_minmax(0,1fr)] gap-x-4 gap-y-2">
                <div />
                <div className="relative h-5 text-muted-foreground text-xs">
                  {hours.map((hour) => (
                    <span key={hour} className="absolute pl-1 tabular-nums" style={{ left: at(hour) }}>
                      {clock(hour)}
                    </span>
                  ))}
                </div>
                {courts.map((court) => (
                  <div key={court.good} className="contents">
                    <Link href={`/rentals/${court.good}?date=${date}`} className="flex flex-col justify-center rounded-lg px-2 py-1 hover:bg-muted">
                      <span className="truncate font-medium text-sm">{court.name}</span>
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {court.price} / {court.slot_minutes} {t(locale, "min")}
                      </span>
                    </Link>
                    <div className="relative h-12 rounded-lg bg-muted/30">
                      {hours.map((hour) => (
                        <span key={hour} className="absolute inset-y-0 border-border/60 border-l" style={{ left: at(hour) }} />
                      ))}
                      {!court.open || court.periods.length === 0 ? (
                        <span className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">{t(locale, "Closed this day")}</span>
                      ) : (
                        cells(court).map((cell) => {
                          const style = { left: at(cell.start), width: `calc(${((cell.end - cell.start) / span) * 100}% - 4px)` };
                          const className = `absolute inset-y-1 ml-0.5 flex items-center justify-center overflow-hidden rounded-md border text-xs tabular-nums transition-colors ${tone(cell.state)}`;
                          const title = `${clock(cell.start)}–${clock(cell.end)} · ${t(locale, cell.state === "FREE" ? "Free" : cell.state === "BOOKED" ? "Booked" : "Past")}`;
                          return cell.state === "FREE" ? (
                            <Link key={cell.start} href={`/rentals/${court.good}?date=${date}&start=${clock(cell.start)}`} className={className} style={style} title={title}>
                              {clock(cell.start)}
                            </Link>
                          ) : (
                            <span key={cell.start} className={className} style={style} title={title}>
                              {cell.state === "BOOKED" ? t(locale, "Booked") : ""}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-4 text-muted-foreground text-xs">
            <Legend className={tone("FREE")} label={t(locale, "Free")} />
            <Legend className={tone("BOOKED")} label={t(locale, "Booked")} />
            <Legend className={tone("PAST")} label={t(locale, "Past")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bookings</CardTitle>
          <CardDescription>Paid bookings for this day. A booking can be moved until it starts, at the same price.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.error ? (
            <p className="text-destructive text-sm">{data.error}</p>
          ) : data.results.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t(locale, "No bookings for this day.")}</p>
          ) : (
            <DataTable
              locale={locale}
              headers={["Time", "Court", "Person", "Changes", "Total"]}
              hrefs={data.results.map((booking) => `/bookings/${booking.id}`)}
              rows={data.results.map((booking) => [
                `${booking.start_time || booking.start.slice(11, 16)} – ${booking.end_time || booking.end.slice(11, 16)}`,
                booking.good_name,
                show(booking.developer?.full_name),
                String(booking.change_count ?? 0),
                `${booking.total} ${booking.currency}`,
              ])}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-3 rounded-sm border ${className}`} />
      {label}
    </span>
  );
}
