import type { components } from "@/api/schema";
import { RecordList } from "@/components/record-list";
import { listPath, one, show, showTime } from "@/lib/load-all";
import { loadList } from "@/lib/page-data";

type Booking = components["schemas"]["Booking"];

export default async function MyBookingsPage() {
  const data = await loadList<Booking>("/api/v1/bookings/me/");
  return (
    <RecordList
      title="My bookings"
      summary={`${data.count.toLocaleString()} bookings`}
      description="Bookings are final and cannot be refunded."
      error={data.error}
      empty="No bookings yet."
      headers={["When", "Until", "What", "Slots", "Total"]}
      rows={data.results.map((booking) => [
        showTime(booking.start),
        showTime(booking.end),
        booking.good_name,
        String(booking.slots),
        `${booking.total} ${booking.currency}`,
      ])}
    />
  );
}
