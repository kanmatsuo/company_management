import Link from "@/components/app-link";
import type { components } from "@/api/schema";
import { Button } from "@/components/ui/button";
import { RecordList } from "@/components/record-list";
import { canManage, getSession, ownsStore } from "@/lib/current-user";
import { show } from "@/lib/load-all";
import { loadList } from "@/lib/page-data";

type Position = components["schemas"]["ServicePosition"];

export default async function PositionsPage() {
  const session = await getSession();
  const manage = session ? canManage(session.user, ["service", "position", "seller"]) || await ownsStore(session.user.id) : false;
  const data = await loadList<Position>("/api/v1/service-positions/?ordering=name");
  return (
    <RecordList
      title="Service positions"
      summary={`${data.count.toLocaleString()} positions`}
      description="A till or counter where goods are sold. Delete is a soft delete."
      error={data.error}
      empty="No positions yet."
      extra={manage ? <Button asChild><Link href="/positions/new">New position</Link></Button> : null}
      headers={["Name", "Seller", "Location", "Active"]}
      hrefs={data.results.map((row) => `/positions/${row.id}`)}
      rows={data.results.map((row) => [row.name, show(row.seller_detail?.name), show(row.location), row.is_active ? "Yes" : "No"])}
    />
  );
}
