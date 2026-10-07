import Link from "@/components/app-link";
import type { components } from "@/api/schema";
import { Button } from "@/components/ui/button";
import { RecordList } from "@/components/record-list";
import { can, getSession, ownsStore } from "@/lib/current-user";
import { t } from "@/lib/i18n";
import { show } from "@/lib/load-all";
import { getLocale } from "@/lib/locale";
import { loadList } from "@/lib/page-data";

// building_name and manager_username are served by the API but missing from the generated types.
type Position = components["schemas"]["ServicePosition"] & { building_name?: string | null; manager_username?: string | null };

export default async function PositionsPage() {
  const session = await getSession();
  const locale = await getLocale();
  const manage = session ? can(session.user, "counter.manage") || await ownsStore(session.user.id) : false;
  const data = await loadList<Position>("/api/v1/service-positions/?ordering=name");
  return (
    <RecordList
      title="Counters"
      summary={`${data.count.toLocaleString()} ${t(locale, "counters")}`}
      description="Where each store sells. Every good belongs to one counter. Open a store to see only its counters."
      error={data.error}
      empty="No counters yet."
      extra={manage ? <Button asChild><Link href="/positions/new">{t(locale, "New counter")}</Link></Button> : null}
      headers={["Counter", "Store", "Building", "Location", "Manager", "Active"]}
      hrefs={data.results.map((row) => `/positions/${row.id}`)}
      rows={data.results.map((row) => [row.name, show(row.seller_detail?.name), show(row.building_name), show(row.location), show(row.manager_username), row.is_active ? "Yes" : "No"])}
    />
  );
}
