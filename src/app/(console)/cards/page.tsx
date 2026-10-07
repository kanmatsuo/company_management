import { Download } from "lucide-react";
import Link from "@/components/app-link";
import type { components } from "@/api/schema";
import { FilterChips } from "@/components/filter-chips";
import { FilterSelect } from "@/components/filter-select";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecordList } from "@/components/record-list";
import { can, getSession } from "@/lib/current-user";
import { t } from "@/lib/i18n";
import { listPath, one, show, showTime } from "@/lib/load-all";
import { loadRecords } from "@/lib/load-records";
import { getLocale } from "@/lib/locale";

type CardRow = components["schemas"]["RFIDCard"];

const STATUS: Record<string, string> = {
  ACTIVE: "Active",
  BLOCKED: "Blocked",
  RETIRED: "Retired",
};

export default async function CardsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; assigned?: string }>;
}) {
  const raw = await searchParams;
  const query = {
    status: STATUS[one(raw.status) ?? ""] ? one(raw.status) : undefined,
    assigned: ["true", "false"].includes(one(raw.assigned) ?? "") ? one(raw.assigned) : undefined,
  };
  const session = await getSession();
  const locale = await getLocale();
  const manage = session ? can(session.user, "card.register") : false;
  const excelOk = session ? can(session.user, "excel.export") : false;
  const data = await loadRecords<CardRow>("card.view", listPath("/api/v1/rfid/cards/?ordering=-created_at", query));
  if (data.denied) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No access</CardTitle>
          <CardDescription>Your account cannot open cards.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  const href = (next: Partial<typeof query>) => {
    const params = new URLSearchParams(
      Object.entries({ ...query, ...next }).filter((entry): entry is [string, string] => Boolean(entry[1])),
    ).toString();
    return params ? `/cards?${params}` : "/cards";
  };
  const excel = new URLSearchParams(Object.entries(query).filter((entry): entry is [string, string] => Boolean(entry[1]))).toString();

  return (
    <RecordList
      title="Cards"
      summary={`${data.count.toLocaleString()} ${t(locale, "cards")}`}
      description="RFID cards and who holds them. Download Excel saves the list as filtered here."
      error={data.error}
      empty={query.status || query.assigned ? "No cards match these filters." : "No cards yet."}
      headers={["UID", "Label", "Holder", "Status", "Reason", "Updated"]}
      extra={
        <div className="flex flex-wrap gap-2">
          {excelOk ? <Button asChild variant="outline">
            <a href={`/api/excel/cards${excel ? `?${excel}` : ""}`} download>
              <Download />
              {t(locale, "Download Excel")}
            </a>
          </Button> : null}
          {session && can(session.user, "card.assign") ? (
            <Button asChild variant="outline">
              <Link href="/cards/assign">{t(locale, "Assign card")}</Link>
            </Button>
          ) : null}
          {manage ? (
            <Button asChild>
              <Link href="/cards/new">{t(locale, "New card")}</Link>
            </Button>
          ) : null}
        </div>
      }
      filters={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterChips
            items={[
              { label: t(locale, "All"), href: href({ status: undefined }), active: !query.status },
              ...Object.entries(STATUS).map(([value, label]) => ({
                label: t(locale, label),
                href: href({ status: value }),
                active: query.status === value,
              })),
            ]}
          />
          <FilterSelect
            name="assigned"
            query={query}
            locale={locale}
            options={[
              { value: "", label: t(locale, "Any holder") },
              { value: "true", label: t(locale, "Held by someone") },
              { value: "false", label: t(locale, "Not held (spare)") },
            ]}
          />
        </div>
      }
      hrefs={data.results.map((card) => `/cards/${card.id}`)}
      rows={data.results.map((card) => [
        card.uid,
        show(card.label),
        show(card.current_assignment?.developer?.full_name),
        STATUS[card.status] ?? card.status,
        show(card.status_reason),
        showTime(card.updated_at),
      ])}
    />
  );
}
