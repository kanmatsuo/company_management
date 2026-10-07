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

// seller_name and building_name are served by the API but missing from the generated types.
type Device = components["schemas"]["RFIDDevice"] & { seller_name?: string | null; building_name?: string | null };

const KINDS: Record<string, string> = {
  ATTENDANCE: "Doors",
  TILL: "Till readers",
  ENROLL: "Card assign readers",
};
const KIND_LABEL: Record<string, string> = { ATTENDANCE: "Door", TILL: "Till reader", ENROLL: "Card assign" };

export default async function ReadersPage({
  searchParams,
}: {
  searchParams: Promise<{ is_active?: string; online?: string; purpose?: string }>;
}) {
  const raw = await searchParams;
  const flag = (value: string | undefined) => (value === "true" || value === "false" ? value : undefined);
  const query = {
    purpose: KINDS[one(raw.purpose) ?? ""] ? one(raw.purpose) : undefined,
    online: flag(one(raw.online)),
    is_active: flag(one(raw.is_active)),
  };
  const session = await getSession();
  const locale = await getLocale();
  const manage = session ? can(session.user, "reader.manage") : false;
  const excelOk = session ? can(session.user, "excel.export") : false;
  const data = await loadRecords<Device>("reader.view", listPath("/api/v1/rfid/devices/?ordering=code", query));
  if (data.denied) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No access</CardTitle>
          <CardDescription>Your account cannot open readers.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  const href = (next: Partial<typeof query>) => {
    const params = new URLSearchParams(
      Object.entries({ ...query, ...next }).filter((entry): entry is [string, string] => Boolean(entry[1])),
    ).toString();
    return params ? `/readers?${params}` : "/readers";
  };
  const excel = new URLSearchParams(Object.entries(query).filter((entry): entry is [string, string] => Boolean(entry[1]))).toString();
  const filtered = Boolean(query.purpose || query.online || query.is_active);

  return (
    <RecordList
      title="Readers"
      summary={`${data.count.toLocaleString()} ${t(locale, "readers")}`}
      description="Door units, till readers and card assign readers. Online means the device sent a tap in the last two minutes."
      error={data.error}
      empty={filtered ? "No readers match these filters." : "No devices yet."}
      headers={["Code", "Name", "Status", "Kind", "Place", "Seller", "Door IP", "Active", "Last seen"]}
      extra={
        <div className="flex flex-wrap gap-2">
          {excelOk ? <Button asChild variant="outline">
            <a href={`/api/excel/readers${excel ? `?${excel}` : ""}`} download>
              <Download />
              {t(locale, "Download Excel")}
            </a>
          </Button> : null}
          {manage ? (
            <Button asChild>
              <Link href="/readers/new">{t(locale, "New device")}</Link>
            </Button>
          ) : null}
        </div>
      }
      filters={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterChips
            items={[
              { label: t(locale, "All"), href: href({ purpose: undefined }), active: !query.purpose },
              ...Object.entries(KINDS).map(([value, label]) => ({
                label: t(locale, label),
                href: href({ purpose: value }),
                active: query.purpose === value,
              })),
            ]}
          />
          <div className="flex flex-wrap gap-2">
            <FilterSelect
              name="online"
              query={query}
              locale={locale}
              className="w-40"
              options={[
                { value: "", label: t(locale, "Online or offline") },
                { value: "true", label: t(locale, "Online") },
                { value: "false", label: t(locale, "Offline") },
              ]}
            />
            <FilterSelect
              name="is_active"
              query={query}
              locale={locale}
              className="w-40"
              options={[
                { value: "", label: t(locale, "Active or not") },
                { value: "true", label: t(locale, "Active") },
                { value: "false", label: t(locale, "Inactive") },
              ]}
            />
          </div>
        </div>
      }
      hrefs={data.results.map((device) => `/readers/${device.id}`)}
      rows={data.results.map((device) => [
        device.code,
        show(device.name),
        device.online ? "Online" : "Offline",
        t(locale, KIND_LABEL[String(device.purpose)] ?? String(device.purpose)),
        device.purpose === "ATTENDANCE" ? show(device.building_name) : show(device.location),
        show(device.seller_name),
        show(device.allowed_ip),
        device.is_active ? "Yes" : "No",
        showTime(device.last_seen_at),
      ])}
    />
  );
}
