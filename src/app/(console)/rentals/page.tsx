import Link from "@/components/app-link";
import type { components } from "@/api/schema";
import { RecordList } from "@/components/record-list";
import { Button } from "@/components/ui/button";
import { can, getSession, runsStore } from "@/lib/current-user";
import { t } from "@/lib/i18n";
import { show } from "@/lib/load-all";
import { getLocale } from "@/lib/locale";
import { loadList } from "@/lib/page-data";

type Rental = components["schemas"]["Rental"];

export default async function RentalsPage() {
  const session = await getSession();
  const locale = await getLocale();
  const manage = session ? can(session.user, "court.manage") || await runsStore() : false;
  const data = await loadList<Rental>("/api/v1/rentals/?ordering=name");
  return (
    <RecordList
      title="Courts"
      summary={`${data.count.toLocaleString()} ${t(locale, "courts")}`}
      description="Courts are booked at the desk. The developer taps a card and enters a PIN."
      error={data.error}
      empty="No courts are bookable."
      extra={manage ? <Button asChild><Link href="/rentals/new">{t(locale, "New court")}</Link></Button> : null}
      headers={["Name", "Place", "Seller", "Price", "Slot"]}
      hrefs={data.results.map((rental) => `/rentals/${rental.id}`)}
      rows={data.results.map((rental) => [
        rental.name,
        show(rental.location),
        show(rental.seller?.name),
        `${rental.price} ${rental.currency}`,
        `${rental.rental.slot_minutes} ${t(locale, "min")}`,
      ])}
    />
  );
}
