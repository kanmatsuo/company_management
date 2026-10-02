import Link from "@/components/app-link";
import type { components } from "@/api/schema";
import { Button } from "@/components/ui/button";
import { RecordList } from "@/components/record-list";
import { canManage, getSession } from "@/lib/current-user";
import { show } from "@/lib/load-all";
import { loadList } from "@/lib/page-data";

type Seller = components["schemas"]["Seller"] & { user_email?: string | null };

export default async function SellersPage() {
  const session = await getSession();
  const manage = session ? canManage(session.user, ["seller"]) : false;
  const data = await loadList<Seller>("/api/v1/sellers/?ordering=name");
  return (
    <RecordList
      title="Sellers"
      summary={`${data.count.toLocaleString()} sellers`}
      description="Sellers are closed with a status change, not deleted."
      error={data.error}
      empty="No sellers yet."
      extra={manage ? <Button asChild><Link href="/sellers/new">New seller</Link></Button> : null}
      headers={["Name", "Store login", "Contact", "Email", "Phone", "Status"]}
      hrefs={data.results.map((seller) => `/sellers/${seller.id}`)}
      rows={data.results.map((seller) => [seller.name, show(seller.user_email), show(seller.contact_name), show(seller.email), show(seller.phone), show(seller.status)])}
    />
  );
}
