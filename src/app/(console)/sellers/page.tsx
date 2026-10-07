import Link from "@/components/app-link";
import type { components } from "@/api/schema";
import { Button } from "@/components/ui/button";
import { RecordList } from "@/components/record-list";
import { canManage, getSession } from "@/lib/current-user";
import { t } from "@/lib/i18n";
import { show } from "@/lib/load-all";
import { getLocale } from "@/lib/locale";
import { loadList } from "@/lib/page-data";

type Seller = components["schemas"]["Seller"] & { user_username?: string | null };

export default async function SellersPage() {
  const session = await getSession();
  const locale = await getLocale();
  const manage = session ? canManage(session.user, ["seller"]) : false;
  const data = await loadList<Seller>("/api/v1/sellers/?ordering=name");
  return (
    <RecordList
      title="Sellers"
      summary={`${data.count.toLocaleString()} ${t(locale, "sellers")}`}
      description="Sellers are closed with a status change, not deleted."
      error={data.error}
      empty="No sellers yet."
      extra={manage ? <Button asChild><Link href="/sellers/new">{t(locale, "New seller")}</Link></Button> : null}
      headers={["Name", "Store login", "Contact", "Phone", "Status"]}
      hrefs={data.results.map((seller) => `/sellers/${seller.id}`)}
      rows={data.results.map((seller) => [seller.name, show(seller.user_username), show(seller.contact_name), show(seller.phone), show(seller.status)])}
    />
  );
}
