import Link from "next/link";
import type { components } from "@/api/schema";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecordList } from "@/components/record-list";
import { canManage, getSession } from "@/lib/current-user";
import { listPath, one, show, showTime } from "@/lib/load-all";
import { loadRecords } from "@/lib/load-records";

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
  const query = await searchParams;
  const session = await getSession();
  const manage = session ? canManage(session.user, ["rfid"]) : false;
  const data = await loadRecords<CardRow>(
    "rfid.view",
    listPath("/api/v1/rfid/cards/?ordering=-created_at", {
      status: one(query.status),
      assigned: one(query.assigned),
    }),
  );
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
  return (
    <RecordList
      title="Cards"
      summary={`${data.count.toLocaleString()} cards`}
      description="RFID cards and who holds them."
      error={data.error}
      empty="No cards yet."
      headers={["UID", "Label", "Holder", "Status", "Reason", "Updated"]}
      extra={manage ? <Button asChild><Link href="/cards/new">New card</Link></Button> : null}
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
