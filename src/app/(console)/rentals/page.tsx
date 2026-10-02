import Link from "@/components/app-link";
import type { components } from "@/api/schema";
import { RecordList } from "@/components/record-list";
import { show } from "@/lib/load-all";
import { loadList } from "@/lib/page-data";

type Rental = components["schemas"]["Rental"];

export default async function RentalsPage() {
  const data = await loadList<Rental>("/api/v1/rentals/?ordering=name");
  return (
    <RecordList
      title="Rentals"
      summary={`${data.count.toLocaleString()} rentals`}
      description="Courts are booked at the desk. The developer taps a card and enters a PIN."
      error={data.error}
      empty="No rentals are bookable."
      headers={["Name", "Place", "Seller", "Price", "Slot"]}
      hrefs={data.results.map((rental) => `/rentals/${rental.id}`)}
      rows={data.results.map((rental) => [
        rental.name,
        show(rental.location),
        show(rental.seller?.name),
        `${rental.price} ${rental.currency}`,
        `${rental.rental.slot_minutes} min`,
      ])}
    />
  );
}
