import type { components } from "@/api/schema";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecordList } from "@/components/record-list";
import { show, showTime } from "@/lib/load-all";
import { loadRecords } from "@/lib/load-records";

type Entry = components["schemas"]["AuditLog"];

function valueText(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function changed(oldValues: unknown, newValues: unknown) {
  const before = oldValues && typeof oldValues === "object" ? (oldValues as Record<string, unknown>) : {};
  const after = newValues && typeof newValues === "object" ? (newValues as Record<string, unknown>) : {};
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  if (keys.length === 0) return "—";
  return keys.map((key) => `${key}: ${valueText(before[key])} → ${valueText(after[key])}`).join("; ");
}

export default async function AuditPage() {
  const data = await loadRecords<Entry>("audit.view", "/api/v1/audit-logs/?ordering=-created_at");
  if (data.denied) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No access</CardTitle>
          <CardDescription>Your account cannot open the audit log.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  return (
    <RecordList
      title="Audit"
      summary={`${data.count.toLocaleString()} events`}
      description="Who changed what, with the previous and next values."
      error={data.error}
      empty="No audit events yet."
      headers={["When", "Who", "Action", "Record", "Changes"]}
      rows={data.results.map((entry) => [
        showTime(entry.created_at),
        show(entry.actor_email),
        show(entry.action),
        `${show(entry.entity_type)} ${show(entry.entity_id)}`,
        changed(entry.old_values, entry.new_values),
      ])}
    />
  );
}
