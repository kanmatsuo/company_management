import type { components } from "@/api/schema";
import { RecordList } from "@/components/record-list";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listPath, one, show, showTime } from "@/lib/load-all";
import { loadList } from "@/lib/page-data";

type Booking = components["schemas"]["Booking"];

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const query = await searchParams;
  const data = await loadList<Booking>(listPath("/api/v1/bookings/", { date: one(query.date) }));
  return (
    <div className="flex flex-col gap-4">
      <form className="flex items-end gap-2" method="get">
        <label className="grid gap-1 text-xs text-muted-foreground">
          Date
          <Input name="date" type="date" defaultValue={query.date ?? ""} />
        </label>
        <Button type="submit" variant="outline">Filter</Button>
      </form>
      <RecordList
        title="Rental schedule"
        summary={`${data.count.toLocaleString()} bookings`}
        description="Who booked a rental. Sellers see their own; purchase.view sees all."
        error={data.error}
        empty="No bookings for this filter."
        headers={["Start", "End", "Rental", "Person", "Total"]}
        rows={data.results.map((booking) => [
          showTime(booking.start),
          showTime(booking.end),
          booking.good_name,
          show(booking.developer?.full_name),
          `${booking.total} ${booking.currency}`,
        ])}
      />
    </div>
  );
}
