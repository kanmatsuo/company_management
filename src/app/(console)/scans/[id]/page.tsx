import { redirect } from "next/navigation";
import type { components } from "@/api/schema";
import { Facts } from "@/components/facts";
import { LoadError } from "@/components/no-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { show, showTime } from "@/lib/load-all";
import { loadOne } from "@/lib/page-data";
import { getLocale } from "@/lib/locale";
import { codeLabel } from "@/lib/codes";

type Event = components["schemas"]["RFIDEvent"];

export default async function ScanPage({ params }: { params: Promise<{ id: string }> }) {
  const locale = await getLocale();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) redirect("/scans");
  const loaded = await loadOne<Event>(`/api/v1/rfid/events/${id}/`);
  if (!loaded.value) return <LoadError title="Scan" message={loaded.error ?? "Not found."} />;
  const event = loaded.value;
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{event.uid}</h1>
        <p className="text-muted-foreground text-sm">{showTime(event.event_time)} · {codeLabel(locale, event.result)}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Scan</CardTitle>
        </CardHeader>
        <CardContent>
          <Facts
            items={[
              { label: "Reader", value: event.device_code },
              { label: "Direction", value: codeLabel(locale, (event as { direction?: string }).direction) },
              { label: "Person", value: show(event.developer?.full_name) },
              { label: "Card", value: event.card ? String(event.card) : "—" },
              { label: "Client event", value: show(event.client_event_id) },
              { label: "Received", value: showTime(event.received_at) },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
