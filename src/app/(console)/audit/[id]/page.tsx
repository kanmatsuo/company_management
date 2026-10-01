import { redirect } from "next/navigation";
import type { components } from "@/api/schema";
import { Facts } from "@/components/facts";
import { LoadError } from "@/components/no-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { show, showTime } from "@/lib/load-all";
import { loadOne } from "@/lib/page-data";

type Entry = components["schemas"]["AuditLog"];

function dump(value: unknown) {
  if (value === null || value === undefined) return "—";
  return JSON.stringify(value, null, 2);
}

export default async function AuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) redirect("/audit");
  const loaded = await loadOne<Entry>(`/api/v1/audit-logs/${id}/`);
  if (!loaded.value) return <LoadError title="Audit event" message={loaded.error ?? "Not found."} />;
  const entry = loaded.value;
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">{show(entry.action)}</h1>
        <p className="text-muted-foreground text-sm">{showTime(entry.created_at)}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{show(entry.entity_type)} {show(entry.entity_id)}</CardTitle>
        </CardHeader>
        <CardContent>
          <Facts
            items={[
              { label: "Who", value: show(entry.actor_email) },
              { label: "IP", value: show(entry.ip_address) },
              { label: "Request", value: show(entry.request_id) },
              { label: "User agent", value: show(entry.user_agent) },
            ]}
          />
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Before</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap break-all font-mono text-xs">{dump(entry.old_values)}</pre>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>After</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap break-all font-mono text-xs">{dump(entry.new_values)}</pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
